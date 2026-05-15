"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { z } from "zod";

import { AuthRequiredError, getAuthedClient } from "@/lib/auth/server";

const linkSchema = z.object({
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
//
// The wallet pubkey is bound to the SIWS-attested identity established by
// supabase.auth.signInWithWeb3 — we read it from auth.users metadata rather
// than trusting the client-supplied wallet, and reject if they disagree.
// The synthetic email is also derived server-side from the attested wallet.
export async function linkAuthenticatedWallet(input: {
  wallet: string;
}): Promise<LinkAuthenticatedWalletResult> {
  const parsed = linkSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: "invalid", message: "Invalid wallet" };
  }

  try {
    const { user, supabase } = await getAuthedClient();

    const { data: authData } = await supabase.auth.getUser();
    const attestedWallet = extractAttestedSolanaWallet(authData.user);
    if (!attestedWallet || attestedWallet !== parsed.data.wallet) {
      return {
        ok: false,
        code: "invalid",
        message: "Wallet does not match authenticated session",
      };
    }

    // TODO: when Crossmint un-stubs, support real email from Crossmint identity
    const email = `${attestedWallet}@siws.vaulx.local`;

    const { error } = await supabase
      .from("users")
      .update({ email, solana_address: attestedWallet })
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
      console.error("[linkAuthenticatedWallet] update error:", error);
      return { ok: false, code: "error", message: "Failed to link wallet" };
    }

    return { ok: true };
  } catch (err) {
    if (err instanceof AuthRequiredError) {
      return { ok: false, code: "unauthenticated", message: "Sign in required" };
    }
    console.error("[linkAuthenticatedWallet] error:", err);
    return { ok: false, code: "error", message: "Failed to link wallet" };
  }
}

// Supabase GoTrue's web3 grant (signInWithWeb3, chain: 'solana') persists the
// attested wallet pubkey on the identity record at identity_data.address with
// provider = 'web3'. The same map is copied into auth.users.user_metadata.
// We prefer the identity record (tied explicitly to the web3 provider) and
// fall back to user_metadata.address.
// See supabase/auth internal/api/web3.go (CustomClaims.address = parsedMessage.Address)
// and internal/api/external.go (identity_data = structs.Map(metadata);
// user.UpdateUserMetaData(identityData)).
function extractAttestedSolanaWallet(
  authUser: { identities?: unknown; user_metadata?: unknown } | null | undefined,
): string | null {
  if (!authUser) return null;

  const identities = Array.isArray(authUser.identities) ? authUser.identities : [];
  for (const id of identities) {
    if (!id || typeof id !== "object") continue;
    const idAny = id as { provider?: unknown; identity_data?: unknown };
    if (idAny.provider !== "web3") continue;
    const data = idAny.identity_data;
    if (!data || typeof data !== "object") continue;
    const dataAny = data as { address?: unknown; chain?: unknown };
    if (dataAny.chain !== "solana") continue;
    if (typeof dataAny.address === "string" && dataAny.address.length > 0) {
      return dataAny.address;
    }
  }

  const meta = authUser.user_metadata;
  if (meta && typeof meta === "object") {
    const metaAny = meta as { address?: unknown; chain?: unknown };
    if (
      metaAny.chain === "solana" &&
      typeof metaAny.address === "string" &&
      metaAny.address.length > 0
    ) {
      return metaAny.address;
    }
  }

  return null;
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
