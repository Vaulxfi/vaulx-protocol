use anchor_lang::prelude::*;
use mpl_bubblegum::instructions::CreateTreeConfigCpiBuilder;

pub mod errors;
pub mod state;

use state::{Status, TRDCState, TREE_AUTHORITY_SEED};

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
        rate_bps: u64,
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
        s.doc_hash = [0u8; 32];
        s.principal_remaining = loan_amount;
        s.rate_bps = rate_bps;
        s._reserved = [0u8; 16];

        emit!(TrdcStateInitialized {
            trdc_state: s.key(),
            loan_id,
            appraisal_value,
            loan_amount,
            due_ts,
            rate_bps,
            ts: clock.unix_timestamp,
        });
        Ok(())
    }

    pub fn test_transition(ctx: Context<TestTransition>, next: Status) -> Result<()> {
        let from = ctx.accounts.trdc_state.status;
        ctx.accounts.trdc_state.transition(next)?;
        let to = ctx.accounts.trdc_state.status;
        emit!(TrdcTransitioned {
            trdc_state: ctx.accounts.trdc_state.key(),
            from,
            to,
            ts: Clock::get()?.unix_timestamp,
        });
        Ok(())
    }

    pub fn confirm_custody_transition(
        ctx: Context<ConfirmCustodyTransition>,
        doc_hash: [u8; 32],
    ) -> Result<()> {
        // PHASE_2_TASK_2_2_TODO: tighten to loan-program-only (CPI-only gate).
        let s = &mut ctx.accounts.trdc_state;
        require!(
            s.status == Status::PendingCustody,
            crate::errors::TrdcError::InvalidStateTransition
        );
        let from = s.status;
        s.doc_hash = doc_hash;
        s.transition(Status::ActiveInCustody)?;
        emit!(TrdcTransitioned {
            trdc_state: s.key(),
            from,
            to: s.status,
            ts: Clock::get()?.unix_timestamp,
        });
        Ok(())
    }

    pub fn transition_to_active(ctx: Context<TransitionToActive>) -> Result<()> {
        let s = &mut ctx.accounts.trdc_state;
        require!(
            s.status == Status::ActiveInCustody,
            crate::errors::TrdcError::InvalidStateTransition
        );
        let from = s.status;
        s.transition(Status::Active)?;
        emit!(TrdcTransitioned {
            trdc_state: s.key(),
            from,
            to: s.status,
            ts: Clock::get()?.unix_timestamp,
        });
        Ok(())
    }

    /// Decrement outstanding `principal_remaining` by `amount`. Intended to be
    /// called from the loan program as part of `pay_installment`. The loan
    /// program pre-checks `amount <= principal_remaining` to revert with
    /// `OverPayment`; the trdc program here just enforces saturating arithmetic.
    pub fn apply_installment(
        ctx: Context<TransitionAuth>,
        amount: u64,
    ) -> Result<()> {
        let s = &mut ctx.accounts.trdc_state;
        require!(
            s.status == Status::Active,
            crate::errors::TrdcError::InvalidStateTransition
        );
        s.principal_remaining = s
            .principal_remaining
            .checked_sub(amount)
            .ok_or(crate::errors::TrdcError::MathOverflow)?;
        Ok(())
    }

    /// Flip `Active -> Repaid` and zero `principal_remaining`. CPI-friendly
    /// from the loan program's `repay_ccb`.
    pub fn transition_active_to_repaid(
        ctx: Context<TransitionAuth>,
    ) -> Result<()> {
        let s = &mut ctx.accounts.trdc_state;
        require!(
            s.status == Status::Active,
            crate::errors::TrdcError::InvalidStateTransition
        );
        let from = s.status;
        s.principal_remaining = 0;
        s.transition(Status::Repaid)?;
        emit!(TrdcTransitioned {
            trdc_state: s.key(),
            from,
            to: s.status,
            ts: Clock::get()?.unix_timestamp,
        });
        Ok(())
    }

    /// Two-hop renewal transition: `Active -> Renewed -> Active`. Also updates
    /// `due_ts`, `rate_bps`, and resets `created_at` to the current clock —
    /// mutations the loan program can't perform directly because it doesn't
    /// own the trdc_state account. Emits a single `TrdcTransitioned
    /// { from: Active, to: Active }`; the loan program's `CcbRenewed` event
    /// carries the fee / rate breakdown.
    pub fn transition_renew(
        ctx: Context<TransitionAuth>,
        new_due_ts: i64,
        new_rate_bps: u64,
    ) -> Result<()> {
        let clock = Clock::get()?;
        let s = &mut ctx.accounts.trdc_state;
        require!(
            s.status == Status::Active,
            crate::errors::TrdcError::InvalidStateTransition
        );
        let from = s.status;
        s.transition(Status::Renewed)?;
        s.transition(Status::Active)?;
        s.due_ts = new_due_ts;
        s.rate_bps = new_rate_bps;
        s.created_at = clock.unix_timestamp;
        emit!(TrdcTransitioned {
            trdc_state: s.key(),
            from,
            to: s.status,
            ts: clock.unix_timestamp,
        });
        Ok(())
    }

    /// Moment 7 (pt 1) — `Active -> Overdue` when `now > due_ts + grace`.
    /// Permissionless caller-wise; the loan program is the only expected CPI
    /// source but trdc itself doesn't enforce that — the gating lives in the
    /// loan program's `execute_af_default` ix.
    pub fn transition_active_to_overdue(ctx: Context<TransitionAuth>) -> Result<()> {
        let s = &mut ctx.accounts.trdc_state;
        require!(
            s.status == Status::Active,
            crate::errors::TrdcError::InvalidStateTransition
        );
        let from = s.status;
        s.transition(Status::Overdue)?;
        emit!(TrdcTransitioned {
            trdc_state: s.key(),
            from,
            to: s.status,
            ts: Clock::get()?.unix_timestamp,
        });
        Ok(())
    }

    /// Moment 7 (pt 2) — `Overdue -> Defaulted`. Followed by an auction CPI in
    /// the loan program's `execute_af_default`.
    pub fn transition_overdue_to_defaulted(ctx: Context<TransitionAuth>) -> Result<()> {
        let s = &mut ctx.accounts.trdc_state;
        require!(
            s.status == Status::Overdue,
            crate::errors::TrdcError::InvalidStateTransition
        );
        let from = s.status;
        s.transition(Status::Defaulted)?;
        emit!(TrdcTransitioned {
            trdc_state: s.key(),
            from,
            to: s.status,
            ts: Clock::get()?.unix_timestamp,
        });
        Ok(())
    }

    /// Moment 7 (pt 3) — `Defaulted -> Liquidated`. Called from
    /// `auction::close_auction` regardless of whether the auction had bidders.
    pub fn transition_defaulted_to_liquidated(ctx: Context<TransitionAuth>) -> Result<()> {
        let s = &mut ctx.accounts.trdc_state;
        require!(
            s.status == Status::Defaulted,
            crate::errors::TrdcError::InvalidStateTransition
        );
        let from = s.status;
        s.transition(Status::Liquidated)?;
        emit!(TrdcTransitioned {
            trdc_state: s.key(),
            from,
            to: s.status,
            ts: Clock::get()?.unix_timestamp,
        });
        Ok(())
    }

    /// Task 4.1 — create the Bubblegum merkle tree with `tree_creator` set to
    /// the trdc-program PDA (`b"trdc_tree_authority"`). The PDA signs the
    /// `create_tree_config` CPI via `invoke_signed`, so even though the payer
    /// pays rent, the payer keypair is NOT the tree creator on-chain. This
    /// means no off-chain signer can mint into this tree — only this program
    /// can, via Task 4.2's `mint_trdc_cnft`.
    ///
    /// The merkle_tree account itself must be pre-allocated by the client
    /// (zero-initialized, owned by spl-account-compression). Bubblegum's
    /// `create_tree_config` then `init`s the `tree_authority` (TreeConfig PDA
    /// derived from `merkle_tree.key()`) and CPIs into spl-account-compression
    /// to write the empty merkle root.
    pub fn init_merkle_tree(
        ctx: Context<InitMerkleTree>,
        max_depth: u32,
        max_buffer_size: u32,
        public: bool,
    ) -> Result<()> {
        let bubblegum_program = ctx.accounts.bubblegum_program.to_account_info();
        let tree_config = ctx.accounts.tree_config.to_account_info();
        let merkle_tree = ctx.accounts.merkle_tree.to_account_info();
        let payer_info = ctx.accounts.payer.to_account_info();
        let tree_authority_info = ctx.accounts.tree_authority.to_account_info();
        let log_wrapper = ctx.accounts.log_wrapper.to_account_info();
        let compression_program = ctx.accounts.compression_program.to_account_info();
        let system_program = ctx.accounts.system_program.to_account_info();

        let bump = ctx.bumps.tree_authority;
        let signer_seeds: &[&[u8]] = &[TREE_AUTHORITY_SEED, &[bump]];
        let signer_seeds_arr: &[&[&[u8]]] = &[signer_seeds];

        CreateTreeConfigCpiBuilder::new(&bubblegum_program)
            .tree_config(&tree_config)
            .merkle_tree(&merkle_tree)
            .payer(&payer_info)
            .tree_creator(&tree_authority_info)
            .log_wrapper(&log_wrapper)
            .compression_program(&compression_program)
            .system_program(&system_program)
            .max_depth(max_depth)
            .max_buffer_size(max_buffer_size)
            .public(public)
            .invoke_signed(signer_seeds_arr)?;

        Ok(())
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

#[derive(Accounts)]
pub struct ConfirmCustodyTransition<'info> {
    #[account(mut)]
    pub trdc_state: Account<'info, TRDCState>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct TransitionToActive<'info> {
    #[account(mut)]
    pub trdc_state: Account<'info, TRDCState>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct TransitionAuth<'info> {
    #[account(mut)]
    pub trdc_state: Account<'info, TRDCState>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct InitMerkleTree<'info> {
    /// trdc-program PDA that becomes the Bubblegum `tree_creator` (and
    /// therefore `tree_delegate`). Signed via `invoke_signed`. There is no
    /// off-chain keypair that can sign as this account.
    /// CHECK: address derived from fixed seeds; not deserialized.
    #[account(
        seeds = [TREE_AUTHORITY_SEED],
        bump,
    )]
    pub tree_authority: UncheckedAccount<'info>,

    /// Bubblegum's `TreeConfig` PDA — Bubblegum init's this with seeds
    /// `[merkle_tree.key()]` under its own program ID. We pass it through
    /// unchecked; Bubblegum validates the derivation.
    /// CHECK: validated by mpl_bubblegum::create_tree_config.
    #[account(mut)]
    pub tree_config: UncheckedAccount<'info>,

    /// Pre-allocated, zero-initialized merkle tree account, owned by
    /// spl-account-compression. The TS script creates this account with the
    /// correct rent-exempt size in a separate ix in the same tx.
    /// CHECK: validated by spl-account-compression via Bubblegum CPI.
    #[account(mut)]
    pub merkle_tree: UncheckedAccount<'info>,

    /// Pays rent for `tree_config`. Does NOT become the tree creator.
    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: spl-noop program ID; checked by Bubblegum.
    pub log_wrapper: UncheckedAccount<'info>,

    /// CHECK: spl-account-compression program ID; checked by Bubblegum.
    pub compression_program: UncheckedAccount<'info>,

    /// CHECK: address-checked against mpl_bubblegum::ID.
    #[account(address = mpl_bubblegum::ID)]
    pub bubblegum_program: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[event]
pub struct TrdcStateInitialized {
    pub trdc_state: Pubkey,
    pub loan_id: Pubkey,
    pub appraisal_value: u64,
    pub loan_amount: u64,
    pub due_ts: i64,
    pub rate_bps: u64,
    pub ts: i64,
}

#[event]
pub struct TrdcTransitioned {
    pub trdc_state: Pubkey,
    pub from: Status,
    pub to: Status,
    pub ts: i64,
}

pub use errors::*;
pub use state::*;
