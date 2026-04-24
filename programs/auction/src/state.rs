use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum AuctionStatus {
    Open,
    Closed,
}

#[account]
pub struct Auction {
    pub trdc_state: Pubkey,
    pub asset_mint: Pubkey,
    pub reserve_price: u64,
    pub min_increment: u64,
    pub start_ts: i64,
    pub end_ts: i64,
    pub high_bid: u64,
    pub high_bidder: Pubkey,
    pub escrow_ata: Pubkey,
    pub vault: Pubkey,
    pub status: AuctionStatus,
    pub bump: u8,
    pub _reserved: [u8; 32],
}

impl Auction {
    // disc(8) + trdc_state(32) + asset_mint(32) + reserve(8) + inc(8)
    // + start(8) + end(8) + high_bid(8) + high_bidder(32) + escrow_ata(32)
    // + vault(32) + status(2) + bump(1) + reserved(32) = 241
    pub const SIZE: usize = 8
        + 32
        + 32
        + 8
        + 8
        + 8
        + 8
        + 8
        + 32
        + 32
        + 32
        + 2
        + 1
        + 32;
    pub const SEED: &'static [u8] = b"auction";
    pub const AUTHORITY_SEED: &'static [u8] = b"auction_authority";
}
