/**
 * Sumsub webhook signature verification. Sumsub signs the raw request body
 * with HMAC-SHA256 using a per-webhook secret configured in the dashboard.
 * Signature arrives as hex in `X-Payload-Digest`.
 *
 * Use crypto.timingSafeEqual to prevent timing attacks during signature
 * comparison.
 *
 * Env var (LOWERCASE — matches the user's existing .env):
 *   - sumsub_webhook_secret
 */
import crypto from "node:crypto";

export function verifyWebhookSignature(
  rawBody: string,
  signatureHex: string,
  secret: string,
): boolean {
  if (!signatureHex) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  if (signatureHex.length !== expected.length) return false;
  let providedBuf: Buffer;
  let expectedBuf: Buffer;
  try {
    providedBuf = Buffer.from(signatureHex, "hex");
    expectedBuf = Buffer.from(expected, "hex");
  } catch {
    return false;
  }
  // `Buffer.from(..., "hex")` silently truncates on invalid input — verify
  // the byte length matches expectations as a second-line guard.
  if (providedBuf.length !== expectedBuf.length) return false;
  try {
    return crypto.timingSafeEqual(providedBuf, expectedBuf);
  } catch {
    return false;
  }
}

export type SumsubWebhookEvent = {
  applicantId: string;
  externalUserId?: string;
  type: string; // e.g. "applicantReviewed"
  reviewStatus?: string; // e.g. "completed"
  reviewResult?: {
    reviewAnswer: "GREEN" | "RED" | "YELLOW";
    rejectLabels?: string[];
  };
  createdAtMs: number;
};
