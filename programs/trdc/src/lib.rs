use anchor_lang::prelude::*;

pub mod errors;
pub mod state;

use state::{Status, TRDCState};

declare_id!("FcDPvRaixjAz7LeC64h9xkXPzvHT7dusbNmg83eJfr7R");

#[program]
pub mod trdc {
    use super::*;

    pub fn initialize_trdc_state(
        ctx: Context<InitializeTrdcState>,
        loan_id: Pubkey,
        appraisal_value: u64,
        loan_amount: u64,
        due_ts: i64,
    ) -> Result<()> {
        let clock = Clock::get()?;
        let s = &mut ctx.accounts.trdc_state;
        s.loan_id = loan_id;
        s.status = Status::PendingCustody;
        s.appraisal_value = appraisal_value;
        s.loan_amount = loan_amount;
        s.due_ts = due_ts;
        s.bump = ctx.bumps.trdc_state;
        s.created_at = clock.unix_timestamp;
        s._reserved = [0u8; 64];
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(loan_id: Pubkey)]
pub struct InitializeTrdcState<'info> {
    #[account(
        init,
        payer = payer,
        space = TRDCState::SIZE,
        seeds = [TRDCState::SEED, loan_id.as_ref()],
        bump,
    )]
    pub trdc_state: Account<'info, TRDCState>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub use errors::*;
pub use state::*;
