"use client";
// Inline SVG sparkline of the 24-point hourly price history seeded from
// `appraisal.median` (Phase 2 Task 2.2). Source pills nod to the production
// stack: RedStone wraps Chrono24 polling, with Pyth as a secondary feed.
import { useMemo } from "react";

type Props = {
  priceHistory: number[];
};

const SOURCES = ["RedStone", "Pyth", "Chrono24"] as const;

const USD = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function RedstoneFeedCard({ priceHistory }: Props) {
  const safeHistory = priceHistory && priceHistory.length > 0 ? priceHistory : [0];
  const last = safeHistory[safeHistory.length - 1] ?? 0;
  const first = safeHistory[0] ?? 0;
  const deltaPct = first === 0 ? 0 : ((last - first) / first) * 100;
  const isUp = deltaPct >= 0;

  const path = useMemo(() => buildSparklinePath(safeHistory, 200, 60), [safeHistory]);

  return (
    <div className="rounded-md border border-[var(--rule)] bg-[var(--bg-elev-1)] p-4">
      {/* Source pills */}
      <div className="flex items-center gap-2">
        {SOURCES.map((src) => (
          <span
            key={src}
            className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--ink-muted)] rounded-sm border border-[var(--rule)] bg-[var(--bg)] px-1.5 py-0.5"
          >
            {src}
          </span>
        ))}
      </div>

      {/* Sparkline + value row */}
      <div className="mt-3 flex items-center gap-3">
        <svg
          width={200}
          height={60}
          viewBox="0 0 200 60"
          role="img"
          aria-label="24-hour collateral price feed"
          className="flex-shrink-0"
        >
          <defs>
            <linearGradient id="vx-spark-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {path.fill && (
            <path d={path.fill} fill="url(#vx-spark-fill)" stroke="none" />
          )}
          <path
            d={path.stroke}
            fill="none"
            stroke="var(--brand)"
            strokeWidth={1.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>

        <div className="flex flex-col items-end">
          <span
            className="font-mono text-2xl text-[var(--ink)]"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            ${USD.format(Math.round(last))}
          </span>
          <span
            className="font-mono text-[10px] uppercase tracking-[0.14em]"
            style={{
              color: isUp ? "var(--brand)" : "rgb(251 113 133)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {isUp ? "+" : ""}
            {deltaPct.toFixed(2)}% · 24h
          </span>
        </div>
      </div>

      <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
        RedStone-wrapped Chrono24 · 60s tick · simulated demo
      </p>
    </div>
  );
}

function buildSparklinePath(
  history: number[],
  width: number,
  height: number,
): { stroke: string; fill: string | null } {
  const padding = 2;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  if (history.length === 1) {
    const y = padding + innerH / 2;
    return {
      stroke: `M ${padding} ${y} L ${width - padding} ${y}`,
      fill: null,
    };
  }

  const min = Math.min(...history);
  const max = Math.max(...history);
  const range = max - min || 1;
  const stepX = innerW / (history.length - 1);

  const points = history.map((v, i) => {
    const x = padding + i * stepX;
    const y = padding + innerH * (1 - (v - min) / range);
    return [x, y] as const;
  });

  const stroke = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(" ");

  const fill =
    `M ${points[0][0].toFixed(2)} ${(height - padding).toFixed(2)} ` +
    points
      .map(([x, y]) => `L ${x.toFixed(2)} ${y.toFixed(2)}`)
      .join(" ") +
    ` L ${points[points.length - 1][0].toFixed(2)} ${(height - padding).toFixed(2)} Z`;

  return { stroke, fill };
}
