use anchor_lang::prelude::*;

declare_id!("BHdxEKkfsyjERiz5XiUybDLquvoWRtF7r1zDgVCDZJow");

#[program]
pub mod loan {
    use super::*;

    pub fn ping(_ctx: Context<Ping>) -> Result<()> {
        msg!("loan ping");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Ping<'info> {
    pub signer: Signer<'info>,
}
