import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { AnchorProvider, type Idl, type Program } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { auction as auctionFacade } from "@vaulx/anchor-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/auctions
 *
 * Returns the current set of auctions observed by the indexer, each enriched
 * with a live snapshot of the on-chain Auction account state. Derived status
 * rules:
 *   - account.status == Closed            → CLOSED
 *   - account.status == Open + now >= end → ENDED
 *   - account.status == Open + now <  end → OPEN
 *
 * Graceful-fallback semantics: if Supabase is not configured, returns
 * `{ auctions: [], source: "supabase_not_configured" }` with status 200 so
 * the client-side hook never throws.
 */

const RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ??
  process.env.SOLANA_RPC_URL ??
  "https://api.devnet.solana.com";

type Derived = "OPEN" | "ENDED" | "CLOSED";

interface AuctionRow {
  auction_pda: string;
  trdc_pda: string;
  asset_mint: string;
  reserve_price: string;
  min_increment: string;
  start_ts: number;
  end_ts: number;
  high_bid: string;
  high_bidder: string;
  status: Derived;
}

function toBigStr(v: unknown): string {
  if (v == null) return "0";
  if (typeof v === "bigint") return v.toString();
  if (typeof v === "number") return Math.trunc(v).toString();
  if (typeof v === "string") return v;
  if (typeof (v as { toString?: () => string }).toString === "function") {
    return (v as { toString: () => string }).toString();
  }
  return "0";
}

function toNum(v: unknown): number {
  return Number(toBigStr(v));
}

function decodeStatus(raw: Record<string, unknown> | undefined): "open" | "closed" {
  if (!raw) return "open";
  const k = Object.keys(raw)[0];
  if (!k) return "open";
  return k.toLowerCase() === "closed" ? "closed" : "open";
}

function derive(status: "open" | "closed", endTs: number): Derived {
  if (status === "closed") return "CLOSED";
  const nowSec = Math.floor(Date.now() / 1000);
  if (nowSec >= endTs) return "ENDED";
  return "OPEN";
}

export async function GET() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { auctions: [], source: "supabase_not_configured" as const },
      { status: 200 },
    );
  }

  const client = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await client
    .from("onchain_events")
    .select("payload, created_at, slot")
    .eq("event_name", "auctionCreated")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error || !data) {
    return NextResponse.json(
      { auctions: [], source: "supabase_not_configured" as const },
      { status: 200 },
    );
  }

  // Dedupe by auction PDA (latest created row wins).
  const seen = new Set<string>();
  const created: Array<{ auctionPda: string; trdcPda: string }> = [];
  for (const row of data) {
    const payload = (row.payload as Record<string, unknown>) ?? {};
    const auctionPda =
      (payload.auction as string | undefined) ??
      (payload.auctionPda as string | undefined);
    if (!auctionPda || seen.has(auctionPda)) continue;
    const trdcPda =
      (payload.trdc_state as string | undefined) ??
      (payload.trdcState as string | undefined) ??
      "";
    seen.add(auctionPda);
    created.push({ auctionPda, trdcPda });
  }

  if (created.length === 0) {
    return NextResponse.json(
      { auctions: [], source: "empty" as const },
      { status: 200 },
    );
  }

  const connection = new Connection(RPC_URL, "confirmed");
  const provider = new AnchorProvider(
    connection,
    {
      publicKey: PublicKey.default,
      signTransaction: async <T,>(tx: T) => tx,
      signAllTransactions: async <T,>(txs: T[]) => txs,
    },
    { commitment: "confirmed" },
  );
  const program = auctionFacade.program(provider) as Program<Idl>;

  const fetched = await Promise.all(
    created.map(async ({ auctionPda, trdcPda }): Promise<AuctionRow | null> => {
      let pk: PublicKey;
      try {
        pk = new PublicKey(auctionPda);
      } catch {
        return null;
      }
      try {
        const raw = (await (program.account as any).auction.fetch(pk)) as
          | Record<string, unknown>
          | null;
        if (!raw) return null;
        const endTs = toNum(raw.endTs ?? raw.end_ts);
        const statusKey = decodeStatus(
          raw.status as Record<string, unknown> | undefined,
        );
        const highBidderVal = (raw.highBidder ?? raw.high_bidder) as
          | { toBase58?: () => string }
          | undefined;
        const assetMintVal = (raw.assetMint ?? raw.asset_mint) as
          | { toBase58?: () => string }
          | undefined;
        const trdcStateVal = (raw.trdcState ?? raw.trdc_state) as
          | { toBase58?: () => string }
          | undefined;
        return {
          auction_pda: auctionPda,
          trdc_pda:
            trdcStateVal?.toBase58?.() ?? trdcPda,
          asset_mint: assetMintVal?.toBase58?.() ?? "",
          reserve_price: toBigStr(raw.reservePrice ?? raw.reserve_price),
          min_increment: toBigStr(raw.minIncrement ?? raw.min_increment),
          start_ts: toNum(raw.startTs ?? raw.start_ts),
          end_ts: endTs,
          high_bid: toBigStr(raw.highBid ?? raw.high_bid),
          high_bidder: highBidderVal?.toBase58?.() ?? "",
          status: derive(statusKey, endTs),
        };
      } catch {
        return null;
      }
    }),
  );

  const auctions = fetched.filter((r): r is AuctionRow => r !== null);

  return NextResponse.json(
    { auctions, source: "live" as const },
    { status: 200 },
  );
}
