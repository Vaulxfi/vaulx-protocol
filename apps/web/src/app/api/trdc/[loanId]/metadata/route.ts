import { NextResponse } from "next/server";
import { Connection } from "@solana/web3.js";

import { loadTrdcState } from "@/lib/chain/trdc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Vaulx-hosted Metaplex metadata for a TRDC cNFT.
 *
 * GET /api/trdc/[loanId]/metadata
 *
 * Solscan / Phantom / Backpack / DAS API consumers fetch this URL when they
 * resolve the `uri` field set on-chain in `mint_trdc_cnft` (Task 4.2). The
 * route is the off-chain leg of the SR-6 tamper-resistance design:
 *
 *   1. The on-chain cNFT `name` field carries the appraisal-hash short-form,
 *      so Solscan shows it directly without trusting any URL.
 *   2. THIS route reads `TRDCState` on-chain by `loan_id` and renders every
 *      substantive field from on-chain data — never from URL params.
 *
 * Failure modes all collapse to 404 to avoid leaking program errors.
 */

const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL ?? "https://api.devnet.solana.com";

// Base58 alphabet, length range that covers any Solana pubkey (32 bytes ⇒
// 32-44 base58 chars). Tighter than `^[A-Za-z0-9_-]{6,64}$` because loan_ids
// are pubkeys, not opaque opaque slugs — refuse anything else before touching
// the chain.
const BASE58_PUBKEY_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

function notFound(reason: string): NextResponse {
  // Keep body short and stable — we don't want to leak whether the failure
  // was "missing PDA" vs "RPC error" vs "unminted".
  return new NextResponse(reason, {
    status: 404,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function GET(
  _req: Request,
  ctx: { params: { loanId: string } },
) {
  const loanId = ctx.params.loanId;

  if (!loanId || !BASE58_PUBKEY_RE.test(loanId)) {
    return notFound("Invalid loan_id");
  }

  let trdcState: Awaited<ReturnType<typeof loadTrdcState>>;
  try {
    const connection = new Connection(RPC_URL, "confirmed");
    trdcState = await loadTrdcState(connection, loanId);
  } catch {
    return notFound("Not found");
  }

  if (!trdcState) {
    return notFound("Not found");
  }

  // SR-6: refuse to render metadata for unminted TRDCs. Until the cNFT mint
  // CPI lands, `asset_id == Pubkey::default()` and there is nothing
  // meaningful to advertise.
  if (!trdcState.isMinted) {
    return notFound("TRDC not yet minted");
  }

  const externalBase =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://vaulx.vercel.app";
  const cdnBase = process.env.NEXT_PUBLIC_METADATA_BASE ?? "https://vaulx.app";
  const imageUri = `${cdnBase}/api/trdc/${loanId}/image`;

  // Render Metaplex-shaped JSON. Every substantive field comes from on-chain
  // state — `loanId` is only used as the URL/echo path. Even the displayed
  // loan-id short-form is the base58 of the on-chain `loan_id` pubkey, not
  // a re-render of the URL param (they are equal by construction at this
  // point because the PDA fetch succeeded).
  const json = {
    name: `VTRDC-${trdcState.loanIdShort}-${trdcState.docHashShort}`,
    symbol: "VTRDC",
    description: `Vaulx Tokenized Receipt of Deposited Collateral. Loan ${trdcState.loanIdShort}. Status: ${trdcState.statusName}.`,
    image: imageUri,
    external_url: `${externalBase}/loan/${trdcState.loanIdBase58}`,
    attributes: [
      { trait_type: "Status", value: trdcState.statusName },
      { trait_type: "Appraisal hash", value: trdcState.docHashHex },
      { trait_type: "Loan ID", value: trdcState.loanIdBase58 },
      { trait_type: "Asset ID", value: trdcState.assetId.toBase58() },
      {
        trait_type: "Appraisal value (USDC atoms)",
        value: trdcState.appraisalValue.toString(),
      },
      {
        trait_type: "Loan amount (USDC atoms)",
        value: trdcState.loanAmount.toString(),
      },
      {
        trait_type: "Principal remaining (USDC atoms)",
        value: trdcState.principalRemaining.toString(),
      },
      { trait_type: "Rate (bps)", value: trdcState.rateBps },
      { trait_type: "Due (unix)", value: trdcState.dueTs },
      { trait_type: "Created at (unix)", value: trdcState.createdAt },
    ],
    properties: {
      category: "image" as const,
      files: [{ uri: imageUri, type: "image/png" }],
    },
  };

  return NextResponse.json(json, {
    headers: {
      // 60s cache is enough to absorb Solscan / DAS bursts without serving
      // stale state through a status transition.
      "Cache-Control": "public, max-age=60, s-maxage=60",
    },
  });
}
