/**
 * POST /api/admin/demo/repay
 *
 * Demo moment 05 — the borrower (demo-wallets[1]) calls `repay_ccb` to pay
 * off the remaining principal + accrued interest. Flips the TRDC to Repaid.
 *
 * Body: `{ trdc: string }`.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { BN } from "@coral-xyz/anchor";
import { PublicKey, SYSVAR_INSTRUCTIONS_PUBKEY } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  getAccount,
  getAssociatedTokenAddressSync,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";

import {
  checkAdminAuth,
  demoErrorResponse,
  deriveLoanAuthorityPda,
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
    const lender = demoWallets[0];

    // Make sure borrower has enough USDC to cover payoff. For demo ergonomics
    // we let the lender top them up on the fly if short (we seeded lender
    // with 2k USDC originally).
    const borrowerAtaAcc = await getOrCreateAssociatedTokenAccount(
      conn,
      payer,
      usdcMint,
      borrower.publicKey,
    );
    const lenderAtaAcc = await getOrCreateAssociatedTokenAccount(
      conn,
      payer,
      usdcMint,
      lender.publicKey,
    );

    const trdcAcc = (await (trdcProgram.account as any).trdcState.fetch(
      trdcPda,
    )) as { principalRemaining: BN | string | number; rateBps: BN | string | number };
    const principalAtoms = new BN(trdcAcc.principalRemaining.toString());

    // Loose upper bound on payoff for demo funding: principal + 5% buffer.
    const fundingTarget = principalAtoms.mul(new BN(105)).div(new BN(100));

    const borrowerBal = (await getAccount(conn, borrowerAtaAcc.address)).amount;
    if (BigInt(borrowerBal) < BigInt(fundingTarget.toString())) {
      const shortfall =
        BigInt(fundingTarget.toString()) - BigInt(borrowerBal);
      const lenderBal = (await getAccount(conn, lenderAtaAcc.address)).amount;
      if (lenderBal < shortfall) {
        return Response.json(
          {
            ok: false,
            detail: `Borrower short ${shortfall.toString()} atoms and lender cannot cover (${lenderBal.toString()}). Re-run seed:usdc.`,
          },
          { status: 503 },
        );
      }
      // SPL transfer from lender to borrower; fee-paid by payer.
      const { createTransferInstruction } = await import("@solana/spl-token");
      const { Transaction, sendAndConfirmTransaction } = await import(
        "@solana/web3.js"
      );
      const tx = new Transaction().add(
        createTransferInstruction(
          lenderAtaAcc.address,
          borrowerAtaAcc.address,
          lender.publicKey,
          shortfall,
        ),
      );
      await sendAndConfirmTransaction(conn, tx, [payer, lender], {
        commitment: "confirmed",
      });
    }

    const vaultPda = deriveVaultPda(usdcMint, vaultProgramId);
    const vaultAta = getAssociatedTokenAddressSync(usdcMint, vaultPda, true);
    const loanAuthorityPda = deriveLoanAuthorityPda(loanProgramId);

    const sig: string = await (loanProgram.methods as any)
      .repayCcb()
      .accounts({
        trdcState: trdcPda,
        vault: vaultPda,
        assetMint: usdcMint,
        vaultAta,
        borrowerAta: borrowerAtaAcc.address,
        borrower: borrower.publicKey,
        loanAuthority: loanAuthorityPda,
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
      detail: `Borrower repaid loan (principal=${(
        Number(principalAtoms.toString()) / 1e6
      ).toFixed(2)} USDC + interest)`,
      state: {
        trdc: trdcPda.toBase58(),
        payoff: principalAtoms.toString(),
        rate_bps: String(trdcAcc.rateBps),
      },
    });
  } catch (err) {
    return demoErrorResponse(err);
  }
}
