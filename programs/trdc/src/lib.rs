use anchor_lang::prelude::*;

declare_id!("FcDPvRaixjAz7LeC64h9xkXPzvHT7dusbNmg83eJfr7R");

#[program]
pub mod trdc {
    use super::*;

    pub fn ping(_ctx: Context<Ping>) -> Result<()> {
        msg!("trdc ping");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Ping<'info> {
    pub signer: Signer<'info>,
}
