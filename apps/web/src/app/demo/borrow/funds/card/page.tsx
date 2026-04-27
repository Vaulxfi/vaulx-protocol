"use client";
import { useState } from "react";
import Link from "next/link";
import { DemoShell } from "../../../_components/demo-shell";
import { MockBadge } from "../../../_components/integration-badges";
import { CARD_TX } from "../../../_fixtures/card-tx-feed";

const BRL = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export default function CardPage() {
  const [toast, setToast] = useState<string | null>(null);

  const handleAddToWallet = () => {
    setToast("Mock — Solflare card pending issuer agreement");
    window.setTimeout(() => setToast(null), 2400);
  };

  return (
    <DemoShell formFactor="phone">
      <div className="px-6 py-8">
        <p className="eyebrow">Step 11 / 14 · Card</p>
        <h1 className="display-md mt-3">Spend USDC like cash.</h1>
        <p className="mt-3 text-sm text-[var(--ink-dim)]">
          A Vaulx debit card draws from your in-app USDC balance. Apple Pay, Google Pay, and tap-to-pay anywhere Visa is accepted.
        </p>

        {/* Card art */}
        <div className="mt-6 rounded-md border border-[var(--rule)] bg-[linear-gradient(135deg,_#1a1a1a_0%,_#0a0a0a_100%)] p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                Vaulx · debit
              </p>
              <p className="mt-6 font-mono text-sm tracking-[0.3em] text-[var(--ink)]">
                •••• •••• •••• 5234
              </p>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-dim)]">
                Visa · BRL · USDC-funded
              </p>
            </div>
            <p
              className="font-display text-lg text-[var(--brand)]"
              style={{ letterSpacing: "0.04em" }}
            >
              VAULX
            </p>
          </div>
        </div>

        {/* Apple Pay-styled CTA */}
        <button
          type="button"
          onClick={handleAddToWallet}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-md border border-[var(--ink)] bg-[var(--ink)] px-4 py-3 font-mono text-sm uppercase tracking-[0.16em] text-[var(--bg)]"
        >
          <span aria-hidden></span>
          Add Vaulx Card to Wallet
        </button>
        <p className="mt-1 text-center font-mono text-[10px] text-[var(--ink-muted)]">
          or Add to Google Wallet
        </p>

        {toast && (
          <div className="mt-4 rounded-md border border-[var(--brand)]/30 bg-[var(--brand-wash)] p-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--brand)]">
              {toast}
            </p>
          </div>
        )}

        {/* Recent transactions */}
        <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
          Recent transactions
        </p>
        <div className="mt-2 divide-y divide-[var(--rule)] rounded-md border border-[var(--rule)]">
          {CARD_TX.map((tx, i) => (
            <div
              key={`${tx.merchant}-${i}`}
              className="flex items-center justify-between px-4 py-3"
            >
              <div className="min-w-0 flex-1 pr-3">
                <p className="truncate font-display text-sm text-[var(--ink)]">
                  {tx.merchant}
                </p>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                  {tx.ts}
                </p>
              </div>
              <p
                className="font-mono text-sm text-[var(--ink)]"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                R$ {BRL.format(Math.abs(tx.amount))}
              </p>
            </div>
          ))}
        </div>

        <Link
          href="/demo/borrow/funds"
          className="mt-8 block w-full rounded-md border border-[var(--rule)] px-4 py-3 text-center font-mono text-xs uppercase tracking-[0.16em] text-[var(--ink-dim)]"
        >
          ← Back to funds
        </Link>
      </div>
      <MockBadge partner="Solflare Card" />
    </DemoShell>
  );
}
