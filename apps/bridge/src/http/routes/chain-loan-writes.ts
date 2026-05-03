import { Router, type Request, type Response } from "express";
import { PublicKey } from "@solana/web3.js";

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
 * `SolanaBridge.php` methods 1:1 (confirm-custody, pay-installment, renew,
 * repay), so the entire write surface ships behind one PR and Laravel
 * doesn't need to change as the bridge graduates from placeholder
 * responses to real on-chain ix.
 *
 * Body validation is hand-rolled — the bridge has no zod, and the rules
 * are simple enough (one or two fields per route, all primitive). We
 * reject early with HTTP 400 + a stable error code so Laravel surfaces
 * meaningful messages instead of falling into the generic catch.
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
  // Accept either a JSON number or a numeric string. Atom amounts can
  // exceed 2^53 (u64), so callers that care should send a string —
  // numbers are accepted for ergonomic Laravel calls but we re-validate.
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

export function createChainLoanWritesRouter(): Router {
  const router = Router();

  router.post(
    "/chain/loan/confirm-custody",
    (req: Request, res: Response): void => {
      const body = (req.body ?? {}) as { loanId?: unknown };
      const parsed = parseLoanId(body.loanId);
      if (!parsed.ok) {
        sendError(res, parsed.status, parsed.error);
        return;
      }
      sendResult(res, buildConfirmCustody(parsed.loanId));
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
