use anchor_lang::prelude::*;

/// Civic Gateway program id — stable across mainnet/devnet.
///
/// Source of truth: `@identity.com/solana-gateway-ts` v0.12.0, exported as
/// `PROGRAM_ID` from `lib/constants.ts`. Verified on mainnet-beta.
pub const CIVIC_GATEWAY_PROGRAM: Pubkey = pubkey!("gatem74V238djXdzWnJf94Wo1DcnuGkfijbf3AuBhfs");

/// Verify that `gateway_token` is an active gateway token from
/// `expected_network` for `expected_owner`. Returns `Ok(())` iff all checks
/// pass.
///
/// Borsh layout (authoritative — matches `@identity.com/solana-gateway-ts`'s
/// `GatewayTokenData` schema):
///
///   version: [u8; 1]
///   parent_gateway_token: Option<Pubkey>
///   owner: Pubkey
///   owner_identity: Option<Pubkey>
///   gatekeeper_network: Pubkey
///   issuing_gatekeeper: Pubkey
///   state: u8 (0 = Active)
///   expiry: Option<u64>
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
        data.len() >= 1 + 1 + 32 + 1 + 32 + 32 + 1 + 1,
        crate::errors::LoanError::NoValidGatewayToken
    );

    let mut cursor = 0usize;
    cursor += 1; // version [u8; 1]

    let parent_disc = read_byte(&data, &mut cursor)?;
    if parent_disc == 1 {
        cursor = cursor
            .checked_add(32)
            .ok_or(error!(crate::errors::LoanError::NoValidGatewayToken))?;
    } else if parent_disc != 0 {
        return err!(crate::errors::LoanError::NoValidGatewayToken);
    }

    let owner = read_pubkey(&data, &mut cursor)?;
    require_keys_eq!(
        owner,
        *expected_owner,
        crate::errors::LoanError::NoValidGatewayToken
    );

    let identity_disc = read_byte(&data, &mut cursor)?;
    if identity_disc == 1 {
        cursor = cursor
            .checked_add(32)
            .ok_or(error!(crate::errors::LoanError::NoValidGatewayToken))?;
    } else if identity_disc != 0 {
        return err!(crate::errors::LoanError::NoValidGatewayToken);
    }

    let network = read_pubkey(&data, &mut cursor)?;
    require_keys_eq!(
        network,
        *expected_network,
        crate::errors::LoanError::NoValidGatewayToken
    );

    cursor = cursor
        .checked_add(32)
        .ok_or(error!(crate::errors::LoanError::NoValidGatewayToken))?;

    require!(
        cursor < data.len(),
        crate::errors::LoanError::NoValidGatewayToken
    );
    require!(
        data[cursor] == 0,
        crate::errors::LoanError::NoValidGatewayToken
    );
    cursor += 1;

    if cursor < data.len() {
        let expiry_disc = data[cursor];
        cursor += 1;
        if expiry_disc == 1 {
            require!(
                cursor + 8 <= data.len(),
                crate::errors::LoanError::NoValidGatewayToken
            );
            let expiry_bytes: [u8; 8] = data[cursor..cursor + 8]
                .try_into()
                .map_err(|_| error!(crate::errors::LoanError::NoValidGatewayToken))?;
            let expiry = i64::from_le_bytes(expiry_bytes);
            let now = Clock::get()?.unix_timestamp;
            require!(
                expiry > now,
                crate::errors::LoanError::NoValidGatewayToken
            );
        }
    }

    Ok(())
}

fn read_byte(data: &[u8], cursor: &mut usize) -> Result<u8> {
    require!(
        *cursor < data.len(),
        crate::errors::LoanError::NoValidGatewayToken
    );
    let b = data[*cursor];
    *cursor += 1;
    Ok(b)
}

fn read_pubkey(data: &[u8], cursor: &mut usize) -> Result<Pubkey> {
    require!(
        *cursor + 32 <= data.len(),
        crate::errors::LoanError::NoValidGatewayToken
    );
    let bytes: [u8; 32] = data[*cursor..*cursor + 32]
        .try_into()
        .map_err(|_| error!(crate::errors::LoanError::NoValidGatewayToken))?;
    *cursor += 32;
    Ok(Pubkey::new_from_array(bytes))
}
