import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import { Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  createMint,
  mintTo,
  createAssociatedTokenAccount,
  getAccount,
} from "@solana/spl-token";
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

describe("vault / deposit", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.Vault as Program<any>;
  const provider = anchor.getProvider() as anchor.AnchorProvider;
  const payer = (provider.wallet as any).payer as Keypair;

  // Fresh asset mint for this describe block (avoid collision with the initialize_vault block's vault).
  let assetMint: PublicKey;
  let shareMint: PublicKey;
  let vaultPda: PublicKey;
  let vaultAta: PublicKey;

  type Lender = {
    kp: Keypair;
    assetAta: PublicKey;
    shareAta: PublicKey;
  };
  const lenders: Lender[] = [];

  // 10_000 USDC at 6 decimals
  const LENDER_FUND = new BN("10000000000");

  async function setupLender(): Promise<Lender> {
    const kp = Keypair.generate();
    const sig = await provider.connection.requestAirdrop(kp.publicKey, 2 * LAMPORTS_PER_SOL);
    await provider.connection.confirmTransaction(sig, "confirmed");

    const assetAta = await createAssociatedTokenAccount(
      provider.connection, payer, assetMint, kp.publicKey,
    );
    await mintTo(
      provider.connection, payer, assetMint, assetAta, payer, BigInt(LENDER_FUND.toString()),
    );
    const shareAta = await createAssociatedTokenAccount(
      provider.connection, payer, shareMint, kp.publicKey,
    );
    return { kp, assetAta, shareAta };
  }

  async function deposit(lender: Lender, amount: BN) {
    await program.methods.deposit(amount).accounts({
      vault: vaultPda,
      assetMint,
      shareMint,
      vaultAta,
      depositorAta: lender.assetAta,
      depositorShareAta: lender.shareAta,
      depositor: lender.kp.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
    }).signers([lender.kp]).rpc();
  }

  before(async () => {
    assetMint = await createMint(
      provider.connection, payer, provider.publicKey, null, 6,
    );

    [vaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), assetMint.toBuffer()], program.programId,
    );

    const shareMintKp = Keypair.generate();
    shareMint = shareMintKp.publicKey;
    await program.methods.initializeVault().accounts({
      vault: vaultPda,
      assetMint,
      shareMint,
      payer: provider.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    }).signers([shareMintKp]).rpc();

    // Create vault_ata (owner = vault PDA, off-curve).
    vaultAta = await createAssociatedTokenAccount(
      provider.connection, payer, assetMint, vaultPda, undefined, undefined, undefined, true,
    );

    // Three lenders with 10_000 USDC each.
    lenders.push(await setupLender());
    lenders.push(await setupLender());
    lenders.push(await setupLender());
  });

  it("test_first_deposit_is_one_to_one", async () => {
    const amount = new BN("1000000000"); // 1000 USDC
    await deposit(lenders[0], amount);

    const shareAcc = await getAccount(provider.connection, lenders[0].shareAta);
    expect(shareAcc.amount.toString()).to.eq("1000000000");

    const v = await program.account.vault.fetch(vaultPda);
    expect(v.totalAssets.toString()).to.eq("1000000000");
    expect(v.totalShares.toString()).to.eq("1000000000");
  });

  it("test_second_deposit_rounds_down", async () => {
    // State entering this test (from previous test): total_assets = total_shares = 1_000_000_000.
    // Simulate 500 USDC of yield:
    //  (a) mintTo 500 USDC directly into vault_ata (keeps token balance coherent)
    //  (b) call test_donate_assets(500_000_000) to bump vault.total_assets without minting shares
    const donation = new BN("500000000");
    await mintTo(
      provider.connection, payer, assetMint, vaultAta, payer, BigInt(donation.toString()),
    );
    await program.methods.testDonateAssets(donation).accounts({
      vault: vaultPda,
      assetMint,
    }).rpc();

    const vBefore = await program.account.vault.fetch(vaultPda);
    expect(vBefore.totalAssets.toString()).to.eq("1500000000");
    expect(vBefore.totalShares.toString()).to.eq("1000000000");

    // bob deposits 333_000_000 → floor(333_000_000 * 1_000_000_000 / 1_500_000_000) = 222_000_000
    const depositAmt = new BN("333000000");
    const bobShareBefore = (await getAccount(provider.connection, lenders[1].shareAta)).amount;
    await deposit(lenders[1], depositAmt);
    const bobShareAfter = (await getAccount(provider.connection, lenders[1].shareAta)).amount;
    const minted = bobShareAfter - bobShareBefore;
    expect(minted.toString()).to.eq("222000000");

    const v = await program.account.vault.fetch(vaultPda);
    expect(v.totalAssets.toString()).to.eq("1833000000"); // 1.5e9 + 333e6
    expect(v.totalShares.toString()).to.eq("1222000000"); // 1e9 + 222e6
  });

  it("test_vault_share_accounting", async () => {
    // Three more deposits in varied amounts, from varied lenders, on top of existing state.
    // After: sum(lender share balances) === vault.totalShares
    //        vault_ata.amount === vault.totalAssets
    const amounts = [
      new BN("777000000"),  // 777 USDC from lender 2
      new BN("123000000"),  // 123 USDC from lender 0
      new BN("456000000"),  // 456 USDC from lender 2
    ];
    const who = [lenders[2], lenders[0], lenders[2]];
    for (let i = 0; i < amounts.length; i++) {
      await deposit(who[i], amounts[i]);
    }

    const v = await program.account.vault.fetch(vaultPda);

    let sumShares = 0n;
    for (const l of lenders) {
      const bal = (await getAccount(provider.connection, l.shareAta)).amount;
      sumShares += bal;
    }
    expect(sumShares.toString()).to.eq(v.totalShares.toString());

    const vaultAtaAcc = await getAccount(provider.connection, vaultAta);
    expect(vaultAtaAcc.amount.toString()).to.eq(v.totalAssets.toString());
  });

  it("rejects zero amount deposit", async () => {
    let threw = false;
    try {
      await deposit(lenders[0], new BN(0));
    } catch { threw = true; }
    expect(threw).to.eq(true);
  });
});
