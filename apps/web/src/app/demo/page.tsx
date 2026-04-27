"use client";
// /demo — the marketing entry point. Hero + 4 moves + stats + the pitch in three +
// comparison vs TradFi + CTA strip. Uses <DemoShell formFactor="desktop"> so the
// global Reset / Tour pills stay accessible across all routes.
import Link from "next/link";
import { DemoShell } from "./_components/demo-shell";
import { useDemoSession } from "./_lib/use-demo-session";

export default function DemoLanding() {
  const { session, patch } = useDemoSession();

  const startTour = () => {
    if (!session) return;
    patch((s) => ({
      ...s,
      tour: { ...s.tour, active: true, step: 0, resumable: true },
    }));
  };

  return (
    <DemoShell formFactor="desktop">
      {/* HERO */}
      <section className="border-b border-[var(--rule)] pb-20">
        <div className="flex items-center gap-3">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--brand)]" />
          <span className="font-mono text-sm tracking-tight text-[var(--ink)]">
            Vaulx
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--ink-muted)]">
            VX-01 · SOLANA RWA LENDING · DEVNET
          </span>
        </div>
        <h1
          className="mt-10 font-display font-extrabold leading-[1.02] tracking-[-0.025em] text-[var(--ink)]"
          style={{
            fontSize: "clamp(2.75rem, 7.5vw, 5.75rem)",
            fontVariationSettings: '"opsz" 144',
          }}
        >
          Lend against the world&rsquo;s most{" "}
          <em className="not-italic italic font-normal text-[var(--brand)]">
            resilient
          </em>{" "}
          assets.
        </h1>
        <p className="mt-10 max-w-[62ch] font-sans text-lg leading-[1.55] text-[var(--ink-dim)] md:text-[19px]">
          Vaulx originates pawn-style loans against luxury watches on Solana.
          Borrowers tap their vault in two minutes; lenders earn 11% APY backed
          by physical collateral, custody-gated on-chain, and a 3-tier auction
          waterfall on default.
        </p>
        <div className="mt-12 flex flex-wrap items-center gap-4">
          <Link
            href="/demo/borrow/onboard"
            className="inline-flex items-center gap-2 rounded-md bg-[var(--brand)] px-5 py-3 font-mono text-xs uppercase tracking-[0.18em] text-[var(--bg)]"
          >
            Borrow against your watch
            <span aria-hidden>→</span>
          </Link>
          <Link
            href="/demo/lend"
            className="inline-flex items-center gap-2 rounded-md border border-[var(--rule-strong)] px-5 py-3 font-mono text-xs uppercase tracking-[0.18em] text-[var(--ink)] hover:border-[var(--brand)] hover:text-[var(--brand)]"
          >
            Lend USDC
            <span aria-hidden>→</span>
          </Link>
        </div>
      </section>

      {/* THE FOUR MOVES */}
      <section className="mt-20">
        <span className="eyebrow">The four moves</span>
        <h2 className="mt-3 font-display text-[clamp(1.5rem,3vw,2.5rem)] font-bold leading-[1.1] tracking-[-0.015em] text-[var(--ink)]">
          From watch to wallet, with the moat in the middle.
        </h2>
        <ol className="mt-10 grid grid-cols-1 gap-px border border-[var(--rule)] bg-[var(--rule)] md:grid-cols-2 xl:grid-cols-4">
          <Move
            number="01"
            label="Borrow against your watch"
            body="60-sec KYC, smart wallet provisioned, watch appraised, custody booked. CCB.B3 signed on-screen."
          />
          <Move
            number="02"
            label="Lend at 11% APY"
            body="Four vaults · two currencies · one credit thesis. Senior or subordinate, USDC or BRL."
          />
          <Move
            number="03"
            label="Custody-gated on-chain"
            body="Anchor program refuses to disburse before custody confirms. Two-condition release written into the runtime."
          />
          <Move
            number="04"
            label="3-tier auction waterfall"
            body="Default → Tier 1 platform lenders (72h) → Tier 2 reseller network (48h) → Tier 3 public (168h)."
          />
        </ol>
      </section>

      {/* STATS STRIP */}
      <section className="mt-20 grid grid-cols-2 gap-px border border-[var(--rule)] bg-[var(--rule)] md:grid-cols-4">
        <Stat eyebrow="Total TVL" value="7.17M" unit="USD eq." />
        <Stat eyebrow="Avg LTV" value="47.3" unit="%" />
        <Stat eyebrow="Borrower APR" value="26" unit="%" />
        <Stat eyebrow="Lender APY" value="11" unit="% USDC" />
      </section>

      {/* THE PITCH IN THREE */}
      <section className="mt-24">
        <span className="eyebrow">The pitch in three</span>
        <h2 className="mt-3 font-display text-[clamp(1.5rem,3vw,2.5rem)] font-bold leading-[1.1] tracking-[-0.015em] text-[var(--ink)]">
          Asset, gate, moat.
        </h2>
        <div className="mt-10 grid grid-cols-1 gap-px border border-[var(--rule)] bg-[var(--rule)] md:grid-cols-3">
          <Pitch
            tag="The asset"
            title="Luxury watches as RWA collateral."
            body="Chrono24 + WatchCharts cover hundreds of thousands of transactions across the most-traded references. Real price data, real liquidity, no other oracle has it. Watches stay in licensed custody — Brinks, Prosegur, Loomis."
          />
          <Pitch
            tag="The custody gate"
            title="Disbursement refuses to fire before custody confirms."
            body="Vaulx's Anchor program enforces require!(custody_confirmed ∧ terms_accepted). The Solana runtime cannot bypass this constraint. 18–24 months for a competitor to replicate."
          />
          <Pitch
            tag="The moat"
            title="3-tier auction waterfall on default."
            body="Tier 1: platform lenders, 72-hour privileged window. Tier 2: curated reseller network, 48 hours. Tier 3: public auction, 168 hours. Target 90% recovery at 50% LTV — the math that makes the book work."
          />
        </div>
      </section>

      {/* COMPARISON */}
      <section className="mt-24">
        <span className="eyebrow">Vaulx vs TradFi</span>
        <h2 className="mt-3 font-display text-[clamp(1.5rem,3vw,2.5rem)] font-bold leading-[1.1] tracking-[-0.015em] text-[var(--ink)]">
          Same asset class. Different decade.
        </h2>
        <div className="mt-10 overflow-x-auto border border-[var(--rule)]">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[var(--rule)] bg-[var(--bg-elev-1)]">
                <Th>Dimension</Th>
                <Th align="left">Vaulx</Th>
                <Th align="left">TradFi pawn lender</Th>
              </tr>
            </thead>
            <tbody>
              <CompareRow
                dim="Speed"
                vaulx="48h to disbursement"
                tradfi="Weeks · in-person, in-branch"
              />
              <CompareRow
                dim="Currency"
                vaulx="USDC + BRL via Pix"
                tradfi="BRL only"
              />
              <CompareRow
                dim="Custody insurance"
                vaulx="Yes · Brinks-grade"
                tradfi="Yes · vault standard"
              />
              <CompareRow
                dim="Borrower APR"
                vaulx="26%"
                tradfi="40%+ (state-bank monopoly in BR)"
              />
              <CompareRow
                dim="Lender visibility"
                vaulx="On-chain LTV, IoT vault feed, custody hash"
                tradfi="Quarterly statements"
              />
              <CompareRow
                dim="Default recovery"
                vaulx="On-chain auction · 90% target"
                tradfi="Slow resale · margin captured by middlemen"
              />
            </tbody>
          </table>
        </div>
      </section>

      {/* CTA STRIP */}
      <section className="mt-24 border-t border-[var(--rule)] pt-12">
        <span className="eyebrow">Walk the architecture</span>
        <h2 className="mt-3 font-display text-[clamp(1.5rem,3vw,2.5rem)] font-bold leading-[1.1] tracking-[-0.015em] text-[var(--ink)]">
          Three doors in.
        </h2>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link
            href="/demo/architecture"
            className="inline-flex items-center gap-2 rounded-md border border-[var(--rule-strong)] px-5 py-3 font-mono text-xs uppercase tracking-[0.18em] text-[var(--ink)] hover:border-[var(--brand)] hover:text-[var(--brand)]"
          >
            View the architecture
            <span aria-hidden>→</span>
          </Link>
          <Link
            href="/demo/auction"
            className="inline-flex items-center gap-2 rounded-md border border-[var(--rule-strong)] px-5 py-3 font-mono text-xs uppercase tracking-[0.18em] text-[var(--ink)] hover:border-[var(--brand)] hover:text-[var(--brand)]"
          >
            Explore the auction floor
            <span aria-hidden>→</span>
          </Link>
          <button
            type="button"
            onClick={startTour}
            className="inline-flex items-center gap-2 rounded-md bg-[var(--brand)] px-5 py-3 font-mono text-xs uppercase tracking-[0.18em] text-[var(--bg)]"
          >
            Take the guided tour
            <span aria-hidden>→</span>
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-20 border-t border-[var(--rule)] pt-8 pb-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--ink-muted)]">
          Custody-gated RWA lending on Solana · Devnet preview · Frontier Hackathon 2026
        </p>
      </footer>
    </DemoShell>
  );
}

function Move({
  number,
  label,
  body,
}: {
  number: string;
  label: string;
  body: string;
}) {
  return (
    <li className="bg-[var(--bg)] p-6">
      <div className="flex items-baseline gap-3">
        <span
          className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--brand)]"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {number}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
          ·
        </span>
        <h3 className="font-display text-base font-semibold leading-tight tracking-tight text-[var(--ink)]">
          {label}
        </h3>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-[var(--ink-dim)]">
        {body}
      </p>
    </li>
  );
}

function Stat({
  eyebrow,
  value,
  unit,
}: {
  eyebrow: string;
  value: string;
  unit?: string;
}) {
  return (
    <div className="bg-[var(--bg)] p-6">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
        {eyebrow}
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <span
          className="font-mono text-3xl tracking-[-0.02em] text-[var(--ink)]"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {value}
        </span>
        {unit && (
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

function Pitch({
  tag,
  title,
  body,
}: {
  tag: string;
  title: string;
  body: string;
}) {
  return (
    <div className="bg-[var(--bg)] p-8">
      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--brand)]">
        {tag}
      </span>
      <h3 className="mt-4 font-display text-xl font-semibold leading-tight tracking-tight text-[var(--ink)]">
        {title}
      </h3>
      <p className="mt-4 text-sm leading-relaxed text-[var(--ink-dim)]">
        {body}
      </p>
    </div>
  );
}

function Th({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right" | "center";
}) {
  return (
    <th
      className={`px-4 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)] text-${align}`}
    >
      {children}
    </th>
  );
}

function CompareRow({
  dim,
  vaulx,
  tradfi,
}: {
  dim: string;
  vaulx: string;
  tradfi: string;
}) {
  return (
    <tr className="border-b border-[var(--rule)] last:border-b-0">
      <td className="px-4 py-3 align-top font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
        {dim}
      </td>
      <td className="px-4 py-3 align-top text-sm text-[var(--brand)]">
        {vaulx}
      </td>
      <td className="px-4 py-3 align-top text-sm text-[var(--ink-dim)]">
        {tradfi}
      </td>
    </tr>
  );
}
