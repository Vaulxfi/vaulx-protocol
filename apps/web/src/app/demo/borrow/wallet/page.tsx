"use client";
import Link from "next/link";
import { DemoShell } from "../../_components/demo-shell";
import { LiveBadge } from "../../_components/integration-badges";
import { PrivyCard } from "../../_components/wallet-cards/privy-card";
import { CrossmintCard } from "../../_components/wallet-cards/crossmint-card";
import { LazorKitCard } from "../../_components/wallet-cards/lazorkit-card";
import { useDemoSession } from "../../_lib/use-demo-session";

export default function WalletPage() {
  const { session } = useDemoSession();
  if (!session)
    return (
      <DemoShell formFactor="phone">
        <div className="px-6 py-12 text-[var(--ink-muted)]">Loading…</div>
      </DemoShell>
    );
  const connected = !!session.wallet.pubkey;

  return (
    <DemoShell formFactor="phone">
      <div className="px-6 py-8">
        <p className="eyebrow">Step 3 / 14 · Wallet</p>
        <h1 className="display-md mt-3">Pick how you sign in.</h1>
        <p className="mt-3 text-sm text-[var(--ink-dim)]">
          No seed phrase, no extension. Three real Solana-native options.
        </p>

        <div className="mt-6 space-y-3">
          <PrivyCard />
          <CrossmintCard />
          <LazorKitCard />
        </div>

        {connected && (
          <div className="mt-6 rounded-md border border-emerald-500/30 bg-emerald-500/5 p-4">
            <LiveBadge partner={session.wallet.provider!} />
            <p className="mt-2 font-mono text-xs text-[var(--ink-dim)]">
              {session.wallet.pubkey?.slice(0, 8)}…{session.wallet.pubkey?.slice(-4)}
            </p>
          </div>
        )}

        <Link
          href="/demo/borrow/register"
          className={`mt-8 block w-full rounded-md border px-4 py-3 text-center font-mono text-sm uppercase tracking-wider ${
            connected
              ? "border-[var(--brand)] bg-[var(--brand)] text-[var(--bg)]"
              : "border-[var(--rule)] text-[var(--ink-muted)] pointer-events-none"
          }`}
        >
          Next →
        </Link>
      </div>
    </DemoShell>
  );
}
