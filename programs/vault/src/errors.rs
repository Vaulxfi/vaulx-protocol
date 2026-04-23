use anchor_lang::prelude::*;

#[error_code]
pub enum VaultError {
    #[msg("Math overflow")] MathOverflow,
    #[msg("Zero amount")] ZeroAmount,
    #[msg("Insufficient vault liquidity")] InsufficientVaultLiquidity,
    #[msg("Disburse not yet implemented")] DisburseNotYetImplemented,
}
