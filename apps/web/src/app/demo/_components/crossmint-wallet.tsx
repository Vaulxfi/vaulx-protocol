"use client";
// Crossmint integration. Verified against @crossmint/client-sdk-react-ui@4.1.5:
//   - <CrossmintProvider apiKey>
//   - <CrossmintAuthProvider> (gives us `useCrossmintAuth().login/user/status`)
//   - <CrossmintWalletProvider> (gives us `useWallet().wallet`)
// `wallet.address` is the on-chain Solana pubkey when chain="solana".
//
// Environment selection (Phase A):
//   The Crossmint SDK does NOT expose an explicit `environment` prop on
//   <CrossmintProvider>. The API-key prefix determines routing:
//     ck_staging_*   → https://staging.crossmint.com/  (free, no KYC, Devnet)
//     ck_production_* → https://www.crossmint.com/      (KYC required, Mainnet)
//   See: @crossmint/common-sdk-base/dist/apiKey/consts.d.cts (CROSSMINT_STG_URL
//   vs CROSSMINT_PROD_URL). We surface NEXT_PUBLIC_CROSSMINT_ENV as an
//   explicit guard so misconfigured keys (e.g. prod key with env=staging)
//   throw loudly rather than silently routing to mainnet.
//
// Modes:
//   env=mock       → mock fallback (1.5s simulated provisioning)
//   env=staging    → real Crossmint @ staging, Solana Devnet smart wallet
//   env=production → real Crossmint @ prod, Solana Mainnet (post-KYC)
//   unset          → mock (back-compat with commit 15b5e19)
import {
  CrossmintProvider,
  CrossmintAuthProvider,
  CrossmintWalletProvider,
  useCrossmintAuth,
  useWallet,
} from "@crossmint/client-sdk-react-ui";
import { useEffect, useState } from "react";
import { useDemoSession } from "../_lib/use-demo-session";
import { MockBadge } from "./integration-badges";

const CROSSMINT_API_KEY = process.env.NEXT_PUBLIC_CROSSMINT_API_KEY;
const CROSSMINT_ENV = (process.env.NEXT_PUBLIC_CROSSMINT_ENV ?? "mock") as
  | "staging"
  | "production"
  | "mock";

/** API-key prefix → environment match check. The SDK auto-routes by prefix
 * (see CROSSMINT_STG_URL / CROSSMINT_PROD_URL in @crossmint/common-sdk-base);
 * this just protects against a `staging` env var paired with a prod key. */
function apiKeyMatchesEnv(key: string, env: "staging" | "production"): boolean {
  if (env === "staging") return key.startsWith("ck_staging_");
  return key.startsWith("ck_production_");
}

function CrossmintInner({
  onConnected,
}: {
  onConnected: (pubkey: string, email?: string) => void;
}) {
  const { login, status, user } = useCrossmintAuth();
  const { wallet } = useWallet();

  useEffect(() => {
    if (status === "logged-in" && wallet?.address) {
      const email = (user as Record<string, unknown> | undefined)?.email as
        | string
        | undefined;
      onConnected(wallet.address, email);
    }
  }, [status, wallet?.address, user, onConnected]);

  return (
    <button
      onClick={() => login()}
      className="w-full rounded-md border border-[var(--rule)] p-4 text-left hover:border-[var(--brand)]/50"
    >
      <p className="font-mono text-xs uppercase tracking-wider text-[var(--ink-muted)]">
        Crossmint
      </p>
      <p className="mt-1 font-display text-lg">
        Sign in with Google · Apple · Email
      </p>
      <p className="mt-1 text-xs text-[var(--ink-dim)]">
        Solana smart wallet provisioned. Passkey-ready.
      </p>
    </button>
  );
}

function CrossmintMockButton() {
  const { session, patch } = useDemoSession();
  const [signingIn, setSigningIn] = useState(false);
  const connected = Boolean(session?.wallet?.pubkey);

  const handleClick = () => {
    if (!session || signingIn || connected) return;
    setSigningIn(true);
    // Simulated provisioning: 1.5s spinner so the flow feels like a real
    // OAuth round-trip + smart-wallet creation rather than an instant flip.
    setTimeout(() => {
      patch((s) => ({
        ...s,
        wallet: {
          provider: "crossmint",
          pubkey: "MOCK22222222222222222222222222222222222222",
          email: "demo@vaulx.app",
        },
      }));
      setSigningIn(false);
    }, 1500);
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={signingIn || connected}
        className="w-full rounded-md border border-[var(--rule)] p-4 text-left hover:border-[var(--brand)]/50 disabled:opacity-60 disabled:cursor-default"
      >
        <p className="font-mono text-xs uppercase tracking-wider text-[var(--ink-muted)]">
          Crossmint{connected ? " · connected" : signingIn ? " · provisioning" : ""}
        </p>
        <p className="mt-1 font-display text-lg">
          {connected
            ? `${session?.wallet?.email ?? "demo@vaulx.app"} · ${session?.wallet?.pubkey?.slice(0, 4)}…${session?.wallet?.pubkey?.slice(-4)}`
            : signingIn
              ? "Provisioning your Solana smart wallet…"
              : "Sign in with Google · Apple · Email"}
        </p>
        <p className="mt-1 text-xs text-[var(--ink-dim)]">
          {connected
            ? "Smart wallet ready. Continue to next step."
            : signingIn
              ? "Email recovery configured. Passkey-ready."
              : "Solana smart wallet provisioned. No seed phrase. Email recovery."}
        </p>
      </button>
      <MockBadge partner="Crossmint" />
      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
        Demo mode · set NEXT_PUBLIC_CROSSMINT_API_KEY in Vercel env to flip to live SDK.
      </p>
    </>
  );
}

export function CrossmintWallet() {
  const { session, patch } = useDemoSession();

  // Mock mode: env unset, env=mock, or no key at all.
  if (!CROSSMINT_API_KEY || CROSSMINT_ENV === "mock") {
    return <CrossmintMockButton />;
  }

  // Guard: env explicitly set to staging|production but the key prefix
  // doesn't match. Render the mock + an inline warning rather than silently
  // routing to the wrong network (esp. dangerous when prod key is paired
  // with `staging` — would route real OAuth users to staging.crossmint.com).
  if (!apiKeyMatchesEnv(CROSSMINT_API_KEY, CROSSMINT_ENV)) {
    return (
      <>
        <CrossmintMockButton />
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-rose-400">
          Crossmint env mismatch · NEXT_PUBLIC_CROSSMINT_ENV={CROSSMINT_ENV} but
          key prefix is not ck_{CROSSMINT_ENV}_*. Falling back to mock.
        </p>
      </>
    );
  }

  return (
    <CrossmintProvider apiKey={CROSSMINT_API_KEY}>
      <CrossmintAuthProvider>
        <CrossmintWalletProvider
          createOnLogin={{
            chain: "solana",
            recovery: { type: "email" },
            signers: [{ type: "email" }],
          }}
        >
          <CrossmintInner
            onConnected={(pubkey, email) =>
              session &&
              patch((s) => ({
                ...s,
                wallet: { provider: "crossmint", pubkey, email },
              }))
            }
          />
        </CrossmintWalletProvider>
      </CrossmintAuthProvider>
    </CrossmintProvider>
  );
}
