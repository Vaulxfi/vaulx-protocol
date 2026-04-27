"use client";
// Circular LTV gauge — the dashboard's centerpiece. The same `priceHistory`
// array that drives <RedstoneFeedCard>'s sparkline drives the collateral
// value here, so the gauge ticks in sync with the feed.
import { useMemo } from "react";

type Props = {
  loanAmountAtoms: bigint;
  collateralValueAtoms: bigint;
  size?: number;
};

type Zone = "safe" | "warn" | "danger";

function zoneFor(ltv: number): Zone {
  if (ltv >= 75) return "danger";
  if (ltv >= 60) return "warn";
  return "safe";
}

const ZONE_STROKE: Record<Zone, string> = {
  safe: "var(--brand)",
  warn: "rgb(251 191 36)", // amber-400
  danger: "rgb(251 113 133)", // rose-400
};

const ZONE_LABEL: Record<Zone, string> = {
  safe: "Safe",
  warn: "Watch",
  danger: "Danger",
};

export function LtvGauge({
  loanAmountAtoms,
  collateralValueAtoms,
  size = 200,
}: Props) {
  const ltv = useMemo(() => {
    if (collateralValueAtoms === 0n) return 0;
    // BPS-precise: (loan / collateral) in basis points → percent.
    const bps = Number((loanAmountAtoms * 10000n) / collateralValueAtoms);
    return bps / 100;
  }, [loanAmountAtoms, collateralValueAtoms]);

  const zone = zoneFor(ltv);
  const stroke = ZONE_STROKE[zone];

  // Geometry — a stroked circle clamped to 0-100% sweep.
  const strokeWidth = Math.max(8, Math.round(size * 0.06));
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, ltv));
  const dashOffset = circumference * (1 - clamped / 100);
  const display = `${clamped.toFixed(0)}%`;

  return (
    <div
      className="inline-flex flex-col items-center"
      data-testid="ltv-gauge"
      data-zone={zone}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`Loan-to-value ${display}`}
      >
        {/* Track */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="var(--rule)"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc — start at 12 o'clock */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: "stroke-dashoffset 600ms ease-out" }}
        />
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="central"
          style={{
            fontFamily:
              "var(--font-mono, ui-monospace, SFMono-Regular, monospace)",
            fontVariantNumeric: "tabular-nums",
            fontSize: Math.round(size * 0.22),
            fill: "var(--ink)",
          }}
        >
          {display}
        </text>
        <text
          x={cx}
          y={cy + Math.round(size * 0.18)}
          textAnchor="middle"
          dominantBaseline="central"
          style={{
            fontFamily:
              "var(--font-mono, ui-monospace, SFMono-Regular, monospace)",
            fontSize: Math.round(size * 0.06),
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            fill: "var(--ink-muted)",
          }}
        >
          LTV
        </text>
      </svg>
      <span
        className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em]"
        style={{ color: stroke }}
      >
        {ZONE_LABEL[zone]}
      </span>
    </div>
  );
}
