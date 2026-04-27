use anchor_lang::prelude::*;

/// Vaulx KYC attestation — issued by the vault admin (vault_config.admin)
/// after off-chain KYC verification (Civic Auth JWT). Replaces the sunset
/// Civic Pass on-chain gate.
///
/// PDA seeds: `[b"kyc_attestation", owner.as_ref()]`. One attestation per
/// (program, owner). Re-issuance requires the admin to close the existing
/// account first (not implemented here — out of scope for Task 1.3).
#[account]
pub struct KycAttestation {
    pub owner: Pubkey,
    pub attestor: Pubkey,
    pub attested_at: i64,
    pub jwt_hash: [u8; 32],
    pub bump: u8,
}

impl KycAttestation {
    pub const SIZE: usize = 8 + 32 + 32 + 8 + 32 + 1;
    pub const SEED: &'static [u8] = b"kyc_attestation";

    pub fn pda(owner: &Pubkey, program_id: &Pubkey) -> (Pubkey, u8) {
        Pubkey::find_program_address(&[Self::SEED, owner.as_ref()], program_id)
    }
}
