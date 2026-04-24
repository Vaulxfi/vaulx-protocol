import { describe, it, expect } from "vitest";
import { computeInterestAccrued, computePayoff } from "./interest";

describe("interest accrual", () => {
  it("test_interest_zero_days_is_zero", () => {
    expect(computeInterestAccrued(10_000_000_000n, 1000, 0)).toBe(0n);
  });

  it("test_interest_exactly_one_year_matches_rate", () => {
    // 100 USDC (100_000_000 atoms), 1000 bps (10%), 365 days => 10 USDC.
    expect(computeInterestAccrued(100_000_000n, 1000, 365)).toBe(10_000_000n);
  });

  it("computes a mid-term accrual with floor rounding", () => {
    // 10_000 USDC (10_000_000_000 atoms), 1200 bps (12%), 30 days.
    // accrued = floor(10_000_000_000 * 1200 * 30 / (10_000 * 365))
    //        = floor(360_000_000_000_000 / 3_650_000)
    //        = 98_630_136
    expect(computeInterestAccrued(10_000_000_000n, 1200, 30)).toBe(98_630_136n);
  });

  it("test_payoff_at_issuance_equals_principal", () => {
    const principal = 10_000_000_000n;
    expect(computePayoff(principal, 1000, 1000, 1000)).toBe(principal);
    expect(computePayoff(principal, 1000, 2000, 1000)).toBe(principal);
  });

  it("test_payoff_midterm_is_principal_plus_accrued", () => {
    const principal = 10_000_000_000n;
    const createdAt = 1_700_000_000;
    const daysElapsed = 30;
    const paidAt = createdAt + daysElapsed * 86400;
    const accrued = computeInterestAccrued(principal, 1200, daysElapsed);
    expect(computePayoff(principal, 1200, createdAt, paidAt)).toBe(
      principal + accrued,
    );
  });

  it("test_bigint_no_overflow_at_1B_usdc_principal", () => {
    // 1_000_000_000 USDC = 1e15 atoms. 1200 bps * 90 days
    // intermediate = 1e15 * 1200 * 90 = 1.08e20 -> well above u64 but fine in BigInt
    const principal = 1_000_000_000_000_000n;
    const out = computeInterestAccrued(principal, 1200, 90);
    // expected = floor(108_000_000_000_000_000_000 / 3_650_000) = 29_589_041_095_890
    expect(out).toBe(29_589_041_095_890n);
    // Sanity: the formula's linear algebra should still recover the same result
    // when we split the multiply order — proves no partial-overflow dependency.
    expect(out).toBe((principal * 1200n * 90n) / (10_000n * 365n));
  });
});
