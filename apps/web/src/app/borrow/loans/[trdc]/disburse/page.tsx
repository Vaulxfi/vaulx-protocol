"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { EditorialSection } from "@/components/vaulx/editorial-section";
import { SiteFooter } from "@/components/vaulx/site-footer";
import { SiteHeader } from "@/components/vaulx/site-header";
import {
  useLoanSummary,
  type LoanSummary,
} from "@/lib/chain/loan-summary";

const USD = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
function fmtAtoms(atoms: bigint): string {
  return USD.format(Number(atoms) / 1_000_000);
}
function shorten(s: string, head = 6, tail = 6): string {
  if (s.length <= head + tail + 1) return s;
  return `${s.slice(0, head)}…${s.slice(-tail)}`;
}
function toIsoDate(unixSec: number): string {
  if (!unixSec) return "—";
  return new Date(unixSec * 1000).toISOString().slice(0, 10);
}
function formatBpsPct(bps: number): string {
  const whole = Math.floor(bps / 100);
  const rem = bps % 100;
  return `${whole}.${rem.toString().padStart(2, "0")}%`;
}

export default function LoanDashboardPage() {
  return (
    <>
      <SiteHeader />
      <Suspense fallback={null}>
        <DashboardContent />
      </Suspense>
      <SiteFooter />
    </>
  );
}

function DashboardContent() {
  const params = useParams<{ trdc: string }>();
  const trdc = params?.trdc ?? "";
  const summaryQuery = useLoanSummary(trdc);
  const summary = summaryQuery.data ?? null;

  return (
    <main className="relative min-h-[calc(100vh-72px-64px)]">
      <div className="mx-auto w-full max-w-[1440px] px-6 py-16 md:px-10 md:py-20">
        <EditorialSection
          eyebrow="Your loan"
          headline={`Your loan · ${shorten(trdc, 6, 6)}`}
          lead="Manage installments, renewal, and payoff. Live TRDC state from Solana — refreshes every 10 seconds."
        />

        <div className="mt-14 flex flex-col gap-10">
          <StatusHero summary={summary} trdc={trdc} loading={summaryQuery.isLoading} />
          <Actions summary={summary} trdc={trdc} />
        </div>
      </div>
    </main>
  );
}

function statusColor(status: LoanSummary["status"] | undefined): string {
  switch (status) {
    case "active":
      return "var(--signal-good)";
    case "activeInCustody":
    case "renewed":
      return "var(--brand)";
    case "overdue":
      return "var(--signal-warn)";
    case "defaulted":
    case "liquidated":
      return "var(--signal-bad)";
    case "repaid":
      return "var(--ink-muted)";
    default:
      return "var(--ink-muted)";
  }
}

function StatusHero({
  summary,
  trdc,
  loading,
}: {
  summary: LoanSummary | null | undefined;
  trdc: string;
  loading: boolean;
}) {
  return (
    <div className="border border-[var(--rule-strong)] bg-[var(--bg-elev-1)] p-6 md:p-10">
      <div className="flex flex-col gap-2 border-b border-[var(--rule)] pb-6 md:flex-row md:items-start md:justify-between">
        <div>
          <span className="eyebrow">TRDC · On-chain state</span>
          <div className="mt-3 break-all font-mono text-xs text-[var(--brand)]">
            {trdc}
          </div>
        </div>

        {summary && (
          <span
            className="inline-flex items-center gap-2 border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em]"
            style={{
              color: statusColor(summary.status),
              borderColor: statusColor(summary.status),
            }}
          >
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ background: statusColor(summary.status) }}
            />
            {summary.statusLabel}
          </span>
        )}
      </div>

      {loading && !summary && (
        <p className="mt-6 font-sans text-sm text-[var(--ink-dim)]">
          Loading loan state from chain…
        </p>
      )}

      {summary && (
        <div className="mt-8 grid gap-10 md:grid-cols-3">
          <BigStat
            label="Principal remaining"
            value={`${fmtAtoms(summary.principalRemainingAtoms)}`}
            suffix="USDC"
          />
          <BigStat
            label="Payoff today"
            value={`${fmtAtoms(summary.payoffAtoms)}`}
            suffix="USDC"
            highlight
          />
          <BigStat
            label="Due"
            value={toIsoDate(summary.dueTs)}
            suffix={
              summary.daysRemaining >= 0
                ? `${summary.daysRemaining}d remaining · ${formatBpsPct(summary.rateBps)} APR`
                : `${Math.abs(summary.daysRemaining)}d overdue`
            }
          />
        </div>
      )}
    </div>
  );
}

function BigStat({
  label,
  value,
  suffix,
  highlight = false,
}: {
  label: string;
  value: string;
  suffix?: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
        {label}
      </div>
      <div
        className="mt-3 font-mono text-3xl tabnums md:text-4xl"
        style={{ color: highlight ? "var(--brand)" : "var(--ink)" }}
      >
        {value}
      </div>
      {suffix && (
        <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
          {suffix}
        </div>
      )}
    </div>
  );
}

function Actions({
  summary,
  trdc,
}: {
  summary: LoanSummary | null | undefined;
  trdc: string;
}) {
  const isActive = summary?.status === "active" || summary?.status === "renewed";
  const hint = (() => {
    if (!summary) return "Loading…";
    if (summary.status === "pendingCustody")
      return "Awaiting custody confirmation. Once your watch is received, the TRDC moves to ActiveInCustody.";
    if (summary.status === "activeInCustody")
      return "Custody confirmed. Your USDC disbursement is next — this will flip the loan to Active.";
    if (summary.status === "repaid")
      return "Loan already repaid. Your watch is being released from custody.";
    if (summary.status === "defaulted")
      return "Grace period exceeded. The collateral has been sent to auction.";
    if (summary.status === "liquidated")
      return "Collateral liquidated via auction.";
    if (summary.status === "overdue")
      return "Past due but within grace — payoff is still possible.";
    return null;
  })();

  const enabled = isActive || summary?.status === "overdue";

  return (
    <div className="flex flex-col gap-6">
      {hint && (
        <div className="border border-[var(--rule)] bg-[var(--bg)] p-4 font-mono text-xs text-[var(--ink-dim)]">
          {hint}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-3">
        <ActionCta
          href={`/borrow/loans/${trdc}/pay`}
          label="Pay an installment"
          disabled={!enabled}
        />
        <ActionCta
          href={`/borrow/loans/${trdc}/renew`}
          label="Renew"
          disabled={!enabled}
        />
        <ActionCta
          href={`/borrow/loans/${trdc}/repay`}
          label="Pay off in full"
          disabled={!enabled}
          emphasis
        />
      </div>
    </div>
  );
}

function ActionCta({
  href,
  label,
  disabled,
  emphasis = false,
}: {
  href: string;
  label: string;
  disabled?: boolean;
  emphasis?: boolean;
}) {
  const base =
    "group flex items-center justify-between border px-6 py-6 font-mono text-sm uppercase tracking-[0.14em] transition-colors";
  if (disabled) {
    return (
      <div
        className={`${base} cursor-not-allowed border-[var(--rule)] bg-[var(--bg)] text-[var(--ink-muted)] opacity-50`}
      >
        <span>{label}</span>
        <span aria-hidden>→</span>
      </div>
    );
  }
  return (
    <Link
      href={href}
      className={`${base} ${
        emphasis
          ? "border-[var(--brand)] bg-[var(--brand-wash)] text-[var(--brand)] hover:bg-[var(--brand)] hover:text-[var(--bg)]"
          : "border-[var(--rule-strong)] bg-[var(--bg-elev-1)] text-[var(--ink)] hover:border-[var(--brand)] hover:text-[var(--brand)]"
      }`}
    >
      <span>{label}</span>
      <span aria-hidden className="transition-transform group-hover:translate-x-1">
        →
      </span>
    </Link>
  );
}
