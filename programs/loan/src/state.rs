//! On-chain price-feed state for the RedStone-pattern oracle.
//!
//! This file lives alongside the existing `LoanConfig` (still defined inline
//! in `lib.rs` for IDL stability across previous releases). When the loan
//! program reads a price for the LTV check, it reads `PriceFeed` here.
//!
//! Track A→B: as of the implementation date there is no Solana-native
//! `@redstone-finance/sdk-solana` package. We therefore implement the
//! "RedStone pattern" (push model, signed-payload, Anchor-verified) but with
//! a single Vaulx-controlled signer instead of the RedStone signer network.
//! The on-chain shape is forward-compatible with a future swap to a real
//! RedStone payload (the signer-set check would replace the
//! `published_by == oracle_admin` check; the rest of the SR-1 / SR-5 / SR-6
//! enforcement stays).

use anchor_lang::prelude::*;

#[account]
pub struct PriceFeed {
    /// Hash (or other 32-byte identifier) of the watch ref string.
    /// SR-2 — the `create_ccb_trdc` ix re-derives the PDA from this and the
    /// program id, so a wrong-feed substitution is rejected by the runtime
    /// before the LTV check runs.
    pub ref_bytes: [u8; 32],
    /// Median price in USD cents (2 decimals). SR-6 — the program assumes
    /// exactly 2 decimals; any future re-scaling MUST bump the discriminator
    /// (rename or version this struct) so old feeds become un-deserialisable.
    pub median_usd_cents: u64,
    /// Number of independent listings observed by the publisher to compute
    /// `median_usd_cents`. SR-5 — must be ≥ 3 (rejected at publish time).
    pub listings: u32,
    /// Unix timestamp from the publisher's reference clock. SR-1 — feeds
    /// older than `MAX_AGE_SECONDS` at publish time, or at consume time, are
    /// rejected.
    pub observed_at: i64,
    /// Pubkey of the off-chain publisher that signed this update. Must equal
    /// `LoanConfig.oracle_admin`. SR-3 / SR-4.
    pub published_by: Pubkey,
    pub bump: u8,
}

impl PriceFeed {
    // disc(8) + ref(32) + cents(8) + listings(4) + observed_at(8)
    //   + published_by(32) + bump(1)
    pub const SIZE: usize = 8 + 32 + 8 + 4 + 8 + 32 + 1;
    pub const SEED: &'static [u8] = b"price_feed";
    /// 10-minute freshness window — feeds older than this at publish-time or
    /// at consume-time are rejected.
    pub const MAX_AGE_SECONDS: i64 = 600;
    /// SR-5 — minimum number of independent listings to accept a feed.
    pub const MIN_LISTINGS: u32 = 3;

    pub fn pda(ref_bytes: &[u8; 32], program_id: &Pubkey) -> (Pubkey, u8) {
        Pubkey::find_program_address(&[Self::SEED, ref_bytes], program_id)
    }
}
