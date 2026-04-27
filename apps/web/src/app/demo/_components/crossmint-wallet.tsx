"use client";
// TODO(crossmint-sdk-verify): confirm hook + provider names against installed
// types. Current shape (verified against
// @crossmint/client-sdk-react-ui@4.1.5):
//   - <CrossmintProvider apiKey>
//   - <CrossmintAuthProvider> (gives us `useCrossmintAuth().login/user/status`)
//   - <CrossmintWalletProvider> (gives us `useWallet().wallet`)
// `wallet.address` is the on-chain pubkey when chain="solana".
import {
  CrossmintProvider,
  CrossmintAuthProvider,
  CrossmintWalletProvider,
  useCrossmintAuth,
  useWallet,
} from "@crossmint/client-sdk-react-ui";
import { useEffect } from "react";
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

export function CrossmintWallet() {
  const { session, patch } = useDemoSession();

  if (!CROSSMINT_API_KEY) {
    return (
      <>
        <button
          onClick={() =>
            session &&
            patch((s) => ({
              ...s,
              wallet: {
                provider: "crossmint",
                pubkey: "MOCK22222222222222222222222222222222222222",
                email: "demo@vaulx.app",
              },
            }))
          }
          className="w-full rounded-md border border-[var(--rule)] p-4 text-left hover:border-[var(--brand)]/50"
        >
          <p className="font-mono text-xs uppercase tracking-wider text-[var(--ink-muted)]">
            Crossmint · sandbox unset
          </p>
          <p className="mt-1 font-display text-lg">
            Sign in with Google · MOCK
          </p>
          <p className="mt-1 text-xs text-[var(--ink-muted)]">
            Set NEXT_PUBLIC_CROSSMINT_API_KEY to enable real SDK.
          </p>
        </button>
        <MockBadge partner="Crossmint" />
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
