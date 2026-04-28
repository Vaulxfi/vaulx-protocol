"use client";
// Crossmint integration. Verified against @crossmint/client-sdk-react-ui@4.1.5:
//   - <CrossmintProvider apiKey>
//   - <CrossmintAuthProvider> (gives us `useCrossmintAuth().login/user/status`)
//   - <CrossmintWalletProvider> (gives us `useWallet().wallet`)
// `wallet.address` is the on-chain Solana pubkey when chain="solana".
//
// Real mode: NEXT_PUBLIC_CROSSMINT_API_KEY set → real OAuth/email login,
//           real Solana smart wallet provisioned with email recovery.
// Mock mode: env unset → simulated 1.5s "signing in" UI then mock pubkey
//           is set on the demo session so the rest of the journey
//           (custody → disburse → repay) flows. Mocked path is clearly
//           labeled with the MockBadge so judges don't mistake it for live.
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

  if (!CROSSMINT_API_KEY) {
    return <CrossmintMockButton />;
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
