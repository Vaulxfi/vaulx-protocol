/**
 * POST /api/admin/demo/disburse
 *
 * Demo moment 04 — the borrower (demo-wallets[1]) calls `disburse_from_vault`
 * to pull their principal out of the vault. The amount is read from the
 * on-chain TRDC state (`loan_amount`) so the caller doesn't have to thread it
 * through.
 *
 * Body: `{ trdc: string }`.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { BN } from "@coral-xyz/anchor";
import { PublicKey, SYSVAR_INSTRUCTIONS_PUBKEY } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";

import {
  checkAdminAuth,
  demoErrorResponse,
  deriveLoanAuthorityPda,
  deriveLoanConfigPda,
  deriveVaultPda,
  loadDemoEnv,
} from "@/lib/admin/demo";

type Body = { trdc?: string };

export async function POST(req: Request) {
  const gate = checkAdminAuth(req);
  if (gate) return gate;

  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    body = {};
  }
  if (!body.trdc) {
    return Response.json(
      { ok: false, detail: "Missing `trdc` in body" },
      { status: 400 },
    );
  }

  let trdcPda: PublicKey;
  try {
    trdcPda = new PublicKey(body.trdc);
  } catch {
    return Response.json(
      { ok: false, detail: "Invalid `trdc` pubkey" },
      { status: 400 },
    );
  }

  try {
    const env = await loadDemoEnv();
    const {
      conn,
      payer,
      demoWallets,
      usdcMint,
      loanProgram,
      trdcProgram,
      loanProgramId,
      trdcProgramId,
      vaultProgramId,
    } = env;

    const borrower = demoWallets[1];

    // Read loan_amount off-chain so the UI doesn't have to pass it.
    const trdcAcc = (await (trdcProgram.account as any).trdcState.fetch(
      trdcPda,
    )) as { loanAmount: BN | string | number };
    const loanAmount = new BN(trdcAcc.loanAmount.toString());

    const vaultPda = deriveVaultPda(usdcMint, vaultProgramId);
    const vaultAta = getAssociatedTokenAddressSync(usdcMint, vaultPda, true);
    const borrowerAtaAcc = await getOrCreateAssociatedTokenAccount(
      conn,
      payer,
      usdcMint,
      borrower.publicKey,
    );
    const loanAuthorityPda = deriveLoanAuthorityPda(loanProgramId);
    const loanConfigPda = deriveLoanConfigPda(loanProgramId);

    const sig: string = await (loanProgram.methods as any)
      .disburseFromVault(loanAmount)
      .accounts({
        trdcState: trdcPda,
        loanConfig: loanConfigPda,
        vault: vaultPda,
        assetMint: usdcMint,
        vaultAta,
        borrowerAta: borrowerAtaAcc.address,
        loanAuthority: loanAuthorityPda,
        borrower: borrower.publicKey,
        trdcProgram: trdcProgramId,
        vaultProgram: vaultProgramId,
        tokenProgram: TOKEN_PROGRAM_ID,
        instructionsSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
      })
      .signers([borrower])
      .rpc({ commitment: "confirmed" });

    return Response.json({
      ok: true,
      signature: sig,
      detail: `Disbursed ${(Number(loanAmount.toString()) / 1e6).toFixed(2)} USDC to borrower`,
      state: {
        trdc: trdcPda.toBase58(),
        borrower: borrower.publicKey.toBase58(),
        amount: loanAmount.toString(),
      },
    });
  } catch (err) {
    return demoErrorResponse(err);
  }
}
