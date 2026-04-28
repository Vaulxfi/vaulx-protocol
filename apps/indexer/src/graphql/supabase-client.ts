import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Dependency-injection seam used by tests. The unit tests in
// apps/indexer/src/graphql/__tests__/schema.test.ts replace the client with
// an in-memory mock via setSupabaseClientForTests().
let _override: SupabaseClient | null = null;
let _cached: SupabaseClient | null = null;

export function setSupabaseClientForTests(client: SupabaseClient | null): void {
  _override = client;
}

export function getSupabaseClient(): SupabaseClient | null {
  if (_override) return _override;
  if (_cached) return _cached;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null; // graceful — resolvers return [] / null.
  _cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _cached;
}
