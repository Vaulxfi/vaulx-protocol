import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, createMint } from "@solana/spl-token";
import { expect } from "chai";

describe("vault / initialize_vault", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.Vault as Program<any>;
  const provider = anchor.getProvider() as anchor.AnchorProvider;
  let assetMint: PublicKey;

  before(async () => {
    assetMint = await createMint(
      provider.connection,
      (provider.wallet as any).payer,
      provider.publicKey, null, 6,
    );
  });

  it("initializes vault with share_mint owned by the vault PDA", async () => {
    const [vaultPda, bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), assetMint.toBuffer()], program.programId,
    );
    const shareMint = Keypair.generate();
    await program.methods.initializeVault().accounts({
      vault: vaultPda,
      assetMint,
      shareMint: shareMint.publicKey,
      payer: provider.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    }).signers([shareMint]).rpc();

    const v = await program.account.vault.fetch(vaultPda);
    expect(v.assetMint.toBase58()).to.eq(assetMint.toBase58());
    expect(v.shareMint.toBase58()).to.eq(shareMint.publicKey.toBase58());
    expect(v.totalAssets.toString()).to.eq("0");
    expect(v.totalShares.toString()).to.eq("0");
    expect(v.bump).to.eq(bump);
  });

  it("cannot initialize twice for the same asset_mint", async () => {
    const [vaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), assetMint.toBuffer()], program.programId,
    );
    const shareMint2 = Keypair.generate();
    let threw = false;
    try {
      await program.methods.initializeVault().accounts({
        vault: vaultPda,
        assetMint,
        shareMint: shareMint2.publicKey,
        payer: provider.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      }).signers([shareMint2]).rpc();
    } catch { threw = true; }
    expect(threw).to.eq(true);
  });
});
