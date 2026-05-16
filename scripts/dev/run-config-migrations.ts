/**
 * Run the post-hotfix admin migrations on Devnet.
 *
 * Calls (in order):
 *   1. vault::migrate_vault_config_v2 — reallocs vault_config from 74→75 B,
 *      writes initialized = true at the new offset.
 *   2. loan::migrate_loan_config_v3 — reallocs loan_config from 138→139 B,
 *      writes initialized = true at the new offset.
 *
 * Both ixs are idempotent on-chain (no-op when the account is already at
 * the new size and initialized = true), so re-running is safe.
 *
 * Inputs (env vars):
 *   ADMIN_KEYPAIR   default ~/.config/solana/id.json (Edson's admin key,
 *                   Ff5CL6V1WgxamomUbdSBaqVgxHh2wsUMXK9LbcWfcSNs).
 *   SOLANA_RPC_URL  default https://api.devnet.solana.com.
 */

import "dotenv/config";

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  AnchorProvider,
  Program,
  Wallet,
  type Idl,
} from "@coral-xyz/anchor";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";

import loanIdlJson from "../../packages/idls/src/loan.json";
import vaultIdlJson from "../../packages/idls/src/vault.json";

const RPC_URL = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";

const ADMIN_KEYPAIR_PATH =
  process.env.ADMIN_KEYPAIR ?? path.join(os.homedir(), ".config/solana/id.json");

const EXPECTED_ADMIN = "Ff5CL6V1WgxamomUbdSBaqVgxHh2wsUMXK9LbcWfcSNs";

function loadKeypair(p: string): Keypair {
  const raw = fs.readFileSync(p, "utf8");
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(raw)));
}

async function getAccountSize(
  conn: Connection,
  pubkey: PublicKey,
): Promise<number | null> {
  const info = await conn.getAccountInfo(pubkey);
  return info ? info.data.length : null;
}

async function main() {
  const admin = loadKeypair(ADMIN_KEYPAIR_PATH);
  if (admin.publicKey.toBase58() !== EXPECTED_ADMIN) {
    throw new Error(
      `ADMIN_KEYPAIR pubkey ${admin.publicKey.toBase58()} ≠ expected ${EXPECTED_ADMIN}`,
    );
  }

  const conn = new Connection(RPC_URL, "confirmed");
  const provider = new AnchorProvider(conn, new Wallet(admin), {
    commitment: "confirmed",
  });

  const vaultIdl = vaultIdlJson as unknown as Idl;
  const loanIdl = loanIdlJson as unknown as Idl;
  const vaultProgram = new Program(vaultIdl, provider);
  const loanProgram = new Program(loanIdl, provider);

  const [vaultConfigPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault_config")],
    vaultProgram.programId,
  );
  const [loanConfigPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("loan_config")],
    loanProgram.programId,
  );

  console.log("admin       :", admin.publicKey.toBase58());
  console.log("rpc         :", RPC_URL);
  console.log("vault_config:", vaultConfigPda.toBase58());
  console.log("loan_config :", loanConfigPda.toBase58());
  console.log();

  // --- vault::migrate_vault_config_v2 ---
  const vaultSizeBefore = await getAccountSize(conn, vaultConfigPda);
  console.log(`vault_config size before: ${vaultSizeBefore ?? "<missing>"} B`);
  if (vaultSizeBefore === null) {
    throw new Error("vault_config PDA does not exist — bootstrap first");
  }

  const vaultSig = await vaultProgram.methods
    .migrateVaultConfigV2()
    .accounts({
      vaultConfig: vaultConfigPda,
      admin: admin.publicKey,
      systemProgram: SystemProgram.programId,
    } as any)
    .rpc();
  const vaultSizeAfter = await getAccountSize(conn, vaultConfigPda);
  console.log(`vault_config size after : ${vaultSizeAfter} B`);
  console.log(`vault_config sig        : ${vaultSig}`);
  console.log();

  // --- loan::migrate_loan_config_v3 ---
  const loanSizeBefore = await getAccountSize(conn, loanConfigPda);
  console.log(`loan_config size before : ${loanSizeBefore ?? "<missing>"} B`);
  if (loanSizeBefore === null) {
    throw new Error("loan_config PDA does not exist — bootstrap first");
  }

  const loanSig = await loanProgram.methods
    .migrateLoanConfigV3()
    .accounts({
      loanConfig: loanConfigPda,
      admin: admin.publicKey,
      systemProgram: SystemProgram.programId,
    } as any)
    .rpc();
  const loanSizeAfter = await getAccountSize(conn, loanConfigPda);
  console.log(`loan_config size after  : ${loanSizeAfter} B`);
  console.log(`loan_config sig         : ${loanSig}`);
  console.log();

  console.log("done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
