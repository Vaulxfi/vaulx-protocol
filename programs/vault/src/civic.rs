// DEPRECATED — Civic Pass was sunset mid-2025. The gateway-token format this
// file parses is no longer issued by Civic. Retained as historical reference;
// not called by any live instruction. The replacement is a Vaulx-issued
// KycAttestation PDA (see programs/{vault,loan}/src/attestation.rs from Task 1.3).
//
// To temporarily restore the legacy gate for testing, gate this module behind
// the `civic-pass-legacy` feature in Cargo.toml.
#![allow(dead_code)]

use anchor_lang::prelude::*;

/// Civic Gateway program id — stable across mainnet/devnet.
///
/// Source of truth: `@identity.com/solana-gateway-ts` v0.12.0, exported as
/// `PROGRAM_ID` from `lib/constants.ts`. Verified on mainnet-beta via
/// `solana account <id> --url mainnet-beta` (executable, owner =
/// BPFLoaderUpgradeab1e).
pub const CIVIC_GATEWAY_PROGRAM: Pubkey = pubkey!("gatem74V238djXdzWnJf94Wo1DcnuGkfijbf3AuBhfs");

/// Verify that `gateway_token` is an active gateway token from
/// `expected_network` for `expected_owner`. Returns `Ok(())` iff all checks
/// pass.
///
/// Borsh layout (authoritative — matches `@identity.com/solana-gateway-ts`'s
/// `GatewayTokenData` schema in `lib/GatewayTokenData.js`):
///
///   version: [u8; 1]                              // 1 byte
///   parent_gateway_token: Option<Pubkey>          // 1 + (0 or 32)
///   owner: Pubkey                                 // 32
///   owner_identity: Option<Pubkey>                // 1 + (0 or 32)
///   gatekeeper_network: Pubkey                    // 32
///   issuing_gatekeeper: Pubkey                    // 32
///   state: enum { Active=0, Frozen=1, Revoked=2 } // 1 byte
///   // (Borsh enum order from `@identity.com/solana-gateway-ts`'s
///   //  GatewayTokenState schema — active, frozen, revoked.)
///   expiry: Option<u64>                           // 1 + (0 or 8)
///
/// This implementation is a zero-dep hand-rolled parser — the Civic SDK is a
/// TS/JS-only package, so we can't pull it into the program crate. Tested
/// against a real issued token in `tests/civic-happy-path.spec.ts`.
pub fn verify_gateway_token(
    gateway_token: &AccountInfo,
    expected_owner: &Pubkey,
    expected_network: &Pubkey,
) -> Result<()> {
    // 1. Owner is the Civic gateway program.
    require_keys_eq!(
        *gateway_token.owner,
        CIVIC_GATEWAY_PROGRAM,
        crate::errors::VaultError::NoValidGatewayToken
    );

    let data = gateway_token.try_borrow_data()?;
    // Minimum length with all Options = None:
    //   version(1) + parent_disc(1) + owner(32) + identity_disc(1) +
    //   network(32) + issuer(32) + state(1) + expiry_disc(1) = 101 bytes.
    require!(
        data.len() >= 1 + 1 + 32 + 1 + 32 + 32 + 1 + 1,
        crate::errors::VaultError::NoValidGatewayToken
    );

    let mut cursor = 0usize;

    // version: [u8; 1] — 1 byte, no length prefix (fixed-size array in Borsh).
    cursor += 1;

    // parent_gateway_token: Option<Pubkey>
    let parent_disc = read_byte(&data, &mut cursor)?;
    if parent_disc == 1 {
        cursor = cursor
            .checked_add(32)
            .ok_or(error!(crate::errors::VaultError::NoValidGatewayToken))?;
    } else if parent_disc != 0 {
        return err!(crate::errors::VaultError::NoValidGatewayToken);
    }

    // owner: Pubkey
    let owner = read_pubkey(&data, &mut cursor)?;
    require_keys_eq!(
        owner,
        *expected_owner,
        crate::errors::VaultError::NoValidGatewayToken
    );

    // owner_identity: Option<Pubkey> — SKIP
    let identity_disc = read_byte(&data, &mut cursor)?;
    if identity_disc == 1 {
        cursor = cursor
            .checked_add(32)
            .ok_or(error!(crate::errors::VaultError::NoValidGatewayToken))?;
    } else if identity_disc != 0 {
        return err!(crate::errors::VaultError::NoValidGatewayToken);
    }

    // gatekeeper_network: Pubkey
    let network = read_pubkey(&data, &mut cursor)?;
    require_keys_eq!(
        network,
        *expected_network,
        crate::errors::VaultError::NoValidGatewayToken
    );

    // issuing_gatekeeper: Pubkey — skip.
    cursor = cursor
        .checked_add(32)
        .ok_or(error!(crate::errors::VaultError::NoValidGatewayToken))?;

    // state: enum byte. 0 = Active.
    require!(
        cursor < data.len(),
        crate::errors::VaultError::NoValidGatewayToken
    );
    require!(
        data[cursor] == 0,
        crate::errors::VaultError::NoValidGatewayToken
    );
    cursor += 1;

    // expiry: Option<u64>. Enforce non-expired if Some.
    if cursor < data.len() {
        let expiry_disc = data[cursor];
        cursor += 1;
        if expiry_disc == 1 {
            require!(
                cursor + 8 <= data.len(),
                crate::errors::VaultError::NoValidGatewayToken
            );
            let expiry_bytes: [u8; 8] = data[cursor..cursor + 8]
                .try_into()
                .map_err(|_| error!(crate::errors::VaultError::NoValidGatewayToken))?;
            let expiry = i64::from_le_bytes(expiry_bytes);
            let now = Clock::get()?.unix_timestamp;
            require!(
                expiry > now,
                crate::errors::VaultError::NoValidGatewayToken
            );
        }
    }

    Ok(())
}

fn read_byte(data: &[u8], cursor: &mut usize) -> Result<u8> {
    require!(
        *cursor < data.len(),
        crate::errors::VaultError::NoValidGatewayToken
    );
    let b = data[*cursor];
    *cursor += 1;
    Ok(b)
}

fn read_pubkey(data: &[u8], cursor: &mut usize) -> Result<Pubkey> {
    require!(
        *cursor + 32 <= data.len(),
        crate::errors::VaultError::NoValidGatewayToken
    );
    let bytes: [u8; 32] = data[*cursor..*cursor + 32]
        .try_into()
        .map_err(|_| error!(crate::errors::VaultError::NoValidGatewayToken))?;
    *cursor += 32;
    Ok(Pubkey::new_from_array(bytes))
}
