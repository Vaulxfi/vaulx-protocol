"use client";
// Active-loan dashboard. The LTV gauge, RedStone feed, IoT placeholder, and
// LiveTicker all consume the same `useDemoSession()` snapshot — one source
// of truth for collateral price (`session.watch.priceHistory`) and loan
// state (`session.loan`). From here the borrower either repays in full or
// rolls into a new term.
import { useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { computeInterestAccrued } from "@vaulx/terms";
import { DemoShell } from "../../_components/demo-shell";
import { LtvGauge } from "../../_components/ltv-gauge";
import { RedstoneFeedCard } from "../../_components/redstone-feed-card";
import { LiveTicker } from "../../_components/live-ticker";
import { TrdcViewer } from "../../_components/trdc-viewer";
import { useDemoSession } from "../../_lib/use-demo-session";

const SECONDS_PER_DAY = 86_400;

const USDC_FMT = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function fmtUsdc(atoms: bigint): string {
  return USDC_FMT.format(Number(atoms) / 1_000_000);
}

function fmtBpsPct(bps: number): string {
  const whole = Math.floor(bps / 100);
  const rem = bps % 100;
  return `${whole}.${rem.toString().padStart(2, "0")}%`;
}

function priceToAtoms(usd: number): bigint {
  return BigInt(Math.max(0, Math.floor(usd * 1_000_000)));
}

export default function DashboardPage() {
  const router = useRouter();
  const { session, isLoading } = useDemoSession();

  useEffect(() => {
    if (session && !session.loan?.disbursedAt) {
      router.replace("/demo/borrow/disburse");
    }
  }, [session, router]);

  const priceHistory = useMemo(
    () => session?.watch?.priceHistory ?? [],
    [session?.watch?.priceHistory],
  );

  const principalAtoms = useMemo(() => {
    if (!session?.loan) return 0n;
    try {
      return BigInt(session.loan.principalAtoms);
    } catch {
      return 0n;
    }
  }, [session?.loan]);

  const collateralAtoms = useMemo(() => {
    if (priceHistory.length === 0) {
      const median = session?.watch?.appraisal?.median ?? 0;
      return priceToAtoms(median);
    }
    return priceToAtoms(priceHistory[priceHistory.length - 1] ?? 0);
  }, [priceHistory, session?.watch?.appraisal?.median]);

  const accruedAtoms = useMemo(() => {
    if (!session?.loan) return 0n;
    const dueTs = session.loan.dueTs;
    const termDays = session.loan.termDays;
    const createdAtSec = dueTs - termDays * SECONDS_PER_DAY;
    const nowSec = Math.floor(Date.now() / 1000);
    const elapsed = Math.max(0, Math.floor((nowSec - createdAtSec) / SECONDS_PER_DAY));
    return computeInterestAccrued(principalAtoms, session.loan.rateBps, elapsed);
  }, [session?.loan, principalAtoms]);

  const daysToDue = useMemo(() => {
    if (!session?.loan) return 0;
    const nowSec = Math.floor(Date.now() / 1000);
    return Math.max(0, Math.ceil((session.loan.dueTs - nowSec) / SECONDS_PER_DAY));
  }, [session?.loan]);

  if (isLoading) {
    return (
      <DemoShell formFactor="phone">
        <div className="px-6 py-12 text-[var(--ink-muted)]">Loading…</div>
      </DemoShell>
    );
  }

  if (!session?.loan?.disbursedAt) {
    return (
      <DemoShell formFactor="phone">
        <div className="px-6 py-12 text-[var(--ink-muted)]">Redirecting…</div>
      </DemoShell>
    );
  }

  const loan = session.loan;

  return (
    <DemoShell formFactor="phone">
      <div className="px-6 py-8">
        <p className="eyebrow" style={{ color: "var(--brand)" }}>
          Step 13 / 14 · Dashboard
        </p>
        <h1 className="display-md mt-3">Your loan, live.</h1>
        <p className="mt-3 text-sm text-[var(--ink-dim)]">
          Collateral feed, LTV recompute, and custody telemetry — all in one place.
        </p>

        {/* LTV gauge */}
        <div className="mt-8 flex justify-center">
          <LtvGauge
            loanAmountAtoms={principalAtoms}
            collateralValueAtoms={collateralAtoms}
            size={200}
          />
        </div>

        {/* Loan summary */}
        <div className="mt-6 rounded-md border border-[var(--rule)] bg-[var(--bg-elev-1)] p-5">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
            Loan summary
          </div>
          <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                Principal
              </div>
              <div
                className="mt-1 font-mono text-[var(--ink)]"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {fmtUsdc(principalAtoms)} USDC
              </div>
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                Accrued interest
              </div>
              <div
                className="mt-1 font-mono text-[var(--ink)]"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {fmtUsdc(accruedAtoms)} USDC
              </div>
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                Rate · term
              </div>
              <div
                className="mt-1 font-mono text-[var(--ink)]"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {fmtBpsPct(loan.rateBps)} APR · {loan.termDays}d
              </div>
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                Days to due
              </div>
              <div
                className="mt-1 font-mono text-[var(--ink)]"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {daysToDue}d
              </div>
            </div>
          </div>
        </div>

        {/* TRDC cNFT viewer — pulls Vaulx-hosted Metaplex JSON for the loan */}
        <div className="mt-6">
          <TrdcViewer loanId={loan.loanId} network="devnet" />
        </div>

        {/* RedStone feed */}
        <div className="mt-6">
          <RedstoneFeedCard priceHistory={priceHistory} />
        </div>

        {/* IoT feed */}
        <div className="mt-6 rounded-md border border-[var(--rule)] bg-[var(--bg-elev-1)] p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
              Vault telemetry
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--brand)]/40 bg-[var(--brand)]/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--brand)]">
              <span
                className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--brand)]"
                style={{ animation: "vxIotPulse 1.4s ease-in-out infinite" }}
              />
              LIVE · Brinks SP · Vault A-32
            </span>
          </div>
          <div className="mt-3 overflow-hidden rounded-sm border border-[var(--rule)] bg-black">
            <Image
              src="/demo/iot-feed-placeholder.svg"
              alt="Live vault telemetry placeholder"
              width={600}
              height={300}
              className="h-auto w-full"
            />
          </div>
        </div>

        {/* Live ticker */}
        <div className="mt-6">
          <LiveTicker />
        </div>

        {/* CTAs */}
        <div className="mt-8 grid grid-cols-2 gap-3">
          <Link
            href="/demo/borrow/repay"
            className="rounded-md border border-[var(--brand)] bg-[var(--brand)] px-4 py-3 text-center font-mono text-xs uppercase tracking-[0.16em] text-[var(--bg)]"
          >
            Repay in full →
          </Link>
          <Link
            href="/demo/borrow/renew"
            className="rounded-md border border-[var(--brand)]/50 bg-[var(--brand)]/10 px-4 py-3 text-center font-mono text-xs uppercase tracking-[0.16em] text-[var(--brand)]"
          >
            Renew loan →
          </Link>
        </div>

        <style jsx>{`
          @keyframes vxIotPulse {
            0%,
            100% {
              opacity: 1;
            }
            50% {
              opacity: 0.3;
            }
          }
        `}</style>
      </div>
    </DemoShell>
  );
}
