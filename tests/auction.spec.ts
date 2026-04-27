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
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccount,
  createMint,
  getAccount,
  getAssociatedTokenAddress,
  mintTo,
} from "@solana/spl-token";
import { expect } from "chai";
import { ensureLoanConfig, ensureVaultConfig, vaultConfigPda } from "./_shared";

describe("auction / default flow (Task 3.2)", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const loanProgram = anchor.workspace.Loan as Program<any>;
  const vaultProgram = anchor.workspace.Vault as Program<any>;
  const trdcProgram = anchor.workspace.Trdc as Program<any>;
  const auctionProgram = anchor.workspace.Auction as Program<any>;
  const provider = anchor.getProvider() as anchor.AnchorProvider;
  const payer = (provider.wallet as any).payer as Keypair;

  let custodian!: Keypair;
  let loanConfigPda!: PublicKey;

  function rand32(): number[] {
    const b = Buffer.alloc(32);
    for (let i = 0; i < 32; i++) b[i] = Math.floor(Math.random() * 256);
    return Array.from(b);
  }

  const GRACE_SECS = 86_400 * 3;
  const pastDueTs = () =>
    new BN(Math.floor(Date.now() / 1000) - GRACE_SECS - 60);
  const futureDueTs = () =>
    new BN(Math.floor(Date.now() / 1000) + 30 * 86400);

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

  type ActiveLoanFixture = {
    assetMint: PublicKey;
    shareMint: PublicKey;
    vaultPda: PublicKey;
    vaultAta: PublicKey;
    trdcStatePda: PublicKey;
    borrower: Keypair;
    borrowerAta: PublicKey;
    loanAmount: BN;
    rateBps: BN;
  };

  async function setupActiveLoan(opts: {
    appraisal: BN;
    loanAmount: BN;
    rateBps: BN;
    vaultLiquidity: BN;
    dueTs: BN;
  }): Promise<ActiveLoanFixture> {
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
        kycAttestation: SystemProgram.programId,
      })
      .signers([lender])
      .rpc();

    // Create TRDC with past-due `dueTs`, confirm custody, disburse -> Active.
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
        opts.dueTs,
        opts.rateBps,
        rand32(),
      )
      .accounts({
        trdcState: trdcStatePda,
        trdcProgram: trdcProgram.programId,
        payer: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
        loanConfig: loanConfigPda,
        kycAttestation: SystemProgram.programId,
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
    };
  }

  type AuctionFixture = ActiveLoanFixture & {
    auctionPda: PublicKey;
    escrowAta: PublicKey;
    reservePrice: BN;
    endTs: number;
  };

  async function defaultAndCreateAuction(
    loan: ActiveLoanFixture,
    durationSecs: number,
  ): Promise<AuctionFixture> {
    const [auctionPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("auction"), loan.trdcStatePda.toBuffer()],
      auctionProgram.programId,
    );
    const escrowAta = await getAssociatedTokenAddress(
      loan.assetMint,
      auctionPda,
      true,
    );

    const trigger = Keypair.generate();
    const sig = await provider.connection.requestAirdrop(
      trigger.publicKey,
      2 * LAMPORTS_PER_SOL,
    );
    await provider.connection.confirmTransaction(sig, "confirmed");

    await loanProgram.methods
      .executeAfDefault(new BN(durationSecs))
      .accounts({
        trdcState: loan.trdcStatePda,
        loanConfig: loanConfigPda,
        auction: auctionPda,
        assetMint: loan.assetMint,
        escrowAta,
        vault: loan.vaultPda,
        loanAuthority: loanAuthorityPda,
        payer: trigger.publicKey,
        trdcProgram: trdcProgram.programId,
        auctionProgram: auctionProgram.programId,
        instructionsSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([trigger])
      .rpc();

    const auction = await auctionProgram.account.auction.fetch(auctionPda);

    return {
      ...loan,
      auctionPda,
      escrowAta,
      reservePrice: auction.reservePrice as BN,
      endTs: (auction.endTs as BN).toNumber(),
    };
  }

  async function createFundedBidder(
    mint: PublicKey,
    fund: BN,
  ): Promise<{ bidder: Keypair; ata: PublicKey }> {
    const bidder = Keypair.generate();
    const sig = await provider.connection.requestAirdrop(
      bidder.publicKey,
      2 * LAMPORTS_PER_SOL,
    );
    await provider.connection.confirmTransaction(sig, "confirmed");
    const ata = await createAssociatedTokenAccount(
      provider.connection,
      payer,
      mint,
      bidder.publicKey,
    );
    await mintTo(
      provider.connection,
      payer,
      mint,
      ata,
      payer,
      BigInt(fund.toString()),
    );
    return { bidder, ata };
  }

  async function waitPast(endTs: number): Promise<void> {
    const nowMs = Date.now();
    const targetMs = (endTs + 2) * 1000;
    if (targetMs > nowMs) {
      await new Promise((r) => setTimeout(r, targetMs - nowMs));
    }
  }

  it("test_default_kicks_off_auction", async () => {
    const loan = await setupActiveLoan({
      appraisal: new BN("100000000000"),
      loanAmount: new BN("60000000000"),
      rateBps: new BN(1000),
      vaultLiquidity: new BN("100000000000"),
      dueTs: pastDueTs(),
    });

    const f = await defaultAndCreateAuction(loan, 4);

    const trdc = await trdcProgram.account.trdcState.fetch(f.trdcStatePda);
    expect(trdc.status).to.deep.equal({ defaulted: {} });

    const auction = await auctionProgram.account.auction.fetch(f.auctionPda);
    expect(auction.status).to.deep.equal({ open: {} });
    // Reserve = principal + accrued (accrued ≈ 0 on fast localnet).
    expect((auction.reservePrice as BN).gte(loan.loanAmount)).to.eq(true);
    expect(auction.trdcState.toBase58()).to.eq(f.trdcStatePda.toBase58());
    expect(auction.assetMint.toBase58()).to.eq(f.assetMint.toBase58());
    expect(auction.vault.toBase58()).to.eq(f.vaultPda.toBase58());
  });

  it("test_not_yet_defaulted_reverts", async () => {
    // Loan with a future due_ts; execute_af_default should fail with
    // NotYetDefaulted since we're still in Active + within grace.
    const loan = await setupActiveLoan({
      appraisal: new BN("100000000000"),
      loanAmount: new BN("60000000000"),
      rateBps: new BN(1000),
      vaultLiquidity: new BN("100000000000"),
      dueTs: futureDueTs(),
    });

    const [auctionPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("auction"), loan.trdcStatePda.toBuffer()],
      auctionProgram.programId,
    );
    const escrowAta = await getAssociatedTokenAddress(
      loan.assetMint,
      auctionPda,
      true,
    );

    const trigger = Keypair.generate();
    const sig = await provider.connection.requestAirdrop(
      trigger.publicKey,
      2 * LAMPORTS_PER_SOL,
    );
    await provider.connection.confirmTransaction(sig, "confirmed");

    let threw = false;
    let code: string | undefined;
    try {
      await loanProgram.methods
        .executeAfDefault(new BN(4))
        .accounts({
          trdcState: loan.trdcStatePda,
          loanConfig: loanConfigPda,
          auction: auctionPda,
          assetMint: loan.assetMint,
          escrowAta,
          vault: loan.vaultPda,
          loanAuthority: loanAuthorityPda,
          payer: trigger.publicKey,
          trdcProgram: trdcProgram.programId,
          auctionProgram: auctionProgram.programId,
          instructionsSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([trigger])
        .rpc();
    } catch (e: any) {
      threw = true;
      code = e.error?.errorCode?.code ?? e.code;
    }
    expect(threw, "execute_af_default should revert before grace expires").to.eq(
      true,
    );
    expect(code).to.eq("NotYetDefaulted");
  });

  it("test_bid_monotonic", async () => {
    const loan = await setupActiveLoan({
      appraisal: new BN("100000000000"),
      loanAmount: new BN("60000000000"),
      rateBps: new BN(1000),
      vaultLiquidity: new BN("100000000000"),
      dueTs: pastDueTs(),
    });
    const f = await defaultAndCreateAuction(loan, 60);

    // First bid at exactly reserve.
    const b1Fund = f.reservePrice.mul(new BN(3));
    const { bidder: b1, ata: b1Ata } = await createFundedBidder(
      f.assetMint,
      b1Fund,
    );
    await auctionProgram.methods
      .placeBid(f.reservePrice)
      .accounts({
        auction: f.auctionPda,
        assetMint: f.assetMint,
        escrowAta: f.escrowAta,
        bidderAta: b1Ata,
        previousBidderAta: b1Ata, // no prior bidder; won't be debited
        bidder: b1.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([b1])
      .rpc();

    const auction1 = await auctionProgram.account.auction.fetch(f.auctionPda);
    expect((auction1.highBid as BN).toString()).to.eq(f.reservePrice.toString());
    expect(auction1.highBidder.toBase58()).to.eq(b1.publicKey.toBase58());
    const escrow1 = await getAccount(provider.connection, f.escrowAta);
    expect(escrow1.amount.toString()).to.eq(f.reservePrice.toString());

    // Second bid at reserve (same as current high) — BidTooLow.
    const b2Fund = f.reservePrice.mul(new BN(3));
    const { bidder: b2, ata: b2Ata } = await createFundedBidder(
      f.assetMint,
      b2Fund,
    );
    {
      let threw = false;
      let code: string | undefined;
      try {
        await auctionProgram.methods
          .placeBid(f.reservePrice)
          .accounts({
            auction: f.auctionPda,
            assetMint: f.assetMint,
            escrowAta: f.escrowAta,
            bidderAta: b2Ata,
            previousBidderAta: b1Ata,
            bidder: b2.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .signers([b2])
          .rpc();
      } catch (e: any) {
        threw = true;
        code = e.error?.errorCode?.code ?? e.code;
      }
      expect(threw, "equal bid should revert").to.eq(true);
      expect(code).to.eq("BidTooLow");
    }

    // Third bid at reserve + increment — success, refund b1.
    const increment = new BN((auction1.minIncrement as BN).toString());
    const nextBid = f.reservePrice.add(increment);
    const b1BeforeRefund = (
      await getAccount(provider.connection, b1Ata)
    ).amount;

    await auctionProgram.methods
      .placeBid(nextBid)
      .accounts({
        auction: f.auctionPda,
        assetMint: f.assetMint,
        escrowAta: f.escrowAta,
        bidderAta: b2Ata,
        previousBidderAta: b1Ata,
        bidder: b2.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([b2])
      .rpc();

    const auction2 = await auctionProgram.account.auction.fetch(f.auctionPda);
    expect((auction2.highBid as BN).toString()).to.eq(nextBid.toString());
    expect(auction2.highBidder.toBase58()).to.eq(b2.publicKey.toBase58());

    const b1AfterRefund = (
      await getAccount(provider.connection, b1Ata)
    ).amount;
    expect(
      (b1AfterRefund - b1BeforeRefund).toString(),
      "prior bidder refunded",
    ).to.eq(f.reservePrice.toString());

    const escrow2 = await getAccount(provider.connection, f.escrowAta);
    expect(escrow2.amount.toString()).to.eq(nextBid.toString());

    // Fourth bid at same nextBid — BidTooLow again.
    const { bidder: b3, ata: b3Ata } = await createFundedBidder(
      f.assetMint,
      f.reservePrice.mul(new BN(3)),
    );
    let threw = false;
    let code: string | undefined;
    try {
      await auctionProgram.methods
        .placeBid(nextBid)
        .accounts({
          auction: f.auctionPda,
          assetMint: f.assetMint,
          escrowAta: f.escrowAta,
          bidderAta: b3Ata,
          previousBidderAta: b2Ata,
          bidder: b3.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([b3])
        .rpc();
    } catch (e: any) {
      threw = true;
      code = e.error?.errorCode?.code ?? e.code;
    }
    expect(threw).to.eq(true);
    expect(code).to.eq("BidTooLow");
  });

  it("test_close_auction_liquidates_trdc", async () => {
    const loan = await setupActiveLoan({
      appraisal: new BN("100000000000"),
      loanAmount: new BN("60000000000"),
      rateBps: new BN(1000),
      vaultLiquidity: new BN("100000000000"),
      dueTs: pastDueTs(),
    });
    const f = await defaultAndCreateAuction(loan, 4);

    const { bidder, ata: bidderAta } = await createFundedBidder(
      f.assetMint,
      f.reservePrice.mul(new BN(3)),
    );

    await auctionProgram.methods
      .placeBid(f.reservePrice)
      .accounts({
        auction: f.auctionPda,
        assetMint: f.assetMint,
        escrowAta: f.escrowAta,
        bidderAta,
        previousBidderAta: bidderAta,
        bidder: bidder.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([bidder])
      .rpc();

    const vaultAtaBefore = (
      await getAccount(provider.connection, f.vaultAta)
    ).amount;

    await waitPast(f.endTs);

    const caller = Keypair.generate();
    const sig = await provider.connection.requestAirdrop(
      caller.publicKey,
      LAMPORTS_PER_SOL,
    );
    await provider.connection.confirmTransaction(sig, "confirmed");

    const [auctionAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from("auction_authority")],
      auctionProgram.programId,
    );

    await auctionProgram.methods
      .closeAuction()
      .accounts({
        auction: f.auctionPda,
        trdcState: f.trdcStatePda,
        assetMint: f.assetMint,
        escrowAta: f.escrowAta,
        vaultAta: f.vaultAta,
        vault: f.vaultPda,
        auctionAuthority,
        instructionsSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
        trdcProgram: trdcProgram.programId,
        vaultProgram: vaultProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        caller: caller.publicKey,
      })
      .signers([caller])
      .rpc();

    const trdc = await trdcProgram.account.trdcState.fetch(f.trdcStatePda);
    expect(trdc.status).to.deep.equal({ liquidated: {} });

    const auction = await auctionProgram.account.auction.fetch(f.auctionPda);
    expect(auction.status).to.deep.equal({ closed: {} });

    const vaultAtaAfter = (
      await getAccount(provider.connection, f.vaultAta)
    ).amount;
    expect((vaultAtaAfter - vaultAtaBefore).toString()).to.eq(
      f.reservePrice.toString(),
    );
  });

  it("test_winning_bid_recovers_vault_capital", async () => {
    const loan = await setupActiveLoan({
      appraisal: new BN("100000000000"),
      loanAmount: new BN("60000000000"),
      rateBps: new BN(1000),
      vaultLiquidity: new BN("100000000000"),
      dueTs: pastDueTs(),
    });
    const f = await defaultAndCreateAuction(loan, 4);
    const auction0 = await auctionProgram.account.auction.fetch(f.auctionPda);
    const increment = new BN((auction0.minIncrement as BN).toString());
    const bid = f.reservePrice.add(increment);

    const { bidder, ata: bidderAta } = await createFundedBidder(
      f.assetMint,
      bid.mul(new BN(3)),
    );
    await auctionProgram.methods
      .placeBid(bid)
      .accounts({
        auction: f.auctionPda,
        assetMint: f.assetMint,
        escrowAta: f.escrowAta,
        bidderAta,
        previousBidderAta: bidderAta,
        bidder: bidder.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([bidder])
      .rpc();

    const vBefore = await vaultProgram.account.vault.fetch(f.vaultPda);

    await waitPast(f.endTs);

    const caller = Keypair.generate();
    {
      const sig = await provider.connection.requestAirdrop(
        caller.publicKey,
        LAMPORTS_PER_SOL,
      );
      await provider.connection.confirmTransaction(sig, "confirmed");
    }

    const [auctionAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from("auction_authority")],
      auctionProgram.programId,
    );

    await auctionProgram.methods
      .closeAuction()
      .accounts({
        auction: f.auctionPda,
        trdcState: f.trdcStatePda,
        assetMint: f.assetMint,
        escrowAta: f.escrowAta,
        vaultAta: f.vaultAta,
        vault: f.vaultPda,
        auctionAuthority,
        instructionsSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
        trdcProgram: trdcProgram.programId,
        vaultProgram: vaultProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        caller: caller.publicKey,
      })
      .signers([caller])
      .rpc();

    const vAfter = await vaultProgram.account.vault.fetch(f.vaultPda);
    const delta = new BN(vAfter.totalAssets.toString()).sub(
      new BN(vBefore.totalAssets.toString()),
    );
    expect(delta.toString()).to.eq(bid.toString());
  });

  it("test_auction_close_no_bids_still_liquidates", async () => {
    const loan = await setupActiveLoan({
      appraisal: new BN("100000000000"),
      loanAmount: new BN("60000000000"),
      rateBps: new BN(1000),
      vaultLiquidity: new BN("100000000000"),
      dueTs: pastDueTs(),
    });
    const f = await defaultAndCreateAuction(loan, 4);

    const vBefore = await vaultProgram.account.vault.fetch(f.vaultPda);

    await waitPast(f.endTs);

    const caller = Keypair.generate();
    {
      const sig = await provider.connection.requestAirdrop(
        caller.publicKey,
        LAMPORTS_PER_SOL,
      );
      await provider.connection.confirmTransaction(sig, "confirmed");
    }

    const [auctionAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from("auction_authority")],
      auctionProgram.programId,
    );

    await auctionProgram.methods
      .closeAuction()
      .accounts({
        auction: f.auctionPda,
        trdcState: f.trdcStatePda,
        assetMint: f.assetMint,
        escrowAta: f.escrowAta,
        vaultAta: f.vaultAta,
        vault: f.vaultPda,
        auctionAuthority,
        instructionsSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
        trdcProgram: trdcProgram.programId,
        vaultProgram: vaultProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        caller: caller.publicKey,
      })
      .signers([caller])
      .rpc();

    const trdc = await trdcProgram.account.trdcState.fetch(f.trdcStatePda);
    expect(trdc.status).to.deep.equal({ liquidated: {} });

    const vAfter = await vaultProgram.account.vault.fetch(f.vaultPda);
    expect(vAfter.totalAssets.toString()).to.eq(
      vBefore.totalAssets.toString(),
    );
  });
});
