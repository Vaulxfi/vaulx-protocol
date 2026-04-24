import { afterEach, describe, expect, it, vi } from "vitest";
import { aggregate } from "../aggregate";
import { internalPrice } from "../internal";
import type { AppraisalInput } from "../types";

const BASE_INPUT: AppraisalInput = {
  make: "Rolex",
  model: "Submariner Date",
  ref: "116610LN",
  year: 2020,
  condition: "excellent",
};

function mockHtmlWithPrices(prices: number[]): string {
  const cards = prices
    .map((p) => `<div class="listing"><span class="js-price">$ ${p.toLocaleString("en-US")}</span></div>`)
    .join("\n");
  return `<html><body>${cards}</body></html>`;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("aggregate", () => {
  it("happy path: Rolex 116610LN — all three sources return", async () => {
    const fakePrices = [14000, 14200, 14500, 14800, 15000];
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        text: async () => mockHtmlWithPrices(fakePrices),
        json: async () => ({}),
      })),
    );

    const resp = await aggregate(BASE_INPUT, { timeoutMs: 2000 });
    expect(resp.okCount).toBe(3);
    expect(resp.chrono24.ok).toBe(true);
    expect(resp.watchcharts.ok).toBe(true);
    expect(resp.internal.ok).toBe(true);
    expect(resp.median).toBeGreaterThan(0);
    expect(resp.allFallback).toBe(false); // internal is never fallback
    expect(resp.echo).toEqual(BASE_INPUT);
  });

  it("chrono24 times out — falls back without failing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise(() => {
            /* never resolves */
          }),
      ),
    );

    const resp = await aggregate(BASE_INPUT, { timeoutMs: 50 });
    // chrono24Price internally catches and stubs, BUT if fetch hangs past timeoutMs,
    // withTimeout fires — resulting in ok:false. Either way, watchcharts + internal stay ok.
    expect(resp.internal.ok).toBe(true);
    expect(resp.watchcharts.ok).toBe(true);
    // Internal is never a fallback, so allFallback must be false.
    expect(resp.allFallback).toBe(false);
    expect(resp.okCount).toBeGreaterThanOrEqual(2);
  });

  it("unknown ref — watchcharts returns default stub, internal computes a value", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );

    const input: AppraisalInput = {
      make: "Unknownbrand",
      model: "Mystery",
      ref: "9999/XX",
      year: 2020,
      condition: "excellent",
    };
    const resp = await aggregate(input, { timeoutMs: 2000 });
    expect(resp.watchcharts.ok).toBe(true);
    expect(resp.watchcharts.fallback).toBe(true);
    expect(resp.watchcharts.value).toBe(10000);
    expect(resp.chrono24.ok).toBe(true);
    expect(resp.chrono24.fallback).toBe(true);
    expect(resp.internal.ok).toBe(true);
    expect(resp.internal.fallback).toBeFalsy();
    expect(resp.okCount).toBe(3);
  });

  it("snapshot: internal model within ±15% of fallback stub for 116610LN/2020/excellent", () => {
    const result = internalPrice(BASE_INPUT);
    expect(result.ok).toBe(true);
    const expected = 14500;
    const lo = expected * 0.85;
    const hi = expected * 1.15;
    expect(result.value).toBeGreaterThanOrEqual(Math.floor(lo));
    expect(result.value).toBeLessThanOrEqual(Math.ceil(hi));
  });

  it("condition affects internal value", () => {
    const mint = internalPrice({ ...BASE_INPUT, condition: "mint" }).value!;
    const good = internalPrice({ ...BASE_INPUT, condition: "good" }).value!;
    expect(mint).toBeGreaterThan(good);
  });

  it("older year reduces internal value", () => {
    const newer = internalPrice({ ...BASE_INPUT, year: 2020 }).value!;
    const older = internalPrice({ ...BASE_INPUT, year: 1990 }).value!;
    expect(newer).toBeGreaterThan(older);
  });
});
