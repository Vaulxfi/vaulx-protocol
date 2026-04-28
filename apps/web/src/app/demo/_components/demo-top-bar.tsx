"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useDemoSession } from "../_lib/use-demo-session";
import { TOUR_STEPS_TOTAL } from "../_lib/types";

// Wallet-adapter UI must be client-only — it touches `window` during render.
// Loading dynamically without SSR avoids hydration mismatches and lets the
// button render identically on every demo page.
const WalletMultiButton = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false },
);

export function DemoTopBar() {
  const { session, patch, reset } = useDemoSession();
  const tourLabel =
    session?.tour.resumable && session.tour.step > 0
      ? `Resume tour · ${session.tour.step}/${TOUR_STEPS_TOTAL}`
      : "Tour";

  return (
    <header className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--rule)] bg-[var(--bg)]/85 px-4 py-3 backdrop-blur-sm sm:px-6">
      <Link href="/demo" className="font-display text-lg tracking-tight">
        <span className="text-[var(--brand)]">●</span> Vaulx{" "}
        <span className="text-xs font-mono text-[var(--ink-muted)] tracking-widest uppercase">demo</span>
      </Link>
      <div className="flex flex-wrap items-center gap-2">
        {/*
          Always-visible Solana wallet connect. The Crossmint sign-in step on
          /demo/borrow/wallet sets identity (email→pubkey) but doesn't sign txs;
          this button connects a wallet-adapter wallet (Phantom / Solflare /
          Backpack) which is what the chain hooks (useDeposit, useDisburse,
          useLoanRepay, etc.) call signTransaction on. Visible on every demo
          page so users never reach a "Connect wallet to disburse" CTA without
          a path to satisfy it.
        */}
        <WalletMultiButton
          style={{
            // Match the demo's editorial mono pill aesthetic. The default
            // wallet-adapter button is a purple gradient — we override to
            // the dark-operator chrome.
            backgroundColor: "transparent",
            border: "1px solid var(--rule)",
            borderRadius: "0.375rem",
            color: "var(--ink-dim)",
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            padding: "0.375rem 0.75rem",
            height: "auto",
            lineHeight: "1.2",
          }}
        />
        <button
          onClick={() => session && patch((s) => ({ ...s, tour: { ...s.tour, active: !s.tour.active } }))}
          className="rounded-md border border-[var(--rule)] px-3 py-1.5 text-xs font-mono uppercase tracking-wide text-[var(--ink-dim)] hover:bg-[var(--bg-elev-1)]"
        >
          {tourLabel}
        </button>
        <button
          onClick={() => {
            if (confirm("Reset demo? This clears your progress.")) reset();
          }}
          className="rounded-md border border-[var(--rule)] px-3 py-1.5 text-xs font-mono uppercase tracking-wide text-[var(--ink-dim)] hover:bg-[var(--bg-elev-1)]"
        >
          Reset
        </button>
        <Link
          href="/"
          className="rounded-md border border-[var(--rule)] px-3 py-1.5 text-xs font-mono uppercase tracking-wide text-[var(--ink-dim)] hover:bg-[var(--bg-elev-1)]"
        >
          Exit
        </Link>
      </div>
    </header>
  );
}
