/**
 * POST /api/sumsub/force-mint-attestation
 *
 * Webhook-independent fallback: when the Sumsub-side
 * `idCheck.onApplicantStatusChanged === "completed"` event fires on
 * the client but the production webhook hasn't materialised the
 * on-chain `KycAttestation` PDA (the path we found broken on
 * 2026-05-16), the FE calls this route. We query Sumsub's REST API
 * for the applicant by `externalUserId` and, if the review is GREEN,
 * mint the attestation server-side with the operator keypair —
 * exactly the same flow the webhook handler runs.
 *
 * Idempotent on-chain (`mintAttestationForWallet` returns
 * `alreadyExisted: true` when the PDA already exists), so a real
 * webhook firing afterwards is a harmless no-op.
 *
 * Body (JSON): `{ walletPubkey: string }`
 * Response:
 *   200 → `{ ok: true, action: "minted" | "already-attested", pda, signature }`
 *   409 → `{ ok: false, detail: "Sumsub status not GREEN", sumsubStatus }` —
 *         user hasn't completed (or completed RED). Caller retries.
 *   500 → `{ ok: false, detail: "mint failed: ..." }`
 *   502 → `{ ok: false, detail: "Sumsub lookup failed: ..." }`
 *
 * NOT a replacement for the webhook — it's a self-healing safety
 * net. When the webhook is properly configured in the Sumsub
 * dashboard, both paths converge on the same PDA without conflict.
 */
import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { PublicKey } from "@solana/web3.js";
import { sumsubFetch } from "@/lib/sumsub/client";
import { mintAttestationForWallet } from "@/lib/sumsub/attestation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Sumsub's `/resources/applicants/-;externalUserId=…/one` response is large;
// we only care about the review status. Be defensive about shape — Sumsub
// has historically nested the result either at `reviewResult` or
// `review.reviewResult` depending on the endpoint version.
type SumsubApplicantSlice = {
  id?: string;
  reviewStatus?: string;
  reviewResult?: { reviewAnswer?: "GREEN" | "RED" | "YELLOW" };
  review?: {
    reviewStatus?: string;
    reviewResult?: { reviewAnswer?: "GREEN" | "RED" | "YELLOW" };
  };
};

function extractReview(a: SumsubApplicantSlice): {
  reviewAnswer: "GREEN" | "RED" | "YELLOW" | null;
  applicantId: string;
} {
  const ra =
    a.reviewResult?.reviewAnswer ??
    a.review?.reviewResult?.reviewAnswer ??
    null;
  return { reviewAnswer: ra, applicantId: a.id ?? "unknown" };
}

export async function POST(req: NextRequest) {
  let body: { walletPubkey?: string } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const walletStr = body.walletPubkey;
  if (!walletStr || !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(walletStr)) {
    return NextResponse.json(
      { ok: false, detail: "walletPubkey must be a base58 Solana pubkey" },
      { status: 400 },
    );
  }

  let wallet: PublicKey;
  try {
    wallet = new PublicKey(walletStr);
  } catch {
    return NextResponse.json(
      { ok: false, detail: "invalid pubkey" },
      { status: 400 },
    );
  }

  // Look up the applicant by externalUserId (= wallet pubkey, set in
  // /api/sumsub/init-token). Sumsub returns 404 when no applicant
  // exists for this externalUserId yet — surface that distinctly
  // since it means the user hasn't started Sumsub at all.
  let applicant: SumsubApplicantSlice;
  try {
    applicant = await sumsubFetch<SumsubApplicantSlice>({
      method: "GET",
      path: `/resources/applicants/-;externalUserId=${encodeURIComponent(walletStr)}/one`,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const is404 = msg.includes("→ 404:");
    return NextResponse.json(
      {
        ok: false,
        detail: is404
          ? "Sumsub has no applicant for this wallet; user must start the WebSDK flow first."
          : `Sumsub lookup failed: ${msg}`,
      },
      { status: is404 ? 404 : 502 },
    );
  }

  const { reviewAnswer, applicantId } = extractReview(applicant);
  if (reviewAnswer !== "GREEN") {
    return NextResponse.json(
      {
        ok: false,
        detail: `Sumsub status is ${reviewAnswer ?? "missing"}; cannot mint until GREEN.`,
        sumsubStatus: reviewAnswer,
      },
      { status: 409 },
    );
  }

  // Deterministic jwt_hash for the attestation. The webhook path uses
  // sha256(rawBody); we don't have the body here, so we bind to the
  // (applicantId, wallet) pair. Re-running the route produces the same
  // hash and `mintAttestationForWallet` is idempotent on PDA existence
  // (it ignores the jwt_hash on duplicate-mint paths), so this can't
  // diverge from a webhook-minted attestation.
  const jwtHash = new Uint8Array(
    crypto
      .createHash("sha256")
      .update(`force-mint:${applicantId}:${walletStr}`)
      .digest(),
  );

  try {
    const result = await mintAttestationForWallet({
      wallet,
      jwtHash,
      applicantId,
    });
    return NextResponse.json({
      ok: true,
      action: result.alreadyExisted ? "already-attested" : "minted",
      pda: result.pda,
      signature: result.signature,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { ok: false, detail: `mint failed: ${msg}` },
      { status: 500 },
    );
  }
}
