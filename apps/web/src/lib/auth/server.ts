import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

import type { PublicUser } from "./types";

export class AuthRequiredError extends Error {
  constructor(message = "Authentication required") {
    super(message);
    this.name = "AuthRequiredError";
  }
}

type SupabaseServerClient = ReturnType<typeof createServerClient>;

function readEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "[auth/server] NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set",
    );
  }
  return { url, anonKey };
}

function buildClient(): SupabaseServerClient {
  const { url, anonKey } = readEnv();
  const store = cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        return store.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          store.set({ name, value, ...options });
        } catch {
          // `cookies().set` throws when called from a Server Component (read-only).
          // That is fine: the session is still readable; refreshes happen in
          // route handlers / server actions where the cookie store is writable.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          store.set({ name, value: "", ...options });
        } catch {
          // See note in `set` above.
        }
      },
    },
  });
}

async function loadPublicUser(
  supabase: SupabaseServerClient,
  authUserId: string,
): Promise<PublicUser | null> {
  const { data, error } = await supabase
    .from("users")
    .select(
      "id, email, role, display_name, solana_address, created_at, updated_at",
    )
    .eq("id", authUserId)
    .maybeSingle();

  if (error || !data) return null;
  return data as unknown as PublicUser;
}

export async function getServerUser(): Promise<PublicUser | null> {
  const supabase = buildClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return null;
  return loadPublicUser(supabase, authUser.id);
}

export async function requireUser(): Promise<PublicUser> {
  const user = await getServerUser();
  if (!user) throw new AuthRequiredError();
  return user;
}

export async function getAuthedClient(): Promise<{
  user: PublicUser;
  supabase: SupabaseServerClient;
}> {
  const supabase = buildClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) throw new AuthRequiredError();
  const user = await loadPublicUser(supabase, authUser.id);
  if (!user) throw new AuthRequiredError();
  return { user, supabase };
}
