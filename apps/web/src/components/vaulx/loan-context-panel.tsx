"use client";

import type { LoanSummary } from "@/lib/chain/loan-summary";

const USD = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function fmtAtoms(atoms: bigint): string {
  const whole = Number(atoms) / 1_000_000;
  return `${USD.format(whole)}`;
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

/**
 * Right-side context panel shared by /pay, /renew, /repay. Shows the
 * definitive on-chain state the borrower is acting on — TRDC PDA, appraisal,
 * principal, rate, due date, and the CCB doc-hash.
 */
export function LoanContextPanel({
  summary,
  trdcBase58,
}: {
  summary: LoanSummary | null | undefined;
  trdcBase58: string;
}) {
  return (
    <div className="border border-[var(--rule-strong)] bg-[var(--bg-elev-1)] p-6 md:p-8">
      <div className="flex items-start justify-between gap-4 border-b border-[var(--rule)] pb-5">
        <div>
          <span className="eyebrow">The loan</span>
          <div className="mt-3 font-mono text-xs text-[var(--brand)]">
            TRDC · {shorten(trdcBase58, 8, 8)}
          </div>
        </div>
        {summary && (
          <span
            className="font-mono text-[10px] uppercase tracking-[0.2em]"
            style={{
              color: statusColor(summary.status),
            }}
          >
            {summary.statusLabel}
          </span>
        )}
      </div>

      {!summary && (
        <p className="mt-6 font-sans text-sm text-[var(--ink-dim)]">
          Loading on-chain state…
        </p>
      )}

      {summary && (
        <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-6 gap-y-4 font-mono text-xs">
          <Row k="Appraisal" v={`${fmtAtoms(summary.appraisalAtoms)} USDC`} />
          <Row k="Principal (orig)" v={`${fmtAtoms(summary.principalAtoms)} USDC`} />
          <Row
            k="Principal left"
            v={`${fmtAtoms(summary.principalRemainingAtoms)} USDC`}
          />
          <Row k="Rate" v={`${formatBpsPct(summary.rateBps)} APR`} />
          <Row
            k="Due"
            v={`${toIsoDate(summary.dueTs)} · ${
              summary.daysRemaining > 0
                ? `${summary.daysRemaining}d left`
                : `${Math.abs(summary.daysRemaining)}d overdue`
            }`}
          />
          <Row k="Accrued" v={`${fmtAtoms(summary.accruedAtoms)} USDC`} />
          <Row k="Payoff today" v={`${fmtAtoms(summary.payoffAtoms)} USDC`} />
          <dt className="text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
            CCB hash
          </dt>
          <dd className="break-all text-[var(--ink-dim)] tabnums">
            0x{shorten(summary.docHashHex, 10, 10)}
          </dd>
        </dl>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <>
      <dt className="text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
        {k}
      </dt>
      <dd className="text-[var(--ink)] tabnums">{v}</dd>
    </>
  );
}

function statusColor(status: LoanSummary["status"]): string {
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
