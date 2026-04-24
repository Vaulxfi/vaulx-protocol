/**
 * POST /api/admin/demo/confirm-custody
 *
 * Demo moment 03 — the custodian (demo-wallets[2]) calls `confirm_custody`
 * with a fresh 32-byte doc_hash. Flips the TRDC from PendingCustody to
 * ActiveInCustody.
 *
 * Body: `{ trdc: string }` — TRDCState PDA base58 (from /mint-trdc).
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import crypto from "node:crypto";

import { PublicKey } from "@solana/web3.js";

import {
  checkAdminAuth,
  demoErrorResponse,
  deriveLoanConfigPda,
  loadDemoEnv,
} from "@/lib/admin/demo";

type Body = { trdc?: string };

export async function POST(req: Request) {
  const gate = checkAdminAuth(req);
  if (gate) return gate;

  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    body = {};
  }
  if (!body.trdc) {
    return Response.json(
      { ok: false, detail: "Missing `trdc` in body" },
      { status: 400 },
    );
  }

  let trdcPda: PublicKey;
  try {
    trdcPda = new PublicKey(body.trdc);
  } catch {
    return Response.json(
      { ok: false, detail: "Invalid `trdc` pubkey" },
      { status: 400 },
    );
  }

  try {
    const env = await loadDemoEnv();
    const { demoWallets, loanProgram, loanProgramId, trdcProgramId } = env;

    const custodian = demoWallets[2];
    const loanConfigPda = deriveLoanConfigPda(loanProgramId);

    const docHash = new Uint8Array(crypto.randomBytes(32));

    const sig: string = await (loanProgram.methods as any)
      .confirmCustody(Array.from(docHash))
      .accounts({
        trdcState: trdcPda,
        loanConfig: loanConfigPda,
        trdcProgram: trdcProgramId,
        custodian: custodian.publicKey,
      })
      .signers([custodian])
      .rpc({ commitment: "confirmed" });

    const docHashHex = Buffer.from(docHash).toString("hex");

    return Response.json({
      ok: true,
      signature: sig,
      detail: `Custodian confirmed custody (doc_hash=0x${docHashHex.slice(0, 16)}…)`,
      state: {
        trdc: trdcPda.toBase58(),
        doc_hash: docHashHex,
        custodian: custodian.publicKey.toBase58(),
      },
    });
  } catch (err) {
    return demoErrorResponse(err);
  }
}
