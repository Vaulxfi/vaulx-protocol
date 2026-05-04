import { Router, type Request, type Response } from "express";
import { PublicKey } from "@solana/web3.js";

import type { BridgeProvider } from "../../chain/provider";
import {
  buildConfirmCustody,
  buildPayInstallment,
  buildRenew,
  buildRepay,
  type LoanWriteResult,
} from "../../chain/writes/loan";

/**
 * Loan-lifecycle write endpoints — the protocol-side counterparts to the
 * typed reads in `chain-typed.ts`. Routes match the Laravel-side
 * `SolanaBridge.php` methods 1:1 (confirm-custody, pay-installment,
 * renew, repay).
 *
 * `/chain/loan/confirm-custody` is real — the bridge bundles
 * `confirm_custody` + `disburse_from_vault` into a single transaction and
 * returns the signature. The other three are still placeholder until the
 * wallet-signed flow can sign as the borrower (Area A item 2).
 *
 * Body validation is hand-rolled — the bridge has no zod, and the rules
 * are simple enough (one or two fields per route, all primitive). We
 * reject early with HTTP 400 + a stable error code so Laravel surfaces
 * meaningful messages instead of falling into the generic catch.
 *
 * `RouterDeps` lets unit tests substitute a mock confirmCustody builder
 * without standing up a Solana validator. The default wires straight
 * through to the real on-chain implementation in `writes/loan.ts`.
 */

interface ParsedLoanIdOk {
  ok: true;
  loanId: PublicKey;
}
interface ParsedLoanIdErr {
  ok: false;
  status: number;
  error: string;
}

function parseLoanId(raw: unknown): ParsedLoanIdOk | ParsedLoanIdErr {
  if (typeof raw !== "string" || raw.length === 0) {
    return { ok: false, status: 400, error: "missing_loan_id" };
  }
  try {
    return { ok: true, loanId: new PublicKey(raw) };
  } catch {
    return { ok: false, status: 400, error: "invalid_loan_id" };
  }
}

function parsePositiveInt(
  raw: unknown,
  fieldErrCode: string,
): { ok: true; value: number } | ParsedLoanIdErr {
  if (typeof raw !== "number" || !Number.isFinite(raw) || raw <= 0) {
    return { ok: false, status: 400, error: fieldErrCode };
  }
  if (!Number.isSafeInteger(raw)) {
    return { ok: false, status: 400, error: fieldErrCode };
  }
  return { ok: true, value: raw };
}

function parsePositiveBigInt(
  raw: unknown,
  fieldErrCode: string,
):
  | { ok: true; value: bigint }
  | ParsedLoanIdErr {
  if (typeof raw === "number") {
    if (!Number.isFinite(raw) || raw <= 0 || !Number.isSafeInteger(raw)) {
      return { ok: false, status: 400, error: fieldErrCode };
    }
    return { ok: true, value: BigInt(raw) };
  }
  if (typeof raw === "string" && /^[1-9]\d*$/.test(raw)) {
    return { ok: true, value: BigInt(raw) };
  }
  return { ok: false, status: 400, error: fieldErrCode };
}

function sendResult(res: Response, result: LoanWriteResult): void {
  res.json(result);
}

function sendError(res: Response, status: number, error: string): void {
  res.status(status).json({ ok: false, error });
}

/**
 * Translate the unstructured rejections we get out of Anchor / Solana
 * (timeout, simulation revert, RPC errors, etc.) into a stable wire
 * shape `{ok:false, error, details}` Laravel can pattern-match against.
 *
 * `details` is a best-effort string — useful in logs but not contract.
 * The `error` code is the bit callers should switch on; we use Anchor's
 * `error.error.errorCode.code` when available (e.g. "InvalidOracle"),
 * fall back to a top-level `error.message`-derived slug otherwise.
 */
function normalizeOnchainError(err: unknown): { error: string; details: string } {
  // Anchor wraps program errors in an AnchorError that exposes an
  // `error.errorCode.code` string straight from the IDL.
  const e = err as {
    error?: { errorCode?: { code?: string } };
    message?: string;
    name?: string;
  };
  const anchorCode = e?.error?.errorCode?.code;
  if (typeof anchorCode === "string" && anchorCode.length > 0) {
    return { error: anchorCode, details: e.message ?? "" };
  }
  const msg = e?.message ?? String(err);
  // Common cases worth their own stable slugs so Laravel can surface
  // demo-specific guidance.
  if (msg.includes("trdc_state_not_found")) {
    return { error: "trdc_state_not_found", details: msg };
  }
  if (/insufficient.+funds|TokenInsufficientFunds/i.test(msg)) {
    return { error: "insufficient_vault_balance", details: msg };
  }
  if (/UnauthorizedCustodian/i.test(msg)) {
    return { error: "unauthorized_custodian", details: msg };
  }
  if (/blockhash|expired/i.test(msg)) {
    return { error: "tx_expired", details: msg };
  }
  return { error: "onchain_error", details: msg };
}

export interface LoanWritesRouterDeps {
  /**
   * Override to stub the real on-chain confirm-custody call in tests.
   * Defaults to the real implementation; production never overrides.
   */
  confirmCustody?: typeof buildConfirmCustody;
}

export function createChainLoanWritesRouter(
  provider: BridgeProvider,
  defaultAssetMint: PublicKey,
  deps: LoanWritesRouterDeps = {},
): Router {
  const router = Router();
  const confirmCustodyImpl = deps.confirmCustody ?? buildConfirmCustody;

  router.post(
    "/chain/loan/confirm-custody",
    async (req: Request, res: Response): Promise<void> => {
      const body = (req.body ?? {}) as {
        loanId?: unknown;
        assetMint?: unknown;
      };
      const parsed = parseLoanId(body.loanId);
      if (!parsed.ok) {
        sendError(res, parsed.status, parsed.error);
        return;
      }
      // Optional override; Laravel doesn't pass this today, so 99% of the
      // time we fall through to `defaultAssetMint` (config.demoAssetMint).
      let assetMint = defaultAssetMint;
      if (typeof body.assetMint === "string" && body.assetMint.length > 0) {
        try {
          assetMint = new PublicKey(body.assetMint);
        } catch {
          sendError(res, 400, "invalid_asset_mint");
          return;
        }
      }

      try {
        const result = await confirmCustodyImpl(provider, parsed.loanId, assetMint);
        sendResult(res, result);
      } catch (err) {
        const { error, details } = normalizeOnchainError(err);
        // 422 reads as "request was well-formed but the on-chain ix
        // refused" — distinguishes from 400 (caller's fault) and 500
        // (bridge's fault).
        res.status(422).json({ ok: false, error, details });
      }
    },
  );

  router.post(
    "/chain/loan/pay-installment",
    (req: Request, res: Response): void => {
      const body = (req.body ?? {}) as { loanId?: unknown; amount?: unknown };
      const loanId = parseLoanId(body.loanId);
      if (!loanId.ok) {
        sendError(res, loanId.status, loanId.error);
        return;
      }
      const amount = parsePositiveBigInt(body.amount, "invalid_amount");
      if (!amount.ok) {
        sendError(res, amount.status, amount.error);
        return;
      }
      sendResult(res, buildPayInstallment(loanId.loanId, amount.value));
    },
  );

  router.post("/chain/loan/renew", (req: Request, res: Response): void => {
    const body = (req.body ?? {}) as {
      loanId?: unknown;
      newTermDays?: unknown;
    };
    const loanId = parseLoanId(body.loanId);
    if (!loanId.ok) {
      sendError(res, loanId.status, loanId.error);
      return;
    }
    const term = parsePositiveInt(body.newTermDays, "invalid_term_days");
    if (!term.ok) {
      sendError(res, term.status, term.error);
      return;
    }
    sendResult(res, buildRenew(loanId.loanId, term.value));
  });

  router.post("/chain/loan/repay", (req: Request, res: Response): void => {
    const body = (req.body ?? {}) as { loanId?: unknown };
    const parsed = parseLoanId(body.loanId);
    if (!parsed.ok) {
      sendError(res, parsed.status, parsed.error);
      return;
    }
    sendResult(res, buildRepay(parsed.loanId));
  });

  return router;
}
