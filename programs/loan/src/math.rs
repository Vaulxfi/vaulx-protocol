//! On-chain mirror of `@vaulx/terms::{computeInterestAccrued, computePayoff}`.
//!
//! Uses u128 intermediates to avoid u64 overflow on realistic principals.
//! Rounding matches the TS package exactly: integer flooring on both the
//! seconds-to-days floor and the final division.

use crate::errors::LoanError;
use anchor_lang::prelude::*;

pub const SECONDS_PER_DAY: i64 = 86_400;
pub const DAYS_PER_YEAR: u128 = 365;
pub const BPS_DENOM: u128 = 10_000;
pub const RENEWAL_FEE_BPS: u64 = 200;

/// floor(principal * rate_bps * days_elapsed / (10_000 * 365))
pub fn compute_interest_accrued(
    principal_atoms: u64,
    rate_bps: u64,
    days_elapsed: u64,
) -> Result<u64> {
    if days_elapsed == 0 || rate_bps == 0 || principal_atoms == 0 {
        return Ok(0);
    }
    let num = (principal_atoms as u128)
        .checked_mul(rate_bps as u128)
        .ok_or(LoanError::MathOverflow)?
        .checked_mul(days_elapsed as u128)
        .ok_or(LoanError::MathOverflow)?;
    let denom = BPS_DENOM
        .checked_mul(DAYS_PER_YEAR)
        .ok_or(LoanError::MathOverflow)?;
    let out = num / denom;
    u64::try_from(out).map_err(|_| error!(LoanError::MathOverflow))
}

/// Total payoff = principal + accrued. Accrues continuously past `due_ts`.
pub fn compute_payoff(
    principal_atoms: u64,
    rate_bps: u64,
    created_at_sec: i64,
    paid_at_sec: i64,
) -> Result<u64> {
    if paid_at_sec <= created_at_sec {
        return Ok(principal_atoms);
    }
    let seconds_elapsed = paid_at_sec - created_at_sec;
    let days_elapsed = (seconds_elapsed / SECONDS_PER_DAY) as u64;
    let accrued = compute_interest_accrued(principal_atoms, rate_bps, days_elapsed)?;
    principal_atoms
        .checked_add(accrued)
        .ok_or(error!(LoanError::MathOverflow))
}

/// Flat renewal fee = floor(principal * RENEWAL_FEE_BPS / 10_000).
pub fn compute_renewal_fee(principal_atoms: u64) -> Result<u64> {
    let out = (principal_atoms as u128)
        .checked_mul(RENEWAL_FEE_BPS as u128)
        .ok_or(LoanError::MathOverflow)?
        / BPS_DENOM;
    u64::try_from(out).map_err(|_| error!(LoanError::MathOverflow))
}

#[cfg(test)]
mod tests {
    use super::*;

    // Mirror the TS golden tests in packages/terms/src/interest.test.ts so
    // the on-chain math provably matches `@vaulx/terms::computePayoff`.

    #[test]
    fn zero_days_is_zero() {
        assert_eq!(
            compute_interest_accrued(10_000_000_000, 1000, 0).unwrap(),
            0,
        );
    }

    #[test]
    fn exactly_one_year_matches_rate() {
        // 100 USDC, 10%, 365d -> 10 USDC.
        assert_eq!(
            compute_interest_accrued(100_000_000, 1000, 365).unwrap(),
            10_000_000,
        );
    }

    #[test]
    fn midterm_ts_golden_10k_12pct_30d() {
        // 10k USDC, 12%, 30d -> 98_630_136 atoms.
        assert_eq!(
            compute_interest_accrued(10_000_000_000, 1200, 30).unwrap(),
            98_630_136,
        );
    }

    #[test]
    fn payoff_at_issuance_equals_principal() {
        assert_eq!(
            compute_payoff(10_000_000_000, 1000, 1000, 1000).unwrap(),
            10_000_000_000,
        );
    }

    #[test]
    fn renewal_fee_2pct_of_principal() {
        assert_eq!(compute_renewal_fee(10_000_000_000).unwrap(), 200_000_000);
        assert_eq!(compute_renewal_fee(1_000_000).unwrap(), 20_000);
    }
}
