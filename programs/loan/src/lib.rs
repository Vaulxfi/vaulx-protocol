use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token};
use trdc::cpi::accounts::{
    ConfirmCustodyTransition, InitializeTrdcState, MintTrdcCnft, TransitionToActive,
};
use trdc::program::Trdc;
use trdc::state::{Status, TRDCState};
use vault::cpi::accounts::Disburse as VaultDisburse;
use vault::program::Vault as VaultProgram;

pub mod civic;
pub mod errors;
use errors::{LoanError, MAX_LTV_BPS};

declare_id!("BHdxEKkfsyjERiz5XiUybDLquvoWRtF7r1zDgVCDZJow");

pub const LOAN_AUTHORITY_SEED: &[u8] = b"loan_authority";

#[program]
pub mod loan {
    use super::*;

    pub fn ping(_ctx: Context<Ping>) -> Result<()> {
        msg!("loan ping");
        Ok(())
    }

    pub fn initialize_loan_config(
        ctx: Context<InitializeLoanConfig>,
        custodian: Pubkey,
        civic_network: Pubkey,
    ) -> Result<()> {
        let cfg = &mut ctx.accounts.loan_config;
        cfg.admin = ctx.accounts.admin.key();
        cfg.custodian = custodian;
        cfg.civic_network = civic_network;
        cfg.bump = ctx.bumps.loan_config;
        Ok(())
    }

    pub fn create_ccb_trdc(
        ctx: Context<CreateCcbTrdc>,
        loan_id: Pubkey,
        appraisal_value: u64,
        loan_amount: u64,
        due_ts: i64,
        asset_hint: [u8; 32],
    ) -> Result<()> {
        require!(loan_amount > 0 && appraisal_value > 0, LoanError::ZeroAmount);

        // Civic Pass gate — no-op when network is default.
        if ctx.accounts.loan_config.civic_network != Pubkey::default() {
            civic::verify_gateway_token(
                &ctx.accounts.gateway_token.to_account_info(),
                &ctx.accounts.payer.key(),
                &ctx.accounts.loan_config.civic_network,
            )?;
        }

        // LTV check: loan * 10_000 <= appraisal * MAX_LTV_BPS
        let lhs = (loan_amount as u128)
            .checked_mul(10_000u128).ok_or(LoanError::MathOverflow)?;
        let rhs = (appraisal_value as u128)
            .checked_mul(MAX_LTV_BPS as u128).ok_or(LoanError::MathOverflow)?;
        require!(lhs <= rhs, LoanError::LtvTooHigh);

        trdc::cpi::initialize_trdc_state(
            CpiContext::new(ctx.accounts.trdc_program.to_account_info(), InitializeTrdcState {
                trdc_state: ctx.accounts.trdc_state.to_account_info(),
                payer: ctx.accounts.payer.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
            }),
            loan_id, appraisal_value, loan_amount, due_ts,
        )?;

        trdc::cpi::mint_trdc_cnft(
            CpiContext::new(ctx.accounts.trdc_program.to_account_info(), MintTrdcCnft {
                trdc_state: ctx.accounts.trdc_state.to_account_info(),
                authority: ctx.accounts.payer.to_account_info(),
            }),
            asset_hint,
        )?;

        emit!(CcbTrdcCreated {
            trdc_state: ctx.accounts.trdc_state.key(),
            loan_id,
            appraisal_value,
            loan_amount,
            due_ts,
            ts: Clock::get()?.unix_timestamp,
        });
        Ok(())
    }

    pub fn confirm_custody(
        ctx: Context<ConfirmCustody>,
        doc_hash: [u8; 32],
    ) -> Result<()> {
        require!(
            ctx.accounts.custodian.key() == ctx.accounts.loan_config.custodian,
            LoanError::UnauthorizedCustodian
        );

        trdc::cpi::confirm_custody_transition(
            CpiContext::new(
                ctx.accounts.trdc_program.to_account_info(),
                ConfirmCustodyTransition {
                    trdc_state: ctx.accounts.trdc_state.to_account_info(),
                    authority: ctx.accounts.custodian.to_account_info(),
                },
            ),
            doc_hash,
        )?;

        emit!(CustodyConfirmed {
            trdc_state: ctx.accounts.trdc_state.key(),
            doc_hash,
            custodian: ctx.accounts.custodian.key(),
            ts: Clock::get()?.unix_timestamp,
        });
        Ok(())
    }

    pub fn disburse_from_vault(ctx: Context<DisburseFromVault>, amount: u64) -> Result<()> {
        require!(amount > 0, LoanError::ZeroAmount);
        require!(
            ctx.accounts.trdc_state.status == Status::ActiveInCustody,
            trdc::errors::TrdcError::InvalidStateTransition
        );

        // Derive loan_authority signer seeds.
        let (expected_authority, bump) =
            Pubkey::find_program_address(&[LOAN_AUTHORITY_SEED], &crate::ID);
        require_keys_eq!(
            ctx.accounts.loan_authority.key(),
            expected_authority,
            LoanError::UnauthorizedAdmin
        );

        let seeds: &[&[u8]] = &[LOAN_AUTHORITY_SEED, &[bump]];
        let signer_seeds: &[&[&[u8]]] = &[seeds];

        // 1) CPI into vault::disburse, signed by the loan_authority PDA.
        vault::cpi::disburse(
            CpiContext::new_with_signer(
                ctx.accounts.vault_program.to_account_info(),
                VaultDisburse {
                    vault: ctx.accounts.vault.to_account_info(),
                    asset_mint: ctx.accounts.asset_mint.to_account_info(),
                    vault_ata: ctx.accounts.vault_ata.to_account_info(),
                    borrower_ata: ctx.accounts.borrower_ata.to_account_info(),
                    loan_authority: ctx.accounts.loan_authority.to_account_info(),
                    token_program: ctx.accounts.token_program.to_account_info(),
                    instructions_sysvar: ctx.accounts.instructions_sysvar.to_account_info(),
                },
                signer_seeds,
            ),
            amount,
        )?;

        // 2) CPI into trdc to flip ActiveInCustody -> Active.
        trdc::cpi::transition_to_active(CpiContext::new(
            ctx.accounts.trdc_program.to_account_info(),
            TransitionToActive {
                trdc_state: ctx.accounts.trdc_state.to_account_info(),
                authority: ctx.accounts.borrower.to_account_info(),
            },
        ))?;

        emit!(DisburseRequested {
            trdc_state: ctx.accounts.trdc_state.key(),
            borrower: ctx.accounts.borrower.key(),
            amount,
            ts: Clock::get()?.unix_timestamp,
        });
        Ok(())
    }
}

#[event]
pub struct CcbTrdcCreated {
    pub trdc_state: Pubkey,
    pub loan_id: Pubkey,
    pub appraisal_value: u64,
    pub loan_amount: u64,
    pub due_ts: i64,
    pub ts: i64,
}

#[event]
pub struct CustodyConfirmed {
    pub trdc_state: Pubkey,
    pub doc_hash: [u8; 32],
    pub custodian: Pubkey,
    pub ts: i64,
}

#[event]
pub struct DisburseRequested {
    pub trdc_state: Pubkey,
    pub borrower: Pubkey,
    pub amount: u64,
    pub ts: i64,
}

#[account]
pub struct LoanConfig {
    pub admin: Pubkey,
    pub custodian: Pubkey,
    /// Gatekeeper network pubkey; `Pubkey::default()` disables the Civic gate.
    pub civic_network: Pubkey,
    pub bump: u8,
}

impl LoanConfig {
    pub const SIZE: usize = 8 + 32 + 32 + 32 + 1;
    pub const SEED: &'static [u8] = b"loan_config";
}

#[derive(Accounts)]
pub struct Ping<'info> {
    pub signer: Signer<'info>,
}

#[derive(Accounts)]
pub struct InitializeLoanConfig<'info> {
    #[account(
        init,
        payer = admin,
        space = LoanConfig::SIZE,
        seeds = [LoanConfig::SEED],
        bump,
    )]
    pub loan_config: Account<'info, LoanConfig>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(loan_id: Pubkey)]
pub struct CreateCcbTrdc<'info> {
    /// CHECK: created via CPI into trdc; trdc program asserts PDA seeds/owner on init.
    #[account(mut)] pub trdc_state: UncheckedAccount<'info>,
    pub trdc_program: Program<'info, Trdc>,
    #[account(mut)] pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,

    #[account(seeds = [LoanConfig::SEED], bump = loan_config.bump)]
    pub loan_config: Account<'info, LoanConfig>,
    /// CHECK: validated inline via `civic::verify_gateway_token` when the gate
    /// is enabled. Pass any account when `loan_config.civic_network == default`.
    pub gateway_token: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct ConfirmCustody<'info> {
    #[account(mut)]
    pub trdc_state: Account<'info, TRDCState>,
    #[account(
        seeds = [LoanConfig::SEED],
        bump = loan_config.bump,
    )]
    pub loan_config: Account<'info, LoanConfig>,
    pub trdc_program: Program<'info, Trdc>,
    pub custodian: Signer<'info>,
}

#[derive(Accounts)]
pub struct DisburseFromVault<'info> {
    #[account(mut)]
    pub trdc_state: Account<'info, TRDCState>,
    #[account(
        seeds = [LoanConfig::SEED],
        bump = loan_config.bump,
    )]
    pub loan_config: Account<'info, LoanConfig>,

    /// CHECK: asserted by the vault program via its own seeds/bump constraint.
    #[account(mut)]
    pub vault: UncheckedAccount<'info>,
    pub asset_mint: Account<'info, Mint>,
    /// CHECK: asserted by the vault program (token::mint/token::authority).
    #[account(mut)]
    pub vault_ata: UncheckedAccount<'info>,
    /// CHECK: asserted by the vault program (token::mint).
    #[account(mut)]
    pub borrower_ata: UncheckedAccount<'info>,

    /// CHECK: PDA `[b"loan_authority"]` owned by this program. The vault program
    /// re-derives and requires this as the signer.
    #[account(
        seeds = [LOAN_AUTHORITY_SEED],
        bump,
    )]
    pub loan_authority: UncheckedAccount<'info>,

    #[account(mut)]
    pub borrower: Signer<'info>,

    pub trdc_program: Program<'info, Trdc>,
    pub vault_program: Program<'info, VaultProgram>,
    pub token_program: Program<'info, Token>,
    /// CHECK: address-constrained to the instructions sysvar; forwarded to the
    /// vault CPI so vault::disburse's Layer 2 check can read it.
    #[account(address = anchor_lang::solana_program::sysvar::instructions::ID)]
    pub instructions_sysvar: UncheckedAccount<'info>,
}
