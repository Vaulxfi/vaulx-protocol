/**
 * POST /api/demo/faucet-usdc
 *
 * Phase D of the full-E2E demo: mints demo USDC to any pubkey so the
 * borrower has funds to repay a loan. The demo USDC mint
 * (`Er8wmBzC1X3m7BwDF5fUcwnJPe5UEWzeFUJXXjzvNiGy` on Devnet, set via
 * `NEXT_PUBLIC_USDC_MINT`) was created with the operator keypair as mint
 * authority — same key as Phase C (`OPERATOR_KEYPAIR_JSON` env var, falls
 * back to `~/.config/solana/id.json` for local).
 *
 * Why this exists: a Crossmint smart wallet provisioned on Devnet via
 * staging.crossmint.com starts with 0 USDC. To repay, the borrower needs
 * USDC in their account. This route gets it there.
 *
 * Body (JSON):
 *   {
 *     recipientPubkey: string;  // base58
 *     amount?: number;          // USDC (whole units); default 1000, max 10000
 *   }
 *
 * Response:
 *   { ok: true, tx, ata, atomsMinted }
 *
 * Auth: same admin gate as `/api/admin/demo/*` — open in demo mode unless
 * `NEXT_PUBLIC_VAULX_ADMIN_PUBKEY` is set.
 *
 * TODO(rate-limit): public route minting USDC. Add a per-IP limiter
 * (Upstash / Vercel KV) before mainnet — see `apps/web/src/lib/rate-limit/`.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { Connection, PublicKey } from "@solana/web3.js";
import {
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";

import {
  checkAdminAuth,
  demoErrorResponse,
  DemoEnvError,
  loadOperatorKeypair,
} from "@/lib/admin/demo";

type Body = {
  recipientPubkey?: string;
  amount?: number;
};

const DEFAULT_AMOUNT_USDC = 1000;
const MAX_AMOUNT_USDC = 10_000;
const USDC_DECIMALS = 6;

export async function POST(req: Request) {
  const gate = checkAdminAuth(req);
  if (gate) return gate;

  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    body = {};
  }

  if (!body.recipientPubkey || typeof body.recipientPubkey !== "string") {
    return Response.json(
      { ok: false, detail: "Missing `recipientPubkey` (base58)." },
      { status: 400 },
    );
  }
  let recipient: PublicKey;
  try {
    recipient = new PublicKey(body.recipientPubkey);
    if (recipient.toBytes().length !== 32) throw new Error("not 32 bytes");
  } catch {
    return Response.json(
      { ok: false, detail: "Invalid `recipientPubkey`." },
      { status: 400 },
    );
  }

  const amountUsdc = body.amount ?? DEFAULT_AMOUNT_USDC;
  if (
    typeof amountUsdc !== "number" ||
    !Number.isFinite(amountUsdc) ||
    amountUsdc < 1 ||
    amountUsdc > MAX_AMOUNT_USDC
  ) {
    return Response.json(
      {
        ok: false,
        detail: `\`amount\` must be a number in [1, ${MAX_AMOUNT_USDC}].`,
      },
      { status: 400 },
    );
  }

  try {
    const payer = loadOperatorKeypair();

    const mintBase58 = process.env.NEXT_PUBLIC_USDC_MINT?.trim();
    if (!mintBase58) {
      throw new DemoEnvError(
        "NEXT_PUBLIC_USDC_MINT is not set. Set the demo USDC mint in env (e.g. Er8wmBzC1X3m7BwDF5fUcwnJPe5UEWzeFUJXXjzvNiGy on Devnet).",
      );
    }
    let mint: PublicKey;
    try {
      mint = new PublicKey(mintBase58);
    } catch {
      throw new DemoEnvError(
        `NEXT_PUBLIC_USDC_MINT is not a valid pubkey: ${mintBase58}`,
      );
    }

    const rpc = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
    const conn = new Connection(rpc, "confirmed");

    // ATA — payer funds creation if missing. `getOrCreateAssociatedTokenAccount`
    // is idempotent.
    const ata = await getOrCreateAssociatedTokenAccount(
      conn,
      payer,
      mint,
      recipient,
    );

    const atomsMinted = BigInt(amountUsdc) * BigInt(10 ** USDC_DECIMALS);

    const tx = await mintTo(
      conn,
      payer,
      mint,
      ata.address,
      payer, // mint authority — operator key created the demo mint
      atomsMinted,
    );

    return Response.json({
      ok: true,
      tx,
      ata: ata.address.toBase58(),
      atomsMinted: atomsMinted.toString(),
      detail: `Minted ${amountUsdc} USDC to ${recipient.toBase58().slice(0, 8)}…`,
    });
  } catch (err) {
    return demoErrorResponse(err);
  }
}
