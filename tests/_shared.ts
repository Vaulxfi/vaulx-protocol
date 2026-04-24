import * as anchor from "@coral-xyz/anchor";
import { Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram } from "@solana/web3.js";

// A single custodian keypair shared across spec files. Tests may call
// `ensureLoanConfig(...)` idempotently; the first call wins and subsequent
// callers re-use the same custodian — letting confirm_custody succeed across
// tests that run in the same anchor-test session.
//
// Generated once per process; the loan_config PDA persists across calls
// within a single `anchor test` run.
export const sharedCustodian = Keypair.generate();

/**
 * Idempotently init loan_config. Defaults to the Civic gate DISABLED
 * (`civic_network = PublicKey.default`). Pass an explicit `civicNetwork` to
 * turn the gate on for a particular test. First-writer-wins, like the previous
 * no-arg flavour.
 */
export async function ensureLoanConfig(
  loanProgram: anchor.Program<any>,
  provider: anchor.AnchorProvider,
  civicNetwork: PublicKey = PublicKey.default,
): Promise<{ loanConfigPda: PublicKey; custodian: Keypair }> {
  const [loanConfigPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("loan_config")],
    loanProgram.programId,
  );

  const existing = await loanProgram.account.loanConfig.fetchNullable(loanConfigPda);
  if (!existing) {
    await loanProgram.methods
      .initializeLoanConfig(sharedCustodian.publicKey, civicNetwork)
      .accounts({
        loanConfig: loanConfigPda,
        admin: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  } else if (
    existing.custodian.toBase58() !== sharedCustodian.publicKey.toBase58()
  ) {
    throw new Error(
      `loan_config already initialised with a different custodian ` +
        `(${existing.custodian.toBase58()}). Ensure all tests use ` +
        `sharedCustodian from tests/_shared.ts.`,
    );
  }

  const sig = await provider.connection.requestAirdrop(
    sharedCustodian.publicKey,
    2 * LAMPORTS_PER_SOL,
  );
  await provider.connection.confirmTransaction(sig, "confirmed");

  return { loanConfigPda, custodian: sharedCustodian };
}

/**
 * Idempotently init vault_config. Defaults to the Civic gate DISABLED.
 * First-writer-wins — a later call with a non-default network is a no-op if
 * the config already exists.
 */
export async function ensureVaultConfig(
  vaultProgram: anchor.Program<any>,
  provider: anchor.AnchorProvider,
  civicNetwork: PublicKey = PublicKey.default,
): Promise<{ vaultConfigPda: PublicKey }> {
  const [vaultConfigPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault_config")],
    vaultProgram.programId,
  );
  const existing = await vaultProgram.account.vaultConfig.fetchNullable(
    vaultConfigPda,
  );
  if (!existing) {
    await vaultProgram.methods
      .initializeVaultConfig(civicNetwork)
      .accounts({
        vaultConfig: vaultConfigPda,
        admin: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  }
  return { vaultConfigPda };
}

/** Vault-config PDA derivation helper (no RPC). */
export function vaultConfigPda(vaultProgramId: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vault_config")],
    vaultProgramId,
  )[0];
}
