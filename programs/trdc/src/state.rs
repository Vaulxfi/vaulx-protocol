use anchor_lang::prelude::*;

/// Seed for the trdc-program-owned PDA that acts as the Bubblegum tree
/// `tree_creator_or_delegate`. The PDA — not the payer keypair — signs all
/// mints into the trdc merkle tree. This means no single key can forge TRDCs;
/// only program execution can.
pub const TREE_AUTHORITY_SEED: &[u8] = b"trdc_tree_authority";

/// Seed for the singleton `TrdcConfig` PDA. Holds the admin pubkey and the
/// canonical merkle-tree pubkey that `mint_trdc_cnft` is allowed to mint into.
/// Pinning the merkle_tree here (and constraining `mint_trdc_cnft`'s
/// `merkle_tree` account to it via Anchor `address = ...`) blocks the
/// account-substitution attack where a caller swaps in a tree they control.
pub const TRDC_CONFIG_SEED: &[u8] = b"trdc_config";

/// Bubblegum tree depth. We pick depth 14 = 16,384 leaves — enough for the
/// hackathon and small enough that the tree account fits comfortably.
pub const TREE_MAX_DEPTH: u32 = 14;
/// 2^14 = 16,384. Used to short-circuit `mint_trdc_cnft` with `TreeFull`
/// before invoking the Bubblegum CPI. SR-8.
pub const TREE_CAPACITY: u64 = 1u64 << TREE_MAX_DEPTH;

/// Derive the trdc tree-authority PDA.
pub fn tree_authority_pda(program_id: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[TREE_AUTHORITY_SEED], program_id)
}

/// Derive the trdc-config singleton PDA.
pub fn trdc_config_pda(program_id: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[TRDC_CONFIG_SEED], program_id)
}

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
    /// Bubblegum cNFT asset id assigned by `mint_trdc_cnft`. `Pubkey::default`
    /// until the mint succeeds; written exactly once.
    pub asset_id: Pubkey,
    pub created_at: i64,
    pub doc_hash: [u8; 32],
    /// Outstanding principal in USDC atoms. Starts = `loan_amount`,
    /// decrements on `pay_installment`, zeroed on `repay_ccb`.
    pub principal_remaining: u64,
    /// APR stored at mint-time (fixed-rate); lets `repay_ccb` / `renew_ccb`
    /// accrue interest on-chain without re-deriving from the term length.
    pub rate_bps: u64,
    /// Borrower pubkey captured at `initialize_trdc_state`. Used by
    /// `mint_trdc_cnft` to require that the signer is the same identity that
    /// originated the loan (SR-2).
    pub borrower: Pubkey,
    pub _reserved: [u8; 16],
}

impl TRDCState {
    // disc(8) + loan_id(32) + status(2) + appraisal(8) + loan_amt(8) + due_ts(8)
    // + bump(1) + asset_id(32) + created_at(8) + doc_hash(32)
    // + principal_remaining(8) + rate_bps(8) + borrower(32) + reserved(16) = 203
    pub const SIZE: usize = 8 + 32 + 2 + 8 + 8 + 8 + 1 + 32 + 8 + 32 + 8 + 8 + 32 + 16;
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

/// Singleton config PDA. Pins which merkle tree `mint_trdc_cnft` is allowed
/// to write into and identifies the admin authorized to (re)set it.
#[account]
pub struct TrdcConfig {
    pub admin: Pubkey,
    pub merkle_tree: Pubkey,
    pub bump: u8,
}

impl TrdcConfig {
    // disc(8) + admin(32) + merkle_tree(32) + bump(1) = 73
    pub const SIZE: usize = 8 + 32 + 32 + 1;
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
