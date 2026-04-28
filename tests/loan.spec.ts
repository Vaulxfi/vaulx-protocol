import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { expect } from "chai";
import { ensureLoanConfig } from "./_shared";

describe("loan / create_ccb_trdc", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const loanProgram = anchor.workspace.Loan as Program<any>;
  const trdcProgram = anchor.workspace.Trdc as Program<any>;
  const provider = anchor.getProvider() as anchor.AnchorProvider;

  let loanConfigPda: PublicKey;
  before(async () => {
    const ensured = await ensureLoanConfig(loanProgram, provider);
    loanConfigPda = ensured.loanConfigPda;
  });

  function randomAssetHint(): number[] {
    const buf = Buffer.alloc(32);
    for (let i = 0; i < 32; i++) buf[i] = Math.floor(Math.random() * 256);
    return Array.from(buf);
  }

  function nowPlus30Days(): BN {
    return new BN(Math.floor(Date.now() / 1000) + 30 * 86400);
  }

  it("test_ltv_enforced_at_mint — 61% LTV is rejected with LtvTooHigh", async () => {
    const loanId = Keypair.generate().publicKey;
    const [trdcStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("trdc_state"), loanId.toBuffer()],
      trdcProgram.programId,
    );

    let threw = false;
    let code: string | undefined;
    try {
      await loanProgram.methods
        .createCcbTrdc(loanId, new BN(100), new BN(61), nowPlus30Days(), new BN(800), randomAssetHint())
        .accounts({
          trdcState: trdcStatePda,
          trdcProgram: trdcProgram.programId,
          payer: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
          loanConfig: loanConfigPda,
          kycAttestation: SystemProgram.programId,
        })
        .rpc();
    } catch (e: any) {
      threw = true;
      code = e.error?.errorCode?.code ?? e.code;
    }
    expect(threw).to.eq(true);
    expect(code).to.eq("LtvTooHigh");
  });

  it("test_create_ccb_trdc_happy_path — 59% accepted, TRDCState in PendingCustody (asset_id default until separate mint_trdc_cnft tx)", async () => {
    const loanId = Keypair.generate().publicKey;
    const [trdcStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("trdc_state"), loanId.toBuffer()],
      trdcProgram.programId,
    );

    await loanProgram.methods
      .createCcbTrdc(loanId, new BN(100), new BN(59), nowPlus30Days(), new BN(800), randomAssetHint())
      .accounts({
        trdcState: trdcStatePda,
        trdcProgram: trdcProgram.programId,
        payer: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
          loanConfig: loanConfigPda,
          kycAttestation: SystemProgram.programId,
      })
      .rpc();

    const state = await trdcProgram.account.trdcState.fetch(trdcStatePda);
    expect(state.status).to.deep.equal({ pendingCustody: {} });
    expect(state.loanId.toBase58()).to.eq(loanId.toBase58());
    // Task 4.2 decoupled mint from create_ccb_trdc — the cNFT is minted in a
    // separate tx via `trdc.mint_trdc_cnft`, so asset_id stays default here.
    expect(state.assetId.toBase58()).to.eq(PublicKey.default.toBase58());
  });

  it("test_ltv_exactly_at_limit_accepted — 60.00% LTV (60k/100k USDC @ 6dp) succeeds", async () => {
    const loanId = Keypair.generate().publicKey;
    const [trdcStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("trdc_state"), loanId.toBuffer()],
      trdcProgram.programId,
    );

    const appraisalValue = new BN("100000000000"); // 100k USDC @ 6dp
    const loanAmount = new BN("60000000000"); // 60k USDC @ 6dp → exactly 60.00%

    // No throw expected: the inclusive-equality branch of the LTV check accepts this.
    await loanProgram.methods
      .createCcbTrdc(loanId, appraisalValue, loanAmount, nowPlus30Days(), new BN(800), randomAssetHint())
      .accounts({
        trdcState: trdcStatePda,
        trdcProgram: trdcProgram.programId,
        payer: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
          loanConfig: loanConfigPda,
          kycAttestation: SystemProgram.programId,
      })
      .rpc();

    const state = await trdcProgram.account.trdcState.fetch(trdcStatePda);
    expect(state.status).to.deep.equal({ pendingCustody: {} });
    expect(state.loanAmount.toString()).to.eq(loanAmount.toString());
    expect(state.appraisalValue.toString()).to.eq(appraisalValue.toString());
  });

  it("test_ccb_create_requires_nonzero_amount — loan_amount=0 reverts with ZeroAmount", async () => {
    const loanId = Keypair.generate().publicKey;
    const [trdcStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("trdc_state"), loanId.toBuffer()],
      trdcProgram.programId,
    );

    let threw = false;
    let code: string | undefined;
    try {
      await loanProgram.methods
        .createCcbTrdc(loanId, new BN(100), new BN(0), nowPlus30Days(), new BN(800), randomAssetHint())
        .accounts({
          trdcState: trdcStatePda,
          trdcProgram: trdcProgram.programId,
          payer: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
          loanConfig: loanConfigPda,
          kycAttestation: SystemProgram.programId,
        })
        .rpc();
    } catch (e: any) {
      threw = true;
      code = e.error?.errorCode?.code ?? e.code;
    }
    expect(threw).to.eq(true);
    expect(code).to.eq("ZeroAmount");
  });
});
