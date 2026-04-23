import { createClient } from "@supabase/supabase-js";
import { createServerClient as createSsrServerClient, type CookieOptions } from "@supabase/ssr";

import { env } from "./env.js";
import type { Database } from "./types.js";

/**
 * Admin / service-role client for server-only code paths that need to bypass
 * RLS (e.g. webhook handlers, disburse-gate audit writes, internal jobs).
 *
 * NEVER import this from a component that might render client-side.
 */
export function createServerClient() {
  return createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  });
}

/**
 * Minimal cookie adapter shape expected by `createUserServerClient`. Wire it to
 * Next.js `cookies()` from `next/headers` at the call site, e.g.:
 *
 *   import { cookies } from "next/headers";
 *   const store = cookies();
 *   createUserServerClient({
 *     get: (name) => store.get(name)?.value,
 *     set: (name, value, options) => store.set({ name, value, ...options }),
 *     remove: (name, options) => store.set({ name, value: "", ...options })
 *   });
 */
export interface CookieAdapter {
  get(name: string): string | undefined;
  set(name: string, value: string, options: CookieOptions): void;
  remove(name: string, options: CookieOptions): void;
}

/**
 * User-scoped server client that honors Supabase auth cookies. Uses the anon
 * key + the caller-supplied cookie adapter so RLS policies are enforced with
 * the current user's session.
 */
export function createUserServerClient(adapter: CookieAdapter) {
  return createSsrServerClient<Database>(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        return adapter.get(name);
      },
      set(name: string, value: string, options: CookieOptions) {
        adapter.set(name, value, options);
      },
      remove(name: string, options: CookieOptions) {
        adapter.remove(name, options);
      }
    }
  });
}

export type { Database };
