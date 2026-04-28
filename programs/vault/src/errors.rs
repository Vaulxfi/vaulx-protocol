use anchor_lang::prelude::*;

#[error_code]
pub enum VaultError {
    #[msg("Math overflow")] MathOverflow,
    #[msg("Zero amount")] ZeroAmount,
    #[msg("Insufficient vault liquidity")] InsufficientVaultLiquidity,
    #[msg("Unauthorized disbursar")] UnauthorizedDisbursar,
    #[msg("No valid Civic gateway token")] NoValidGatewayToken,
    #[msg("No valid KYC attestation")] NoKycAttestation,
    #[msg("Unauthorized attestor")] UnauthorizedAttestor,
    #[msg("Unauthorized")] Unauthorized,
}
