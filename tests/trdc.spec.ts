import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { expect } from "chai";

describe("trdc / initialize_trdc_state", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.Trdc as Program<any>;
  const provider = anchor.getProvider();

  it("creates a TRDCState PDA in PendingCustody", async () => {
    const loanId = Keypair.generate().publicKey;
    const [trdcStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("trdc_state"), loanId.toBuffer()],
      program.programId,
    );
    const appraisalValue = new anchor.BN(50_000_000_000); // 50k @ 6dp
    const loanAmount     = new anchor.BN(25_000_000_000); // 25k @ 6dp (50% LTV)
    const dueTs          = new anchor.BN(Math.floor(Date.now() / 1000) + 120 * 86400);

    await program.methods
      .initializeTrdcState(loanId, appraisalValue, loanAmount, dueTs)
      .accounts({
        trdcState: trdcStatePda,
        payer: provider.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const state = await program.account.trdcState.fetch(trdcStatePda);
    expect(state.loanId.toBase58()).to.eq(loanId.toBase58());
    expect(state.status).to.deep.equal({ pendingCustody: {} });
    expect(state.loanAmount.toString()).to.eq("25000000000");
    expect(state.appraisalValue.toString()).to.eq("50000000000");
  });

  it("rejects second initialize for same loan_id", async () => {
    const loanId = Keypair.generate().publicKey;
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("trdc_state"), loanId.toBuffer()], program.programId,
    );
    const args = [loanId, new anchor.BN(1), new anchor.BN(1), new anchor.BN(1)];
    await program.methods.initializeTrdcState(...args)
      .accounts({ trdcState: pda, payer: provider.publicKey, systemProgram: SystemProgram.programId })
      .rpc();
    let threw = false;
    try {
      await program.methods.initializeTrdcState(...args)
        .accounts({ trdcState: pda, payer: provider.publicKey, systemProgram: SystemProgram.programId })
        .rpc();
    } catch { threw = true; }
    expect(threw).to.eq(true);
  });
});
