import { PublicKey } from "@solana/web3.js";

import { PROGRAM_IDS } from "./decode";

/**
 * PDA derivation helpers for the four Vaulx programs. Mirrored from
 * `apps/web/src/lib/chain/loan-accounts.ts` so the bridge produces the same
 * addresses the on-chain programs expect — drift here would yield "PDA
 * mismatch" errors at ix-time that are tedious to debug.
 *
 * Kept in a dedicated module (rather than inlined per route) so future
 * write endpoints, the Laravel-side mirror, and tests all share one source
 * of truth.
 */

const LOAN_PROGRAM = new PublicKey(PROGRAM_IDS.loan);
const VAULT_PROGRAM = new PublicKey(PROGRAM_IDS.vault);
const TRDC_PROGRAM = new PublicKey(PROGRAM_IDS.trdc);

/** Singleton loan_config PDA: seeds = [b"loan_config"]. */
export function deriveLoanConfigPda(): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("loan_config")],
    LOAN_PROGRAM,
  );
  return pda;
}

/** Vault PDA: seeds = [b"vault", asset_mint]. One vault per asset mint. */
export function deriveVaultPda(assetMint: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), assetMint.toBuffer()],
    VAULT_PROGRAM,
  );
  return pda;
}

/**
 * TRDCState PDA: seeds = [b"trdc_state", loan_id], owned by the **trdc**
 * program (not loan). One TRDCState per loan_id. Note: `apps/web` had a
 * latent bug here (used the loan program id), called out in
 * loan-accounts.ts; we use the correct trdc program id from day one.
 */
export function deriveTrdcStatePda(loanId: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("trdc_state"), loanId.toBuffer()],
    TRDC_PROGRAM,
  );
  return pda;
}
