use anchor_lang::prelude::*;
use trdc::cpi::accounts::{ConfirmCustodyTransition, InitializeTrdcState, MintTrdcCnft};
use trdc::program::Trdc;
use trdc::state::TRDCState;

pub mod errors;
use errors::{LoanError, MAX_LTV_BPS};

declare_id!("BHdxEKkfsyjERiz5XiUybDLquvoWRtF7r1zDgVCDZJow");

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
    ) -> Result<()> {
        let cfg = &mut ctx.accounts.loan_config;
        cfg.admin = ctx.accounts.admin.key();
        cfg.custodian = custodian;
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

#[account]
pub struct LoanConfig {
    pub admin: Pubkey,
    pub custodian: Pubkey,
    pub bump: u8,
}

impl LoanConfig {
    pub const SIZE: usize = 8 + 32 + 32 + 1;
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
