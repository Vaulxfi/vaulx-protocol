import { describe, it, expect } from "vitest";
import {
  RENEWAL_FEE_BPS,
  computeRenewalFee,
  computeRenewalTotal,
} from "./renewal";
import { computeInterestAccrued } from "./interest";

describe("renewal math", () => {
  it("test_renewal_fee_2pct", () => {
    expect(RENEWAL_FEE_BPS).toBe(200);
    // 10_000 USDC principal => fee = 200 USDC.
    expect(computeRenewalFee(10_000_000_000n)).toBe(200_000_000n);
    // 1 USDC principal => 0.02 USDC (20_000 atoms).
    expect(computeRenewalFee(1_000_000n)).toBe(20_000n);
  });

  it("test_renewal_total_equals_accrued_plus_fee", () => {
    const principal = 10_000_000_000n; // 10k USDC
    const rateBps = 1000; // 10%
    const createdAt = 1_700_000_000;
    const daysElapsed = 20;
    const renewAt = createdAt + daysElapsed * 86400;

    const accrued = computeInterestAccrued(principal, rateBps, daysElapsed);
    const fee = computeRenewalFee(principal);

    expect(computeRenewalTotal(principal, rateBps, createdAt, renewAt)).toBe(
      accrued + fee,
    );
  });

  it("renewal total at issuance equals fee only", () => {
    const principal = 10_000_000_000n;
    const at = 1_700_000_000;
    expect(computeRenewalTotal(principal, 1000, at, at)).toBe(
      computeRenewalFee(principal),
    );
  });
});
