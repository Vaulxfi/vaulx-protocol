use anchor_lang::prelude::*;
use mpl_bubblegum::{
    accounts::TreeConfig,
    instructions::{CreateTreeConfigCpiBuilder, MintV1CpiBuilder},
    types::{MetadataArgs, TokenProgramVersion, TokenStandard},
    utils::get_asset_id,
};

pub mod errors;
pub mod state;

use state::{
    Status, TRDCState, TrdcConfig, TREE_AUTHORITY_SEED, TREE_CAPACITY, TRDC_CONFIG_SEED,
};

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
        s.borrower = ctx.accounts.payer.key();
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

    /// Admin one-shot — initializes the singleton `TrdcConfig` PDA that pins
    /// the merkle tree `mint_trdc_cnft` is allowed to write into. The signer
    /// becomes the admin (and is the only identity that can ever rotate the
    /// merkle tree via a future ix). Initializing twice is impossible because
    /// Anchor's `init` constraint fails if the PDA is already in use. There
    /// is intentionally no rotation ix in this commit (SR-7: no admin
    /// override / backdoor mint paths).
    pub fn init_trdc_config(
        ctx: Context<InitTrdcConfig>,
        merkle_tree: Pubkey,
    ) -> Result<()> {
        let cfg = &mut ctx.accounts.trdc_config;
        cfg.admin = ctx.accounts.admin.key();
        cfg.merkle_tree = merkle_tree;
        cfg.bump = ctx.bumps.trdc_config;
        Ok(())
    }

    /// Task 4.2 — Bubblegum cNFT mint with all 8 security mitigations wired:
    ///
    /// * SR-1 tree-authority hijack: tree authority is the trdc-program PDA
    ///   `b"trdc_tree_authority"`. The PDA signs the CPI via `invoke_signed`.
    /// * SR-2 permissionless mint: the borrower must sign; the trdc_state
    ///   must be in `PendingCustody` and not yet minted.
    /// * SR-3 asset id: derived deterministically from `(merkle_tree,
    ///   num_minted)` BEFORE the CPI; written AFTER the CPI succeeds.
    /// * SR-4 account substitution: `merkle_tree` is locked to
    ///   `trdc_config.merkle_tree`; `tree_config` derived under bubblegum's
    ///   program id; bubblegum / compression / log_wrapper pinned by address.
    /// * SR-5 partial state on failure: writes only happen after CPI returns
    ///   Ok; Anchor rolls back on Err.
    /// * SR-6 metadata uri tamper: `name` encodes loan_id + appraisal hash
    ///   short-form; `uri` is a fixed pattern keyed off loan_id (Task 4.3
    ///   serves it from on-chain state, never URL params).
    /// * SR-7 no backdoor: there is exactly one mint path; no admin override.
    /// * SR-8 tree exhaustion: explicit `TreeFull` revert pre-CPI.
    pub fn mint_trdc_cnft(
        ctx: Context<MintTrdcCnft>,
        appraisal_hash: [u8; 32],
    ) -> Result<()> {
        // SR-2: signer-is-borrower
        require_keys_eq!(
            ctx.accounts.trdc_state.borrower,
            ctx.accounts.borrower.key(),
            crate::errors::TrdcError::BorrowerMismatch
        );
        // SR-2: FSM gate — `PendingCustody` is the awaiting-mint state.
        require!(
            ctx.accounts.trdc_state.status == Status::PendingCustody,
            crate::errors::TrdcError::LoanNotReady
        );
        // SR-2: idempotency — asset_id must still be default.
        require_keys_eq!(
            ctx.accounts.trdc_state.asset_id,
            Pubkey::default(),
            crate::errors::TrdcError::AlreadyMinted
        );

        // SR-3: read num_minted via Bubblegum's typed deserializer.
        let tree_config_acc = TreeConfig::try_from(
            &ctx.accounts.tree_config.to_account_info(),
        )
        .map_err(|_| error!(crate::errors::TrdcError::InvalidTreeConfig))?;
        let num_minted = tree_config_acc.num_minted;

        // SR-8: tree exhaustion guard.
        require!(
            num_minted < TREE_CAPACITY,
            crate::errors::TrdcError::TreeFull
        );

        // SR-3: pre-compute the asset id for the leaf this mint will occupy.
        let asset_id = get_asset_id(&ctx.accounts.merkle_tree.key(), num_minted);

        // SR-6: build metadata. Name encodes the loan_id short form + 8 hex
        // chars of the appraisal hash; symbol is fixed; uri is a deterministic
        // pattern indexed by loan_id (Task 4.3's API resolves it from
        // on-chain state, not URL params).
        let loan_id_bytes = ctx.accounts.trdc_state.loan_id.to_bytes();
        let loan_short = u32::from_le_bytes([
            loan_id_bytes[0],
            loan_id_bytes[1],
            loan_id_bytes[2],
            loan_id_bytes[3],
        ]);
        let mut hash_short = String::with_capacity(8);
        for b in &appraisal_hash[..4] {
            hash_short.push_str(&format!("{:02x}", b));
        }
        let name = format!("VTRDC-{:08x}-{}", loan_short, hash_short); // 22 chars
        let symbol = "VTRDC".to_string();
        let uri = format!(
            "https://vaulx.app/api/trdc/{}/metadata",
            ctx.accounts.trdc_state.loan_id
        );

        let metadata = MetadataArgs {
            name,
            symbol,
            uri,
            seller_fee_basis_points: 0,
            primary_sale_happened: false,
            is_mutable: false,
            edition_nonce: None,
            token_standard: Some(TokenStandard::NonFungible),
            collection: None,
            uses: None,
            token_program_version: TokenProgramVersion::Original,
            creators: vec![],
        };

        // SR-1: invoke_signed under the trdc-program tree-authority PDA.
        let bubblegum_program = ctx.accounts.bubblegum_program.to_account_info();
        let tree_config_info = ctx.accounts.tree_config.to_account_info();
        let merkle_tree_info = ctx.accounts.merkle_tree.to_account_info();
        let tree_authority_info = ctx.accounts.tree_authority.to_account_info();
        let leaf_owner_info = ctx.accounts.borrower.to_account_info();
        let payer_info = ctx.accounts.borrower.to_account_info();
        let log_wrapper = ctx.accounts.log_wrapper.to_account_info();
        let compression_program = ctx.accounts.compression_program.to_account_info();
        let system_program = ctx.accounts.system_program.to_account_info();

        let bump = ctx.bumps.tree_authority;
        let signer_seeds: &[&[u8]] = &[TREE_AUTHORITY_SEED, &[bump]];
        let signer_seeds_arr: &[&[&[u8]]] = &[signer_seeds];

        MintV1CpiBuilder::new(&bubblegum_program)
            .tree_config(&tree_config_info)
            .leaf_owner(&leaf_owner_info)
            .leaf_delegate(&leaf_owner_info)
            .merkle_tree(&merkle_tree_info)
            .payer(&payer_info)
            .tree_creator_or_delegate(&tree_authority_info)
            .log_wrapper(&log_wrapper)
            .compression_program(&compression_program)
            .system_program(&system_program)
            .metadata(metadata)
            .invoke_signed(signer_seeds_arr)?;

        // SR-5: state write only after CPI Ok.
        ctx.accounts.trdc_state.asset_id = asset_id;

        emit!(TrdcMinted {
            trdc_state: ctx.accounts.trdc_state.key(),
            loan_id: ctx.accounts.trdc_state.loan_id,
            asset_id,
            leaf_owner: ctx.accounts.borrower.key(),
            tree: ctx.accounts.merkle_tree.key(),
            num_minted,
            ts: Clock::get()?.unix_timestamp,
        });

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
pub struct InitTrdcConfig<'info> {
    #[account(
        init,
        payer = admin,
        space = TrdcConfig::SIZE,
        seeds = [TRDC_CONFIG_SEED],
        bump,
    )]
    pub trdc_config: Account<'info, TrdcConfig>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

/// Accounts for `mint_trdc_cnft`. Every CPI account that Bubblegum touches is
/// pinned by either an Anchor `address = ...` constraint or a derived seed
/// constraint — there is no slot a caller can substitute (SR-4).
#[derive(Accounts)]
pub struct MintTrdcCnft<'info> {
    #[account(mut)]
    pub trdc_state: Account<'info, TRDCState>,

    /// Borrower signs as the leaf owner / payer for the mint. Must match
    /// `trdc_state.borrower` (enforced in the ix body, SR-2).
    #[account(mut)]
    pub borrower: Signer<'info>,

    /// SR-4: pin the canonical merkle tree via the singleton TrdcConfig.
    #[account(
        seeds = [TRDC_CONFIG_SEED],
        bump = trdc_config.bump,
    )]
    pub trdc_config: Account<'info, TrdcConfig>,

    /// SR-4: must equal the merkle tree pubkey stored in `trdc_config`.
    /// CHECK: validated by spl-account-compression via Bubblegum CPI.
    #[account(
        mut,
        address = trdc_config.merkle_tree,
    )]
    pub merkle_tree: UncheckedAccount<'info>,

    /// Bubblegum's TreeConfig PDA — derived from `merkle_tree.key()` under
    /// the bubblegum program. Anchor enforces the derivation; we deserialize
    /// it inside the ix to read `num_minted`.
    /// CHECK: derivation enforced by `seeds` + `seeds::program`.
    #[account(
        mut,
        seeds = [merkle_tree.key().as_ref()],
        bump,
        seeds::program = mpl_bubblegum::ID,
    )]
    pub tree_config: UncheckedAccount<'info>,

    /// SR-1: trdc-program PDA that signs the CPI as `tree_creator_or_delegate`.
    /// CHECK: address derived from fixed seeds; not deserialized.
    #[account(
        seeds = [TREE_AUTHORITY_SEED],
        bump,
    )]
    pub tree_authority: UncheckedAccount<'info>,

    /// CHECK: spl-noop program ID, pinned by address.
    #[account(address = spl_noop::ID)]
    pub log_wrapper: UncheckedAccount<'info>,

    /// CHECK: spl-account-compression program ID, pinned by address.
    #[account(address = spl_account_compression::ID)]
    pub compression_program: UncheckedAccount<'info>,

    /// CHECK: mpl-bubblegum program ID, pinned by address.
    #[account(address = mpl_bubblegum::ID)]
    pub bubblegum_program: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
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

#[event]
pub struct TrdcMinted {
    pub trdc_state: Pubkey,
    pub loan_id: Pubkey,
    pub asset_id: Pubkey,
    pub leaf_owner: Pubkey,
    pub tree: Pubkey,
    pub num_minted: u64,
    pub ts: i64,
}

pub use errors::*;
pub use state::*;
