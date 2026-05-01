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
import {
  ensureLoanConfig,
  ensureVaultConfig,
  sharedCustodian,
  vaultConfigPda,
} from "./_shared";

describe("loan / confirm_custody (atomic)", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const loanProgram = anchor.workspace.Loan as Program<any>;
  const vaultProgram = anchor.workspace.Vault as Program<any>;
  const trdcProgram = anchor.workspace.Trdc as Program<any>;
  const provider = anchor.getProvider() as anchor.AnchorProvider;
  const payer = (provider.wallet as any).payer as Keypair;

  const custodian = sharedCustodian;
  const [loanConfigPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("loan_config")],
    loanProgram.programId,
  );
  const loanAuthorityPda = PublicKey.findProgramAddressSync(
    [Buffer.from("loan_authority")],
    loanProgram.programId,
  )[0];

  function rand32(): number[] {
    const buf = Buffer.alloc(32);
    for (let i = 0; i < 32; i++) buf[i] = Math.floor(Math.random() * 256);
    return Array.from(buf);
  }

  function nowPlus30Days(): BN {
    return new BN(Math.floor(Date.now() / 1000) + 30 * 86400);
  }

  before(async () => {
    await ensureLoanConfig(loanProgram, provider);
    await ensureVaultConfig(vaultProgram, provider);
  });

  // -----------------------------------------------------------------
  // Per-test fixture: fresh asset mint + funded vault + borrower + TRDC
  // in PendingCustody, ready to be passed into the atomic confirm_custody.
  // The borrower keypair pays for createCcbTrdc so trdc_state.borrower
  // matches borrower_ata.authority — required by the atomic-only constraint
  // `token::authority = trdc_state.borrower` on confirm_custody.
  // -----------------------------------------------------------------
  type Fixture = {
    assetMint: PublicKey;
    vaultPda: PublicKey;
    vaultAta: PublicKey;
    trdcStatePda: PublicKey;
    borrower: Keypair;
    borrowerAta: PublicKey;
    loanAmount: BN;
  };

  async function setupForAtomicConfirm(): Promise<Fixture> {
    const loanAmount = new BN(50);
    const vaultLiquidity = new BN(1_000);

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

    // Lender deposit so vault.total_assets matches vault_ata balance.
    const lender = Keypair.generate();
    {
      const sig = await provider.connection.requestAirdrop(
        lender.publicKey,
        2 * LAMPORTS_PER_SOL,
      );
      await provider.connection.confirmTransaction(sig, "confirmed");
    }
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
      BigInt(vaultLiquidity.toString()),
    );
    const lenderShareAta = await createAssociatedTokenAccount(
      provider.connection,
      payer,
      shareMintKp.publicKey,
      lender.publicKey,
    );
    await vaultProgram.methods
      .deposit(vaultLiquidity)
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

    // Borrower keypair + ATA created BEFORE createCcbTrdc so trdc.borrower
    // (= createCcbTrdc payer) matches borrowerAta.authority.
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

    const loanId = Keypair.generate().publicKey;
    const [trdcStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("trdc_state"), loanId.toBuffer()],
      trdcProgram.programId,
    );
    await loanProgram.methods
      .createCcbTrdc(
        loanId,
        new BN(100),
        loanAmount,
        nowPlus30Days(),
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

    return {
      assetMint,
      vaultPda,
      vaultAta,
      trdcStatePda,
      borrower,
      borrowerAta,
      loanAmount,
    };
  }

  it("test_confirm_custody_only_by_custodian — non-custodian signer reverts", async () => {
    const f = await setupForAtomicConfirm();

    const impostor = Keypair.generate();
    {
      const sig = await provider.connection.requestAirdrop(
        impostor.publicKey,
        LAMPORTS_PER_SOL,
      );
      await provider.connection.confirmTransaction(sig, "confirmed");
    }

    let threw = false;
    let code: string | undefined;
    try {
      await loanProgram.methods
        .confirmCustody(rand32())
        .accounts({
          trdcState: f.trdcStatePda,
          loanConfig: loanConfigPda,
          trdcProgram: trdcProgram.programId,
          custodian: impostor.publicKey,
          vault: f.vaultPda,
          assetMint: f.assetMint,
          vaultAta: f.vaultAta,
          borrowerAta: f.borrowerAta,
          loanAuthority: loanAuthorityPda,
          vaultProgram: vaultProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          instructionsSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
          priceFeed: SystemProgram.programId,
        })
        .signers([impostor])
        .rpc();
    } catch (e: any) {
      threw = true;
      code = e.error?.errorCode?.code ?? e.code;
    }
    expect(threw).to.eq(true);
    expect(code).to.eq("UnauthorizedCustodian");
  });

  it("test_atomic_confirm_and_disburse_happy_path — custody flips trdc to Active and atomically disburses principal", async () => {
    const f = await setupForAtomicConfirm();

    const docHash = rand32();
    const borrowerBefore = (
      await getAccount(provider.connection, f.borrowerAta)
    ).amount;
    const vaultBefore = (await getAccount(provider.connection, f.vaultAta))
      .amount;
    const vBefore = await vaultProgram.account.vault.fetch(f.vaultPda);

    await loanProgram.methods
      .confirmCustody(docHash)
      .accounts({
        trdcState: f.trdcStatePda,
        loanConfig: loanConfigPda,
        trdcProgram: trdcProgram.programId,
        custodian: custodian.publicKey,
        vault: f.vaultPda,
        assetMint: f.assetMint,
        vaultAta: f.vaultAta,
        borrowerAta: f.borrowerAta,
        loanAuthority: loanAuthorityPda,
        vaultProgram: vaultProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        instructionsSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
        priceFeed: SystemProgram.programId,
      })
      .signers([custodian])
      .rpc();

    // The atomic ix skipped past ActiveInCustody in the same tx — observable
    // status is Active, and doc_hash was stamped on the trdc state.
    const state = await trdcProgram.account.trdcState.fetch(f.trdcStatePda);
    expect(state.status).to.deep.equal({ active: {} });
    expect(Array.from(state.docHash as number[])).to.deep.equal(docHash);

    // Funds moved from vault → borrower.
    const borrowerAfter = (
      await getAccount(provider.connection, f.borrowerAta)
    ).amount;
    const vaultAfter = (await getAccount(provider.connection, f.vaultAta))
      .amount;
    const vAfter = await vaultProgram.account.vault.fetch(f.vaultPda);

    expect((borrowerAfter - borrowerBefore).toString()).to.eq(
      f.loanAmount.toString(),
    );
    expect((vaultBefore - vaultAfter).toString()).to.eq(
      f.loanAmount.toString(),
    );
    expect(
      new BN(vBefore.totalAssets.toString())
        .sub(new BN(vAfter.totalAssets.toString()))
        .toString(),
    ).to.eq(f.loanAmount.toString());
  });
});
