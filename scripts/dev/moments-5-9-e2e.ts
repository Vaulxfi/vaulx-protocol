/**
 * Moments 5 + 6 + 7 + 8 + 9 end-to-end happy-path harness (Task 3.9).
 *
 * Completes the demo moment sequence on Devnet. Covers:
 *   Loan A — pay -> renew -> repay (Moments 5 + 6 + repay closing)
 *     create_ccb_trdc -> confirm_custody -> disburse_from_vault ->
 *     pay_installment -> renew_ccb -> repay_ccb
 *   Loan B — default -> auction (Moments 7 + 8 + 9)
 *     create_ccb_trdc (due_ts = now-4d, past grace) -> confirm_custody ->
 *     disburse_from_vault -> execute_af_default -> place_bid -> close_auction
 *
 * Each on-chain call is round-tripped through the indexer into Supabase and
 * the resulting `onchain_events` row is polled by signature.
 *
 * Exit codes:
 *   0 -> pass
 *   2 -> SKIPPED (env / seed files / funding / vault liquidity missing)
 *   1 -> fail (any unmet assertion or RPC error)
 *
 * Preconditions (else SKIPPED):
 *   - SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) + SUPABASE_SERVICE_ROLE_KEY
 *     (loaded from apps/indexer/.env.local and apps/web/.env.local if present).
 *   - scripts/dev/devnet-usdc.json and scripts/dev/demo-wallets.json exist with
 *     >= 4 entries (lender, borrower, custodian, bidder).
 *   - Payer (~/.config/solana/id.json) has >= 0.1 SOL on Devnet.
 *   - Vault for devnet USDC initialized AND >= 200 USDC of liquidity — we
 *     disburse twice (120 USDC each) across the two loans.
 *   - LoanConfig + VaultConfig exist (the harness initializes them if not,
 *     mirroring moments-2-3-4-e2e.ts).
 *
 * Run directly:
 *   pnpm exec tsx scripts/dev/moments-5-9-e2e.ts
 *
 * Gotcha: Anchor 0.30.1 lowercases the first letter of #[event] names, so we
 * assert `installmentPaid`, `ccbRenewed`, `ccbRepaid`, `afDefaultExecuted`,
 * `auctionCreated`, `bidPlaced`, `auctionClosed`. See apps/indexer/src/main.ts.
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";

import dotenv from "dotenv";
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
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createTransferInstruction,
  getAccount,
  getAssociatedTokenAddressSync,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { rateForTermDays } from "@vaulx/terms";

import loanIdlJson from "../../packages/idls/src/loan.json";
import trdcIdlJson from "../../packages/idls/src/trdc.json";
import vaultIdlJson from "../../packages/idls/src/vault.json";
import auctionIdlJson from "../../packages/idls/src/auction.json";

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const MINT_FILE = path.join(REPO_ROOT, "scripts", "dev", "devnet-usdc.json");
const WALLETS_FILE = path.join(REPO_ROOT, "scripts", "dev", "demo-wallets.json");
const INDEXER_ENV = path.join(REPO_ROOT, "apps", "indexer", ".env.local");
const WEB_ENV = path.join(REPO_ROOT, "apps", "web", ".env.local");

const EXIT_SKIPPED = 2;
const EXIT_FAIL = 1;
const EXIT_OK = 0;

// Amounts in USDC atoms (6 decimals).
const APPRAISAL = new BN("200000000"); // 200 USDC
const LOAN_AMOUNT = new BN("120000000"); // 120 USDC (60% LTV cap)
const INSTALLMENT = new BN("30000000"); //  30 USDC (~25% of principal)
const MIN_VAULT_LIQUIDITY = new BN("250000000"); // 250 USDC (two disburses)
const MIN_PAYER_LAMPORTS = 0.1 * LAMPORTS_PER_SOL;

const AUCTION_DURATION_SECS = 4;
const POLL_INTERVAL_MS = 1_000;
const POLL_TIMEOUT_MS = 30_000;

function skip(reason: string): never {
  console.log(`SKIPPED: ${reason}`);
  process.exit(EXIT_SKIPPED);
}

function fail(msg: string, err?: unknown): never {
  console.error(`FAIL: ${msg}`);
  if (err) console.error(err);
  process.exit(EXIT_FAIL);
}

function loadEnvIfPresent(file: string): void {
  if (fs.existsSync(file)) dotenv.config({ path: file, override: false });
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function randomBytes32(): Uint8Array {
  return new Uint8Array(crypto.randomBytes(32));
}

type DemoWallet = { name: string; secretKey: number[]; pubkey: string };

type EventRow = { payload: any; event_name: string; signature: string };

async function pollForEvent(
  supabase: SupabaseClient,
  signature: string,
  eventName: string,
): Promise<EventRow> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const { data, error } = await supabase
      .from("onchain_events")
      .select("payload, event_name, signature")
      .eq("signature", signature)
      .eq("event_name", eventName)
      .maybeSingle();
    if (error && error.code !== "PGRST116") {
      fail(`Supabase query error: ${error.message}`, error);
    }
    if (data) return data as unknown as EventRow;
    await sleep(POLL_INTERVAL_MS);
  }
  fail(
    `no onchain_events row with event_name='${eventName}' and signature=${signature} ` +
      `within ${POLL_TIMEOUT_MS}ms. Is apps/indexer running against Devnet?`,
  );
}

async function mintCcbTrdc(params: {
  loanProgram: Program;
  payer: Keypair;
  loanConfigPda: PublicKey;
  trdcProgramId: PublicKey;
  appraisal: BN;
  loanAmount: BN;
  dueTs: BN;
  rateBps: number;
}): Promise<{ loanId: PublicKey; trdcPda: PublicKey; sig: string }> {
  const {
    loanProgram,
    payer,
    loanConfigPda,
    trdcProgramId,
    appraisal,
    loanAmount,
    dueTs,
    rateBps,
  } = params;
  const loanId = Keypair.generate().publicKey;
  const [trdcPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("trdc_state"), loanId.toBuffer()],
    trdcProgramId,
  );
  const assetHintBytes = randomBytes32();
  const sig: string = await (loanProgram.methods as any)
    .createCcbTrdc(
      loanId,
      appraisal,
      loanAmount,
      dueTs,
      new BN(rateBps),
      Array.from(assetHintBytes),
    )
    .accounts({
      trdcState: trdcPda,
      trdcProgram: trdcProgramId,
      payer: payer.publicKey,
      systemProgram: SystemProgram.programId,
      loanConfig: loanConfigPda,
      gatewayToken: SystemProgram.programId, // civic disabled => any account
    })
    .rpc({ commitment: "confirmed" });
  return { loanId, trdcPda, sig };
}

async function main(): Promise<void> {
  // 1. Env files.
  loadEnvIfPresent(INDEXER_ENV);
  loadEnvIfPresent(WEB_ENV);

  const supabaseUrl =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    skip(
      "missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and/or SUPABASE_SERVICE_ROLE_KEY",
    );
  }

  // 2. Seed files.
  if (!fs.existsSync(MINT_FILE)) skip(`missing ${MINT_FILE}`);
  if (!fs.existsSync(WALLETS_FILE)) skip(`missing ${WALLETS_FILE}`);

  const mintPk = new PublicKey(
    (JSON.parse(fs.readFileSync(MINT_FILE, "utf8")) as { mint: string }).mint,
  );
  const wallets = JSON.parse(fs.readFileSync(WALLETS_FILE, "utf8")) as DemoWallet[];
  if (wallets.length < 4) {
    skip(
      `demo-wallets.json has ${wallets.length} entries; need >= 4 ` +
        `(lender, borrower, custodian, bidder). Re-run scripts/dev/seed-usdc.ts.`,
    );
  }
  const lender = Keypair.fromSecretKey(new Uint8Array(wallets[0].secretKey));
  const borrower = Keypair.fromSecretKey(new Uint8Array(wallets[1].secretKey));
  const custodian = Keypair.fromSecretKey(new Uint8Array(wallets[2].secretKey));
  const bidder = Keypair.fromSecretKey(new Uint8Array(wallets[3].secretKey));

  // 3. Payer keypair.
  const payerPath = path.join(os.homedir(), ".config", "solana", "id.json");
  if (!fs.existsSync(payerPath)) skip(`missing payer keypair at ${payerPath}`);
  const payer = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(payerPath, "utf8"))),
  );

  // 4. Connection + payer funding check.
  const rpc = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
  const connection = new Connection(rpc, "confirmed");

  const payerBal = await connection.getBalance(payer.publicKey);
  if (payerBal < MIN_PAYER_LAMPORTS) {
    skip(
      `payer ${payer.publicKey.toBase58()} has ${payerBal / LAMPORTS_PER_SOL} SOL ` +
        `(< ${MIN_PAYER_LAMPORTS / LAMPORTS_PER_SOL})`,
    );
  }

  // 5. Anchor provider + programs.
  const provider = new AnchorProvider(connection, new Wallet(payer), {
    commitment: "confirmed",
  });
  const loanIdl = loanIdlJson as unknown as Idl;
  const trdcIdl = trdcIdlJson as unknown as Idl;
  const vaultIdl = vaultIdlJson as unknown as Idl;
  const auctionIdl = auctionIdlJson as unknown as Idl;
  const loanProgramId = new PublicKey((loanIdlJson as { address: string }).address);
  const trdcProgramId = new PublicKey((trdcIdlJson as { address: string }).address);
  const vaultProgramId = new PublicKey((vaultIdlJson as { address: string }).address);
  const auctionProgramId = new PublicKey(
    (auctionIdlJson as { address: string }).address,
  );

  const loanProgram = new Program(loanIdl, provider);
  const trdcProgram = new Program(trdcIdl, provider);
  const vaultProgram = new Program(vaultIdl, provider);
  const auctionProgram = new Program(auctionIdl, provider);

  // 6. Vault precheck.
  const [vaultPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), mintPk.toBuffer()],
    vaultProgramId,
  );
  const vaultAccInfo = await connection.getAccountInfo(vaultPda);
  if (!vaultAccInfo) {
    skip(
      `vault ${vaultPda.toBase58()} is not initialized. Run ` +
        `\`pnpm exec tsx scripts/dev/moment-1-e2e.ts\` first to bootstrap it ` +
        `and seed initial liquidity.`,
    );
  }
  const vaultAcc = (await (vaultProgram.account as any).vault.fetch(vaultPda)) as {
    totalAssets: BN;
  };
  if (new BN(vaultAcc.totalAssets.toString()).lt(MIN_VAULT_LIQUIDITY)) {
    skip(
      `vault total_assets=${vaultAcc.totalAssets.toString()} atoms < required ` +
        `${MIN_VAULT_LIQUIDITY.toString()}. Run moment-1-e2e.ts (or another ` +
        `lender deposit) to top up before the two-loan flow.`,
    );
  }

  // 7. LoanConfig.
  const [loanConfigPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("loan_config")],
    loanProgramId,
  );
  const loanConfig = (await (loanProgram.account as any).loanConfig.fetchNullable(
    loanConfigPda,
  )) as { custodian: PublicKey } | null;
  if (!loanConfig) {
    console.log(
      `initializing loan_config (custodian=${custodian.publicKey.toBase58()}, civic disabled)`,
    );
    await (loanProgram.methods as any)
      .initializeLoanConfig(custodian.publicKey, PublicKey.default)
      .accounts({
        loanConfig: loanConfigPda,
        admin: payer.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  } else {
    const currentCustodian = new PublicKey(loanConfig.custodian);
    console.log(
      `loan_config already initialized; custodian=${currentCustodian.toBase58()}`,
    );
    if (!currentCustodian.equals(custodian.publicKey)) {
      console.warn(
        `WARNING: loan_config.custodian (${currentCustodian.toBase58()}) != demo-wallets[2] ` +
          `(${custodian.publicKey.toBase58()}). confirm_custody will fail unless ` +
          `demo-wallets[2] matches the on-chain custodian.`,
      );
    }
  }

  // 8. VaultConfig.
  const [vaultConfigPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault_config")],
    vaultProgramId,
  );
  const existingVaultCfg = await (vaultProgram.account as any).vaultConfig.fetchNullable(
    vaultConfigPda,
  );
  if (!existingVaultCfg) {
    await (vaultProgram.methods as any)
      .initializeVaultConfig(PublicKey.default)
      .accounts({
        vaultConfig: vaultConfigPda,
        admin: payer.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  }

  // 9. Fund the three demo signers with a little SOL (signers need an
  //    account; devnet airdrop is flaky so we fall back to a transfer).
  for (const kp of [borrower, custodian, bidder]) {
    const bal = await connection.getBalance(kp.publicKey);
    if (bal < 0.01 * LAMPORTS_PER_SOL) {
      try {
        const sig = await connection.requestAirdrop(
          kp.publicKey,
          0.1 * LAMPORTS_PER_SOL,
        );
        await connection.confirmTransaction(sig, "confirmed");
      } catch {
        try {
          const fundTx = new Transaction().add(
            SystemProgram.transfer({
              fromPubkey: payer.publicKey,
              toPubkey: kp.publicKey,
              lamports: 0.02 * LAMPORTS_PER_SOL,
            }),
          );
          await sendAndConfirmTransaction(connection, fundTx, [payer], {
            commitment: "confirmed",
          });
        } catch (e) {
          console.warn(
            `could not fund ${kp.publicKey.toBase58()}: ${
              e instanceof Error ? e.message : String(e)
            }`,
          );
        }
      }
    }
  }

  // 10. Supabase client.
  const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const [loanAuthorityPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("loan_authority")],
    loanProgramId,
  );
  const vaultAta = getAssociatedTokenAddressSync(mintPk, vaultPda, true);
  const vaultAtaInfo = await connection.getAccountInfo(vaultAta);
  if (!vaultAtaInfo) {
    fail(
      `vault_ata ${vaultAta.toBase58()} missing; moment-1-e2e.ts is the ` +
        `canonical place to create it. Re-run it before Moments 5–9.`,
    );
  }

  const borrowerAtaAcc = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mintPk,
    borrower.publicKey,
  );
  const borrowerAta = borrowerAtaAcc.address;
  const bidderAtaAcc = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mintPk,
    bidder.publicKey,
  );
  const bidderAta = bidderAtaAcc.address;

  // ==========================================================================
  // LOAN A — pay -> renew -> repay (Moments 5 + 6 + closing repay).
  // ==========================================================================
  console.log(`\n========================================`);
  console.log(`LOAN A — pay / renew / repay`);
  console.log(`========================================`);

  const termADays = 30;
  const dueTsA = new BN(Math.floor(Date.now() / 1000) + termADays * 86400);
  const rateBpsA = rateForTermDays(termADays);
  const {
    loanId: loanIdA,
    trdcPda: trdcPdaA,
    sig: sigCreateA,
  } = await mintCcbTrdc({
    loanProgram,
    payer,
    loanConfigPda,
    trdcProgramId,
    appraisal: APPRAISAL,
    loanAmount: LOAN_AMOUNT,
    dueTs: dueTsA,
    rateBps: rateBpsA,
  });
  console.log(
    `[A:create] loanId=${loanIdA.toBase58()} trdc=${trdcPdaA.toBase58()} tx=${sigCreateA}`,
  );
  await pollForEvent(supabase, sigCreateA, "ccbTrdcCreated");

  const docHashA = randomBytes32();
  const sigCustA: string = await (loanProgram.methods as any)
    .confirmCustody(Array.from(docHashA))
    .accounts({
      trdcState: trdcPdaA,
      loanConfig: loanConfigPda,
      trdcProgram: trdcProgramId,
      custodian: custodian.publicKey,
    })
    .signers([custodian])
    .rpc({ commitment: "confirmed" });
  console.log(`[A:custody] tx=${sigCustA}`);
  await pollForEvent(supabase, sigCustA, "custodyConfirmed");

  const sigDisbA: string = await (loanProgram.methods as any)
    .disburseFromVault(LOAN_AMOUNT)
    .accounts({
      trdcState: trdcPdaA,
      loanConfig: loanConfigPda,
      vault: vaultPda,
      assetMint: mintPk,
      vaultAta,
      borrowerAta,
      loanAuthority: loanAuthorityPda,
      borrower: borrower.publicKey,
      trdcProgram: trdcProgramId,
      vaultProgram: vaultProgramId,
      tokenProgram: TOKEN_PROGRAM_ID,
      instructionsSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
    })
    .signers([borrower])
    .rpc({ commitment: "confirmed" });
  console.log(`[A:disburse] tx=${sigDisbA}`);
  await pollForEvent(supabase, sigDisbA, "disbursed");

  // -------- Moment 5 — pay_installment --------
  const vaultBeforePay = (await (vaultProgram.account as any).vault.fetch(
    vaultPda,
  )) as { totalAssets: BN };
  console.log(`\n[Moment 5] pay_installment amount=${INSTALLMENT.toString()}`);
  const sigPay: string = await (loanProgram.methods as any)
    .payInstallment(INSTALLMENT)
    .accounts({
      trdcState: trdcPdaA,
      vault: vaultPda,
      assetMint: mintPk,
      vaultAta,
      borrowerAta,
      borrower: borrower.publicKey,
      loanAuthority: loanAuthorityPda,
      trdcProgram: trdcProgramId,
      vaultProgram: vaultProgramId,
      tokenProgram: TOKEN_PROGRAM_ID,
      instructionsSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
    })
    .signers([borrower])
    .rpc({ commitment: "confirmed" });
  console.log(`[Moment 5] tx=${sigPay}`);
  const rowPay = await pollForEvent(supabase, sigPay, "installmentPaid");
  const payloadPay = rowPay.payload ?? {};
  const principalAfterPay = String(
    payloadPay.principal_remaining_after ?? payloadPay.principalRemainingAfter,
  );
  const expectedPrincipalAfter = LOAN_AMOUNT.sub(INSTALLMENT).toString();
  if (principalAfterPay !== expectedPrincipalAfter) {
    fail(
      `[Moment 5] payload.principal_remaining_after=${principalAfterPay} expected ${expectedPrincipalAfter}`,
    );
  }
  const trdcAfterPay = (await (trdcProgram.account as any).trdcState.fetch(
    trdcPdaA,
  )) as { principalRemaining: BN; status: Record<string, unknown> };
  if (trdcAfterPay.principalRemaining.toString() !== expectedPrincipalAfter) {
    fail(
      `[Moment 5] trdc.principal_remaining=${trdcAfterPay.principalRemaining} expected ${expectedPrincipalAfter}`,
    );
  }
  if (!Object.prototype.hasOwnProperty.call(trdcAfterPay.status, "active")) {
    fail(
      `[Moment 5] trdc.status=${JSON.stringify(trdcAfterPay.status)} expected active`,
    );
  }
  const vaultAfterPay = (await (vaultProgram.account as any).vault.fetch(
    vaultPda,
  )) as { totalAssets: BN };
  const vaultDeltaPay = new BN(vaultAfterPay.totalAssets.toString()).sub(
    new BN(vaultBeforePay.totalAssets.toString()),
  );
  if (vaultDeltaPay.toString() !== INSTALLMENT.toString()) {
    fail(
      `[Moment 5] vault.total_assets delta=${vaultDeltaPay} expected +${INSTALLMENT.toString()}`,
    );
  }
  console.log(
    `[Moment 5] OK principal_remaining=${expectedPrincipalAfter} vault+=${vaultDeltaPay}`,
  );

  // -------- Moment 6 — renew_ccb --------
  const renewTermDays = 60;
  const newDueTs = new BN(Math.floor(Date.now() / 1000) + renewTermDays * 86400);
  const newRateBps = rateForTermDays(renewTermDays);
  const vaultBeforeRenew = (await (vaultProgram.account as any).vault.fetch(
    vaultPda,
  )) as { totalAssets: BN };
  console.log(
    `\n[Moment 6] renew_ccb new_term=${renewTermDays}d new_rate_bps=${newRateBps}`,
  );
  const sigRenew: string = await (loanProgram.methods as any)
    .renewCcb(new BN(renewTermDays), newDueTs, new BN(newRateBps))
    .accounts({
      trdcState: trdcPdaA,
      vault: vaultPda,
      assetMint: mintPk,
      vaultAta,
      borrowerAta,
      borrower: borrower.publicKey,
      loanAuthority: loanAuthorityPda,
      trdcProgram: trdcProgramId,
      vaultProgram: vaultProgramId,
      tokenProgram: TOKEN_PROGRAM_ID,
      instructionsSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
    })
    .signers([borrower])
    .rpc({ commitment: "confirmed" });
  console.log(`[Moment 6] tx=${sigRenew}`);
  const rowRenew = await pollForEvent(supabase, sigRenew, "ccbRenewed");
  const payloadRenew = rowRenew.payload ?? {};
  const accruedPaid = new BN(
    String(payloadRenew.accrued_paid ?? payloadRenew.accruedPaid ?? "0"),
  );
  const feePaid = new BN(
    String(payloadRenew.fee_paid ?? payloadRenew.feePaid ?? "0"),
  );
  const totalRenewInflow = accruedPaid.add(feePaid);
  const trdcAfterRenew = (await (trdcProgram.account as any).trdcState.fetch(
    trdcPdaA,
  )) as { dueTs: BN; rateBps: BN; status: Record<string, unknown> };
  if (trdcAfterRenew.dueTs.toString() !== newDueTs.toString()) {
    fail(
      `[Moment 6] trdc.due_ts=${trdcAfterRenew.dueTs} expected ${newDueTs.toString()}`,
    );
  }
  if (trdcAfterRenew.rateBps.toString() !== String(newRateBps)) {
    fail(
      `[Moment 6] trdc.rate_bps=${trdcAfterRenew.rateBps} expected ${newRateBps}`,
    );
  }
  if (!Object.prototype.hasOwnProperty.call(trdcAfterRenew.status, "active")) {
    fail(
      `[Moment 6] trdc.status=${JSON.stringify(trdcAfterRenew.status)} expected active (post-renew two-step)`,
    );
  }
  const vaultAfterRenew = (await (vaultProgram.account as any).vault.fetch(
    vaultPda,
  )) as { totalAssets: BN };
  const vaultDeltaRenew = new BN(vaultAfterRenew.totalAssets.toString()).sub(
    new BN(vaultBeforeRenew.totalAssets.toString()),
  );
  if (vaultDeltaRenew.toString() !== totalRenewInflow.toString()) {
    fail(
      `[Moment 6] vault.total_assets delta=${vaultDeltaRenew} expected +${totalRenewInflow} ` +
        `(accrued=${accruedPaid} + fee=${feePaid})`,
    );
  }
  console.log(
    `[Moment 6] OK accrued=${accruedPaid} fee=${feePaid} vault+=${vaultDeltaRenew} status=Active`,
  );

  // -------- repay_ccb (close out Loan A) --------
  const vaultBeforeRepay = (await (vaultProgram.account as any).vault.fetch(
    vaultPda,
  )) as { totalAssets: BN };
  console.log(`\n[A:repay] repay_ccb (computes payoff on-chain)`);
  const sigRepay: string = await (loanProgram.methods as any)
    .repayCcb()
    .accounts({
      trdcState: trdcPdaA,
      vault: vaultPda,
      assetMint: mintPk,
      vaultAta,
      borrowerAta,
      borrower: borrower.publicKey,
      loanAuthority: loanAuthorityPda,
      trdcProgram: trdcProgramId,
      vaultProgram: vaultProgramId,
      tokenProgram: TOKEN_PROGRAM_ID,
      instructionsSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
    })
    .signers([borrower])
    .rpc({ commitment: "confirmed" });
  console.log(`[A:repay] tx=${sigRepay}`);
  const rowRepay = await pollForEvent(supabase, sigRepay, "ccbRepaid");
  const payloadRepay = rowRepay.payload ?? {};
  const payoffAmount = new BN(
    String(payloadRepay.payoff_amount ?? payloadRepay.payoffAmount ?? "0"),
  );
  const trdcAfterRepay = (await (trdcProgram.account as any).trdcState.fetch(
    trdcPdaA,
  )) as { principalRemaining: BN; status: Record<string, unknown> };
  if (trdcAfterRepay.principalRemaining.toString() !== "0") {
    fail(
      `[A:repay] trdc.principal_remaining=${trdcAfterRepay.principalRemaining} expected 0`,
    );
  }
  if (!Object.prototype.hasOwnProperty.call(trdcAfterRepay.status, "repaid")) {
    fail(
      `[A:repay] trdc.status=${JSON.stringify(trdcAfterRepay.status)} expected repaid`,
    );
  }
  const vaultAfterRepay = (await (vaultProgram.account as any).vault.fetch(
    vaultPda,
  )) as { totalAssets: BN };
  const vaultDeltaRepay = new BN(vaultAfterRepay.totalAssets.toString()).sub(
    new BN(vaultBeforeRepay.totalAssets.toString()),
  );
  if (vaultDeltaRepay.toString() !== payoffAmount.toString()) {
    fail(
      `[A:repay] vault.total_assets delta=${vaultDeltaRepay} expected +${payoffAmount}`,
    );
  }
  console.log(
    `[A:repay] OK payoff=${payoffAmount} vault+=${vaultDeltaRepay} status=Repaid`,
  );

  // ==========================================================================
  // LOAN B — default -> auction (Moments 7 + 8 + 9).
  // ==========================================================================
  console.log(`\n========================================`);
  console.log(`LOAN B — default -> auction`);
  console.log(`========================================`);

  // due_ts = now - 4d => past GRACE_PERIOD_SECS (3d) immediately.
  const dueTsB = new BN(Math.floor(Date.now() / 1000) - 4 * 86400);
  const rateBpsB = rateForTermDays(30);
  const {
    loanId: loanIdB,
    trdcPda: trdcPdaB,
    sig: sigCreateB,
  } = await mintCcbTrdc({
    loanProgram,
    payer,
    loanConfigPda,
    trdcProgramId,
    appraisal: APPRAISAL,
    loanAmount: LOAN_AMOUNT,
    dueTs: dueTsB,
    rateBps: rateBpsB,
  });
  console.log(
    `[B:create] loanId=${loanIdB.toBase58()} trdc=${trdcPdaB.toBase58()} tx=${sigCreateB}`,
  );
  await pollForEvent(supabase, sigCreateB, "ccbTrdcCreated");

  const docHashB = randomBytes32();
  const sigCustB: string = await (loanProgram.methods as any)
    .confirmCustody(Array.from(docHashB))
    .accounts({
      trdcState: trdcPdaB,
      loanConfig: loanConfigPda,
      trdcProgram: trdcProgramId,
      custodian: custodian.publicKey,
    })
    .signers([custodian])
    .rpc({ commitment: "confirmed" });
  console.log(`[B:custody] tx=${sigCustB}`);
  await pollForEvent(supabase, sigCustB, "custodyConfirmed");

  const sigDisbB: string = await (loanProgram.methods as any)
    .disburseFromVault(LOAN_AMOUNT)
    .accounts({
      trdcState: trdcPdaB,
      loanConfig: loanConfigPda,
      vault: vaultPda,
      assetMint: mintPk,
      vaultAta,
      borrowerAta,
      loanAuthority: loanAuthorityPda,
      borrower: borrower.publicKey,
      trdcProgram: trdcProgramId,
      vaultProgram: vaultProgramId,
      tokenProgram: TOKEN_PROGRAM_ID,
      instructionsSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
    })
    .signers([borrower])
    .rpc({ commitment: "confirmed" });
  console.log(`[B:disburse] tx=${sigDisbB}`);
  await pollForEvent(supabase, sigDisbB, "disbursed");

  // -------- Moment 7 — execute_af_default (loan-program CPIs into auction::create_auction) --------
  const [auctionPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("auction"), trdcPdaB.toBuffer()],
    auctionProgramId,
  );
  const escrowAta = getAssociatedTokenAddressSync(mintPk, auctionPda, true);

  console.log(
    `\n[Moment 7] execute_af_default duration=${AUCTION_DURATION_SECS}s auction=${auctionPda.toBase58()}`,
  );
  const sigDefault: string = await (loanProgram.methods as any)
    .executeAfDefault(new BN(AUCTION_DURATION_SECS))
    .accounts({
      trdcState: trdcPdaB,
      loanConfig: loanConfigPda,
      auction: auctionPda,
      assetMint: mintPk,
      escrowAta,
      vault: vaultPda,
      loanAuthority: loanAuthorityPda,
      payer: payer.publicKey,
      trdcProgram: trdcProgramId,
      auctionProgram: auctionProgramId,
      instructionsSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .rpc({ commitment: "confirmed" });
  console.log(`[Moment 7] tx=${sigDefault}`);
  await pollForEvent(supabase, sigDefault, "afDefaultExecuted");

  const auctionAcc = (await (auctionProgram.account as any).auction.fetch(
    auctionPda,
  )) as {
    reservePrice: BN;
    minIncrement: BN;
    endTs: BN;
    highBidder: PublicKey;
  };
  const reservePrice = new BN(auctionAcc.reservePrice.toString());
  const endTs = Number(auctionAcc.endTs.toString());
  if (reservePrice.lten(0)) {
    fail(`[Moment 7] auction.reserve_price=${reservePrice} expected > 0`);
  }
  const trdcAfterDefault = (await (trdcProgram.account as any).trdcState.fetch(
    trdcPdaB,
  )) as { status: Record<string, unknown> };
  if (!Object.prototype.hasOwnProperty.call(trdcAfterDefault.status, "defaulted")) {
    fail(
      `[Moment 7] trdc.status=${JSON.stringify(trdcAfterDefault.status)} expected defaulted`,
    );
  }
  console.log(
    `[Moment 7] OK reserve_price=${reservePrice} end_ts=${endTs} status=Defaulted`,
  );

  // -------- Bidder places bid at reserve_price (first bid bypasses increment) --------
  // Ensure bidder has enough USDC; top up from lender if short.
  const bidderBal = (await getAccount(connection, bidderAta)).amount;
  if (BigInt(bidderBal) < BigInt(reservePrice.toString())) {
    const shortfall = BigInt(reservePrice.toString()) - BigInt(bidderBal);
    const lenderAtaAcc = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      mintPk,
      lender.publicKey,
    );
    const lenderBal = (await getAccount(connection, lenderAtaAcc.address)).amount;
    if (lenderBal < shortfall) {
      fail(
        `bidder short ${shortfall} atoms and lender cannot cover (${lenderBal}); re-run seed:usdc`,
      );
    }
    const topup = new Transaction().add(
      createTransferInstruction(
        lenderAtaAcc.address,
        bidderAta,
        lender.publicKey,
        shortfall,
      ),
    );
    await sendAndConfirmTransaction(connection, topup, [payer, lender], {
      commitment: "confirmed",
    });
  }

  const previousBidderAta = auctionAcc.highBidder.equals(PublicKey.default)
    ? bidderAta
    : getAssociatedTokenAddressSync(mintPk, auctionAcc.highBidder);

  console.log(`\n[Moment 7:bid] place_bid amount=${reservePrice}`);
  const sigBid: string = await (auctionProgram.methods as any)
    .placeBid(reservePrice)
    .accounts({
      auction: auctionPda,
      assetMint: mintPk,
      escrowAta,
      bidderAta,
      previousBidderAta,
      bidder: bidder.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .signers([bidder])
    .rpc({ commitment: "confirmed" });
  console.log(`[Moment 7:bid] tx=${sigBid}`);
  await pollForEvent(supabase, sigBid, "bidPlaced");

  // -------- Wait past end_ts, then close_auction --------
  const nowSec = Math.floor(Date.now() / 1000);
  const waitMs = Math.max(0, (endTs + 2 - nowSec) * 1000);
  console.log(`waiting ${waitMs}ms for auction end_ts=${endTs}`);
  await sleep(waitMs);

  const [auctionAuthorityPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("auction_authority")],
    auctionProgramId,
  );

  const vaultBeforeClose = (await (vaultProgram.account as any).vault.fetch(
    vaultPda,
  )) as { totalAssets: BN };
  const vaultAtaBeforeClose = (await getAccount(connection, vaultAta)).amount;

  console.log(`\n[Moment 7:close] close_auction`);
  const sigClose: string = await (auctionProgram.methods as any)
    .closeAuction()
    .accounts({
      auction: auctionPda,
      trdcState: trdcPdaB,
      assetMint: mintPk,
      escrowAta,
      vaultAta,
      vault: vaultPda,
      auctionAuthority: auctionAuthorityPda,
      instructionsSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
      trdcProgram: trdcProgramId,
      vaultProgram: vaultProgramId,
      tokenProgram: TOKEN_PROGRAM_ID,
      caller: payer.publicKey,
    })
    .rpc({ commitment: "confirmed" });
  console.log(`[Moment 7:close] tx=${sigClose}`);
  await pollForEvent(supabase, sigClose, "auctionClosed");

  // Moment 8 — winner gains asset (on-chain: vault_ata received reserve_price,
  // off-chain custodian release is out of scope for this harness).
  const vaultAtaAfterClose = (await getAccount(connection, vaultAta)).amount;
  const vaultAtaDelta = vaultAtaAfterClose - vaultAtaBeforeClose;
  if (vaultAtaDelta.toString() !== reservePrice.toString()) {
    fail(
      `[Moment 8] vault_ata delta=${vaultAtaDelta} expected +${reservePrice} (reserve_price)`,
    );
  }
  const vaultAfterClose = (await (vaultProgram.account as any).vault.fetch(
    vaultPda,
  )) as { totalAssets: BN };
  const vaultDeltaClose = new BN(vaultAfterClose.totalAssets.toString()).sub(
    new BN(vaultBeforeClose.totalAssets.toString()),
  );
  if (vaultDeltaClose.toString() !== reservePrice.toString()) {
    fail(
      `[Moment 8] vault.total_assets delta=${vaultDeltaClose} expected +${reservePrice}`,
    );
  }
  const trdcAfterClose = (await (trdcProgram.account as any).trdcState.fetch(
    trdcPdaB,
  )) as { status: Record<string, unknown> };
  if (!Object.prototype.hasOwnProperty.call(trdcAfterClose.status, "liquidated")) {
    fail(
      `[Moment 8] trdc.status=${JSON.stringify(trdcAfterClose.status)} expected liquidated`,
    );
  }
  console.log(
    `[Moment 8] OK vault_ata+=${vaultAtaDelta} total_assets+=${vaultDeltaClose} status=Liquidated`,
  );

  // ==========================================================================
  // Moment 9 — system snapshot
  // ==========================================================================
  const finalVault = (await (vaultProgram.account as any).vault.fetch(
    vaultPda,
  )) as { totalAssets: BN };

  console.log(
    [
      ``,
      `==== Moments 5-9 summary ====`,
      `Loan A (pay/renew/repay):`,
      `  trdc         : ${trdcPdaA.toBase58()}`,
      `  create tx    : ${sigCreateA}`,
      `  custody tx   : ${sigCustA}`,
      `  disburse tx  : ${sigDisbA}`,
      `  pay tx       : ${sigPay}`,
      `  renew tx     : ${sigRenew}`,
      `  repay tx     : ${sigRepay}`,
      `  payoff       : ${payoffAmount.toString()}`,
      ``,
      `Loan B (default/auction):`,
      `  trdc         : ${trdcPdaB.toBase58()}`,
      `  auction      : ${auctionPda.toBase58()}`,
      `  create tx    : ${sigCreateB}`,
      `  custody tx   : ${sigCustB}`,
      `  disburse tx  : ${sigDisbB}`,
      `  default tx   : ${sigDefault}`,
      `  bid tx       : ${sigBid}`,
      `  close tx     : ${sigClose}`,
      `  reserve      : ${reservePrice.toString()}`,
      ``,
      `System snapshot (Moment 9):`,
      `  vault.total_assets : ${finalVault.totalAssets.toString()}`,
      `  repaid loans       : 1 (Loan A)`,
      `  liquidated loans   : 1 (Loan B)`,
      `  auctions closed    : 1`,
      `  capital recovered  : ${vaultAtaDelta.toString()} atoms`,
      ``,
    ].join("\n"),
  );

  process.exit(EXIT_OK);
}

main().catch((e) => {
  console.error(e);
  process.exit(EXIT_FAIL);
});
