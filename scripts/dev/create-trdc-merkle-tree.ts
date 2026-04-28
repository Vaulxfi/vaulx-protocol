/**
 * Task 4.1 — Create the Devnet Bubblegum merkle tree for TRDC cNFTs.
 *
 * SECURITY-HARDENED: tree_creator (and therefore tree_delegate) is a PDA
 * owned by the trdc program — NOT the payer keypair. The trdc program
 * `init_merkle_tree` ix CPIs Bubblegum's `create_tree_config` with
 * `invoke_signed`, so the PDA signs as creator. This means no off-chain
 * signer can mint into this tree; only the trdc program can.
 *
 * Usage:
 *   pnpm create:merkle-tree            # devnet, refuses if json exists
 *   pnpm create:merkle-tree -- --force # overwrite existing tree json
 *   pnpm create:merkle-tree -- --mainnet  # requires explicit mainnet flag
 */
import fs from "node:fs";
import path from "node:path";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  clusterApiUrl,
} from "@solana/web3.js";
import {
  getConcurrentMerkleTreeAccountSize,
  SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
  SPL_NOOP_PROGRAM_ID,
} from "@solana/spl-account-compression";

const BUBBLEGUM_PROGRAM_ID = new PublicKey("BGUMAp9Gq7iTEuizy4pqaxsTyUCBK68MDfK752saRPUY");
const TRDC_TREE_AUTHORITY_SEED = Buffer.from("trdc_tree_authority");

// Anchor 0.30.1 ix discriminator for `init_merkle_tree` from
// packages/idls/src/trdc.json — sha256("global:init_merkle_tree")[..8].
const INIT_MERKLE_TREE_DISCRIMINATOR = Buffer.from([8, 60, 17, 151, 102, 104, 35, 253]);

// Tree geometry: depth=14 → 16,384-leaf capacity.
const MAX_DEPTH = 14;
const MAX_BUFFER_SIZE = 64;
const CANOPY_DEPTH = 9;
const TREE_PUBLIC = false; // private — only trdc program can mint via PDA

const SOL_FLOOR_LAMPORTS = 6 * LAMPORTS_PER_SOL;

const DIR = path.resolve(__dirname);
const OUT_FILE = path.join(DIR, "trdc-merkle-tree.json");
const DEPLOY_FILE = path.join(DIR, "devnet-deploy.json");

function pickRpcUrl(cluster: "devnet" | "mainnet-beta"): string {
  if (process.env.SOLANA_RPC_URL) return process.env.SOLANA_RPC_URL;
  if (process.env.HELIUS_API_KEY) {
    return `https://${cluster === "devnet" ? "devnet" : "mainnet"}.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`;
  }
  return clusterApiUrl(cluster);
}

function buildInitMerkleTreeIx(args: {
  trdcProgramId: PublicKey;
  treeAuthorityPda: PublicKey;
  treeConfigPda: PublicKey;
  merkleTree: PublicKey;
  payer: PublicKey;
}): TransactionInstruction {
  // Args layout: max_depth: u32 LE, max_buffer_size: u32 LE, public: bool (u8).
  const argBuf = Buffer.alloc(4 + 4 + 1);
  argBuf.writeUInt32LE(MAX_DEPTH, 0);
  argBuf.writeUInt32LE(MAX_BUFFER_SIZE, 4);
  argBuf.writeUInt8(TREE_PUBLIC ? 1 : 0, 8);

  const data = Buffer.concat([INIT_MERKLE_TREE_DISCRIMINATOR, argBuf]);

  // Order MUST match the InitMerkleTree Accounts struct in programs/trdc/src/lib.rs.
  const keys = [
    { pubkey: args.treeAuthorityPda, isSigner: false, isWritable: false },
    { pubkey: args.treeConfigPda, isSigner: false, isWritable: true },
    { pubkey: args.merkleTree, isSigner: false, isWritable: true },
    { pubkey: args.payer, isSigner: true, isWritable: true },
    { pubkey: SPL_NOOP_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: BUBBLEGUM_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ];

  return new TransactionInstruction({
    programId: args.trdcProgramId,
    keys,
    data,
  });
}

function parseTreeConfigCreator(accountData: Buffer): PublicKey {
  // Bubblegum TreeConfig layout (from mpl-bubblegum 1.4.0 state.rs):
  //   8 bytes  — Anchor discriminator
  //   32 bytes — tree_creator: Pubkey   <-- offset 8
  //   32 bytes — tree_delegate: Pubkey  <-- offset 40
  //   ...
  // We only need tree_creator and tree_delegate for verification.
  return new PublicKey(accountData.subarray(8, 40));
}

function parseTreeConfigDelegate(accountData: Buffer): PublicKey {
  return new PublicKey(accountData.subarray(40, 72));
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const isMainnet = args.has("--mainnet");
  const force = args.has("--force");

  if (isMainnet) {
    console.error("Mainnet flag detected — refusing. Task 4.1 is Devnet-only.");
    process.exit(1);
  }
  const cluster: "devnet" | "mainnet-beta" = "devnet";

  if (fs.existsSync(OUT_FILE) && !force) {
    console.error(`Refusing to overwrite ${OUT_FILE}.`);
    console.error(`Pass --force to recreate (will mint a new tree at fresh cost).`);
    process.exit(1);
  }

  if (!fs.existsSync(DEPLOY_FILE)) {
    console.error(`Missing ${DEPLOY_FILE}. Run 'anchor deploy' first.`);
    process.exit(1);
  }
  const deployRecord = JSON.parse(fs.readFileSync(DEPLOY_FILE, "utf8"));
  const trdcProgramId = new PublicKey(deployRecord.programs.trdc.program_id);
  if (deployRecord.cluster !== "devnet") {
    console.error(`devnet-deploy.json says cluster=${deployRecord.cluster}; refusing.`);
    process.exit(1);
  }

  const homeKeyPath = `${process.env.HOME}/.config/solana/id.json`;
  if (!fs.existsSync(homeKeyPath)) {
    console.error(`Payer keypair not found at ${homeKeyPath}.`);
    process.exit(1);
  }
  const payer = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(homeKeyPath, "utf8"))),
  );

  const conn = new Connection(pickRpcUrl(cluster), "confirmed");

  // Cluster sanity check.
  const genesis = await conn.getGenesisHash();
  // Devnet genesis hash is well-known: EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG
  if (genesis !== "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG") {
    console.error(`Connected cluster genesis is ${genesis}; expected devnet. Refusing.`);
    process.exit(1);
  }

  const balance = await conn.getBalance(payer.publicKey);
  console.log(`payer:   ${payer.publicKey.toBase58()}  (balance ${balance / LAMPORTS_PER_SOL} SOL)`);
  if (balance < SOL_FLOOR_LAMPORTS) {
    console.error(
      `Payer has < 6 SOL. Tree creation costs ~0.5 SOL but we keep a safety margin.`,
    );
    console.error(`Top up via 'solana airdrop 2 --url devnet' and re-run.`);
    process.exit(1);
  }

  // Derive trdc tree-authority PDA — this becomes Bubblegum tree_creator.
  const [treeAuthorityPda, treeAuthorityBump] = PublicKey.findProgramAddressSync(
    [TRDC_TREE_AUTHORITY_SEED],
    trdcProgramId,
  );

  // Fresh merkle-tree keypair (the on-chain tree account itself).
  const treeKp = Keypair.generate();
  const treeSize = getConcurrentMerkleTreeAccountSize(MAX_DEPTH, MAX_BUFFER_SIZE, CANOPY_DEPTH);
  const treeRent = await conn.getMinimumBalanceForRentExemption(treeSize);

  // Bubblegum's TreeConfig PDA is derived from the tree pubkey under the
  // Bubblegum program, NOT the trdc program. Don't confuse with our
  // `treeAuthorityPda` (which goes into the tree_creator field).
  const [treeConfigPda] = PublicKey.findProgramAddressSync(
    [treeKp.publicKey.toBuffer()],
    BUBBLEGUM_PROGRAM_ID,
  );

  console.log(`trdc programId:       ${trdcProgramId.toBase58()}`);
  console.log(`tree pubkey (new):    ${treeKp.publicKey.toBase58()}`);
  console.log(`treeAuthority PDA:    ${treeAuthorityPda.toBase58()}  (bump ${treeAuthorityBump})`);
  console.log(`Bubblegum treeConfig: ${treeConfigPda.toBase58()}`);
  console.log(
    `tree size: ${treeSize} bytes  rent: ${(treeRent / LAMPORTS_PER_SOL).toFixed(6)} SOL`,
  );

  // Tx 1 — allocate the merkle tree account at zero data, owned by spl-account-compression.
  const allocTx = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: treeKp.publicKey,
      lamports: treeRent,
      space: treeSize,
      programId: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
    }),
  );
  // Tx 2 — call trdc.init_merkle_tree, which CPIs Bubblegum.create_tree_config
  // with PDA-signed tree_creator.
  const initIx = buildInitMerkleTreeIx({
    trdcProgramId,
    treeAuthorityPda,
    treeConfigPda,
    merkleTree: treeKp.publicKey,
    payer: payer.publicKey,
  });

  // Submit allocation first, then init. Two separate txs avoids hitting the
  // 1232-byte tx size cap with the createAccount ix + Bubblegum CPI on top.
  console.log(`\nallocating tree account...`);
  const allocSig = await conn.sendTransaction(allocTx, [payer, treeKp], {
    skipPreflight: false,
    preflightCommitment: "confirmed",
  });
  await conn.confirmTransaction(allocSig, "confirmed");
  console.log(`  alloc tx: ${allocSig}`);

  console.log(`calling trdc.init_merkle_tree (PDA-signed CPI to Bubblegum)...`);
  const initTx = new Transaction().add(initIx);
  const initSig = await conn.sendTransaction(initTx, [payer], {
    skipPreflight: false,
    preflightCommitment: "confirmed",
  });
  const confirmation = await conn.confirmTransaction(initSig, "confirmed");
  console.log(`  init  tx: ${initSig}`);
  if (confirmation.value.err) {
    console.error(`init tx errored: ${JSON.stringify(confirmation.value.err)}`);
    process.exit(1);
  }

  // Verify on-chain: TreeConfig.tree_creator MUST be the trdc PDA.
  const treeConfigAcct = await conn.getAccountInfo(treeConfigPda, "confirmed");
  if (!treeConfigAcct) {
    console.error(`TreeConfig account not found at ${treeConfigPda.toBase58()}`);
    process.exit(1);
  }
  const onchainCreator = parseTreeConfigCreator(treeConfigAcct.data);
  const onchainDelegate = parseTreeConfigDelegate(treeConfigAcct.data);

  console.log(`\non-chain TreeConfig.tree_creator:  ${onchainCreator.toBase58()}`);
  console.log(`on-chain TreeConfig.tree_delegate: ${onchainDelegate.toBase58()}`);
  if (!onchainCreator.equals(treeAuthorityPda)) {
    console.error(`SECURITY FAIL: tree_creator is ${onchainCreator.toBase58()},`);
    console.error(`               expected PDA ${treeAuthorityPda.toBase58()}`);
    process.exit(1);
  }
  if (!onchainDelegate.equals(treeAuthorityPda)) {
    console.error(`tree_delegate is ${onchainDelegate.toBase58()}; expected PDA.`);
    process.exit(1);
  }

  // Verify tree account size matches what we declared.
  const treeAcct = await conn.getAccountInfo(treeKp.publicKey, "confirmed");
  if (!treeAcct || treeAcct.data.length !== treeSize) {
    console.error(`tree account size mismatch: ${treeAcct?.data.length} vs ${treeSize}`);
    process.exit(1);
  }

  const slot = await conn.getSlot("confirmed");
  const finalBalance = await conn.getBalance(payer.publicKey);

  const record = {
    tree_pubkey: treeKp.publicKey.toBase58(),
    tree_authority_pda: treeAuthorityPda.toBase58(),
    tree_authority_bump: treeAuthorityBump,
    tree_authority_seed: "trdc_tree_authority",
    bubblegum_tree_config_pda: treeConfigPda.toBase58(),
    bubblegum_program_id: BUBBLEGUM_PROGRAM_ID.toBase58(),
    max_depth: MAX_DEPTH,
    max_buffer_size: MAX_BUFFER_SIZE,
    canopy_depth: CANOPY_DEPTH,
    leaf_capacity: 1 << MAX_DEPTH,
    public: TREE_PUBLIC,
    trdc_program_id: trdcProgramId.toBase58(),
    cluster,
    created_slot: slot,
    created_alloc_tx: allocSig,
    created_init_tx: initSig,
    created_at: new Date().toISOString(),
    creator_was: payer.publicKey.toBase58(),
    note:
      "Tree authority is a trdc-program PDA, not the payer. Payer paid rent and submitted the create tx, " +
      "but the on-chain TreeConfig.tree_creator is the PDA — so only the trdc program can sign mints.",
  };

  fs.writeFileSync(OUT_FILE, JSON.stringify(record, null, 2));
  console.log(`\nwrote ${OUT_FILE}`);
  console.log(`final payer balance: ${finalBalance / LAMPORTS_PER_SOL} SOL`);
  console.log(`Task 4.1 complete.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
