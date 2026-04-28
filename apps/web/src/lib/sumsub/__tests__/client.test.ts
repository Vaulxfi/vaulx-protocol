import { describe, it, expect } from "vitest";
import { signRequest } from "../client";

describe("sumsub HMAC signer", () => {
  it("signs a GET request deterministically", () => {
    const sig = signRequest({
      method: "GET",
      path: "/resources/applicants/-;externalUserId=user-1/one",
      body: "",
      timestamp: 1700000000,
      secret: "test-secret-key",
    });
    expect(sig).toBe(
      "78c2fc8ee54f5a74b798b765401ab5186902c3498c08b375134ce6da180071cd",
    );
    expect(sig).toMatch(/^[0-9a-f]{64}$/);
  });

  it("signs a POST with body", () => {
    const sig = signRequest({
      method: "POST",
      path: "/resources/sdkIntegrations/levels/-/websdkLink",
      body: JSON.stringify({ levelName: "basic-kyc-level", externalUserId: "u1" }),
      timestamp: 1700000000,
      secret: "test-secret-key",
    });
    expect(sig).toBe(
      "98179ec9121f81eb965f2ae90f0c4279db5e46cc94625ba8cbc6fb0b231bd5c2",
    );
    expect(sig.length).toBe(64);
  });

  it("uppercases method", () => {
    const lower = signRequest({
      method: "get",
      path: "/x",
      body: "",
      timestamp: 1,
      secret: "s",
    });
    const upper = signRequest({
      method: "GET",
      path: "/x",
      body: "",
      timestamp: 1,
      secret: "s",
    });
    expect(lower).toBe(upper);
  });
});
