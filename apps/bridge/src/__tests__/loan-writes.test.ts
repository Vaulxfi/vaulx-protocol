import express from "express";
import { PublicKey } from "@solana/web3.js";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";

import type { BridgeProvider } from "../chain/provider";
import type { LoanWriteResult } from "../chain/writes/loan";
import { createChainLoanWritesRouter } from "../http/routes/chain-loan-writes";

/**
 * These tests cover input validation + response shape.
 *
 * - Confirm-custody is the only route with a real on-chain implementation,
 *   so its happy-path test injects a stub `confirmCustody` builder via the
 *   router's deps. That keeps the unit test independent of a Solana
 *   validator while still exercising the route → builder → response path.
 *   Failure-path tests verify error normalization (the route catches
 *   throws and projects them through `normalizeOnchainError`).
 *
 * - Pay/repay/renew remain placeholder, so they need no provider work —
 *   the router consults them synchronously from `writes/loan.ts`.
 *
 * HMAC is verified separately in `hmac.test.ts`. Mounting the writes
 * router directly on a bare Express app keeps assertions focused on the
 * route logic and avoids re-exercising the auth middleware.
 *
 * `LOAN_ID` is the Solana system program address — any valid base58
 * 32-byte pubkey works for tests where we don't hit the chain.
 */
const LOAN_ID = "11111111111111111111111111111111";
const ASSET_MINT = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";

// Bare provider stub. Tests that go through the real builder don't get
// here (we override via deps); tests that exercise placeholder routes
// never touch the provider at all.
const stubProvider = {
  connection: {} as never,
  operator: {} as never,
  anchor: {} as never,
} as unknown as BridgeProvider;

interface AppOptions {
  confirmCustody?: (
    provider: BridgeProvider,
    loanId: PublicKey,
    assetMint: PublicKey,
  ) => Promise<LoanWriteResult>;
}

function makeApp(opts: AppOptions = {}): express.Express {
  const app = express();
  app.use(express.json());
  app.use(
    createChainLoanWritesRouter(
      stubProvider,
      new PublicKey(ASSET_MINT),
      opts.confirmCustody ? { confirmCustody: opts.confirmCustody } : {},
    ),
  );
  return app;
}

function expectPlaceholderShape(body: Record<string, unknown>): void {
  expect(body.ok).toBe(true);
  expect(body._placeholder).toBe(true);
  expect(body.executed).toBe(false);
  expect(body.unsignedTx).toBeNull();
  expect(typeof body.txSignature).toBe("string");
  expect(body.txSignature as string).toMatch(/^placeholder-/);
  const accounts = body.accounts as Record<string, string>;
  expect(typeof accounts.loanConfig).toBe("string");
  expect(typeof accounts.trdcState).toBe("string");
  expect(accounts.loanConfig.length).toBeGreaterThan(20);
  expect(accounts.trdcState.length).toBeGreaterThan(20);
}

describe("POST /chain/loan/confirm-custody", () => {
  it("invokes the confirmCustody builder with the parsed loanId + default mint", async () => {
    const fakeResult: LoanWriteResult = {
      ok: true,
      txSignature: "REAL_SIG_BASE58",
      loanId: LOAN_ID,
      accounts: { loanConfig: "Lcfg", trdcState: "Trdc", vault: "Vlt" },
      unsignedTx: null,
      executed: true,
    };
    const spy = vi.fn<
      [BridgeProvider, PublicKey, PublicKey],
      Promise<LoanWriteResult>
    >(async () => fakeResult);

    const r = await request(makeApp({ confirmCustody: spy }))
      .post("/chain/loan/confirm-custody")
      .send({ loanId: LOAN_ID });

    expect(r.status).toBe(200);
    expect(r.body).toEqual(fakeResult);
    expect(spy).toHaveBeenCalledTimes(1);
    const call = spy.mock.calls[0];
    expect(call[1].toBase58()).toBe(LOAN_ID);
    expect(call[2].toBase58()).toBe(ASSET_MINT);
  });

  it("normalizes a thrown anchor error to 422 ok:false with the IDL code", async () => {
    const spy = vi.fn(async () => {
      const err = new Error("AnchorError caused by ...") as Error & {
        error?: { errorCode?: { code?: string } };
      };
      err.error = { errorCode: { code: "UnauthorizedCustodian" } };
      throw err;
    });

    const r = await request(makeApp({ confirmCustody: spy }))
      .post("/chain/loan/confirm-custody")
      .send({ loanId: LOAN_ID });

    expect(r.status).toBe(422);
    expect(r.body.ok).toBe(false);
    expect(r.body.error).toBe("UnauthorizedCustodian");
    expect(typeof r.body.details).toBe("string");
  });

  it("maps trdc_state_not_found errors to a stable slug", async () => {
    const spy = vi.fn(async () => {
      throw new Error("trdc_state_not_found: 5Th...");
    });
    const r = await request(makeApp({ confirmCustody: spy }))
      .post("/chain/loan/confirm-custody")
      .send({ loanId: LOAN_ID });
    expect(r.status).toBe(422);
    expect(r.body.error).toBe("trdc_state_not_found");
  });

  it("maps insufficient-balance errors to a stable slug", async () => {
    const spy = vi.fn(async () => {
      throw new Error("Transaction simulation failed: TokenInsufficientFunds");
    });
    const r = await request(makeApp({ confirmCustody: spy }))
      .post("/chain/loan/confirm-custody")
      .send({ loanId: LOAN_ID });
    expect(r.status).toBe(422);
    expect(r.body.error).toBe("insufficient_vault_balance");
  });

  it("rejects missing loanId with 400 missing_loan_id (without invoking the builder)", async () => {
    const spy = vi.fn();
    const r = await request(makeApp({ confirmCustody: spy }))
      .post("/chain/loan/confirm-custody")
      .send({});
    expect(r.status).toBe(400);
    expect(r.body).toEqual({ ok: false, error: "missing_loan_id" });
    expect(spy).not.toHaveBeenCalled();
  });

  it("rejects malformed loanId with 400 invalid_loan_id", async () => {
    const r = await request(makeApp())
      .post("/chain/loan/confirm-custody")
      .send({ loanId: "not-a-pubkey" });
    expect(r.status).toBe(400);
    expect(r.body).toEqual({ ok: false, error: "invalid_loan_id" });
  });

  it("rejects non-string loanId with 400 missing_loan_id", async () => {
    const r = await request(makeApp())
      .post("/chain/loan/confirm-custody")
      .send({ loanId: 12345 });
    expect(r.status).toBe(400);
    expect(r.body.error).toBe("missing_loan_id");
  });

  it("accepts an explicit assetMint override and forwards it", async () => {
    const otherMint = "EG81H3a3WfSHYZABPiyPtZHzQRjPc2Z3A4T8JCqvWQMj";
    const spy = vi.fn<
      [BridgeProvider, PublicKey, PublicKey],
      Promise<LoanWriteResult>
    >(async (_p, _l, m) => ({
      ok: true,
      txSignature: "X",
      loanId: LOAN_ID,
      accounts: { loanConfig: "L", trdcState: "T", assetMint: m.toBase58() },
      unsignedTx: null,
      executed: true,
    }));
    const r = await request(makeApp({ confirmCustody: spy }))
      .post("/chain/loan/confirm-custody")
      .send({ loanId: LOAN_ID, assetMint: otherMint });
    expect(r.status).toBe(200);
    expect(spy.mock.calls[0][2].toBase58()).toBe(otherMint);
  });

  it("rejects a malformed assetMint with 400 invalid_asset_mint", async () => {
    const r = await request(makeApp())
      .post("/chain/loan/confirm-custody")
      .send({ loanId: LOAN_ID, assetMint: "not-a-mint" });
    expect(r.status).toBe(400);
    expect(r.body.error).toBe("invalid_asset_mint");
  });
});

describe("POST /chain/loan/pay-installment", () => {
  it("accepts a JSON number amount within safe-integer range", async () => {
    const r = await request(makeApp())
      .post("/chain/loan/pay-installment")
      .send({ loanId: LOAN_ID, amount: 1_000_000 });
    expect(r.status).toBe(200);
    expectPlaceholderShape(r.body);
    expect(r.body.txSignature).toMatch(/^placeholder-pay-installment-/);
    expect(r.body.accounts._amount).toBe("1000000");
  });

  it("accepts a numeric string amount (for amounts that exceed 2^53)", async () => {
    const r = await request(makeApp())
      .post("/chain/loan/pay-installment")
      .send({ loanId: LOAN_ID, amount: "10000000000000000" });
    expect(r.status).toBe(200);
    expect(r.body.accounts._amount).toBe("10000000000000000");
  });

  it("rejects a missing amount with 400 invalid_amount", async () => {
    const r = await request(makeApp())
      .post("/chain/loan/pay-installment")
      .send({ loanId: LOAN_ID });
    expect(r.status).toBe(400);
    expect(r.body).toEqual({ ok: false, error: "invalid_amount" });
  });

  it("rejects a non-positive amount", async () => {
    const r = await request(makeApp())
      .post("/chain/loan/pay-installment")
      .send({ loanId: LOAN_ID, amount: 0 });
    expect(r.status).toBe(400);
    expect(r.body.error).toBe("invalid_amount");
  });

  it("rejects an unsafe-integer JSON number", async () => {
    const r = await request(makeApp())
      .post("/chain/loan/pay-installment")
      .send({ loanId: LOAN_ID, amount: 9_007_199_254_740_993 });
    expect(r.status).toBe(400);
    expect(r.body.error).toBe("invalid_amount");
  });

  it("rejects a non-numeric string amount", async () => {
    const r = await request(makeApp())
      .post("/chain/loan/pay-installment")
      .send({ loanId: LOAN_ID, amount: "1.5" });
    expect(r.status).toBe(400);
    expect(r.body.error).toBe("invalid_amount");
  });

  it("validates loanId before amount", async () => {
    const r = await request(makeApp())
      .post("/chain/loan/pay-installment")
      .send({ loanId: "bad", amount: 100 });
    expect(r.status).toBe(400);
    expect(r.body.error).toBe("invalid_loan_id");
  });
});

describe("POST /chain/loan/renew", () => {
  it("returns placeholder result with newTermDays echoed in accounts", async () => {
    const r = await request(makeApp())
      .post("/chain/loan/renew")
      .send({ loanId: LOAN_ID, newTermDays: 90 });
    expect(r.status).toBe(200);
    expectPlaceholderShape(r.body);
    expect(r.body.txSignature).toMatch(/^placeholder-renew-/);
    expect(r.body.accounts._newTermDays).toBe("90");
  });

  it("rejects a missing newTermDays with 400 invalid_term_days", async () => {
    const r = await request(makeApp())
      .post("/chain/loan/renew")
      .send({ loanId: LOAN_ID });
    expect(r.status).toBe(400);
    expect(r.body).toEqual({ ok: false, error: "invalid_term_days" });
  });

  it("rejects a non-integer newTermDays", async () => {
    const r = await request(makeApp())
      .post("/chain/loan/renew")
      .send({ loanId: LOAN_ID, newTermDays: 30.5 });
    expect(r.status).toBe(400);
    expect(r.body.error).toBe("invalid_term_days");
  });

  it("rejects a non-positive newTermDays", async () => {
    const r = await request(makeApp())
      .post("/chain/loan/renew")
      .send({ loanId: LOAN_ID, newTermDays: 0 });
    expect(r.status).toBe(400);
    expect(r.body.error).toBe("invalid_term_days");
  });
});

describe("POST /chain/loan/repay", () => {
  it("returns placeholder result for a valid loanId", async () => {
    const r = await request(makeApp())
      .post("/chain/loan/repay")
      .send({ loanId: LOAN_ID });
    expect(r.status).toBe(200);
    expectPlaceholderShape(r.body);
    expect(r.body.txSignature).toMatch(/^placeholder-repay-/);
  });

  it("rejects a missing loanId with 400 missing_loan_id", async () => {
    const r = await request(makeApp()).post("/chain/loan/repay").send({});
    expect(r.status).toBe(400);
    expect(r.body.error).toBe("missing_loan_id");
  });
});

describe("placeholder response shape", () => {
  it("exposes loanConfig + trdcState PDAs as base58 strings", async () => {
    const r = await request(makeApp())
      .post("/chain/loan/repay")
      .send({ loanId: LOAN_ID });
    const accounts = r.body.accounts as Record<string, string>;
    expect(accounts.loanConfig).toMatch(/^[1-9A-HJ-NP-Za-km-z]+$/);
    expect(accounts.trdcState).toMatch(/^[1-9A-HJ-NP-Za-km-z]+$/);
  });

  it("keeps unsignedTx reserved as null on placeholder responses", async () => {
    const r = await request(makeApp())
      .post("/chain/loan/repay")
      .send({ loanId: LOAN_ID });
    expect(r.body.unsignedTx).toBeNull();
    expect(r.body.executed).toBe(false);
  });
});
