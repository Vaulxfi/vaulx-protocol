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
      .initializeTrdcState(loanId, appraisalValue, loanAmount, dueTs, new anchor.BN(1000))
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
    const args = [loanId, new anchor.BN(1), new anchor.BN(1), new anchor.BN(1), new anchor.BN(800)];
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

describe("trdc / transitions", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.Trdc as Program<any>;
  const provider = anchor.getProvider() as anchor.AnchorProvider;

  type StateKey =
    | "pendingCustody"
    | "activeInCustody"
    | "active"
    | "renewed"
    | "repaid"
    | "overdue"
    | "defaulted"
    | "liquidated";

  const ALL_STATES: StateKey[] = [
    "pendingCustody",
    "activeInCustody",
    "active",
    "renewed",
    "repaid",
    "overdue",
    "defaulted",
    "liquidated",
  ];

  // Exactly 11 legal edges.
  const legal: Array<[StateKey, StateKey]> = [
    ["pendingCustody", "activeInCustody"],
    ["activeInCustody", "active"],
    ["active", "renewed"],
    ["active", "repaid"],
    ["active", "overdue"],
    ["renewed", "active"],
    ["renewed", "overdue"],
    ["renewed", "repaid"],
    ["overdue", "repaid"],
    ["overdue", "defaulted"],
    ["defaulted", "liquidated"],
  ];

  const legalSet = new Set(legal.map(([f, t]) => `${f}->${t}`));

  // Shortest legal walk from pendingCustody to any reachable state.
  const walks: Record<StateKey, StateKey[]> = {
    pendingCustody: [],
    activeInCustody: ["activeInCustody"],
    active: ["activeInCustody", "active"],
    renewed: ["activeInCustody", "active", "renewed"],
    repaid: ["activeInCustody", "active", "repaid"],
    overdue: ["activeInCustody", "active", "overdue"],
    defaulted: ["activeInCustody", "active", "overdue", "defaulted"],
    liquidated: ["activeInCustody", "active", "overdue", "defaulted", "liquidated"],
  };

  async function freshPda(): Promise<PublicKey> {
    const loanId = Keypair.generate().publicKey;
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("trdc_state"), loanId.toBuffer()],
      program.programId,
    );
    await program.methods
      .initializeTrdcState(
        loanId,
        new anchor.BN(1),
        new anchor.BN(1),
        new anchor.BN(1),
        new anchor.BN(800),
      )
      .accounts({
        trdcState: pda,
        payer: provider.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    return pda;
  }

  async function walkTo(pda: PublicKey, target: StateKey) {
    for (const step of walks[target]) {
      await program.methods
        .testTransition({ [step]: {} })
        .accounts({ trdcState: pda, authority: provider.publicKey })
        .rpc();
    }
  }

  it("enforces the transition table", async function () {
    this.timeout(600_000);

    for (const from of ALL_STATES) {
      for (const to of ALL_STATES) {
        const key = `${from}->${to}`;
        const pda = await freshPda();
        await walkTo(pda, from);

        if (legalSet.has(key)) {
          await program.methods
            .testTransition({ [to]: {} })
            .accounts({ trdcState: pda, authority: provider.publicKey })
            .rpc();
          const s = await program.account.trdcState.fetch(pda);
          expect(s.status, `legal ${key}`).to.deep.equal({ [to]: {} });
        } else {
          let threw = false;
          let code: string | undefined;
          try {
            await program.methods
              .testTransition({ [to]: {} })
              .accounts({ trdcState: pda, authority: provider.publicKey })
              .rpc();
          } catch (e: any) {
            threw = true;
            code = e.error?.errorCode?.code ?? e.code;
          }
          expect(threw, `illegal ${key} should revert`).to.eq(true);
          expect(code, `illegal ${key} code`).to.eq("InvalidStateTransition");
        }
      }
    }
  });

  it("test_trdc_state_transition_rejects_illegal — PendingCustody -> Liquidated reverts with InvalidStateTransition", async () => {
    const pda = await freshPda();
    // freshPda leaves the state in PendingCustody; jumping to Liquidated skips
    // ActiveInCustody/Active/Overdue/Defaulted and is not in the 11-edge legal set.
    let threw = false;
    let code: string | undefined;
    try {
      await program.methods
        .testTransition({ liquidated: {} })
        .accounts({ trdcState: pda, authority: provider.publicKey })
        .rpc();
    } catch (e: any) {
      threw = true;
      code = e.error?.errorCode?.code ?? e.code;
    }
    expect(threw).to.eq(true);
    expect(code).to.eq("InvalidStateTransition");

    const s = await program.account.trdcState.fetch(pda);
    expect(s.status).to.deep.equal({ pendingCustody: {} });
  });
});

// Task 4.2 — the deterministic SHA-256 stub `mint_trdc_cnft` was replaced by
// a real Bubblegum CPI mint. The 8 security-mitigation tests for the new ix
// live in tests/cnft-mint.spec.ts.
