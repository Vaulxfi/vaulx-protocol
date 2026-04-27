"use client";
import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DemoShell } from "../../_components/demo-shell";
import { useDemoSession } from "../../_lib/use-demo-session";

const USDC_FMT = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function fmtUsdc(atoms: string): string {
  try {
    return USDC_FMT.format(Number(BigInt(atoms)) / 1_000_000);
  } catch {
    return "0.00";
  }
}

export default function FundsPage() {
  const router = useRouter();
  const { session, isLoading } = useDemoSession();

  useEffect(() => {
    if (session && !session.loan?.disbursedAt) {
      router.replace("/demo/borrow/disburse");
    }
  }, [session, router]);

  if (isLoading) {
    return (
      <DemoShell formFactor="phone">
        <div className="px-6 py-12 text-[var(--ink-muted)]">Loading…</div>
      </DemoShell>
    );
  }

  const balance = session?.loan?.inAppBalanceAtoms ?? "0";

  return (
    <DemoShell formFactor="phone">
      <div className="px-6 py-8">
        <p className="eyebrow">Step 11 / 14 · Funds</p>
        <h1 className="display-md mt-3">Your funds. Three ways out.</h1>
        <p className="mt-3 text-sm text-[var(--ink-dim)]">
          R$ in your bank in 2 seconds. Or to a Solana wallet. Or spend on a Vaulx card.
        </p>

        <div className="mt-6 rounded-md border border-[var(--rule)] bg-[var(--bg-elev-1)] p-5 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
            Vaulx in-app balance
          </p>
          <p
            className="mt-2 font-mono text-4xl text-[var(--brand)]"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {fmtUsdc(balance)}
          </p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
            USDC
          </p>
        </div>

        <div className="mt-6 space-y-3">
          <Link
            href="/demo/borrow/funds/pix"
            className="block rounded-md border border-[var(--rule)] p-4 transition-colors hover:border-[var(--brand)]/50"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
              Pix
            </p>
            <p className="mt-1 font-display text-lg text-[var(--ink)]">
              Send to your Brazilian bank →
            </p>
            <p className="mt-1 text-xs text-[var(--ink-dim)]">
              2-second instant transfer. Receive in BRL.
            </p>
          </Link>

          <Link
            href="/demo/borrow/funds/wallet"
            className="block rounded-md border border-[var(--rule)] p-4 transition-colors hover:border-[var(--brand)]/50"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
              Solana wallet
            </p>
            <p className="mt-1 font-display text-lg text-[var(--ink)]">
              Send to crypto wallet →
            </p>
            <p className="mt-1 text-xs text-[var(--ink-dim)]">
              USDC on Solana Devnet. Real on-chain transfer.
            </p>
          </Link>

          <Link
            href="/demo/borrow/funds/card"
            className="block rounded-md border border-[var(--rule)] p-4 transition-colors hover:border-[var(--brand)]/50"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
              Vaulx Card
            </p>
            <p className="mt-1 font-display text-lg text-[var(--ink)]">
              Spend on debit card →
            </p>
            <p className="mt-1 text-xs text-[var(--ink-dim)]">
              Apple Pay / Google Pay. Powered by Solflare card.
            </p>
          </Link>
        </div>
      </div>
    </DemoShell>
  );
}
