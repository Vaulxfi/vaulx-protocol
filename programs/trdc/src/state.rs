use anchor_lang::prelude::*;

/// 8-state enum — mirrors `packages/types/src/index.ts` `TRDCStatus`.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum Status {
    PendingCustody,
    ActiveInCustody,
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
    pub asset_id: Pubkey,
    pub created_at: i64,
    pub doc_hash: [u8; 32],
    pub _reserved: [u8; 32],
}

impl TRDCState {
    pub const SIZE: usize = 8 + 32 + 2 + 8 + 8 + 8 + 1 + 32 + 8 + 32 + 32;
                          //  disc + loan_id + status + apraisal + loan_amt + due_ts + bump + asset_id + created_at + doc_hash + reserved
    pub const SEED: &'static [u8] = b"trdc_state";

    pub fn transition(&mut self, next: Status) -> Result<()> {
        require!(
            self.status.can_transition_to(next),
            crate::errors::TrdcError::InvalidStateTransition
        );
        self.status = next;
        Ok(())
    }
}

impl Status {
    pub fn can_transition_to(self, next: Status) -> bool {
        use Status::*;
        matches!(
            (self, next),
            (PendingCustody, ActiveInCustody)
                | (ActiveInCustody, Active)
                | (Active, Renewed)
                | (Active, Repaid)
                | (Active, Overdue)
                | (Renewed, Active)
                | (Renewed, Overdue)
                | (Renewed, Repaid)
                | (Overdue, Repaid)
                | (Overdue, Defaulted)
                | (Defaulted, Liquidated)
        )
    }
}
