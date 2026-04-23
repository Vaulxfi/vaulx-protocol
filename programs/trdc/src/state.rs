use anchor_lang::prelude::*;

/// 7-state enum — mirrors `packages/types/src/index.ts` `TRDCStatus`.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum Status {
    PendingCustody,
    Active,
    Renewed,
    Repaid,
    Overdue,
    Defaulted,
    Liquidated,
}

#[account]
pub struct TRDCState {
    pub loan_id: Pubkey,
    pub status: Status,
    pub appraisal_value: u64,
    pub loan_amount: u64,
    pub due_ts: i64,
    pub bump: u8,
    pub created_at: i64,
    pub _reserved: [u8; 64],
}

impl TRDCState {
    pub const SIZE: usize = 8 + 32 + 2 + 8 + 8 + 8 + 1 + 8 + 64;
    pub const SEED: &'static [u8] = b"trdc_state";
}
