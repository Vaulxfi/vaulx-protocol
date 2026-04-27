"use client";
import { PrivyProvider, usePrivy } from "@privy-io/react-auth";
import { useEffect } from "react";
import { useDemoSession } from "../../_lib/use-demo-session";

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

type Loose = Record<string, unknown>;

function PrivyInner({
  onConnected,
}: {
  onConnected: (pubkey: string, email?: string) => void;
}) {
  const { login, ready, authenticated, user } = usePrivy();
  useEffect(() => {
    if (authenticated && user) {
      const sol = user.linkedAccounts.find((a) => {
        const x = a as unknown as Loose;
        return x.type === "wallet" && x.chainType === "solana";
      });
      const pubkey =
        ((sol as unknown as Loose | undefined)?.address as string | undefined) ?? user.id;
      const email =
        ((user.email as unknown as Loose | undefined)?.address as string | undefined) ?? undefined;
      onConnected(pubkey, email);
    }
  }, [authenticated, user, onConnected]);

  return (
    <button
      disabled={!ready}
      onClick={() => login()}
      className="w-full rounded-md border border-[var(--rule)] p-4 text-left hover:border-[var(--brand)]/50 disabled:opacity-50"
    >
      <p className="font-mono text-xs uppercase tracking-wider text-[var(--ink-muted)]">
        Privy
      </p>
      <p className="mt-1 font-display text-lg">Email or social</p>
      <p className="mt-1 text-xs text-[var(--ink-dim)]">
        Stripe-acquired. Embedded Solana wallet.
      </p>
    </button>
  );
}

export function PrivyCard() {
  const { session, patch } = useDemoSession();
  if (!PRIVY_APP_ID) {
    return (
      <button
        onClick={() =>
          session &&
          patch((s) => ({
            ...s,
            wallet: {
              provider: "privy",
              pubkey: "MOCK11111111111111111111111111111111111111",
            },
          }))
        }
        className="w-full rounded-md border border-[var(--rule)] p-4 text-left hover:border-[var(--brand)]/50"
      >
        <p className="font-mono text-xs uppercase tracking-wider text-[var(--ink-muted)]">
          Privy · sandbox unset
        </p>
        <p className="mt-1 font-display text-lg">Email or social</p>
        <p className="mt-1 text-xs text-[var(--ink-muted)]">
          MOCK — set NEXT_PUBLIC_PRIVY_APP_ID to enable real SDK.
        </p>
      </button>
    );
  }
  return (
    <PrivyProvider appId={PRIVY_APP_ID} config={{ appearance: { theme: "dark" } }}>
      <PrivyInner
        onConnected={(pubkey, email) =>
          session &&
          patch((s) => ({ ...s, wallet: { provider: "privy", pubkey, email } }))
        }
      />
    </PrivyProvider>
  );
}
