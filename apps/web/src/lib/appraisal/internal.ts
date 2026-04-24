import type { AppraisalInput, SourceResult, WatchCondition } from "./types";
import fallbackData from "./fixtures/watchcharts-fallback.json";

type FallbackEntry = { make: string; model: string; price_usd: number };
const TABLE: Record<string, FallbackEntry> = fallbackData as Record<
  string,
  FallbackEntry
>;

const CONDITION_MULT: Record<WatchCondition, number> = {
  mint: 1.1,
  excellent: 1.0,
  very_good: 0.9,
  good: 0.8,
};

const BASELINE_YEAR = 2020;
const DEFAULT_BASE = 9500;

function baseFor(input: AppraisalInput): number {
  const direct = TABLE[input.ref];
  if (direct) return direct.price_usd;
  const wantMake = input.make.trim().toLowerCase();
  const wantModel = input.model.trim().toLowerCase();
  for (const entry of Object.values(TABLE)) {
    if (
      entry.make.toLowerCase() === wantMake &&
      entry.model.toLowerCase() === wantModel
    ) {
      return entry.price_usd;
    }
  }
  for (const entry of Object.values(TABLE)) {
    if (entry.make.toLowerCase() === wantMake) return entry.price_usd;
  }
  return DEFAULT_BASE;
}

export function internalPrice(input: AppraisalInput): SourceResult {
  const base = baseFor(input);
  const yearsOld = Math.max(0, BASELINE_YEAR - input.year);
  const ageDiscount = Math.min(0.5, yearsOld * 0.01);
  const yearsNewer = Math.max(0, input.year - BASELINE_YEAR);
  const youthPremium = Math.min(0.05, yearsNewer * 0.005);
  const condMult = CONDITION_MULT[input.condition] ?? 1.0;
  const raw = base * (1 - ageDiscount + youthPremium) * condMult;
  const value = Math.max(1, Math.round(raw));
  return {
    ok: true,
    value,
    source: "internal",
    detail: `base=${base} cond=${input.condition} year=${input.year}`,
  };
}
