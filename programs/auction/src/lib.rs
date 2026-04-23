use anchor_lang::prelude::*;

declare_id!("8FRBHN14CsA2y21hMeJJ2oxbEXNRXicVKMEDHRGyGefj");

#[program]
pub mod auction {
    use super::*;

    pub fn ping(_ctx: Context<Ping>) -> Result<()> {
        msg!("auction ping");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Ping<'info> {
    pub signer: Signer<'info>,
}
