import fs from "node:fs";
import path from "node:path";
import { Connection, Keypair, LAMPORTS_PER_SOL, clusterApiUrl, PublicKey } from "@solana/web3.js";
import { createMint, mintTo, getOrCreateAssociatedTokenAccount } from "@solana/spl-token";

const DIR = path.resolve(__dirname);
const MINT_FILE = path.join(DIR, "devnet-usdc.json");
const WALLETS_FILE = path.join(DIR, "demo-wallets.json");
const TARGET_SOL = 2 * LAMPORTS_PER_SOL;
const TARGET_USDC = 50_000 * 1_000_000;
const N_WALLETS = 6;

function pickRpcUrl(): string {
  // Prefer SOLANA_RPC_URL or HELIUS_API_KEY (Helius airdrops cleanly; the
  // public devnet RPC 429s aggressively).
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
    console.error(`Payer keypair not found at ${homeKeyPath}. Run 'solana-keygen new' first.`);
    process.exit(1);
  }
  const payer = Keypair.fromSecretKey(new Uint8Array(JSON.parse(fs.readFileSync(homeKeyPath, "utf8"))));

  const payerBal = await conn.getBalance(payer.publicKey);
  if (payerBal < 5 * LAMPORTS_PER_SOL) {
    console.error(`Payer ${payer.publicKey.toBase58()} has only ${payerBal / LAMPORTS_PER_SOL} SOL.`);
    console.error(`Pre-fund at https://faucet.solana.com and re-run.`);
    process.exit(1);
  }

  let mintPk: PublicKey;
  if (fs.existsSync(MINT_FILE)) {
    mintPk = new PublicKey(JSON.parse(fs.readFileSync(MINT_FILE, "utf8")).mint);
    console.log(`Using existing mint: ${mintPk.toBase58()}`);
  } else {
    mintPk = await createMint(conn, payer, payer.publicKey, null, 6);
    fs.writeFileSync(MINT_FILE, JSON.stringify({ mint: mintPk.toBase58() }, null, 2));
    console.log(`Created mint: ${mintPk.toBase58()}`);
  }

  type Wallet = { name: string; secretKey: number[]; pubkey: string };
  const wallets: Wallet[] = fs.existsSync(WALLETS_FILE)
    ? JSON.parse(fs.readFileSync(WALLETS_FILE, "utf8"))
    : [];
  while (wallets.length < N_WALLETS) {
    const kp = Keypair.generate();
    wallets.push({
      name: `demo-${wallets.length}`,
      secretKey: Array.from(kp.secretKey),
      pubkey: kp.publicKey.toBase58(),
    });
  }
  fs.writeFileSync(WALLETS_FILE, JSON.stringify(wallets, null, 2));

  for (const w of wallets) {
    const pk = new PublicKey(w.pubkey);
    const bal = await conn.getBalance(pk);
    if (bal < TARGET_SOL) {
      try {
        const sig = await conn.requestAirdrop(pk, TARGET_SOL - bal);
        await conn.confirmTransaction(sig, "confirmed");
        console.log(`  airdropped SOL to ${w.name}`);
      } catch (e) {
        console.warn(`  airdrop failed for ${w.name} (rate limit?) — continuing`);
      }
    }
    const ata = await getOrCreateAssociatedTokenAccount(conn, payer, mintPk, pk);
    if (Number(ata.amount) < TARGET_USDC) {
      await mintTo(conn, payer, mintPk, ata.address, payer, TARGET_USDC - Number(ata.amount));
      console.log(`  minted USDC to ${w.name}`);
    }
  }

  console.log(`\nSeeded ${wallets.length} wallets. Mint: ${mintPk.toBase58()}`);
}
main().catch(e => { console.error(e); process.exit(1); });
