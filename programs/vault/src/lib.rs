use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount, Transfer};

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

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        require!(amount > 0, VaultError::ZeroAmount);

        let total_assets = ctx.accounts.vault.total_assets;
        let total_shares = ctx.accounts.vault.total_shares;

        let shares_to_mint: u64 = if total_shares == 0 || total_assets == 0 {
            amount
        } else {
            let shares_u128 = (amount as u128)
                .checked_mul(total_shares as u128)
                .ok_or(VaultError::MathOverflow)?
                .checked_div(total_assets as u128)
                .ok_or(VaultError::MathOverflow)?;
            u64::try_from(shares_u128).map_err(|_| VaultError::MathOverflow)?
        };
        require!(shares_to_mint > 0, VaultError::ZeroAmount);

        // 1) depositor -> vault USDC transfer
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.depositor_ata.to_account_info(),
                    to: ctx.accounts.vault_ata.to_account_info(),
                    authority: ctx.accounts.depositor.to_account_info(),
                },
            ),
            amount,
        )?;

        // 2) mint shares to depositor (vault PDA is the share_mint authority)
        let asset_mint_key = ctx.accounts.asset_mint.key();
        let seeds: &[&[u8]] = &[
            Vault::SEED,
            asset_mint_key.as_ref(),
            &[ctx.accounts.vault.bump],
        ];
        token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint: ctx.accounts.share_mint.to_account_info(),
                    to: ctx.accounts.depositor_share_ata.to_account_info(),
                    authority: ctx.accounts.vault.to_account_info(),
                },
                &[seeds],
            ),
            shares_to_mint,
        )?;

        // 3) accounting
        let v = &mut ctx.accounts.vault;
        v.total_assets = v
            .total_assets
            .checked_add(amount)
            .ok_or(VaultError::MathOverflow)?;
        v.total_shares = v
            .total_shares
            .checked_add(shares_to_mint)
            .ok_or(VaultError::MathOverflow)?;

        Ok(())
    }

    // test-only helper — Phase 2 removes this.
    // Bumps vault.total_assets without minting shares, simulating yield accrual
    // so rounding-down behavior of the deposit share math is testable.
    // Requires caller to separately fund vault_ata (e.g. via mintTo).
    pub fn test_donate_assets(ctx: Context<TestDonateAssets>, amount: u64) -> Result<()> {
        require!(amount > 0, VaultError::ZeroAmount);
        let v = &mut ctx.accounts.vault;
        v.total_assets = v
            .total_assets
            .checked_add(amount)
            .ok_or(VaultError::MathOverflow)?;
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

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(
        mut,
        seeds = [Vault::SEED, asset_mint.key().as_ref()],
        bump = vault.bump,
    )]
    pub vault: Account<'info, Vault>,
    pub asset_mint: Account<'info, Mint>,
    #[account(mut, address = vault.share_mint)]
    pub share_mint: Account<'info, Mint>,

    #[account(mut, token::mint = asset_mint, token::authority = vault)]
    pub vault_ata: Account<'info, TokenAccount>,

    #[account(mut, token::mint = asset_mint, token::authority = depositor)]
    pub depositor_ata: Account<'info, TokenAccount>,

    #[account(mut, token::mint = share_mint, token::authority = depositor)]
    pub depositor_share_ata: Account<'info, TokenAccount>,

    #[account(mut)] pub depositor: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

// test-only helper — Phase 2 removes this.
#[derive(Accounts)]
pub struct TestDonateAssets<'info> {
    #[account(
        mut,
        seeds = [Vault::SEED, asset_mint.key().as_ref()],
        bump = vault.bump,
    )]
    pub vault: Account<'info, Vault>,
    pub asset_mint: Account<'info, Mint>,
}

pub use errors::*;
pub use state::*;
