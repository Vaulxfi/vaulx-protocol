/**
 * POST /api/admin/demo/seed-pool
 *
 * Demo moment 01 — a lender (demo-wallets[0]) deposits 100 USDC into the
 * devnet vault. Mirrors `scripts/dev/moment-1-e2e.ts` but scoped to just the
 * deposit tx (assumes the vault is already initialized; if not, initializes
 * it first). No Supabase polling — this route is about driving an on-chain
 * tx and handing the signature back to the UI.
 *
 * Local-only: reads the operator keypair from `~/.config/solana/id.json` and
 * the demo wallets seed from `scripts/dev/demo-wallets.json`. Will 503 on
 * Vercel (no filesystem access).
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { BN } from "@coral-xyz/anchor";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAccount,
  getAssociatedTokenAddressSync,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";

import {
  checkAdminAuth,
  demoErrorResponse,
  deriveVaultConfigPda,
  deriveVaultPda,
  loadDemoEnv,
} from "@/lib/admin/demo";

const DEPOSIT_AMOUNT = new BN("100000000"); // 100 USDC @ 6 decimals

export async function POST(req: Request) {
  const gate = checkAdminAuth(req);
  if (gate) return gate;

  try {
    const env = await loadDemoEnv();
    const { conn, payer, demoWallets, usdcMint, vaultProgram, vaultProgramId } =
      env;

    const lender = demoWallets[0];
    const vaultPda = deriveVaultPda(usdcMint, vaultProgramId);
    const vaultConfigPda = deriveVaultConfigPda(vaultProgramId);

    // Ensure vault is initialized; borrow shareMint from existing account or
    // init a fresh one.
    let shareMint: PublicKey;
    const vaultAccInfo = await conn.getAccountInfo(vaultPda);
    if (vaultAccInfo) {
      const vaultAcc = (await (vaultProgram.account as any).vault.fetch(
        vaultPda,
      )) as { shareMint: PublicKey };
      shareMint = vaultAcc.shareMint;
    } else {
      const shareMintKp = Keypair.generate();
      await (vaultProgram.methods as any)
        .initializeVault()
        .accounts({
          vault: vaultPda,
          assetMint: usdcMint,
          shareMint: shareMintKp.publicKey,
          payer: payer.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .signers([shareMintKp])
        .rpc({ commitment: "confirmed" });
      shareMint = shareMintKp.publicKey;
    }

    // vault_config first-writer-wins (Civic disabled).
    const vaultCfg = await (
      vaultProgram.account as any
    ).vaultConfig.fetchNullable(vaultConfigPda);
    if (!vaultCfg) {
      await (vaultProgram.methods as any)
        .initializeVaultConfig(PublicKey.default)
        .accounts({
          vaultConfig: vaultConfigPda,
          admin: payer.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc({ commitment: "confirmed" });
    }

    // Vault ATA (off-curve owner) — payer funds the ATA creation if needed.
    const vaultAta = getAssociatedTokenAddressSync(usdcMint, vaultPda, true);
    const vaultAtaInfo = await conn.getAccountInfo(vaultAta);
    if (!vaultAtaInfo) {
      const tx = new Transaction().add(
        createAssociatedTokenAccountInstruction(
          payer.publicKey,
          vaultAta,
          vaultPda,
          usdcMint,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID,
        ),
      );
      await sendAndConfirmTransaction(conn, tx, [payer], {
        commitment: "confirmed",
      });
    }

    const depositorAta = await getOrCreateAssociatedTokenAccount(
      conn,
      payer,
      usdcMint,
      lender.publicKey,
    );
    const depositorShareAta = await getOrCreateAssociatedTokenAccount(
      conn,
      payer,
      shareMint,
      lender.publicKey,
    );

    const bal = await getAccount(conn, depositorAta.address);
    if (bal.amount < BigInt(DEPOSIT_AMOUNT.toString())) {
      return Response.json(
        {
          ok: false,
          detail: `Lender ${lender.publicKey.toBase58()} has ${bal.amount} USDC atoms; need ${DEPOSIT_AMOUNT.toString()}. Re-run seed:usdc.`,
        },
        { status: 503 },
      );
    }

    const sig: string = await (vaultProgram.methods as any)
      .deposit(DEPOSIT_AMOUNT)
      .accounts({
        vault: vaultPda,
        assetMint: usdcMint,
        shareMint,
        vaultAta,
        depositorAta: depositorAta.address,
        depositorShareAta: depositorShareAta.address,
        depositor: lender.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        vaultConfig: vaultConfigPda,
        kycAttestation: SystemProgram.programId,
          priceFeed: SystemProgram.programId,
      })
      .signers([lender])
      .rpc({ commitment: "confirmed" });

    return Response.json({
      ok: true,
      signature: sig,
      detail: `Lender deposited 100 USDC into vault ${vaultPda.toBase58()}`,
      state: {
        lender: lender.publicKey.toBase58(),
        vault: vaultPda.toBase58(),
        shareMint: shareMint.toBase58(),
        amount: DEPOSIT_AMOUNT.toString(),
      },
    });
  } catch (err) {
    return demoErrorResponse(err);
  }
}
