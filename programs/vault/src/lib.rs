use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, Mint, MintTo, Token, TokenAccount, Transfer};

pub mod errors;
pub mod state;

use state::Vault;

declare_id!("4PPyUvazjDBvFndGUL2rgKTwZrFbsSP1tk4a2uMhE9MS");

/// Hardcoded loan program id — mirrors `loan::declare_id!`. We hardcode rather
/// than import the `loan` crate to avoid a circular crate dep (loan depends on
/// vault).
// base58("BHdxEKkfsyjERiz5XiUybDLquvoWRtF7r1zDgVCDZJow") decoded to bytes.
pub const LOAN_PROGRAM_ID: Pubkey = Pubkey::new_from_array([
    152, 215, 241, 185, 109, 120, 219, 107, 20, 193, 123, 114, 110, 63, 95, 49, 169, 245, 238, 185,
    46, 68, 146, 201, 83, 132, 96, 201, 29, 0, 0, 38,
]);
pub const LOAN_AUTHORITY_SEED: &[u8] = b"loan_authority";

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

        emit!(VaultInitialized {
            vault: v.key(),
            asset_mint: v.asset_mint,
            share_mint: v.share_mint,
            ts: Clock::get()?.unix_timestamp,
        });
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
        let depositor_key = ctx.accounts.depositor.key();
        let v = &mut ctx.accounts.vault;
        v.total_assets = v
            .total_assets
            .checked_add(amount)
            .ok_or(VaultError::MathOverflow)?;
        v.total_shares = v
            .total_shares
            .checked_add(shares_to_mint)
            .ok_or(VaultError::MathOverflow)?;

        emit!(Deposited {
            vault: v.key(),
            depositor: depositor_key,
            amount,
            shares_minted: shares_to_mint,
            total_assets: v.total_assets,
            total_shares: v.total_shares,
            ts: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>, shares: u64) -> Result<()> {
        require!(shares > 0, VaultError::ZeroAmount);

        let total_assets = ctx.accounts.vault.total_assets;
        let total_shares = ctx.accounts.vault.total_shares;

        let assets_u128 = (shares as u128)
            .checked_mul(total_assets as u128)
            .ok_or(VaultError::MathOverflow)?
            .checked_div(total_shares as u128)
            .ok_or(VaultError::MathOverflow)?;
        let assets_out = u64::try_from(assets_u128).map_err(|_| VaultError::MathOverflow)?;

        require!(assets_out > 0, VaultError::ZeroAmount);
        require!(
            assets_out <= ctx.accounts.vault.total_assets,
            VaultError::InsufficientVaultLiquidity
        );

        // 1) burn shares from depositor (authority = depositor)
        token::burn(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Burn {
                    mint: ctx.accounts.share_mint.to_account_info(),
                    from: ctx.accounts.depositor_share_ata.to_account_info(),
                    authority: ctx.accounts.depositor.to_account_info(),
                },
            ),
            shares,
        )?;

        // 2) transfer assets from vault_ata -> depositor_ata (vault PDA signs)
        let asset_mint_key = ctx.accounts.asset_mint.key();
        let seeds: &[&[u8]] = &[
            Vault::SEED,
            asset_mint_key.as_ref(),
            &[ctx.accounts.vault.bump],
        ];
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.vault_ata.to_account_info(),
                    to: ctx.accounts.depositor_ata.to_account_info(),
                    authority: ctx.accounts.vault.to_account_info(),
                },
                &[seeds],
            ),
            assets_out,
        )?;

        // 3) accounting
        let depositor_key = ctx.accounts.depositor.key();
        let v = &mut ctx.accounts.vault;
        v.total_assets = v
            .total_assets
            .checked_sub(assets_out)
            .ok_or(VaultError::MathOverflow)?;
        v.total_shares = v
            .total_shares
            .checked_sub(shares)
            .ok_or(VaultError::MathOverflow)?;

        emit!(Withdrawn {
            vault: v.key(),
            depositor: depositor_key,
            shares_burned: shares,
            assets_out,
            total_assets: v.total_assets,
            total_shares: v.total_shares,
            ts: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    pub fn disburse(ctx: Context<Disburse>, amount: u64) -> Result<()> {
        require!(amount > 0, VaultError::ZeroAmount);

        // Layer 1: authority must be the loan-authority PDA and a signer.
        let (expected_authority, _bump) =
            Pubkey::find_program_address(&[LOAN_AUTHORITY_SEED], &LOAN_PROGRAM_ID);
        require_keys_eq!(
            ctx.accounts.loan_authority.key(),
            expected_authority,
            VaultError::UnauthorizedDisbursar
        );
        require!(
            ctx.accounts.loan_authority.is_signer,
            VaultError::UnauthorizedDisbursar
        );

        // Layer 2: the top-level instruction must be issued by the loan program.
        // Prevents a compromised/misused signer from invoking vault.disburse directly.
        use anchor_lang::solana_program::sysvar::instructions::load_instruction_at_checked;
        let ix_sysvar = &ctx.accounts.instructions_sysvar.to_account_info();
        let top_level_ix = load_instruction_at_checked(0, ix_sysvar)
            .map_err(|_| error!(VaultError::UnauthorizedDisbursar))?;
        require_keys_eq!(
            top_level_ix.program_id,
            LOAN_PROGRAM_ID,
            VaultError::UnauthorizedDisbursar
        );

        require!(
            amount <= ctx.accounts.vault.total_assets,
            VaultError::InsufficientVaultLiquidity
        );

        // Transfer vault_ata -> borrower_ata, vault PDA signs.
        let asset_mint_key = ctx.accounts.asset_mint.key();
        let seeds: &[&[u8]] = &[
            Vault::SEED,
            asset_mint_key.as_ref(),
            &[ctx.accounts.vault.bump],
        ];
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.vault_ata.to_account_info(),
                    to: ctx.accounts.borrower_ata.to_account_info(),
                    authority: ctx.accounts.vault.to_account_info(),
                },
                &[seeds],
            ),
            amount,
        )?;

        // disburse is a loan, not a withdrawal: shares are NOT burned. But
        // total_assets must drop to reflect the outflow.
        let borrower_ata_key = ctx.accounts.borrower_ata.key();
        let v = &mut ctx.accounts.vault;
        v.total_assets = v
            .total_assets
            .checked_sub(amount)
            .ok_or(VaultError::InsufficientVaultLiquidity)?;

        emit!(Disbursed {
            vault: v.key(),
            borrower: borrower_ata_key,
            amount,
            total_assets: v.total_assets,
            ts: Clock::get()?.unix_timestamp,
        });
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

#[derive(Accounts)]
pub struct Withdraw<'info> {
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

#[derive(Accounts)]
pub struct Disburse<'info> {
    #[account(mut, seeds = [Vault::SEED, asset_mint.key().as_ref()], bump = vault.bump)]
    pub vault: Account<'info, Vault>,
    pub asset_mint: Account<'info, Mint>,
    #[account(mut, token::mint = asset_mint, token::authority = vault)]
    pub vault_ata: Account<'info, TokenAccount>,
    #[account(mut, token::mint = asset_mint)]
    pub borrower_ata: Account<'info, TokenAccount>,
    /// CHECK: validated in the disburse body (Layer 1) — must equal the PDA
    /// `[b"loan_authority"]` in the loan program and must be a signer via
    /// `invoke_signed` from the loan program.
    #[account(signer)]
    pub loan_authority: UncheckedAccount<'info>,
    pub token_program: Program<'info, Token>,
    /// CHECK: address-constrained to the instructions sysvar; used by Layer 2
    /// to prove the top-level tx was issued by the loan program.
    #[account(address = anchor_lang::solana_program::sysvar::instructions::ID)]
    pub instructions_sysvar: UncheckedAccount<'info>,
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

#[event]
pub struct VaultInitialized {
    pub vault: Pubkey,
    pub asset_mint: Pubkey,
    pub share_mint: Pubkey,
    pub ts: i64,
}

#[event]
pub struct Deposited {
    pub vault: Pubkey,
    pub depositor: Pubkey,
    pub amount: u64,
    pub shares_minted: u64,
    pub total_assets: u64,
    pub total_shares: u64,
    pub ts: i64,
}

#[event]
pub struct Withdrawn {
    pub vault: Pubkey,
    pub depositor: Pubkey,
    pub shares_burned: u64,
    pub assets_out: u64,
    pub total_assets: u64,
    pub total_shares: u64,
    pub ts: i64,
}

#[event]
pub struct Disbursed {
    pub vault: Pubkey,
    pub borrower: Pubkey,
    pub amount: u64,
    pub total_assets: u64,
    pub ts: i64,
}

pub use errors::*;
pub use state::*;
