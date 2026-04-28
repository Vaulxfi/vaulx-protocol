use anchor_lang::prelude::*;

#[error_code]
pub enum TrdcError {
    #[msg("Invalid state transition")]
    InvalidStateTransition,
    #[msg("Math overflow")]
    MathOverflow,
    /// SR-2: signer pubkey != trdc_state.borrower.
    #[msg("Signer does not match the loan's borrower")]
    BorrowerMismatch,
    /// SR-2: trdc_state.status is not the gate state for minting.
    #[msg("Loan is not in the awaiting-mint state")]
    LoanNotReady,
    /// SR-2: cnft_asset_id was already populated.
    #[msg("TRDC cNFT has already been minted for this loan")]
    AlreadyMinted,
    /// SR-8: tree is full (num_minted >= 2^max_depth).
    #[msg("Merkle tree has no remaining capacity")]
    TreeFull,
    /// SR-4: signer is not the TrdcConfig admin.
    #[msg("Caller is not the trdc-config admin")]
    Unauthorized,
    /// Helper: tree_config account failed to deserialize.
    #[msg("Failed to deserialize Bubblegum TreeConfig")]
    InvalidTreeConfig,
}
