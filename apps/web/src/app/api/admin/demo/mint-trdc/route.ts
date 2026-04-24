/**
 * POST /api/admin/demo/mint-trdc
 *
 * Demo moment 02 — the borrower (demo-wallets[1]) calls `create_ccb_trdc`
 * for a mock Rolex at 60% LTV. Returns the derived TRDC PDA + loan_id so the
 * UI can feed it into subsequent routes (confirm-custody, disburse, repay).
 *
 * Body: `{ ltvBps?: number, termDays?: number, appraisalUsdc?: string }`.
 * Defaults: ltvBps=6000, termDays=30, appraisalUsdc="100000000" (100 USDC).
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import crypto from "node:crypto";

import { BN } from "@coral-xyz/anchor";
import { Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram } from "@solana/web3.js";
import { rateForTermDays } from "@vaulx/terms";

import {
  checkAdminAuth,
  demoErrorResponse,
  deriveLoanConfigPda,
  deriveTrdcStatePda,
  loadDemoEnv,
} from "@/lib/admin/demo";

type Body = {
  ltvBps?: number;
  termDays?: number;
  appraisalUsdc?: string;
  /** Set due_ts to `now - 4d` for the default-path flow. Default false. */
  overdue?: boolean;
};

export async function POST(req: Request) {
  const gate = checkAdminAuth(req);
  if (gate) return gate;

  let body: Body = {};
  try {
    if (req.headers.get("content-type")?.includes("application/json")) {
      body = (await req.json()) as Body;
    }
  } catch {
    body = {};
  }

  const ltvBps = body.ltvBps ?? 6000;
  const termDays = body.termDays ?? 30;
  const appraisalUsdc = body.appraisalUsdc
    ? new BN(body.appraisalUsdc)
    : new BN("100000000"); // 100 USDC
  const overdue = body.overdue === true;

  try {
    const env = await loadDemoEnv();
    const { conn, payer, demoWallets, loanProgram, loanProgramId, trdcProgramId } = env;

    const borrower = demoWallets[1];
    const custodian = demoWallets[2];

    // Ensure loan_config exists with demo custodian. First-writer-wins init.
    const loanConfigPda = deriveLoanConfigPda(loanProgramId);
    const existingCfg = await (
      loanProgram.account as any
    ).loanConfig.fetchNullable(loanConfigPda);
    if (!existingCfg) {
      await (loanProgram.methods as any)
        .initializeLoanConfig(custodian.publicKey, PublicKey.default)
        .accounts({
          loanConfig: loanConfigPda,
          admin: payer.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc({ commitment: "confirmed" });
    }

    // Fund the borrower with enough SOL to sign if they're empty.
    const borrowerBal = await conn.getBalance(borrower.publicKey);
    if (borrowerBal < 0.005 * LAMPORTS_PER_SOL) {
      try {
        const { Transaction, SystemProgram: SP } = await import(
          "@solana/web3.js"
        );
        const fundTx = new Transaction().add(
          SP.transfer({
            fromPubkey: payer.publicKey,
            toPubkey: borrower.publicKey,
            lamports: 0.01 * LAMPORTS_PER_SOL,
          }),
        );
        const { sendAndConfirmTransaction } = await import("@solana/web3.js");
        await sendAndConfirmTransaction(conn, fundTx, [payer], {
          commitment: "confirmed",
        });
      } catch {
        /* best-effort */
      }
    }

    const loanAmount = appraisalUsdc.mul(new BN(ltvBps)).div(new BN(10_000));
    const nowSec = Math.floor(Date.now() / 1000);
    const dueTs = overdue
      ? new BN(nowSec - 4 * 86400)
      : new BN(nowSec + termDays * 86400);

    const rateBps = rateForTermDays(termDays);
    const loanId = Keypair.generate().publicKey;
    const trdcPda = deriveTrdcStatePda(loanId, trdcProgramId);
    const assetHint = new Uint8Array(crypto.randomBytes(32));

    const sig: string = await (loanProgram.methods as any)
      .createCcbTrdc(
        loanId,
        appraisalUsdc,
        loanAmount,
        dueTs,
        new BN(rateBps),
        Array.from(assetHint),
      )
      .accounts({
        trdcState: trdcPda,
        trdcProgram: trdcProgramId,
        payer: payer.publicKey,
        systemProgram: SystemProgram.programId,
        loanConfig: loanConfigPda,
        gatewayToken: SystemProgram.programId,
      })
      .rpc({ commitment: "confirmed" });

    return Response.json({
      ok: true,
      signature: sig,
      detail: `Minted TRDC ${trdcPda.toBase58().slice(0, 8)}… for ${(
        Number(loanAmount.toString()) / 1e6
      ).toFixed(2)} USDC @ ${(rateBps / 100).toFixed(2)}% (term ${termDays}d)`,
      state: {
        trdc: trdcPda.toBase58(),
        loan_id: loanId.toBase58(),
        borrower: borrower.publicKey.toBase58(),
        loan_amount: loanAmount.toString(),
        appraisal_value: appraisalUsdc.toString(),
        due_ts: dueTs.toString(),
        rate_bps: rateBps,
        term_days: termDays,
        overdue,
      },
    });
  } catch (err) {
    return demoErrorResponse(err);
  }
}
