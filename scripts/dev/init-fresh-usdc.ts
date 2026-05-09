/**
 * Create a fresh "USDC-style" SPL mint that Edson controls end-to-end.
 *
 * Why we needed this: the original demo USDC mint
 * (4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU) was minted by an
 * ephemeral keypair (GrNg1XM2…) we don't hold, so Edson can't mint
 * more — which blocked top-up. New mint = Edson is mint authority,
 * we can mint as much as we want for the demo.
 *
 * What this does:
 *   1. Creates a new SPL Token mint with 6 decimals, mint authority
 *      = payer (Edson), freeze authority disabled (null).
 *   2. Mints 10,000 USDC (atoms = 10_000_000_000) to the payer's ATA.
 *   3. Persists the new mint pubkey to scripts/dev/edson-usdc.json so
 *      bootstrap-edson-devnet.ts can read it on the next run.
 *
 * After running this:
 *   1. Update env on AWS + Laravel to point at the NEW mint:
 *        bridge   .env  → BRIDGE_DEMO_ASSET_MINT=<new>
 *        laravel  .env  → SOLANA_BRIDGE_DEMO_ASSET_MINT=<new>
 *      Restart vaulx-bridge + clear Laravel config cache.
 *   2. Re-run bootstrap-edson-devnet.ts — it will detect that the
 *      vault for the new mint doesn't exist, create it, and deposit
 *      the default 5 USDC.
 *   3. Run vault:topup with whatever target you actually want for
 *      the demo (≥ 200 USDC for borrower-side flow with the
 *      `principal >= 100` Laravel validation).
 *
 * Safe to re-run: if edson-usdc.json already records a mint, this
 * script just tops up the payer's ATA with the requested amount
 * (default 10,000 USDC) without re-creating the mint.
 */

import "dotenv/config";

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  createMint,
  getAccount,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";

const RPC_URL = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
const PAYER_KEYPAIR_PATH =
  process.env.PAYER_KEYPAIR ?? path.join(os.homedir(), ".config", "solana", "id.json");
const TARGET_PAYER_USDC = Number(process.argv[2] ?? "10000");
const STATE_PATH = path.join(__dirname, "edson-usdc.json");

function loadKeypair(p: string): Keypair {
  const raw = fs.readFileSync(p.startsWith("~/") ? p.replace(/^~/, os.homedir()) : p, "utf8");
  return Keypair.fromSecretKey(new Uint8Array(JSON.parse(raw)));
}

async function main(): Promise<void> {
  const payer = loadKeypair(PAYER_KEYPAIR_PATH);
  const connection = new Connection(RPC_URL, "confirmed");
  console.log(`payer:    ${payer.publicKey.toBase58()}`);
  console.log(`rpc:      ${RPC_URL}`);
  console.log(`target:   ${TARGET_PAYER_USDC} USDC in payer ATA`);

  let mintPk: PublicKey;
  let prior: { mint?: string } = {};
  try {
    prior = JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
  } catch {
    /* no prior state */
  }

  if (prior.mint) {
    mintPk = new PublicKey(prior.mint);
    console.log(`\n[1/2] mint: ${mintPk.toBase58()}  (reusing prior — skipped create)`);
  } else {
    console.log("\n[1/2] createMint (decimals=6, freeze=null, authority=payer)");
    mintPk = await createMint(
      connection,
      payer,
      payer.publicKey, // mint authority
      null, // freeze authority disabled
      6, // USDC decimals
    );
    console.log(`       mint: ${mintPk.toBase58()}`);
    fs.writeFileSync(
      STATE_PATH,
      JSON.stringify(
        {
          mint: mintPk.toBase58(),
          mintAuthority: payer.publicKey.toBase58(),
          decimals: 6,
          createdAt: new Date().toISOString(),
        },
        null,
        2,
      ),
    );
    console.log(`       wrote ${path.relative(process.cwd(), STATE_PATH)}`);
  }

  // 2. Top up payer ATA to target amount.
  const ata = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mintPk,
    payer.publicKey,
  );
  const haveAtoms = (await getAccount(connection, ata.address, "confirmed")).amount;
  const targetAtoms = BigInt(TARGET_PAYER_USDC) * 1_000_000n;
  console.log(
    `\n[2/2] payer ATA: ${ata.address.toBase58()} — has ${
      Number(haveAtoms) / 1_000_000
    } USDC, target ${TARGET_PAYER_USDC}`,
  );
  if (haveAtoms >= targetAtoms) {
    console.log("       skipped (already at or above target)");
  } else {
    const shortage = targetAtoms - haveAtoms;
    const sig = await mintTo(connection, payer, mintPk, ata.address, payer, shortage);
    console.log(`       minted ${Number(shortage) / 1_000_000} USDC → tx ${sig}`);
  }

  console.log("\n✓ Done.");
  console.log("\n--- Next steps ---");
  console.log(`  Update on AWS bridge .env:`);
  console.log(`    BRIDGE_DEMO_ASSET_MINT=${mintPk.toBase58()}`);
  console.log(`  Update on Laravel (vaulx.fi) .env:`);
  console.log(`    SOLANA_BRIDGE_DEMO_ASSET_MINT=${mintPk.toBase58()}`);
  console.log(`  Then:`);
  console.log(`    sudo systemctl restart vaulx-bridge`);
  console.log(`    sudo -u www-data php artisan config:clear  # on Laravel`);
  console.log(`    pnpm exec tsx scripts/dev/bootstrap-edson-devnet.ts`);
  console.log(`    pnpm vault:topup 500`);
}

main().catch((err) => {
  console.error("init-fresh-usdc failed:", err);
  process.exit(1);
});
