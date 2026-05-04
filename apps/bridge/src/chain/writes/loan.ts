import crypto from "node:crypto";

import { BN } from "@coral-xyz/anchor";
import {
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import {
  PublicKey,
  SystemProgram,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  Transaction,
} from "@solana/web3.js";

import { PROGRAM_IDS, decodeAs } from "../decode";
import {
  deriveLoanConfigPda,
  deriveTrdcStatePda,
  deriveVaultPda,
} from "../pdas";
import { loadLoanProgram } from "../program";
import type { BridgeProvider } from "../provider";

/**
 * Loan-lifecycle write builders.
 *
 * `buildConfirmCustody` is real: bundles `confirm_custody` +
 * `disburse_from_vault` into a single transaction signed by the operator
 * (which doubles as both `custodian` and `borrower` in the demo single-
 * keypair setup). Idempotent ATA creation for the borrower keeps the path
 * resilient against demo loans created without pre-funding the borrower
 * side.
 *
 * `buildPayInstallment` / `buildRenew` / `buildRepay` are still
 * placeholder. Those instructions require the `borrower` to sign in
 * production — operator-as-borrower would let any admin pay any
 * borrower's installments, which is fine in a single-key demo of the
 * custody gate but wrong as a default. They light up when the
 * wallet-signed flow lands (Area A item 2 of the spec).
 */

const LOAN_AUTHORITY_SEED = Buffer.from("loan_authority");

export interface LoanWriteResult {
  ok: true;
  txSignature: string;
  loanId: string;
  accounts: Record<string, string>;
  /** Reserved for the future wallet-signed path. Always null today. */
  unsignedTx: null;
  /**
   * True when the result represents a real on-chain confirmation; false
   * when the response is still a hand-crafted placeholder. Lets clients
   * (Laravel admin view, log scrapers) tell at a glance whether the
   * txSignature points to a real cluster tx or a synthetic string.
   */
  executed: boolean;
  /** Present and `true` only on placeholder responses. */
  _placeholder?: boolean;
}

function placeholderSignature(operation: string): string {
  return `placeholder-${operation}-${Date.now()}`;
}

function commonAccounts(loanId: PublicKey): Record<string, string> {
  return {
    loanConfig: deriveLoanConfigPda().toBase58(),
    trdcState: deriveTrdcStatePda(loanId).toBase58(),
  };
}

/**
 * Real implementation: read TRDC state, derive every related account,
 * build a single Solana transaction containing
 *   1) (idempotent) borrower ATA create
 *   2) loan::confirm_custody(doc_hash)
 *   3) loan::disburse_from_vault(loan_amount)
 * and submit it signed by the operator.
 *
 * `doc_hash` is `sha256("custody-doc-" + loanId)` — deterministic, so the
 * same Laravel loan always lands the same on-chain hash. Laravel can pass
 * an explicit doc_hash in a future revision; for the demo the convention
 * is enough.
 *
 * `assetMint` is supplied by the caller (route layer pulls it from
 * config.demoAssetMint when Laravel doesn't override).
 */
export async function buildConfirmCustody(
  provider: BridgeProvider,
  loanId: PublicKey,
  assetMint: PublicKey,
): Promise<LoanWriteResult> {
  const loanProgram = loadLoanProgram(provider);

  const trdcStatePda = deriveTrdcStatePda(loanId);
  const trdcAccount = await provider.connection.getAccountInfo(
    trdcStatePda,
    "confirmed",
  );
  if (!trdcAccount) {
    throw new Error(`trdc_state_not_found: ${trdcStatePda.toBase58()}`);
  }
  // Anchor 0.30 mutates the IDL (clones + camelCases it) inside
  // `new Program(idl)`, so the program-namespace's coder only knows
  // `trdcState` (camelCase) — not `TRDCState`. Decode against the
  // registry's pristine BorshAccountsCoder (built from the original
  // PascalCase IDL in `chain/decode.ts`) instead, so the account-name
  // lookup matches.
  const trdcState = decodeAs<{
    borrower: PublicKey;
    loanAmount: BN;
  }>("trdc", "TRDCState", trdcAccount.data);

  const docHash = crypto
    .createHash("sha256")
    .update("custody-doc-" + loanId.toBase58())
    .digest();

  const loanConfigPda = deriveLoanConfigPda();
  const vaultPda = deriveVaultPda(assetMint);
  const [loanAuthorityPda] = PublicKey.findProgramAddressSync(
    [LOAN_AUTHORITY_SEED],
    loanProgram.programId,
  );
  // The vault PDA is off-curve (program-owned), so the ATA helper has to
  // accept off-curve owners — pass `allowOwnerOffCurve = true`.
  const vaultAta = getAssociatedTokenAddressSync(assetMint, vaultPda, true);
  const borrowerAta = getAssociatedTokenAddressSync(
    assetMint,
    trdcState.borrower,
  );

  const ataIx = createAssociatedTokenAccountIdempotentInstruction(
    provider.operator.publicKey,
    borrowerAta,
    trdcState.borrower,
    assetMint,
  );

  const confirmIx = await loanProgram.methods
    .confirmCustody(Array.from(docHash))
    .accounts({
      trdcState: trdcStatePda,
      loanConfig: loanConfigPda,
      trdcProgram: new PublicKey(PROGRAM_IDS.trdc),
      custodian: provider.operator.publicKey,
    })
    .instruction();

  // `price_feed` is required only when `loan_config.oracle_admin !=
  // Pubkey::default()`. When the oracle is off, any account is accepted;
  // SystemProgram is the convention. When on, the bootstrap script that
  // mints the loan publishes a feed and the route layer would inject the
  // real feed account here. Demo loans created with `bootstrap-real-usdc-
  // vault.ts` keep oracle off, so SystemProgram is sufficient and we keep
  // the contract simple — if a caller hits an oracle-on loan the on-chain
  // ix reverts with a parseable code that the router surfaces back as
  // `{ok:false, error:"InvalidOracle"}`.
  const disburseIx = await loanProgram.methods
    .disburseFromVault(trdcState.loanAmount)
    .accounts({
      trdcState: trdcStatePda,
      loanConfig: loanConfigPda,
      vault: vaultPda,
      assetMint,
      vaultAta,
      borrowerAta,
      loanAuthority: loanAuthorityPda,
      borrower: trdcState.borrower,
      trdcProgram: new PublicKey(PROGRAM_IDS.trdc),
      vaultProgram: new PublicKey(PROGRAM_IDS.vault),
      tokenProgram: TOKEN_PROGRAM_ID,
      instructionsSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
      priceFeed: SystemProgram.programId,
    })
    .instruction();

  const tx = new Transaction().add(ataIx, confirmIx, disburseIx);

  // The operator wallet on the AnchorProvider signs as feePayer. In the
  // demo setup the operator is also `loan_config.custodian` (so confirmIx
  // succeeds) and `trdc_state.borrower` (so disburseIx succeeds), so a
  // single signature covers every `Signer<'info>` the program demands.
  const signature = await provider.anchor.sendAndConfirm(tx, [], {
    commitment: "confirmed",
  });

  return {
    ok: true,
    txSignature: signature,
    loanId: loanId.toBase58(),
    accounts: {
      loanConfig: loanConfigPda.toBase58(),
      trdcState: trdcStatePda.toBase58(),
      vault: vaultPda.toBase58(),
      vaultAta: vaultAta.toBase58(),
      borrowerAta: borrowerAta.toBase58(),
      loanAuthority: loanAuthorityPda.toBase58(),
      borrower: trdcState.borrower.toBase58(),
      assetMint: assetMint.toBase58(),
    },
    unsignedTx: null,
    executed: true,
  };
}

// ---- Placeholder builders (pay / repay / renew). ---------------------
// These routes still answer with deterministic shapes so Laravel can
// integrate the call sites today; the real ix calls land with the
// wallet-signed flow, when we can sign as the borrower instead of as
// the operator.

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
      _amount: amount.toString(),
    },
    unsignedTx: null,
    executed: false,
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
    executed: false,
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
    executed: false,
    _placeholder: true,
  };
}
