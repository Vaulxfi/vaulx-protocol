/**
 * Mint a `vault.issue_kyc_attestation` for any pubkey, using the admin
 * keypair (= vault_config.admin). Workaround/operator-tool when the
 * Sumsub webhook isn't reaching the prod handler (or hasn't been wired
 * up yet), so the FE's `useKycGate` modal never sees the on-chain
 * attestation appear and hangs at "Verifying on-chain attestation…".
 *
 * Idempotent on-chain (the ix returns ok if the PDA already exists).
 *
 * Inputs:
 *   - argv[2] (required): owner pubkey (base58)
 *   - ADMIN_KEYPAIR (env, default ~/.config/solana/id.json): admin keypair
 *   - SOLANA_RPC_URL (env, default devnet)
 */
import "dotenv/config";

import crypto from "node:crypto";
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

import vaultIdlJson from "../../packages/idls/src/vault.json";

const RPC_URL = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
const ADMIN_KEYPAIR_PATH =
  process.env.ADMIN_KEYPAIR ?? path.join(os.homedir(), ".config/solana/id.json");

function loadKeypair(p: string): Keypair {
  return Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(fs.readFileSync(p, "utf8"))),
  );
}

async function main() {
  const ownerArg = process.argv[2];
  if (!ownerArg) {
    console.error("Usage: tsx mint-kyc-attestation.ts <ownerPubkey>");
    process.exit(2);
  }
  const owner = new PublicKey(ownerArg);

  const admin = loadKeypair(ADMIN_KEYPAIR_PATH);
  const conn = new Connection(RPC_URL, "confirmed");
  const provider = new AnchorProvider(conn, new Wallet(admin), {
    commitment: "confirmed",
  });

  const vaultIdl = vaultIdlJson as unknown as Idl;
  const vaultProgram = new Program(vaultIdl, provider);

  const [kycAttestation] = PublicKey.findProgramAddressSync(
    [Buffer.from("kyc_attestation"), owner.toBuffer()],
    vaultProgram.programId,
  );
  const [vaultConfig] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault_config")],
    vaultProgram.programId,
  );

  console.log("admin           :", admin.publicKey.toBase58());
  console.log("owner           :", owner.toBase58());
  console.log("vault_config    :", vaultConfig.toBase58());
  console.log("kyc_attestation :", kycAttestation.toBase58());

  const existing = await conn.getAccountInfo(kycAttestation);
  if (existing) {
    console.log("\n✓ KycAttestation PDA already exists — no-op.");
    return;
  }

  // The on-chain ix stores a 32-byte `jwt_hash`. Sumsub-webhook origin
  // uses sha256(applicantId + reviewResult). For an operator-mint we
  // use a deterministic placeholder so re-runs match.
  const jwtHash = Array.from(
    crypto.createHash("sha256").update(`operator-mint:${owner.toBase58()}`).digest(),
  );

  const sig = await (vaultProgram.methods as any)
    .issueKycAttestation(owner, jwtHash)
    .accounts({
      kycAttestation,
      vaultConfig,
      admin: admin.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc({ commitment: "confirmed" });

  console.log("\n✓ Minted. tx:", sig);
}

main().catch((err) => {
  console.error("\nmint-kyc-attestation FAILED:", err);
  process.exit(1);
});
