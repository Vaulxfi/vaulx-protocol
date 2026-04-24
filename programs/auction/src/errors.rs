use anchor_lang::prelude::*;

#[error_code]
pub enum AuctionError {
    #[msg("Auction already ended")]
    AuctionEnded,
    #[msg("Auction has not yet ended")]
    AuctionNotEnded,
    #[msg("Auction is not open")]
    NotOpen,
    #[msg("Bid is below reserve price")]
    BelowReserve,
    #[msg("Bid does not meet minimum increment")]
    BidTooLow,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Math overflow")]
    MathOverflow,
}
