/**
 * Seed a single demo loan on Devnet that the bridge's `confirm_custody`
 * flow can later consume.
 *
 * Two-step happy-path:
 *
 *   1. `loan::publish_price(ref_bytes, $8.00, listings=5, observed_at=now)`
 *      — admin-signs (loan_config.admin == oracle_admin == 2HYjytRc4o…,
 *      i.e. George's keypair). Creates or refreshes the PriceFeed PDA.
 *      Required because `loan_config.oracle_admin != Pubkey::default` on
 *      the deployed cluster, so `create_ccb_trdc` reads `effective_appraisal`
 *      from this feed instead of the synthetic `appraisal_value` arg.
 *
 *   2. `loan::create_ccb_trdc(loan_id, _, 4_000_000, due_ts, 2400, ref)`
 *      — borrower-signs (`payer = borrower` so `trdc_state.borrower` is
 *      our operator wallet, which lets the bridge later sign the disburse
 *      branch of `confirm_custody+disburse` as that same key).
 *
 * Inputs (env vars):
 *   ADMIN_KEYPAIR_PATH    required — keypair that originally bootstrapped
 *                         loan_config (admin = oracle_admin = custodian).
 *                         No default; the script aborts early if unset.
 *   BORROWER_KEYPAIR_PATH default ~/.config/solana/id.json. Whoever this
 *                         keypair represents becomes `trdc_state.borrower`
 *                         and must match the bridge's operator (so the
 *                         bridge can sign disburse).
 *   SOLANA_RPC_URL        default https://api.devnet.solana.com.
 *
 * Outputs:
 *   Prints the on-chain `loan_id` (this is the value the Laravel side
 *   stores in `loans.solana_loan_id` so /admin can hand it to the bridge).
 *
 * Re-runnable:
 *   PriceFeed publish uses `init_if_needed`, so each run refreshes the
 *   feed (necessary anyway because PriceFeed::MAX_AGE_SECONDS = 600s).
 *   `create_ccb_trdc` mints a fresh loan_id every run — re-running gives
 *   you a new demo loan, never overwriting the previous one.
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
import trdcIdlJson from "../../packages/idls/src/trdc.json";

// ---------------------------------------------------------------------------
// Demo parameters — change here, not on the call sites.
// ---------------------------------------------------------------------------
const RPC_URL =
  process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
const ASSET_HINT_LABEL = "vaulx-demo-watch-1"; // arbitrary; same hint = same feed
const APPRAISAL_USD_CENTS = 800; // $8.00 → effective_appraisal = 8_000_000 atoms
const APPRAISAL_LISTINGS = 5; // > PriceFeed::MIN_LISTINGS (3)
const LOAN_AMOUNT_ATOMS = 4_000_000; // 4 USDC; well under vault TVL (5 USDC)
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
  const expanded = expandHome(p);
  const raw = fs.readFileSync(expanded, "utf8");
  const bytes = JSON.parse(raw) as unknown;
  if (
    !Array.isArray(bytes) ||
    bytes.length !== 64 ||
    !bytes.every((b): b is number => typeof b === "number")
  ) {
    throw new Error(
      `keypair at ${expanded} is not a 64-byte JSON array (Solana CLI format)`,
    );
  }
  return Keypair.fromSecretKey(new Uint8Array(bytes));
}

async function main(): Promise<void> {
  const adminKeypairPath = process.env.ADMIN_KEYPAIR_PATH;
  if (!adminKeypairPath) {
    console.error(
      "ADMIN_KEYPAIR_PATH is not set.\n" +
        "Point it at the keypair that originally bootstrapped loan_config\n" +
        "(admin = oracle_admin = custodian = 2HYjytRc4oKY2ndmJfAq2XdGhPqYB7VdDPLzA18QEiAH).\n" +
        "Without that keypair the script can't publish a PriceFeed nor sign confirm_custody.",
    );
    process.exit(1);
  }
  const borrowerKeypairPath =
    process.env.BORROWER_KEYPAIR_PATH ??
    path.join(os.homedir(), ".config", "solana", "id.json");

  const admin = loadKeypair(adminKeypairPath);
  const borrower = loadKeypair(borrowerKeypairPath);
  console.log(`admin/oracle_admin: ${admin.publicKey.toBase58()}`);
  console.log(`borrower:           ${borrower.publicKey.toBase58()}`);
  console.log(`rpc:                ${RPC_URL}`);

  const connection = new Connection(RPC_URL, "confirmed");

  // Two providers — one per signing role. Anchor's Program holds a single
  // wallet, so we instantiate twice rather than juggle additional signers
  // on every ix builder call.
  const adminProvider = new AnchorProvider(connection, new Wallet(admin), {
    commitment: "confirmed",
  });
  const borrowerProvider = new AnchorProvider(
    connection,
    new Wallet(borrower),
    { commitment: "confirmed" },
  );
  const loanProgramAsAdmin = new Program(loanIdlJson as Idl, adminProvider);
  const loanProgramAsBorrower = new Program(
    loanIdlJson as Idl,
    borrowerProvider,
  );

  // Deterministic ref_bytes: every run for this label points to the same
  // feed PDA, so reruns refresh the existing PriceFeed instead of leaking
  // stranded ones. Production loans would use sha256 of the actual watch
  // identifier (serial number, COA hash, etc.).
  const refBytes = Buffer.from(
    crypto.createHash("sha256").update(ASSET_HINT_LABEL).digest(),
  );
  const [priceFeedPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("price_feed"), refBytes],
    LOAN_PROGRAM_ID,
  );
  const [loanConfigPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("loan_config")],
    LOAN_PROGRAM_ID,
  );

  // -------------------------------------------------------------------
  // [1/2] publish_price — admin signs.
  // -------------------------------------------------------------------
  const observedAt = Math.floor(Date.now() / 1000);
  console.log(
    `\n[1/2] publish_price ref=${refBytes.toString("hex").slice(0, 16)}… ` +
      `cents=${APPRAISAL_USD_CENTS} listings=${APPRAISAL_LISTINGS}`,
  );
  const sig1: string = await (loanProgramAsAdmin.methods as any)
    .publishPrice(
      Array.from(refBytes),
      new BN(APPRAISAL_USD_CENTS),
      APPRAISAL_LISTINGS,
      new BN(observedAt),
    )
    .accounts({
      priceFeed: priceFeedPda,
      loanConfig: loanConfigPda,
      oracleAdmin: admin.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
  console.log(`[1/2] tx: ${sig1}`);
  await connection.confirmTransaction(sig1, "confirmed");

  // -------------------------------------------------------------------
  // [2/2] create_ccb_trdc — borrower signs.
  //
  // appraisal_value is required > 0 by the program's first guard, but
  // when oracle is on the value is replaced by `feed.median_usd_cents *
  // 10_000`. We pass `LOAN_AMOUNT_ATOMS * 2` (matches what the feed
  // resolves to: $8 * 10_000 = 8_000_000 atoms) for clarity.
  // -------------------------------------------------------------------
  const loanId = Keypair.generate().publicKey;
  const dueTs = observedAt + TERM_DAYS * 86_400;
  const [trdcStatePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("trdc_state"), loanId.toBuffer()],
    TRDC_PROGRAM_ID,
  );

  console.log(`\n[2/2] create_ccb_trdc loan_id=${loanId.toBase58()}`);
  const sig2: string = await (loanProgramAsBorrower.methods as any)
    .createCcbTrdc(
      loanId,
      new BN(LOAN_AMOUNT_ATOMS * 2), // appraisal_value (ignored by oracle path; must be > 0)
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
      kycAttestation: SystemProgram.programId, // KYC gate disabled (loan_config.kyc_required = false)
      priceFeed: priceFeedPda,
    })
    .rpc();
  console.log(`[2/2] tx: ${sig2}`);
  await connection.confirmTransaction(sig2, "confirmed");

  // -------------------------------------------------------------------
  // Print the values Laravel needs to record.
  // -------------------------------------------------------------------
  console.log("\n✓ Demo loan minted on devnet.\n");
  console.log("--- Laravel integration values ---");
  console.log(`  solana_loan_id: ${loanId.toBase58()}`);
  console.log(`  trdc_state PDA: ${trdcStatePda.toBase58()}`);
  console.log(`  borrower:       ${borrower.publicKey.toBase58()}`);
  console.log(`  loan_amount:    ${LOAN_AMOUNT_ATOMS} atoms (= 4 USDC)`);
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
    "     run confirm_custody + disburse_from_vault as a single atomic tx.",
  );
}

main().catch((err) => {
  console.error("seed-demo-loan failed:", err);
  process.exit(1);
});
