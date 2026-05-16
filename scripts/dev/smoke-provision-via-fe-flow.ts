/**
 * End-to-end smoke for the FE-signing provision-loan flow.
 *
 *   1. POST /api/demo/build-create-ccb-tx — server returns an unsigned tx.
 *   2. We sign it locally with the admin keypair (simulating the borrower
 *      wallet — Crossmint or Phantom in production).
 *   3. Submit via RPC, wait for confirmation.
 *   4. POST /api/demo/confirm-and-disburse — operator signs the atomic
 *      confirm_custody, which disburses USDC into the borrower's ATA.
 *   5. Print the borrower ATA balance delta as proof the disburse landed.
 *
 * Inputs (env vars):
 *   BORROWER_KEYPAIR  default ~/.config/solana/id.json (the borrower's key).
 *   BASE_URL          default https://app.vaulx.fi.
 *   SOLANA_RPC_URL    default https://api.devnet.solana.com.
 *
 * NOTE: in this smoke the borrower's keypair == the admin/custodian
 * keypair (`Ff5CL6V1…`). In production the borrower is a separate user
 * wallet signed via Crossmint/Phantom. The route doesn't care — it only
 * needs `payer = borrowerPubkey` on create_ccb_trdc to make the atomic
 * disburse target valid.
 */

import "dotenv/config";

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  Connection,
  Keypair,
  Transaction,
  sendAndConfirmRawTransaction,
} from "@solana/web3.js";

const BASE_URL = process.env.BASE_URL ?? "https://app.vaulx.fi";
const RPC_URL = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
const BORROWER_KEYPAIR_PATH =
  process.env.BORROWER_KEYPAIR ??
  path.join(os.homedir(), ".config/solana/id.json");

function loadKeypair(p: string): Keypair {
  return Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(fs.readFileSync(p, "utf8"))),
  );
}

async function postJson<T>(url: string, body: object): Promise<T> {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await r.text();
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`Non-JSON response from ${url} [${r.status}]: ${text.slice(0, 500)}`);
  }
  if (!r.ok || parsed.ok === false) {
    throw new Error(
      `${url} [${r.status}]: ${parsed.detail ?? parsed.error ?? text}`,
    );
  }
  return parsed as T;
}

type BuildResp = {
  ok: true;
  loanId: string;
  trdcStatePda: string;
  refBytesHex: string;
  priceFeedPda: string | null;
  publishPriceTx: string | null;
  serializedTx: string;
  lastValidBlockHeight: number;
  blockhash: string;
  borrowerAta: string;
  assetMint: string;
};

type ConfirmResp = {
  ok: true;
  custodyTx: string;
  trdcStatePda: string;
  borrowerPubkey: string;
  borrowerAta: string;
  vault: string;
  vaultAta: string;
  assetMint: string;
  priceFeedPda: string | null;
  docHashHex: string;
  borrowerBalanceBefore: string | null;
  borrowerBalanceAfter: string | null;
  finalStatus: string;
};

async function main() {
  const borrower = loadKeypair(BORROWER_KEYPAIR_PATH);
  const conn = new Connection(RPC_URL, "confirmed");

  console.log("base_url    :", BASE_URL);
  console.log("rpc         :", RPC_URL);
  console.log("borrower    :", borrower.publicKey.toBase58());

  // --- Step 1: build the unsigned tx ----------------------------------
  console.log("\n[1/4] POST /api/demo/build-create-ccb-tx ...");
  const build = await postJson<BuildResp>(`${BASE_URL}/api/demo/build-create-ccb-tx`, {
    borrowerPubkey: borrower.publicKey.toBase58(),
    watchRef: `Rolex 126610LN Smoke FE-flow ${new Date().toISOString()}`,
    appraisalUsdCents: 1_500_000,
    ltvBps: 5000,
    termDays: 60,
  });
  console.log("  loan_id      :", build.loanId);
  console.log("  trdc_state   :", build.trdcStatePda);
  console.log("  borrower_ata :", build.borrowerAta);
  console.log("  asset_mint   :", build.assetMint);
  if (build.publishPriceTx) console.log("  oracle_publish_sig:", build.publishPriceTx);

  // --- Step 2: sign locally -------------------------------------------
  console.log("\n[2/4] Sign the unsigned tx locally (simulating borrower wallet)...");
  const tx = Transaction.from(Buffer.from(build.serializedTx, "base64"));
  tx.partialSign(borrower);
  if (!tx.signatures.every((s) => s.signature !== null)) {
    throw new Error("tx still has unsigned slots after partialSign");
  }
  console.log("  signed by    :", borrower.publicKey.toBase58());

  // --- Step 3: submit via RPC -----------------------------------------
  console.log("\n[3/4] Submit signed tx via RPC...");
  const rawTx = tx.serialize();
  const createSig = await sendAndConfirmRawTransaction(conn, rawTx, {
    commitment: "confirmed",
    maxRetries: 5,
  });
  console.log("  create_ccb_trdc sig:", createSig);

  // --- Step 4: confirm-and-disburse -----------------------------------
  console.log("\n[4/4] POST /api/demo/confirm-and-disburse ...");
  const confirm = await postJson<ConfirmResp>(`${BASE_URL}/api/demo/confirm-and-disburse`, {
    loanId: build.loanId,
    borrowerPubkey: borrower.publicKey.toBase58(),
  });
  console.log("  custody sig         :", confirm.custodyTx);
  console.log("  borrower_balance_before:", confirm.borrowerBalanceBefore);
  console.log("  borrower_balance_after :", confirm.borrowerBalanceAfter);
  console.log("  final trdc status   :", confirm.finalStatus);

  // Validation: status should be "active" and balance should have increased.
  if (confirm.finalStatus.toLowerCase() !== "active") {
    throw new Error(
      `expected final trdc_state.status = Active, got ${confirm.finalStatus}`,
    );
  }
  const before = Number(confirm.borrowerBalanceBefore ?? 0);
  const after = Number(confirm.borrowerBalanceAfter ?? 0);
  const expectedDisburse = (build as any).state?.loanAmountAtoms
    ? Number((build as any).state.loanAmountAtoms) / 1_000_000
    : null;
  console.log(
    `  delta              : +${(after - before).toFixed(6)} USDC` +
      (expectedDisburse ? ` (expected ~${expectedDisburse})` : ""),
  );
  if (after <= before) {
    throw new Error(
      `borrower_ata balance did not increase (before=${before}, after=${after}).`,
    );
  }

  console.log("\nFE-signing flow smoke PASSED.");
}

main().catch((err) => {
  console.error("\nFE-signing flow smoke FAILED:", err);
  process.exit(1);
});
