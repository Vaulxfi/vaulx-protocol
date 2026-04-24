import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Poll endpoint for the borrower awaiting-custody page.
 *
 * Returns `{ confirmed, confirmedAt?, doc_hash? }` for the given TRDC PDA.
 * When Supabase env is missing, returns `{ confirmed: false,
 * reason: "supabase_not_configured" }` with status 200 so the client keeps
 * spinning instead of erroring.
 *
 * Anchor 0.30.1 gotcha: `EventParser` lowercases event names, so we query
 * for `custodyConfirmed` (not `CustodyConfirmed`). Field casing in payload
 * is also uncertain across indexer versions — match both `trdc_state` and
 * `trdcState`.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const trdc = url.searchParams.get("trdc");
  if (!trdc) {
    return NextResponse.json(
      { error: "missing `trdc` query param" },
      { status: 400 },
    );
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { confirmed: false, reason: "supabase_not_configured" },
      { status: 200 },
    );
  }

  const client = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await client
    .from("onchain_events")
    .select("payload, created_at")
    .eq("event_name", "custodyConfirmed")
    .or(`payload->>trdc_state.eq.${trdc},payload->>trdcState.eq.${trdc}`)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    return NextResponse.json(
      { confirmed: false, reason: "supabase_query_failed", detail: error.message },
      { status: 200 },
    );
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ confirmed: false }, { status: 200 });
  }

  const row = data[0] as { payload: Record<string, unknown>; created_at: string };
  const payload = row.payload ?? {};
  const docHash =
    (payload.doc_hash as number[] | string | undefined) ??
    (payload.docHash as number[] | string | undefined);

  let docHashHex: string | undefined;
  if (Array.isArray(docHash)) {
    docHashHex = docHash
      .map((b) => (b & 0xff).toString(16).padStart(2, "0"))
      .join("");
  } else if (typeof docHash === "string") {
    docHashHex = docHash.startsWith("0x") ? docHash.slice(2) : docHash;
  }

  return NextResponse.json(
    {
      confirmed: true,
      confirmedAt: new Date(row.created_at).getTime(),
      doc_hash: docHashHex,
    },
    { status: 200 },
  );
}
