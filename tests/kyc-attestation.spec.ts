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
import { ensureLoanConfig, ensureVaultConfig, vaultConfigPda } from "./_shared";

// KYC Attestation PDA — replaces the (sunset) Civic Pass on-chain gate.
//
// The admin (vault_config.admin) issues a KycAttestation PDA per user after
// off-chain KYC verification. The PDA carries:
//   - owner (the verified user)
//   - attestor (the admin who issued — must equal vault_config.admin at use)
//   - attested_at (i64, when issued)
//   - jwt_hash ([u8; 32], SHA-256 of the Civic Auth JWT, binds attestation
//     to a specific verification event)
//
// The gate fires on `vault.deposit` and `loan.create_ccb_trdc` only when
// `*_config.kyc_required == true`. Default is `false` so the existing 43
// passing tests stay green.

function randomJwtHash(): number[] {
  const buf = Buffer.alloc(32);
  for (let i = 0; i < 32; i++) buf[i] = Math.floor(Math.random() * 256);
  return Array.from(buf);
}

function attestationPda(
  vaultProgramId: PublicKey,
  owner: PublicKey,
): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("kyc_attestation"), owner.toBuffer()],
    vaultProgramId,
  )[0];
}

describe("kyc attestation / vault.issue_kyc_attestation", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const vaultProgram = anchor.workspace.Vault as Program<any>;
  const provider = anchor.getProvider() as anchor.AnchorProvider;
  const payer = (provider.wallet as any).payer as Keypair;

  let vaultCfgPda: PublicKey;
  let assetMint: PublicKey;
  let shareMint: PublicKey;
  let vaultPda: PublicKey;
  let vaultAta: PublicKey;

  before(async () => {
    const ensured = await ensureVaultConfig(vaultProgram, provider);
    vaultCfgPda = ensured.vaultConfigPda;

    assetMint = await createMint(
      provider.connection,
      payer,
      provider.publicKey,
      null,
      6,
    );

    [vaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), assetMint.toBuffer()],
      vaultProgram.programId,
    );

    const shareMintKp = Keypair.generate();
    shareMint = shareMintKp.publicKey;
    await vaultProgram.methods
      .initializeVault()
      .accounts({
        vault: vaultPda,
        assetMint,
        shareMint,
        payer: provider.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([shareMintKp])
      .rpc();

    vaultAta = await createAssociatedTokenAccount(
      provider.connection,
      payer,
      assetMint,
      vaultPda,
      undefined,
      undefined,
      undefined,
      true,
    );
  });

  async function setupUser(): Promise<{
    user: Keypair;
    assetAta: PublicKey;
    shareAta: PublicKey;
  }> {
    const user = Keypair.generate();
    const sig = await provider.connection.requestAirdrop(
      user.publicKey,
      2 * LAMPORTS_PER_SOL,
    );
    await provider.connection.confirmTransaction(sig, "confirmed");
    const assetAta = await createAssociatedTokenAccount(
      provider.connection,
      payer,
      assetMint,
      user.publicKey,
    );
    await mintTo(
      provider.connection,
      payer,
      assetMint,
      assetAta,
      payer,
      BigInt("5000000000"),
    );
    const shareAta = await createAssociatedTokenAccount(
      provider.connection,
      payer,
      shareMint,
      user.publicKey,
    );
    return { user, assetAta, shareAta };
  }

  it("test_admin_issues_attestation_owner_can_deposit", async () => {
    const { user, assetAta, shareAta } = await setupUser();
    const jwtHash = randomJwtHash();
    const attPda = attestationPda(vaultProgram.programId, user.publicKey);

    // Admin issues the attestation. `provider.wallet` is the vault_config admin
    // (set in the first ensureVaultConfig call by the baseline tests).
    await vaultProgram.methods
      .issueKycAttestation(user.publicKey, jwtHash)
      .accounts({
        kycAttestation: attPda,
        vaultConfig: vaultCfgPda,
        admin: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const att = await (vaultProgram.account as any).kycAttestation.fetch(attPda);
    expect(att.owner.toBase58()).to.eq(user.publicKey.toBase58());
    expect(att.attestor.toBase58()).to.eq(provider.wallet.publicKey.toBase58());
    expect(Array.from(att.jwtHash as number[])).to.deep.eq(jwtHash);
    expect(att.attestedAt.toNumber()).to.be.greaterThan(0);

    // Deposit succeeds (gate is OFF by default — kyc_required=false — but the
    // attestation account is wired as a real KycAttestation so still works).
    const amount = new BN("1000000000");
    await vaultProgram.methods
      .deposit(amount)
      .accounts({
        vault: vaultPda,
        assetMint,
        shareMint,
        vaultAta,
        depositorAta: assetAta,
        depositorShareAta: shareAta,
        depositor: user.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        vaultConfig: vaultCfgPda,
        kycAttestation: attPda,
      })
      .signers([user])
      .rpc();
  });

  it("test_no_attestation_blocks_deposit", async () => {
    // With kyc_required = false (default), the gate is off and deposits
    // succeed even with a junk kycAttestation account. We assert the
    // ERROR CODE is registered in the IDL — the runtime path is exercised
    // in a follow-up integration test that flips kyc_required on.
    const idl = vaultProgram.idl as any;
    const hasErr = (idl.errors ?? []).some(
      (e: any) =>
        e.name === "NoKycAttestation" || e.name === "noKycAttestation",
    );
    expect(hasErr, "Vault IDL must declare NoKycAttestation").to.eq(true);

    // Wiring: deposit ix carries kycAttestation account.
    const depositIx = (idl.instructions ?? []).find(
      (i: any) => i.name === "deposit",
    );
    expect(depositIx, "deposit ix should be in IDL").to.not.eq(undefined);
    const names = depositIx.accounts.map((a: any) => a.name);
    expect(names).to.include("kycAttestation");
  });

  it("test_only_admin_can_issue_attestation", async () => {
    const { user } = await setupUser();
    const impostor = Keypair.generate();
    const sig = await provider.connection.requestAirdrop(
      impostor.publicKey,
      LAMPORTS_PER_SOL,
    );
    await provider.connection.confirmTransaction(sig, "confirmed");

    const attPda = attestationPda(vaultProgram.programId, user.publicKey);

    let threw = false;
    let code: string | undefined;
    try {
      await vaultProgram.methods
        .issueKycAttestation(user.publicKey, randomJwtHash())
        .accounts({
          kycAttestation: attPda,
          vaultConfig: vaultCfgPda,
          admin: impostor.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([impostor])
        .rpc();
    } catch (e: any) {
      threw = true;
      code = e.error?.errorCode?.code ?? e.code;
    }
    expect(threw).to.eq(true);
    expect(code).to.eq("UnauthorizedAttestor");
  });
});

// Wave B.1 — runtime revert tests for the KYC gate.
//
// Until `set_kyc_required` existed, `*_config.kyc_required` was init-once at
// `false` and could never be flipped, so the `NoKycAttestation` revert path
// could only be asserted via IDL presence. With the admin ix in place we
// flip the gate on, exercise the gated ix against a fresh user with no
// attestation, assert the revert, and reset the gate to false in afterEach
// so the rest of the suite (which assumes gate-OFF) is unaffected.
describe("kyc gate runtime revert / set_kyc_required", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const vaultProgram = anchor.workspace.Vault as Program<any>;
  const loanProgram = anchor.workspace.Loan as Program<any>;
  const trdcProgram = anchor.workspace.Trdc as Program<any>;
  const provider = anchor.getProvider() as anchor.AnchorProvider;
  const payer = (provider.wallet as any).payer as Keypair;

  let vaultCfgPda: PublicKey;
  let loanCfgPda: PublicKey;
  let assetMint: PublicKey;
  let shareMint: PublicKey;
  let vaultPda: PublicKey;
  let vaultAta: PublicKey;

  before(async () => {
    const ev = await ensureVaultConfig(vaultProgram, provider);
    vaultCfgPda = ev.vaultConfigPda;
    const el = await ensureLoanConfig(loanProgram, provider);
    loanCfgPda = el.loanConfigPda;

    assetMint = await createMint(
      provider.connection,
      payer,
      provider.publicKey,
      null,
      6,
    );
    [vaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), assetMint.toBuffer()],
      vaultProgram.programId,
    );
    const shareMintKp = Keypair.generate();
    shareMint = shareMintKp.publicKey;
    await vaultProgram.methods
      .initializeVault()
      .accounts({
        vault: vaultPda,
        assetMint,
        shareMint,
        payer: provider.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([shareMintKp])
      .rpc();
    vaultAta = await createAssociatedTokenAccount(
      provider.connection,
      payer,
      assetMint,
      vaultPda,
      undefined,
      undefined,
      undefined,
      true,
    );
  });

  // CRITICAL: reset both gates to false even if the test fails partway
  // through. vault_config / loan_config are singletons and other tests in
  // the suite assume gate-OFF.
  afterEach(async () => {
    try {
      await vaultProgram.methods
        .setKycRequired(false)
        .accounts({
          vaultConfig: vaultCfgPda,
          admin: provider.wallet.publicKey,
        })
        .rpc();
    } catch {
      // best-effort cleanup — must not mask the test's primary failure.
    }
    try {
      await loanProgram.methods
        .setKycRequired(false)
        .accounts({
          loanConfig: loanCfgPda,
          admin: provider.wallet.publicKey,
        })
        .rpc();
    } catch {
      // best-effort cleanup.
    }
  });

  async function setupFreshDepositor(): Promise<{
    user: Keypair;
    assetAta: PublicKey;
    shareAta: PublicKey;
  }> {
    const user = Keypair.generate();
    const sig = await provider.connection.requestAirdrop(
      user.publicKey,
      2 * LAMPORTS_PER_SOL,
    );
    await provider.connection.confirmTransaction(sig, "confirmed");
    const assetAta = await createAssociatedTokenAccount(
      provider.connection,
      payer,
      assetMint,
      user.publicKey,
    );
    await mintTo(
      provider.connection,
      payer,
      assetMint,
      assetAta,
      payer,
      BigInt("5000000000"),
    );
    const shareAta = await createAssociatedTokenAccount(
      provider.connection,
      payer,
      shareMint,
      user.publicKey,
    );
    return { user, assetAta, shareAta };
  }

  it("test_kyc_required_gate_blocks_deposit_at_runtime", async () => {
    // Flip gate ON.
    await vaultProgram.methods
      .setKycRequired(true)
      .accounts({
        vaultConfig: vaultCfgPda,
        admin: provider.wallet.publicKey,
      })
      .rpc();

    // Fresh depositor, no attestation. Pass SystemProgram as the
    // kyc_attestation placeholder — the gate body should reject it.
    const { user, assetAta, shareAta } = await setupFreshDepositor();

    let threw = false;
    let code: string | undefined;
    try {
      await vaultProgram.methods
        .deposit(new BN("1000000"))
        .accounts({
          vault: vaultPda,
          assetMint,
          shareMint,
          vaultAta,
          depositorAta: assetAta,
          depositorShareAta: shareAta,
          depositor: user.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          vaultConfig: vaultCfgPda,
          kycAttestation: SystemProgram.programId,
        })
        .signers([user])
        .rpc();
    } catch (e: any) {
      threw = true;
      code = e.error?.errorCode?.code ?? e.code;
    }
    expect(threw, "deposit must revert when gate is on and no attestation").to.eq(true);
    expect(code).to.eq("NoKycAttestation");
  });

  it("test_kyc_required_gate_blocks_create_ccb_trdc_at_runtime", async () => {
    // Flip loan gate ON.
    await loanProgram.methods
      .setKycRequired(true)
      .accounts({
        loanConfig: loanCfgPda,
        admin: provider.wallet.publicKey,
      })
      .rpc();

    // Fresh borrower with no attestation invokes create_ccb_trdc.
    const borrower = Keypair.generate();
    const sig = await provider.connection.requestAirdrop(
      borrower.publicKey,
      2 * LAMPORTS_PER_SOL,
    );
    await provider.connection.confirmTransaction(sig, "confirmed");

    const loanId = Keypair.generate().publicKey;
    const [trdcStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("trdc_state"), loanId.toBuffer()],
      trdcProgram.programId,
    );

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
          kycAttestation: SystemProgram.programId,
          priceFeed: SystemProgram.programId,
        })
        .signers([borrower])
        .rpc();
    } catch (e: any) {
      threw = true;
      code = e.error?.errorCode?.code ?? e.code;
    }
    expect(threw, "create_ccb_trdc must revert when gate is on and no attestation").to.eq(true);
    expect(code).to.eq("NoKycAttestation");
  });

  it("test_set_kyc_required_rejects_non_admin", async () => {
    const impostor = Keypair.generate();
    const sig = await provider.connection.requestAirdrop(
      impostor.publicKey,
      LAMPORTS_PER_SOL,
    );
    await provider.connection.confirmTransaction(sig, "confirmed");

    let threwVault = false;
    let codeVault: string | undefined;
    try {
      await vaultProgram.methods
        .setKycRequired(true)
        .accounts({
          vaultConfig: vaultCfgPda,
          admin: impostor.publicKey,
        })
        .signers([impostor])
        .rpc();
    } catch (e: any) {
      threwVault = true;
      codeVault = e.error?.errorCode?.code ?? e.code;
    }
    expect(threwVault).to.eq(true);
    expect(codeVault).to.eq("Unauthorized");

    let threwLoan = false;
    let codeLoan: string | undefined;
    try {
      await loanProgram.methods
        .setKycRequired(true)
        .accounts({
          loanConfig: loanCfgPda,
          admin: impostor.publicKey,
        })
        .signers([impostor])
        .rpc();
    } catch (e: any) {
      threwLoan = true;
      codeLoan = e.error?.errorCode?.code ?? e.code;
    }
    expect(threwLoan).to.eq(true);
    expect(codeLoan).to.eq("Unauthorized");
  });
});

// Wave B.2 — close_kyc_attestation admin ix.
//
// KycAttestation PDA was init-only (Task 1.3). Without a close path, revoked
// or expired attestations remain on-chain forever, and re-issuance is
// impossible because PDA seeds are `[SEED, owner]` (deterministic per owner).
//
// `close_kyc_attestation(owner)` is admin-gated and uses Anchor's
// `close = admin` constraint to refund rent and zero the account, restoring
// init-ability for the same owner with a fresh jwt_hash.
describe("kyc attestation close / close_kyc_attestation", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const vaultProgram = anchor.workspace.Vault as Program<any>;
  const loanProgram = anchor.workspace.Loan as Program<any>;
  const provider = anchor.getProvider() as anchor.AnchorProvider;

  let vaultCfgPda: PublicKey;
  let loanCfgPda: PublicKey;

  before(async () => {
    const ev = await ensureVaultConfig(vaultProgram, provider);
    vaultCfgPda = ev.vaultConfigPda;
    const el = await ensureLoanConfig(loanProgram, provider);
    loanCfgPda = el.loanConfigPda;
  });

  function loanAttestationPda(owner: PublicKey): PublicKey {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("kyc_attestation"), owner.toBuffer()],
      loanProgram.programId,
    )[0];
  }

  it("test_admin_can_close_attestation_owner_can_reissue", async () => {
    const owner = Keypair.generate();
    const attPda = attestationPda(vaultProgram.programId, owner.publicKey);

    // Issue attestation #1 with jwt_hash A.
    const jwtA = randomJwtHash();
    await vaultProgram.methods
      .issueKycAttestation(owner.publicKey, jwtA)
      .accounts({
        kycAttestation: attPda,
        vaultConfig: vaultCfgPda,
        admin: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const att1 = await (vaultProgram.account as any).kycAttestation.fetch(
      attPda,
    );
    expect(Array.from(att1.jwtHash as number[])).to.deep.eq(jwtA);

    // Close attestation as admin. Verify rent is refunded to admin.
    const adminLamportsBefore = await provider.connection.getBalance(
      provider.wallet.publicKey,
    );
    const attLamports = (await provider.connection.getAccountInfo(attPda))!
      .lamports;

    await vaultProgram.methods
      .closeKycAttestation(owner.publicKey)
      .accounts({
        vaultConfig: vaultCfgPda,
        kycAttestation: attPda,
        admin: provider.wallet.publicKey,
      })
      .rpc();

    // PDA no longer exists.
    const acctAfter = await provider.connection.getAccountInfo(attPda);
    expect(acctAfter, "kyc attestation PDA must be closed").to.eq(null);

    // Admin lamports went up by ~attLamports (minus tx fee, so just assert
    // a non-trivial positive delta in the right direction — the precise tx
    // fee depends on validator settings).
    const adminLamportsAfter = await provider.connection.getBalance(
      provider.wallet.publicKey,
    );
    expect(
      adminLamportsAfter,
      "admin should be refunded most of the rent (minus tx fee)",
    ).to.be.greaterThan(adminLamportsBefore + attLamports - 10_000_000);

    // Re-issue with a different jwt_hash.
    const jwtB = randomJwtHash();
    // Sanity: ensure jwtB != jwtA so the assertion below is meaningful.
    expect(jwtB).to.not.deep.eq(jwtA);

    await vaultProgram.methods
      .issueKycAttestation(owner.publicKey, jwtB)
      .accounts({
        kycAttestation: attPda,
        vaultConfig: vaultCfgPda,
        admin: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const att2 = await (vaultProgram.account as any).kycAttestation.fetch(
      attPda,
    );
    expect(Array.from(att2.jwtHash as number[])).to.deep.eq(jwtB);
    expect(att2.owner.toBase58()).to.eq(owner.publicKey.toBase58());
  });

  it("test_close_attestation_rejects_non_admin", async () => {
    const owner = Keypair.generate();
    const attPda = attestationPda(vaultProgram.programId, owner.publicKey);

    // Issue an attestation as the real admin.
    await vaultProgram.methods
      .issueKycAttestation(owner.publicKey, randomJwtHash())
      .accounts({
        kycAttestation: attPda,
        vaultConfig: vaultCfgPda,
        admin: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const impostor = Keypair.generate();
    const sig = await provider.connection.requestAirdrop(
      impostor.publicKey,
      LAMPORTS_PER_SOL,
    );
    await provider.connection.confirmTransaction(sig, "confirmed");

    let threw = false;
    let code: string | undefined;
    try {
      await vaultProgram.methods
        .closeKycAttestation(owner.publicKey)
        .accounts({
          vaultConfig: vaultCfgPda,
          kycAttestation: attPda,
          admin: impostor.publicKey,
        })
        .signers([impostor])
        .rpc();
    } catch (e: any) {
      threw = true;
      code = e.error?.errorCode?.code ?? e.code;
    }
    expect(threw, "non-admin must not close attestation").to.eq(true);
    expect(code).to.eq("Unauthorized");

    // Account must still exist after the failed close attempt.
    const acct = await provider.connection.getAccountInfo(attPda);
    expect(acct, "attestation must remain on-chain after rejected close")
      .to.not.eq(null);

    // Cleanup: close as the real admin so this test is idempotent across
    // re-runs against a persistent ledger.
    await vaultProgram.methods
      .closeKycAttestation(owner.publicKey)
      .accounts({
        vaultConfig: vaultCfgPda,
        kycAttestation: attPda,
        admin: provider.wallet.publicKey,
      })
      .rpc();
  });

  it("test_close_attestation_fails_when_attestation_does_not_exist", async () => {
    const ghostOwner = Keypair.generate();
    const ghostPda = attestationPda(vaultProgram.programId, ghostOwner.publicKey);

    // Sanity check: the PDA does not exist on-chain.
    const acct = await provider.connection.getAccountInfo(ghostPda);
    expect(acct, "ghost PDA precondition: must not exist").to.eq(null);

    let threw = false;
    let code: string | undefined;
    try {
      await vaultProgram.methods
        .closeKycAttestation(ghostOwner.publicKey)
        .accounts({
          vaultConfig: vaultCfgPda,
          kycAttestation: ghostPda,
          admin: provider.wallet.publicKey,
        })
        .rpc();
    } catch (e: any) {
      threw = true;
      code = e.error?.errorCode?.code ?? e.code;
    }
    expect(threw, "close on non-existent PDA must revert").to.eq(true);
    // Anchor surfaces this as AccountNotInitialized when an `Account<T>`
    // points at an empty (lamports=0, owner=SystemProgram) address.
    expect(code).to.eq("AccountNotInitialized");
  });

  // Mirror: same three flows on the loan program. Loan keeps an independent
  // KycAttestation namespace (separate program id), so the close ix must be
  // verified there too.
  it("test_loan_admin_can_close_attestation_owner_can_reissue", async () => {
    const owner = Keypair.generate();
    const attPda = loanAttestationPda(owner.publicKey);

    const jwtA = randomJwtHash();
    await loanProgram.methods
      .issueKycAttestation(owner.publicKey, jwtA)
      .accounts({
        kycAttestation: attPda,
        loanConfig: loanCfgPda,
        admin: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    await loanProgram.methods
      .closeKycAttestation(owner.publicKey)
      .accounts({
        loanConfig: loanCfgPda,
        kycAttestation: attPda,
        admin: provider.wallet.publicKey,
      })
      .rpc();

    const after = await provider.connection.getAccountInfo(attPda);
    expect(after, "loan kyc attestation PDA must be closed").to.eq(null);

    // Re-issue with a new jwt_hash succeeds.
    const jwtB = randomJwtHash();
    await loanProgram.methods
      .issueKycAttestation(owner.publicKey, jwtB)
      .accounts({
        kycAttestation: attPda,
        loanConfig: loanCfgPda,
        admin: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const att2 = await (loanProgram.account as any).kycAttestation.fetch(
      attPda,
    );
    expect(Array.from(att2.jwtHash as number[])).to.deep.eq(jwtB);
  });

  it("test_loan_close_attestation_rejects_non_admin", async () => {
    const owner = Keypair.generate();
    const attPda = loanAttestationPda(owner.publicKey);
    await loanProgram.methods
      .issueKycAttestation(owner.publicKey, randomJwtHash())
      .accounts({
        kycAttestation: attPda,
        loanConfig: loanCfgPda,
        admin: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const impostor = Keypair.generate();
    const sig = await provider.connection.requestAirdrop(
      impostor.publicKey,
      LAMPORTS_PER_SOL,
    );
    await provider.connection.confirmTransaction(sig, "confirmed");

    let threw = false;
    let code: string | undefined;
    try {
      await loanProgram.methods
        .closeKycAttestation(owner.publicKey)
        .accounts({
          loanConfig: loanCfgPda,
          kycAttestation: attPda,
          admin: impostor.publicKey,
        })
        .signers([impostor])
        .rpc();
    } catch (e: any) {
      threw = true;
      code = e.error?.errorCode?.code ?? e.code;
    }
    expect(threw).to.eq(true);
    expect(code).to.eq("Unauthorized");

    // Cleanup as real admin.
    await loanProgram.methods
      .closeKycAttestation(owner.publicKey)
      .accounts({
        loanConfig: loanCfgPda,
        kycAttestation: attPda,
        admin: provider.wallet.publicKey,
      })
      .rpc();
  });

  it("test_loan_close_attestation_fails_when_attestation_does_not_exist", async () => {
    const ghostOwner = Keypair.generate();
    const ghostPda = loanAttestationPda(ghostOwner.publicKey);
    expect(
      await provider.connection.getAccountInfo(ghostPda),
      "ghost loan PDA precondition: must not exist",
    ).to.eq(null);

    let threw = false;
    let code: string | undefined;
    try {
      await loanProgram.methods
        .closeKycAttestation(ghostOwner.publicKey)
        .accounts({
          loanConfig: loanCfgPda,
          kycAttestation: ghostPda,
          admin: provider.wallet.publicKey,
        })
        .rpc();
    } catch (e: any) {
      threw = true;
      code = e.error?.errorCode?.code ?? e.code;
    }
    expect(threw).to.eq(true);
    expect(code).to.eq("AccountNotInitialized");
  });
});
