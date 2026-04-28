// Task 4.2 — `mint_trdc_cnft` security mitigation matrix (8 SRs / 8 tests).
//
// This spec exercises the new Bubblegum-CPI mint against a tree created on
// the local validator (Anchor's test harness). It does NOT touch devnet and
// does NOT depend on a tree pre-existing — every test (re)uses the same
// merkle tree spun up in the `before` block.
//
// The 8 tests map 1:1 to the 8 security requirements:
//
//   T1  test_mint_succeeds_for_valid_loan         (SR-1, SR-3, SR-5, SR-6)
//   T2  test_mint_rejected_when_loan_state_wrong  (SR-2 FSM gate)
//   T3  test_mint_rejected_when_borrower_mismatch (SR-2 borrower check)
//   T4  test_double_mint_rejected                 (SR-2 idempotency)
//   T5  test_wrong_merkle_tree_rejected           (SR-4 merkle_tree pin)
//   T6  test_wrong_bubblegum_program_rejected     (SR-4 program pin)
//   T7  test_distinct_asset_ids                   (SR-3 deterministic id)
//   T8  test_tree_authority_pda_is_program_owned  (SR-1 PDA creator)
//
// SR-7 (no admin override) and SR-8 (tree exhaustion) are checked by static
// audit + the absence of any admin-mint ix in the IDL. SR-7 is verified at
// the end via an IDL-shape assertion; SR-8 is exercised statically (filling
// 16,384 leaves on a localnet validator is not feasible inside a unit test).
import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import {
  getConcurrentMerkleTreeAccountSize,
  SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
  SPL_NOOP_PROGRAM_ID,
} from "@solana/spl-account-compression";
import { expect } from "chai";
import { ensureLoanConfig } from "./_shared";

const BUBBLEGUM_PROGRAM_ID = new PublicKey(
  "BGUMAp9Gq7iTEuizy4pqaxsTyUCBK68MDfK752saRPUY",
);
const TRDC_TREE_AUTHORITY_SEED = Buffer.from("trdc_tree_authority");
const TRDC_CONFIG_SEED = Buffer.from("trdc_config");

const TREE_MAX_DEPTH = 14;
const TREE_MAX_BUFFER = 64;
const TREE_CANOPY = 9;

describe("trdc / mint_trdc_cnft (Task 4.2 — 8 security mitigations)", function () {
  this.timeout(180_000);

  anchor.setProvider(anchor.AnchorProvider.env());
  const trdcProgram = anchor.workspace.Trdc as Program<any>;
  const loanProgram = anchor.workspace.Loan as Program<any>;
  const provider = anchor.getProvider() as anchor.AnchorProvider;

  let loanConfigPda: PublicKey;
  let merkleTree: PublicKey;
  let bubblegumTreeConfig: PublicKey;
  let trdcConfigPda: PublicKey;
  let treeAuthorityPda: PublicKey;

  function randomAssetHint(): number[] {
    const buf = Buffer.alloc(32);
    for (let i = 0; i < 32; i++) buf[i] = Math.floor(Math.random() * 256);
    return Array.from(buf);
  }

  function nowPlus30Days(): BN {
    return new BN(Math.floor(Date.now() / 1000) + 30 * 86400);
  }

  async function airdrop(pk: PublicKey, sol = 5) {
    const sig = await provider.connection.requestAirdrop(
      pk,
      sol * LAMPORTS_PER_SOL,
    );
    await provider.connection.confirmTransaction(sig, "confirmed");
  }

  // Spin up: loan_config (idempotent) + a single merkle tree shared across
  // tests (one tree has plenty of capacity for the handful of mints we do).
  before(async () => {
    const ensured = await ensureLoanConfig(loanProgram, provider);
    loanConfigPda = ensured.loanConfigPda;

    [trdcConfigPda] = PublicKey.findProgramAddressSync(
      [TRDC_CONFIG_SEED],
      trdcProgram.programId,
    );
    [treeAuthorityPda] = PublicKey.findProgramAddressSync(
      [TRDC_TREE_AUTHORITY_SEED],
      trdcProgram.programId,
    );

    // Allocate a fresh tree account owned by spl-account-compression.
    const treeKp = Keypair.generate();
    merkleTree = treeKp.publicKey;
    const size = getConcurrentMerkleTreeAccountSize(
      TREE_MAX_DEPTH,
      TREE_MAX_BUFFER,
      TREE_CANOPY,
    );
    const rent = await provider.connection.getMinimumBalanceForRentExemption(size);
    [bubblegumTreeConfig] = PublicKey.findProgramAddressSync(
      [merkleTree.toBuffer()],
      BUBBLEGUM_PROGRAM_ID,
    );

    const allocTx = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: provider.wallet.publicKey,
        newAccountPubkey: merkleTree,
        lamports: rent,
        space: size,
        programId: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
      }),
    );
    await provider.sendAndConfirm(allocTx, [treeKp]);

    // init_merkle_tree — the trdc-program PDA becomes tree_creator/delegate.
    await trdcProgram.methods
      .initMerkleTree(TREE_MAX_DEPTH, TREE_MAX_BUFFER, false)
      .accounts({
        treeAuthority: treeAuthorityPda,
        treeConfig: bubblegumTreeConfig,
        merkleTree,
        payer: provider.wallet.publicKey,
        logWrapper: SPL_NOOP_PROGRAM_ID,
        compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
        bubblegumProgram: BUBBLEGUM_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    // init_trdc_config — pin merkle_tree on the singleton config PDA.
    // First-writer-wins: if a previous spec already initialized it (or it's
    // already pinned to a different tree from a parallel run), we re-derive
    // a new pubkey-of-pda and skip. In a single-test-run scenario this is
    // a no-op on the first call.
    const existing = await (trdcProgram.account as any).trdcConfig.fetchNullable(
      trdcConfigPda,
    );
    if (!existing) {
      await trdcProgram.methods
        .initTrdcConfig(merkleTree)
        .accounts({
          trdcConfig: trdcConfigPda,
          admin: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    } else if (existing.merkleTree.toBase58() !== merkleTree.toBase58()) {
      // Sanity guard: if a stale config points elsewhere, fail loudly. This
      // can only happen when the validator state is shared across runs and
      // the previous run used a different tree pubkey — not the case in a
      // standard `anchor test` invocation.
      throw new Error(
        `trdc_config already pinned to ${existing.merkleTree.toBase58()}; ` +
          `expected ${merkleTree.toBase58()}. Restart anchor test.`,
      );
    }
  });

  /** Initialise a fresh TRDCState owned by `borrower` and return its PDA. */
  async function initTrdcStateFor(borrower: Keypair): Promise<{
    loanId: PublicKey;
    trdcStatePda: PublicKey;
  }> {
    const loanId = Keypair.generate().publicKey;
    const [trdcStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("trdc_state"), loanId.toBuffer()],
      trdcProgram.programId,
    );
    await loanProgram.methods
      .createCcbTrdc(
        loanId,
        new BN(100),
        new BN(50),
        nowPlus30Days(),
        new BN(800),
        randomAssetHint(),
      )
      .accounts({
        trdcState: trdcStatePda,
        trdcProgram: trdcProgram.programId,
        payer: borrower.publicKey,
        systemProgram: SystemProgram.programId,
        loanConfig: loanConfigPda,
        kycAttestation: SystemProgram.programId,
      })
      .signers([borrower])
      .rpc();
    return { loanId, trdcStatePda };
  }

  /** Common accounts struct for `mintTrdcCnft`. */
  function mintAccounts(borrower: PublicKey, trdcStatePda: PublicKey, opts?: {
    overrideMerkle?: PublicKey;
    overrideBubblegum?: PublicKey;
  }) {
    return {
      trdcState: trdcStatePda,
      borrower,
      trdcConfig: trdcConfigPda,
      merkleTree: opts?.overrideMerkle ?? merkleTree,
      treeConfig: bubblegumTreeConfig,
      treeAuthority: treeAuthorityPda,
      logWrapper: SPL_NOOP_PROGRAM_ID,
      compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
      bubblegumProgram: opts?.overrideBubblegum ?? BUBBLEGUM_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    };
  }

  // T1 ----------------------------------------------------------------
  it("test_mint_succeeds_for_valid_loan — happy path writes a non-default cnft_asset_id", async () => {
    const borrower = Keypair.generate();
    await airdrop(borrower.publicKey);
    const { trdcStatePda } = await initTrdcStateFor(borrower);

    let s = await trdcProgram.account.trdcState.fetch(trdcStatePda);
    expect(s.assetId.toBase58()).to.eq(PublicKey.default.toBase58());

    const apprHash = randomAssetHint();
    await trdcProgram.methods
      .mintTrdcCnft(apprHash)
      .accounts(mintAccounts(borrower.publicKey, trdcStatePda))
      .signers([borrower])
      .rpc();

    s = await trdcProgram.account.trdcState.fetch(trdcStatePda);
    expect(s.assetId.toBase58()).to.not.eq(PublicKey.default.toBase58());
  });

  // T2 ----------------------------------------------------------------
  it("test_mint_rejected_when_loan_state_wrong — non-PendingCustody status reverts with LoanNotReady", async () => {
    const borrower = Keypair.generate();
    await airdrop(borrower.publicKey);
    const { trdcStatePda } = await initTrdcStateFor(borrower);

    // Walk the FSM PendingCustody -> ActiveInCustody via the test_transition ix.
    await trdcProgram.methods
      .testTransition({ activeInCustody: {} })
      .accounts({ trdcState: trdcStatePda, authority: provider.wallet.publicKey })
      .rpc();

    let threw = false;
    let code: string | undefined;
    try {
      await trdcProgram.methods
        .mintTrdcCnft(randomAssetHint())
        .accounts(mintAccounts(borrower.publicKey, trdcStatePda))
        .signers([borrower])
        .rpc();
    } catch (e: any) {
      threw = true;
      code = e.error?.errorCode?.code ?? e.code;
    }
    expect(threw).to.eq(true);
    expect(code).to.eq("LoanNotReady");
  });

  // T3 ----------------------------------------------------------------
  it("test_mint_rejected_when_borrower_mismatch — different signer reverts with BorrowerMismatch", async () => {
    const borrower = Keypair.generate();
    const impostor = Keypair.generate();
    await airdrop(borrower.publicKey);
    await airdrop(impostor.publicKey);
    const { trdcStatePda } = await initTrdcStateFor(borrower);

    let threw = false;
    let code: string | undefined;
    try {
      await trdcProgram.methods
        .mintTrdcCnft(randomAssetHint())
        .accounts(mintAccounts(impostor.publicKey, trdcStatePda))
        .signers([impostor])
        .rpc();
    } catch (e: any) {
      threw = true;
      code = e.error?.errorCode?.code ?? e.code;
    }
    expect(threw).to.eq(true);
    expect(code).to.eq("BorrowerMismatch");
  });

  // T4 ----------------------------------------------------------------
  it("test_double_mint_rejected — second mint on same trdc_state reverts with AlreadyMinted", async () => {
    const borrower = Keypair.generate();
    await airdrop(borrower.publicKey);
    const { trdcStatePda } = await initTrdcStateFor(borrower);

    await trdcProgram.methods
      .mintTrdcCnft(randomAssetHint())
      .accounts(mintAccounts(borrower.publicKey, trdcStatePda))
      .signers([borrower])
      .rpc();

    let threw = false;
    let code: string | undefined;
    try {
      await trdcProgram.methods
        .mintTrdcCnft(randomAssetHint())
        .accounts(mintAccounts(borrower.publicKey, trdcStatePda))
        .signers([borrower])
        .rpc();
    } catch (e: any) {
      threw = true;
      code = e.error?.errorCode?.code ?? e.code;
    }
    expect(threw).to.eq(true);
    expect(code).to.eq("AlreadyMinted");
  });

  // T5 ----------------------------------------------------------------
  it("test_wrong_merkle_tree_rejected — substituting a different merkle_tree reverts via Anchor address constraint", async () => {
    const borrower = Keypair.generate();
    await airdrop(borrower.publicKey);
    const { trdcStatePda } = await initTrdcStateFor(borrower);

    const fakeTree = Keypair.generate().publicKey;

    let threw = false;
    let code: string | undefined;
    try {
      await trdcProgram.methods
        .mintTrdcCnft(randomAssetHint())
        .accounts(
          mintAccounts(borrower.publicKey, trdcStatePda, {
            overrideMerkle: fakeTree,
          }),
        )
        .signers([borrower])
        .rpc();
    } catch (e: any) {
      threw = true;
      code = e.error?.errorCode?.code ?? e.code;
    }
    expect(threw).to.eq(true);
    // Anchor's `address = ...` constraint surface as `ConstraintAddress`.
    expect(code).to.match(/Constraint(Address|Seeds)|ConstraintAddress/);
  });

  // T6 ----------------------------------------------------------------
  it("test_wrong_bubblegum_program_rejected — fake bubblegum_program program id reverts via Anchor address constraint", async () => {
    const borrower = Keypair.generate();
    await airdrop(borrower.publicKey);
    const { trdcStatePda } = await initTrdcStateFor(borrower);

    const fakeBgum = Keypair.generate().publicKey;

    let threw = false;
    let code: string | undefined;
    try {
      await trdcProgram.methods
        .mintTrdcCnft(randomAssetHint())
        .accounts(
          mintAccounts(borrower.publicKey, trdcStatePda, {
            overrideBubblegum: fakeBgum,
          }),
        )
        .signers([borrower])
        .rpc();
    } catch (e: any) {
      threw = true;
      code = e.error?.errorCode?.code ?? e.code;
    }
    expect(threw).to.eq(true);
    expect(code).to.match(/ConstraintAddress|ConstraintSeeds|AccountNotProgram/);
  });

  // T7 ----------------------------------------------------------------
  it("test_distinct_asset_ids — two sequential mints (different loans) produce different asset_ids", async () => {
    const ba = Keypair.generate();
    const bb = Keypair.generate();
    await airdrop(ba.publicKey);
    await airdrop(bb.publicKey);

    const { trdcStatePda: pdaA } = await initTrdcStateFor(ba);
    await trdcProgram.methods
      .mintTrdcCnft(randomAssetHint())
      .accounts(mintAccounts(ba.publicKey, pdaA))
      .signers([ba])
      .rpc();

    const { trdcStatePda: pdaB } = await initTrdcStateFor(bb);
    await trdcProgram.methods
      .mintTrdcCnft(randomAssetHint())
      .accounts(mintAccounts(bb.publicKey, pdaB))
      .signers([bb])
      .rpc();

    const sa = await trdcProgram.account.trdcState.fetch(pdaA);
    const sb = await trdcProgram.account.trdcState.fetch(pdaB);
    expect(sa.assetId.toBase58()).to.not.eq(PublicKey.default.toBase58());
    expect(sb.assetId.toBase58()).to.not.eq(PublicKey.default.toBase58());
    expect(sa.assetId.toBase58()).to.not.eq(sb.assetId.toBase58());
  });

  // T8 ----------------------------------------------------------------
  it("test_tree_authority_pda_is_program_owned — Bubblegum TreeConfig.tree_creator + tree_delegate equal trdc PDA", async () => {
    const acct = await provider.connection.getAccountInfo(
      bubblegumTreeConfig,
      "confirmed",
    );
    expect(acct, "Bubblegum TreeConfig must exist").to.not.eq(null);
    // Layout (bubblegum 1.4.0 generated/accounts/tree_config.rs):
    //   8  discriminator
    //   32 tree_creator
    //   32 tree_delegate
    const data = acct!.data;
    const creator = new PublicKey(data.subarray(8, 40));
    const delegate = new PublicKey(data.subarray(40, 72));
    expect(creator.toBase58(), "tree_creator must be trdc PDA (SR-1)").to.eq(
      treeAuthorityPda.toBase58(),
    );
    expect(delegate.toBase58(), "tree_delegate must be trdc PDA (SR-1)").to.eq(
      treeAuthorityPda.toBase58(),
    );

    // SR-7 audit: there is no admin-mint / override path. The trdc IDL must
    // expose exactly one mint instruction — `mintTrdcCnft` — and zero
    // others matching /admin.*mint|emergency|force/i.
    const idl = (trdcProgram as any).idl ?? (trdcProgram as any)._idl;
    const mintIxs = idl.instructions
      .map((i: any) => i.name as string)
      .filter((n: string) => /mint/i.test(n));
    expect(mintIxs).to.deep.eq(["mintTrdcCnft"]);
    const adminMint = idl.instructions.some((i: any) =>
      /admin.*mint|emergency|force.*mint/i.test(i.name),
    );
    expect(adminMint, "no admin-override mint ix may exist (SR-7)").to.eq(false);
  });
});
