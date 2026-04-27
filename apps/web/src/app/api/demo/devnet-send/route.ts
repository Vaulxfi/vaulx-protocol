import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  clusterApiUrl,
} from "@solana/web3.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/demo/devnet-send
// Body: { destination: string (base58 pubkey), lamports?: number }
//
// Demo-only flow: signs a real Devnet SystemProgram.transfer with the project's
// payer keypair (loaded from ~/.config/solana/id.json on the server). On Vercel
// (or any host without that keypair on disk), returns 503 with a friendly
// "local-demo-only" reason that the page renders as an info card.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const dest = (body as { destination?: unknown }).destination;
  const lamports = Number(
    (body as { lamports?: unknown }).lamports ?? 1_000_000,
  ); // 0.001 SOL default

  if (typeof dest !== "string" || dest.length === 0) {
    return NextResponse.json(
      { ok: false, error: "missing destination" },
      { status: 400 },
    );
  }

  let destPk: PublicKey;
  try {
    destPk = new PublicKey(dest);
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid destination pubkey" },
      { status: 400 },
    );
  }

  const home = process.env.HOME;
  const payerPath = home ? path.join(home, ".config/solana/id.json") : null;
  const onVercel = !!process.env.VERCEL;
  if (!payerPath || !fs.existsSync(payerPath)) {
    return NextResponse.json(
      {
        ok: false,
        kind: "payer-unavailable",
        onVercel,
        error: "payer keypair not found on server",
        reason:
          "This demo route signs real Devnet transfers using a payer keypair stored at ~/.config/solana/id.json. The deployed environment doesn't have that file — run the demo locally to see a real on-chain transfer with a Solscan-verifiable signature.",
      },
      { status: 503 },
    );
  }

  let payer: Keypair;
  try {
    payer = Keypair.fromSecretKey(
      new Uint8Array(JSON.parse(fs.readFileSync(payerPath, "utf8"))),
    );
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: `failed to load payer: ${String(err)}` },
      { status: 500 },
    );
  }

  const rpc = process.env.NEXT_PUBLIC_RPC_URL ?? clusterApiUrl("devnet");
  const conn = new Connection(rpc, "confirmed");

  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: payer.publicKey,
      toPubkey: destPk,
      lamports,
    }),
  );

  try {
    const signature = await sendAndConfirmTransaction(conn, tx, [payer], {
      commitment: "confirmed",
    });
    return NextResponse.json({
      ok: true,
      signature,
      lamports,
      destination: dest,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 },
    );
  }
}
