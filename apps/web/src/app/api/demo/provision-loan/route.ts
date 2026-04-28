/**
 * POST /api/demo/provision-loan
 *
 * Phase C of the full-E2E demo: a single server-side route that takes any
 * borrower pubkey (Crossmint smart wallet, Phantom, anything base58) and
 * advances them to a "ready-to-disburse" loan state in two on-chain txs:
 *
 *   1. `loan.create_ccb_trdc` — operator-signed; mints the TRDC for the
 *      borrower's pubkey at the requested LTV / term.
 *   2. `loan.confirm_custody` — operator-signed (operator doubles as
 *      `loan_config.custodian` on the demo deploy); flips the FSM from
 *      `PendingCustody` → `ActiveInCustody`.
 *
 * After this returns, the FE saves `{ loanId, trdcStatePda }` into the demo
 * session and the borrower can call `disburse_from_vault` themselves.
 *
 * The operator keypair is loaded via `loadOperatorKeypair()` — Vercel-
 * friendly: reads `OPERATOR_KEYPAIR_JSON` env var first, falls back to
 * `~/.config/solana/id.json` for local dev. Devnet-only: program upgrade
 * authority is the Squads V4 vault PDA per commit `5e90d81`.
 *
 * Body (JSON):
 *   {
 *     borrowerPubkey: string;       // base58
 *     watchRef: string;             // e.g. "Rolex 126610LN"
 *     appraisalUsdCents: number;    // e.g. 1500000 ($15,000)
 *     ltvBps: number;               // e.g. 5000 (50%)
 *     termDays: number;             // e.g. 60
 *   }
 *
 * Response:
 *   { ok: true, loanId, trdcStatePda, refBytesHex, createTx, custodyTx }
 *
 * Auth: same admin gate as `/api/admin/demo/*` — open in demo mode unless
 * `NEXT_PUBLIC_VAULX_ADMIN_PUBKEY` is set.
 *
 * TODO(rate-limit): public route signed by the operator key. Add a per-IP
 * limiter (Upstash / Vercel KV) before mainnet — see `apps/web/src/lib/rate-limit/`.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import crypto from "node:crypto";

import {
  AnchorProvider,
  BN,
  Program,
  type Idl,
} from "@coral-xyz/anchor";
import { Keypair, PublicKey, SystemProgram, Connection } from "@solana/web3.js";
import { loan as loanFacade, trdc as trdcFacade } from "@vaulx/anchor-client";
import { walletFromKeypair } from "@/lib/admin/demo";
import { rateForTermDays } from "@vaulx/terms";

import {
  checkAdminAuth,
  demoErrorResponse,
  DemoEnvError,
  deriveLoanConfigPda,
  deriveTrdcStatePda,
  loadOperatorKeypair,
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

    // --- Compute ref_bytes (matches programs/trdc/src/state.rs:ref_bytes_for) ---
    // The on-chain helper uses Solana's `hash::hash` which is SHA-256.
    const refBytes = new Uint8Array(
      crypto.createHash("sha256").update(body.watchRef).digest(),
    );

    // --- Loan economics --------------------------------------------------
    // appraisal: USD-cents → USDC atoms (6 decimals). 1 cent = 10_000 atoms.
    const appraisalAtoms = new BN(body.appraisalUsdCents).mul(new BN(10_000));
    const loanAmount = appraisalAtoms
      .mul(new BN(body.ltvBps))
      .div(new BN(10_000));
    const nowSec = Math.floor(Date.now() / 1000);
    const dueTs = new BN(nowSec + body.termDays * 86400);
    const rateBps = rateForTermDays(body.termDays);

    // Ephemeral loan_id (used as PDA seed for the TRDCState; not a signer).
    const loanId = Keypair.generate().publicKey;
    const trdcPda = deriveTrdcStatePda(loanId, trdcProgramId);
    const loanConfigPda = deriveLoanConfigPda(loanProgramId);

    // Sanity: loan_config must exist for create_ccb_trdc to succeed (it
    // reads kyc_required + custodian off the singleton). It's bootstrapped
    // by `pnpm init:civic` post-deploy. We don't init it here — that's
    // admin territory and on Vercel we shouldn't be the first writer.
    const cfg = await (loanProgram.account as any).loanConfig.fetchNullable(
      loanConfigPda,
    );
    if (!cfg) {
      throw new DemoEnvError(
        `loan_config PDA ${loanConfigPda.toBase58()} not initialized. Run \`pnpm init:civic\` against the target cluster first.`,
      );
    }
    const custodianPk = new PublicKey(cfg.custodian);

    // --- 1. create_ccb_trdc ---------------------------------------------
    // IDL args (loan.json): loan_id, appraisal_value, loan_amount, due_ts,
    // rate_bps, _asset_hint. The handler stores _asset_hint on the
    // TRDCState as `ref_bytes` when oracle is on (see
    // programs/loan/src/lib.rs:230). Passing the SHA-256 of watchRef means
    // the future PriceFeed PDA at [b"price_feed", refBytes] resolves
    // correctly for SR-2 binding.
    const createTx: string = await (loanProgram.methods as any)
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
        payer: payer.publicKey,
        systemProgram: SystemProgram.programId,
        loanConfig: loanConfigPda,
        // KYC + oracle gates are off in demo mode — pass SystemProgram as
        // the "any account" placeholder per the IDL docs.
        kycAttestation: SystemProgram.programId,
        priceFeed: SystemProgram.programId,
      })
      .rpc({ commitment: "confirmed" });

    // --- 2. confirm_custody ---------------------------------------------
    // Deterministic dummy doc_hash so the same (loanId, watchRef) pair
    // produces the same hash — useful for replay / audit at demo time.
    const docHash = new Uint8Array(
      crypto
        .createHash("sha256")
        .update(loanId.toBuffer())
        .update("demo_custody")
        .digest(),
    );

    // Operator must equal `loan_config.custodian` for confirm_custody to
    // succeed. The post-deploy bootstrap (`pnpm init:civic`) sets the
    // custodian to demo-wallets[2] locally — but on Vercel where we don't
    // have that wallet, the simplest path is to set custodian = operator
    // pubkey at init time (one-time admin action). If they diverge we
    // surface a clear error rather than blindly attempting the tx.
    if (!custodianPk.equals(payer.publicKey)) {
      throw new DemoEnvError(
        `loan_config.custodian (${custodianPk.toBase58()}) does not match operator (${payer.publicKey.toBase58()}). For Vercel, re-run init with the operator pubkey as custodian.`,
      );
    }

    const custodyTx: string = await (loanProgram.methods as any)
      .confirmCustody(Array.from(docHash))
      .accounts({
        trdcState: trdcPda,
        loanConfig: loanConfigPda,
        trdcProgram: trdcProgramId,
        custodian: payer.publicKey,
      })
      .rpc({ commitment: "confirmed" });

    return Response.json({
      ok: true,
      loanId: loanId.toBase58(),
      trdcStatePda: trdcPda.toBase58(),
      refBytesHex: Buffer.from(refBytes).toString("hex"),
      createTx,
      custodyTx,
      detail: `Provisioned loan ${loanId.toBase58().slice(0, 8)}… for borrower ${borrower
        .toBase58()
        .slice(0, 8)}… (${body.watchRef}, ${body.ltvBps / 100}% LTV, ${body.termDays}d)`,
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
