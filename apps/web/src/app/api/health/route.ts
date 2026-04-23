import { NextResponse } from "next/server";

// Force dynamic so env reads happen at request time, not at build time.
export const dynamic = "force-dynamic";

/**
 * Server-side smoke check. Intentionally does NOT instantiate the Supabase
 * client — we want this route to respond successfully before keys are
 * configured, so deployments and local dev are visibly alive.
 */
export function GET() {
  const supabase = process.env.SUPABASE_URL ? "configured" : "not-configured";
  const rpc = process.env.NEXT_PUBLIC_RPC_URL ? "configured" : "not-configured";
  return NextResponse.json({ ok: true, supabase, rpc });
}
