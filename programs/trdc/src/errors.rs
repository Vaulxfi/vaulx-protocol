use anchor_lang::prelude::*;

#[error_code]
pub enum TrdcError {
    #[msg("Invalid state transition")]
    InvalidStateTransition,
    #[msg("Math overflow")]
    MathOverflow,
}
