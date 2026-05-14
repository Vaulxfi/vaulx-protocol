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
      .initializeTrdcState(
        loanId,
        appraisalValue,
        loanAmount,
        dueTs,
        new anchor.BN(1000),
        Array.from(Buffer.alloc(32)),
      )
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
    expect(state.rateBps.toString()).to.eq("1000");
    expect(state.principalRemaining.toString()).to.eq("25000000000");
  });

  it("rejects second initialize for same loan_id", async () => {
    const loanId = Keypair.generate().publicKey;
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("trdc_state"), loanId.toBuffer()], program.programId,
    );
    const args = [
      loanId,
      new anchor.BN(1),
      new anchor.BN(1),
      new anchor.BN(1),
      new anchor.BN(800),
      Array.from(Buffer.alloc(32)),
    ];
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

// FSM legal/illegal state-transition coverage is preserved indirectly by the
// loan/auction CPI tests (tests/loan.spec.ts, tests/repayment.spec.ts,
// tests/auction.spec.ts, tests/moments-2-3-4-e2e.spec.ts,
// tests/moments-5-9-e2e.spec.ts). The previous direct-call matrix used the
// `test_transition` ix, which V2 removes (it bypassed the V1 CPI-only gate).
// `Status::can_transition_to` (programs/trdc/src/state.rs) is unchanged Rust
// code exercised through every legitimate CPI caller.

// Task 4.2 — the deterministic SHA-256 stub `mint_trdc_cnft` was replaced by
// a real Bubblegum CPI mint. The 8 security-mitigation tests for the new ix
// live in tests/cnft-mint.spec.ts.
