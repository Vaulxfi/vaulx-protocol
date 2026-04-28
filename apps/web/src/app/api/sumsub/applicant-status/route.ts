/**
 * GET /api/sumsub/applicant-status?walletPubkey=...
 *
 * Returns the on-chain KYC state for a wallet. Used by:
 *   - <KycRequiredModal> polling after Sumsub completes (until SAS appears)
 *   - useKycGate() to decide whether to show the modal at all
 *
 * Returns:
 *   { ok: true, kyc: "verified", attestedAt, attestor, jwtHashShort, pda } if PDA exists
 *   { ok: true, kyc: "missing", pda } if PDA doesn't exist
 *
 * KycAttestation account layout (programs/vault/src/attestation.rs):
 *   8  disc
 *   32 owner
 *   32 attestor
 *   8  attested_at (i64 LE)
 *   32 jwt_hash
 *   1  bump
 */
import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";
import { derivePda } from "@/lib/sumsub/attestation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const walletStr = url.searchParams.get("walletPubkey");
  if (!walletStr || !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(walletStr)) {
    return NextResponse.json(
      { ok: false, detail: "walletPubkey must be a base58 Solana pubkey" },
      { status: 400 },
    );
  }

  let wallet: PublicKey;
  try {
    wallet = new PublicKey(walletStr);
  } catch {
    return NextResponse.json(
      { ok: false, detail: "invalid pubkey" },
      { status: 400 },
    );
  }

  const rpc = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
  const conn = new Connection(rpc, "confirmed");
  const pda = derivePda(wallet);
  const acc = await conn.getAccountInfo(pda);
  if (!acc) {
    return NextResponse.json({
      ok: true,
      kyc: "missing",
      pda: pda.toBase58(),
    });
  }

  const data = acc.data;
  const attestor = new PublicKey(data.subarray(40, 72));
  const attestedAt = Number(data.readBigInt64LE(72));
  const jwtHash = data.subarray(80, 112);
  return NextResponse.json({
    ok: true,
    kyc: "verified",
    pda: pda.toBase58(),
    attestor: attestor.toBase58(),
    attestedAt,
    jwtHashShort: Buffer.from(jwtHash.subarray(0, 8)).toString("hex"),
  });
}
