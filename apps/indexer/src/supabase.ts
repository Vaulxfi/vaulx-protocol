import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v || v.length === 0) {
    throw new Error(
      `[indexer] Missing required env var: ${name}. See apps/indexer/.env.example.`,
    );
  }
  return v;
}

let _client: SupabaseClient | null = null;

function client(): SupabaseClient {
  if (_client) return _client;
  const url = requireEnv("SUPABASE_URL");
  const key = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  _client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _client;
}

export type OnchainEventInsert = {
  program_id: string;
  event_name: string;
  payload: unknown;
  slot: number;
  signature: string;
};

export async function insertEvent(row: OnchainEventInsert): Promise<void> {
  const { error } = await client().from("onchain_events").insert({
    program_id: row.program_id,
    event_name: row.event_name,
    payload: row.payload,
    slot: row.slot,
    signature: row.signature,
  });
  if (error) {
    // Re-throw with a `.code` attribute so callers can detect 23505 (unique
    // violation from signature replay on websocket reconnect).
    const e = new Error(error.message) as Error & { code?: string };
    e.code = error.code;
    throw e;
  }
}
