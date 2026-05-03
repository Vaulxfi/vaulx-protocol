import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";

import { createChainLoanWritesRouter } from "../http/routes/chain-loan-writes";

/**
 * These tests cover input validation + placeholder response shape only.
 * HMAC is verified separately in `hmac.test.ts`; mounting the writes
 * router directly on a bare Express app keeps assertions focused on the
 * route logic and avoids re-exercising the auth middleware in every
 * happy-path case.
 *
 * `LOAN_ID` is the Solana system program address — any valid base58
 * 32-byte pubkey works for the placeholder, since we don't hit the chain.
 */
const LOAN_ID = "11111111111111111111111111111111";

function makeApp(): express.Express {
  const app = express();
  app.use(express.json());
  app.use(createChainLoanWritesRouter());
  return app;
}

function expectPlaceholderShape(body: Record<string, unknown>): void {
  expect(body.ok).toBe(true);
  expect(body._placeholder).toBe(true);
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
  it("returns placeholder result for a valid loanId", async () => {
    const r = await request(makeApp())
      .post("/chain/loan/confirm-custody")
      .send({ loanId: LOAN_ID });
    expect(r.status).toBe(200);
    expectPlaceholderShape(r.body);
    expect(r.body.loanId).toBe(LOAN_ID);
    expect(r.body.txSignature).toMatch(/^placeholder-confirm-custody-/);
  });

  it("rejects missing loanId with 400 missing_loan_id", async () => {
    const r = await request(makeApp())
      .post("/chain/loan/confirm-custody")
      .send({});
    expect(r.status).toBe(400);
    expect(r.body).toEqual({ ok: false, error: "missing_loan_id" });
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
    // 10_000_000_000_000_000 is past Number.MAX_SAFE_INTEGER — string form
    // is the only way Laravel can ship a u64 atom count beyond ~9 quadrillion.
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
      .send({ loanId: LOAN_ID, amount: 9_007_199_254_740_993 }); // > MAX_SAFE
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
      .post("/chain/loan/confirm-custody")
      .send({ loanId: LOAN_ID });
    const accounts = r.body.accounts as Record<string, string>;
    // Base58 alphabet — no 0, O, I, l. 32-byte pubkey base58-encodes to
    // 32-44 chars. Just sanity-check the regex doesn't slip in JSON-y junk.
    expect(accounts.loanConfig).toMatch(/^[1-9A-HJ-NP-Za-km-z]+$/);
    expect(accounts.trdcState).toMatch(/^[1-9A-HJ-NP-Za-km-z]+$/);
  });

  it("keeps unsignedTx reserved as null until the wallet-signed path lands", async () => {
    const r = await request(makeApp())
      .post("/chain/loan/repay")
      .send({ loanId: LOAN_ID });
    expect(r.body.unsignedTx).toBeNull();
  });
});
