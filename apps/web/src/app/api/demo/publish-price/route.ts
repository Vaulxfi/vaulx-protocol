/**
 * POST /api/demo/publish-price
 *
 * Publishes a fresh PriceFeed for a given `ref_bytes` so the borrower's
 * subsequent `loan.disburse_from_vault` can pass the SR-2 / SR-1 oracle
 * gate. Signed by the operator keypair (`~/.config/solana/id.json`) which
 * is the configured `loan_config.oracle_admin` on the Devnet deploy.
 *
 * Body (JSON):
 *   {
 *     refBytes: number[]      // 32-byte array (TRDCState.ref_bytes)
 *     medianUsdCents?: number // default 50_000_00 (= $50,000)
 *     listings?: number       // default 5 (>= MIN_LISTINGS=3)
 *     observedAt?: number     // unix seconds; default = now
 *   }
 *
 * Response:
 *   { ok: true, signature, priceFeed, refBytesHex }
 *   { ok: false, detail }   on env / RPC errors (reuses demoErrorResponse)
 *
 * Local-only by construction: reads the operator keypair from the
 * filesystem; will 503 on Vercel. Same gate as other /api/admin/demo/*
 * routes (currently open in demo mode).
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { AnchorProvider, BN, Program, type Idl } from "@coral-xyz/anchor";
import { Connection, PublicKey, SystemProgram } from "@solana/web3.js";
import { loan as loanFacade } from "@vaulx/anchor-client";

import {
  checkAdminAuth,
  demoErrorResponse,
  deriveLoanConfigPda,
  derivePriceFeedPda,
  loadOperatorKeypair,
  walletFromKeypair,
} from "@/lib/admin/demo";

type Body = {
  refBytes?: number[];
  medianUsdCents?: number;
  listings?: number;
  observedAt?: number;
};

const DEFAULT_MEDIAN_CENTS = 50_000 * 100; // $50,000.00 in cents
const DEFAULT_LISTINGS = 5;

export async function POST(req: Request) {
  const gate = checkAdminAuth(req);
  if (gate) return gate;

  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    body = {};
  }

  if (!Array.isArray(body.refBytes) || body.refBytes.length !== 32) {
    return Response.json(
      {
        ok: false,
        detail: "Body must include `refBytes` as a 32-element number array.",
      },
      { status: 400 },
    );
  }

  const refBytes = Uint8Array.from(body.refBytes);
  const median = body.medianUsdCents ?? DEFAULT_MEDIAN_CENTS;
  const listings = body.listings ?? DEFAULT_LISTINGS;
  // Backdate by 60s to absorb Vercel/Devnet clock drift (FuturePrice
  // check on-chain compares against validator Clock::get; we've seen
  // serverless box drift ~milliseconds ahead at the second-precision
  // boundary). Still well within MAX_AGE_SECONDS (600s) freshness window.
  const observedAt = body.observedAt ?? Math.floor(Date.now() / 1000) - 60;

  if (!(median > 0)) {
    return Response.json(
      { ok: false, detail: "medianUsdCents must be > 0" },
      { status: 400 },
    );
  }
  if (listings < 3) {
    return Response.json(
      { ok: false, detail: "listings must be >= 3 (SR-5 MIN_LISTINGS)" },
      { status: 400 },
    );
  }

  try {
    // Lightweight env load: only the operator keypair is needed (publish_price
    // doesn't touch USDC, demo wallets, or vault setup). loadDemoEnv() pulls
    // demo-wallets.json which is local-only — using the slim loader makes
    // this route work on Vercel.
    const payer = loadOperatorKeypair();
    const rpc = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
    const conn = new Connection(rpc, "confirmed");
    const provider = new AnchorProvider(conn, walletFromKeypair(payer), {
      commitment: "confirmed",
    });
    const loanProgramId = new PublicKey(loanFacade.programId);
    const loanProgram = loanFacade.program(provider) as Program<Idl>;

    const loanConfigPda = deriveLoanConfigPda(loanProgramId);
    const priceFeedPda = derivePriceFeedPda(refBytes, loanProgramId);

    const sig: string = await (loanProgram.methods as any)
      .publishPrice(
        Array.from(refBytes),
        new BN(median),
        listings,
        new BN(observedAt),
      )
      .accounts({
        priceFeed: priceFeedPda,
        loanConfig: loanConfigPda,
        oracleAdmin: payer.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([payer])
      .rpc({ commitment: "confirmed" });

    const refBytesHex = Buffer.from(refBytes).toString("hex");
    return Response.json({
      ok: true,
      signature: sig,
      priceFeed: priceFeedPda.toBase58(),
      refBytesHex,
      detail: `Published price feed (median=${median} cents, listings=${listings})`,
    });
  } catch (err) {
    return demoErrorResponse(err);
  }
}
