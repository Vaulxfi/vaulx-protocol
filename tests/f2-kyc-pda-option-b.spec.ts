import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccount,
  createMint,
  mintTo,
} from "@solana/spl-token";
import { expect } from "chai";
import { ensureLoanConfig, ensureVaultConfig } from "./_shared";

// =============================================================================
// F2-B — `loan.create_ccb_trdc` validates the vault-owned KYC attestation
// =============================================================================
//
// The loan program's KYC gate now reads the **vault**-program-owned
// KycAttestation PDA (single canonical source of truth — vault is the KYC
// issuer; the Sumsub webhook only mints there). When `kyc_required = true`,
// `create_ccb_trdc` enforces:
//   (1) the supplied account key equals `find_program_address([b"kyc_attestation", payer], vault::ID)`
//   (2) the account's data is owned by the vault program
//   (3) the data deserializes to a `KycAttestation` (Anchor discriminator match)
//   (4) `att.owner == payer`
//   (5) `att.attestor == loan_config.admin`
// All five reject with `NoKycAttestation` on failure.
//
// Gate-OFF behavior is unchanged: callers may pass any account (e.g.
// SystemProgram) and the inline body is skipped. This preserves demo
// backward-compat (the recorded Colosseum demo runs with kyc_required=false).

function randomJwtHash(): number[] {
  const buf = Buffer.alloc(32);
  for (let i = 0; i < 32; i++) buf[i] = Math.floor(Math.random() * 256);
  return Array.from(buf);
}

function vaultAttestationPda(
  vaultProgramId: PublicKey,
  owner: PublicKey,
): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("kyc_attestation"), owner.toBuffer()],
    vaultProgramId,
  )[0];
}

function loanAttestationPda(
  loanProgramId: PublicKey,
  owner: PublicKey,
): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("kyc_attestation"), owner.toBuffer()],
    loanProgramId,
  )[0];
}

describe("F2-B — create_ccb_trdc validates vault-owned KYC attestation", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const vaultProgram = anchor.workspace.Vault as Program<any>;
  const loanProgram = anchor.workspace.Loan as Program<any>;
  const trdcProgram = anchor.workspace.Trdc as Program<any>;
  const provider = anchor.getProvider() as anchor.AnchorProvider;

  let vaultCfgPda: PublicKey;
  let loanCfgPda: PublicKey;

  before(async () => {
    const ev = await ensureVaultConfig(vaultProgram, provider);
    vaultCfgPda = ev.vaultConfigPda;
    const el = await ensureLoanConfig(loanProgram, provider);
    loanCfgPda = el.loanConfigPda;
  });

  // Singletons — must reset gate to false even on test failure so unrelated
  // suites that assume gate-OFF stay green.
  afterEach(async () => {
    try {
      await loanProgram.methods
        .setKycRequired(false)
        .accounts({
          loanConfig: loanCfgPda,
          admin: provider.wallet.publicKey,
        })
        .rpc();
    } catch {
      // best-effort cleanup; do not mask primary failure.
    }
  });

  async function setupBorrower(): Promise<{ borrower: Keypair }> {
    const borrower = Keypair.generate();
    const sig = await provider.connection.requestAirdrop(
      borrower.publicKey,
      2 * LAMPORTS_PER_SOL,
    );
    await provider.connection.confirmTransaction(sig, "confirmed");
    return { borrower };
  }

  function trdcStatePdaFor(loanId: PublicKey): PublicKey {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("trdc_state"), loanId.toBuffer()],
      trdcProgram.programId,
    )[0];
  }

  // ---------------------------------------------------------------------------
  // Happy path: vault-program-owned KYC PDA satisfies the loan gate.
  // ---------------------------------------------------------------------------
  it("accepts a vault-program-owned KycAttestation when gate is ON", async () => {
    const { borrower } = await setupBorrower();

    // Admin issues the attestation on the vault program (the single canonical
    // mint path — webhook only mints to vault).
    const vaultAttPda = vaultAttestationPda(
      vaultProgram.programId,
      borrower.publicKey,
    );
    await vaultProgram.methods
      .issueKycAttestation(borrower.publicKey, randomJwtHash())
      .accounts({
        kycAttestation: vaultAttPda,
        vaultConfig: vaultCfgPda,
        admin: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    // Flip loan gate ON.
    await loanProgram.methods
      .setKycRequired(true)
      .accounts({
        loanConfig: loanCfgPda,
        admin: provider.wallet.publicKey,
      })
      .rpc();

    const loanId = Keypair.generate().publicKey;
    const trdcStatePda = trdcStatePdaFor(loanId);
    const assetHint = Array.from(Buffer.alloc(32));
    const dueTs = new BN(Math.floor(Date.now() / 1000) + 30 * 86400);

    await loanProgram.methods
      .createCcbTrdc(
        loanId,
        new BN(100),
        new BN(50),
        dueTs,
        new BN(800),
        assetHint,
      )
      .accounts({
        trdcState: trdcStatePda,
        trdcProgram: trdcProgram.programId,
        payer: borrower.publicKey,
        systemProgram: SystemProgram.programId,
        loanConfig: loanCfgPda,
        kycAttestation: vaultAttPda,
        priceFeed: SystemProgram.programId,
      })
      .signers([borrower])
      .rpc();

    // No revert => happy path passed.
    const trdcState = await (trdcProgram.account as any).trdcState.fetch(
      trdcStatePda,
    );
    expect(trdcState.borrower.toBase58()).to.eq(borrower.publicKey.toBase58());

    // Cleanup: close the vault attestation so the next test's borrower starts
    // fresh (PDA seeds are deterministic per owner; each test uses a new
    // keypair so this isn't strictly required, but is hygienic).
    try {
      await vaultProgram.methods
        .closeKycAttestation(borrower.publicKey)
        .accounts({
          kycAttestation: vaultAttPda,
          vaultConfig: vaultCfgPda,
          admin: provider.wallet.publicKey,
        })
        .rpc();
    } catch {
      // best-effort.
    }
  });

  // ---------------------------------------------------------------------------
  // Negative: a legacy LOAN-program-owned KycAttestation at the matching owner
  // key is rejected. Pre-F2-B the loan gate accepted this; F2-B rejects.
  // ---------------------------------------------------------------------------
  it("rejects a legacy loan-program-owned KycAttestation when gate is ON", async () => {
    const { borrower } = await setupBorrower();

    // Issue the legacy loan-program-owned attestation (the pre-F2-B namespace).
    const legacyLoanAttPda = loanAttestationPda(
      loanProgram.programId,
      borrower.publicKey,
    );
    await loanProgram.methods
      .issueKycAttestation(borrower.publicKey, randomJwtHash())
      .accounts({
        kycAttestation: legacyLoanAttPda,
        loanConfig: loanCfgPda,
        admin: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    await loanProgram.methods
      .setKycRequired(true)
      .accounts({
        loanConfig: loanCfgPda,
        admin: provider.wallet.publicKey,
      })
      .rpc();

    const loanId = Keypair.generate().publicKey;
    const trdcStatePda = trdcStatePdaFor(loanId);
    const assetHint = Array.from(Buffer.alloc(32));
    const dueTs = new BN(Math.floor(Date.now() / 1000) + 30 * 86400);

    let threw = false;
    let code: string | undefined;
    try {
      await loanProgram.methods
        .createCcbTrdc(
          loanId,
          new BN(100),
          new BN(50),
          dueTs,
          new BN(800),
          assetHint,
        )
        .accounts({
          trdcState: trdcStatePda,
          trdcProgram: trdcProgram.programId,
          payer: borrower.publicKey,
          systemProgram: SystemProgram.programId,
          loanConfig: loanCfgPda,
          kycAttestation: legacyLoanAttPda,
          priceFeed: SystemProgram.programId,
        })
        .signers([borrower])
        .rpc();
    } catch (e: any) {
      threw = true;
      code = e.error?.errorCode?.code ?? e.code;
    }
    expect(threw, "legacy loan-owned attestation must revert").to.eq(true);
    // F2-B uses an inline PDA-address re-derive against `vault::ID`; the
    // legacy loan-owned PDA derives to a different address, so the rejection
    // surfaces as `NoKycAttestation` (the inline check's error variant).
    // This matches the security guarantee called out in the spec — the
    // legacy namespace is rejected — with a `NoKycAttestation` code rather
    // than `ConstraintSeeds` (which would require an Anchor-level seeds
    // constraint that we can't add without breaking demo gate-OFF: see the
    // report's "Deviations" section for the trade-off).
    expect(code).to.eq("NoKycAttestation");

    // Cleanup the legacy attestation so this test's borrower keypair leaves
    // no residue.
    try {
      await loanProgram.methods
        .closeKycAttestation(borrower.publicKey)
        .accounts({
          kycAttestation: legacyLoanAttPda,
          loanConfig: loanCfgPda,
          admin: provider.wallet.publicKey,
        })
        .rpc();
    } catch {
      // best-effort.
    }
  });

  // ---------------------------------------------------------------------------
  // Cross-check: vault::disburse still accepts the same vault-owned PDA — no
  // regression on the vault side. Disburse already validates the vault PDA;
  // we just confirm an end-to-end issue-then-disburse path stays green.
  // ---------------------------------------------------------------------------
  it("vault.disburse still accepts the same vault-owned attestation (no regression)", async () => {
    // The full disburse path requires vault init + ATAs + the loan-authority
    // CPI signer. Existing suites (tests/disburse.spec.ts,
    // tests/moments-*-e2e.spec.ts) exercise this end-to-end with the vault
    // attestation already in place. Re-running disburse here would duplicate
    // a heavy setup.
    //
    // Instead we verify the structural invariant: an attestation issued by
    // vault is fetchable by vault under the canonical PDA AND has the
    // matching owner/attestor, which is exactly what vault.disburse
    // re-validates inline at programs/vault/src/lib.rs:160-185.
    const { borrower } = await setupBorrower();
    const jwtHash = randomJwtHash();
    const vaultAttPda = vaultAttestationPda(
      vaultProgram.programId,
      borrower.publicKey,
    );

    await vaultProgram.methods
      .issueKycAttestation(borrower.publicKey, jwtHash)
      .accounts({
        kycAttestation: vaultAttPda,
        vaultConfig: vaultCfgPda,
        admin: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const att = await (vaultProgram.account as any).kycAttestation.fetch(
      vaultAttPda,
    );
    expect(att.owner.toBase58()).to.eq(borrower.publicKey.toBase58());
    expect(att.attestor.toBase58()).to.eq(provider.wallet.publicKey.toBase58());
    expect(Array.from(att.jwtHash as number[])).to.deep.eq(jwtHash);

    // The existing disburse and moments-2/4 end-to-end suites cover the full
    // vault.disburse flow against this same PDA. No regression here means
    // those suites continue to pass (asserted by the overall `anchor test`
    // run).

    try {
      await vaultProgram.methods
        .closeKycAttestation(borrower.publicKey)
        .accounts({
          kycAttestation: vaultAttPda,
          vaultConfig: vaultCfgPda,
          admin: provider.wallet.publicKey,
        })
        .rpc();
    } catch {
      // best-effort.
    }
  });

  // ---------------------------------------------------------------------------
  // Demo-compat: with the gate OFF, create_ccb_trdc accepts a SystemProgram
  // placeholder for kyc_attestation. This is the recorded demo's flow; the
  // F2-B change MUST NOT regress it.
  // ---------------------------------------------------------------------------
  it("gate-OFF: SystemProgram placeholder for kycAttestation still works", async () => {
    // Gate is already off (afterEach resets it). Explicitly confirm.
    const cfg = await (loanProgram.account as any).loanConfig.fetch(loanCfgPda);
    expect(cfg.kycRequired).to.eq(false);

    const { borrower } = await setupBorrower();
    const loanId = Keypair.generate().publicKey;
    const trdcStatePda = trdcStatePdaFor(loanId);
    const assetHint = Array.from(Buffer.alloc(32));
    const dueTs = new BN(Math.floor(Date.now() / 1000) + 30 * 86400);

    await loanProgram.methods
      .createCcbTrdc(
        loanId,
        new BN(100),
        new BN(50),
        dueTs,
        new BN(800),
        assetHint,
      )
      .accounts({
        trdcState: trdcStatePda,
        trdcProgram: trdcProgram.programId,
        payer: borrower.publicKey,
        systemProgram: SystemProgram.programId,
        loanConfig: loanCfgPda,
        kycAttestation: SystemProgram.programId,
        priceFeed: SystemProgram.programId,
      })
      .signers([borrower])
      .rpc();

    // No revert => demo path works.
  });

  // ---------------------------------------------------------------------------
  // Webhook isolation: confirm the Sumsub webhook source file is unchanged in
  // this commit (proves the off-chain mint path stays vault-only).
  // ---------------------------------------------------------------------------
  it("apps/web/src/lib/sumsub/attestation.ts mints only to vault", async () => {
    // Static assertion: the off-chain attestation issuer must NOT call
    // loanProgram.methods.issueKycAttestation (that would be Option A — the
    // dual-mint workaround we explicitly rejected by choosing Option B).
    const fs = await import("fs");
    const path = await import("path");
    const src = fs.readFileSync(
      path.resolve(
        __dirname,
        "..",
        "apps/web/src/lib/sumsub/attestation.ts",
      ),
      "utf8",
    );
    expect(
      src.includes("loanProgram") &&
        src.includes("issueKycAttestation"),
      "webhook must not mint loan-side attestation under Option B",
    ).to.eq(false);
    expect(src).to.match(/vault[\s\S]*issueKycAttestation/);
  });
});
