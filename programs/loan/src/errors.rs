use anchor_lang::prelude::*;

pub const MAX_LTV_BPS: u64 = 6_000; // 60% — mirrors packages/terms/src/ltv.ts

#[error_code]
pub enum LoanError {
    #[msg("Loan amount exceeds maximum LTV (60%)")] LtvTooHigh,
    #[msg("Zero amount")] ZeroAmount,
    #[msg("Math overflow")] MathOverflow,
    #[msg("Unauthorized custodian")] UnauthorizedCustodian,
    #[msg("Unauthorized admin")] UnauthorizedAdmin,
    #[msg("No valid Civic gateway token")] NoValidGatewayToken,
}
