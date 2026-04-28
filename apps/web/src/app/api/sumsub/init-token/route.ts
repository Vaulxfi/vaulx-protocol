/**
 * POST /api/sumsub/init-token
 *
 * Body: { walletPubkey: string }
 * Returns: { ok: true, token: string, applicantId: string, levelName: string }
 *
 * The token is consumed by `@sumsub/websdk` on the frontend to mount the
 * iframe. Each call generates a fresh short-lived token; safe to call on
 * every modal open.
 *
 * `externalUserId` = wallet pubkey so verification result → on-chain
 * KycAttestation maps cleanly when the webhook fires.
 */
import { NextRequest, NextResponse } from "next/server";
import { sumsubFetch } from "@/lib/sumsub/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: { walletPubkey?: string } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const wallet = body.walletPubkey;
  if (!wallet || !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(wallet)) {
    return NextResponse.json(
      { ok: false, detail: "walletPubkey must be a base58 Solana pubkey" },
      { status: 400 },
    );
  }

  const levelName =
    process.env.NEXT_PUBLIC_SUMSUB_LEVEL_NAME ?? "basic-kyc-level";

  try {
    const path = `/resources/accessTokens?userId=${encodeURIComponent(
      wallet,
    )}&levelName=${encodeURIComponent(levelName)}`;
    const data = await sumsubFetch<{ token: string; userId: string }>({
      method: "POST",
      path,
    });
    return NextResponse.json({
      ok: true,
      token: data.token,
      applicantId: wallet,
      levelName,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { ok: false, detail: `Sumsub init-token failed: ${msg}` },
      { status: 502 },
    );
  }
}
