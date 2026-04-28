/**
 * Wave D.4 — smoke-test the three brand-new ixs unlocked by the Squads
 * upgrade:
 *   1. loan.publish_price (oracle_admin signer; PriceFeed PDA gets created)
 *   2. vault.issue_kyc_attestation (admin signer; KycAttestation PDA created)
 *   3. trdc.mint_trdc_cnft (borrower signer; cNFT leaf appended to merkle tree)
 *
 * The third one needs an existing TRDCState in `PendingCustody` status. To
 * keep this script self-contained we initialize a fresh TRDCState via
 * `trdc.initialize_trdc_state` (which doesn't require the loan flow), then
 * mint into the merkle tree directly. (initialize_trdc_state default Status
 * is `PendingCustody` — see programs/trdc/src/lib.rs:240.)
 *
 * Each test is opt-in via flag so a failing one doesn't block the others:
 *   --price       : run publish_price test
 *   --kyc         : run issue_kyc_attestation test
 *   --cnft        : run mint_trdc_cnft test
 *   --all (default): run all three
 */
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const RPC = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";

const TRDC = new PublicKey("FcDPvRaixjAz7LeC64h9xkXPzvHT7dusbNmg83eJfr7R");
const VAULT = new PublicKey("4PPyUvazjDBvFndGUL2rgKTwZrFbsSP1tk4a2uMhE9MS");
const LOAN = new PublicKey("BHdxEKkfsyjERiz5XiUybDLquvoWRtF7r1zDgVCDZJow");

const SPL_NOOP = new PublicKey("noopb9bkMVfRPU8AsbpTUg8AQkHtKwMYZiFUjNRtMmV");
const SPL_AC = new PublicKey("cmtDvXumGCrqC1Age74AVPhSRVXJMd8PJS91L8KbNCK");
const BUBBLEGUM = new PublicKey("BGUMAp9Gq7iTEuizy4pqaxsTyUCBK68MDfK752saRPUY");

// IDL discriminators from target/idl/*.json.
const PUBLISH_PRICE_DISC = Buffer.from([117, 13, 6, 171, 29, 204, 11, 1]);
const ISSUE_KYC_DISC = Buffer.from([139, 82, 167, 210, 198, 144, 61, 74]);
const INIT_TRDC_STATE_DISC = (() => {
  const idl = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../../target/idl/trdc.json"), "utf-8"),
  );
  const ix = idl.instructions.find((i: any) => i.name === "initialize_trdc_state");
  return Buffer.from(ix.discriminator);
})();
const MINT_TRDC_CNFT_DISC = Buffer.from([43, 103, 42, 173, 169, 175, 191, 119]);

function load(p: string): Keypair {
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(p, "utf-8"))));
}

function sha256_32(s: string): Buffer {
  // ref_bytes / jwt_hash convention is sha256(...) → 32 bytes.
  // Use built-in crypto for portability.
  const { createHash } = require("node:crypto");
  return createHash("sha256").update(s).digest();
}

async function publishPriceTest(conn: Connection, payer: Keypair) {
  console.log("\n=== smoke 1: loan.publish_price ===");
  const refBytes = sha256_32(`smoke-test-watch-${Date.now()}`);
  console.log("ref_bytes (hex):", refBytes.toString("hex"));

  const [priceFeedPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("price_feed"), refBytes],
    LOAN,
  );
  const [loanConfigPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("loan_config")],
    LOAN,
  );
  console.log("price_feed PDA:", priceFeedPda.toBase58());

  // args: ref_bytes ([u8;32]), median_usd_cents (u64), listings (u32), observed_at (i64)
  const argBuf = Buffer.alloc(32 + 8 + 4 + 8);
  refBytes.copy(argBuf, 0);
  argBuf.writeBigUInt64LE(BigInt(50_000_00), 32); // $50,000.00 as cents
  argBuf.writeUInt32LE(5, 40);
  const observedAt = Math.floor(Date.now() / 1000) - 30; // 30s ago
  argBuf.writeBigInt64LE(BigInt(observedAt), 44);

  const ix = new TransactionInstruction({
    programId: LOAN,
    keys: [
      { pubkey: priceFeedPda, isSigner: false, isWritable: true },
      { pubkey: loanConfigPda, isSigner: false, isWritable: false },
      { pubkey: payer.publicKey, isSigner: true, isWritable: true }, // oracle_admin
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: Buffer.concat([PUBLISH_PRICE_DISC, argBuf]),
  });
  const tx = new Transaction().add(ix);
  const sig = await conn.sendTransaction(tx, [payer], {
    skipPreflight: false,
    preflightCommitment: "confirmed",
  });
  await conn.confirmTransaction(sig, "confirmed");
  console.log("publish_price sig:", sig);

  // Verify the feed.
  const feed = await conn.getAccountInfo(priceFeedPda);
  if (!feed) throw new Error("PriceFeed PDA not found post-publish");
  const refOnchain = feed.data.slice(8, 40);
  const cents = feed.data.readBigUInt64LE(40);
  const listings = feed.data.readUInt32LE(48);
  const obs = feed.data.readBigInt64LE(52);
  console.log(`  on-chain ref_bytes: ${refOnchain.toString("hex")}`);
  console.log(`  median_usd_cents:   ${cents}`);
  console.log(`  listings:           ${listings}`);
  console.log(`  observed_at:        ${obs}`);
  if (!refOnchain.equals(refBytes)) throw new Error("ref_bytes mismatch on-chain");
  console.log(`  https://solscan.io/tx/${sig}?cluster=devnet`);
  return { priceFeedPda: priceFeedPda.toBase58(), sig, refBytes: refBytes.toString("hex") };
}

async function issueKycTest(conn: Connection, payer: Keypair) {
  console.log("\n=== smoke 2: vault.issue_kyc_attestation ===");
  const owner = Keypair.generate().publicKey;
  const jwtHash = sha256_32(`smoke-jwt-${Date.now()}`);
  console.log("kyc owner:", owner.toBase58());

  const [kycPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("kyc_attestation"), owner.toBuffer()],
    VAULT,
  );
  const [vaultConfigPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault_config")],
    VAULT,
  );

  const argBuf = Buffer.concat([owner.toBuffer(), jwtHash]);
  const ix = new TransactionInstruction({
    programId: VAULT,
    keys: [
      { pubkey: kycPda, isSigner: false, isWritable: true },
      { pubkey: vaultConfigPda, isSigner: false, isWritable: false },
      { pubkey: payer.publicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: Buffer.concat([ISSUE_KYC_DISC, argBuf]),
  });
  const tx = new Transaction().add(ix);
  const sig = await conn.sendTransaction(tx, [payer], {
    skipPreflight: false,
    preflightCommitment: "confirmed",
  });
  await conn.confirmTransaction(sig, "confirmed");
  console.log("issue_kyc_attestation sig:", sig);

  const acc = await conn.getAccountInfo(kycPda);
  if (!acc) throw new Error("KycAttestation PDA not found");
  console.log(`  KycAttestation PDA created: ${kycPda.toBase58()} (${acc.data.length} bytes)`);
  console.log(`  https://solscan.io/tx/${sig}?cluster=devnet`);
  return { kycPda: kycPda.toBase58(), owner: owner.toBase58(), sig };
}

async function mintTrdcCnftTest(conn: Connection, payer: Keypair) {
  console.log("\n=== smoke 3: trdc.mint_trdc_cnft ===");

  const treeRecord = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "trdc-merkle-tree.json"), "utf-8"),
  );
  const merkleTree = new PublicKey(treeRecord.tree_pubkey);

  // Step A — initialize_trdc_state(loan_id) with a fresh loan_id.
  // initialize_trdc_state args = (loan_id, appraisal_value, loan_amount, due_ts,
  // doc_hash, rate_bps, ref_bytes). Reading from the IDL:
  const trdcIdl = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../../target/idl/trdc.json"), "utf-8"),
  );
  const initIxIdl = trdcIdl.instructions.find((i: any) => i.name === "initialize_trdc_state");
  const initArgs: any[] = initIxIdl.args;
  console.log("initialize_trdc_state args schema:", initArgs.map((a: any) => `${a.name}:${JSON.stringify(a.type)}`));

  const loanId = Keypair.generate().publicKey;
  const [trdcStatePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("trdc_state"), loanId.toBuffer()],
    TRDC,
  );
  console.log("loan_id:       ", loanId.toBase58());
  console.log("trdc_state PDA:", trdcStatePda.toBase58());

  // Build init args buffer in declared order.
  // Looking at programs/trdc/src/lib.rs initialize_trdc_state signature is:
  //   (ctx, loan_id, appraisal_value, loan_amount, due_ts, doc_hash, rate_bps, ref_bytes, borrower)
  // — we'll read order from IDL to be safe.
  const argParts: Buffer[] = [];
  for (const a of initArgs) {
    const t = a.type;
    if (t === "pubkey") {
      if (a.name === "loan_id") argParts.push(loanId.toBuffer());
      else if (a.name === "borrower") argParts.push(payer.publicKey.toBuffer());
      else throw new Error(`unhandled pubkey arg ${a.name}`);
    } else if (t === "u64") {
      const b = Buffer.alloc(8);
      if (a.name === "appraisal_value") b.writeBigUInt64LE(BigInt(50_000_000_000), 0); // 50k USDC atoms
      else if (a.name === "loan_amount") b.writeBigUInt64LE(BigInt(25_000_000_000), 0); // 25k
      else if (a.name === "rate_bps") b.writeBigUInt64LE(BigInt(1200), 0); // 12%
      else throw new Error(`unhandled u64 ${a.name}`);
      argParts.push(b);
    } else if (t === "i64") {
      const b = Buffer.alloc(8);
      if (a.name === "due_ts") b.writeBigInt64LE(BigInt(Math.floor(Date.now() / 1000) + 86_400 * 30), 0);
      else throw new Error(`unhandled i64 ${a.name}`);
      argParts.push(b);
    } else if (typeof t === "object" && t.array && t.array[1] === 32) {
      const b = Buffer.alloc(32);
      argParts.push(b); // zero-fill for doc_hash, ref_bytes
    } else {
      throw new Error(`unhandled type for ${a.name}: ${JSON.stringify(t)}`);
    }
  }
  const initIxData = Buffer.concat([INIT_TRDC_STATE_DISC, ...argParts]);

  // Accounts for initialize_trdc_state — match programs/trdc/src/lib.rs.
  const initIxAccounts = trdcIdl.instructions.find((i: any) => i.name === "initialize_trdc_state").accounts;
  console.log("initialize_trdc_state accounts:", initIxAccounts.map((a: any) => a.name));
  const initKeys: { pubkey: PublicKey; isSigner: boolean; isWritable: boolean }[] = [];
  for (const a of initIxAccounts) {
    if (a.name === "trdc_state") initKeys.push({ pubkey: trdcStatePda, isSigner: false, isWritable: true });
    else if (a.name === "payer") initKeys.push({ pubkey: payer.publicKey, isSigner: true, isWritable: true });
    else if (a.name === "system_program") initKeys.push({ pubkey: SystemProgram.programId, isSigner: false, isWritable: false });
    else throw new Error(`unhandled account ${a.name}`);
  }

  const initTx = new Transaction().add(
    new TransactionInstruction({ programId: TRDC, keys: initKeys, data: initIxData }),
  );
  const initSig = await conn.sendTransaction(initTx, [payer], {
    skipPreflight: false,
    preflightCommitment: "confirmed",
  });
  await conn.confirmTransaction(initSig, "confirmed");
  console.log("initialize_trdc_state sig:", initSig);

  // Step B — mint_trdc_cnft.
  const [trdcConfigPda] = PublicKey.findProgramAddressSync([Buffer.from("trdc_config")], TRDC);
  const [treeConfigPda] = PublicKey.findProgramAddressSync([merkleTree.toBuffer()], BUBBLEGUM);
  const [treeAuthorityPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("trdc_tree_authority")],
    TRDC,
  );

  const appraisalHash = sha256_32(`smoke-appraisal-${Date.now()}`);
  const mintIxData = Buffer.concat([MINT_TRDC_CNFT_DISC, appraisalHash]);

  const mintIx = new TransactionInstruction({
    programId: TRDC,
    keys: [
      { pubkey: trdcStatePda, isSigner: false, isWritable: true },
      { pubkey: payer.publicKey, isSigner: true, isWritable: true }, // borrower
      { pubkey: trdcConfigPda, isSigner: false, isWritable: false },
      { pubkey: merkleTree, isSigner: false, isWritable: true },
      { pubkey: treeConfigPda, isSigner: false, isWritable: true },
      { pubkey: treeAuthorityPda, isSigner: false, isWritable: false },
      { pubkey: SPL_NOOP, isSigner: false, isWritable: false },
      { pubkey: SPL_AC, isSigner: false, isWritable: false },
      { pubkey: BUBBLEGUM, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: mintIxData,
  });
  const mintTx = new Transaction().add(mintIx);
  const mintSig = await conn.sendTransaction(mintTx, [payer], {
    skipPreflight: false,
    preflightCommitment: "confirmed",
  });
  await conn.confirmTransaction(mintSig, "confirmed");
  console.log("mint_trdc_cnft sig:", mintSig);

  // Verify the asset_id was written to TRDCState.
  const trdcStateAcc = await conn.getAccountInfo(trdcStatePda);
  if (!trdcStateAcc) throw new Error("TRDCState not found post-mint");
  // asset_id offset in TRDCState: disc(8) + loan_id(32) + status(2) + appraisal_value(8) + loan_amount(8) + due_ts(8) + bump(1) = 67
  const assetId = new PublicKey(trdcStateAcc.data.slice(67, 67 + 32));
  console.log(`  asset_id (post-mint): ${assetId.toBase58()}`);
  if (assetId.equals(PublicKey.default)) {
    throw new Error("asset_id is still default — mint did not write back");
  }
  console.log(`  https://solscan.io/tx/${mintSig}?cluster=devnet`);
  return {
    loanId: loanId.toBase58(),
    trdcStatePda: trdcStatePda.toBase58(),
    assetId: assetId.toBase58(),
    initSig,
    mintSig,
  };
}

async function main() {
  const argv = new Set(process.argv.slice(2));
  const runAll = argv.has("--all") || argv.size === 0;

  const conn = new Connection(RPC, "confirmed");
  const payer = load(path.join(os.homedir(), ".config", "solana", "id.json"));
  console.log("payer:", payer.publicKey.toBase58(), "balance:", await conn.getBalance(payer.publicKey) / 1e9, "SOL");

  const results: any = {};

  if (runAll || argv.has("--price")) {
    try { results.publishPrice = await publishPriceTest(conn, payer); }
    catch (e: any) { results.publishPrice = { error: e.message, logs: e.transactionLogs }; console.error("publish_price FAILED:", e); }
  }
  if (runAll || argv.has("--kyc")) {
    try { results.issueKyc = await issueKycTest(conn, payer); }
    catch (e: any) { results.issueKyc = { error: e.message, logs: e.transactionLogs }; console.error("issue_kyc FAILED:", e); }
  }
  if (runAll || argv.has("--cnft")) {
    try { results.mintCnft = await mintTrdcCnftTest(conn, payer); }
    catch (e: any) { results.mintCnft = { error: e.message, logs: e.transactionLogs }; console.error("mint_cnft FAILED:", e); }
  }

  fs.writeFileSync(
    path.resolve(__dirname, "smoke-test-results.json"),
    JSON.stringify(results, null, 2),
  );
  console.log("\nResults written to scripts/dev/smoke-test-results.json");
}

main().catch((e) => { console.error(e); process.exit(1); });
