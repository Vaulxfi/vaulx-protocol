import { PublicKey, SYSVAR_INSTRUCTIONS_PUBKEY } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { loan as loanFacade } from "@vaulx/anchor-client";

/**
 * Shared account-wiring helpers for the loan program. Used both by the
 * client-side React hooks in `./loan.ts` and by the server-side Solana Pay
 * transaction-request route. Kept framework-agnostic — no "use client" —
 * so it imports cleanly from route handlers.
 */

export const LOAN_PROGRAM_ID = new PublicKey(loanFacade.programId);
export const TRDC_PROGRAM_ID = new PublicKey(
  "26rb68SPyjKmFNwSUmfZA7WRFtsKFheXf5xN8eHeeRWk",
);
export const VAULT_PROGRAM_ID = new PublicKey(
  "GQU6pGwdUAWdhzNDGUU8toVCqxo22mHpFrJeFRE4hpDL",
);

/** loan_authority PDA: seeds = [b"loan_authority"]. */
export function deriveLoanAuthorityPda(): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("loan_authority")],
    LOAN_PROGRAM_ID,
  );
  return pda;
}

/** Vault PDA derived in the vault program: seeds = [b"vault", asset_mint]. */
export function deriveVaultPda(assetMint: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), assetMint.toBuffer()],
    VAULT_PROGRAM_ID,
  );
  return pda;
}

/**
 * TRDCState PDA: seeds = [b"trdc_state", loan_id], derived under the
 * **trdc** program (not loan). The TRDCState account is owned by the trdc
 * program; only PDAs derived under TRDC_PROGRAM_ID resolve to the canonical
 * on-chain address.
 *
 * Pre-`b12f381` this used `LOAN_PROGRAM_ID` and was a latent bug masked by
 * downstream flows that only ever read `trdcState.toBase58()` for display
 * (never round-tripped against on-chain state).
 */
export function deriveTrdcStatePda(loanId: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("trdc_state"), loanId.toBuffer()],
    TRDC_PROGRAM_ID,
  );
  return pda;
}

/** Singleton loan_config PDA: seeds = [b"loan_config"]. */
export function deriveLoanConfigPda(): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("loan_config")],
    LOAN_PROGRAM_ID,
  );
  return pda;
}

/**
 * Canonical PriceFeed PDA: seeds = [b"price_feed", ref_bytes], owned by the
 * loan program. Used both client-side (to pass to disburse_from_vault when
 * the oracle is on) and server-side (to publish a fresh feed via the
 * operator-keypair signed `/api/demo/publish-price` route).
 */
export function derivePriceFeedPda(refBytes: Uint8Array): PublicKey {
  if (refBytes.length !== 32) {
    throw new Error("ref_bytes must be exactly 32 bytes");
  }
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("price_feed"), Buffer.from(refBytes)],
    LOAN_PROGRAM_ID,
  );
  return pda;
}

/**
 * The common account set for `pay_installment`, `repay_ccb`, and `renew_ccb`
 * — they happen to share an identical list. Derive once; reuse everywhere.
 */
export interface LoanIxAccounts {
  trdcState: PublicKey;
  vault: PublicKey;
  assetMint: PublicKey;
  vaultAta: PublicKey;
  borrowerAta: PublicKey;
  borrower: PublicKey;
  loanAuthority: PublicKey;
  trdcProgram: PublicKey;
  vaultProgram: PublicKey;
  tokenProgram: PublicKey;
  instructionsSysvar: PublicKey;
}

export function buildLoanIxAccounts(args: {
  trdcPda: PublicKey;
  assetMint: PublicKey;
  borrower: PublicKey;
}): LoanIxAccounts {
  const vaultPda = deriveVaultPda(args.assetMint);
  const vaultAta = getAssociatedTokenAddressSync(args.assetMint, vaultPda, true);
  const borrowerAta = getAssociatedTokenAddressSync(
    args.assetMint,
    args.borrower,
  );
  return {
    trdcState: args.trdcPda,
    vault: vaultPda,
    assetMint: args.assetMint,
    vaultAta,
    borrowerAta,
    borrower: args.borrower,
    loanAuthority: deriveLoanAuthorityPda(),
    trdcProgram: TRDC_PROGRAM_ID,
    vaultProgram: VAULT_PROGRAM_ID,
    tokenProgram: TOKEN_PROGRAM_ID,
    instructionsSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
  };
}
