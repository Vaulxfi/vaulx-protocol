"use client";
// Synthetic event stream for the dashboard. A 5s tick generates one of three
// event types anchored to the active loan: interest accrual, LTV recompute,
// or a price tick. Renders as the existing .vx-marquee track so it pauses on
// hover and respects prefers-reduced-motion.
import { useEffect, useState } from "react";
import { computeInterestAccrued } from "@vaulx/terms";
import { useDemoSession } from "../_lib/use-demo-session";

type Event = {
  id: number;
  kind: "interest_accrued" | "ltv_recompute" | "price_tick";
  text: string;
};

const USDC_4 = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

const USD_0 = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function fmtTime(d: Date): string {
  return d.toTimeString().slice(0, 8);
}

export function LiveTicker() {
  const { session } = useDemoSession();
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    if (!session?.loan) return;
    let counter = 0;

    const tick = () => {
      const loan = session.loan;
      if (!loan) return;
      const principal = (() => {
        try {
          return BigInt(loan.principalAtoms);
        } catch {
          return 0n;
        }
      })();

      const history = session.watch?.priceHistory ?? [];
      const last = history[history.length - 1] ?? 0;
      const collateralAtoms = BigInt(Math.floor(last * 1_000_000));

      const ltv =
        collateralAtoms === 0n
          ? 0
          : Number((principal * 10000n) / collateralAtoms) / 100;

      // Per-tick "small" accrual: 1 day of interest at the configured rate
      // divided by 24 — an honest approximation of "per hour" so the demo
      // ticker shows a believable trickle rather than 0.
      const oneDay = computeInterestAccrued(principal, loan.rateBps, 1);
      const perHour = oneDay / 24n;
      // 6 decimals → divide by 1_000_000 to get USDC float.
      const accruedUsdc = Number(perHour) / 1_000_000;

      const stamp = fmtTime(new Date());
      const kinds: Event["kind"][] = [
        "interest_accrued",
        "ltv_recompute",
        "price_tick",
      ];
      const kind = kinds[counter % kinds.length];

      let text = "";
      if (kind === "interest_accrued") {
        text = `${stamp}  ·  Interest accrued: ${USDC_4.format(accruedUsdc)} USDC`;
      } else if (kind === "ltv_recompute") {
        text = `${stamp}  ·  LTV recompute: ${ltv.toFixed(2)}%`;
      } else {
        text = `${stamp}  ·  Price tick: $${USD_0.format(Math.round(last))}`;
      }

      counter += 1;
      setEvents((prev) => [{ id: counter, kind, text }, ...prev].slice(0, 12));
    };

    tick();
    const id = window.setInterval(tick, 5000);
    return () => window.clearInterval(id);
  }, [session?.loan, session?.watch?.priceHistory]);

  if (!session?.loan) return null;

  // Duplicate the line so the marquee keeps a continuous loop.
  const line = events.length === 0 ? "Live feed warming up…" : eventsToLine(events);

  return (
    <div className="vx-marquee rounded-md border border-[var(--rule)] bg-black px-3 py-2">
      <span
        className="mr-3 inline-block h-2 w-2 flex-shrink-0 rounded-full bg-[var(--brand)]"
        style={{ animation: "vxLivePulse 1.4s ease-in-out infinite" }}
        aria-hidden
      />
      <span className="vx-marquee-track font-mono text-[11px] tracking-[0.06em] text-[var(--brand)]">
        <span className="px-2">{line}</span>
        <span className="px-2">{line}</span>
      </span>
      <style jsx>{`
        @keyframes vxLivePulse {
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
  );
}

function eventsToLine(events: Event[]): string {
  return events
    .slice(0, 8)
    .map((e) => e.text)
    .join("    •    ");
}
