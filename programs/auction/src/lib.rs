use anchor_lang::prelude::*;
use anchor_lang::solana_program::sysvar::instructions::load_instruction_at_checked;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use trdc::cpi::accounts::TransitionAuth as TrdcTransitionAuth;
use trdc::program::Trdc;
use vault::cpi::accounts::RecordAuctionInflow as VaultRecordAuctionInflow;
use vault::program::Vault as VaultProgram;

pub mod errors;
pub mod state;

use errors::AuctionError;
use state::{Auction, AuctionStatus};

declare_id!("Fth5WyopNBi6JatJtTnxb7eHs2GSFhJU7AqskRBZGU8m");

/// Hardcoded loan program id — mirrors `loan::declare_id!`. Used by
/// `create_auction` to assert the CPI-only gate (only the loan program's
/// `[b"loan_authority"]` PDA may create auctions).
// base58("BCzcP4soWYSVWAt8gWPZmcNxcCiw8LdU8sT5VS3TPuW8") decoded to bytes.
pub const LOAN_PROGRAM_ID: Pubkey = Pubkey::new_from_array([
    151, 167, 101, 227, 201, 255, 26, 25, 13, 245, 180, 1, 107, 172, 230, 75, 246, 70, 130, 130,
    3, 124, 116, 34, 104, 163, 156, 213, 109, 125, 10, 121,
]);
pub const LOAN_AUTHORITY_SEED: &[u8] = b"loan_authority";
pub const AUCTION_AUTHORITY_SEED: &[u8] = b"auction_authority";

#[program]
pub mod auction {
    use super::*;

    pub fn ping(_ctx: Context<Ping>) -> Result<()> {
        msg!("auction ping");
        Ok(())
    }

    /// Moment 7 (auction bootstrap) — called only via CPI from
    /// `loan::execute_af_default`. Two-layer gate identical to `vault::disburse`.
    pub fn create_auction(
        ctx: Context<CreateAuction>,
        reserve_price: u64,
        duration_secs: i64,
    ) -> Result<()> {
        require!(reserve_price > 0, AuctionError::BelowReserve);
        require!(duration_secs > 0, AuctionError::AuctionEnded);

        // Layer 1: loan_authority must match the loan program's PDA and sign.
        let (expected_authority, _bump) =
            Pubkey::find_program_address(&[LOAN_AUTHORITY_SEED], &LOAN_PROGRAM_ID);
        require_keys_eq!(
            ctx.accounts.auction_authority.key(),
            expected_authority,
            AuctionError::Unauthorized
        );
        require!(
            ctx.accounts.auction_authority.is_signer,
            AuctionError::Unauthorized
        );

        // Layer 2: top-level tx must be issued by the loan program.
        let ix_sysvar = &ctx.accounts.instructions_sysvar.to_account_info();
        let top_level_ix = load_instruction_at_checked(0, ix_sysvar)
            .map_err(|_| error!(AuctionError::Unauthorized))?;
        require_keys_eq!(
            top_level_ix.program_id,
            LOAN_PROGRAM_ID,
            AuctionError::Unauthorized
        );

        let now = Clock::get()?.unix_timestamp;
        let min_increment = std::cmp::max(1u64, reserve_price / 100);

        let a = &mut ctx.accounts.auction;
        a.trdc_state = ctx.accounts.trdc_state.key();
        a.asset_mint = ctx.accounts.asset_mint.key();
        a.reserve_price = reserve_price;
        a.min_increment = min_increment;
        a.start_ts = now;
        a.end_ts = now.checked_add(duration_secs).ok_or(AuctionError::MathOverflow)?;
        a.high_bid = 0;
        a.high_bidder = Pubkey::default();
        a.escrow_ata = ctx.accounts.escrow_ata.key();
        a.vault = ctx.accounts.vault.key();
        a.status = AuctionStatus::Open;
        a.bump = ctx.bumps.auction;
        a._reserved = [0u8; 32];

        emit!(AuctionCreated {
            auction: a.key(),
            trdc_state: a.trdc_state,
            asset_mint: a.asset_mint,
            reserve_price,
            start_ts: a.start_ts,
            end_ts: a.end_ts,
            ts: now,
        });
        Ok(())
    }

    /// Permissionless — anyone can bid before `end_ts`. First bid bypasses the
    /// increment gate; subsequent bids must beat `high_bid + min_increment`.
    pub fn place_bid(ctx: Context<PlaceBid>, amount: u64) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        let a = &ctx.accounts.auction;
        require!(a.status == AuctionStatus::Open, AuctionError::NotOpen);
        require!(now < a.end_ts, AuctionError::AuctionEnded);
        require!(amount >= a.reserve_price, AuctionError::BelowReserve);
        if a.high_bid > 0 {
            let min_acceptable = a
                .high_bid
                .checked_add(a.min_increment)
                .ok_or(AuctionError::MathOverflow)?;
            require!(amount >= min_acceptable, AuctionError::BidTooLow);
        }

        let previous_high_bid = a.high_bid;
        let previous_high_bidder = a.high_bidder;

        // 1) bidder -> escrow_ata
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.bidder_ata.to_account_info(),
                    to: ctx.accounts.escrow_ata.to_account_info(),
                    authority: ctx.accounts.bidder.to_account_info(),
                },
            ),
            amount,
        )?;

        // 2) Refund prior bidder if any. Auction PDA signs the transfer.
        if previous_high_bidder != Pubkey::default() && previous_high_bid > 0 {
            let trdc_state_key = a.trdc_state;
            let bump = a.bump;
            let seeds: &[&[u8]] = &[Auction::SEED, trdc_state_key.as_ref(), &[bump]];
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.escrow_ata.to_account_info(),
                        to: ctx.accounts.previous_bidder_ata.to_account_info(),
                        authority: ctx.accounts.auction.to_account_info(),
                    },
                    &[seeds],
                ),
                previous_high_bid,
            )?;
        }

        // 3) update high
        let a = &mut ctx.accounts.auction;
        a.high_bid = amount;
        a.high_bidder = ctx.accounts.bidder.key();

        emit!(BidPlaced {
            auction: a.key(),
            bidder: ctx.accounts.bidder.key(),
            amount,
            high_bid_previous: previous_high_bid,
            ts: now,
        });
        Ok(())
    }

    /// Permissionless close after `end_ts`. Two branches:
    ///   - No bids: just flip TRDC -> Liquidated, emit no-bids event.
    ///   - With bid: transfer escrow -> vault_ata, record_auction_inflow to
    ///     the vault, flip TRDC -> Liquidated.
    pub fn close_auction(ctx: Context<CloseAuction>) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        let a = &ctx.accounts.auction;
        require!(a.status == AuctionStatus::Open, AuctionError::NotOpen);
        require!(now >= a.end_ts, AuctionError::AuctionNotEnded);

        let trdc_state_key = a.trdc_state;
        let auction_bump = a.bump;
        let auction_seeds: &[&[u8]] = &[Auction::SEED, trdc_state_key.as_ref(), &[auction_bump]];

        let winner = a.high_bidder;
        let winning_bid = a.high_bid;

        if winner == Pubkey::default() || winning_bid == 0 {
            // Flip TRDC defaulted -> liquidated; no capital recovery.
            trdc::cpi::transition_defaulted_to_liquidated(CpiContext::new(
                ctx.accounts.trdc_program.to_account_info(),
                TrdcTransitionAuth {
                    trdc_state: ctx.accounts.trdc_state.to_account_info(),
                    authority: ctx.accounts.caller.to_account_info(),
                },
            ))?;

            let a = &mut ctx.accounts.auction;
            a.status = AuctionStatus::Closed;

            emit!(AuctionClosedNoBids {
                auction: a.key(),
                trdc_state: trdc_state_key,
                ts: now,
            });
            return Ok(());
        }

        // Winning-bid branch.

        // 1) Transfer escrow -> vault_ata (auction PDA signs).
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.escrow_ata.to_account_info(),
                    to: ctx.accounts.vault_ata.to_account_info(),
                    authority: ctx.accounts.auction.to_account_info(),
                },
                &[auction_seeds],
            ),
            winning_bid,
        )?;

        // 2) CPI into vault::record_auction_inflow using auction_authority as
        //    invoke_signed signer. The ctx provides that account.
        let (expected_authority, auth_bump) =
            Pubkey::find_program_address(&[AUCTION_AUTHORITY_SEED], &crate::ID);
        require_keys_eq!(
            ctx.accounts.auction_authority.key(),
            expected_authority,
            AuctionError::Unauthorized
        );
        let auth_seeds: &[&[u8]] = &[AUCTION_AUTHORITY_SEED, &[auth_bump]];
        vault::cpi::record_auction_inflow(
            CpiContext::new_with_signer(
                ctx.accounts.vault_program.to_account_info(),
                VaultRecordAuctionInflow {
                    vault: ctx.accounts.vault.to_account_info(),
                    asset_mint: ctx.accounts.asset_mint.to_account_info(),
                    auction_authority: ctx.accounts.auction_authority.to_account_info(),
                    instructions_sysvar: ctx.accounts.instructions_sysvar.to_account_info(),
                },
                &[auth_seeds],
            ),
            winning_bid,
        )?;

        // 3) TRDC defaulted -> liquidated.
        trdc::cpi::transition_defaulted_to_liquidated(CpiContext::new(
            ctx.accounts.trdc_program.to_account_info(),
            TrdcTransitionAuth {
                trdc_state: ctx.accounts.trdc_state.to_account_info(),
                authority: ctx.accounts.caller.to_account_info(),
            },
        ))?;

        let a = &mut ctx.accounts.auction;
        a.status = AuctionStatus::Closed;

        emit!(AuctionClosed {
            auction: a.key(),
            winner,
            winning_bid,
            vault_recovered: winning_bid,
            ts: now,
        });
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Ping<'info> {
    pub signer: Signer<'info>,
}

#[derive(Accounts)]
pub struct CreateAuction<'info> {
    #[account(
        init,
        payer = payer,
        space = Auction::SIZE,
        seeds = [Auction::SEED, trdc_state.key().as_ref()],
        bump,
    )]
    pub auction: Account<'info, Auction>,

    /// CHECK: back-reference only; the loan program validates its state.
    pub trdc_state: UncheckedAccount<'info>,

    pub asset_mint: Account<'info, Mint>,

    #[account(
        init,
        payer = payer,
        associated_token::mint = asset_mint,
        associated_token::authority = auction,
    )]
    pub escrow_ata: Account<'info, TokenAccount>,

    /// CHECK: back-reference; stored in auction. Validated on close by the
    /// vault program via its own seeds/bump constraint.
    pub vault: UncheckedAccount<'info>,

    /// CHECK: in-body validated — must equal the loan program's
    /// `[b"loan_authority"]` PDA and be a signer (invoke_signed from loan).
    #[account(signer)]
    pub auction_authority: UncheckedAccount<'info>,

    /// CHECK: address-constrained to the instructions sysvar; used by Layer 2.
    #[account(address = anchor_lang::solana_program::sysvar::instructions::ID)]
    pub instructions_sysvar: UncheckedAccount<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct PlaceBid<'info> {
    #[account(
        mut,
        seeds = [Auction::SEED, auction.trdc_state.as_ref()],
        bump = auction.bump,
    )]
    pub auction: Account<'info, Auction>,

    pub asset_mint: Account<'info, Mint>,

    #[account(
        mut,
        address = auction.escrow_ata,
        token::mint = asset_mint,
        token::authority = auction,
    )]
    pub escrow_ata: Account<'info, TokenAccount>,

    #[account(mut, token::mint = asset_mint, token::authority = bidder)]
    pub bidder_ata: Account<'info, TokenAccount>,

    /// CHECK: when there's a previous high bidder, this must be their USDC ATA.
    /// We validate mint equals `asset_mint` to avoid wrong-mint drain. When
    /// there's no prior bidder, pass any writable token account (e.g. the
    /// bidder's own ATA) — it won't be debited.
    #[account(mut, token::mint = asset_mint)]
    pub previous_bidder_ata: Account<'info, TokenAccount>,

    #[account(mut)]
    pub bidder: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CloseAuction<'info> {
    #[account(
        mut,
        seeds = [Auction::SEED, auction.trdc_state.as_ref()],
        bump = auction.bump,
    )]
    pub auction: Account<'info, Auction>,

    /// CHECK: PDA owned by trdc; mutated via trdc CPI.
    #[account(mut, address = auction.trdc_state)]
    pub trdc_state: UncheckedAccount<'info>,

    pub asset_mint: Account<'info, Mint>,

    #[account(
        mut,
        address = auction.escrow_ata,
        token::mint = asset_mint,
        token::authority = auction,
    )]
    pub escrow_ata: Account<'info, TokenAccount>,

    /// CHECK: asserted by the vault program (token::mint/token::authority).
    #[account(mut)]
    pub vault_ata: UncheckedAccount<'info>,

    /// CHECK: PDA owned by vault; vault program asserts seeds/bump.
    #[account(mut, address = auction.vault)]
    pub vault: UncheckedAccount<'info>,

    /// CHECK: PDA `[b"auction_authority"]` owned by this program. The vault
    /// program re-derives and requires this as the signer for
    /// `record_auction_inflow`.
    #[account(
        seeds = [AUCTION_AUTHORITY_SEED],
        bump,
    )]
    pub auction_authority: UncheckedAccount<'info>,

    /// CHECK: address-constrained to the instructions sysvar; forwarded to the
    /// vault CPI so vault's Layer 2 check can read it.
    #[account(address = anchor_lang::solana_program::sysvar::instructions::ID)]
    pub instructions_sysvar: UncheckedAccount<'info>,

    pub trdc_program: Program<'info, Trdc>,
    pub vault_program: Program<'info, VaultProgram>,
    pub token_program: Program<'info, Token>,

    #[account(mut)]
    pub caller: Signer<'info>,
}

#[event]
pub struct AuctionCreated {
    pub auction: Pubkey,
    pub trdc_state: Pubkey,
    pub asset_mint: Pubkey,
    pub reserve_price: u64,
    pub start_ts: i64,
    pub end_ts: i64,
    pub ts: i64,
}

#[event]
pub struct BidPlaced {
    pub auction: Pubkey,
    pub bidder: Pubkey,
    pub amount: u64,
    pub high_bid_previous: u64,
    pub ts: i64,
}

#[event]
pub struct AuctionClosed {
    pub auction: Pubkey,
    pub winner: Pubkey,
    pub winning_bid: u64,
    pub vault_recovered: u64,
    pub ts: i64,
}

#[event]
pub struct AuctionClosedNoBids {
    pub auction: Pubkey,
    pub trdc_state: Pubkey,
    pub ts: i64,
}

pub use errors::*;
pub use state::*;
