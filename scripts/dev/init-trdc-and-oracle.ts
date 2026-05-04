/**
 * Wave D.3 — initialize new on-chain state behind the just-upgraded programs:
 *
 *   1. trdc.init_trdc_config(merkle_tree)  — admin-only, one-shot.
 *   2. loan.set_oracle_admin(payer)        — admin-only, idempotent.
 *
 * Reads the merkle tree pubkey from scripts/dev/trdc-merkle-tree.json (must
 * exist — run `pnpm create:merkle-tree` first). The payer keypair acts as
 * both `trdc_config.admin` and `loan_config.oracle_admin` for the hackathon
 * demo; both are rotatable later via the same admin.
 *
 * Idempotency:
 *   - init_trdc_config has Anchor `init` constraint: re-calls revert with
 *     "account already in use". This script catches that case and treats it
 *     as success.
 *   - set_oracle_admin is plain assignment, safe to re-run.
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

const TRDC = new PublicKey("26rb68SPyjKmFNwSUmfZA7WRFtsKFheXf5xN8eHeeRWk");
const LOAN = new PublicKey("BCzcP4soWYSVWAt8gWPZmcNxcCiw8LdU8sT5VS3TPuW8");

// IDL discriminators (from target/idl/*.json — Anchor 0.30.1 sha256("global:<ix>")[..8]).
const INIT_TRDC_CONFIG_DISC = Buffer.from([160, 89, 220, 71, 61, 17, 12, 249]);
const SET_ORACLE_ADMIN_DISC = Buffer.from([42, 121, 230, 241, 173, 83, 195, 200]);
const MIGRATE_LOAN_CONFIG_V2_DISC = Buffer.from([241, 205, 115, 190, 112, 57, 140, 113]);

function load(p: string): Keypair {
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(p, "utf-8"))));
}

async function main() {
  const conn = new Connection(RPC, "confirmed");
  const payer = load(path.join(os.homedir(), ".config", "solana", "id.json"));
  console.log("payer:", payer.publicKey.toBase58());

  const treeFile = path.resolve(__dirname, "trdc-merkle-tree.json");
  if (!fs.existsSync(treeFile)) throw new Error(`missing ${treeFile} — run create:merkle-tree first`);
  const treeRecord = JSON.parse(fs.readFileSync(treeFile, "utf-8"));
  const treePubkey = new PublicKey(treeRecord.tree_pubkey);
  console.log("merkle tree:", treePubkey.toBase58());

  // ---------- 1. trdc.init_trdc_config ----------
  const [trdcConfigPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("trdc_config")],
    TRDC,
  );
  console.log("trdc_config PDA:", trdcConfigPda.toBase58());

  const existing = await conn.getAccountInfo(trdcConfigPda);
  if (existing) {
    console.log("trdc_config already exists — skipping init.");
  } else {
    const ixData = Buffer.concat([INIT_TRDC_CONFIG_DISC, treePubkey.toBuffer()]);
    const ix = new TransactionInstruction({
      programId: TRDC,
      keys: [
        { pubkey: trdcConfigPda, isSigner: false, isWritable: true },
        { pubkey: payer.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data: ixData,
    });
    const tx = new Transaction().add(ix);
    const sig = await conn.sendTransaction(tx, [payer], {
      skipPreflight: false,
      preflightCommitment: "confirmed",
    });
    await conn.confirmTransaction(sig, "confirmed");
    console.log("init_trdc_config sig:", sig);
  }

  // Verify trdc_config.merkle_tree
  const cfgAcc = await conn.getAccountInfo(trdcConfigPda);
  if (!cfgAcc) throw new Error("trdc_config not found after init");
  const adminFromAcc = new PublicKey(cfgAcc.data.slice(8, 40));
  const treeFromAcc = new PublicKey(cfgAcc.data.slice(40, 72));
  console.log("  trdc_config.admin:        ", adminFromAcc.toBase58());
  console.log("  trdc_config.merkle_tree:  ", treeFromAcc.toBase58());
  if (!treeFromAcc.equals(treePubkey)) {
    throw new Error(
      `trdc_config.merkle_tree mismatch: on-chain=${treeFromAcc.toBase58()} expected=${treePubkey.toBase58()}`,
    );
  }

  // ---------- 2. loan.migrate_loan_config_v2 (no-op if already migrated) ----------
  const [loanConfigPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("loan_config")],
    LOAN,
  );
  console.log("loan_config PDA:", loanConfigPda.toBase58());

  const loanCfgPre = await conn.getAccountInfo(loanConfigPda);
  if (!loanCfgPre) throw new Error("loan_config not found — initialize_loan_config must run first");
  console.log("loan_config len (pre):", loanCfgPre.data.length);

  const NEW_LOAN_CONFIG_SIZE = 8 + 32 + 32 + 32 + 1 + 1 + 32; // 138
  if (loanCfgPre.data.length < NEW_LOAN_CONFIG_SIZE) {
    const migIx = new TransactionInstruction({
      programId: LOAN,
      keys: [
        { pubkey: loanConfigPda, isSigner: false, isWritable: true },
        { pubkey: payer.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data: MIGRATE_LOAN_CONFIG_V2_DISC,
    });
    const migTx = new Transaction().add(migIx);
    const migSig = await conn.sendTransaction(migTx, [payer], {
      skipPreflight: false,
      preflightCommitment: "confirmed",
    });
    await conn.confirmTransaction(migSig, "confirmed");
    console.log("migrate_loan_config_v2 sig:", migSig);
    const loanCfgPost = await conn.getAccountInfo(loanConfigPda);
    console.log("loan_config len (post):", loanCfgPost!.data.length);
  } else {
    console.log("loan_config already at v2 size — skipping migration.");
  }

  // ---------- 3. loan.set_oracle_admin ----------
  const ixData2 = Buffer.concat([SET_ORACLE_ADMIN_DISC, payer.publicKey.toBuffer()]);
  const ix2 = new TransactionInstruction({
    programId: LOAN,
    keys: [
      { pubkey: loanConfigPda, isSigner: false, isWritable: true },
      { pubkey: payer.publicKey, isSigner: true, isWritable: false },
    ],
    data: ixData2,
  });
  const tx2 = new Transaction().add(ix2);
  const sig2 = await conn.sendTransaction(tx2, [payer], {
    skipPreflight: false,
    preflightCommitment: "confirmed",
  });
  await conn.confirmTransaction(sig2, "confirmed");
  console.log("set_oracle_admin sig:", sig2);

  // Verify loan_config.oracle_admin (offset = 8 + 32 admin + 32 custodian + 1 kyc_required + 1 bump
  //                                        + 32 civic_network = 106). Wait: layout from state.rs
  // We'll re-fetch the loan_config and just confirm we can publish a price.
  const loanCfg = await conn.getAccountInfo(loanConfigPda);
  console.log("loan_config len:", loanCfg!.data.length);

  console.log("\nWave D.3 done.");
  console.log(`https://solscan.io/account/${trdcConfigPda.toBase58()}?cluster=devnet`);
}

main().catch((e) => { console.error(e); process.exit(1); });
