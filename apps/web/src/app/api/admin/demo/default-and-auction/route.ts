/**
 * POST /api/admin/demo/default-and-auction
 *
 * Demo moment 06 — the full default → auction → bid → close flow, compressed
 * into a single request that runs ~10–15s on the wire.
 *
 * What it does:
 *   1. Mints a *parallel* TRDC with `due_ts = now - 4d` so the on-chain
 *      `GRACE_PERIOD_SECS` (3d) check passes immediately.
 *   2. Confirms custody (demo-wallets[2]) so the TRDC reaches ActiveInCustody.
 *   3. Disburses to the borrower (demo-wallets[1]) — TRDC flips to Active.
 *   4. Calls `execute_af_default(duration_secs)` which transitions
 *      Active → Overdue → Defaulted and spawns an auction via CPI. In
 *      `fast=true` mode we pass `duration_secs=4`; otherwise 300.
 *   5. Places a winning bid from demo-wallets[3].
 *   6. Sleeps `duration_secs + 2` and calls `close_auction`.
 *
 * Query string: `?fast=true|false`.
 * Body: `{ trdc?: string, fast?: boolean }`. If `trdc` is supplied we reuse
 *       it (must be already Active + overdue). Otherwise we mint fresh.
 *
 * This handler is expected to block for ~10s on `fast=true`. The default
 * Next.js server route-handler timeout is generous on local Node; on Vercel
 * this will hit the function duration limit — the cockpit is local-only.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import crypto from "node:crypto";

import { BN } from "@coral-xyz/anchor";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createTransferInstruction,
  getAccount,
  getAssociatedTokenAddressSync,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";
import { rateForTermDays } from "@vaulx/terms";

import {
  checkAdminAuth,
  demoErrorResponse,
  deriveAuctionAuthorityPda,
  deriveAuctionPda,
  deriveLoanAuthorityPda,
  deriveLoanConfigPda,
  deriveTrdcStatePda,
  deriveVaultPda,
  loadDemoEnv,
} from "@/lib/admin/demo";

type Body = { trdc?: string; fast?: boolean };

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export async function POST(req: Request) {
  const gate = checkAdminAuth(req);
  if (gate) return gate;

  let body: Body = {};
  try {
    if (req.headers.get("content-type")?.includes("application/json")) {
      body = (await req.json()) as Body;
    }
  } catch {
    body = {};
  }
  const url = new URL(req.url);
  const fastParam = url.searchParams.get("fast");
  const fast = body.fast === true || fastParam === "true" || fastParam === "1";
  const durationSecs = fast ? 4 : 300;

  try {
    const env = await loadDemoEnv();
    const {
      conn,
      payer,
      demoWallets,
      usdcMint,
      loanProgram,
      trdcProgram,
      auctionProgram,
      loanProgramId,
      trdcProgramId,
      vaultProgramId,
      auctionProgramId,
    } = env;

    const borrower = demoWallets[1];
    const custodian = demoWallets[2];
    const bidder = demoWallets[3];

    // Fund bidder and borrower with ~0.01 SOL each if empty (signers need it).
    for (const kp of [borrower, custodian, bidder]) {
      const bal = await conn.getBalance(kp.publicKey);
      if (bal < 0.005 * LAMPORTS_PER_SOL) {
        try {
          const fundTx = new Transaction().add(
            SystemProgram.transfer({
              fromPubkey: payer.publicKey,
              toPubkey: kp.publicKey,
              lamports: 0.01 * LAMPORTS_PER_SOL,
            }),
          );
          await sendAndConfirmTransaction(conn, fundTx, [payer], {
            commitment: "confirmed",
          });
        } catch {
          /* best-effort */
        }
      }
    }

    const loanConfigPda = deriveLoanConfigPda(loanProgramId);
    const vaultPda = deriveVaultPda(usdcMint, vaultProgramId);
    const vaultAta = getAssociatedTokenAddressSync(usdcMint, vaultPda, true);
    const loanAuthorityPda = deriveLoanAuthorityPda(loanProgramId);

    const signatures: Record<string, string> = {};

    // -------- 1. Mint a fresh overdue TRDC (or reuse provided one). --------
    let trdcPda: PublicKey;
    let reservePriceHint = "0";
    if (body.trdc) {
      try {
        trdcPda = new PublicKey(body.trdc);
      } catch {
        return Response.json(
          { ok: false, detail: "Invalid `trdc` pubkey" },
          { status: 400 },
        );
      }
    } else {
      const loanId = Keypair.generate().publicKey;
      trdcPda = deriveTrdcStatePda(loanId, trdcProgramId);
      const appraisal = new BN("100000000"); // 100 USDC
      const loanAmount = appraisal.mul(new BN(6000)).div(new BN(10_000));
      const dueTs = new BN(Math.floor(Date.now() / 1000) - 4 * 86400);
      const assetHint = Array.from(crypto.randomBytes(32));

      const sigCreate: string = await (loanProgram.methods as any)
        .createCcbTrdc(
          loanId,
          appraisal,
          loanAmount,
          dueTs,
          new BN(rateForTermDays(30)),
          assetHint,
        )
        .accounts({
          trdcState: trdcPda,
          trdcProgram: trdcProgramId,
          payer: payer.publicKey,
          systemProgram: SystemProgram.programId,
          loanConfig: loanConfigPda,
          kycAttestation: SystemProgram.programId,
        })
        .rpc({ commitment: "confirmed" });
      signatures.create = sigCreate;

      // --- 2. Confirm custody. ---
      const docHash = Array.from(crypto.randomBytes(32));
      const sigCust: string = await (loanProgram.methods as any)
        .confirmCustody(docHash)
        .accounts({
          trdcState: trdcPda,
          loanConfig: loanConfigPda,
          trdcProgram: trdcProgramId,
          custodian: custodian.publicKey,
        })
        .signers([custodian])
        .rpc({ commitment: "confirmed" });
      signatures.confirm_custody = sigCust;

      // --- 3. Disburse to borrower. ---
      const borrowerAtaAcc = await getOrCreateAssociatedTokenAccount(
        conn,
        payer,
        usdcMint,
        borrower.publicKey,
      );
      const sigDisb: string = await (loanProgram.methods as any)
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
      signatures.disburse = sigDisb;

      reservePriceHint = loanAmount.toString();
    }

    // -------- 4. execute_af_default. --------
    const auctionPda = deriveAuctionPda(trdcPda, auctionProgramId);
    const escrowAta = getAssociatedTokenAddressSync(usdcMint, auctionPda, true);

    const sigDefault: string = await (loanProgram.methods as any)
      .executeAfDefault(new BN(durationSecs))
      .accounts({
        trdcState: trdcPda,
        loanConfig: loanConfigPda,
        auction: auctionPda,
        assetMint: usdcMint,
        escrowAta,
        vault: vaultPda,
        loanAuthority: loanAuthorityPda,
        payer: payer.publicKey,
        trdcProgram: trdcProgramId,
        auctionProgram: auctionProgramId,
        instructionsSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .rpc({ commitment: "confirmed" });
    signatures.default = sigDefault;

    // Read the auction to get reserve_price + end_ts.
    const auctionAcc = (await (auctionProgram.account as any).auction.fetch(
      auctionPda,
    )) as {
      reservePrice: BN | string | number;
      minIncrement: BN | string | number;
      endTs: BN | string | number;
      highBidder: PublicKey;
    };
    const reservePrice = new BN(auctionAcc.reservePrice.toString());
    const minIncrement = new BN(auctionAcc.minIncrement.toString());
    const endTs = Number(auctionAcc.endTs.toString());
    const winningBid = reservePrice.add(minIncrement);

    // -------- 5. Bidder places winning bid. --------
    const bidderAtaAcc = await getOrCreateAssociatedTokenAccount(
      conn,
      payer,
      usdcMint,
      bidder.publicKey,
    );

    // Ensure bidder has enough USDC to cover the bid. Top up from the lender
    // ATA if needed.
    const bidderBal = (await getAccount(conn, bidderAtaAcc.address)).amount;
    if (BigInt(bidderBal) < BigInt(winningBid.toString())) {
      const shortfall = BigInt(winningBid.toString()) - BigInt(bidderBal);
      const lender = demoWallets[0];
      const lenderAtaAcc = await getOrCreateAssociatedTokenAccount(
        conn,
        payer,
        usdcMint,
        lender.publicKey,
      );
      const lenderBal = (await getAccount(conn, lenderAtaAcc.address)).amount;
      if (lenderBal < shortfall) {
        return Response.json(
          {
            ok: false,
            detail: `Bidder short ${shortfall} atoms; lender cannot cover (${lenderBal}). Re-run seed:usdc.`,
          },
          { status: 503 },
        );
      }
      const topup = new Transaction().add(
        createTransferInstruction(
          lenderAtaAcc.address,
          bidderAtaAcc.address,
          lender.publicKey,
          shortfall,
        ),
      );
      await sendAndConfirmTransaction(conn, topup, [payer, lender], {
        commitment: "confirmed",
      });
    }

    const previousBidderAta = auctionAcc.highBidder.equals(PublicKey.default)
      ? bidderAtaAcc.address
      : getAssociatedTokenAddressSync(usdcMint, auctionAcc.highBidder);

    const sigBid: string = await (auctionProgram.methods as any)
      .placeBid(winningBid)
      .accounts({
        auction: auctionPda,
        assetMint: usdcMint,
        escrowAta,
        bidderAta: bidderAtaAcc.address,
        previousBidderAta,
        bidder: bidder.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([bidder])
      .rpc({ commitment: "confirmed" });
    signatures.bid = sigBid;

    // -------- 6. Wait past end_ts, then close. --------
    const nowSec = Math.floor(Date.now() / 1000);
    const waitMs = Math.max(0, (endTs + 2 - nowSec) * 1000);
    await sleep(waitMs);

    const auctionAuthorityPda = deriveAuctionAuthorityPda(auctionProgramId);

    const sigClose: string = await (auctionProgram.methods as any)
      .closeAuction()
      .accounts({
        auction: auctionPda,
        trdcState: trdcPda,
        assetMint: usdcMint,
        escrowAta,
        vaultAta,
        vault: vaultPda,
        auctionAuthority: auctionAuthorityPda,
        instructionsSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
        trdcProgram: trdcProgramId,
        vaultProgram: vaultProgramId,
        tokenProgram: TOKEN_PROGRAM_ID,
        caller: payer.publicKey,
      })
      .rpc({ commitment: "confirmed" });
    signatures.close = sigClose;

    return Response.json({
      ok: true,
      signature: sigClose,
      signatures,
      detail: `Default → auction cycle complete: reserve=${(
        Number(reservePrice.toString()) / 1e6
      ).toFixed(2)} USDC, winning bid=${(
        Number(winningBid.toString()) / 1e6
      ).toFixed(2)} USDC`,
      state: {
        trdc: trdcPda.toBase58(),
        auction: auctionPda.toBase58(),
        reserve_price: reservePrice.toString(),
        winning_bid: winningBid.toString(),
        duration_secs: durationSecs,
        fast,
        reserve_price_hint: reservePriceHint,
      },
    });
  } catch (err) {
    return demoErrorResponse(err);
  }
}
