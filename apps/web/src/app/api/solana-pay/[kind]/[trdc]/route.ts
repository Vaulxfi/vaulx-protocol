import { NextResponse } from "next/server";
import { AnchorProvider, BN, type Idl, type Program } from "@coral-xyz/anchor";
import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { loan as loanFacade } from "@vaulx/anchor-client";

import { buildLoanIxAccounts } from "@/lib/chain/loan-accounts";
import { requireUsdcMint } from "@/lib/usdc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Kind = "pay" | "repay" | "renew";

const MEMO_PROGRAM_ID = new PublicKey(
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
);

// Tiny inline SVG icon — gold Vaulx dot + "V". Small square PNG-alternative
// that a wallet can render next to the transaction-request preview.
const VAULX_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#0A0B0D"/><circle cx="32" cy="22" r="6" fill="#C9A24A"/><text x="32" y="50" text-anchor="middle" font-family="Georgia,serif" font-size="22" font-weight="600" fill="#F5F3EC">V</text></svg>`;
const VAULX_ICON_DATA_URL = `data:image/svg+xml;base64,${Buffer.from(VAULX_ICON_SVG).toString("base64")}`;

function parseKind(raw: string): Kind | null {
  if (raw === "pay" || raw === "repay" || raw === "renew") return raw;
  return null;
}

function parsePubkey(raw: string): PublicKey | null {
  try {
    return new PublicKey(raw);
  } catch {
    return null;
  }
}

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: cors() });
}

/**
 * Solana Pay GET handler — the wallet preflights to discover metadata
 * before showing a "Pay" prompt to the user.
 */
export async function GET(
  _req: Request,
  { params }: { params: { kind: string; trdc: string } },
) {
  if (!parseKind(params.kind)) {
    return NextResponse.json(
      { error: "invalid kind" },
      { status: 400, headers: cors() },
    );
  }
  return NextResponse.json(
    { label: "Vaulx", icon: VAULX_ICON_DATA_URL },
    { status: 200, headers: cors() },
  );
}

interface PostBody {
  account?: string;
}

/**
 * Solana Pay POST handler — the wallet submits the user's pubkey; we build,
 * serialise, and return a transaction that the wallet then signs + submits.
 *
 * Kinds:
 *  - `pay`    → `loan.pay_installment(amount)`  (amount from ?amount=)
 *  - `repay`  → `loan.repay_ccb()`
 *  - `renew`  → `loan.renew_ccb(termDays, newDueTs, newRateBps)`
 */
export async function POST(
  req: Request,
  { params }: { params: { kind: string; trdc: string } },
) {
  const kind = parseKind(params.kind);
  if (!kind) {
    return NextResponse.json(
      { error: "invalid kind" },
      { status: 400, headers: cors() },
    );
  }

  const trdcPda = parsePubkey(params.trdc);
  if (!trdcPda) {
    return NextResponse.json(
      { error: "invalid trdc pda" },
      { status: 400, headers: cors() },
    );
  }

  let body: PostBody;
  try {
    body = (await req.json()) as PostBody;
  } catch {
    return NextResponse.json(
      { error: "invalid JSON body" },
      { status: 400, headers: cors() },
    );
  }

  const account = body.account ? parsePubkey(body.account) : null;
  if (!account) {
    return NextResponse.json(
      { error: "missing or invalid `account`" },
      { status: 400, headers: cors() },
    );
  }

  let assetMint: PublicKey;
  try {
    assetMint = requireUsdcMint();
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "USDC mint not configured" },
      { status: 500, headers: cors() },
    );
  }

  const rpcUrl =
    process.env.NEXT_PUBLIC_RPC_URL ?? "https://api.devnet.solana.com";
  const connection = new Connection(rpcUrl, "confirmed");

  const readonlyWallet = {
    publicKey: PublicKey.default,
    signTransaction: async <T,>(tx: T) => tx,
    signAllTransactions: async <T,>(txs: T[]) => txs,
  };
  const provider = new AnchorProvider(connection, readonlyWallet, {
    commitment: "confirmed",
  });
  const loanProgram = loanFacade.program(provider) as Program<Idl>;

  // Sanity-check that the TRDC actually exists on-chain.
  try {
    const info = await connection.getAccountInfo(trdcPda);
    if (!info) {
      return NextResponse.json(
        { error: "TRDC account not found on-chain" },
        { status: 404, headers: cors() },
      );
    }
  } catch (e) {
    return NextResponse.json(
      { error: "failed to fetch TRDC", detail: e instanceof Error ? e.message : String(e) },
      { status: 502, headers: cors() },
    );
  }

  const accounts = buildLoanIxAccounts({
    trdcPda,
    assetMint,
    borrower: account,
  });

  const url = new URL(req.url);
  let ix: TransactionInstruction;
  let messageSummary: string;

  try {
    if (kind === "pay") {
      const amountParam = url.searchParams.get("amount");
      if (!amountParam) {
        return NextResponse.json(
          { error: "`amount` query param is required for pay" },
          { status: 400, headers: cors() },
        );
      }
      let atoms: bigint;
      try {
        atoms = BigInt(amountParam);
      } catch {
        return NextResponse.json(
          { error: "`amount` must be an integer (USDC atoms × 1_000_000)" },
          { status: 400, headers: cors() },
        );
      }
      if (atoms <= 0n) {
        return NextResponse.json(
          { error: "`amount` must be > 0" },
          { status: 400, headers: cors() },
        );
      }
      ix = await (loanProgram.methods as any)
        .payInstallment(new BN(atoms.toString()))
        .accounts(accounts)
        .instruction();
      messageSummary = `Pay ${(Number(atoms) / 1_000_000).toFixed(2)} USDC on your Vaulx loan`;
    } else if (kind === "repay") {
      ix = await (loanProgram.methods as any)
        .repayCcb()
        .accounts(accounts)
        .instruction();
      messageSummary = "Pay off your Vaulx loan in full";
    } else {
      // renew
      const termDays = Number(url.searchParams.get("termDays") ?? "");
      const newDueTs = Number(url.searchParams.get("newDueTs") ?? "");
      const newRateBps = Number(url.searchParams.get("newRateBps") ?? "");
      if (!Number.isFinite(termDays) || termDays <= 0) {
        return NextResponse.json(
          { error: "`termDays` must be a positive integer" },
          { status: 400, headers: cors() },
        );
      }
      if (!Number.isFinite(newDueTs) || newDueTs <= 0) {
        return NextResponse.json(
          { error: "`newDueTs` must be a positive unix-seconds integer" },
          { status: 400, headers: cors() },
        );
      }
      if (!Number.isFinite(newRateBps) || newRateBps <= 0) {
        return NextResponse.json(
          { error: "`newRateBps` must be a positive integer" },
          { status: 400, headers: cors() },
        );
      }
      ix = await (loanProgram.methods as any)
        .renewCcb(new BN(termDays), new BN(newDueTs), new BN(newRateBps))
        .accounts(accounts)
        .instruction();
      messageSummary = `Renew your Vaulx loan for ${termDays} days`;
    }
  } catch (e) {
    return NextResponse.json(
      {
        error: "failed to build ix",
        detail: e instanceof Error ? e.message : String(e),
      },
      { status: 500, headers: cors() },
    );
  }

  // A short on-chain memo so the tx is identifiable on Solscan.
  const memoText = `VAULX ${kind.toUpperCase()} ${params.trdc.slice(0, 8)}`;
  const memoIx = new TransactionInstruction({
    keys: [],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(memoText, "utf8"),
  });

  const tx = new Transaction().add(ix, memoIx);
  tx.feePayer = account;
  try {
    const bh = await connection.getLatestBlockhash("confirmed");
    tx.recentBlockhash = bh.blockhash;
  } catch (e) {
    return NextResponse.json(
      {
        error: "failed to fetch blockhash",
        detail: e instanceof Error ? e.message : String(e),
      },
      { status: 502, headers: cors() },
    );
  }

  const serialized = tx.serialize({
    requireAllSignatures: false,
    verifySignatures: false,
  });

  return NextResponse.json(
    {
      transaction: serialized.toString("base64"),
      message: messageSummary,
    },
    { status: 200, headers: cors() },
  );
}

