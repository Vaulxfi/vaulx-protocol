"use client";
// Demo wizard's wallet step. Accepts EITHER:
//   - wallet-adapter (Phantom / Solflare via the top-right chip in
//     the demo shell) — the path crypto-natives take, and the only
//     path that actually works while the Crossmint SDK's
//     createWallet endpoint is returning 400 (vendor bug — see
//     project_crossmint_sdk_createwallet_bug.md).
//   - Crossmint smart wallet — the friction-free path for non-crypto
//     users (Google/Apple/Email → program-derived address). Whichever
//     resolves first satisfies the step.
//
// If EITHER provider lands a pubkey, "Next →" enables and the user
// can advance to /demo/borrow/register. Both flows downstream use
// `useUnifiedWallet()` which already prefers wallet-adapter when both
// are present, so the wizard's continued behaviour is consistent.
import Link from "next/link";
import { DemoShell } from "../../_components/demo-shell";
import { LiveBadge } from "../../_components/integration-badges";
import { CrossmintWallet } from "../../_components/crossmint-wallet";
import { useDemoSession } from "../../_lib/use-demo-session";
import { useUnifiedWallet } from "@/components/providers/crossmint-wallet-adapter";

function shortKey(pk: string): string {
  return pk.length > 8 ? `${pk.slice(0, 6)}…${pk.slice(-4)}` : pk;
}

export default function WalletPage() {
  const { session } = useDemoSession();
  const wallet = useUnifiedWallet();

  if (!session)
    return (
      <DemoShell formFactor="phone">
        <div className="px-6 py-12 text-[var(--ink-muted)]">Loading…</div>
      </DemoShell>
    );

  // wallet-adapter (Phantom / Solflare) — the chip in the demo shell
  // already drives this; we just read from it.
  const adapterConnected = wallet.canSign;
  const adapterProvider = adapterConnected ? wallet.provider : null;
  const adapterPubkey = adapterConnected
    ? wallet.publicKey?.toBase58()
    : null;

  // Crossmint side (currently broken at the SDK level, but still wired
  // so the moment vendor ships a fix we get the path for free).
  const crossmintConnected = !!session.wallet.pubkey;

  const connected = adapterConnected || crossmintConnected;

  return (
    <DemoShell formFactor="phone">
      <div className="px-6 py-8">
        <p className="eyebrow">Step 3 / 14 · Wallet</p>
        <h1 className="display-md mt-3">
          Sign in once. Solana wallet ready.
        </h1>
        <p className="mt-3 text-sm text-[var(--ink-dim)]">
          Pick the path that fits you — a smart wallet provisioned from
          email/Google/Apple, or your existing Phantom / Solflare
          extension. Either way the result is the same Solana address.
        </p>

        {/* wallet-adapter path: when Phantom/Solflare is already
            connected at the shell level, render a confirmation card
            and hide the Crossmint sign-in (no need to dual-connect).
            When NOT connected, render a hint pointing at the chip. */}
        {adapterConnected && adapterPubkey ? (
          <div className="mt-6 rounded-md border border-emerald-500/30 bg-emerald-500/5 p-4">
            <LiveBadge
              partner={adapterProvider === "solflare" ? "Solflare" : "Phantom"}
            />
            <p className="mt-2 font-mono text-xs text-[var(--ink-dim)]">
              {shortKey(adapterPubkey)}
            </p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
              Wallet connected via extension. You can advance now.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            <CrossmintWallet />
            <div className="rounded-md border border-[var(--rule)] p-3 text-center">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                or
              </p>
              <p className="mt-2 text-xs text-[var(--ink-dim)]">
                Use your <strong>Phantom</strong> or <strong>Solflare</strong>{" "}
                extension via the wallet chip at the top right.
              </p>
            </div>
          </div>
        )}

        {/* Crossmint-completed card stays for the day Crossmint
            sign-in actually finishes. Independent of the adapter
            card above — both can be true if a user signed in to
            both for some reason. */}
        {crossmintConnected && (
          <div className="mt-4 rounded-md border border-emerald-500/30 bg-emerald-500/5 p-4">
            <LiveBadge partner="Crossmint" />
            <p className="mt-2 font-mono text-xs text-[var(--ink-dim)]">
              {session.wallet.pubkey?.slice(0, 8)}…
              {session.wallet.pubkey?.slice(-4)}
            </p>
            {session.wallet.email && (
              <p className="mt-1 font-mono text-xs text-[var(--ink-muted)]">
                {session.wallet.email}
              </p>
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
