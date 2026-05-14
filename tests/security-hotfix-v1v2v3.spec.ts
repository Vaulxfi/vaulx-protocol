import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import { expect } from "chai";
import { ensureLoanConfig, ensureVaultConfig, vaultConfigPda } from "./_shared";

// =============================================================================
// V1 — TRDC CPI-only gate
// =============================================================================
//
// V1 happy-path: existing CPI-driven tests (tests/disburse.spec.ts,
// tests/repayment.spec.ts, tests/moments-*-e2e.spec.ts) all exercise the
// `loan_authority` PDA → trdc CPI path. If V1 broke the happy path those
// suites go red. The negative test below confirms that the same instruction,
// when invoked directly from off-chain with an arbitrary signer, is now
// rejected by Anchor's `seeds::program = LOAN_PROGRAM_ID` constraint.

describe("security hotfix V1 — direct external call to a trdc transition is rejected", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const trdcProgram = anchor.workspace.Trdc as Program<any>;
  const loanProgram = anchor.workspace.Loan as Program<any>;
  const provider = anchor.getProvider() as anchor.AnchorProvider;

  it("rejects a non-loan-program caller of transition_active_to_repaid", async () => {
    // Initialise a fresh TRDCState in PendingCustody. Even though its status
    // is wrong for `transition_active_to_repaid`, the account-constraint
    // check runs BEFORE the body, so the constraint failure is what we
    // observe — confirming the gate is at the account layer.
    const loanId = Keypair.generate().publicKey;
    const [trdcStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("trdc_state"), loanId.toBuffer()],
      trdcProgram.programId,
    );
    await trdcProgram.methods
      .initializeTrdcState(
        loanId,
        new BN(1),
        new BN(1),
        new BN(Math.floor(Date.now() / 1000) + 30 * 86400),
        new BN(800),
        Array.from(Buffer.alloc(32)),
      )
      .accounts({
        trdcState: trdcStatePda,
        payer: provider.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    // The attacker derives a PDA under their OWN program id (or hands in any
    // keypair) and tries to sign the trdc transition directly. The
    // `seeds::program = LOAN_PROGRAM_ID` constraint catches this.
    const impostor = Keypair.generate();
    const sig = await provider.connection.requestAirdrop(
      impostor.publicKey,
      LAMPORTS_PER_SOL,
    );
    await provider.connection.confirmTransaction(sig, "confirmed");

    let threw = false;
    let code: string | undefined;
    try {
      await trdcProgram.methods
        .transitionActiveToRepaid()
        .accounts({
          trdcState: trdcStatePda,
          loanAuthority: impostor.publicKey,
        })
        .signers([impostor])
        .rpc();
    } catch (e: any) {
      threw = true;
      code = e.error?.errorCode?.code ?? e.code;
    }
    expect(threw, "direct call must revert").to.eq(true);
    // Anchor returns `ConstraintSeeds` when seeds::program / seeds mismatch.
    expect(code).to.eq("ConstraintSeeds");
  });
});

// =============================================================================
// V2 — `test_transition` is no longer in the IDL.
// =============================================================================

describe("security hotfix V2 — test_transition has been removed", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const trdcProgram = anchor.workspace.Trdc as Program<any>;

  it("trdc IDL does not expose `test_transition`", () => {
    const idl = trdcProgram.idl as { instructions: Array<{ name: string }> };
    const names = idl.instructions.map((i) => i.name);
    expect(names).to.not.include("test_transition");
  });
});

// =============================================================================
// V3 — `initialized: bool` flag + migration ixs
// =============================================================================

describe("security hotfix V3 — initialized flag on LoanConfig + VaultConfig", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const loanProgram = anchor.workspace.Loan as Program<any>;
  const vaultProgram = anchor.workspace.Vault as Program<any>;
  const provider = anchor.getProvider() as anchor.AnchorProvider;

  before(async () => {
    await ensureLoanConfig(loanProgram, provider);
    await ensureVaultConfig(vaultProgram, provider);
  });

  it("LoanConfig has `initialized = true` after initialize_loan_config", async () => {
    const [loanConfigPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("loan_config")],
      loanProgram.programId,
    );
    const cfg = await loanProgram.account.loanConfig.fetch(loanConfigPda);
    expect(cfg.initialized).to.eq(true);
  });

  it("VaultConfig has `initialized = true` after initialize_vault_config", async () => {
    const pda = vaultConfigPda(vaultProgram.programId);
    const cfg = await vaultProgram.account.vaultConfig.fetch(pda);
    expect(cfg.initialized).to.eq(true);
  });

  it("migrate_loan_config_v3 is idempotent (no-op when already at v3 size + flag)", async () => {
    const [loanConfigPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("loan_config")],
      loanProgram.programId,
    );
    // Running the migration ix twice on an already-migrated row must not
    // throw and must leave initialized = true. Admin = the test wallet
    // (ensureLoanConfig wrote provider.wallet.publicKey there).
    await loanProgram.methods
      .migrateLoanConfigV3()
      .accounts({
        loanConfig: loanConfigPda,
        admin: provider.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    await loanProgram.methods
      .migrateLoanConfigV3()
      .accounts({
        loanConfig: loanConfigPda,
        admin: provider.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    const cfg = await loanProgram.account.loanConfig.fetch(loanConfigPda);
    expect(cfg.initialized).to.eq(true);
  });

  it("migrate_vault_config_v2 is idempotent (no-op when already at v2 size + flag)", async () => {
    const pda = vaultConfigPda(vaultProgram.programId);
    await vaultProgram.methods
      .migrateVaultConfigV2()
      .accounts({
        vaultConfig: pda,
        admin: provider.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    await vaultProgram.methods
      .migrateVaultConfigV2()
      .accounts({
        vaultConfig: pda,
        admin: provider.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    const cfg = await vaultProgram.account.vaultConfig.fetch(pda);
    expect(cfg.initialized).to.eq(true);
  });

  it("migrate_loan_config_v3 with a non-admin signer is rejected", async () => {
    const [loanConfigPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("loan_config")],
      loanProgram.programId,
    );
    const impostor = Keypair.generate();
    const sig = await provider.connection.requestAirdrop(
      impostor.publicKey,
      LAMPORTS_PER_SOL,
    );
    await provider.connection.confirmTransaction(sig, "confirmed");
    let threw = false;
    try {
      await loanProgram.methods
        .migrateLoanConfigV3()
        .accounts({
          loanConfig: loanConfigPda,
          admin: impostor.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([impostor])
        .rpc();
    } catch {
      threw = true;
    }
    expect(threw, "non-admin must be rejected").to.eq(true);
  });
});
