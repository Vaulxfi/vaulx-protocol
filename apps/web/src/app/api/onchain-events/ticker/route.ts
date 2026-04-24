import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export interface TickerEvent {
  name: string;
  detail: string;
  t: string; // relative time string (e.g. "-00:02:14") or ISO
}

const SEED: TickerEvent[] = [
  { name: "deposited", detail: "100,000 USDC → Vault VX-01", t: "-00:00:42" },
  { name: "ccbTrdcCreated", detail: "TRDC #7A2F · Rolex 116610LN · 60% LTV", t: "-00:02:11" },
  { name: "custodyConfirmed", detail: "TRDC #7A2F · custodian BR-SP", t: "-00:03:54" },
  { name: "disbursed", detail: "42,000 USDC → borrower", t: "-00:05:20" },
  { name: "deposited", detail: "25,000 USDC → Vault VX-01", t: "-00:09:03" },
  { name: "ccbTrdcCreated", detail: "TRDC #A13C · Patek 5711/1A · 55% LTV", t: "-00:11:47" },
  { name: "custodyConfirmed", detail: "TRDC #A13C · custodian BR-SP", t: "-00:14:02" },
  { name: "disbursed", detail: "67,000 USDC → borrower", t: "-00:14:58" },
  { name: "deposited", detail: "200,000 USDC → Vault VX-01", t: "-00:18:21" },
  { name: "ccbTrdcCreated", detail: "TRDC #D4F8 · AP 15202ST · 50% LTV", t: "-00:22:09" },
  { name: "custodyConfirmed", detail: "TRDC #D4F8 · custodian BR-SP", t: "-00:24:32" },
  { name: "disbursed", detail: "85,000 USDC → borrower", t: "-00:26:40" }
];

function relSecs(createdAt: string): string {
  const now = Date.now();
  const then = new Date(createdAt).getTime();
  if (!Number.isFinite(then)) return "now";
  const secs = Math.max(0, Math.floor((now - then) / 1000));
  const h = Math.floor(secs / 3600)
    .toString()
    .padStart(2, "0");
  const m = Math.floor((secs % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `-${h}:${m}:${s}`;
}

function detailFromPayload(name: string, payload: Record<string, unknown>): string {
  const amount = (payload.amount ?? payload.assets ?? payload.loan_amount) as
    | number
    | string
    | undefined;
  const short = (v: unknown) => {
    if (typeof v !== "string") return "";
    return v.length > 10 ? `${v.slice(0, 4)}…${v.slice(-4)}` : v;
  };
  const trdc = short(payload.trdcState ?? payload.trdc_state ?? "");
  const vault = short(payload.vault ?? "");

  switch (name) {
    case "deposited":
      return amount ? `${amount} atoms → Vault ${vault}` : "USDC deposit";
    case "ccbTrdcCreated":
      return `TRDC ${trdc} · ${amount ?? "—"} atoms`;
    case "custodyConfirmed":
      return `TRDC ${trdc} · custody confirmed`;
    case "disbursed":
      return `${amount ?? "—"} atoms → borrower · ${trdc}`;
    default:
      return Object.keys(payload).slice(0, 2).join(" / ") || "on-chain event";
  }
}

export async function GET() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { events: SEED, source: "seeded" as const },
      { status: 200 }
    );
  }

  try {
    const client = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data, error } = await client
      .from("onchain_events")
      .select("event_name, payload, created_at")
      .in("event_name", [
        "deposited",
        "ccbTrdcCreated",
        "custodyConfirmed",
        "disbursed"
      ])
      .order("created_at", { ascending: false })
      .limit(20);

    if (error || !data || data.length === 0) {
      return NextResponse.json(
        { events: SEED, source: "seeded" as const },
        { status: 200 }
      );
    }

    const events: TickerEvent[] = data.map((row) => {
      const payload = (row.payload as Record<string, unknown>) ?? {};
      return {
        name: row.event_name as string,
        detail: detailFromPayload(row.event_name as string, payload),
        t: relSecs(row.created_at as string)
      };
    });

    return NextResponse.json(
      { events, source: "live" as const },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { events: SEED, source: "seeded" as const },
      { status: 200 }
    );
  }
}
