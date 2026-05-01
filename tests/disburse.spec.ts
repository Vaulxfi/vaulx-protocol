import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  SYSVAR_INSTRUCTIONS_PUBKEY,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccount,
  createMint,
  getAccount,
  mintTo,
} from "@solana/spl-token";
import { expect } from "chai";
import { ensureLoanConfig, ensureVaultConfig, vaultConfigPda } from "./_shared";

describe("loan / disburse_from_vault — CPI-only gate (Task 2.2)", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const loanProgram = anchor.workspace.Loan as Program<any>;
  const vaultProgram = anchor.workspace.Vault as Program<any>;
  const trdcProgram = anchor.workspace.Trdc as Program<any>;
  const provider = anchor.getProvider() as anchor.AnchorProvider;
  const payer = (provider.wallet as any).payer as Keypair;

  let custodian!: Keypair;
  let loanConfigPda!: PublicKey;

  function rand32(): number[] {
    const b = Buffer.alloc(32);
    for (let i = 0; i < 32; i++) b[i] = Math.floor(Math.random() * 256);
    return Array.from(b);
  }
  const nowPlus30 = () => new BN(Math.floor(Date.now() / 1000) + 30 * 86400);

  const loanAuthorityPda = PublicKey.findProgramAddressSync(
    [Buffer.from("loan_authority")],
    loanProgram.programId,
  )[0];

  before(async () => {
    const ensured = await ensureLoanConfig(loanProgram, provider);
    custodian = ensured.custodian;
    loanConfigPda = ensured.loanConfigPda;
    await ensureVaultConfig(vaultProgram, provider);
  });

  // -----------------------------------------------------------------
  // Fresh-per-test harness: each test gets its own asset mint, vault,
  // and TRDC so state is isolated.
  // -----------------------------------------------------------------
  type Fixture = {
    assetMint: PublicKey;
    shareMint: PublicKey;
    vaultPda: PublicKey;
    vaultAta: PublicKey;
    trdcStatePda: PublicKey;
    borrower: Keypair;
    borrowerAta: PublicKey;
  };

  async function setupVaultAndTrdc(opts: {
    vaultLiquidity: BN;
    confirmCustody: boolean;
  }): Promise<Fixture> {
    const assetMint = await createMint(
      provider.connection,
      payer,
      provider.publicKey,
      null,
      6,
    );
    const [vaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), assetMint.toBuffer()],
      vaultProgram.programId,
    );
    const shareMintKp = Keypair.generate();
    await vaultProgram.methods
      .initializeVault()
      .accounts({
        vault: vaultPda,
        assetMint,
        shareMint: shareMintKp.publicKey,
        payer: provider.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([shareMintKp])
      .rpc();

    const vaultAta = await createAssociatedTokenAccount(
      provider.connection,
      payer,
      assetMint,
      vaultPda,
      undefined,
      undefined,
      undefined,
      true,
    );

    // Fund vault via a lender deposit so share/asset accounting is coherent.
    if (opts.vaultLiquidity.gtn(0)) {
      const lender = Keypair.generate();
      const sig = await provider.connection.requestAirdrop(
        lender.publicKey,
        2 * LAMPORTS_PER_SOL,
      );
      await provider.connection.confirmTransaction(sig, "confirmed");
      const lenderAta = await createAssociatedTokenAccount(
        provider.connection,
        payer,
        assetMint,
        lender.publicKey,
      );
      await mintTo(
        provider.connection,
        payer,
        assetMint,
        lenderAta,
        payer,
        BigInt(opts.vaultLiquidity.toString()),
      );
      const lenderShareAta = await createAssociatedTokenAccount(
        provider.connection,
        payer,
        shareMintKp.publicKey,
        lender.publicKey,
      );
      await vaultProgram.methods
        .deposit(opts.vaultLiquidity)
        .accounts({
          vault: vaultPda,
          assetMint,
          shareMint: shareMintKp.publicKey,
          vaultAta,
          depositorAta: lenderAta,
          depositorShareAta: lenderShareAta,
          depositor: lender.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          vaultConfig: vaultConfigPda(vaultProgram.programId),
          kycAttestation: SystemProgram.programId,
          priceFeed: SystemProgram.programId,
        })
        .signers([lender])
        .rpc();
    }

    // Borrower keypair + ATA created BEFORE createCcbTrdc so trdc.borrower
    // (= createCcbTrdc payer) matches borrowerAta.authority. Required by the
    // atomic confirm_custody constraint `token::authority = trdc.borrower`.
    const borrower = Keypair.generate();
    {
      const sig = await provider.connection.requestAirdrop(
        borrower.publicKey,
        2 * LAMPORTS_PER_SOL,
      );
      await provider.connection.confirmTransaction(sig, "confirmed");
    }
    const borrowerAta = await createAssociatedTokenAccount(
      provider.connection,
      payer,
      assetMint,
      borrower.publicKey,
    );

    // Create TRDC (create_ccb_trdc). 50% LTV -> OK.
    const loanId = Keypair.generate().publicKey;
    const [trdcStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("trdc_state"), loanId.toBuffer()],
      trdcProgram.programId,
    );
    await loanProgram.methods
      .createCcbTrdc(
        loanId,
        new BN(100),
        new BN(50),
        nowPlus30(),
        new BN(800),
        rand32(),
      )
      .accounts({
        trdcState: trdcStatePda,
        trdcProgram: trdcProgram.programId,
        payer: borrower.publicKey,
        systemProgram: SystemProgram.programId,
        loanConfig: loanConfigPda,
        kycAttestation: SystemProgram.programId,
        priceFeed: SystemProgram.programId,
      })
      .signers([borrower])
      .rpc();

    if (opts.confirmCustody) {
      // Atomic confirm_custody — flips trdc PendingCustody → Active and
      // disburses loan_amount from the vault to borrowerAta in the same tx.
      await loanProgram.methods
        .confirmCustody(rand32())
        .accounts({
          trdcState: trdcStatePda,
          loanConfig: loanConfigPda,
          trdcProgram: trdcProgram.programId,
          custodian: custodian.publicKey,
          vault: vaultPda,
          assetMint,
          vaultAta,
          borrowerAta,
          loanAuthority: loanAuthorityPda,
          vaultProgram: vaultProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          instructionsSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
          priceFeed: SystemProgram.programId,
        })
        .signers([custodian])
        .rpc();
    }

    return {
      assetMint,
      shareMint: shareMintKp.publicKey,
      vaultPda,
      vaultAta,
      trdcStatePda,
      borrower,
      borrowerAta,
    };
  }

  it("test_disburse_fails_when_custody_not_confirmed", async () => {
    const f = await setupVaultAndTrdc({
      vaultLiquidity: new BN("1000000000"),
      confirmCustody: false,
    });

    let threw = false;
    let code: string | undefined;
    try {
      await loanProgram.methods
        .disburseFromVault(new BN("500000000"))
        .accounts({
          trdcState: f.trdcStatePda,
          loanConfig: loanConfigPda,
          vault: f.vaultPda,
          assetMint: f.assetMint,
          vaultAta: f.vaultAta,
          borrowerAta: f.borrowerAta,
          loanAuthority: loanAuthorityPda,
          borrower: f.borrower.publicKey,
          trdcProgram: trdcProgram.programId,
          vaultProgram: vaultProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          instructionsSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
          priceFeed: SystemProgram.programId,
        })
        .signers([f.borrower])
        .rpc();
    } catch (e: any) {
      threw = true;
      code = e.error?.errorCode?.code ?? e.code;
    }
    expect(threw, "disburse should revert when TRDC is not in ActiveInCustody").to.eq(true);
    expect(code).to.eq("InvalidStateTransition");
  });

  it("test_disburse_fails_with_unauthorized_caller", async () => {
    // Call vault.disburse directly at the top level (not via loan CPI).
    // Even with the correct loan_authority PDA as signer-substitute, Layer 2
    // catches the call because the top-level program is vault, not loan.
    const f = await setupVaultAndTrdc({
      vaultLiquidity: new BN("1000000000"),
      confirmCustody: true,
    });

    // Fake authority (random keypair, signs locally) — fails Layer 1 first.
    const fakeAuthority = Keypair.generate();
    const sig = await provider.connection.requestAirdrop(
      fakeAuthority.publicKey,
      LAMPORTS_PER_SOL,
    );
    await provider.connection.confirmTransaction(sig, "confirmed");

    let threw = false;
    let code: string | undefined;
    try {
      await vaultProgram.methods
        .disburse(new BN("500000000"))
        .accounts({
          vault: f.vaultPda,
          assetMint: f.assetMint,
          vaultAta: f.vaultAta,
          borrowerAta: f.borrowerAta,
          loanAuthority: fakeAuthority.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          instructionsSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
        })
        .signers([fakeAuthority])
        .rpc();
    } catch (e: any) {
      threw = true;
      code = e.error?.errorCode?.code ?? e.code;
    }
    expect(threw, "direct top-level vault.disburse should revert").to.eq(true);
    expect(code).to.eq("UnauthorizedDisbursar");
  });

  it("test_disburse_after_atomic_fails_with_invalid_state — standalone path is unreachable on the happy flow", async () => {
    // After setupVaultAndTrdc(confirmCustody: true) the atomic confirm has
    // already moved funds and flipped trdc to Active. Calling the standalone
    // disburse_from_vault now must fail at the FSM check — the ix is kept
    // alive only as the negative-test target for the custody gate and the
    // cross-program-gate test.
    const f = await setupVaultAndTrdc({
      vaultLiquidity: new BN("100000000000"),
      confirmCustody: true,
    });

    let threw = false;
    let code: string | undefined;
    try {
      await loanProgram.methods
        .disburseFromVault(new BN(50))
        .accounts({
          trdcState: f.trdcStatePda,
          loanConfig: loanConfigPda,
          vault: f.vaultPda,
          assetMint: f.assetMint,
          vaultAta: f.vaultAta,
          borrowerAta: f.borrowerAta,
          loanAuthority: loanAuthorityPda,
          borrower: f.borrower.publicKey,
          trdcProgram: trdcProgram.programId,
          vaultProgram: vaultProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          instructionsSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
          priceFeed: SystemProgram.programId,
        })
        .signers([f.borrower])
        .rpc();
    } catch (e: any) {
      threw = true;
      code = e.error?.errorCode?.code ?? e.code;
    }
    expect(
      threw,
      "standalone disburse must revert when trdc is already Active",
    ).to.eq(true);
    expect(code).to.eq("InvalidStateTransition");
  });
});
