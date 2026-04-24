import { describe, it, expect } from "vitest";
import { RATE_TABLE_BPS, rateForTermDays } from "./rate";

describe("rate table", () => {
  it("exposes the canonical 30/60/90 table", () => {
    expect(RATE_TABLE_BPS[30]).toBe(800);
    expect(RATE_TABLE_BPS[60]).toBe(1000);
    expect(RATE_TABLE_BPS[90]).toBe(1200);
  });

  it("rateForTermDays returns bps for known terms", () => {
    expect(rateForTermDays(30)).toBe(800);
    expect(rateForTermDays(60)).toBe(1000);
    expect(rateForTermDays(90)).toBe(1200);
  });

  it("rateForTermDays throws on unknown term", () => {
    expect(() => rateForTermDays(45)).toThrow();
    expect(() => rateForTermDays(0)).toThrow();
  });
});
