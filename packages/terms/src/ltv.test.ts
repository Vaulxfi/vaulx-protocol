import { describe, it, expect } from "vitest";
import { calculateLTV, isLTVAllowed, maxLoanAmount } from "./ltv";

describe("LTV math", () => {
  it("computes LTV as basis points", () => {
    expect(calculateLTV(5000n, 10000n)).toBe(5000);
  });

  it("returns 0 when appraisal is 0 (guard against div-by-zero)", () => {
    expect(calculateLTV(100n, 0n)).toBe(0);
  });

  it("rejects LTV above 6000 bps (60%)", () => {
    expect(isLTVAllowed(6000)).toBe(true);
    expect(isLTVAllowed(6001)).toBe(false);
  });

  it("computes max loan at 50% LTV", () => {
    expect(maxLoanAmount(10000n, 5000)).toBe(5000n);
  });
});
