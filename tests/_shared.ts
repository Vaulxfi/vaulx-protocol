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

export async function ensureLoanConfig(
  loanProgram: anchor.Program<any>,
  provider: anchor.AnchorProvider,
): Promise<{ loanConfigPda: PublicKey; custodian: Keypair }> {
  const [loanConfigPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("loan_config")],
    loanProgram.programId,
  );

  const existing = await loanProgram.account.loanConfig.fetchNullable(loanConfigPda);
  if (!existing) {
    await loanProgram.methods
      .initializeLoanConfig(sharedCustodian.publicKey)
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
