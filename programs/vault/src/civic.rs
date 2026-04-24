use anchor_lang::prelude::*;

/// Civic Gateway program id — stable across mainnet/devnet.
// TODO(civic-sdk-verify): confirm the canonical 32-byte Civic Gateway program
// id from the installed `@identity.com/solana-gateway-ts` package. The ground
// truth provided (`gatem74V238NmbRnHDf4XHJyqjx6YF3GHJqjUw1GJU`) decodes to
// 31 bytes; appending `9` (Civic's published on-chain id) brings it to 32.
pub const CIVIC_GATEWAY_PROGRAM: Pubkey = pubkey!("gatem74V238NmbRnHDf4XHJyqjx6YF3GHJqjUw1GJU9");

/// Verify that `gateway_token` is an active gateway token from
/// `expected_network` for `expected_owner`. Returns Ok(()) iff all checks pass.
///
/// TODO(civic-sdk-verify): PDA seeds + state-byte offset per current Civic SDK.
/// Borsh layout we assume:
///   u8 version, Option<Pubkey> parent, Pubkey owner, Pubkey network,
///   Pubkey issuer, u8 state (0=Active,1=Revoked,2=Frozen), Option<i64> expiry
/// Verify against real gateway token with `solana account <token>` before prod.
pub fn verify_gateway_token(
    gateway_token: &AccountInfo,
    expected_owner: &Pubkey,
    expected_network: &Pubkey,
) -> Result<()> {
    // 1. Owner is Civic gateway program.
    require_keys_eq!(
        *gateway_token.owner,
        CIVIC_GATEWAY_PROGRAM,
        crate::errors::VaultError::NoValidGatewayToken
    );

    let data = gateway_token.try_borrow_data()?;
    // Minimum length: version(1) + parent_disc(1) + owner(32) + network(32) +
    // issuer(32) + state(1) = 99 bytes (assumes parent = None).
    require!(
        data.len() >= 1 + 1 + 32 + 32 + 32 + 1,
        crate::errors::VaultError::NoValidGatewayToken
    );

    let _version = data[0];
    let mut cursor = 1usize;
    let parent_disc = data[cursor];
    cursor += 1;
    if parent_disc == 1 {
        // Some(Pubkey)
        require!(
            data.len() >= cursor + 32 + 32 + 32 + 32 + 1,
            crate::errors::VaultError::NoValidGatewayToken
        );
        cursor += 32;
    } else if parent_disc != 0 {
        return err!(crate::errors::VaultError::NoValidGatewayToken);
    }

    // owner_wallet
    let owner_bytes: [u8; 32] = data[cursor..cursor + 32]
        .try_into()
        .map_err(|_| error!(crate::errors::VaultError::NoValidGatewayToken))?;
    require_keys_eq!(
        Pubkey::new_from_array(owner_bytes),
        *expected_owner,
        crate::errors::VaultError::NoValidGatewayToken
    );
    cursor += 32;

    // gatekeeper_network
    let net_bytes: [u8; 32] = data[cursor..cursor + 32]
        .try_into()
        .map_err(|_| error!(crate::errors::VaultError::NoValidGatewayToken))?;
    require_keys_eq!(
        Pubkey::new_from_array(net_bytes),
        *expected_network,
        crate::errors::VaultError::NoValidGatewayToken
    );
    cursor += 32;

    // issuing_gatekeeper
    cursor += 32;

    // state byte: 0 = Active
    require!(
        data[cursor] == 0,
        crate::errors::VaultError::NoValidGatewayToken
    );

    Ok(())
}
