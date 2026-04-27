use anchor_lang::prelude::*;

pub const MAX_LTV_BPS: u64 = 6_000; // 60% — mirrors packages/terms/src/ltv.ts
/// Grace period (3 days) after `due_ts` before a loan can be force-defaulted
/// via `execute_af_default`. Mirrors the off-chain grace window used by the
/// indexer scheduler.
pub const GRACE_PERIOD_SECS: i64 = 86_400 * 3;

#[error_code]
pub enum LoanError {
    #[msg("Loan amount exceeds maximum LTV (60%)")] LtvTooHigh,
    #[msg("Zero amount")] ZeroAmount,
    #[msg("Math overflow")] MathOverflow,
    #[msg("Unauthorized custodian")] UnauthorizedCustodian,
    #[msg("Unauthorized admin")] UnauthorizedAdmin,
    #[msg("No valid Civic gateway token")] NoValidGatewayToken,
    #[msg("Installment exceeds outstanding principal")] OverPayment,
    #[msg("Loan is not yet past the grace period")] NotYetDefaulted,
    #[msg("No valid KYC attestation")] NoKycAttestation,
    #[msg("Unauthorized attestor")] UnauthorizedAttestor,
}
