import { PublicKey } from "@solana/web3.js";

import { deriveLoanConfigPda, deriveTrdcStatePda } from "../pdas";

/**
 * Loan-lifecycle write builders.
 *
 * **Status: placeholder.** Until the atomic-confirm-custody PR lands in
 * `programs/loan/`, the bridge can't construct the actual transactions —
 * the new `confirm_custody` accounts shape is defined there, and the IDL
 * shipped with `@vaulx/idls` still reflects the pre-atomic two-step. So
 * each builder returns a `_placeholder: true` response with whatever PDAs
 * we can already derive from `chain/pdas.ts`, leaving the on-chain ix +
 * signature for the post-merge follow-up.
 *
 * The contract that **does** stay stable across this transition:
 *   - The four functions exported here.
 *   - The `LoanWriteResult` shape returned to the route layer.
 *   - The HTTP routes in `http/routes/chain-loan-writes.ts`.
 *   - The Laravel-side methods in `site/app/Services/SolanaBridge.php`,
 *     which already call this exact set of endpoints with this body shape.
 *
 * After atomic merges, swap each builder's body for the real
 * `program.methods.<ix>(...).accounts({...}).rpc()` call (using the
 * `AnchorProvider` already on `BridgeProvider`), drop the `_placeholder`
 * flag from the response, and the Laravel callers don't have to change.
 *
 * Reserved field `unsignedTx: null` is the future hook for wallet-signed
 * flows (Area A item 2 of the spec — "operator-only signing now with
 * unsignedTx field reserved"). Keeping it in the placeholder so consumers
 * can already read it as `null` instead of seeing the field appear later.
 */

export interface LoanWriteResult {
  ok: true;
  txSignature: string;
  loanId: string;
  accounts: Record<string, string>;
  /** Reserved for the future wallet-signed path. Always null today. */
  unsignedTx: null;
  /** Drop after atomic merge — flags responses as not yet on-chain. */
  _placeholder: true;
}

function placeholderSignature(operation: string): string {
  return `placeholder-${operation}-${Date.now()}`;
}

/**
 * Common accounts every loan-lifecycle ix needs: the singleton
 * `loan_config` and the per-loan `trdc_state`. Other accounts (vault,
 * asset_mint, ATAs, loan_authority) are ix-specific and will be filled
 * in by the post-atomic implementation, which can read `trdc_state`
 * to look up `asset_mint` etc.
 */
function commonAccounts(loanId: PublicKey): Record<string, string> {
  return {
    loanConfig: deriveLoanConfigPda().toBase58(),
    trdcState: deriveTrdcStatePda(loanId).toBase58(),
  };
}

export function buildConfirmCustody(loanId: PublicKey): LoanWriteResult {
  return {
    ok: true,
    txSignature: placeholderSignature("confirm-custody"),
    loanId: loanId.toBase58(),
    accounts: commonAccounts(loanId),
    unsignedTx: null,
    _placeholder: true,
  };
}

export function buildPayInstallment(
  loanId: PublicKey,
  amount: bigint,
): LoanWriteResult {
  return {
    ok: true,
    txSignature: placeholderSignature("pay-installment"),
    loanId: loanId.toBase58(),
    accounts: {
      ...commonAccounts(loanId),
      // Echo the amount in the accounts payload for the placeholder so
      // tests + Laravel can verify it round-tripped — the real ix will
      // pass it as ix data, not an account, but reading it back here is
      // the cheapest way to confirm parsing for now.
      _amount: amount.toString(),
    },
    unsignedTx: null,
    _placeholder: true,
  };
}

export function buildRenew(
  loanId: PublicKey,
  newTermDays: number,
): LoanWriteResult {
  return {
    ok: true,
    txSignature: placeholderSignature("renew"),
    loanId: loanId.toBase58(),
    accounts: {
      ...commonAccounts(loanId),
      _newTermDays: newTermDays.toString(),
    },
    unsignedTx: null,
    _placeholder: true,
  };
}

export function buildRepay(loanId: PublicKey): LoanWriteResult {
  return {
    ok: true,
    txSignature: placeholderSignature("repay"),
    loanId: loanId.toBase58(),
    accounts: commonAccounts(loanId),
    unsignedTx: null,
    _placeholder: true,
  };
}
