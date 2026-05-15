/**
 * Vaulx protocol parameters — ported from Laravel `site/config/garantifi.php`.
 *
 * Single source of truth for simulator calculations and any downstream
 * consumer that needs the same constants (fees, LTV cap, interest model,
 * depeg thresholds, token decimals, FX fallback). Values mirror Laravel's
 * `env()` defaults so a fresh Next.js install matches the static deck.
 *
 * Numbers labelled `*_BPS` are basis points (1 bp = 0.01%) and align with
 * the on-chain program constants (e.g. `MAX_LTV_BPS = 6_000` in
 * `programs/loan/src/errors.rs`). Keep this file in sync if those change.
 */

// ---------------------------------------------------------------------------
// Tokens — mirrors `tokens` block in garantifi.php
// ---------------------------------------------------------------------------

export type TokenSymbol = "USDC" | "BRZ";

export interface TokenConfig {
  readonly mint: string;
  readonly decimals: number;
  readonly symbol: TokenSymbol;
  readonly prefix: string;
  readonly name: string;
}

export const TOKENS: Readonly<Record<TokenSymbol, TokenConfig>> = {
  USDC: {
    mint: "3eXFpUHRtg7UdJviTtz9LP87LfGk2aYsPDfkjDFai672",
    decimals: 6,
    symbol: "USDC",
    prefix: "$",
    name: "USD Coin",
  },
  BRZ: {
    mint: "BRzSkMr57a72LNcBwpY2ZBpBMwDMsXbxjwRs4uPMZLG",
    decimals: 6,
    symbol: "BRZ",
    prefix: "R$",
    name: "Brazilian Digital Token",
  },
} as const;

// ---------------------------------------------------------------------------
// Lending — `lending` block. MAX_LTV_BPS=6_000 on-chain (60%).
// ---------------------------------------------------------------------------

export const MAX_LTV_PCT = 60;

// ---------------------------------------------------------------------------
// Interest — `interest` block. Annual simple-linear model per spec §3.
// ---------------------------------------------------------------------------

export const INTEREST_ANNUAL_BPS = 2400; // 24.00% APR default.
export const LATE_FEE_BPS_MONTHLY = 150; // 1.50% per missed month.
export const ORIGINATION_FEE_BPS = 250; // 2.50% taken on disbursement.

// ---------------------------------------------------------------------------
// FX rates — `rates` block. Fallback used when /api/rates fetch fails.
// ---------------------------------------------------------------------------

export const FALLBACK_BRL_USD = 5.18; // R$ per USD.
export const RATES_CACHE_TTL_SECONDS = 300;

// ---------------------------------------------------------------------------
// Depeg thresholds — `depeg` block. Percentages, NOT bps.
// ---------------------------------------------------------------------------

export const DEPEG_ALERT_PCT = 1.0;
export const DEPEG_PAUSE_PCT = 3.0;
export const DEPEG_CONVERT_PCT = 5.0;

// ---------------------------------------------------------------------------
// Reloan — `reloan` block. Days, not seconds.
// ---------------------------------------------------------------------------

export const RELOAN_MAX_APPRAISAL_AGE_DAYS = 180;
export const RELOAN_REENGAGEMENT_OFFER_DAYS = 30;

// ---------------------------------------------------------------------------
// Market — `market` block. Used by appraisal pipeline.
// ---------------------------------------------------------------------------

export const MARKET_SOURCES = ["chrono24", "watchcharts", "watchfinder", "bobs"] as const;
export const MARKET_CACHE_TTL_SECONDS = 3600;
export const MARKET_MIN_LISTINGS = 5;

// ---------------------------------------------------------------------------
// Scoring — `scoring` block. Weights of the 6 underwriting metrics + the
// tiered score-to-tier mapping. Not used by the simulator but exported so
// downstream code never re-declares them.
// ---------------------------------------------------------------------------

export const SCORING_WEIGHTS = {
  m1: 30,
  m2: 20,
  m3: 15,
  m4: 15,
  m5: 10,
  m6: 10,
} as const;

export const SCORING_TIERS = {
  1: 0,
  2: 60,
  3: 75,
  4: 90,
} as const;

// ---------------------------------------------------------------------------
// Simulator — convenience derivatives.
// ---------------------------------------------------------------------------

export const ORIGINATION_FEE_PCT = ORIGINATION_FEE_BPS / 10_000; // 0.025
export const INTEREST_ANNUAL_PCT = INTEREST_ANNUAL_BPS / 10_000; // 0.24

// Asset-category USD presets shown when the user changes the category
// dropdown. Mirrors `CATEGORY_PRESETS` in `simulator.blade.php:161-166`.
export const CATEGORY_PRESETS_USD = {
  watch: 8000,
  jewelry: 12000,
  art: 25000,
  vehicle: 35000,
} as const;

export type AssetCategory = keyof typeof CATEGORY_PRESETS_USD;

export const SIMULATOR_TERM_OPTIONS_MONTHS = [3, 6, 12, 18, 24] as const;
export type SimulatorTermMonths =
  (typeof SIMULATOR_TERM_OPTIONS_MONTHS)[number];

// ---------------------------------------------------------------------------
// Simulator math — port of the JS in `simulator.blade.php:187-235`.
//
// Linear simple interest:
//   principal       = assetValue * ltvPct
//   originationFee  = principal * 0.025
//   netAmount       = principal - originationFee
//   monthlyInterest = principal * annualRate / 12
//   monthly         = principal / months + monthlyInterest
//   totalInterest   = monthlyInterest * months
//   totalPaid       = principal + totalInterest
//   cet             = ((totalPaid + originationFee) / principal - 1) * 100
//
// Schedule row n (1-indexed):
//   isLast        = (n === months)
//   principalPart = isLast ? prevBalance : principal / months
//   payment       = principalPart + monthlyInterest
//   newBalance    = max(0, prevBalance - principalPart)
//
// All values are kept as JS numbers (IEEE 754 doubles) — same precision the
// Laravel browser-side script uses. Parity tests cover round-trip to 6 dp.
// ---------------------------------------------------------------------------

export interface SimulatorInput {
  /** Asset value in the selected currency. */
  assetValue: number;
  /** LTV as a percentage in [0, 100]. */
  ltvPct: number;
  /** Annual interest as a percentage in [0, 100]. */
  annualRatePct: number;
  /** Term length in whole months. */
  termMonths: number;
}

export interface SimulatorOutput {
  principal: number;
  originationFee: number;
  netAmount: number;
  monthlyInterest: number;
  monthly: number;
  totalInterest: number;
  totalPaid: number;
  /** Effective total cost — percentage (e.g. 28.5 for 28.5%). */
  cetPct: number;
}

export interface ScheduleRow {
  /** 1-indexed installment number. */
  index: number;
  principalPortion: number;
  interestPortion: number;
  payment: number;
  balance: number;
}

export function computeSimulator(input: SimulatorInput): SimulatorOutput {
  const { assetValue, ltvPct, annualRatePct, termMonths } = input;
  const ltv = ltvPct / 100;
  const annualRate = annualRatePct / 100;

  const principal = assetValue * ltv;
  const originationFee = principal * ORIGINATION_FEE_PCT;
  const netAmount = principal - originationFee;

  const monthlyInterest = (principal * annualRate) / 12;
  const monthly =
    termMonths > 0 ? principal / termMonths + monthlyInterest : 0;
  const totalInterest = monthlyInterest * termMonths;
  const totalPaid = principal + totalInterest;
  const cetPct =
    principal > 0 ? ((totalPaid + originationFee) / principal - 1) * 100 : 0;

  return {
    principal,
    originationFee,
    netAmount,
    monthlyInterest,
    monthly,
    totalInterest,
    totalPaid,
    cetPct,
  };
}

export function computeSchedule(input: SimulatorInput): ScheduleRow[] {
  const { principal, monthlyInterest } = computeSimulator(input);
  const months = input.termMonths;
  if (months <= 0) return [];

  const rows: ScheduleRow[] = [];
  const principalPortion = principal / months;
  let balance = principal;
  for (let i = 1; i <= months; i++) {
    const isLast = i === months;
    const pp = isLast ? balance : principalPortion;
    balance = Math.max(0, balance - pp);
    rows.push({
      index: i,
      principalPortion: pp,
      interestPortion: monthlyInterest,
      payment: pp + monthlyInterest,
      balance,
    });
  }
  return rows;
}

// ---------------------------------------------------------------------------
// FX conversion — port of `convert()` in `site/resources/js/currency.js:22-27`.
// Direction is USDC ⇄ BRZ; rate is BRL per USD.
// ---------------------------------------------------------------------------

export function convertCurrency(
  amount: number,
  from: TokenSymbol,
  to: TokenSymbol,
  usdBrl: number,
): number {
  if (!amount || from === to) return amount || 0;
  if (from === "USDC" && to === "BRZ") return amount * usdBrl;
  if (from === "BRZ" && to === "USDC") return usdBrl > 0 ? amount / usdBrl : 0;
  return amount;
}

// ---------------------------------------------------------------------------
// Display formatting — port of `format()` in currency.js.
// ---------------------------------------------------------------------------

const LOCALE_BY_CURRENCY: Readonly<Record<TokenSymbol, string>> = {
  USDC: "en-US",
  BRZ: "pt-BR",
};

const PREFIX_BY_CURRENCY: Readonly<Record<TokenSymbol, string>> = {
  USDC: "$",
  BRZ: "R$ ",
};

export function formatAmount(amount: number, currency: TokenSymbol): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return (
    PREFIX_BY_CURRENCY[currency] +
    safe.toLocaleString(LOCALE_BY_CURRENCY[currency], {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}
