/**
 * POST /api/sumsub/webhook
 *
 * Sumsub posts here when an applicant's review status changes. We:
 *   1. Read the raw body
 *   2. Verify HMAC signature (X-Payload-Digest header)
 *   3. Parse the event
 *   4. On applicantReviewed + reviewAnswer=GREEN: mint KycAttestation PDA
 *   5. Always return 200 to avoid Sumsub retries on our own bugs
 *      (we log internally; idempotency in mintAttestationForWallet
 *      handles dupes safely)
 *
 * Env var (LOWERCASE — matches the user's .env):
 *   - sumsub_webhook_secret
 */
import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import crypto from "node:crypto";
import {
  verifyWebhookSignature,
  type SumsubWebhookEvent,
} from "@/lib/sumsub/webhook";
import { mintAttestationForWallet } from "@/lib/sumsub/attestation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const secret = process.env.sumsub_webhook_secret;
  if (!secret) {
    console.error("[sumsub.webhook] sumsub_webhook_secret not set");
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  // Read raw body for HMAC verification (NextRequest.text() preserves bytes).
  const rawBody = await req.text();
  const sig = req.headers.get("x-payload-digest") ?? "";

  if (!verifyWebhookSignature(rawBody, sig, secret)) {
    console.warn("[sumsub.webhook] invalid signature");
    return NextResponse.json(
      { ok: false, detail: "bad signature" },
      { status: 401 },
    );
  }

  let event: SumsubWebhookEvent;
  try {
    event = JSON.parse(rawBody) as SumsubWebhookEvent;
  } catch {
    return NextResponse.json(
      { ok: false, detail: "bad json" },
      { status: 400 },
    );
  }

  // We only act on applicantReviewed + GREEN. Everything else: log + ack.
  if (
    event.type !== "applicantReviewed" ||
    event.reviewResult?.reviewAnswer !== "GREEN"
  ) {
    console.log(
      `[sumsub.webhook] non-actionable event: type=${event.type} answer=${
        event.reviewResult?.reviewAnswer ?? "?"
      }`,
    );
    return NextResponse.json({ ok: true, action: "ignored" });
  }

  // externalUserId is the wallet pubkey we set in /api/sumsub/init-token.
  const walletStr = event.externalUserId;
  if (!walletStr) {
    console.warn(
      "[sumsub.webhook] GREEN event without externalUserId; skipping",
    );
    return NextResponse.json({ ok: true, action: "skipped-no-user" });
  }

  let wallet: PublicKey;
  try {
    wallet = new PublicKey(walletStr);
  } catch {
    console.warn(`[sumsub.webhook] invalid externalUserId pubkey: ${walletStr}`);
    return NextResponse.json({ ok: true, action: "skipped-bad-pubkey" });
  }

  // jwtHash binds this attestation to the specific Sumsub verification.
  // We hash the full webhook payload — anyone replaying the attestation
  // can verify the binding off-chain.
  const jwtHash = new Uint8Array(
    crypto.createHash("sha256").update(rawBody).digest(),
  );

  try {
    const result = await mintAttestationForWallet({
      wallet,
      jwtHash,
      applicantId: event.applicantId,
    });
    return NextResponse.json({
      ok: true,
      action: result.alreadyExisted ? "already-attested" : "minted",
      pda: result.pda,
      signature: result.signature,
    });
  } catch (err) {
    // Server-side error — return 500 so Sumsub retries with backoff.
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[sumsub.webhook] mint failed: ${msg}`);
    return NextResponse.json(
      { ok: false, detail: `mint failed: ${msg}` },
      { status: 500 },
    );
  }
}
