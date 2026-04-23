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

describe("trdc / transitions", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.Trdc as Program<any>;
  const provider = anchor.getProvider() as anchor.AnchorProvider;

  type StateKey =
    | "pendingCustody"
    | "active"
    | "renewed"
    | "repaid"
    | "overdue"
    | "defaulted"
    | "liquidated";

  const ALL_STATES: StateKey[] = [
    "pendingCustody",
    "active",
    "renewed",
    "repaid",
    "overdue",
    "defaulted",
    "liquidated",
  ];

  // Exactly 10 legal edges.
  const legal: Array<[StateKey, StateKey]> = [
    ["pendingCustody", "active"],
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
    active: ["active"],
    renewed: ["active", "renewed"],
    repaid: ["active", "repaid"],
    overdue: ["active", "overdue"],
    defaulted: ["active", "overdue", "defaulted"],
    liquidated: ["active", "overdue", "defaulted", "liquidated"],
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
});

describe("trdc / mint_trdc_cnft", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.Trdc as Program<any>;
  const provider = anchor.getProvider();

  it("writes a deterministic non-default asset_id", async () => {
    const loanId = Keypair.generate().publicKey;
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("trdc_state"), loanId.toBuffer()], program.programId,
    );
    await program.methods
      .initializeTrdcState(loanId, new anchor.BN(1), new anchor.BN(1), new anchor.BN(1))
      .accounts({ trdcState: pda, payer: provider.publicKey, systemProgram: SystemProgram.programId })
      .rpc();

    // asset_id defaults to Pubkey::default()
    let s = await program.account.trdcState.fetch(pda);
    expect(s.assetId.toBase58()).to.eq(PublicKey.default.toBase58());

    const hint = new Uint8Array(32); hint.fill(7);
    await program.methods.mintTrdcCnft(Array.from(hint))
      .accounts({ trdcState: pda, authority: provider.publicKey })
      .rpc();

    s = await program.account.trdcState.fetch(pda);
    expect(s.assetId.toBase58()).to.not.eq(PublicKey.default.toBase58());

    // Determinism: calling again with the same hint yields the same asset_id.
    const before = s.assetId.toBase58();
    await program.methods.mintTrdcCnft(Array.from(hint))
      .accounts({ trdcState: pda, authority: provider.publicKey })
      .rpc();
    s = await program.account.trdcState.fetch(pda);
    expect(s.assetId.toBase58()).to.eq(before);
  });
});
