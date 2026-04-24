use anchor_lang::prelude::*;

/// Civic Gateway program id — stable across mainnet/devnet.
// TODO(civic-sdk-verify): confirm the canonical 32-byte Civic Gateway program
// id. Provided ground-truth `gatem74V238NmbRnHDf4XHJyqjx6YF3GHJqjUw1GJU` is 31
// bytes; Civic publishes `gatem74V238NmbRnHDf4XHJyqjx6YF3GHJqjUw1GJU9`.
pub const CIVIC_GATEWAY_PROGRAM: Pubkey = pubkey!("gatem74V238NmbRnHDf4XHJyqjx6YF3GHJqjUw1GJU9");

/// Verify that `gateway_token` is an active gateway token from
/// `expected_network` for `expected_owner`. Returns Ok(()) iff all checks pass.
///
/// TODO(civic-sdk-verify): PDA seeds + state-byte offset per current Civic SDK.
/// Borsh layout assumed: u8 version, Option<Pubkey> parent, Pubkey owner,
/// Pubkey network, Pubkey issuer, u8 state (0=Active).
pub fn verify_gateway_token(
    gateway_token: &AccountInfo,
    expected_owner: &Pubkey,
    expected_network: &Pubkey,
) -> Result<()> {
    require_keys_eq!(
        *gateway_token.owner,
        CIVIC_GATEWAY_PROGRAM,
        crate::errors::LoanError::NoValidGatewayToken
    );

    let data = gateway_token.try_borrow_data()?;
    require!(
        data.len() >= 1 + 1 + 32 + 32 + 32 + 1,
        crate::errors::LoanError::NoValidGatewayToken
    );

    let _version = data[0];
    let mut cursor = 1usize;
    let parent_disc = data[cursor];
    cursor += 1;
    if parent_disc == 1 {
        require!(
            data.len() >= cursor + 32 + 32 + 32 + 32 + 1,
            crate::errors::LoanError::NoValidGatewayToken
        );
        cursor += 32;
    } else if parent_disc != 0 {
        return err!(crate::errors::LoanError::NoValidGatewayToken);
    }

    let owner_bytes: [u8; 32] = data[cursor..cursor + 32]
        .try_into()
        .map_err(|_| error!(crate::errors::LoanError::NoValidGatewayToken))?;
    require_keys_eq!(
        Pubkey::new_from_array(owner_bytes),
        *expected_owner,
        crate::errors::LoanError::NoValidGatewayToken
    );
    cursor += 32;

    let net_bytes: [u8; 32] = data[cursor..cursor + 32]
        .try_into()
        .map_err(|_| error!(crate::errors::LoanError::NoValidGatewayToken))?;
    require_keys_eq!(
        Pubkey::new_from_array(net_bytes),
        *expected_network,
        crate::errors::LoanError::NoValidGatewayToken
    );
    cursor += 32;

    cursor += 32; // issuer

    require!(
        data[cursor] == 0,
        crate::errors::LoanError::NoValidGatewayToken
    );

    Ok(())
}
