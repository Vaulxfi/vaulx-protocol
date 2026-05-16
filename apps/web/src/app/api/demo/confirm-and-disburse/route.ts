/**
 * POST /api/demo/confirm-and-disburse
 *
 * Phase 2 of the FE-signing flow (paired with
 * `/api/demo/build-create-ccb-tx`). The borrower has already signed and
 * submitted `create_ccb_trdc`, leaving the TRDCState in `PendingCustody`
 * with `trdc_state.borrower == borrowerPubkey`. This route:
 *
 *   1. Polls until the trdc_state PDA exists and is owned by trdc.
 *   2. Reads `trdc_state.borrower` (= the borrower's pubkey) and
 *      `trdc_state.ref_bytes` (= sha256(watchRef) when oracle is on).
 *   3. Calls `loan.confirm_custody(doc_hash)` with the full 13-account
 *      atomic shape: trdc_state, loan_config, trdc_program, custodian,
 *      vault, asset_mint, vault_ata, borrower_ata, loan_authority,
 *      vault_program, token_program, instructions_sysvar, price_feed.
 *      Operator signs as `custodian`; the ix flips Pending → Active and
 *      atomically disburses principal into `borrower_ata`.
 *
 * Body (JSON):
 *   {
 *     loanId: string;             // base58 — the loan_id used in step 1
 *     borrowerPubkey?: string;    // base58 — optional sanity check
 *   }
 *
 * Response:
 *   {
 *     ok: true,
 *     custodyTx, trdcStatePda, borrowerAta, vault, vaultAta, docHashHex,
 *     borrowerBalanceBefore, borrowerBalanceAfter,
 *   }
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import {
  AnchorProvider,
  Program,
  type Idl,
} from "@coral-xyz/anchor";
import {
  TOKEN_PROGRAM_ID,
  getAccount,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import {
  Connection,
  PublicKey,
  SystemProgram,
  SYSVAR_INSTRUCTIONS_PUBKEY,
} from "@solana/web3.js";
import {
  loan as loanFacade,
  trdc as trdcFacade,
  vault as vaultFacade,
} from "@vaulx/anchor-client";

import {
  checkAdminAuth,
  demoErrorResponse,
  DemoEnvError,
  deriveLoanAuthorityPda,
  deriveLoanConfigPda,
  derivePriceFeedPda,
  deriveTrdcStatePda,
  deriveVaultPda,
  loadOperatorKeypair,
  walletFromKeypair,
} from "@/lib/admin/demo";

type Body = {
  loanId?: string;
  borrowerPubkey?: string;
};

function resolveUsdcMint(): PublicKey {
  const envMint = process.env.NEXT_PUBLIC_USDC_MINT?.trim();
  if (envMint) return new PublicKey(envMint);
  const repoRoot = path.resolve(process.cwd(), "..", "..");
  const edsonFile = path.join(repoRoot, "scripts", "dev", "edson-devnet.json");
  if (fs.existsSync(edsonFile)) {
    const data = JSON.parse(fs.readFileSync(edsonFile, "utf8"));
    if (data.assetMint) return new PublicKey(data.assetMint);
  }
  const usdcFile = path.join(repoRoot, "scripts", "dev", "devnet-usdc.json");
  if (fs.existsSync(usdcFile)) {
    const data = JSON.parse(fs.readFileSync(usdcFile, "utf8"));
    if (data.mint) return new PublicKey(data.mint);
  }
  throw new DemoEnvError(
    "USDC mint unresolved. Set NEXT_PUBLIC_USDC_MINT on Vercel.",
  );
}

async function pollTrdcState(
  conn: Connection,
  trdcProgram: Program<Idl>,
  trdcPda: PublicKey,
  trdcProgramId: PublicKey,
  timeoutMs = 15_000,
): Promise<{ borrower: PublicKey; refBytes: number[] }> {
  const start = Date.now();
  let lastErr: unknown = null;
  while (Date.now() - start < timeoutMs) {
    const info = await conn.getAccountInfo(trdcPda);
    if (info && info.owner.equals(trdcProgramId)) {
      try {
        const state = await (trdcProgram.account as any).trdcState.fetch(
          trdcPda,
        );
        return {
          borrower: new PublicKey(state.borrower),
          refBytes: Array.from(state.refBytes ?? state.ref_bytes ?? []),
        };
      } catch (e) {
        lastErr = e;
      }
    }
    await new Promise((r) => setTimeout(r, 750));
  }
  throw new DemoEnvError(
    `trdc_state ${trdcPda.toBase58()} not found within ${timeoutMs}ms after create_ccb_trdc. Did the client submit the signed tx?${
      lastErr ? ` Last decode error: ${String(lastErr)}` : ""
    }`,
    409,
  );
}

export async function POST(req: Request) {
  const gate = checkAdminAuth(req);
  if (gate) return gate;

  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    body = {};
  }

  if (!body.loanId || typeof body.loanId !== "string") {
    return Response.json(
      { ok: false, detail: "Missing `loanId` (base58)." },
      { status: 400 },
    );
  }
  let loanId: PublicKey;
  try {
    loanId = new PublicKey(body.loanId);
  } catch {
    return Response.json(
      { ok: false, detail: "Invalid `loanId` — not a base58 pubkey." },
      { status: 400 },
    );
  }

  try {
    const payer = loadOperatorKeypair();
    const rpc = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
    const conn = new Connection(rpc, "confirmed");
    const provider = new AnchorProvider(conn, walletFromKeypair(payer), {
      commitment: "confirmed",
    });

    const loanProgramId = new PublicKey(loanFacade.programId);
    const trdcProgramId = new PublicKey(trdcFacade.programId);
    const vaultProgramId = new PublicKey(vaultFacade.programId);
    const loanProgram = loanFacade.program(provider) as Program<Idl>;
    const trdcProgram = trdcFacade.program(provider) as Program<Idl>;

    const trdcPda = deriveTrdcStatePda(loanId, trdcProgramId);
    const loanConfigPda = deriveLoanConfigPda(loanProgramId);
    const loanAuthorityPda = deriveLoanAuthorityPda(loanProgramId);
    const assetMint = resolveUsdcMint();
    const vaultPda = deriveVaultPda(assetMint, vaultProgramId);
    const vaultAta = getAssociatedTokenAddressSync(assetMint, vaultPda, true);

    // Verify loan_config.custodian == operator before we waste a poll.
    const cfg = await (loanProgram.account as any).loanConfig.fetchNullable(
      loanConfigPda,
    );
    if (!cfg) {
      throw new DemoEnvError(
        `loan_config PDA ${loanConfigPda.toBase58()} not initialized.`,
      );
    }
    const custodianPk = new PublicKey(cfg.custodian);
    if (!custodianPk.equals(payer.publicKey)) {
      throw new DemoEnvError(
        `loan_config.custodian (${custodianPk.toBase58()}) does not match operator (${payer.publicKey.toBase58()}).`,
      );
    }
    const oracleAdminPk = new PublicKey(
      cfg.oracleAdmin ?? cfg.oracle_admin ?? PublicKey.default.toBase58(),
    );
    const oracleOn = !oracleAdminPk.equals(PublicKey.default);

    // Poll the chain for trdc_state — the borrower may take a few seconds
    // to sign + submit + confirm their create_ccb_trdc tx.
    const trdcState = await pollTrdcState(
      conn,
      trdcProgram,
      trdcPda,
      trdcProgramId,
    );
    const borrower = trdcState.borrower;

    // Optional sanity check.
    if (body.borrowerPubkey) {
      try {
        const expected = new PublicKey(body.borrowerPubkey);
        if (!expected.equals(borrower)) {
          throw new DemoEnvError(
            `trdc_state.borrower (${borrower.toBase58()}) does not match supplied borrowerPubkey (${expected.toBase58()}).`,
          );
        }
      } catch (e) {
        if (e instanceof DemoEnvError) throw e;
        // Invalid base58 — fall through silently, optional field.
      }
    }

    const borrowerAta = getAssociatedTokenAddressSync(assetMint, borrower);

    // Snapshot pre-balances for the response (lets the smoke verify funds
    // moved). Both ATAs must exist by now — vault_ata was created by
    // initialize_vault, borrower_ata by the borrower's signed tx.
    const borrowerBalanceBefore = await conn
      .getTokenAccountBalance(borrowerAta)
      .then((r) => r.value.uiAmountString)
      .catch(() => null);

    // Compose price_feed: when oracle is on, the canonical PDA derived
    // from trdc_state.ref_bytes; otherwise SystemProgram (placeholder).
    let priceFeed: PublicKey = SystemProgram.programId;
    if (oracleOn) {
      const refBytes = new Uint8Array(trdcState.refBytes);
      if (refBytes.length !== 32 || refBytes.every((b) => b === 0)) {
        throw new DemoEnvError(
          "oracle is armed but trdc_state.ref_bytes is empty — was create_ccb_trdc built without a watchRef hash?",
        );
      }
      priceFeed = derivePriceFeedPda(refBytes, loanProgramId);
    }

    // Doc hash: deterministic from loanId + a marker string. Matches the
    // legacy provision-loan route for parity.
    const docHash = new Uint8Array(
      crypto
        .createHash("sha256")
        .update(loanId.toBuffer())
        .update("demo_custody")
        .digest(),
    );

    const custodyTx: string = await (loanProgram.methods as any)
      .confirmCustody(Array.from(docHash))
      .accounts({
        trdcState: trdcPda,
        loanConfig: loanConfigPda,
        trdcProgram: trdcProgramId,
        custodian: payer.publicKey,
        vault: vaultPda,
        assetMint,
        vaultAta,
        borrowerAta,
        loanAuthority: loanAuthorityPda,
        vaultProgram: vaultProgramId,
        tokenProgram: TOKEN_PROGRAM_ID,
        instructionsSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
        priceFeed,
      })
      .rpc({ commitment: "confirmed" });

    const borrowerBalanceAfter = await conn
      .getTokenAccountBalance(borrowerAta)
      .then((r) => r.value.uiAmountString)
      .catch(() => null);

    // Verify final TRDC state for the response.
    const finalState = await (trdcProgram.account as any).trdcState.fetch(
      trdcPda,
    );
    const finalStatus = Object.keys(finalState.status ?? {})[0] ?? "unknown";

    return Response.json({
      ok: true,
      custodyTx,
      trdcStatePda: trdcPda.toBase58(),
      borrowerPubkey: borrower.toBase58(),
      borrowerAta: borrowerAta.toBase58(),
      vault: vaultPda.toBase58(),
      vaultAta: vaultAta.toBase58(),
      assetMint: assetMint.toBase58(),
      priceFeedPda: oracleOn ? priceFeed.toBase58() : null,
      docHashHex: Buffer.from(docHash).toString("hex"),
      borrowerBalanceBefore,
      borrowerBalanceAfter,
      finalStatus,
    });
  } catch (err) {
    return demoErrorResponse(err);
  }
}
