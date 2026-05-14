use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use auction::cpi::accounts::CreateAuction as AuctionCreateAuction;
use auction::program::Auction as AuctionProgram;
use trdc::cpi::accounts::{
    ConfirmCustodyTransition, InitializeTrdcState, TransitionAuth, TransitionToActive,
};
use trdc::program::Trdc;
use trdc::state::{Status, TRDCState};
use vault::cpi::accounts::{Disburse as VaultDisburse, RecordInflow as VaultRecordInflow};
use vault::program::Vault as VaultProgram;
use vault::state::Vault as VaultAccount;

pub mod attestation;
pub mod errors;
pub mod math;
pub mod state;
use attestation::KycAttestation;
use errors::{LoanError, GRACE_PERIOD_SECS, MAX_LTV_BPS};
use state::PriceFeed;

declare_id!("BCzcP4soWYSVWAt8gWPZmcNxcCiw8LdU8sT5VS3TPuW8");

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
        cfg.kyc_required = false;
        cfg.bump = ctx.bumps.loan_config;
        // V3 — set the explicit init flag so admin-gated ixs can reject a
        // closed+reinit-style attempt before doing any work.
        cfg.initialized = true;
        Ok(())
    }

    /// Admin-only: issue a KycAttestation PDA for `owner`. Caller must be
    /// `loan_config.admin`. Mirrors the vault-side issuance — the loan
    /// program owns its own attestation namespace so each program can
    /// enforce its gate without a cross-program account lookup.
    pub fn issue_kyc_attestation(
        ctx: Context<IssueKycAttestation>,
        owner: Pubkey,
        jwt_hash: [u8; 32],
    ) -> Result<()> {
        // V3 — defense-in-depth init-flag check.
        require!(
            ctx.accounts.loan_config.initialized,
            LoanError::ConfigNotInitialized
        );
        require_keys_eq!(
            ctx.accounts.admin.key(),
            ctx.accounts.loan_config.admin,
            LoanError::UnauthorizedAttestor
        );
        let att = &mut ctx.accounts.kyc_attestation;
        att.owner = owner;
        att.attestor = ctx.accounts.admin.key();
        att.attested_at = Clock::get()?.unix_timestamp;
        att.jwt_hash = jwt_hash;
        att.bump = ctx.bumps.kyc_attestation;
        Ok(())
    }

    /// Admin-only: flip `loan_config.kyc_required` between true and false.
    /// Gated on `signer == loan_config.admin`. Mirrors `vault::set_kyc_required`.
    pub fn set_kyc_required(ctx: Context<SetKycRequired>, required: bool) -> Result<()> {
        // V3 — defense-in-depth init-flag check.
        require!(
            ctx.accounts.loan_config.initialized,
            LoanError::ConfigNotInitialized
        );
        require_keys_eq!(
            ctx.accounts.admin.key(),
            ctx.accounts.loan_config.admin,
            LoanError::Unauthorized
        );
        ctx.accounts.loan_config.kyc_required = required;
        emit!(KycRequiredChanged {
            required,
            by: ctx.accounts.admin.key(),
        });
        Ok(())
    }

    /// Admin-only: close a `KycAttestation` PDA and refund rent to the admin.
    /// Mirrors `vault::close_kyc_attestation`. Required for revocation /
    /// re-issuance — PDA seeds are deterministic per owner, so the only way
    /// to re-issue with a fresh `jwt_hash` is to close the existing account
    /// first.
    pub fn close_kyc_attestation(
        ctx: Context<CloseKycAttestation>,
        _owner: Pubkey,
    ) -> Result<()> {
        // V3 — defense-in-depth init-flag check.
        require!(
            ctx.accounts.loan_config.initialized,
            LoanError::ConfigNotInitialized
        );
        require_keys_eq!(
            ctx.accounts.admin.key(),
            ctx.accounts.loan_config.admin,
            LoanError::Unauthorized
        );
        emit!(KycAttestationClosed {
            owner: ctx.accounts.kyc_attestation.owner,
            admin: ctx.accounts.admin.key(),
        });
        Ok(())
    }

    pub fn create_ccb_trdc(
        ctx: Context<CreateCcbTrdc>,
        loan_id: Pubkey,
        appraisal_value: u64,
        loan_amount: u64,
        due_ts: i64,
        rate_bps: u64,
        // Doubles as `ref_bytes` for the SR-2 price-feed binding. The IDL name
        // is preserved across releases; downstream callers should pass
        // sha256(watch_ref) here when the oracle is on, zeros otherwise.
        _asset_hint: [u8; 32],
    ) -> Result<()> {
        require!(loan_amount > 0 && appraisal_value > 0, LoanError::ZeroAmount);

        // Item 5 — RedStone-pattern oracle gate. When the oracle is
        // initialised, the LTV check uses the freshly-published on-chain
        // `PriceFeed` PDA (keyed on `_asset_hint`, i.e. ref_bytes) instead
        // of the synthetic `appraisal_value` arg. When the oracle is unset
        // (default state, used by every existing test), we keep the legacy
        // synthetic-appraisal path so the rollout is gated behind a single
        // admin ix.
        //
        // The consumed `appraisal_value` (passed through to TRDCState) is
        // taken from the on-chain feed when the oracle is on, so even
        // off-chain inputs cannot lie about the watch's current price.
        let effective_appraisal: u64 = if ctx.accounts.loan_config.oracle_admin
            != Pubkey::default()
        {
            // SR-2 — re-derive the canonical PriceFeed PDA from `_asset_hint`
            // (re-used as ref_bytes for forward-compat with a future
            // payload-signed RedStone push) and require equality with the
            // supplied account. Reject any other.
            let (expected_feed_pda, _bump) =
                PriceFeed::pda(&_asset_hint, &crate::ID);
            require_keys_eq!(
                ctx.accounts.price_feed.key(),
                expected_feed_pda,
                LoanError::InvalidOracle
            );
            // The feed must be a real PriceFeed account owned by this program.
            require_keys_eq!(
                *ctx.accounts.price_feed.owner,
                crate::ID,
                LoanError::PriceFeedNotInit
            );
            let feed_data = ctx.accounts.price_feed.try_borrow_data()?;
            let mut slice: &[u8] = &feed_data;
            let feed = PriceFeed::try_deserialize(&mut slice)
                .map_err(|_| error!(LoanError::PriceFeedNotInit))?;
            // SR-3 / SR-4 — defence-in-depth: the on-account `published_by`
            // must still match the current `oracle_admin`. Catches the case
            // where a leaked publisher key was rotated mid-flight.
            require_keys_eq!(
                feed.published_by,
                ctx.accounts.loan_config.oracle_admin,
                LoanError::InvalidOracle
            );
            // SR-1 — refuse stale feeds at consume-time (publishers are
            // expected to refresh once per minute).
            let now = Clock::get()?.unix_timestamp;
            require!(now >= feed.observed_at, LoanError::FuturePrice);
            require!(
                now.saturating_sub(feed.observed_at) <= PriceFeed::MAX_AGE_SECONDS,
                LoanError::StalePrice
            );
            // SR-5 — refuse low-confidence feeds at consume-time.
            require!(
                feed.listings >= PriceFeed::MIN_LISTINGS,
                LoanError::InsufficientListings
            );
            // SR-6 — feed price is in USD cents (10^-2); scale up to USDC
            // atoms (6dp) so the LTV check uses the same units as
            // `loan_amount`. cents -> USDC atoms = cents * 10^4.
            (feed.median_usd_cents as u128)
                .checked_mul(10_000u128)
                .and_then(|v| u64::try_from(v).ok())
                .ok_or(LoanError::MathOverflow)?
        } else {
            appraisal_value
        };

        // KYC gate — replaces the sunset Civic Pass check. When
        // `loan_config.kyc_required == true` the payer must present a valid
        // KycAttestation PDA (this program's PDA, owner == payer,
        // attestor == loan_config.admin). Default is gate OFF.
        if ctx.accounts.loan_config.kyc_required {
            let att_info = &ctx.accounts.kyc_attestation;
            require_keys_eq!(
                *att_info.owner,
                crate::ID,
                LoanError::NoKycAttestation
            );
            let data = att_info.try_borrow_data()?;
            let mut slice: &[u8] = &data;
            let att = KycAttestation::try_deserialize(&mut slice)
                .map_err(|_| error!(LoanError::NoKycAttestation))?;
            require_keys_eq!(
                att.owner,
                ctx.accounts.payer.key(),
                LoanError::NoKycAttestation
            );
            require_keys_eq!(
                att.attestor,
                ctx.accounts.loan_config.admin,
                LoanError::NoKycAttestation
            );
        }

        // LTV check: loan * 10_000 <= effective_appraisal * MAX_LTV_BPS
        let lhs = (loan_amount as u128)
            .checked_mul(10_000u128).ok_or(LoanError::MathOverflow)?;
        let rhs = (effective_appraisal as u128)
            .checked_mul(MAX_LTV_BPS as u128).ok_or(LoanError::MathOverflow)?;
        require!(lhs <= rhs, LoanError::LtvTooHigh);

        // SR-2 (price-feed binding) — persist ref_bytes on TRDCState when the
        // oracle is on so `disburse_from_vault` can re-derive the canonical
        // PriceFeed PDA at consume-time. Zero-out when the oracle is off so
        // downstream consumers can detect "no binding" and skip the check.
        let trdc_ref_bytes: [u8; 32] = if ctx.accounts.loan_config.oracle_admin
            != Pubkey::default()
        {
            _asset_hint
        } else {
            [0u8; 32]
        };

        trdc::cpi::initialize_trdc_state(
            CpiContext::new(ctx.accounts.trdc_program.to_account_info(), InitializeTrdcState {
                trdc_state: ctx.accounts.trdc_state.to_account_info(),
                payer: ctx.accounts.payer.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
            }),
            loan_id, effective_appraisal, loan_amount, due_ts, rate_bps, trdc_ref_bytes,
        )?;

        // Task 4.2 — the cNFT mint is now a separate ix on the trdc program.
        // It pulls in real Bubblegum / spl-account-compression accounts that
        // do not belong on the loan program's instruction surface, so the
        // borrower invokes `trdc::mint_trdc_cnft` in a follow-up tx.
        // `asset_hint` is preserved in the ix signature for IDL stability;
        // it is no longer consumed here.

        emit!(CcbTrdcCreated {
            trdc_state: ctx.accounts.trdc_state.key(),
            loan_id,
            appraisal_value: effective_appraisal,
            loan_amount,
            due_ts,
            rate_bps,
            ts: Clock::get()?.unix_timestamp,
        });
        Ok(())
    }

    /// Atomic gate-and-disburse — the load-bearing ix from Vaulxfi/program adopted
    /// here per the merge spec (§3 Area E DoD: "one transaction, both gate and
    /// disburse"). The custodian's signature flips PendingCustody → ActiveInCustody
    /// → Active, runs vault::disburse, and stamps `doc_hash` on TRDCState — all
    /// reverting together if any step fails. The borrower is intentionally absent
    /// from this tx; `borrower_ata.authority` is pinned to `trdc_state.borrower` at
    /// the accounts-struct level so the principal cannot be redirected.
    pub fn confirm_custody(
        ctx: Context<ConfirmCustody>,
        doc_hash: [u8; 32],
    ) -> Result<()> {
        require!(
            ctx.accounts.custodian.key() == ctx.accounts.loan_config.custodian,
            LoanError::UnauthorizedCustodian
        );

        // Step 1: PendingCustody → ActiveInCustody (writes doc_hash on TRDCState).
        // V1 — trdc requires the `loan_authority` PDA as signer; derive seeds
        // here so the inner CPI invoke_signed satisfies the trdc account
        // constraint (`seeds::program = LOAN_PROGRAM_ID`).
        let (expected_authority, auth_bump) =
            Pubkey::find_program_address(&[LOAN_AUTHORITY_SEED], &crate::ID);
        require_keys_eq!(
            ctx.accounts.loan_authority.key(),
            expected_authority,
            LoanError::UnauthorizedAdmin
        );
        let auth_seeds: &[&[u8]] = &[LOAN_AUTHORITY_SEED, &[auth_bump]];
        let auth_signer_seeds: &[&[&[u8]]] = &[auth_seeds];
        trdc::cpi::confirm_custody_transition(
            CpiContext::new_with_signer(
                ctx.accounts.trdc_program.to_account_info(),
                ConfirmCustodyTransition {
                    trdc_state: ctx.accounts.trdc_state.to_account_info(),
                    loan_authority: ctx.accounts.loan_authority.to_account_info(),
                },
                auth_signer_seeds,
            ),
            doc_hash,
        )?;

        // The CPI mutated trdc_state on chain; refresh our in-memory copy so the
        // helper's `status == ActiveInCustody` invariant reads the post-CPI state
        // (mirrors the existing `pay_installment` reload-after-CPI pattern).
        ctx.accounts.trdc_state.reload()?;

        // Steps 2 + 3: oracle re-check (if armed), vault::disburse, and
        // ActiveInCustody → Active. THE invariant lives in `do_atomic_disburse`.
        let amount = ctx.accounts.trdc_state.loan_amount;
        do_atomic_disburse(
            &ctx.accounts.trdc_state,
            &ctx.accounts.loan_config,
            &ctx.accounts.vault.to_account_info(),
            &ctx.accounts.asset_mint.to_account_info(),
            &ctx.accounts.vault_ata.to_account_info(),
            &ctx.accounts.borrower_ata.to_account_info(),
            &ctx.accounts.loan_authority.to_account_info(),
            &ctx.accounts.vault_program.to_account_info(),
            &ctx.accounts.trdc_program.to_account_info(),
            &ctx.accounts.token_program.to_account_info(),
            &ctx.accounts.instructions_sysvar.to_account_info(),
            &ctx.accounts.price_feed.to_account_info(),
            amount,
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

        // Standalone path — kept for the negative test (calling disburse before
        // confirm_custody must fail) and the cross-program-gate test
        // (vault::disburse top-level rejection). On the happy path this is now
        // unreachable because `confirm_custody` performs the atomic disburse in
        // the same tx.
        do_atomic_disburse(
            &ctx.accounts.trdc_state,
            &ctx.accounts.loan_config,
            &ctx.accounts.vault.to_account_info(),
            &ctx.accounts.asset_mint.to_account_info(),
            &ctx.accounts.vault_ata.to_account_info(),
            &ctx.accounts.borrower_ata.to_account_info(),
            &ctx.accounts.loan_authority.to_account_info(),
            &ctx.accounts.vault_program.to_account_info(),
            &ctx.accounts.trdc_program.to_account_info(),
            &ctx.accounts.token_program.to_account_info(),
            &ctx.accounts.instructions_sysvar.to_account_info(),
            &ctx.accounts.price_feed.to_account_info(),
            amount,
        )?;

        emit!(DisburseRequested {
            trdc_state: ctx.accounts.trdc_state.key(),
            borrower: ctx.accounts.borrower.key(),
            amount,
            ts: Clock::get()?.unix_timestamp,
        });
        Ok(())
    }

    /// Moment 5 (partial) — borrower pays down principal in installments.
    /// Does NOT transition the TRDC state — the loan stays `Active` until
    /// `repay_ccb` zeroes out the remainder.
    pub fn pay_installment(ctx: Context<RepaymentOp>, amount: u64) -> Result<()> {
        require!(amount > 0, LoanError::ZeroAmount);
        require!(
            ctx.accounts.trdc_state.status == Status::Active,
            trdc::errors::TrdcError::InvalidStateTransition
        );
        require!(
            amount <= ctx.accounts.trdc_state.principal_remaining,
            LoanError::OverPayment
        );

        // Borrower -> vault_ata USDC transfer. Borrower is the SPL authority,
        // no PDA signing needed.
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.borrower_ata.to_account_info(),
                    to: ctx.accounts.vault_ata.to_account_info(),
                    authority: ctx.accounts.borrower.to_account_info(),
                },
            ),
            amount,
        )?;

        // Decrement principal via CPI — the loan program doesn't own the
        // trdc_state account and so cannot serialize writes to it directly.
        // V1 — trdc gates on the `loan_authority` PDA; derive signer seeds.
        let (expected_authority, auth_bump) =
            Pubkey::find_program_address(&[LOAN_AUTHORITY_SEED], &crate::ID);
        require_keys_eq!(
            ctx.accounts.loan_authority.key(),
            expected_authority,
            LoanError::UnauthorizedAdmin
        );
        let auth_seeds: &[&[u8]] = &[LOAN_AUTHORITY_SEED, &[auth_bump]];
        let auth_signer_seeds: &[&[&[u8]]] = &[auth_seeds];
        trdc::cpi::apply_installment(
            CpiContext::new_with_signer(
                ctx.accounts.trdc_program.to_account_info(),
                TransitionAuth {
                    trdc_state: ctx.accounts.trdc_state.to_account_info(),
                    loan_authority: ctx.accounts.loan_authority.to_account_info(),
                },
                auth_signer_seeds,
            ),
            amount,
        )?;
        ctx.accounts.trdc_state.reload()?;
        let principal_remaining_after = ctx.accounts.trdc_state.principal_remaining;

        record_vault_inflow(&ctx, amount)?;

        emit!(InstallmentPaid {
            trdc_state: ctx.accounts.trdc_state.key(),
            borrower: ctx.accounts.borrower.key(),
            amount,
            principal_remaining_after,
            ts: Clock::get()?.unix_timestamp,
        });
        Ok(())
    }

    /// Moment 5 (full) — borrower pays the current payoff and the TRDC flips
    /// to `Repaid`. Accrued interest is computed on-chain against the stored
    /// `rate_bps` and `created_at`. No amount param — the program computes.
    pub fn repay_ccb(ctx: Context<RepaymentOp>) -> Result<()> {
        require!(
            ctx.accounts.trdc_state.status == Status::Active,
            trdc::errors::TrdcError::InvalidStateTransition
        );

        let now = Clock::get()?.unix_timestamp;
        let trdc = &ctx.accounts.trdc_state;
        let principal_paid = trdc.principal_remaining;
        let payoff_amount = math::compute_payoff(
            principal_paid,
            trdc.rate_bps,
            trdc.created_at,
            now,
        )?;
        let interest_paid = payoff_amount
            .checked_sub(principal_paid)
            .ok_or(LoanError::MathOverflow)?;

        // Transfer payoff borrower -> vault_ata.
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.borrower_ata.to_account_info(),
                    to: ctx.accounts.vault_ata.to_account_info(),
                    authority: ctx.accounts.borrower.to_account_info(),
                },
            ),
            payoff_amount,
        )?;

        // Flip Active -> Repaid via CPI. Anchor reloads the trdc_state buffer
        // after the CPI, so any outer mutation done BEFORE this would be
        // clobbered. We mutate `principal_remaining` AFTER the CPI to avoid
        // that foot-gun.
        // V1 — trdc gates on the `loan_authority` PDA; derive signer seeds.
        let (expected_authority, auth_bump) =
            Pubkey::find_program_address(&[LOAN_AUTHORITY_SEED], &crate::ID);
        require_keys_eq!(
            ctx.accounts.loan_authority.key(),
            expected_authority,
            LoanError::UnauthorizedAdmin
        );
        let auth_seeds: &[&[u8]] = &[LOAN_AUTHORITY_SEED, &[auth_bump]];
        let auth_signer_seeds: &[&[&[u8]]] = &[auth_seeds];
        trdc::cpi::transition_active_to_repaid(CpiContext::new_with_signer(
            ctx.accounts.trdc_program.to_account_info(),
            TransitionAuth {
                trdc_state: ctx.accounts.trdc_state.to_account_info(),
                loan_authority: ctx.accounts.loan_authority.to_account_info(),
            },
            auth_signer_seeds,
        ))?;

        // Vault accounting: full payoff (principal + interest) flows back in.
        record_vault_inflow(&ctx, payoff_amount)?;

        emit!(CcbRepaid {
            trdc_state: ctx.accounts.trdc_state.key(),
            borrower: ctx.accounts.borrower.key(),
            payoff_amount,
            principal_paid,
            interest_paid,
            ts: now,
        });
        Ok(())
    }

    /// Moment 6 — borrower pays accrued interest + 2% renewal fee, the term
    /// extends to `new_due_ts`, the rate flips to `new_rate_bps`, and the
    /// interest clock resets.
    pub fn renew_ccb(
        ctx: Context<RepaymentOp>,
        _new_term_days: u64,
        new_due_ts: i64,
        new_rate_bps: u64,
    ) -> Result<()> {
        require!(
            ctx.accounts.trdc_state.status == Status::Active,
            trdc::errors::TrdcError::InvalidStateTransition
        );

        let now = Clock::get()?.unix_timestamp;
        let trdc = &ctx.accounts.trdc_state;
        let principal = trdc.principal_remaining;

        let days_elapsed = if now > trdc.created_at {
            ((now - trdc.created_at) / math::SECONDS_PER_DAY) as u64
        } else {
            0
        };
        let accrued_paid =
            math::compute_interest_accrued(principal, trdc.rate_bps, days_elapsed)?;
        let fee_paid = math::compute_renewal_fee(principal)?;
        let total = accrued_paid
            .checked_add(fee_paid)
            .ok_or(LoanError::MathOverflow)?;

        if total > 0 {
            token::transfer(
                CpiContext::new(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.borrower_ata.to_account_info(),
                        to: ctx.accounts.vault_ata.to_account_info(),
                        authority: ctx.accounts.borrower.to_account_info(),
                    },
                ),
                total,
            )?;
        }

        // Active -> Renewed -> Active + set new due_ts/rate_bps/created_at
        // via trdc CPI. The loan program doesn't own the trdc_state account
        // and so cannot write to it directly.
        // V1 — trdc gates on the `loan_authority` PDA; derive signer seeds.
        let (expected_authority, auth_bump) =
            Pubkey::find_program_address(&[LOAN_AUTHORITY_SEED], &crate::ID);
        require_keys_eq!(
            ctx.accounts.loan_authority.key(),
            expected_authority,
            LoanError::UnauthorizedAdmin
        );
        let auth_seeds: &[&[u8]] = &[LOAN_AUTHORITY_SEED, &[auth_bump]];
        let auth_signer_seeds: &[&[&[u8]]] = &[auth_seeds];
        trdc::cpi::transition_renew(
            CpiContext::new_with_signer(
                ctx.accounts.trdc_program.to_account_info(),
                TransitionAuth {
                    trdc_state: ctx.accounts.trdc_state.to_account_info(),
                    loan_authority: ctx.accounts.loan_authority.to_account_info(),
                },
                auth_signer_seeds,
            ),
            new_due_ts,
            new_rate_bps,
        )?;

        // Vault accounting: accrued + fee are lender yield.
        if total > 0 {
            record_vault_inflow(&ctx, total)?;
        }

        emit!(CcbRenewed {
            trdc_state: ctx.accounts.trdc_state.key(),
            borrower: ctx.accounts.borrower.key(),
            new_due_ts,
            new_rate_bps,
            accrued_paid,
            fee_paid,
            ts: now,
        });
        Ok(())
    }

    /// Moment 7 — permissionless default trigger. Anyone can call after
    /// `due_ts + GRACE_PERIOD_SECS`. Drives TRDC through `Active -> Overdue
    /// -> Defaulted` (via trdc CPIs) and spawns an auction at reserve =
    /// `principal_remaining + accrued_interest` via an auction CPI using the
    /// loan_authority PDA as the invoke_signed signer.
    pub fn execute_af_default(
        ctx: Context<ExecuteAfDefault>,
        duration_secs: i64,
    ) -> Result<()> {
        require!(duration_secs > 0, LoanError::ZeroAmount);

        let now = Clock::get()?.unix_timestamp;
        let trdc = &ctx.accounts.trdc_state;

        // Loan can be triggered from Active or Overdue; if still Active, the
        // caller must be past the grace window. From Overdue we skip the
        // grace check (already crossed it to be in Overdue).
        let (needs_active_to_overdue, needs_grace_check) = match trdc.status {
            Status::Active => (true, true),
            Status::Overdue => (false, false),
            _ => return err!(trdc::errors::TrdcError::InvalidStateTransition),
        };

        if needs_grace_check {
            let grace_deadline = trdc
                .due_ts
                .checked_add(GRACE_PERIOD_SECS)
                .ok_or(LoanError::MathOverflow)?;
            require!(now > grace_deadline, LoanError::NotYetDefaulted);
        }

        let principal = trdc.principal_remaining;
        let rate_bps = trdc.rate_bps;
        let created_at = trdc.created_at;
        let reserve_price = math::compute_payoff(principal, rate_bps, created_at, now)?;

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

        if needs_active_to_overdue {
            trdc::cpi::transition_active_to_overdue(CpiContext::new_with_signer(
                ctx.accounts.trdc_program.to_account_info(),
                TransitionAuth {
                    trdc_state: ctx.accounts.trdc_state.to_account_info(),
                    loan_authority: ctx.accounts.loan_authority.to_account_info(),
                },
                signer_seeds,
            ))?;
            ctx.accounts.trdc_state.reload()?;
        }

        trdc::cpi::transition_overdue_to_defaulted(CpiContext::new_with_signer(
            ctx.accounts.trdc_program.to_account_info(),
            TransitionAuth {
                trdc_state: ctx.accounts.trdc_state.to_account_info(),
                loan_authority: ctx.accounts.loan_authority.to_account_info(),
            },
            signer_seeds,
        ))?;

        auction::cpi::create_auction(
            CpiContext::new_with_signer(
                ctx.accounts.auction_program.to_account_info(),
                AuctionCreateAuction {
                    auction: ctx.accounts.auction.to_account_info(),
                    trdc_state: ctx.accounts.trdc_state.to_account_info(),
                    asset_mint: ctx.accounts.asset_mint.to_account_info(),
                    escrow_ata: ctx.accounts.escrow_ata.to_account_info(),
                    vault: ctx.accounts.vault.to_account_info(),
                    auction_authority: ctx.accounts.loan_authority.to_account_info(),
                    instructions_sysvar: ctx.accounts.instructions_sysvar.to_account_info(),
                    payer: ctx.accounts.payer.to_account_info(),
                    token_program: ctx.accounts.token_program.to_account_info(),
                    associated_token_program: ctx
                        .accounts
                        .associated_token_program
                        .to_account_info(),
                    system_program: ctx.accounts.system_program.to_account_info(),
                    rent: ctx.accounts.rent.to_account_info(),
                },
                signer_seeds,
            ),
            reserve_price,
            duration_secs,
        )?;

        emit!(AfDefaultExecuted {
            trdc_state: ctx.accounts.trdc_state.key(),
            reserve_price,
            grace_period_secs: GRACE_PERIOD_SECS,
            ts: now,
        });
        Ok(())
    }

    // ------------------------------------------------------------------
    // RedStone-pattern oracle (Item 5).
    //
    // SR mapping (auditor checklist):
    //   SR-1 freshness:     `now - observed_at <= MAX_AGE_SECONDS`     (publish_price)
    //                       `now - feed.observed_at <= MAX_AGE_SECONDS`(create_ccb_trdc, disburse_from_vault)
    //   SR-2 wrong feed:    PDA seeds `[b"price_feed", ref_bytes]`      (PublishPrice / CreateCcbTrdc account constraints)
    //   SR-3 attestation:   `oracle_admin == signer` + `published_by`   (publish_price + Anchor account constraint)
    //                       (single Vaulx signer in this fallback; see state.rs note for SDK story)
    //   SR-4 publisher key: `LoanConfig.oracle_admin` set by admin only  (set_oracle_admin)
    //   SR-5 data quality:  `listings >= MIN_LISTINGS (3)`               (publish_price)
    //   SR-6 decimals:      cents (10^-2) hardcoded in `median_usd_cents`(state.rs comment + lib.rs LTV math)
    // ------------------------------------------------------------------

    /// Admin-only ix: set (or rotate) the pubkey allowed to publish price
    /// feeds. Defaults to `Pubkey::default()` (oracle inert). Rotation is
    /// allowed because operationally we expect the publisher key to be
    /// rotated via Squads multisig, not by program upgrade; admin can also
    /// reset to `Pubkey::default()` to disable the oracle in an emergency
    /// (e.g. compromised publisher key, before a fresh keypair is provisioned).
    ///
    /// One-shot migration ix for upgrades coming from a pre-`oracle_admin`
    /// LoanConfig layout (account data length 106 bytes; new layout is 138).
    /// Reallocs the account to the new size, zero-fills the trailing bytes,
    /// and pays the rent delta from `admin`. No-op when the account is
    /// already at the new size. Admin-gated to prevent any other caller from
    /// reallocating the program's config account. The admin pubkey lives at
    /// the same offset in both layouts (offset 8, immediately after the
    /// Anchor discriminator) so the byte read here is layout-stable.
    pub fn migrate_loan_config_v2(ctx: Context<MigrateLoanConfigV2>) -> Result<()> {
        let cfg = &ctx.accounts.loan_config;
        let info = cfg.to_account_info();
        let new_size = LoanConfig::SIZE;
        let cur_size = info.data_len();
        if cur_size >= new_size {
            return Ok(());
        }
        // Top up rent to cover the larger account.
        let rent = Rent::get()?;
        let new_rent = rent.minimum_balance(new_size);
        let cur_lamports = info.lamports();
        if new_rent > cur_lamports {
            let topup = new_rent - cur_lamports;
            anchor_lang::system_program::transfer(
                CpiContext::new(
                    ctx.accounts.system_program.to_account_info(),
                    anchor_lang::system_program::Transfer {
                        from: ctx.accounts.admin.to_account_info(),
                        to: info.clone(),
                    },
                ),
                topup,
            )?;
        }
        info.realloc(new_size, true)?;
        Ok(())
    }

    /// V3 — one-shot migration ix for upgrades coming from a pre-`initialized`
    /// LoanConfig layout (138 bytes; new layout is 139). Reallocs the account
    /// to the new size, writes `initialized = true` at the new byte offset,
    /// pays the rent delta from `admin`. Idempotent: a no-op when the account
    /// is already at the new size AND `initialized = true`. Admin-gated via
    /// the admin-pubkey-at-offset-8 constraint (stable across both layouts).
    pub fn migrate_loan_config_v3(ctx: Context<MigrateLoanConfigV3>) -> Result<()> {
        let cfg = &ctx.accounts.loan_config;
        let info = cfg.to_account_info();
        let new_size = LoanConfig::SIZE;
        let cur_size = info.data_len();
        if cur_size < new_size {
            // Top up rent to cover the larger account.
            let rent = Rent::get()?;
            let new_rent = rent.minimum_balance(new_size);
            let cur_lamports = info.lamports();
            if new_rent > cur_lamports {
                let topup = new_rent - cur_lamports;
                anchor_lang::system_program::transfer(
                    CpiContext::new(
                        ctx.accounts.system_program.to_account_info(),
                        anchor_lang::system_program::Transfer {
                            from: ctx.accounts.admin.to_account_info(),
                            to: info.clone(),
                        },
                    ),
                    topup,
                )?;
            }
            info.realloc(new_size, true)?;
        }
        // Write `initialized = true` at offset (new_size - 1). Idempotent:
        // re-running this ix on a row already at `1` re-writes `1`.
        {
            let mut data = info.try_borrow_mut_data()?;
            data[new_size - 1] = 1u8;
        }
        Ok(())
    }

    pub fn set_oracle_admin(
        ctx: Context<SetOracleAdmin>,
        new_oracle_admin: Pubkey,
    ) -> Result<()> {
        // V3 — defense-in-depth init-flag check.
        require!(
            ctx.accounts.loan_config.initialized,
            LoanError::ConfigNotInitialized
        );
        require_keys_eq!(
            ctx.accounts.admin.key(),
            ctx.accounts.loan_config.admin,
            LoanError::UnauthorizedAdmin
        );
        ctx.accounts.loan_config.oracle_admin = new_oracle_admin;
        emit!(OracleAdminSet {
            oracle_admin: new_oracle_admin,
            ts: Clock::get()?.unix_timestamp,
        });
        Ok(())
    }

    /// RedStone-pattern price update. Initialises (or overwrites) the
    /// `PriceFeed` PDA at `[b"price_feed", ref_bytes]`. Signer must equal
    /// `LoanConfig.oracle_admin`.
    pub fn publish_price(
        ctx: Context<PublishPrice>,
        ref_bytes: [u8; 32],
        median_usd_cents: u64,
        listings: u32,
        observed_at: i64,
    ) -> Result<()> {
        let cfg = &ctx.accounts.loan_config;

        // SR-3 / SR-4 — only the configured `oracle_admin` can publish.
        require!(
            cfg.oracle_admin != Pubkey::default(),
            LoanError::OracleNotInitialized
        );
        require_keys_eq!(
            ctx.accounts.oracle_admin.key(),
            cfg.oracle_admin,
            LoanError::InvalidOracle
        );

        let now = Clock::get()?.unix_timestamp;

        // SR-1 — refuse future-dated and stale-on-publish observations.
        require!(observed_at <= now, LoanError::FuturePrice);
        require!(
            now.saturating_sub(observed_at) <= PriceFeed::MAX_AGE_SECONDS,
            LoanError::StalePrice
        );

        // SR-5 — minimum data quality.
        require!(
            listings >= PriceFeed::MIN_LISTINGS,
            LoanError::InsufficientListings
        );

        // Defensive: zero price would price-collapse the LTV check.
        require!(median_usd_cents > 0, LoanError::ZeroAmount);

        let feed = &mut ctx.accounts.price_feed;
        feed.ref_bytes = ref_bytes;
        feed.median_usd_cents = median_usd_cents;
        feed.listings = listings;
        feed.observed_at = observed_at;
        feed.published_by = cfg.oracle_admin;
        feed.bump = ctx.bumps.price_feed;

        emit!(PricePublished {
            ref_bytes,
            median_usd_cents,
            listings,
            observed_at,
            ts: now,
        });
        Ok(())
    }
}

/// CPI helper — calls `vault::record_inflow` with the loan_authority PDA as
/// the (invoke_signed) signer. Shared by `pay_installment`, `repay_ccb`,
/// `renew_ccb` so the vault's `total_assets` stays coherent with the
/// underlying `vault_ata` balance.
fn record_vault_inflow(ctx: &Context<RepaymentOp>, amount: u64) -> Result<()> {
    if amount == 0 {
        return Ok(());
    }
    let (expected_authority, bump) =
        Pubkey::find_program_address(&[LOAN_AUTHORITY_SEED], &crate::ID);
    require_keys_eq!(
        ctx.accounts.loan_authority.key(),
        expected_authority,
        LoanError::UnauthorizedAdmin
    );
    let seeds: &[&[u8]] = &[LOAN_AUTHORITY_SEED, &[bump]];
    let signer_seeds: &[&[&[u8]]] = &[seeds];
    vault::cpi::record_inflow(
        CpiContext::new_with_signer(
            ctx.accounts.vault_program.to_account_info(),
            VaultRecordInflow {
                vault: ctx.accounts.vault.to_account_info(),
                asset_mint: ctx.accounts.asset_mint.to_account_info(),
                loan_authority: ctx.accounts.loan_authority.to_account_info(),
                instructions_sysvar: ctx.accounts.instructions_sysvar.to_account_info(),
            },
            signer_seeds,
        ),
        amount,
    )
}

/// THE invariant of the atomic confirm-and-disburse pattern (ported from
/// Vaulxfi/program). Called by both `confirm_custody` (atomic, signed by the
/// custodian) and `disburse_from_vault` (standalone, signed by the borrower —
/// kept as the negative-test target for the custody gate). Putting the
/// invariant in a single helper means there is exactly ONE place where
/// "principal moves out of the vault" is gated:
///   * `trdc_state.status == ActiveInCustody`
///   * oracle freshness + LTV (when the RedStone-pattern oracle is armed)
///   * `loan_authority` PDA derivation matches this program
/// Both paths terminate in `vault::disburse` + `trdc::transition_to_active`.
fn do_atomic_disburse<'info>(
    trdc_state: &Account<'info, TRDCState>,
    loan_config: &Account<'info, LoanConfig>,
    vault: &AccountInfo<'info>,
    asset_mint: &AccountInfo<'info>,
    vault_ata: &AccountInfo<'info>,
    borrower_ata: &AccountInfo<'info>,
    loan_authority: &AccountInfo<'info>,
    vault_program: &AccountInfo<'info>,
    trdc_program: &AccountInfo<'info>,
    token_program: &AccountInfo<'info>,
    instructions_sysvar: &AccountInfo<'info>,
    price_feed: &AccountInfo<'info>,
    amount: u64,
) -> Result<()> {
    // THE invariant — checked once, in one place.
    require!(
        trdc_state.status == Status::ActiveInCustody,
        trdc::errors::TrdcError::InvalidStateTransition
    );

    // Oracle re-check — preserved from the original disburse_from_vault. The
    // atomic path collapses the create→confirm→disburse window into
    // create→confirm, but a fresh feed at confirm time still adds value
    // (price can move between origination and the custodian signing).
    if loan_config.oracle_admin != Pubkey::default() {
        require!(
            trdc_state.ref_bytes != [0u8; 32],
            LoanError::PriceFeedNotInit
        );
        let (expected_feed_pda, _bump) =
            PriceFeed::pda(&trdc_state.ref_bytes, &crate::ID);
        require_keys_eq!(
            price_feed.key(),
            expected_feed_pda,
            LoanError::InvalidOracle
        );
        require_keys_eq!(
            *price_feed.owner,
            crate::ID,
            LoanError::PriceFeedNotInit
        );
        let feed_data = price_feed.try_borrow_data()?;
        let mut slice: &[u8] = &feed_data;
        let feed = PriceFeed::try_deserialize(&mut slice)
            .map_err(|_| error!(LoanError::PriceFeedNotInit))?;
        require_keys_eq!(
            feed.published_by,
            loan_config.oracle_admin,
            LoanError::InvalidOracle
        );
        let now = Clock::get()?.unix_timestamp;
        require!(now >= feed.observed_at, LoanError::FuturePrice);
        require!(
            now.saturating_sub(feed.observed_at) <= PriceFeed::MAX_AGE_SECONDS,
            LoanError::StalePrice
        );
        require!(
            feed.listings >= PriceFeed::MIN_LISTINGS,
            LoanError::InsufficientListings
        );
        let live_appraisal = (feed.median_usd_cents as u128)
            .checked_mul(10_000u128)
            .and_then(|v| u64::try_from(v).ok())
            .ok_or(LoanError::MathOverflow)?;
        let lhs = (trdc_state.loan_amount as u128)
            .checked_mul(10_000u128)
            .ok_or(LoanError::MathOverflow)?;
        let rhs = (live_appraisal as u128)
            .checked_mul(MAX_LTV_BPS as u128)
            .ok_or(LoanError::MathOverflow)?;
        require!(lhs <= rhs, LoanError::LtvTooHigh);
    }

    // Derive loan_authority signer seeds.
    let (expected_authority, bump) =
        Pubkey::find_program_address(&[LOAN_AUTHORITY_SEED], &crate::ID);
    require_keys_eq!(
        loan_authority.key(),
        expected_authority,
        LoanError::UnauthorizedAdmin
    );
    let seeds: &[&[u8]] = &[LOAN_AUTHORITY_SEED, &[bump]];
    let signer_seeds: &[&[&[u8]]] = &[seeds];

    // 1) vault::disburse — moves USDC vault_ata → borrower_ata under the
    //    loan_authority PDA. vault::disburse runs the two-layer gate
    //    (PDA + instructions sysvar top-level program check).
    vault::cpi::disburse(
        CpiContext::new_with_signer(
            vault_program.clone(),
            VaultDisburse {
                vault: vault.clone(),
                asset_mint: asset_mint.clone(),
                vault_ata: vault_ata.clone(),
                borrower_ata: borrower_ata.clone(),
                loan_authority: loan_authority.clone(),
                token_program: token_program.clone(),
                instructions_sysvar: instructions_sysvar.clone(),
            },
            signer_seeds,
        ),
        amount,
    )?;

    // 2) trdc::transition_to_active — ActiveInCustody → Active. trdc owns the
    //    trdc_state account; this CPI is the only legitimate writer.
    // V1 — trdc gates on the `loan_authority` PDA. We've already validated
    // `loan_authority.key() == expected_authority` above; re-use the same
    // signer_seeds.
    trdc::cpi::transition_to_active(CpiContext::new_with_signer(
        trdc_program.clone(),
        TransitionToActive {
            trdc_state: trdc_state.to_account_info(),
            loan_authority: loan_authority.clone(),
        },
        signer_seeds,
    ))?;

    Ok(())
}

#[event]
pub struct CcbTrdcCreated {
    pub trdc_state: Pubkey,
    pub loan_id: Pubkey,
    pub appraisal_value: u64,
    pub loan_amount: u64,
    pub due_ts: i64,
    pub rate_bps: u64,
    pub ts: i64,
}

#[event]
pub struct InstallmentPaid {
    pub trdc_state: Pubkey,
    pub borrower: Pubkey,
    pub amount: u64,
    pub principal_remaining_after: u64,
    pub ts: i64,
}

#[event]
pub struct CcbRepaid {
    pub trdc_state: Pubkey,
    pub borrower: Pubkey,
    pub payoff_amount: u64,
    pub principal_paid: u64,
    pub interest_paid: u64,
    pub ts: i64,
}

#[event]
pub struct CcbRenewed {
    pub trdc_state: Pubkey,
    pub borrower: Pubkey,
    pub new_due_ts: i64,
    pub new_rate_bps: u64,
    pub accrued_paid: u64,
    pub fee_paid: u64,
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

#[event]
pub struct AfDefaultExecuted {
    pub trdc_state: Pubkey,
    pub reserve_price: u64,
    pub grace_period_secs: i64,
    pub ts: i64,
}

#[account]
pub struct LoanConfig {
    pub admin: Pubkey,
    pub custodian: Pubkey,
    /// Legacy field — gatekeeper network pubkey from the Civic Pass era.
    /// Retained for IDL stability; no longer consulted at create_ccb_trdc.
    /// The new gate is keyed off `kyc_required` + the KycAttestation PDA.
    pub civic_network: Pubkey,
    /// When true, `create_ccb_trdc` requires a valid KycAttestation PDA.
    /// Default false (gate OFF) to preserve existing test behaviour.
    pub kyc_required: bool,
    pub bump: u8,
    /// Pubkey allowed to publish RedStone-pattern price updates via
    /// `publish_price`. `Pubkey::default()` means the oracle has not been
    /// set up — `create_ccb_trdc` falls back to the legacy synthetic
    /// appraisal path. Once set (via `set_oracle_admin`), every loan opening
    /// enforces a fresh on-chain feed. SR-3 / SR-4.
    pub oracle_admin: Pubkey,
    /// V3 — explicit initialization flag. Set to `true` by
    /// `initialize_loan_config`. Checked at the top of every admin-gated
    /// instruction as defense-in-depth against a future close+reinit attack.
    pub initialized: bool,
}

impl LoanConfig {
    // disc(8) + admin(32) + custodian(32) + civic_network(32)
    //   + kyc_required(1) + bump(1) + oracle_admin(32) + initialized(1) = 139
    pub const SIZE: usize = 8 + 32 + 32 + 32 + 1 + 1 + 32 + 1;
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
#[instruction(owner: Pubkey)]
pub struct IssueKycAttestation<'info> {
    #[account(
        init,
        payer = admin,
        space = KycAttestation::SIZE,
        seeds = [KycAttestation::SEED, owner.as_ref()],
        bump,
    )]
    pub kyc_attestation: Account<'info, KycAttestation>,
    #[account(seeds = [LoanConfig::SEED], bump = loan_config.bump)]
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
    /// CHECK: validated inline (deserialized + owner-checked) when
    /// `loan_config.kyc_required == true`. When the gate is OFF, callers may
    /// pass any account (e.g. SystemProgram).
    pub kyc_attestation: UncheckedAccount<'info>,
    /// CHECK: validated inline (PDA re-derive + deserialize + owner-check)
    /// when `loan_config.oracle_admin != Pubkey::default()`. When the oracle
    /// is unset, callers may pass any account (e.g. SystemProgram). See
    /// SR-1 / SR-2 / SR-5 / SR-6 inline in `create_ccb_trdc`.
    pub price_feed: UncheckedAccount<'info>,
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

    // ----- Accounts required for the atomic disburse -----

    /// CHECK: asserted by the vault program via its own seeds/bump constraint.
    #[account(mut)]
    pub vault: UncheckedAccount<'info>,
    pub asset_mint: Account<'info, Mint>,
    /// CHECK: asserted by the vault program (token::mint/token::authority).
    #[account(mut)]
    pub vault_ata: UncheckedAccount<'info>,
    /// SR (atomic-only): borrower_ata.owner pinned to trdc_state.borrower so
    /// the custodian — who is the only signer in this tx — cannot redirect
    /// principal to a wallet other than the loan's borrower of record.
    /// `disburse_from_vault` (standalone) intentionally keeps the looser
    /// constraint to preserve existing test coverage.
    #[account(
        mut,
        token::mint = asset_mint,
        token::authority = trdc_state.borrower,
    )]
    pub borrower_ata: Account<'info, TokenAccount>,
    /// CHECK: PDA `[b"loan_authority"]` owned by this program; the vault
    /// program re-derives and requires this as the signer.
    #[account(seeds = [LOAN_AUTHORITY_SEED], bump)]
    pub loan_authority: UncheckedAccount<'info>,
    pub vault_program: Program<'info, VaultProgram>,
    pub token_program: Program<'info, Token>,
    /// CHECK: address-constrained to the instructions sysvar; forwarded to
    /// vault::disburse so its Layer 2 check can read it.
    #[account(address = anchor_lang::solana_program::sysvar::instructions::ID)]
    pub instructions_sysvar: UncheckedAccount<'info>,
    /// CHECK: validated inline (PDA-owner + deserialize) when
    /// `loan_config.oracle_admin != Pubkey::default()`. When the oracle is
    /// unset, callers may pass any account (e.g. SystemProgram).
    pub price_feed: UncheckedAccount<'info>,
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
    /// CHECK: validated inline (PDA-owner + deserialize) when
    /// `loan_config.oracle_admin != Pubkey::default()`. When the oracle is
    /// unset, callers may pass any account (e.g. SystemProgram).
    pub price_feed: UncheckedAccount<'info>,
}

/// Shared accounts struct for `pay_installment`, `repay_ccb`, `renew_ccb`.
///
/// No civic gate (Task 2.6.5 gates only entry points: `deposit` + `create_ccb_trdc`).
#[derive(Accounts)]
pub struct RepaymentOp<'info> {
    #[account(mut)]
    pub trdc_state: Account<'info, TRDCState>,
    /// CHECK: asserted by the vault program via its seeds/bump constraint on
    /// `record_inflow`.
    #[account(mut)]
    pub vault: UncheckedAccount<'info>,
    pub asset_mint: Account<'info, Mint>,
    /// CHECK: asserted by the vault program (token::mint/token::authority).
    #[account(mut)]
    pub vault_ata: UncheckedAccount<'info>,
    #[account(mut, token::mint = asset_mint, token::authority = borrower)]
    pub borrower_ata: Account<'info, TokenAccount>,
    #[account(mut)]
    pub borrower: Signer<'info>,
    /// CHECK: PDA `[b"loan_authority"]` owned by this program; required by
    /// the `vault::record_inflow` CPI for the two-layer gate.
    #[account(seeds = [LOAN_AUTHORITY_SEED], bump)]
    pub loan_authority: UncheckedAccount<'info>,
    pub trdc_program: Program<'info, Trdc>,
    pub vault_program: Program<'info, VaultProgram>,
    pub token_program: Program<'info, Token>,
    /// CHECK: address-constrained to the instructions sysvar; forwarded to the
    /// vault CPI so vault's Layer 2 check can read it.
    #[account(address = anchor_lang::solana_program::sysvar::instructions::ID)]
    pub instructions_sysvar: UncheckedAccount<'info>,
}

/// Accounts for `execute_af_default`. Permissionless — any signer can pay.
#[derive(Accounts)]
pub struct ExecuteAfDefault<'info> {
    #[account(mut)]
    pub trdc_state: Account<'info, TRDCState>,
    #[account(
        seeds = [LoanConfig::SEED],
        bump = loan_config.bump,
    )]
    pub loan_config: Account<'info, LoanConfig>,

    /// CHECK: created via CPI by the auction program; auction program asserts
    /// PDA seeds / owner on `init`.
    #[account(mut)]
    pub auction: UncheckedAccount<'info>,

    pub asset_mint: Account<'info, Mint>,

    /// CHECK: created / validated by the auction program via
    /// `associated_token::*` on its own accounts struct.
    #[account(mut)]
    pub escrow_ata: UncheckedAccount<'info>,

    /// CHECK: pass-through; stored in the auction account. Validated by the
    /// vault program on close.
    pub vault: UncheckedAccount<'info>,

    /// CHECK: PDA `[b"loan_authority"]` owned by this program. Used as the
    /// `invoke_signed` signer for both the trdc transitions and the auction
    /// `create_auction` CPI. The auction program re-derives and asserts this
    /// as the LOAN_PROGRAM_ID's PDA + signer in Layer 1.
    #[account(seeds = [LOAN_AUTHORITY_SEED], bump)]
    pub loan_authority: UncheckedAccount<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub trdc_program: Program<'info, Trdc>,
    pub auction_program: Program<'info, AuctionProgram>,
    /// CHECK: address-constrained to the instructions sysvar; forwarded to the
    /// auction CPI so auction's Layer 2 check can read it.
    #[account(address = anchor_lang::solana_program::sysvar::instructions::ID)]
    pub instructions_sysvar: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct SetKycRequired<'info> {
    #[account(
        mut,
        seeds = [LoanConfig::SEED],
        bump = loan_config.bump,
    )]
    pub loan_config: Account<'info, LoanConfig>,
    pub admin: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(owner: Pubkey)]
pub struct CloseKycAttestation<'info> {
    #[account(seeds = [LoanConfig::SEED], bump = loan_config.bump)]
    pub loan_config: Account<'info, LoanConfig>,
    #[account(
        mut,
        seeds = [KycAttestation::SEED, owner.as_ref()],
        bump = kyc_attestation.bump,
        close = admin,
    )]
    pub kyc_attestation: Account<'info, KycAttestation>,
    #[account(mut)]
    pub admin: Signer<'info>,
}

#[derive(Accounts)]
pub struct SetOracleAdmin<'info> {
    #[account(
        mut,
        seeds = [LoanConfig::SEED],
        bump = loan_config.bump,
    )]
    pub loan_config: Account<'info, LoanConfig>,
    pub admin: Signer<'info>,
}

/// Accounts for `migrate_loan_config_v2`. Uses `UncheckedAccount` for the
/// loan_config because the on-chain data may still be in the pre-oracle
/// layout (106 bytes), which `Account<'info, LoanConfig>` cannot deserialize.
/// The ix body verifies the discriminator + admin offset manually.
#[derive(Accounts)]
pub struct MigrateLoanConfigV2<'info> {
    /// CHECK: PDA derivation enforced via seeds; admin offset verified in body.
    #[account(
        mut,
        seeds = [LoanConfig::SEED],
        bump,
        constraint = loan_config.owner == &crate::ID @ LoanError::Unauthorized,
        constraint = loan_config.try_borrow_data()?.len() >= 8 + 32 @ LoanError::AccountTooSmall,
        constraint = loan_config.try_borrow_data()?[8..40] == admin.key().to_bytes() @ LoanError::UnauthorizedAdmin,
    )]
    pub loan_config: UncheckedAccount<'info>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

/// V3 — accounts for `migrate_loan_config_v3`. Same shape as `MigrateLoanConfigV2`;
/// the admin-pubkey-at-offset-8 constraint binds the migration to the v1/v2
/// admin so a stray signer can't grow the account.
#[derive(Accounts)]
pub struct MigrateLoanConfigV3<'info> {
    /// CHECK: PDA derivation enforced via seeds; admin offset verified in body.
    #[account(
        mut,
        seeds = [LoanConfig::SEED],
        bump,
        constraint = loan_config.owner == &crate::ID @ LoanError::Unauthorized,
        constraint = loan_config.try_borrow_data()?.len() >= 8 + 32 @ LoanError::AccountTooSmall,
        constraint = loan_config.try_borrow_data()?[8..40] == admin.key().to_bytes() @ LoanError::UnauthorizedAdmin,
    )]
    pub loan_config: UncheckedAccount<'info>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(ref_bytes: [u8; 32])]
pub struct PublishPrice<'info> {
    /// SR-2 — PDA seeds bind the feed account to a specific watch ref.
    /// `init_if_needed` is intentional: the publisher refreshes the same
    /// feed once per minute. Anchor's `realloc` is not needed because the
    /// account size is fixed.
    #[account(
        init_if_needed,
        payer = oracle_admin,
        space = PriceFeed::SIZE,
        seeds = [PriceFeed::SEED, ref_bytes.as_ref()],
        bump,
    )]
    pub price_feed: Account<'info, PriceFeed>,
    #[account(seeds = [LoanConfig::SEED], bump = loan_config.bump)]
    pub loan_config: Account<'info, LoanConfig>,
    /// SR-3 / SR-4 — the only signer allowed to publish. Verified inline
    /// against `loan_config.oracle_admin`.
    #[account(mut)]
    pub oracle_admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[event]
pub struct KycRequiredChanged {
    pub required: bool,
    pub by: Pubkey,
}

#[event]
pub struct KycAttestationClosed {
    pub owner: Pubkey,
    pub admin: Pubkey,
}

#[event]
pub struct OracleAdminSet {
    pub oracle_admin: Pubkey,
    pub ts: i64,
}

#[event]
pub struct PricePublished {
    pub ref_bytes: [u8; 32],
    pub median_usd_cents: u64,
    pub listings: u32,
    pub observed_at: i64,
    pub ts: i64,
}
