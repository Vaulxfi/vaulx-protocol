"use client";

import { useEffect, useState } from "react";

interface TickerEvent {
  name: string;
  detail: string;
  t: string;
}

interface TickerResponse {
  events: TickerEvent[];
  source: "live" | "seeded";
}

const SEED: TickerEvent[] = [
  { name: "deposited", detail: "100,000 USDC → Vault VX-01", t: "-00:00:42" },
  { name: "ccbTrdcCreated", detail: "TRDC #7A2F · Rolex 116610LN · 60% LTV", t: "-00:02:11" },
  { name: "custodyConfirmed", detail: "TRDC #7A2F · custodian BR-SP", t: "-00:03:54" },
  { name: "disbursed", detail: "42,000 USDC → borrower", t: "-00:05:20" },
  { name: "deposited", detail: "25,000 USDC → Vault VX-01", t: "-00:09:03" },
  { name: "ccbTrdcCreated", detail: "TRDC #A13C · Patek 5711/1A · 55% LTV", t: "-00:11:47" },
  { name: "custodyConfirmed", detail: "TRDC #A13C · custodian BR-SP", t: "-00:14:02" },
  { name: "disbursed", detail: "67,000 USDC → borrower", t: "-00:14:58" },
  { name: "deposited", detail: "200,000 USDC → Vault VX-01", t: "-00:18:21" },
  { name: "ccbTrdcCreated", detail: "TRDC #D4F8 · AP 15202ST · 50% LTV", t: "-00:22:09" },
  { name: "custodyConfirmed", detail: "TRDC #D4F8 · custodian BR-SP", t: "-00:24:32" },
  { name: "disbursed", detail: "85,000 USDC → borrower", t: "-00:26:40" }
];

const EVENT_COLOR: Record<string, string> = {
  deposited: "var(--signal-good)",
  ccbTrdcCreated: "var(--brand)",
  custodyConfirmed: "var(--ink)",
  disbursed: "var(--signal-warn)"
};

export function OnchainTicker({ dense = false }: { dense?: boolean }) {
  const [events, setEvents] = useState<TickerEvent[]>(SEED);
  const [source, setSource] = useState<"live" | "seeded">("seeded");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/onchain-events/ticker", {
          cache: "no-store"
        });
        if (!res.ok) return;
        const data = (await res.json()) as TickerResponse;
        if (cancelled) return;
        if (data.events?.length) setEvents(data.events);
        setSource(data.source);
      } catch {
        /* keep seed */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Duplicate the list so the marquee loops seamlessly.
  const doubled = [...events, ...events];

  return (
    <div
      className={`vx-marquee group relative w-full border-y border-[var(--rule)] bg-[var(--bg-elev-1)] ${
        dense ? "py-2.5" : "py-4"
      }`}
      aria-label="Live on-chain events"
      role="marquee"
      tabIndex={0}
    >
      {/* Source pill */}
      <div className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2">
        <div className="flex items-center gap-2 bg-[var(--bg-elev-1)] pr-4">
          <span
            aria-hidden
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{
              background:
                source === "live" ? "var(--signal-good)" : "var(--brand)",
              boxShadow:
                source === "live"
                  ? "0 0 8px var(--signal-good)"
                  : "0 0 8px var(--brand)"
            }}
          />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--ink-muted)]">
            {source === "live" ? "LIVE · ON-CHAIN" : "DEMO · SEEDED"}
          </span>
        </div>
      </div>

      <div className="vx-marquee-track pl-36">
        {doubled.map((ev, i) => (
          <span
            key={`${ev.name}-${i}`}
            className="inline-flex items-center gap-3 px-5 font-mono text-xs"
          >
            <span
              className="text-[var(--ink-muted)]"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {ev.t}
            </span>
            <span aria-hidden className="text-[var(--rule-strong)]">
              ·
            </span>
            <span
              className="uppercase tracking-[0.14em]"
              style={{ color: EVENT_COLOR[ev.name] ?? "var(--ink)" }}
            >
              {ev.name}
            </span>
            <span aria-hidden className="text-[var(--rule-strong)]">
              ·
            </span>
            <span className="text-[var(--ink-dim)]">{ev.detail}</span>
            <span aria-hidden className="px-3 text-[var(--rule-strong)]">
              ◆
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
