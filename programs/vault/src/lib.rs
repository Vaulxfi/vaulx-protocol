use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token};

pub mod errors;
pub mod state;

use state::Vault;

declare_id!("4PPyUvazjDBvFndGUL2rgKTwZrFbsSP1tk4a2uMhE9MS");

#[program]
pub mod vault {
    use super::*;

    pub fn initialize_vault(ctx: Context<InitializeVault>) -> Result<()> {
        let v = &mut ctx.accounts.vault;
        v.asset_mint = ctx.accounts.asset_mint.key();
        v.share_mint = ctx.accounts.share_mint.key();
        v.total_assets = 0;
        v.total_shares = 0;
        v.bump = ctx.bumps.vault;
        v._reserved = [0u8; 64];
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeVault<'info> {
    #[account(
        init, payer = payer, space = Vault::SIZE,
        seeds = [Vault::SEED, asset_mint.key().as_ref()], bump,
    )]
    pub vault: Account<'info, Vault>,
    pub asset_mint: Account<'info, Mint>,
    #[account(
        init, payer = payer,
        mint::decimals = 6, mint::authority = vault, mint::freeze_authority = vault,
    )]
    pub share_mint: Account<'info, Mint>,
    #[account(mut)] pub payer: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub use errors::*;
pub use state::*;
