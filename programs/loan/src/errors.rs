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
    /// SR-1 — feed is older than `PriceFeed::MAX_AGE_SECONDS`.
    #[msg("Price feed is stale")] StalePrice,
    /// Publisher reported a timestamp in the future relative to the on-chain
    /// clock. Most likely the publisher's clock drifted; the program refuses
    /// to write it because freshness checks become meaningless.
    #[msg("Price observation is in the future")] FuturePrice,
    /// SR-2 / SR-3 — the signer of `publish_price` is not the configured
    /// `LoanConfig.oracle_admin`, or a `create_ccb_trdc` consumer passed a
    /// price-feed PDA that doesn't match the canonical address. Either way,
    /// the wrong oracle is being trusted.
    #[msg("Invalid oracle / wrong signer")] InvalidOracle,
    /// `LoanConfig.oracle_admin` is `Pubkey::default()` — the oracle has
    /// never been set, so `publish_price` and any oracle-required path are
    /// inert. Admin must call `set_oracle_admin` first.
    #[msg("Oracle has not been initialized")] OracleNotInitialized,
    /// Caller of `create_ccb_trdc` requires a fresh price feed but the PDA
    /// supplied is uninitialised (rent-exempt zero account).
    #[msg("Price feed PDA has not been initialised")] PriceFeedNotInit,
    /// SR-5 — `publish_price` rejects payloads observed against fewer than
    /// `PriceFeed::MIN_LISTINGS` independent sources.
    #[msg("Insufficient listings to publish a price")] InsufficientListings,
    #[msg("Unauthorized")] Unauthorized,
    /// Migration ix found the on-chain account smaller than expected (the
    /// smaller layout never even had room for `admin`). Bail out instead of
    /// reading garbage.
    #[msg("Account data too small for migration")] AccountTooSmall,
    /// V3 — admin-gated ix invoked against a LoanConfig with `initialized = false`.
    #[msg("Loan config has not been initialized")] ConfigNotInitialized,
}
