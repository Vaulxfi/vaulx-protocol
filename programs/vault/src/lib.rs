use anchor_lang::prelude::*;

declare_id!("4PPyUvazjDBvFndGUL2rgKTwZrFbsSP1tk4a2uMhE9MS");

#[program]
pub mod vault {
    use super::*;

    pub fn ping(_ctx: Context<Ping>) -> Result<()> {
        msg!("vault ping");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Ping<'info> {
    pub signer: Signer<'info>,
}
