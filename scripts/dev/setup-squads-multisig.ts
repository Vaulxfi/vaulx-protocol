/**
 * One-shot Squads V4 2/3 multisig setup for Vaulx.
 *
 * DO NOT re-run unless intentionally rotating signers. Re-running creates a NEW
 * multisig at a different address; existing program upgrade authorities pointing
 * at the old multisig become orphaned.
 *
 * Run: pnpm setup:squads [--mainnet] [--force]
 *
 * Output: scripts/dev/squads-multisig.json (committed — multisig identity)
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
} from "@solana/web3.js";
import * as multisig from "@sqds/multisig";

const { Permission, Permissions } = multisig.types;

const OPS_KEYPAIR_PATH = path.join(os.homedir(), ".config", "vaulx", "ops-keypair.json");
const TEAM_KEYPAIR_PATH = path.join(os.homedir(), ".config", "vaulx", "team-keypair.json");
const PAYER_KEYPAIR_PATH = path.join(os.homedir(), ".config", "solana", "id.json");
const OUTPUT_FILE = path.resolve(__dirname, "squads-multisig.json");

const DEVNET_RPC = "https://api.devnet.solana.com";
const MAINNET_RPC = "https://api.mainnet-beta.solana.com";
const MIN_PAYER_SOL = 0.5;

type Args = {
  mainnet: boolean;
  force: boolean;
  help: boolean;
};

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  return {
    mainnet: argv.includes("--mainnet"),
    force: argv.includes("--force"),
    help: argv.includes("--help") || argv.includes("-h"),
  };
}

function printHelp() {
  process.stdout.write(
    `Usage: pnpm setup:squads [--mainnet] [--force] [--help]

  Creates a Squads V4 2/3 multisig from:
    - payer  (~/.config/solana/id.json)
    - ops    (~/.config/vaulx/ops-keypair.json)
    - team   (~/.config/vaulx/team-keypair.json)

  Defaults to Devnet. Pass --mainnet to target mainnet-beta (explicit opt-in).
  Refuses to run if scripts/dev/squads-multisig.json already exists unless
  --force is passed (re-running creates a NEW multisig at a different address;
  existing upgrade authorities pointing at the old multisig become orphaned).

  Output: scripts/dev/squads-multisig.json (committed — multisig identity).
`,
  );
}

function loadKeypair(filePath: string, label: string): Keypair {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${label} keypair not found at ${filePath}`);
  }
  const secret = JSON.parse(fs.readFileSync(filePath, "utf-8")) as number[];
  return Keypair.fromSecretKey(Uint8Array.from(secret));
}

async function main() {
  const args = parseArgs();
  if (args.help) {
    printHelp();
    process.exit(0);
  }

  if (fs.existsSync(OUTPUT_FILE) && !args.force) {
    console.error(
      `Refusing to run: ${path.relative(process.cwd(), OUTPUT_FILE)} already exists.\n` +
        `Pass --force to intentionally rotate signers (creates a NEW multisig at a different address).`,
    );
    process.exit(1);
  }

  const cluster = args.mainnet ? "mainnet-beta" : "devnet";
  const rpcUrl = args.mainnet ? MAINNET_RPC : DEVNET_RPC;
  const connection = new Connection(rpcUrl, "confirmed");

  console.log(`Cluster:  ${cluster}`);
  console.log(`RPC:      ${rpcUrl}`);

  // Load all 3 signers.
  const payer = loadKeypair(PAYER_KEYPAIR_PATH, "payer");
  const ops = loadKeypair(OPS_KEYPAIR_PATH, "ops");
  const team = loadKeypair(TEAM_KEYPAIR_PATH, "team");

  console.log("");
  console.log("Signers:");
  for (const [label, kp] of [
    ["payer", payer],
    ["ops", ops],
    ["team", team],
  ] as const) {
    const lamports = await connection.getBalance(kp.publicKey);
    const sol = lamports / LAMPORTS_PER_SOL;
    console.log(`  ${label.padEnd(5)} ${kp.publicKey.toBase58()}  ${sol.toFixed(4)} SOL`);
  }

  const payerLamports = await connection.getBalance(payer.publicKey);
  const payerSol = payerLamports / LAMPORTS_PER_SOL;
  if (payerSol < MIN_PAYER_SOL) {
    console.error(
      `\nPayer has ${payerSol.toFixed(4)} SOL — needs at least ${MIN_PAYER_SOL} SOL ` +
        `(multisig creation costs ~0.05 SOL; reserve a buffer for fees + future ops).`,
    );
    process.exit(1);
  }

  // Squads V4 multisig identity is derived from a fresh `createKey` (any keypair).
  // It's a one-shot signer required at creation; not a long-lived role.
  const createKey = Keypair.generate();
  const [multisigPda] = multisig.getMultisigPda({ createKey: createKey.publicKey });
  const [vaultPda] = multisig.getVaultPda({ multisigPda, index: 0 });

  // Fetch ProgramConfig to get the program treasury (where the creation fee goes).
  const [programConfigPda] = multisig.getProgramConfigPda({});
  const programConfig = await multisig.accounts.ProgramConfig.fromAccountAddress(
    connection,
    programConfigPda,
  );
  const treasury = programConfig.treasury;

  console.log("");
  console.log("Will create:");
  console.log(`  multisig PDA  ${multisigPda.toBase58()}`);
  console.log(`  vault PDA     ${vaultPda.toBase58()}  (index 0 — treasury)`);
  console.log(`  threshold     2 of 3`);
  console.log(`  members       payer + ops + team (all permissions)`);
  console.log("");

  const members = [payer, ops, team].map((kp) => ({
    key: kp.publicKey,
    permissions: Permissions.all(),
  }));

  console.log("Sending multisigCreateV2 transaction...");
  const signature = await multisig.rpc.multisigCreateV2({
    connection,
    treasury,
    createKey,
    creator: payer,
    multisigPda,
    configAuthority: null, // no separate config authority — members govern via threshold
    threshold: 2,
    members,
    timeLock: 0,
    rentCollector: null,
    memo: "Vaulx 2/3 multisig — upgrade authority + treasury",
    sendOptions: { skipPreflight: false },
  });

  await connection.confirmTransaction(signature, "confirmed");
  console.log(`OK. tx ${signature}`);

  const out = {
    cluster,
    rpcUrl,
    createdAt: new Date().toISOString(),
    multisigPda: multisigPda.toBase58(),
    vaultPda: vaultPda.toBase58(),
    threshold: 2,
    members: {
      payer: payer.publicKey.toBase58(),
      ops: ops.publicKey.toBase58(),
      team: team.publicKey.toBase58(),
    },
    createKey: createKey.publicKey.toBase58(),
    creationTx: signature,
  };
  fs.writeFileSync(OUTPUT_FILE, `${JSON.stringify(out, null, 2)}\n`);
  console.log("");
  console.log(`Wrote ${path.relative(process.cwd(), OUTPUT_FILE)}`);
  console.log("Commit this file — it's the source of truth for the deployed multisig.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
