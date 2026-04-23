use anchor_lang::prelude::*;

#[account]
pub struct Vault {
    pub asset_mint: Pubkey,
    pub share_mint: Pubkey,
    pub total_assets: u64,
    pub total_shares: u64,
    pub bump: u8,
    pub _reserved: [u8; 64],
}

impl Vault {
    pub const SIZE: usize = 8 + 32 + 32 + 8 + 8 + 1 + 64;
    pub const SEED: &'static [u8] = b"vault";
}
