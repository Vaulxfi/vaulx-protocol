import { test, expect } from "@playwright/test";

const TEST_PUBKEY = "7QpTNAveTSfQSEzjPCmfzgE9ZGrgkcUBmDZ97dcSixdE";

test.describe("Sumsub API routes", () => {
  test("GET /api/sumsub/applicant-status returns kyc=missing for unknown wallet", async ({
    request,
  }) => {
    const resp = await request.get(
      `/api/sumsub/applicant-status?walletPubkey=${TEST_PUBKEY}`,
    );
    expect(resp.status()).toBe(200);
    const json = await resp.json();
    expect(json.ok).toBe(true);
    expect(json.kyc).toBe("missing");
    expect(typeof json.pda).toBe("string");
    expect(json.pda.length).toBeGreaterThan(20);
  });

  test("POST /api/sumsub/init-token returns a valid Sumsub sandbox token", async ({
    request,
  }) => {
    const resp = await request.post("/api/sumsub/init-token", {
      data: { walletPubkey: TEST_PUBKEY },
    });
    expect(resp.status()).toBe(200);
    const json = await resp.json();
    expect(json.ok).toBe(true);
    expect(typeof json.token).toBe("string");
    // Sandbox tokens look like: _act-sbx-jwt-<base64>...
    expect(json.token).toMatch(/^_act-(sbx-)?jwt-/);
    expect(json.applicantId).toBe(TEST_PUBKEY);
    expect(typeof json.levelName).toBe("string");
  });

  test("GET /api/onchain-events/ticker returns 200 JSON", async ({
    request,
  }) => {
    const resp = await request.get("/api/onchain-events/ticker");
    expect(resp.status()).toBe(200);
    // Body shape isn't load-bearing for the smoke; just assert it parsed.
    await resp.json().catch((err) => {
      throw new Error(`ticker did not return JSON: ${err}`);
    });
  });
});
