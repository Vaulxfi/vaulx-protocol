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
        s.asset_id = Pubkey::default();
        s.created_at = clock.unix_timestamp;
        s._reserved = [0u8; 64];
        Ok(())
    }

    pub fn test_transition(ctx: Context<TestTransition>, next: Status) -> Result<()> {
        ctx.accounts.trdc_state.transition(next)
    }

    pub fn mint_trdc_cnft(ctx: Context<MintTrdcCnft>, asset_hint: [u8; 32]) -> Result<()> {
        // PHASE_2_TODO: replace this stub with a real Bubblegum CPI (mpl-bubblegum
        // `mint_to_collection_v1`). Phase 1 does not need a real cNFT to ship
        // Moment 1 (lender deposit) — the LTV gate in loan.create_ccb_trdc is
        // tested against the initialize + stub-mint call path, which is logically
        // identical to the real path for the purposes of the LTV assertion.
        let s = &mut ctx.accounts.trdc_state;
        let combined = [s.loan_id.as_ref(), &asset_hint].concat();
        let hash = anchor_lang::solana_program::hash::hash(&combined);
        s.asset_id = Pubkey::new_from_array(hash.to_bytes());
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

#[derive(Accounts)]
pub struct TestTransition<'info> {
    #[account(mut)]
    pub trdc_state: Account<'info, TRDCState>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct MintTrdcCnft<'info> {
    #[account(mut)]
    pub trdc_state: Account<'info, TRDCState>,
    pub authority: Signer<'info>,
}

pub use errors::*;
pub use state::*;
