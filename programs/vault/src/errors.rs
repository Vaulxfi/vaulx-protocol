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
    /// V3 — admin-gated ix invoked against a VaultConfig with `initialized = false`.
    /// Today this is unreachable because Anchor's `init` already prevents
    /// double-init; the explicit flag closes the surface if a `close_*_config`
    /// ix is ever added.
    #[msg("Vault config has not been initialized")] ConfigNotInitialized,
    /// V3 — migration ix found an account smaller than the v1 admin offset.
    #[msg("Account data too small for migration")] AccountTooSmall,
}
