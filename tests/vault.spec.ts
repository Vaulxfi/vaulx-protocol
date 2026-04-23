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

describe("vault / withdraw", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.Vault as Program<any>;
  const provider = anchor.getProvider() as anchor.AnchorProvider;
  const payer = (provider.wallet as any).payer as Keypair;

  let assetMint: PublicKey;
  let shareMint: PublicKey;
  let vaultPda: PublicKey;
  let vaultAta: PublicKey;

  type Lender = {
    kp: Keypair;
    assetAta: PublicKey;
    shareAta: PublicKey;
  };

  const LENDER_FUND = new BN("10000000000"); // 10_000 USDC @ 6 decimals

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

  async function withdraw(lender: Lender, shares: BN) {
    await program.methods.withdraw(shares).accounts({
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

    vaultAta = await createAssociatedTokenAccount(
      provider.connection, payer, assetMint, vaultPda, undefined, undefined, undefined, true,
    );
  });

  it("roundtrips deposit + withdraw within 1 lamport", async () => {
    const lender = await setupLender();
    const startAsset = (await getAccount(provider.connection, lender.assetAta)).amount;

    const amount = new BN("1000000000"); // 1000 USDC
    await deposit(lender, amount);

    const shareBal = (await getAccount(provider.connection, lender.shareAta)).amount;
    expect(shareBal.toString()).to.not.eq("0");

    await withdraw(lender, new BN(shareBal.toString()));

    const endAsset = (await getAccount(provider.connection, lender.assetAta)).amount;
    const diff = startAsset > endAsset ? startAsset - endAsset : endAsset - startAsset;
    expect(diff <= 1n).to.eq(true);

    const shareAfter = (await getAccount(provider.connection, lender.shareAta)).amount;
    expect(shareAfter.toString()).to.eq("0");
  });

  it("withdraw more shares than owned reverts", async () => {
    const lender = await setupLender();
    const amount = new BN("500000000"); // 500 USDC
    await deposit(lender, amount);

    const shareBal = (await getAccount(provider.connection, lender.shareAta)).amount;
    const tooMany = new BN((shareBal + 1n).toString());

    let threw = false;
    try {
      await withdraw(lender, tooMany);
    } catch { threw = true; }
    expect(threw).to.eq(true);
  });
});

describe("vault / events", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.Vault as Program<any>;
  const provider = anchor.getProvider() as anchor.AnchorProvider;
  const payer = (provider.wallet as any).payer as Keypair;

  it("deposit emits a Deposited event", async () => {
    const assetMint = await createMint(
      provider.connection, payer, provider.publicKey, null, 6,
    );
    const [vaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), assetMint.toBuffer()], program.programId,
    );
    const shareMintKp = Keypair.generate();
    const shareMint = shareMintKp.publicKey;
    await program.methods.initializeVault().accounts({
      vault: vaultPda,
      assetMint,
      shareMint,
      payer: provider.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    }).signers([shareMintKp]).rpc();

    const vaultAta = await createAssociatedTokenAccount(
      provider.connection, payer, assetMint, vaultPda, undefined, undefined, undefined, true,
    );

    const depositor = Keypair.generate();
    const sig = await provider.connection.requestAirdrop(
      depositor.publicKey, 2 * LAMPORTS_PER_SOL,
    );
    await provider.connection.confirmTransaction(sig, "confirmed");
    const depositorAta = await createAssociatedTokenAccount(
      provider.connection, payer, assetMint, depositor.publicKey,
    );
    await mintTo(
      provider.connection, payer, assetMint, depositorAta, payer, BigInt("5000000000"),
    );
    const depositorShareAta = await createAssociatedTokenAccount(
      provider.connection, payer, shareMint, depositor.publicKey,
    );

    const captured: any[] = [];
    const parser = new anchor.EventParser(program.programId, program.coder);

    // Anchor 0.30 lowercases the first letter of event names in the runtime parser
    // (struct `Deposited` becomes "deposited"); addEventListener dispatches off the
    // same normalised name. Subscribe accordingly.
    const listener = program.addEventListener("deposited", (ev: any) => {
      captured.push(ev);
    });

    let sigDeposit: string;
    const amount = new BN("1000000000");
    try {
      sigDeposit = await program.methods.deposit(amount).accounts({
        vault: vaultPda,
        assetMint,
        shareMint,
        vaultAta,
        depositorAta,
        depositorShareAta,
        depositor: depositor.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      }).signers([depositor]).rpc();

      await new Promise((r) => setTimeout(r, 1500));
    } finally {
      await program.removeEventListener(listener);
    }

    // Fallback: parse the confirmed transaction's logs directly if the ws dropped.
    if (captured.length === 0) {
      await provider.connection.confirmTransaction(sigDeposit!, "confirmed");
      const tx = await provider.connection.getTransaction(sigDeposit!, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      });
      const logs = tx?.meta?.logMessages ?? [];
      for (const ev of parser.parseLogs(logs)) {
        if (ev.name === "deposited") captured.push(ev.data);
      }
    }

    expect(captured.length).to.be.greaterThan(0);
    const ev = captured[0];
    expect(ev.vault.toBase58()).to.eq(vaultPda.toBase58());
    expect(ev.depositor.toBase58()).to.eq(depositor.publicKey.toBase58());
    expect(ev.amount.toString()).to.eq(amount.toString());
    // first deposit: shares_minted == amount
    expect(ev.sharesMinted.toString()).to.eq(amount.toString());
  });
});

describe("vault / disburse", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.Vault as Program<any>;
  const provider = anchor.getProvider() as anchor.AnchorProvider;
  const payer = (provider.wallet as any).payer as Keypair;

  it("disburse returns DisburseNotYetImplemented", async () => {
    const assetMint = await createMint(
      provider.connection, payer, provider.publicKey, null, 6,
    );
    const [vaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), assetMint.toBuffer()], program.programId,
    );
    const shareMintKp = Keypair.generate();
    await program.methods.initializeVault().accounts({
      vault: vaultPda,
      assetMint,
      shareMint: shareMintKp.publicKey,
      payer: provider.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    }).signers([shareMintKp]).rpc();

    const vaultAta = await createAssociatedTokenAccount(
      provider.connection, payer, assetMint, vaultPda, undefined, undefined, undefined, true,
    );
    const borrower = Keypair.generate();
    const borrowerAta = await createAssociatedTokenAccount(
      provider.connection, payer, assetMint, borrower.publicKey,
    );

    let threw = false;
    let code: string | undefined;
    try {
      await program.methods.disburse(new BN(1)).accounts({
        vault: vaultPda,
        assetMint,
        vaultAta,
        borrowerAta,
        loanProgramAuthority: PublicKey.default,
        tokenProgram: TOKEN_PROGRAM_ID,
      }).rpc();
    } catch (e: any) {
      threw = true;
      code = e.error?.errorCode?.code ?? e.code;
    }
    expect(threw).to.eq(true);
    expect(code).to.eq("DisburseNotYetImplemented");
  });
});
