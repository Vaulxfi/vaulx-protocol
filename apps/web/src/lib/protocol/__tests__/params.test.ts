import { describe, expect, it } from "vitest";

import {
  computeSchedule,
  computeSimulator,
  convertCurrency,
  formatAmount,
  INTEREST_ANNUAL_BPS,
  LATE_FEE_BPS_MONTHLY,
  MAX_LTV_PCT,
  ORIGINATION_FEE_BPS,
  ORIGINATION_FEE_PCT,
  type SimulatorInput,
} from "../params";

/**
 * Numeric-parity tests against the Laravel simulator JS in
 * `site/resources/views/simulator.blade.php:187-235`. The reference values
 * in this file are hand-derived from the same formulae and asserted to
 * 6 decimal places — drift between the two stacks would surface here.
 */

function within6dp(actual: number, expected: number): void {
  expect(actual).toBeCloseTo(expected, 6);
}

describe("protocol constants", () => {
  it("matches garantifi.php defaults", () => {
    expect(INTEREST_ANNUAL_BPS).toBe(2400);
    expect(LATE_FEE_BPS_MONTHLY).toBe(150);
    expect(ORIGINATION_FEE_BPS).toBe(250);
    expect(MAX_LTV_PCT).toBe(60);
    expect(ORIGINATION_FEE_PCT).toBeCloseTo(0.025, 12);
  });
});

describe("computeSimulator — parity with Laravel JS", () => {
  // Case 1 — the page's initial defaults (assetValue=15000, ltv=55, rate=24, term=12).
  it("case 1: defaults yield 8250 USDC principal at 55% LTV", () => {
    const input: SimulatorInput = {
      assetValue: 15000,
      ltvPct: 55,
      annualRatePct: 24,
      termMonths: 12,
    };
    const r = computeSimulator(input);
    within6dp(r.principal, 8250);
    within6dp(r.originationFee, 206.25);
    within6dp(r.netAmount, 8043.75);
    within6dp(r.monthlyInterest, 165);
    within6dp(r.monthly, 852.5);
    within6dp(r.totalInterest, 1980);
    within6dp(r.totalPaid, 10230);
    within6dp(r.cetPct, 26.5);
  });

  // Case 2 — conservative LTV with a short term.
  it("case 2: 8000 / 30% / 18% / 6mo", () => {
    const r = computeSimulator({
      assetValue: 8000,
      ltvPct: 30,
      annualRatePct: 18,
      termMonths: 6,
    });
    within6dp(r.principal, 2400);
    within6dp(r.originationFee, 60);
    within6dp(r.netAmount, 2340);
    within6dp(r.monthlyInterest, 36);
    within6dp(r.monthly, 436);
    within6dp(r.totalInterest, 216);
    within6dp(r.totalPaid, 2616);
    within6dp(r.cetPct, 11.5);
  });

  // Case 3 — at the protocol's max LTV ceiling.
  it("case 3: 25000 / 60% (MAX_LTV) / 24% / 24mo", () => {
    const r = computeSimulator({
      assetValue: 25000,
      ltvPct: 60,
      annualRatePct: 24,
      termMonths: 24,
    });
    within6dp(r.principal, 15000);
    within6dp(r.originationFee, 375);
    within6dp(r.netAmount, 14625);
    within6dp(r.monthlyInterest, 300);
    within6dp(r.monthly, 925);
    within6dp(r.totalInterest, 7200);
    within6dp(r.totalPaid, 22200);
    within6dp(r.cetPct, 50.5);
  });

  // Case 4 — max annual rate, mid-term.
  it("case 4: 35000 / 45% / 36% / 18mo", () => {
    const r = computeSimulator({
      assetValue: 35000,
      ltvPct: 45,
      annualRatePct: 36,
      termMonths: 18,
    });
    within6dp(r.principal, 15750);
    within6dp(r.originationFee, 393.75);
    within6dp(r.netAmount, 15356.25);
    within6dp(r.monthlyInterest, 472.5);
    within6dp(r.monthly, 1347.5);
    within6dp(r.totalInterest, 8505);
    within6dp(r.totalPaid, 24255);
    within6dp(r.cetPct, 56.5);
  });

  // Case 5 — min LTV, min rate, min term.
  it("case 5: 12000 / 20% / 12% / 3mo", () => {
    const r = computeSimulator({
      assetValue: 12000,
      ltvPct: 20,
      annualRatePct: 12,
      termMonths: 3,
    });
    within6dp(r.principal, 2400);
    within6dp(r.originationFee, 60);
    within6dp(r.netAmount, 2340);
    within6dp(r.monthlyInterest, 24);
    within6dp(r.monthly, 824);
    within6dp(r.totalInterest, 72);
    within6dp(r.totalPaid, 2472);
    within6dp(r.cetPct, 5.5);
  });

  // Case 6 — repeating-decimal monthly payment (50000 / 12 = 4166.6666...).
  it("case 6: 50000 / 55% / 24% / 12mo (non-terminating decimal)", () => {
    const r = computeSimulator({
      assetValue: 50000,
      ltvPct: 55,
      annualRatePct: 24,
      termMonths: 12,
    });
    within6dp(r.principal, 27500);
    within6dp(r.originationFee, 687.5);
    within6dp(r.monthlyInterest, 550);
    within6dp(r.monthly, 27500 / 12 + 550);
    within6dp(r.totalInterest, 6600);
    within6dp(r.totalPaid, 34100);
    within6dp(r.cetPct, 26.5);
  });

  // Edge — zero asset value must short-circuit CET to 0, not NaN.
  it("zero asset value yields zero CET, no NaN", () => {
    const r = computeSimulator({
      assetValue: 0,
      ltvPct: 55,
      annualRatePct: 24,
      termMonths: 12,
    });
    expect(r.principal).toBe(0);
    expect(r.cetPct).toBe(0);
    expect(Number.isFinite(r.monthly)).toBe(true);
  });
});

describe("computeSchedule — parity with Laravel JS", () => {
  it("case 5 schedule (3 months) sums back to principal", () => {
    const input: SimulatorInput = {
      assetValue: 12000,
      ltvPct: 20,
      annualRatePct: 12,
      termMonths: 3,
    };
    const rows = computeSchedule(input);
    expect(rows).toHaveLength(3);

    expect(rows[0]).toMatchObject({ index: 1 });
    within6dp(rows[0].principalPortion, 800);
    within6dp(rows[0].interestPortion, 24);
    within6dp(rows[0].payment, 824);
    within6dp(rows[0].balance, 1600);

    within6dp(rows[1].principalPortion, 800);
    within6dp(rows[1].balance, 800);

    // Last row absorbs any rounding residue into the final principal portion.
    within6dp(rows[2].principalPortion, 800);
    within6dp(rows[2].balance, 0);

    const principalSum = rows.reduce((s, r) => s + r.principalPortion, 0);
    within6dp(principalSum, 2400);
  });

  it("last installment closes the balance to exactly 0 even when months do not divide evenly", () => {
    // 1000 / 7 = 142.857142... — first 6 rows leave a stubborn residue
    // that the simulator absorbs into row 7.
    const rows = computeSchedule({
      assetValue: 10000,
      ltvPct: 10,
      annualRatePct: 12,
      termMonths: 7,
    });
    expect(rows).toHaveLength(7);
    expect(rows[6].balance).toBe(0);

    const principalSum = rows.reduce((s, r) => s + r.principalPortion, 0);
    within6dp(principalSum, 1000);
  });
});

describe("convertCurrency", () => {
  it("USDC → BRZ uses usd/brl rate", () => {
    within6dp(convertCurrency(100, "USDC", "BRZ", 5.18), 518);
  });
  it("BRZ → USDC divides by the rate", () => {
    within6dp(convertCurrency(518, "BRZ", "USDC", 5.18), 100);
  });
  it("same-currency returns input", () => {
    expect(convertCurrency(42, "USDC", "USDC", 5.18)).toBe(42);
  });
  it("zero amount returns 0", () => {
    expect(convertCurrency(0, "USDC", "BRZ", 5.18)).toBe(0);
  });
  it("zero rate from BRZ → USDC short-circuits to 0", () => {
    expect(convertCurrency(100, "BRZ", "USDC", 0)).toBe(0);
  });
});

describe("formatAmount", () => {
  it("USDC uses $ prefix and en-US grouping", () => {
    expect(formatAmount(1234.5, "USDC")).toBe("$1,234.50");
  });
  it("BRZ uses R$ prefix and pt-BR grouping", () => {
    // pt-BR uses '.' as thousand sep and ',' as decimal.
    expect(formatAmount(1234.5, "BRZ")).toBe("R$ 1.234,50");
  });
});
