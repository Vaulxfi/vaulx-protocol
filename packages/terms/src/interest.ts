const SECONDS_PER_DAY = 86_400;
const DAYS_PER_YEAR = 365n;
const BPS_DENOM = 10_000n;

/**
 * Linear simple-interest accrual.
 *
 *   accrued = floor(principalAtoms * rateBps * daysElapsed / (10_000 * 365))
 *
 * BigInt arithmetic means no intermediate overflow regardless of principal
 * size — the on-chain Rust mirror uses a u128 intermediate for the same
 * reason.
 */
export function computeInterestAccrued(
  principalAtoms: bigint,
  rateBps: number,
  daysElapsed: number,
): bigint {
  if (daysElapsed <= 0) return 0n;
  if (rateBps <= 0) return 0n;
  const num = principalAtoms * BigInt(rateBps) * BigInt(daysElapsed);
  return num / (BPS_DENOM * DAYS_PER_YEAR);
}

/**
 * Total payoff at time `paidAtSec` given the loan's `createdAtSec`.
 *
 * Simple interest does NOT stop at due: if the loan runs past its due date,
 * interest keeps accruing — that's the lender yield that feeds into the
 * auction cascade in Task 3.2.
 */
export function computePayoff(
  principalAtoms: bigint,
  rateBps: number,
  createdAtSec: number,
  paidAtSec: number,
): bigint {
  if (paidAtSec <= createdAtSec) return principalAtoms;
  const secondsElapsed = paidAtSec - createdAtSec;
  // Whole-day flooring — matches the on-chain Rust mirror.
  const daysElapsed = Math.floor(secondsElapsed / SECONDS_PER_DAY);
  return principalAtoms + computeInterestAccrued(principalAtoms, rateBps, daysElapsed);
}
