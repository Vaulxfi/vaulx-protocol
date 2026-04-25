import fs from "node:fs";
import path from "node:path";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  clusterApiUrl,
} from "@solana/web3.js";

const DIR = path.resolve(__dirname);
const WALLETS_FILE = path.join(DIR, "demo-wallets.json");
const TARGET_SOL = 0.5; // each demo wallet should have at least this much

function pickRpcUrl(): string {
  if (process.env.SOLANA_RPC_URL) return process.env.SOLANA_RPC_URL;
  if (process.env.HELIUS_API_KEY) {
    return `https://devnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`;
  }
  return clusterApiUrl("devnet");
}

async function main() {
  const conn = new Connection(pickRpcUrl(), "confirmed");

  const homeKeyPath = `${process.env.HOME}/.config/solana/id.json`;
  if (!fs.existsSync(homeKeyPath)) {
    console.error(`Payer keypair not found at ${homeKeyPath}.`);
    process.exit(1);
  }
  const payer = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(homeKeyPath, "utf8"))),
  );

  if (!fs.existsSync(WALLETS_FILE)) {
    console.error(`Demo wallets not found at ${WALLETS_FILE}. Run pnpm seed:usdc first.`);
    process.exit(1);
  }
  const wallets = JSON.parse(fs.readFileSync(WALLETS_FILE, "utf8")) as Array<{
    name: string;
    secretKey: number[];
    pubkey: string;
  }>;

  const payerBal = await conn.getBalance(payer.publicKey);
  console.log(`payer ${payer.publicKey.toBase58()}: ${payerBal / LAMPORTS_PER_SOL} SOL`);

  const targetLamports = TARGET_SOL * LAMPORTS_PER_SOL;

  for (const w of wallets) {
    const pk = new PublicKey(w.pubkey);
    const bal = await conn.getBalance(pk);
    if (bal >= targetLamports) {
      console.log(`  ${w.name} ${w.pubkey}: ${bal / LAMPORTS_PER_SOL} SOL — skip`);
      continue;
    }
    const delta = targetLamports - bal;
    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: payer.publicKey,
        toPubkey: pk,
        lamports: delta,
      }),
    );
    const sig = await sendAndConfirmTransaction(conn, tx, [payer], {
      commitment: "confirmed",
    });
    console.log(
      `  ${w.name} ${w.pubkey}: +${delta / LAMPORTS_PER_SOL} SOL  (tx ${sig})`,
    );
  }

  const finalBal = await conn.getBalance(payer.publicKey);
  console.log(`payer remaining: ${finalBal / LAMPORTS_PER_SOL} SOL`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
