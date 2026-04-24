import { computeInterestAccrued } from "./interest";

/**
 * Flat renewal fee in basis points of outstanding principal (2%).
 * Charged at renewal time on top of accrued interest.
 */
export const RENEWAL_FEE_BPS = 200;

const BPS_DENOM = 10_000n;
const SECONDS_PER_DAY = 86_400;

/**
 * Fee = floor(principalAtoms * RENEWAL_FEE_BPS / 10_000)
 */
export function computeRenewalFee(principalAtoms: bigint): bigint {
  return (principalAtoms * BigInt(RENEWAL_FEE_BPS)) / BPS_DENOM;
}

/**
 * Total cost to renew at `renewAtSec` = accrued interest to now + flat fee.
 * The accrued portion "pays up" the current term; the fee is the cost of
 * rolling into the next one.
 */
export function computeRenewalTotal(
  principalAtoms: bigint,
  rateBps: number,
  createdAtSec: number,
  renewAtSec: number,
): bigint {
  const secondsElapsed = Math.max(0, renewAtSec - createdAtSec);
  const daysElapsed = Math.floor(secondsElapsed / SECONDS_PER_DAY);
  const accrued = computeInterestAccrued(principalAtoms, rateBps, daysElapsed);
  return accrued + computeRenewalFee(principalAtoms);
}
