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
  mintTo,
} from "@solana/spl-token";
import { createHash } from "node:crypto";
import { expect } from "chai";
import { ensureLoanConfig, ensureVaultConfig, vaultConfigPda } from "./_shared";

// Item 5 — RedStone-pattern price feed.
//
// Coverage map (auditor checklist, mirrors `programs/loan/src/lib.rs`):
//   - publish happy path                                 → test 1
//   - SR-3/SR-4 wrong-signer publish                      → test 2
//   - SR-3/SR-4 oracle uninitialised publish              → test 3
//   - SR-1 future timestamp                               → test 4
//   - SR-1 stale (> MAX_AGE_SECONDS) timestamp            → test 5
//   - end-to-end LTV check sources from on-chain feed     → test 6
//
// `loan_config` is a singleton PDA shared across spec files. To keep the
// rest of the suite green we ALWAYS revert `oracle_admin` back to
// `Pubkey::default()` in the after-hook so downstream tests
// (`repayment.spec.ts`, `vault.spec.ts`, etc.) run in the legacy-appraisal
// path they were written for.

function refBytesFor(ref: string): number[] {
  return Array.from(createHash("sha256").update(ref).digest());
}

function priceFeedPda(
  loanProgramId: PublicKey,
  refBytes: number[],
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("price_feed"), Buffer.from(refBytes)],
    loanProgramId,
  );
}

describe("loan / redstone-pattern price feed (Item 5)", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const loanProgram = anchor.workspace.Loan as Program<any>;
  const trdcProgram = anchor.workspace.Trdc as Program<any>;
  const provider = anchor.getProvider() as anchor.AnchorProvider;
  const adminWallet = (provider.wallet as any).payer as Keypair;

  let loanConfigPda: PublicKey;

  // Each test that needs a fresh feed picks its own ref string so the PDA
  // is unique and `init_if_needed` doesn't collide with prior runs.
  const REF_HAPPY = "test:happy:" + Date.now();
  const REF_LTV = "test:ltv:" + Date.now();

  before(async () => {
    const ensured = await ensureLoanConfig(loanProgram, provider);
    loanConfigPda = ensured.loanConfigPda;
  });

  after(async () => {
    // Always reset `oracle_admin` to default so the rest of the suite runs
    // in legacy mode.
    try {
      await loanProgram.methods
        .setOracleAdmin(PublicKey.default)
        .accounts({
          loanConfig: loanConfigPda,
          admin: adminWallet.publicKey,
        })
        .rpc();
    } catch (err) {
      console.error("[redstone-ltv after-hook] reset failed:", err);
    }
  });

  async function setOracleAdminTo(target: Keypair) {
    await loanProgram.methods
      .setOracleAdmin(target.publicKey)
      .accounts({
        loanConfig: loanConfigPda,
        admin: adminWallet.publicKey,
      })
      .rpc();
  }

  async function unsetOracleAdmin() {
    await loanProgram.methods
      .setOracleAdmin(PublicKey.default)
      .accounts({
        loanConfig: loanConfigPda,
        admin: adminWallet.publicKey,
      })
      .rpc();
  }

  async function airdrop(kp: Keypair) {
    const sig = await provider.connection.requestAirdrop(
      kp.publicKey,
      2 * LAMPORTS_PER_SOL,
    );
    await provider.connection.confirmTransaction(sig, "confirmed");
  }

  it("test_publish_price_succeeds_for_oracle_admin (happy path — SR-1/3/4/5/6)", async () => {
    const oracleKp = Keypair.generate();
    await airdrop(oracleKp);
    await setOracleAdminTo(oracleKp);

    const ref = REF_HAPPY + ":1";
    const refBytes = refBytesFor(ref);
    const [feedPda] = priceFeedPda(loanProgram.programId, refBytes);
    const observedAt = new BN(Math.floor(Date.now() / 1000) - 5); // 5s ago
    const cents = new BN(15_000_00); // $15,000
    const listings = 7;

    await loanProgram.methods
      .publishPrice(refBytes, cents, listings, observedAt)
      .accounts({
        priceFeed: feedPda,
        loanConfig: loanConfigPda,
        oracleAdmin: oracleKp.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([oracleKp])
      .rpc();

    const feed = await loanProgram.account.priceFeed.fetch(feedPda);
    expect(feed.medianUsdCents.toString()).to.eq("1500000");
    expect(feed.listings).to.eq(listings);
    expect(feed.publishedBy.toBase58()).to.eq(oracleKp.publicKey.toBase58());
    expect(Buffer.from(feed.refBytes)).to.deep.equal(Buffer.from(refBytes));

    await unsetOracleAdmin();
  });

  it("test_publish_price_rejected_when_not_oracle_admin (SR-3 / SR-4)", async () => {
    const oracleKp = Keypair.generate();
    const attackerKp = Keypair.generate();
    await Promise.all([airdrop(oracleKp), airdrop(attackerKp)]);
    await setOracleAdminTo(oracleKp);

    const ref = "redstone:wrong-signer:" + Date.now();
    const refBytes = refBytesFor(ref);
    const [feedPda] = priceFeedPda(loanProgram.programId, refBytes);

    let threw = false;
    let code: string | undefined;
    try {
      await loanProgram.methods
        .publishPrice(
          refBytes,
          new BN(1_000_000),
          5,
          new BN(Math.floor(Date.now() / 1000)),
        )
        .accounts({
          priceFeed: feedPda,
          loanConfig: loanConfigPda,
          oracleAdmin: attackerKp.publicKey, // not the bound oracle_admin
          systemProgram: SystemProgram.programId,
        })
        .signers([attackerKp])
        .rpc();
    } catch (e: any) {
      threw = true;
      code = e.error?.errorCode?.code ?? e.code;
    }
    expect(threw).to.eq(true);
    expect(code).to.eq("InvalidOracle");

    await unsetOracleAdmin();
  });

  it("test_publish_price_rejected_when_oracle_not_initialized (SR-3 / SR-4)", async () => {
    // Confirm starting state: oracle_admin is default (after-hook of prior
    // test reset it).
    const cfg = await loanProgram.account.loanConfig.fetch(loanConfigPda);
    expect(cfg.oracleAdmin.toBase58()).to.eq(PublicKey.default.toBase58());

    const oracleKp = Keypair.generate();
    await airdrop(oracleKp);

    const ref = "redstone:uninit:" + Date.now();
    const refBytes = refBytesFor(ref);
    const [feedPda] = priceFeedPda(loanProgram.programId, refBytes);

    let threw = false;
    let code: string | undefined;
    try {
      await loanProgram.methods
        .publishPrice(
          refBytes,
          new BN(1_000_000),
          5,
          new BN(Math.floor(Date.now() / 1000)),
        )
        .accounts({
          priceFeed: feedPda,
          loanConfig: loanConfigPda,
          oracleAdmin: oracleKp.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([oracleKp])
        .rpc();
    } catch (e: any) {
      threw = true;
      code = e.error?.errorCode?.code ?? e.code;
    }
    expect(threw).to.eq(true);
    expect(code).to.eq("OracleNotInitialized");
  });

  it("test_publish_price_rejected_when_observed_at_in_future (SR-1)", async () => {
    const oracleKp = Keypair.generate();
    await airdrop(oracleKp);
    await setOracleAdminTo(oracleKp);

    const ref = "redstone:future:" + Date.now();
    const refBytes = refBytesFor(ref);
    const [feedPda] = priceFeedPda(loanProgram.programId, refBytes);
    // 1 hour in the future — well past any expected validator clock skew.
    const futureTs = new BN(Math.floor(Date.now() / 1000) + 3600);

    let threw = false;
    let code: string | undefined;
    try {
      await loanProgram.methods
        .publishPrice(refBytes, new BN(1_000_000), 5, futureTs)
        .accounts({
          priceFeed: feedPda,
          loanConfig: loanConfigPda,
          oracleAdmin: oracleKp.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([oracleKp])
        .rpc();
    } catch (e: any) {
      threw = true;
      code = e.error?.errorCode?.code ?? e.code;
    }
    expect(threw).to.eq(true);
    expect(code).to.eq("FuturePrice");

    await unsetOracleAdmin();
  });

  it("test_publish_price_rejected_when_observed_at_too_old (SR-1)", async () => {
    const oracleKp = Keypair.generate();
    await airdrop(oracleKp);
    await setOracleAdminTo(oracleKp);

    const ref = "redstone:stale:" + Date.now();
    const refBytes = refBytesFor(ref);
    const [feedPda] = priceFeedPda(loanProgram.programId, refBytes);
    // 1 hour ago — > MAX_AGE_SECONDS (600s).
    const staleTs = new BN(Math.floor(Date.now() / 1000) - 3600);

    let threw = false;
    let code: string | undefined;
    try {
      await loanProgram.methods
        .publishPrice(refBytes, new BN(1_000_000), 5, staleTs)
        .accounts({
          priceFeed: feedPda,
          loanConfig: loanConfigPda,
          oracleAdmin: oracleKp.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([oracleKp])
        .rpc();
    } catch (e: any) {
      threw = true;
      code = e.error?.errorCode?.code ?? e.code;
    }
    expect(threw).to.eq(true);
    expect(code).to.eq("StalePrice");

    await unsetOracleAdmin();
  });

  it("test_create_ccb_trdc_uses_published_price_for_ltv (end-to-end SR-1/2/5/6)", async () => {
    const oracleKp = Keypair.generate();
    await airdrop(oracleKp);
    await setOracleAdminTo(oracleKp);

    // Publish a price for a unique ref. $50,000 (5,000,000 cents) ->
    // 50,000 USDC atoms-equivalent = 50_000_000_000 (6dp). At 60% LTV cap
    // the maximum loan is 30,000 USDC = 30_000_000_000 atoms.
    const ref = REF_LTV;
    const refBytes = refBytesFor(ref);
    const [feedPda] = priceFeedPda(loanProgram.programId, refBytes);
    const observedAt = new BN(Math.floor(Date.now() / 1000) - 5);
    const medianCents = new BN(50_000_00); // $50,000

    await loanProgram.methods
      .publishPrice(refBytes, medianCents, 5, observedAt)
      .accounts({
        priceFeed: feedPda,
        loanConfig: loanConfigPda,
        oracleAdmin: oracleKp.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([oracleKp])
      .rpc();

    // Loan attempt above the cap (using the FEED's appraisal, not the ix arg):
    // 60% of 50_000_000_000 = 30_000_000_000. Try 31_000_000_000 -> reject.
    const overCapLoanId = Keypair.generate().publicKey;
    const [overCapTrdcPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("trdc_state"), overCapLoanId.toBuffer()],
      trdcProgram.programId,
    );
    let threw = false;
    let code: string | undefined;
    try {
      await loanProgram.methods
        .createCcbTrdc(
          overCapLoanId,
          // The ix arg is *ignored* when the oracle is on — the program
          // derives `effective_appraisal` from the feed. We pass a wildly
          // generous value here to prove the feed is what gates the LTV.
          new BN("9999999999999"),
          new BN("31000000000"),
          new BN(Math.floor(Date.now() / 1000) + 30 * 86400),
          new BN(800),
          refBytes,
        )
        .accounts({
          trdcState: overCapTrdcPda,
          trdcProgram: trdcProgram.programId,
          payer: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
          loanConfig: loanConfigPda,
          kycAttestation: SystemProgram.programId,
          priceFeed: feedPda,
        })
        .rpc();
    } catch (e: any) {
      threw = true;
      code = e.error?.errorCode?.code ?? e.code;
    }
    expect(threw, "loan above feed-derived 60% cap should be rejected").to.eq(
      true,
    );
    expect(code).to.eq("LtvTooHigh");

    // Loan exactly at the cap should succeed and the trdc_state should
    // record the FEED's appraisal value (50_000 USDC atoms-eq), not the
    // generous bogus arg.
    const okLoanId = Keypair.generate().publicKey;
    const [okTrdcPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("trdc_state"), okLoanId.toBuffer()],
      trdcProgram.programId,
    );
    await loanProgram.methods
      .createCcbTrdc(
        okLoanId,
        new BN("9999999999999"),
        new BN("30000000000"),
        new BN(Math.floor(Date.now() / 1000) + 30 * 86400),
        new BN(800),
        refBytes,
      )
      .accounts({
        trdcState: okTrdcPda,
        trdcProgram: trdcProgram.programId,
        payer: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
        loanConfig: loanConfigPda,
        kycAttestation: SystemProgram.programId,
        priceFeed: feedPda,
      })
      .rpc();

    const okState = await trdcProgram.account.trdcState.fetch(okTrdcPda);
    // $50,000 = 5_000_000 cents. cents * 10^4 = 50_000_000_000 USDC atoms (6dp).
    // The on-chain `effective_appraisal` is what we expect to land in
    // `trdc_state.appraisal_value` — not the wildly-generous ix arg.
    expect(okState.appraisalValue.toString()).to.eq("50000000000");
    expect(okState.loanAmount.toString()).to.eq("30000000000");
    // SR-2 (price-feed binding) — `create_ccb_trdc` must persist the same
    // ref_bytes that gated the LTV check on the TRDCState. Without this
    // binding `disburse_from_vault` couldn't re-derive the canonical PriceFeed
    // PDA and an attacker could substitute a different watch's feed.
    expect(Buffer.from(okState.refBytes)).to.deep.equal(Buffer.from(refBytes));
  });

  // ----------------------------------------------------------------------
  // SR-2 (price-feed binding) — the gap closed in this commit.
  //
  // Before: `disburse_from_vault` checked the feed account was program-owned,
  // signed by oracle_admin, fresh, and had ≥ 3 listings. It did NOT check the
  // feed was for the watch the TRDC was minted against. An attacker could
  // wait for a legit Rolex 126610LN feed and use it to over-collateralise a
  // TRDC for a cheaper Rolex 126610.
  //
  // After: TRDCState.ref_bytes is captured at create_ccb_trdc and
  // disburse_from_vault re-derives the canonical PriceFeed PDA from it,
  // address-checking the supplied account.
  // ----------------------------------------------------------------------

  it("test_create_ccb_trdc_writes_ref_bytes_to_trdc_state (SR-2)", async () => {
    const oracleKp = Keypair.generate();
    await airdrop(oracleKp);
    await setOracleAdminTo(oracleKp);

    const ref = "redstone:writes-ref-bytes:" + Date.now();
    const refBytes = refBytesFor(ref);
    const [feedPda] = priceFeedPda(loanProgram.programId, refBytes);
    const observedAt = new BN(Math.floor(Date.now() / 1000) - 5);

    await loanProgram.methods
      .publishPrice(refBytes, new BN(50_000_00), 5, observedAt)
      .accounts({
        priceFeed: feedPda,
        loanConfig: loanConfigPda,
        oracleAdmin: oracleKp.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([oracleKp])
      .rpc();

    const loanId = Keypair.generate().publicKey;
    const [trdcStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("trdc_state"), loanId.toBuffer()],
      trdcProgram.programId,
    );
    await loanProgram.methods
      .createCcbTrdc(
        loanId,
        new BN("9999999999999"),
        new BN("1000000000"),
        new BN(Math.floor(Date.now() / 1000) + 30 * 86400),
        new BN(800),
        refBytes,
      )
      .accounts({
        trdcState: trdcStatePda,
        trdcProgram: trdcProgram.programId,
        payer: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
        loanConfig: loanConfigPda,
        kycAttestation: SystemProgram.programId,
        priceFeed: feedPda,
      })
      .rpc();

    const state = await trdcProgram.account.trdcState.fetch(trdcStatePda);
    expect(Buffer.from(state.refBytes)).to.deep.equal(Buffer.from(refBytes));

    await unsetOracleAdmin();
  });

  it("wrong_feed_at_atomic_confirm_reverts (SR-2)", async () => {
    const vaultProgram = anchor.workspace.Vault as Program<any>;
    await ensureVaultConfig(vaultProgram, provider);
    const loanAuthorityPda = PublicKey.findProgramAddressSync(
      [Buffer.from("loan_authority")],
      loanProgram.programId,
    )[0];

    const oracleKp = Keypair.generate();
    await airdrop(oracleKp);
    await setOracleAdminTo(oracleKp);

    // Two legit feeds, both fresh, both ≥ 3 listings, both signed by the
    // current oracle_admin. The mismatch test wins ONLY because of the new
    // PDA-derivation binding — every other check passes.
    const refA = "redstone:mismatch:A:" + Date.now();
    const refB = "redstone:mismatch:B:" + Date.now();
    const refBytesA = refBytesFor(refA);
    const refBytesB = refBytesFor(refB);
    const [feedPdaA] = priceFeedPda(loanProgram.programId, refBytesA);
    const [feedPdaB] = priceFeedPda(loanProgram.programId, refBytesB);
    const observedAt = new BN(Math.floor(Date.now() / 1000) - 5);
    // Make A more expensive than B so the substitution attempt would be
    // economically interesting (would let the borrower over-collateralise).
    const centsA = new BN(100_000_00); // $100k
    const centsB = new BN(50_000_00); //  $50k

    for (const [bytes, pda, cents] of [
      [refBytesA, feedPdaA, centsA] as const,
      [refBytesB, feedPdaB, centsB] as const,
    ]) {
      await loanProgram.methods
        .publishPrice(bytes, cents, 5, observedAt)
        .accounts({
          priceFeed: pda,
          loanConfig: loanConfigPda,
          oracleAdmin: oracleKp.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([oracleKp])
        .rpc();
    }

    // ------------------------------------------------------------------
    // Stand up a vault + asset mint so the disburse ix gets past Anchor's
    // account loading. The SR-2 binding fires before the vault CPI, so the
    // vault doesn't need to actually disburse — the test passes when the ix
    // reverts with `InvalidOracle`.
    // ------------------------------------------------------------------
    const assetMint = await createMint(
      provider.connection,
      adminWallet,
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
      adminWallet,
      assetMint,
      vaultPda,
      undefined,
      undefined,
      undefined,
      true,
    );
    // Fund the vault — not strictly required (we expect pre-CPI revert) but
    // makes the test resilient to the SR-2 check moving in future patches.
    const lender = Keypair.generate();
    const lenderAirdropSig = await provider.connection.requestAirdrop(
      lender.publicKey,
      2 * LAMPORTS_PER_SOL,
    );
    await provider.connection.confirmTransaction(lenderAirdropSig, "confirmed");
    const lenderAta = await createAssociatedTokenAccount(
      provider.connection,
      adminWallet,
      assetMint,
      lender.publicKey,
    );
    await mintTo(
      provider.connection,
      adminWallet,
      assetMint,
      lenderAta,
      adminWallet,
      BigInt("100000000000"),
    );
    const lenderShareAta = await createAssociatedTokenAccount(
      provider.connection,
      adminWallet,
      shareMintKp.publicKey,
      lender.publicKey,
    );
    await vaultProgram.methods
      .deposit(new BN("100000000000"))
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

    // Borrower keypair + ATA created BEFORE createCcbTrdc — atomic confirm
    // requires borrowerAta.authority == trdc.borrower.
    const borrower = Keypair.generate();
    {
      const sigBorrower = await provider.connection.requestAirdrop(
        borrower.publicKey,
        2 * LAMPORTS_PER_SOL,
      );
      await provider.connection.confirmTransaction(sigBorrower, "confirmed");
    }
    const borrowerAta = await createAssociatedTokenAccount(
      provider.connection,
      adminWallet,
      assetMint,
      borrower.publicKey,
    );

    const { custodian } = await ensureLoanConfig(loanProgram, provider);

    // Sanity — TRDC bound to refB; atomic confirm with the MATCHING feed
    // (refB) succeeds. The oracle re-check inside do_atomic_disburse passes
    // because the feed PDA derives from trdc.ref_bytes (= refBytesB).
    const loanId = Keypair.generate().publicKey;
    const [trdcStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("trdc_state"), loanId.toBuffer()],
      trdcProgram.programId,
    );
    await loanProgram.methods
      .createCcbTrdc(
        loanId,
        new BN("9999999999999"),
        new BN("1000000000"),
        new BN(Math.floor(Date.now() / 1000) + 30 * 86400),
        new BN(800),
        refBytesB,
      )
      .accounts({
        trdcState: trdcStatePda,
        trdcProgram: trdcProgram.programId,
        payer: borrower.publicKey,
        systemProgram: SystemProgram.programId,
        loanConfig: loanConfigPda,
        kycAttestation: SystemProgram.programId,
        priceFeed: feedPdaB,
      })
      .signers([borrower])
      .rpc();

    await loanProgram.methods
      .confirmCustody(Array.from(Buffer.alloc(32)))
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
        priceFeed: feedPdaB,
      })
      .signers([custodian])
      .rpc();

    // Substitution attack — second TRDC bound to refB; try atomic confirm
    // with feedPdaA (wrong feed). The oracle re-check inside
    // do_atomic_disburse re-derives the canonical PriceFeed PDA from
    // trdc.ref_bytes and rejects the supplied feedPdaA at the address
    // check, before any token movement. Pre-atomic refactor this test
    // lived on disburse_from_vault; it now exercises the same SR-2 binding
    // at confirm-and-disburse time.
    const loanId2 = Keypair.generate().publicKey;
    const [trdcStatePda2] = PublicKey.findProgramAddressSync(
      [Buffer.from("trdc_state"), loanId2.toBuffer()],
      trdcProgram.programId,
    );
    await loanProgram.methods
      .createCcbTrdc(
        loanId2,
        new BN("9999999999999"),
        new BN("1000000000"),
        new BN(Math.floor(Date.now() / 1000) + 30 * 86400),
        new BN(800),
        refBytesB,
      )
      .accounts({
        trdcState: trdcStatePda2,
        trdcProgram: trdcProgram.programId,
        payer: borrower.publicKey,
        systemProgram: SystemProgram.programId,
        loanConfig: loanConfigPda,
        kycAttestation: SystemProgram.programId,
        priceFeed: feedPdaB,
      })
      .signers([borrower])
      .rpc();

    let threw = false;
    let code: string | undefined;
    try {
      await loanProgram.methods
        .confirmCustody(Array.from(Buffer.alloc(32)))
        .accounts({
          trdcState: trdcStatePda2,
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
          priceFeed: feedPdaA, // <-- wrong feed for refB-bound TRDC
        })
        .signers([custodian])
        .rpc();
    } catch (e: any) {
      threw = true;
      code = e.error?.errorCode?.code ?? e.code;
    }
    expect(threw, "wrong-feed atomic confirm must revert").to.eq(true);
    expect(code).to.eq("InvalidOracle");

    await unsetOracleAdmin();
  });
});
