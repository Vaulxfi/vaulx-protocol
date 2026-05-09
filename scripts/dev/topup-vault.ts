/**
 * Top up the demo USDC vault to a target TVL on devnet.
 *
 * Idempotent: reads the current vault balance, computes the shortage
 * vs the target, mints fresh USDC to Edson's ATA if his own balance is
 * short (mint authority = payer keypair, set by seed-usdc.ts), then
 * deposits the shortage.
 *
 * Why a separate script:
 *   - bootstrap-edson-devnet.ts is for first-run zero-state init; baking
 *     a "topup" mode into it confuses the contract (skip-if-exists vs
 *     extend-if-shortfall).
 *   - The Laravel borrower-side validation requires `principal >= 100`,
 *     so the demo vault needs at least a few hundred USDC of headroom
 *     to be useful for a real e2e flow. The original 5-USDC seed was
 *     just enough for the bridge happy-path test.
 *
 * Usage:
 *   pnpm exec tsx scripts/dev/topup-vault.ts [target_usdc=200]
 */

import "dotenv/config";

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  AnchorProvider,
  BN,
  Program,
  Wallet,
  type Idl,
} from "@coral-xyz/anchor";
import {
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  getAccount,
  getAssociatedTokenAddressSync,
  mintTo,
} from "@solana/spl-token";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";

import vaultIdlJson from "../../packages/idls/src/vault.json";

const RPC_URL =
  process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
const PAYER_KEYPAIR_PATH =
  process.env.PAYER_KEYPAIR ??
  path.join(os.homedir(), ".config", "solana", "id.json");
const STATE_PATH = path.join(__dirname, "edson-devnet.json");
const TARGET_USDC = Number(process.argv[2] ?? "200");

const VAULT_PROGRAM_ID = new PublicKey(
  (vaultIdlJson as { address: string }).address,
);

function loadKeypair(p: string): Keypair {
  const raw = fs.readFileSync(p.startsWith("~/") ? p.replace(/^~/, os.homedir()) : p, "utf8");
  return Keypair.fromSecretKey(new Uint8Array(JSON.parse(raw)));
}

interface State {
  assetMint: string;
  vault: string;
  vaultAta: string;
  vaultConfig: string;
  shareMint?: string;
}

async function main(): Promise<void> {
  const state = JSON.parse(fs.readFileSync(STATE_PATH, "utf8")) as State;
  if (!state.shareMint) {
    throw new Error("edson-devnet.json missing `shareMint` — run bootstrap-edson-devnet.ts first.");
  }

  const payer = loadKeypair(PAYER_KEYPAIR_PATH);
  console.log(`payer:        ${payer.publicKey.toBase58()}`);
  console.log(`rpc:          ${RPC_URL}`);
  console.log(`target TVL:   ${TARGET_USDC} USDC`);

  const targetAtoms = BigInt(TARGET_USDC) * 1_000_000n;
  const assetMint = new PublicKey(state.assetMint);
  const vaultPda = new PublicKey(state.vault);
  const vaultAta = new PublicKey(state.vaultAta);
  const vaultConfigPda = new PublicKey(state.vaultConfig);
  const shareMint = new PublicKey(state.shareMint);

  const connection = new Connection(RPC_URL, "confirmed");
  const provider = new AnchorProvider(connection, new Wallet(payer), {
    commitment: "confirmed",
  });
  const vaultProgram = new Program(vaultIdlJson as Idl, provider);

  // 1. Vault current
  let currentVaultAtoms = 0n;
  try {
    currentVaultAtoms = (await getAccount(connection, vaultAta, "confirmed")).amount;
  } catch {
    /* vault_ata may not exist yet on a fresh stack */
  }
  const currentUsdc = Number(currentVaultAtoms) / 1_000_000;
  console.log(`vault now:    ${currentUsdc.toFixed(2)} USDC`);

  if (currentVaultAtoms >= targetAtoms) {
    console.log("\n✓ Vault already at or above target — nothing to do.");
    return;
  }
  const shortageAtoms = targetAtoms - currentVaultAtoms;
  console.log(`shortage:     ${(Number(shortageAtoms) / 1_000_000).toFixed(2)} USDC`);

  // 2. Make sure Edson's depositor ATA has enough USDC; mint more if short.
  const depositorAta = getAssociatedTokenAddressSync(assetMint, payer.publicKey);
  let depositorAtoms = 0n;
  try {
    depositorAtoms = (await getAccount(connection, depositorAta, "confirmed")).amount;
  } catch {
    /* ata may need creation */
  }
  console.log(`depositor:    ${(Number(depositorAtoms) / 1_000_000).toFixed(2)} USDC in ATA`);

  if (depositorAtoms < shortageAtoms) {
    const mintShortageAtoms = shortageAtoms - depositorAtoms;
    console.log(
      `\n[1/2] mint  ${(Number(mintShortageAtoms) / 1_000_000).toFixed(2)} USDC ` +
        `to depositor ATA (mint authority = payer)`,
    );
    const sig = await mintTo(
      connection,
      payer,
      assetMint,
      depositorAta,
      payer,
      mintShortageAtoms,
    );
    console.log(`       tx: ${sig}`);
    await connection.confirmTransaction(sig, "confirmed");
  } else {
    console.log("\n[1/2] mint  skipped — depositor already has enough USDC");
  }

  // 3. Deposit the shortage into the vault. Build a single tx so we don't
  // get caught between idempotent ATA creates and the actual deposit ix.
  const depositorShareAta = getAssociatedTokenAddressSync(shareMint, payer.publicKey);
  console.log(
    `\n[2/2] deposit  ${(Number(shortageAtoms) / 1_000_000).toFixed(2)} USDC into vault`,
  );
  const tx = new Transaction()
    .add(
      createAssociatedTokenAccountIdempotentInstruction(
        payer.publicKey,
        depositorShareAta,
        payer.publicKey,
        shareMint,
      ),
    )
    .add(
      await (vaultProgram.methods as any)
        .deposit(new BN(shortageAtoms.toString()))
        .accounts({
          vault: vaultPda,
          assetMint,
          shareMint,
          vaultAta,
          depositorAta,
          depositorShareAta,
          depositor: payer.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          vaultConfig: vaultConfigPda,
          kycAttestation: SystemProgram.programId,
        })
        .instruction(),
    );

  const sig = await provider.sendAndConfirm(tx, [], { commitment: "confirmed" });
  console.log(`       tx: ${sig}`);

  // 4. Confirm new TVL
  const finalAtoms = (await getAccount(connection, vaultAta, "confirmed")).amount;
  const finalUsdc = Number(finalAtoms) / 1_000_000;
  console.log(`\n✓ Vault TVL now: ${finalUsdc.toFixed(2)} USDC`);
}

main().catch((err) => {
  console.error("topup-vault failed:", err);
  process.exit(1);
});
