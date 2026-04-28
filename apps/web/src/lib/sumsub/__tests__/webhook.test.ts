import { describe, it, expect } from "vitest";
import crypto from "node:crypto";
import { verifyWebhookSignature } from "../webhook";

const SECRET = "webhook-secret-123";

function makeDigest(body: string, secret = SECRET): string {
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
}

describe("sumsub webhook verifier", () => {
  it("accepts a valid HMAC", () => {
    const body = JSON.stringify({ applicantId: "abc", reviewAnswer: "GREEN" });
    const digest = makeDigest(body);
    expect(verifyWebhookSignature(body, digest, SECRET)).toBe(true);
  });

  it("rejects a tampered body", () => {
    const body = JSON.stringify({ applicantId: "abc", reviewAnswer: "GREEN" });
    const digest = makeDigest(body);
    const tampered = body.replace("GREEN", "RED");
    expect(verifyWebhookSignature(tampered, digest, SECRET)).toBe(false);
  });

  it("rejects a wrong-secret signature", () => {
    const body = JSON.stringify({ applicantId: "abc" });
    const digest = makeDigest(body, "wrong-secret");
    expect(verifyWebhookSignature(body, digest, SECRET)).toBe(false);
  });

  it("rejects empty signature", () => {
    expect(verifyWebhookSignature("{}", "", SECRET)).toBe(false);
  });

  it("rejects malformed hex", () => {
    expect(verifyWebhookSignature("{}", "zzz", SECRET)).toBe(false);
  });
});
