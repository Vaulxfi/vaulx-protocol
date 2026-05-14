use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, Mint, MintTo, Token, TokenAccount, Transfer};

pub mod attestation;
pub mod errors;
pub mod state;

use attestation::KycAttestation;
use state::Vault;

declare_id!("GQU6pGwdUAWdhzNDGUU8toVCqxo22mHpFrJeFRE4hpDL");

/// Hardcoded loan program id — mirrors `loan::declare_id!`. We hardcode rather
/// than import the `loan` crate to avoid a circular crate dep (loan depends on
/// vault).
// base58("BCzcP4soWYSVWAt8gWPZmcNxcCiw8LdU8sT5VS3TPuW8") decoded to bytes.
pub const LOAN_PROGRAM_ID: Pubkey = Pubkey::new_from_array([
    151, 167, 101, 227, 201, 255, 26, 25, 13, 245, 180, 1, 107, 172, 230, 75, 246, 70, 130, 130,
    3, 124, 116, 34, 104, 163, 156, 213, 109, 125, 10, 121,
]);
pub const LOAN_AUTHORITY_SEED: &[u8] = b"loan_authority";

/// Hardcoded auction program id — mirrors `auction::declare_id!`. We hardcode
/// to avoid a circular crate dep (auction depends on vault for inflow).
// base58("Fth5WyopNBi6JatJtTnxb7eHs2GSFhJU7AqskRBZGU8m") decoded to bytes.
pub const AUCTION_PROGRAM_ID: Pubkey = Pubkey::new_from_array([
    221, 65, 141, 239, 68, 27, 109, 198, 15, 172, 232, 250, 42, 167, 1, 15, 244, 235, 89, 51,
    130, 201, 248, 70, 54, 244, 204, 89, 181, 224, 86, 166,
]);
pub const AUCTION_AUTHORITY_SEED: &[u8] = b"auction_authority";

#[program]
pub mod vault {
    use super::*;

    /// First-writer-wins init for the global `VaultConfig` PDA. Setting
    /// `civic_network = Pubkey::default()` disables the Civic Pass gate on
    /// `deposit` — this is the feature flag. Set it to a gatekeeper-network
    /// pubkey (e.g. the devnet CAPTCHA network) to turn the gate on.
    pub fn initialize_vault_config(
        ctx: Context<InitializeVaultConfig>,
        civic_network: Pubkey,
    ) -> Result<()> {
        let cfg = &mut ctx.accounts.vault_config;
        cfg.admin = ctx.accounts.admin.key();
        cfg.civic_network = civic_network;
        cfg.kyc_required = false;
        cfg.bump = ctx.bumps.vault_config;
        // V3 — set the explicit init flag so admin-gated ixs can reject a
        // closed+reinit-style attempt before doing any work.
        cfg.initialized = true;
        Ok(())
    }

    /// Admin-only: issue a KycAttestation PDA for `owner`. Caller must be
    /// `vault_config.admin`. The PDA is `[b"kyc_attestation", owner]` so each
    /// user has at most one outstanding attestation.
    ///
    /// `jwt_hash` is the SHA-256 of the Civic Auth JWT — binds the
    /// attestation to a specific verification event so a future replay /
    /// revocation flow can reference it.
    pub fn issue_kyc_attestation(
        ctx: Context<IssueKycAttestation>,
        owner: Pubkey,
        jwt_hash: [u8; 32],
    ) -> Result<()> {
        // V3 — defense-in-depth init-flag check.
        require!(
            ctx.accounts.vault_config.initialized,
            VaultError::ConfigNotInitialized
        );
        require_keys_eq!(
            ctx.accounts.admin.key(),
            ctx.accounts.vault_config.admin,
            VaultError::UnauthorizedAttestor
        );
        let att = &mut ctx.accounts.kyc_attestation;
        att.owner = owner;
        att.attestor = ctx.accounts.admin.key();
        att.attested_at = Clock::get()?.unix_timestamp;
        att.jwt_hash = jwt_hash;
        att.bump = ctx.bumps.kyc_attestation;
        Ok(())
    }

    /// Admin-only: flip `vault_config.kyc_required` between true and false.
    /// Gated on `signer == vault_config.admin`. Used by tests to exercise
    /// the runtime revert path of the KYC gate against a fresh user with no
    /// attestation, then flip back to false so the rest of the suite sees
    /// the default-off behaviour.
    pub fn set_kyc_required(ctx: Context<SetKycRequired>, required: bool) -> Result<()> {
        // V3 — defense-in-depth init-flag check.
        require!(
            ctx.accounts.vault_config.initialized,
            VaultError::ConfigNotInitialized
        );
        require_keys_eq!(
            ctx.accounts.admin.key(),
            ctx.accounts.vault_config.admin,
            VaultError::Unauthorized
        );
        ctx.accounts.vault_config.kyc_required = required;
        emit!(KycRequiredChanged {
            required,
            by: ctx.accounts.admin.key(),
        });
        Ok(())
    }

    /// Admin-only: close a `KycAttestation` PDA and refund rent to the admin.
    /// Caller must be `vault_config.admin`. After this ix, `issue_kyc_attestation`
    /// can be re-called for the same `owner` (e.g. with a fresh `jwt_hash`)
    /// because the PDA seeds are deterministic per owner — closure is the
    /// only way to break the init-once constraint.
    ///
    /// Use cases: KYC verification expired, issuer revoked the user, or the
    /// underlying JWT was rotated.
    pub fn close_kyc_attestation(
        ctx: Context<CloseKycAttestation>,
        _owner: Pubkey,
    ) -> Result<()> {
        // V3 — defense-in-depth init-flag check.
        require!(
            ctx.accounts.vault_config.initialized,
            VaultError::ConfigNotInitialized
        );
        require_keys_eq!(
            ctx.accounts.admin.key(),
            ctx.accounts.vault_config.admin,
            VaultError::Unauthorized
        );
        emit!(KycAttestationClosed {
            owner: ctx.accounts.kyc_attestation.owner,
            admin: ctx.accounts.admin.key(),
        });
        Ok(())
    }

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

        // KYC gate — replaces the sunset Civic Pass check. When
        // `vault_config.kyc_required == true` the depositor must present a
        // valid KycAttestation PDA whose `owner == depositor` and
        // `attestor == vault_config.admin`. Default is gate OFF.
        if ctx.accounts.vault_config.kyc_required {
            let att_info = &ctx.accounts.kyc_attestation;
            require_keys_eq!(
                *att_info.owner,
                crate::ID,
                VaultError::NoKycAttestation
            );
            let data = att_info.try_borrow_data()?;
            let mut slice: &[u8] = &data;
            let att = KycAttestation::try_deserialize(&mut slice)
                .map_err(|_| error!(VaultError::NoKycAttestation))?;
            require_keys_eq!(
                att.owner,
                ctx.accounts.depositor.key(),
                VaultError::NoKycAttestation
            );
            require_keys_eq!(
                att.attestor,
                ctx.accounts.vault_config.admin,
                VaultError::NoKycAttestation
            );
        }

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

    /// Records a loan repayment / renewal-fee inflow: bumps `total_assets`
    /// without minting shares, so existing share-price accounting absorbs
    /// the yield. Mirrors `disburse`'s two-layer gate — only the loan
    /// program's `loan_authority` PDA, issued as the top-level tx by the
    /// loan program, may call this.
    pub fn record_inflow(ctx: Context<RecordInflow>, amount: u64) -> Result<()> {
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
        use anchor_lang::solana_program::sysvar::instructions::load_instruction_at_checked;
        let ix_sysvar = &ctx.accounts.instructions_sysvar.to_account_info();
        let top_level_ix = load_instruction_at_checked(0, ix_sysvar)
            .map_err(|_| error!(VaultError::UnauthorizedDisbursar))?;
        require_keys_eq!(
            top_level_ix.program_id,
            LOAN_PROGRAM_ID,
            VaultError::UnauthorizedDisbursar
        );

        let v = &mut ctx.accounts.vault;
        v.total_assets = v
            .total_assets
            .checked_add(amount)
            .ok_or(VaultError::MathOverflow)?;
        Ok(())
    }

    /// Records an auction-recovery inflow: bumps `total_assets` without minting
    /// shares. Two-layer gate mirrors `record_inflow` but keyed to the
    /// **auction** program's `auction_authority` PDA + top-level tx id.
    /// Called by `auction::close_auction` when there's a winning bid.
    pub fn record_auction_inflow(ctx: Context<RecordAuctionInflow>, amount: u64) -> Result<()> {
        require!(amount > 0, VaultError::ZeroAmount);

        // Layer 1: authority must be the auction-authority PDA and a signer.
        let (expected_authority, _bump) =
            Pubkey::find_program_address(&[AUCTION_AUTHORITY_SEED], &AUCTION_PROGRAM_ID);
        require_keys_eq!(
            ctx.accounts.auction_authority.key(),
            expected_authority,
            VaultError::UnauthorizedDisbursar
        );
        require!(
            ctx.accounts.auction_authority.is_signer,
            VaultError::UnauthorizedDisbursar
        );

        // Layer 2: the top-level instruction must be issued by the auction program.
        use anchor_lang::solana_program::sysvar::instructions::load_instruction_at_checked;
        let ix_sysvar = &ctx.accounts.instructions_sysvar.to_account_info();
        let top_level_ix = load_instruction_at_checked(0, ix_sysvar)
            .map_err(|_| error!(VaultError::UnauthorizedDisbursar))?;
        require_keys_eq!(
            top_level_ix.program_id,
            AUCTION_PROGRAM_ID,
            VaultError::UnauthorizedDisbursar
        );

        let v = &mut ctx.accounts.vault;
        v.total_assets = v
            .total_assets
            .checked_add(amount)
            .ok_or(VaultError::MathOverflow)?;
        Ok(())
    }

    /// V3 — one-shot migration ix for upgrades coming from a pre-`initialized`
    /// VaultConfig layout (74 bytes; new layout is 75). Reallocs the account
    /// to the new size, writes `initialized = true` at the new byte offset,
    /// pays the rent delta from `admin`. Idempotent: a no-op when the account
    /// is already at the new size (covers the fresh-deploy case and re-runs).
    /// Admin-gated by reading the admin pubkey at offset 8 (stable across both
    /// layouts: discriminator(8) + admin(32)).
    pub fn migrate_vault_config_v2(ctx: Context<MigrateVaultConfigV2>) -> Result<()> {
        let cfg = &ctx.accounts.vault_config;
        let info = cfg.to_account_info();
        let new_size = VaultConfig::SIZE;
        let cur_size = info.data_len();
        if cur_size >= new_size {
            // Already migrated (or freshly initialized at the new size). Idempotent.
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
        // Write `initialized = true` at the new byte (offset 74 in the v2
        // layout: disc(8) + admin(32) + civic_network(32) + kyc_required(1)
        // + bump(1) = 74). `realloc(_, true)` zero-fills the trailing bytes,
        // so we explicitly set the flag for v1 rows that pre-existed.
        {
            let mut data = info.try_borrow_mut_data()?;
            data[new_size - 1] = 1u8;
        }
        Ok(())
    }
}

#[account]
pub struct VaultConfig {
    pub admin: Pubkey,
    /// Legacy field — gatekeeper network pubkey from the Civic Pass era.
    /// Retained for IDL stability; no longer consulted at deposit time. The
    /// new gate is keyed off `kyc_required` + the KycAttestation PDA.
    pub civic_network: Pubkey,
    /// When true, `deposit` requires a valid KycAttestation PDA. Default
    /// false (gate OFF) to preserve existing test behaviour.
    pub kyc_required: bool,
    pub bump: u8,
    /// V3 — explicit initialization flag. Set to `true` by
    /// `initialize_vault_config`. Checked at the top of every admin-gated
    /// instruction as defense-in-depth against a future close+reinit attack
    /// (no close ix exists today, but adding the flag now keeps the surface
    /// closed when one is introduced).
    pub initialized: bool,
}

impl VaultConfig {
    // disc(8) + admin(32) + civic_network(32) + kyc_required(1) + bump(1) + initialized(1) = 75
    pub const SIZE: usize = 8 + 32 + 32 + 1 + 1 + 1;
    pub const SEED: &'static [u8] = b"vault_config";
}

#[derive(Accounts)]
pub struct InitializeVaultConfig<'info> {
    #[account(
        init,
        payer = admin,
        space = VaultConfig::SIZE,
        seeds = [VaultConfig::SEED],
        bump,
    )]
    pub vault_config: Account<'info, VaultConfig>,
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
    #[account(seeds = [VaultConfig::SEED], bump = vault_config.bump)]
    pub vault_config: Account<'info, VaultConfig>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SetKycRequired<'info> {
    #[account(mut, seeds = [VaultConfig::SEED], bump = vault_config.bump)]
    pub vault_config: Account<'info, VaultConfig>,
    pub admin: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(owner: Pubkey)]
pub struct CloseKycAttestation<'info> {
    #[account(seeds = [VaultConfig::SEED], bump = vault_config.bump)]
    pub vault_config: Account<'info, VaultConfig>,
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

    #[account(seeds = [VaultConfig::SEED], bump = vault_config.bump)]
    pub vault_config: Account<'info, VaultConfig>,
    /// CHECK: validated inline (deserialized + owner-checked) when
    /// `vault_config.kyc_required == true`. When the gate is OFF, callers
    /// may pass any account (e.g. SystemProgram).
    pub kyc_attestation: UncheckedAccount<'info>,
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

/// Accounts for `record_auction_inflow`. Mirrors `RecordInflow` but gated to
/// the **auction** program's authority PDA + top-level program id.
#[derive(Accounts)]
pub struct RecordAuctionInflow<'info> {
    #[account(mut, seeds = [Vault::SEED, asset_mint.key().as_ref()], bump = vault.bump)]
    pub vault: Account<'info, Vault>,
    pub asset_mint: Account<'info, Mint>,
    /// CHECK: validated in-body — must equal `[b"auction_authority"]` PDA
    /// owned by the auction program and must be a signer via `invoke_signed`.
    #[account(signer)]
    pub auction_authority: UncheckedAccount<'info>,
    /// CHECK: address-constrained to the instructions sysvar; used by Layer 2.
    #[account(address = anchor_lang::solana_program::sysvar::instructions::ID)]
    pub instructions_sysvar: UncheckedAccount<'info>,
}

/// V3 — accounts for `migrate_vault_config_v2`. Uses `UncheckedAccount` for
/// the vault_config because pre-migration data is in the v1 layout (74 bytes)
/// which `Account<'info, VaultConfig>` cannot deserialize. The ix body
/// verifies the discriminator + admin offset manually.
#[derive(Accounts)]
pub struct MigrateVaultConfigV2<'info> {
    /// CHECK: PDA derivation enforced via seeds; admin offset verified in body.
    #[account(
        mut,
        seeds = [VaultConfig::SEED],
        bump,
        constraint = vault_config.owner == &crate::ID @ VaultError::Unauthorized,
        constraint = vault_config.try_borrow_data()?.len() >= 8 + 32 @ VaultError::AccountTooSmall,
        constraint = vault_config.try_borrow_data()?[8..40] == admin.key().to_bytes() @ VaultError::Unauthorized,
    )]
    pub vault_config: UncheckedAccount<'info>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

/// Accounts for `record_inflow`. Same layer-2 instruction sysvar gate as
/// `disburse` (only the loan program can issue the top-level tx).
#[derive(Accounts)]
pub struct RecordInflow<'info> {
    #[account(mut, seeds = [Vault::SEED, asset_mint.key().as_ref()], bump = vault.bump)]
    pub vault: Account<'info, Vault>,
    pub asset_mint: Account<'info, Mint>,
    /// CHECK: validated in-body — must equal `[b"loan_authority"]` PDA owned
    /// by the loan program and must be a signer via `invoke_signed`.
    #[account(signer)]
    pub loan_authority: UncheckedAccount<'info>,
    /// CHECK: address-constrained to the instructions sysvar; used by Layer 2.
    #[account(address = anchor_lang::solana_program::sysvar::instructions::ID)]
    pub instructions_sysvar: UncheckedAccount<'info>,
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

pub use errors::*;
pub use state::*;
