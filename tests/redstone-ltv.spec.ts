import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import { Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram } from "@solana/web3.js";
import { createHash } from "node:crypto";
import { expect } from "chai";
import { ensureLoanConfig } from "./_shared";

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
  });
});
