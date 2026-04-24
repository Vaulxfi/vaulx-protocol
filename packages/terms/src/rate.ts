/**
 * Fixed-rate interest table keyed by loan term (days).
 * Mirrors `programs/loan/src/math.rs`'s on-chain expectations: the client
 * computes `rate_bps` from the term, the on-chain program stores it on the
 * TRDCState and accrues interest off of the stored rate.
 */
export const RATE_TABLE_BPS: Record<number, number> = {
  30: 800, // 8% APR
  60: 1000, // 10% APR
  90: 1200, // 12% APR
};

/**
 * Returns the APR in basis points for the given term. Throws on any term
 * that isn't one of the canonical 30/60/90.
 */
export function rateForTermDays(termDays: number): number {
  const bps = RATE_TABLE_BPS[termDays];
  if (bps === undefined) {
    throw new Error(
      `Unknown loan term: ${termDays} days. Supported: ${Object.keys(RATE_TABLE_BPS).join(", ")}.`,
    );
  }
  return bps;
}
