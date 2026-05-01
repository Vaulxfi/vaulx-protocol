import crypto from "node:crypto";

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { camelToKebab, signAndPost } from "../webhook/post";

const SECRET = "shared-test-secret";

describe("camelToKebab", () => {
  it("returns single-word names unchanged (already lowercase)", () => {
    expect(camelToKebab("disbursed")).toBe("disbursed");
  });

  it("converts lowerCamelCase to kebab-case", () => {
    expect(camelToKebab("custodyConfirmed")).toBe("custody-confirmed");
    expect(camelToKebab("ccbTrdcCreated")).toBe("ccb-trdc-created");
    expect(camelToKebab("kycRequiredChanged")).toBe("kyc-required-changed");
    expect(camelToKebab("installmentPaid")).toBe("installment-paid");
  });

  it("lowercases an UpperCamelCase first letter", () => {
    expect(camelToKebab("Disbursed")).toBe("disbursed");
    expect(camelToKebab("CcbTrdcCreated")).toBe("ccb-trdc-created");
  });
});

describe("signAndPost", () => {
  beforeEach(() => {
    // Pin the clock so the HMAC computation is deterministic.
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-01T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("posts to the right URL with HMAC headers covering ts/method/path/body", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response("", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const ts = Math.floor(Date.now() / 1000);
    await signAndPost({
      baseUrl: "https://laravel.example",
      secret: SECRET,
      eventName: "custody-confirmed",
      payload: { signature: "5yQXt", slot: 12345 },
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [
      string,
      {
        method: string;
        headers: Record<string, string>;
        body: string;
      },
    ];

    expect(url).toBe(
      "https://laravel.example/api/onchain-events/custody-confirmed",
    );
    expect(init.method).toBe("POST");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(init.headers["X-Vaulx-Timestamp"]).toBe(String(ts));

    const expectedSig = crypto
      .createHmac("sha256", SECRET)
      .update(
        `${ts}\nPOST\n/api/onchain-events/custody-confirmed\n${init.body}`,
      )
      .digest("hex");
    expect(init.headers["X-Vaulx-Signature"]).toBe(expectedSig);
    expect(JSON.parse(init.body)).toEqual({
      signature: "5yQXt",
      slot: 12345,
    });
  });

  it("preserves a subpath in baseUrl when composing the URL and HMAC path", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response("", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await signAndPost({
      baseUrl: "https://laravel.example/app",
      secret: SECRET,
      eventName: "disbursed",
      payload: {},
    });

    const [url, init] = fetchMock.mock.calls[0] as [
      string,
      { headers: Record<string, string>; body: string },
    ];
    expect(url).toBe(
      "https://laravel.example/app/api/onchain-events/disbursed",
    );

    const ts = init.headers["X-Vaulx-Timestamp"];
    const expectedSig = crypto
      .createHmac("sha256", SECRET)
      .update(`${ts}\nPOST\n/app/api/onchain-events/disbursed\n${init.body}`)
      .digest("hex");
    expect(init.headers["X-Vaulx-Signature"]).toBe(expectedSig);
  });

  it("normalises a trailing slash on baseUrl (no double slash in URL)", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response("", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await signAndPost({
      baseUrl: "https://laravel.example/",
      secret: SECRET,
      eventName: "disbursed",
      payload: {},
    });

    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://laravel.example/api/onchain-events/disbursed",
    );
  });

  it("swallows network errors (fire-and-forget)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("ECONNREFUSED")),
    );
    await expect(
      signAndPost({
        baseUrl: "https://laravel.example",
        secret: SECRET,
        eventName: "evt",
        payload: {},
      }),
    ).resolves.toBeUndefined();
  });

  it("swallows non-2xx responses (fire-and-forget)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("nope", { status: 500 })),
    );
    await expect(
      signAndPost({
        baseUrl: "https://laravel.example",
        secret: SECRET,
        eventName: "evt",
        payload: {},
      }),
    ).resolves.toBeUndefined();
  });
});
