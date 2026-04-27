"use client";
// 3-tier auction waterfall — the visual moat.
// Tier 1 (Platform lenders, 72h) → Tier 2 (Reseller curated, 48h) → Tier 3 (Public, 168h).
// Active tier glows brass + countdown; pending tiers dim; complete shows checkmark; no-bids ribbon.
import { useEffect, useMemo, useState } from "react";

export type TierStatus = "active" | "pending" | "complete" | "no-bids";

export type Tier = {
  number: 1 | 2 | 3;
  name: string;
  durationHours: number;
  description: string;
  status: TierStatus;
  elapsedHours?: number;
  highBid?: number;
  reserve?: number;
  bidders?: number;
};

type Props = {
  tiers: [Tier, Tier, Tier];
  currency?: string;
};

const fmtMoney = (n: number, currency: string) => {
  const formatted = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(n);
  return `${formatted} ${currency}`;
};

function fmtRemaining(remainingMs: number): string {
  if (remainingMs <= 0) return "00:00:00";
  const totalSec = Math.floor(remainingMs / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function AuctionTierTimeline({ tiers, currency = "USDC" }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-stretch md:gap-3">
      <TierCard tier={tiers[0]} currency={currency} />
      <FlowConnector />
      <TierCard tier={tiers[1]} currency={currency} />
      <FlowConnector />
      <TierCard tier={tiers[2]} currency={currency} />
    </div>
  );
}

function FlowConnector() {
  return (
    <div
      aria-hidden
      className="hidden self-center font-mono text-base text-[var(--ink-muted)] md:block"
    >
      →
    </div>
  );
}

function TierCard({ tier, currency }: { tier: Tier; currency: string }) {
  const isActive = tier.status === "active";
  const isPending = tier.status === "pending";
  const isComplete = tier.status === "complete";
  const isNoBids = tier.status === "no-bids";

  const remainingMs = useCountdown(tier);

  const baseClasses = [
    "relative flex flex-col gap-4 rounded-md border bg-[var(--bg)] p-5 transition-colors",
    isActive
      ? "border-l-4 border-[var(--brand)] border-y border-r border-[var(--brand)]/30 bg-[var(--brand)]/5"
      : "border-[var(--rule)]",
    isPending ? "opacity-60" : "",
  ].join(" ");

  return (
    <div className={baseClasses} data-status={tier.status}>
      {/* Eyebrow */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--ink-muted)]">
          TIER {tier.number} · {tier.durationHours}H
        </span>
        <StatusPill status={tier.status} />
      </div>

      {/* Body */}
      <div>
        <h3 className="font-display text-lg font-semibold leading-tight tracking-tight text-[var(--ink)]">
          {tier.name}
        </h3>
        <p className="mt-2 text-xs leading-relaxed text-[var(--ink-dim)]">
          {tier.description}
        </p>
      </div>

      {/* No-bids ribbon */}
      {isNoBids && (
        <div className="rounded-sm border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-rose-300">
          No bids placed
        </div>
      )}

      {/* Active tier countdown + bid stats */}
      {isActive && (
        <div className="mt-auto flex flex-col gap-3 border-t border-[var(--brand)]/20 pt-3">
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
              Time left
            </span>
            <span
              className="font-mono text-base text-[var(--brand)]"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {fmtRemaining(remainingMs)}
            </span>
          </div>
          {typeof tier.highBid === "number" && tier.highBid > 0 && (
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                High bid
              </span>
              <span
                className="font-mono text-sm text-[var(--ink)]"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {fmtMoney(tier.highBid, currency)}
              </span>
            </div>
          )}
          {typeof tier.bidders === "number" && (
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                Bidders
              </span>
              <span
                className="font-mono text-sm text-[var(--ink)]"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {tier.bidders}
              </span>
            </div>
          )}
          {typeof tier.reserve === "number" && (
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                Reserve
              </span>
              <span
                className={`font-mono text-sm ${
                  typeof tier.highBid === "number" && tier.highBid >= tier.reserve
                    ? "text-emerald-400"
                    : "text-[var(--ink-dim)]"
                }`}
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {fmtMoney(tier.reserve, currency)}
                {typeof tier.highBid === "number" && tier.highBid >= tier.reserve
                  ? " ✓"
                  : ""}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Complete tier summary */}
      {isComplete && (
        <div className="mt-auto flex items-center gap-2 border-t border-[var(--rule)] pt-3">
          <span className="font-mono text-sm text-emerald-400">✓</span>
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-emerald-400">
            Cleared
            {typeof tier.highBid === "number" && tier.highBid > 0
              ? ` · ${fmtMoney(tier.highBid, currency)}`
              : ""}
          </span>
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: TierStatus }) {
  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--brand)]/40 bg-[var(--brand)]/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--brand)]">
        <span
          className="h-1 w-1 rounded-full bg-[var(--brand)]"
          style={{ animation: "pulse 1.4s ease-in-out infinite" }}
        />
        Active
      </span>
    );
  }
  if (status === "complete") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-emerald-400">
        Complete
      </span>
    );
  }
  if (status === "no-bids") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/40 bg-rose-500/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-rose-300">
        No bids
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[var(--rule)] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
      Pending
    </span>
  );
}

function useCountdown(tier: Tier): number {
  const totalMs = tier.durationHours * 3600 * 1000;
  const initialRemaining = useMemo(() => {
    if (tier.status !== "active") return 0;
    const elapsed = (tier.elapsedHours ?? 0) * 3600 * 1000;
    return Math.max(0, totalMs - elapsed);
  }, [tier.status, tier.elapsedHours, totalMs]);

  const [remaining, setRemaining] = useState(initialRemaining);

  useEffect(() => {
    setRemaining(initialRemaining);
    if (tier.status !== "active") return;
    const t = setInterval(() => {
      setRemaining((r) => Math.max(0, r - 1000));
    }, 1000);
    return () => clearInterval(t);
  }, [initialRemaining, tier.status]);

  return remaining;
}
