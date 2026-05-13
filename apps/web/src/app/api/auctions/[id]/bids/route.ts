import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/auctions/[id]/bids
 *
 * Returns up to 20 most-recent `bidPlaced` events for the given auction PDA.
 * Payload casing is uncertain across indexer runs — we match both
 * `payload->>auction` and `payload->>auctionPda`.
 */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const auctionPda = params.id;
  if (!auctionPda) {
    return NextResponse.json({ error: "missing id" }, { status: 400 });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { bids: [], source: "supabase_not_configured" as const },
      { status: 200 },
    );
  }

  const client = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await client
    .from("onchain_events")
    .select("payload, slot, signature, occurred_at")
    .eq("event_name", "bidPlaced")
    .or(
      `payload->>auction.eq.${auctionPda},payload->>auctionPda.eq.${auctionPda}`,
    )
    .order("slot", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json(
      { bids: [], source: "supabase_not_configured" as const },
      { status: 200 },
    );
  }

  const bids =
    (data ?? []).map((row) => {
      const payload = (row.payload as Record<string, unknown>) ?? {};
      return {
        auction:
          (payload.auction as string | undefined) ??
          (payload.auctionPda as string | undefined) ??
          auctionPda,
        bidder:
          (payload.bidder as string | undefined) ??
          (payload.bidderPda as string | undefined) ??
          "",
        amount: String(payload.amount ?? "0"),
        high_bid_previous: String(
          payload.high_bid_previous ?? payload.highBidPrevious ?? "0",
        ),
        ts: Number(payload.ts ?? 0),
        slot: Number(row.slot ?? 0),
        signature: (row.signature as string | undefined) ?? "",
        created_at: row.occurred_at as string,
      };
    }) ?? [];

  return NextResponse.json(
    {
      bids,
      source: (bids.length > 0 ? "live" : "empty") as "live" | "empty",
    },
    { status: 200 },
  );
}
