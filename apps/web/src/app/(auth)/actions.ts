"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { z } from "zod";

import { AuthRequiredError, getAuthedClient } from "@/lib/auth/server";

const linkSchema = z.object({
  email: z.string().email().max(255),
  wallet: z
    .string()
    .min(32)
    .max(64)
    .regex(/^[1-9A-HJ-NP-Za-km-z]+$/, "Invalid base58 wallet address"),
});

export type LinkAuthenticatedWalletResult =
  | { ok: true }
  | { ok: false; code: "unauthenticated" | "conflict" | "invalid" | "error"; message: string };

// Server action: writes public.users.email + solana_address for the caller.
// Uses the RLS-scoped client from getAuthedClient(), so the UPDATE only
// succeeds for the row the caller owns (id = auth.uid()).
export async function linkAuthenticatedWallet(input: {
  email: string;
  wallet: string;
}): Promise<LinkAuthenticatedWalletResult> {
  const parsed = linkSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: "invalid", message: "Invalid email or wallet" };
  }

  try {
    const { user, supabase } = await getAuthedClient();

    const { error } = await supabase
      .from("users")
      .update({ email: parsed.data.email, solana_address: parsed.data.wallet })
      .eq("id", user.id);

    if (error) {
      const msg = error.message ?? "";
      const code = (error as { code?: string }).code;
      if (code === "23505" || /duplicate key|unique/i.test(msg)) {
        return {
          ok: false,
          code: "conflict",
          message: "This wallet is already linked to another account",
        };
      }
      return { ok: false, code: "error", message: msg || "Failed to link wallet" };
    }

    return { ok: true };
  } catch (err) {
    if (err instanceof AuthRequiredError) {
      return { ok: false, code: "unauthenticated", message: "Sign in required" };
    }
    return {
      ok: false,
      code: "error",
      message: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

function buildSupabaseForSignOut() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "[(auth)/actions] NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set",
    );
  }
  const store = cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        return store.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        store.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        store.set({ name, value: "", ...options });
      },
    },
  });
}

export async function signOut(): Promise<void> {
  const supabase = buildSupabaseForSignOut();
  await supabase.auth.signOut();
  redirect("/");
}
