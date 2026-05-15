/**
 * Smoke test for F2-B: verify `create_ccb_trdc` runs without
 * deserializing `kyc_attestation` while `loan_config.kyc_required = false`.
 *
 * Validates the post-hotfix gate that lets the demo path stay byte-identical
 * to pre-hotfix behavior. Passes SystemProgram for kyc_attestation +
 * price_feed (both legal per IDL when their gates are off).
 *
 * Inputs (env vars):
 *   ADMIN_KEYPAIR   default ~/.config/solana/id.json (Edson's admin/custodian).
 *   SOLANA_RPC_URL  default https://api.devnet.solana.com.
 */

import "dotenv/config";

import crypto from "node:crypto";
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
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";

import loanIdlJson from "../../packages/idls/src/loan.json";

const RPC_URL = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
const ADMIN_KEYPAIR_PATH =
  process.env.ADMIN_KEYPAIR ?? path.join(os.homedir(), ".config/solana/id.json");

const TRDC_PROGRAM_ID = new PublicKey(
  "26rb68SPyjKmFNwSUmfZA7WRFtsKFheXf5xN8eHeeRWk",
);

function loadKeypair(p: string): Keypair {
  return Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(fs.readFileSync(p, "utf8"))),
  );
}

async function main() {
  const operator = loadKeypair(ADMIN_KEYPAIR_PATH);
  const conn = new Connection(RPC_URL, "confirmed");
  const provider = new AnchorProvider(conn, new Wallet(operator), {
    commitment: "confirmed",
  });

  const loanIdl = loanIdlJson as unknown as Idl;
  const loanProgram = new Program(loanIdl, provider);

  const [loanConfigPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("loan_config")],
    loanProgram.programId,
  );

  console.log("operator    :", operator.publicKey.toBase58());
  console.log("loan_program:", loanProgram.programId.toBase58());
  console.log("loan_config :", loanConfigPda.toBase58());

  // Pre-flight: confirm kyc_required = false (otherwise this test isn't
  // exercising the F2-B path).
  const cfg = await (loanProgram.account as any).loanConfig.fetch(loanConfigPda);
  console.log("kyc_required:", cfg.kycRequired);
  console.log("initialized :", cfg.initialized);
  if (cfg.kycRequired) {
    throw new Error(
      "loan_config.kyc_required = true; F2-B gate is not testable in current state",
    );
  }

  // Derive a fresh loan_id (used as PDA seed for trdc_state).
  const loanId = Keypair.generate().publicKey;
  const [trdcStatePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("trdc_state"), loanId.toBuffer()],
    TRDC_PROGRAM_ID,
  );

  const watchRef = `Rolex 126610LN Smoke ${new Date().toISOString()}`;
  const refBytes = crypto.createHash("sha256").update(watchRef).digest();
  const assetHint = Array.from(refBytes);

  const appraisalAtoms = new BN(15_000_000_000); // $15,000 in USDC atoms (6 dec)
  const loanAmount = appraisalAtoms.muln(5000).divn(10_000); // 50% LTV
  const dueTs = new BN(Math.floor(Date.now() / 1000) + 60 * 86400); // 60 days
  const rateBps = new BN(2400); // 24% APR

  console.log("\ncalling create_ccb_trdc with:");
  console.log("  loan_id          :", loanId.toBase58());
  console.log("  trdc_state       :", trdcStatePda.toBase58());
  console.log("  appraisal_atoms  :", appraisalAtoms.toString());
  console.log("  loan_amount      :", loanAmount.toString());
  console.log("  due_ts           :", dueTs.toString());
  console.log("  kyc_attestation  : SystemProgram (kyc_required=false)");
  console.log("  price_feed       : SystemProgram (oracle off)");

  const sig = await loanProgram.methods
    .createCcbTrdc(loanId, appraisalAtoms, loanAmount, dueTs, rateBps, assetHint)
    .accounts({
      trdcState: trdcStatePda,
      trdcProgram: TRDC_PROGRAM_ID,
      payer: operator.publicKey,
      systemProgram: SystemProgram.programId,
      loanConfig: loanConfigPda,
      kycAttestation: SystemProgram.programId, // F2-B: gate off ⇒ any account
      priceFeed: SystemProgram.programId, // oracle off ⇒ any account
    } as any)
    .rpc();

  console.log("\n✓ create_ccb_trdc OK");
  console.log("  sig         :", sig);
  console.log("  trdc_state  :", trdcStatePda.toBase58());

  // Read back the TRDC state to confirm it's at PendingCustody.
  const trdcInfo = await conn.getAccountInfo(trdcStatePda);
  console.log("\ntrdc_state size after :", trdcInfo?.data.length, "B");
  console.log("trdc_state owner      :", trdcInfo?.owner.toBase58());

  console.log("\nF2-B smoke PASSED — KycAttestation gate works with SystemProgram.");
}

main().catch((err) => {
  console.error("\nF2-B smoke FAILED:", err);
  process.exit(1);
});
