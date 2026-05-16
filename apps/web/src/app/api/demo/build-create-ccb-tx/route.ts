/**
 * POST /api/demo/build-create-ccb-tx
 *
 * Phase 1 of the FE-signing flow that replaces the legacy single-shot
 * `/api/demo/provision-loan` (now stale: it tried to sign create_ccb_trdc
 * as the operator, which after commit 3163352 broke the atomic
 * confirm_custody constraint `borrower_ata.authority = trdc_state.borrower`).
 *
 * This route runs server-side bookkeeping:
 *   1. (Oracle-on path) publish_price as `oracle_admin` (= operator).
 *   2. Build an UNSIGNED transaction containing:
 *        - `createAssociatedTokenAccountIdempotentInstruction(borrower)`
 *          so the borrower's USDC ATA exists before confirm_custody runs.
 *        - `create_ccb_trdc(payer = borrowerPubkey)` so that
 *          `trdc_state.borrower` == `borrowerPubkey` and the atomic
 *          disburse target matches the user's wallet.
 *
 * The client (browser) signs this tx via Crossmint/Phantom and submits to
 * RPC. After it lands, the client calls `POST /api/demo/confirm-and-disburse`
 * which performs the operator-signed atomic confirm + disburse.
 *
 * Body (JSON):
 *   {
 *     borrowerPubkey: string;       // base58
 *     watchRef: string;
 *     appraisalUsdCents: number;
 *     ltvBps: number;
 *     termDays: number;
 *   }
 *
 * Response:
 *   {
 *     ok: true,
 *     loanId, trdcStatePda, refBytesHex, priceFeedPda, publishPriceTx,
 *     serializedTx: string,       // base64 unsigned Transaction
 *     lastValidBlockHeight: number,
 *     blockhash: string,
 *     borrowerAta: string,
 *     assetMint: string,
 *   }
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import {
  AnchorProvider,
  BN,
  Program,
  type Idl,
} from "@coral-xyz/anchor";
import {
  createAssociatedTokenAccountIdempotentInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { loan as loanFacade, trdc as trdcFacade } from "@vaulx/anchor-client";
import { rateForTermDays } from "@vaulx/terms";

import {
  checkAdminAuth,
  demoErrorResponse,
  DemoEnvError,
  deriveLoanConfigPda,
  derivePriceFeedPda,
  deriveTrdcStatePda,
  loadOperatorKeypair,
  walletFromKeypair,
} from "@/lib/admin/demo";

type Body = {
  borrowerPubkey?: string;
  watchRef?: string;
  appraisalUsdCents?: number;
  ltvBps?: number;
  termDays?: number;
};

const MIN_TERM_DAYS = 30;
const MAX_TERM_DAYS = 365;
const MAX_LTV_BPS = 7500;

function resolveUsdcMint(): PublicKey {
  // Vercel: NEXT_PUBLIC_USDC_MINT. Local dev: scripts/dev/edson-devnet.json
  // (fresh mint where operator is mint authority) or devnet-usdc.json.
  const envMint = process.env.NEXT_PUBLIC_USDC_MINT?.trim();
  if (envMint) return new PublicKey(envMint);

  const repoRoot = path.resolve(process.cwd(), "..", "..");
  const edsonFile = path.join(repoRoot, "scripts", "dev", "edson-devnet.json");
  if (fs.existsSync(edsonFile)) {
    const data = JSON.parse(fs.readFileSync(edsonFile, "utf8"));
    if (data.assetMint) return new PublicKey(data.assetMint);
  }
  const usdcFile = path.join(repoRoot, "scripts", "dev", "devnet-usdc.json");
  if (fs.existsSync(usdcFile)) {
    const data = JSON.parse(fs.readFileSync(usdcFile, "utf8"));
    if (data.mint) return new PublicKey(data.mint);
  }
  throw new DemoEnvError(
    "USDC mint unresolved. Set NEXT_PUBLIC_USDC_MINT on Vercel, or run `pnpm exec tsx scripts/dev/init-fresh-usdc.ts` locally.",
  );
}

export async function POST(req: Request) {
  const gate = checkAdminAuth(req);
  if (gate) return gate;

  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    body = {};
  }

  // --- Validate inputs --------------------------------------------------
  if (!body.borrowerPubkey || typeof body.borrowerPubkey !== "string") {
    return Response.json(
      { ok: false, detail: "Missing `borrowerPubkey` (base58)." },
      { status: 400 },
    );
  }
  let borrower: PublicKey;
  try {
    borrower = new PublicKey(body.borrowerPubkey);
    if (borrower.toBytes().length !== 32) throw new Error("not 32 bytes");
  } catch {
    return Response.json(
      { ok: false, detail: "Invalid `borrowerPubkey`." },
      { status: 400 },
    );
  }
  if (!body.watchRef || typeof body.watchRef !== "string") {
    return Response.json(
      { ok: false, detail: "Missing `watchRef`." },
      { status: 400 },
    );
  }
  if (
    typeof body.appraisalUsdCents !== "number" ||
    !Number.isFinite(body.appraisalUsdCents) ||
    body.appraisalUsdCents <= 0
  ) {
    return Response.json(
      { ok: false, detail: "`appraisalUsdCents` must be a positive number." },
      { status: 400 },
    );
  }
  if (
    typeof body.ltvBps !== "number" ||
    !Number.isInteger(body.ltvBps) ||
    body.ltvBps < 0 ||
    body.ltvBps > MAX_LTV_BPS
  ) {
    return Response.json(
      {
        ok: false,
        detail: `\`ltvBps\` must be an integer in [0, ${MAX_LTV_BPS}].`,
      },
      { status: 400 },
    );
  }
  if (
    typeof body.termDays !== "number" ||
    !Number.isInteger(body.termDays) ||
    body.termDays < MIN_TERM_DAYS ||
    body.termDays > MAX_TERM_DAYS
  ) {
    return Response.json(
      {
        ok: false,
        detail: `\`termDays\` must be an integer in [${MIN_TERM_DAYS}, ${MAX_TERM_DAYS}].`,
      },
      { status: 400 },
    );
  }

  try {
    const payer = loadOperatorKeypair();
    const rpc = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
    const conn = new Connection(rpc, "confirmed");
    const provider = new AnchorProvider(conn, walletFromKeypair(payer), {
      commitment: "confirmed",
    });

    const loanProgramId = new PublicKey(loanFacade.programId);
    const trdcProgramId = new PublicKey(trdcFacade.programId);
    const loanProgram = loanFacade.program(provider) as Program<Idl>;

    // Asset mint resolution.
    const assetMint = resolveUsdcMint();

    // ref_bytes = SHA-256(watchRef) — matches programs/trdc/src/state.rs
    const refBytes = new Uint8Array(
      crypto.createHash("sha256").update(body.watchRef).digest(),
    );

    // Loan economics.
    const appraisalAtoms = new BN(body.appraisalUsdCents).mul(new BN(10_000));
    const loanAmount = appraisalAtoms
      .mul(new BN(body.ltvBps))
      .div(new BN(10_000));
    const nowSec = Math.floor(Date.now() / 1000);
    const dueTs = new BN(nowSec + body.termDays * 86400);
    const rateBps = rateForTermDays(body.termDays);

    // Fresh ephemeral loan_id used as PDA seed for the TRDCState account.
    const loanId = Keypair.generate().publicKey;
    const trdcPda = deriveTrdcStatePda(loanId, trdcProgramId);
    const loanConfigPda = deriveLoanConfigPda(loanProgramId);

    // Verify loan_config is initialized and read the oracle/kyc gates.
    const cfg = await (loanProgram.account as any).loanConfig.fetchNullable(
      loanConfigPda,
    );
    if (!cfg) {
      throw new DemoEnvError(
        `loan_config PDA ${loanConfigPda.toBase58()} not initialized. Run the bootstrap script first.`,
      );
    }
    const oracleAdminPk = new PublicKey(
      cfg.oracleAdmin ?? cfg.oracle_admin ?? PublicKey.default.toBase58(),
    );
    const oracleOn = !oracleAdminPk.equals(PublicKey.default);

    // --- 0. Oracle-on path: publish_price (operator-signed, server-side) ---
    let priceFeedPda: PublicKey = SystemProgram.programId;
    let publishPriceTx: string | null = null;
    if (oracleOn) {
      if (!oracleAdminPk.equals(payer.publicKey)) {
        throw new DemoEnvError(
          `loan_config.oracle_admin (${oracleAdminPk.toBase58()}) does not match operator (${payer.publicKey.toBase58()}). Set OPERATOR_KEYPAIR_JSON to the oracle-admin keypair.`,
        );
      }
      priceFeedPda = derivePriceFeedPda(refBytes, loanProgramId);
      publishPriceTx = await (loanProgram.methods as any)
        .publishPrice(
          Array.from(refBytes),
          new BN(body.appraisalUsdCents),
          new BN(5),
          new BN(nowSec - 60),
        )
        .accounts({
          priceFeed: priceFeedPda,
          loanConfig: loanConfigPda,
          oracleAdmin: payer.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc({ commitment: "confirmed" });
    }

    // --- 1. Build the unsigned tx ---------------------------------------
    // Pre-instruction: createATA(borrower) idempotent — so the atomic
    // confirm_custody can find the borrower's USDC ATA. The borrower pays
    // ATA rent (~0.002 SOL).
    const borrowerAta = getAssociatedTokenAddressSync(assetMint, borrower);
    const ataIx = createAssociatedTokenAccountIdempotentInstruction(
      borrower, // payer
      borrowerAta,
      borrower, // owner
      assetMint,
    );

    // Main ix: create_ccb_trdc, payer = borrower (so trdc_state.borrower
    // == borrower per programs/loan/src/lib.rs::CreateCcbTrdc.payer).
    const createIx = await (loanProgram.methods as any)
      .createCcbTrdc(
        loanId,
        appraisalAtoms,
        loanAmount,
        dueTs,
        new BN(rateBps),
        Array.from(refBytes),
      )
      .accounts({
        trdcState: trdcPda,
        trdcProgram: trdcProgramId,
        payer: borrower,
        systemProgram: SystemProgram.programId,
        loanConfig: loanConfigPda,
        kycAttestation: SystemProgram.programId, // F2-B: gate off ⇒ any account
        priceFeed: priceFeedPda,
      })
      .instruction();

    const { blockhash, lastValidBlockHeight } =
      await conn.getLatestBlockhash("confirmed");

    const tx = new Transaction();
    tx.feePayer = borrower;
    tx.recentBlockhash = blockhash;
    tx.lastValidBlockHeight = lastValidBlockHeight;
    tx.add(ataIx, createIx);

    const serialized = tx
      .serialize({ requireAllSignatures: false, verifySignatures: false })
      .toString("base64");

    return Response.json({
      ok: true,
      loanId: loanId.toBase58(),
      trdcStatePda: trdcPda.toBase58(),
      refBytesHex: Buffer.from(refBytes).toString("hex"),
      priceFeedPda: oracleOn ? priceFeedPda.toBase58() : null,
      publishPriceTx,
      serializedTx: serialized,
      lastValidBlockHeight,
      blockhash,
      borrowerAta: borrowerAta.toBase58(),
      assetMint: assetMint.toBase58(),
      state: {
        borrower: borrower.toBase58(),
        watchRef: body.watchRef,
        appraisalUsdCents: body.appraisalUsdCents,
        ltvBps: body.ltvBps,
        termDays: body.termDays,
        loanAmountAtoms: loanAmount.toString(),
        rateBps,
        dueTs: dueTs.toString(),
      },
    });
  } catch (err) {
    return demoErrorResponse(err);
  }
}
