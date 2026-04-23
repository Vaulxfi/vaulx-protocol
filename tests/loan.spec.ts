import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { expect } from "chai";

describe("loan / create_ccb_trdc", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const loanProgram = anchor.workspace.Loan as Program<any>;
  const trdcProgram = anchor.workspace.Trdc as Program<any>;
  const provider = anchor.getProvider() as anchor.AnchorProvider;

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
        .createCcbTrdc(loanId, new BN(100), new BN(61), nowPlus30Days(), randomAssetHint())
        .accounts({
          trdcState: trdcStatePda,
          trdcProgram: trdcProgram.programId,
          payer: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    } catch (e: any) {
      threw = true;
      code = e.error?.errorCode?.code ?? e.code;
    }
    expect(threw).to.eq(true);
    expect(code).to.eq("LtvTooHigh");
  });

  it("test_create_ccb_trdc_happy_path — 59% accepted, TRDCState in PendingCustody with non-default asset_id", async () => {
    const loanId = Keypair.generate().publicKey;
    const [trdcStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("trdc_state"), loanId.toBuffer()],
      trdcProgram.programId,
    );

    await loanProgram.methods
      .createCcbTrdc(loanId, new BN(100), new BN(59), nowPlus30Days(), randomAssetHint())
      .accounts({
        trdcState: trdcStatePda,
        trdcProgram: trdcProgram.programId,
        payer: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const state = await trdcProgram.account.trdcState.fetch(trdcStatePda);
    expect(state.status).to.deep.equal({ pendingCustody: {} });
    expect(state.loanId.toBase58()).to.eq(loanId.toBase58());
    expect(state.assetId.toBase58()).to.not.eq(PublicKey.default.toBase58());
  });
});
