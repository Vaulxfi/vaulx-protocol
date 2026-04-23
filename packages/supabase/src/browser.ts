import { createBrowserClient as createSsrBrowserClient } from "@supabase/ssr";

import type { Database } from "./types.js";

/**
 * Browser-safe Supabase client. Only reads NEXT_PUBLIC_* env vars — these are
 * inlined by Next.js at build time and are safe to ship to the browser.
 *
 * Throws synchronously if the vars are missing so misconfiguration is loud.
 */
function readBrowserEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "[@vaulx/supabase] NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set. " +
        "Copy .env.example to .env.local and fill in the values."
    );
  }
  return { url, anonKey };
}

type BrowserClient = ReturnType<typeof createSsrBrowserClient<Database>>;

let cached: BrowserClient | null = null;

/**
 * Singleton browser client factory. Safe to call from client components on
 * every render — returns the same instance.
 */
export function createBrowserClient(): BrowserClient {
  if (cached) return cached;
  const { url, anonKey } = readBrowserEnv();
  cached = createSsrBrowserClient<Database>(url, anonKey);
  return cached;
}

export type { Database };
