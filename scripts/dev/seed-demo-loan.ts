/**
 * Seed a single demo loan on devnet that the bridge's
 * `confirm_custody+disburse` flow can later consume.
 *
 * One-step happy-path (oracle is OFF on Edson's deployed loan_config,
 * so no PriceFeed is required and no admin keypair is needed):
 *
 *   loan::create_ccb_trdc(loan_id, appraisal=8 USDC, loan_amount=4 USDC,
 *                         due_ts=now+30d, rate_bps=2400, ref=zeros)
 *
 *   payer = borrower so trdc_state.borrower captures the operator wallet,
 *   which lets the bridge later sign disburse_from_vault as that key.
 *
 * Inputs (env vars):
 *   BORROWER_KEYPAIR_PATH  default ~/.config/solana/id.json (Edson). The
 *                          bridge's operator must equal this borrower for
 *                          the post-confirm disburse step to land.
 *   SOLANA_RPC_URL         default https://api.devnet.solana.com.
 *
 * Outputs:
 *   Prints the on-chain `loan_id`. Persist in Laravel as
 *   `loans.solana_loan_id` so /admin's Approve Custody hands it to the
 *   bridge.
 *
 * Re-runnable: `create_ccb_trdc` mints a fresh loan_id every run. Each
 * call costs the borrower a tiny rent for the new TRDCState PDA.
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
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";

import loanIdlJson from "../../packages/idls/src/loan.json";
import trdcIdlJson from "../../packages/idls/src/trdc.json";

// Demo parameters — change here, not at the call sites.
const RPC_URL =
  process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
const APPRAISAL_ATOMS = 8_000_000; // 8 USDC — synthetic, oracle OFF
const LOAN_AMOUNT_ATOMS = 4_000_000; // 4 USDC; fits the 5 USDC vault TVL
const RATE_BPS = 2400; // 24% APR
const TERM_DAYS = 30;

const LOAN_PROGRAM_ID = new PublicKey(
  (loanIdlJson as { address: string }).address,
);
const TRDC_PROGRAM_ID = new PublicKey(
  (trdcIdlJson as { address: string }).address,
);

function expandHome(p: string): string {
  return p.startsWith("~/") ? p.replace(/^~/, os.homedir()) : p;
}

function loadKeypair(p: string): Keypair {
  const raw = fs.readFileSync(expandHome(p), "utf8");
  return Keypair.fromSecretKey(new Uint8Array(JSON.parse(raw)));
}

async function main(): Promise<void> {
  const borrowerKeypairPath =
    process.env.BORROWER_KEYPAIR_PATH ??
    path.join(os.homedir(), ".config", "solana", "id.json");
  const borrower = loadKeypair(borrowerKeypairPath);
  console.log(`borrower: ${borrower.publicKey.toBase58()}`);
  console.log(`rpc:      ${RPC_URL}`);

  const connection = new Connection(RPC_URL, "confirmed");
  const provider = new AnchorProvider(connection, new Wallet(borrower), {
    commitment: "confirmed",
  });
  const loanProgram = new Program(loanIdlJson as Idl, provider);

  const [loanConfigPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("loan_config")],
    LOAN_PROGRAM_ID,
  );

  // Oracle OFF: ref_bytes is unused on the create path (effective_appraisal
  // takes the synthetic `appraisal_value` arg). Pass zeros — it's persisted
  // on TRDCState but never re-derived to a PriceFeed PDA at disburse time
  // because loan_config.oracle_admin == Pubkey::default.
  const refBytes = Buffer.alloc(32);

  const loanId = Keypair.generate().publicKey;
  const observedAt = Math.floor(Date.now() / 1000);
  const dueTs = observedAt + TERM_DAYS * 86_400;
  const [trdcStatePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("trdc_state"), loanId.toBuffer()],
    TRDC_PROGRAM_ID,
  );

  console.log(`\ncreate_ccb_trdc loan_id=${loanId.toBase58()}`);
  const sig: string = await (loanProgram.methods as any)
    .createCcbTrdc(
      loanId,
      new BN(APPRAISAL_ATOMS),
      new BN(LOAN_AMOUNT_ATOMS),
      new BN(dueTs),
      new BN(RATE_BPS),
      Array.from(refBytes),
    )
    .accounts({
      trdcState: trdcStatePda,
      trdcProgram: TRDC_PROGRAM_ID,
      payer: borrower.publicKey,
      systemProgram: SystemProgram.programId,
      loanConfig: loanConfigPda,
      kycAttestation: SystemProgram.programId, // kyc gate OFF
      priceFeed: SystemProgram.programId, // oracle OFF
    })
    .rpc();
  console.log(`tx: ${sig}`);
  await connection.confirmTransaction(sig, "confirmed");

  console.log("\n✓ Demo loan minted on devnet.\n");
  console.log("--- Laravel integration values ---");
  console.log(`  solana_loan_id: ${loanId.toBase58()}`);
  console.log(`  trdc_state:     ${trdcStatePda.toBase58()}`);
  console.log(`  borrower:       ${borrower.publicKey.toBase58()}`);
  console.log(
    `  loan_amount:    ${LOAN_AMOUNT_ATOMS} atoms (= 4 USDC)`,
  );
  console.log(`  due_ts:         ${new Date(dueTs * 1000).toISOString()}`);
  console.log("\n--- Next steps ---");
  console.log(
    "  1. In Laravel: persist a `loans` row with status='pending_custody' and",
  );
  console.log("     `solana_loan_id` set to the value above.");
  console.log(
    "  2. In /admin, click Approve Custody on that loan — the bridge will",
  );
  console.log(
    "     run confirm_custody + disburse_from_vault as a single tx.",
  );
}

main().catch((err) => {
  console.error("seed-demo-loan failed:", err);
  process.exit(1);
});
