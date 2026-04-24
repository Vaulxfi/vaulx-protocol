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
import { computePayoff } from "@vaulx/terms";
import { ensureLoanConfig, ensureVaultConfig, vaultConfigPda } from "./_shared";

describe("loan / repayment + renewal lifecycle (Task 3.1)", () => {
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
  const nowPlus60 = () => new BN(Math.floor(Date.now() / 1000) + 60 * 86400);

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

  // Spins up an isolated asset mint + vault, funds the vault, creates a
  // TRDC, takes it all the way to Active so repayment/renewal ixs can run.
  type Fixture = {
    assetMint: PublicKey;
    shareMint: PublicKey;
    vaultPda: PublicKey;
    vaultAta: PublicKey;
    trdcStatePda: PublicKey;
    borrower: Keypair;
    borrowerAta: PublicKey;
    loanAmount: BN;
    rateBps: BN;
    principalBefore: BN;
  };

  async function setupActiveLoan(opts: {
    appraisal: BN;
    loanAmount: BN;
    rateBps: BN;
    vaultLiquidity: BN;
    borrowerExtraFunding: BN;
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

    // Fund vault via a lender deposit.
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
        gatewayToken: SystemProgram.programId,
      })
      .signers([lender])
      .rpc();

    // Create TRDC, confirm custody, disburse -> Active.
    const loanId = Keypair.generate().publicKey;
    const [trdcStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("trdc_state"), loanId.toBuffer()],
      trdcProgram.programId,
    );
    await loanProgram.methods
      .createCcbTrdc(
        loanId,
        opts.appraisal,
        opts.loanAmount,
        nowPlus30(),
        opts.rateBps,
        rand32(),
      )
      .accounts({
        trdcState: trdcStatePda,
        trdcProgram: trdcProgram.programId,
        payer: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
        loanConfig: loanConfigPda,
        gatewayToken: SystemProgram.programId,
      })
      .rpc();

    await loanProgram.methods
      .confirmCustody(rand32())
      .accounts({
        trdcState: trdcStatePda,
        loanConfig: loanConfigPda,
        trdcProgram: trdcProgram.programId,
        custodian: custodian.publicKey,
      })
      .signers([custodian])
      .rpc();

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

    await loanProgram.methods
      .disburseFromVault(opts.loanAmount)
      .accounts({
        trdcState: trdcStatePda,
        loanConfig: loanConfigPda,
        vault: vaultPda,
        assetMint,
        vaultAta,
        borrowerAta,
        loanAuthority: loanAuthorityPda,
        borrower: borrower.publicKey,
        trdcProgram: trdcProgram.programId,
        vaultProgram: vaultProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        instructionsSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
      })
      .signers([borrower])
      .rpc();

    // Extra USDC on the borrower so they can cover interest + fees.
    if (opts.borrowerExtraFunding.gtn(0)) {
      await mintTo(
        provider.connection,
        payer,
        assetMint,
        borrowerAta,
        payer,
        BigInt(opts.borrowerExtraFunding.toString()),
      );
    }

    return {
      assetMint,
      shareMint: shareMintKp.publicKey,
      vaultPda,
      vaultAta,
      trdcStatePda,
      borrower,
      borrowerAta,
      loanAmount: opts.loanAmount,
      rateBps: opts.rateBps,
      principalBefore: opts.loanAmount,
    };
  }

  it("test_pay_installment_reduces_principal", async () => {
    const f = await setupActiveLoan({
      appraisal: new BN("100000000000"), // 100k
      loanAmount: new BN("60000000000"), //  60k (60% LTV)
      rateBps: new BN(1000),
      vaultLiquidity: new BN("100000000000"),
      borrowerExtraFunding: new BN("10000000000"),
    });

    const installment = new BN("15000000000"); // 25% of 60k
    const expectedAfter = f.loanAmount.sub(installment);

    const sig = await loanProgram.methods
      .payInstallment(installment)
      .accounts({
        trdcState: f.trdcStatePda,
        vault: f.vaultPda,
        assetMint: f.assetMint,
        vaultAta: f.vaultAta,
        borrowerAta: f.borrowerAta,
        borrower: f.borrower.publicKey,
        loanAuthority: loanAuthorityPda,
        trdcProgram: trdcProgram.programId,
        vaultProgram: vaultProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        instructionsSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
      })
      .signers([f.borrower])
      .rpc();
    await provider.connection.confirmTransaction(sig, "confirmed");

    const trdc = await trdcProgram.account.trdcState.fetch(f.trdcStatePda);
    expect(trdc.principalRemaining.toString()).to.eq(expectedAfter.toString());
    expect(trdc.status).to.deep.equal({ active: {} });

    // Event check.
    const tx = await provider.connection.getTransaction(sig, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });
    const parser = new anchor.EventParser(
      loanProgram.programId,
      loanProgram.coder,
    );
    const evts: any[] = [];
    for (const ev of parser.parseLogs(tx?.meta?.logMessages ?? [])) {
      if (ev.name === "installmentPaid") evts.push(ev.data);
    }
    expect(evts.length).to.be.greaterThan(0);
    expect(evts[0].amount.toString()).to.eq(installment.toString());
    expect(evts[0].principalRemainingAfter.toString()).to.eq(
      expectedAfter.toString(),
    );
  });

  it("test_repay_ccb_transitions_to_repaid", async () => {
    const f = await setupActiveLoan({
      appraisal: new BN("100000000000"),
      loanAmount: new BN("60000000000"),
      rateBps: new BN(1000),
      vaultLiquidity: new BN("100000000000"),
      borrowerExtraFunding: new BN("10000000000"),
    });

    const borrowerBefore = (
      await getAccount(provider.connection, f.borrowerAta)
    ).amount;
    const vaultBefore = (await getAccount(provider.connection, f.vaultAta))
      .amount;

    const sig = await loanProgram.methods
      .repayCcb()
      .accounts({
        trdcState: f.trdcStatePda,
        vault: f.vaultPda,
        assetMint: f.assetMint,
        vaultAta: f.vaultAta,
        borrowerAta: f.borrowerAta,
        borrower: f.borrower.publicKey,
        loanAuthority: loanAuthorityPda,
        trdcProgram: trdcProgram.programId,
        vaultProgram: vaultProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        instructionsSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
      })
      .signers([f.borrower])
      .rpc();
    await provider.connection.confirmTransaction(sig, "confirmed");

    const trdc = await trdcProgram.account.trdcState.fetch(f.trdcStatePda);
    expect(trdc.status).to.deep.equal({ repaid: {} });
    expect(trdc.principalRemaining.toString()).to.eq("0");

    const borrowerAfter = (
      await getAccount(provider.connection, f.borrowerAta)
    ).amount;
    const vaultAfter = (await getAccount(provider.connection, f.vaultAta))
      .amount;

    const debited = borrowerBefore - borrowerAfter;
    const credited = vaultAfter - vaultBefore;
    expect(debited).to.eq(credited);
    // Payoff is at least principal; may include a tiny accrued slice (seconds
    // between createdAt and paidAt, but on fast localnet it's usually 0 days).
    expect(debited >= BigInt(f.loanAmount.toString())).to.eq(true);

    // Event check.
    const tx = await provider.connection.getTransaction(sig, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });
    const parser = new anchor.EventParser(
      loanProgram.programId,
      loanProgram.coder,
    );
    const evts: any[] = [];
    for (const ev of parser.parseLogs(tx?.meta?.logMessages ?? [])) {
      if (ev.name === "ccbRepaid") evts.push(ev.data);
    }
    expect(evts.length).to.be.greaterThan(0);
    expect(evts[0].principalPaid.toString()).to.eq(f.loanAmount.toString());
  });

  it("test_renew_ccb_extends_due_ts", async () => {
    const f = await setupActiveLoan({
      appraisal: new BN("100000000000"),
      loanAmount: new BN("60000000000"),
      rateBps: new BN(800),
      vaultLiquidity: new BN("100000000000"),
      borrowerExtraFunding: new BN("10000000000"),
    });

    const trdcBefore = await trdcProgram.account.trdcState.fetch(
      f.trdcStatePda,
    );
    const oldDue = trdcBefore.dueTs;
    const oldCreated = trdcBefore.createdAt;

    const newDue = nowPlus60();
    const newRate = new BN(1000);
    const sig = await loanProgram.methods
      .renewCcb(new BN(60), newDue, newRate)
      .accounts({
        trdcState: f.trdcStatePda,
        vault: f.vaultPda,
        assetMint: f.assetMint,
        vaultAta: f.vaultAta,
        borrowerAta: f.borrowerAta,
        borrower: f.borrower.publicKey,
        loanAuthority: loanAuthorityPda,
        trdcProgram: trdcProgram.programId,
        vaultProgram: vaultProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        instructionsSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
      })
      .signers([f.borrower])
      .rpc();
    await provider.connection.confirmTransaction(sig, "confirmed");

    const trdc = await trdcProgram.account.trdcState.fetch(f.trdcStatePda);
    expect(trdc.status).to.deep.equal({ active: {} });
    expect(trdc.dueTs.toString()).to.eq(newDue.toString());
    expect(trdc.rateBps.toString()).to.eq(newRate.toString());
    // created_at was reset to `now` on the renewal; must be >= old created_at.
    expect(trdc.createdAt.toNumber() >= oldCreated.toNumber()).to.eq(true);
    expect(trdc.dueTs.toString()).to.not.eq(oldDue.toString());

    const tx = await provider.connection.getTransaction(sig, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });
    const parser = new anchor.EventParser(
      loanProgram.programId,
      loanProgram.coder,
    );
    const evts: any[] = [];
    for (const ev of parser.parseLogs(tx?.meta?.logMessages ?? [])) {
      if (ev.name === "ccbRenewed") evts.push(ev.data);
    }
    expect(evts.length).to.be.greaterThan(0);
    expect(evts[0].newDueTs.toString()).to.eq(newDue.toString());
    expect(evts[0].newRateBps.toString()).to.eq(newRate.toString());
  });

  it("test_payoff_math_matches_terms_package", async () => {
    // Drive the loan to Active, then compute the expected payoff via
    // @vaulx/terms::computePayoff using the TRDC's on-chain createdAt and
    // the actual paidAt timestamp we observe — must match exactly.
    const f = await setupActiveLoan({
      appraisal: new BN("100000000000"),
      loanAmount: new BN("60000000000"),
      rateBps: new BN(1200),
      vaultLiquidity: new BN("100000000000"),
      borrowerExtraFunding: new BN("10000000000"),
    });

    const borrowerBefore = (
      await getAccount(provider.connection, f.borrowerAta)
    ).amount;

    const trdcBefore = await trdcProgram.account.trdcState.fetch(
      f.trdcStatePda,
    );

    const sig = await loanProgram.methods
      .repayCcb()
      .accounts({
        trdcState: f.trdcStatePda,
        vault: f.vaultPda,
        assetMint: f.assetMint,
        vaultAta: f.vaultAta,
        borrowerAta: f.borrowerAta,
        borrower: f.borrower.publicKey,
        loanAuthority: loanAuthorityPda,
        trdcProgram: trdcProgram.programId,
        vaultProgram: vaultProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        instructionsSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
      })
      .signers([f.borrower])
      .rpc();
    await provider.connection.confirmTransaction(sig, "confirmed");

    const borrowerAfter = (
      await getAccount(provider.connection, f.borrowerAta)
    ).amount;
    const onchainPayoff = borrowerBefore - borrowerAfter;

    // Read the event to pick the exact paidAt (ts) that the program used.
    const tx = await provider.connection.getTransaction(sig, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });
    const parser = new anchor.EventParser(
      loanProgram.programId,
      loanProgram.coder,
    );
    let evt: any;
    for (const ev of parser.parseLogs(tx?.meta?.logMessages ?? [])) {
      if (ev.name === "ccbRepaid") evt = ev.data;
    }
    expect(evt, "ccbRepaid event").to.not.eq(undefined);
    const paidAt = (evt.ts as BN).toNumber();

    const expected = computePayoff(
      BigInt(f.loanAmount.toString()),
      1200,
      (trdcBefore.createdAt as BN).toNumber(),
      paidAt,
    );

    expect(onchainPayoff.toString()).to.eq(expected.toString());
    expect((evt.payoffAmount as BN).toString()).to.eq(expected.toString());
  });
});
