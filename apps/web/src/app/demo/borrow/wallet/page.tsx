"use client";
import Link from "next/link";
import { DemoShell } from "../../_components/demo-shell";
import { LiveBadge } from "../../_components/integration-badges";
import { CrossmintWallet } from "../../_components/crossmint-wallet";
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
        <h1 className="display-md mt-3">Sign in once. Solana smart wallet provisioned.</h1>
        <p className="mt-3 text-sm text-[var(--ink-dim)]">
          Email, Google, or Apple. No seed phrase, no extension. Your wallet
          is a Solana program-derived address — Vaulx and the borrower share
          the keys, neither side controls alone.
        </p>

        <div className="mt-6">
          <CrossmintWallet />
        </div>

        {connected && (
          <div className="mt-6 rounded-md border border-emerald-500/30 bg-emerald-500/5 p-4">
            <LiveBadge partner="Crossmint" />
            <p className="mt-2 font-mono text-xs text-[var(--ink-dim)]">
              {session.wallet.pubkey?.slice(0, 8)}…{session.wallet.pubkey?.slice(-4)}
            </p>
            {session.wallet.email && (
              <p className="mt-1 font-mono text-xs text-[var(--ink-muted)]">{session.wallet.email}</p>
            )}
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
