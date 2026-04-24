import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface MetricCardProps {
  eyebrow: string;
  value: ReactNode;
  unit?: string;
  delta?: string;
  context?: string;
  variant?: "positive" | "negative" | "neutral";
  className?: string;
}

const DELTA_COLOR = {
  positive: "var(--signal-good)",
  negative: "var(--signal-bad)",
  neutral: "var(--ink-muted)"
} as const;

export function MetricCard({
  eyebrow,
  value,
  unit,
  delta,
  context,
  variant = "neutral",
  className
}: MetricCardProps) {
  return (
    <article
      className={cn(
        "group relative flex flex-col gap-5 border border-[var(--rule)] bg-[var(--bg-elev-1)] p-6 transition-colors duration-300 ease-decisive hover:border-[var(--rule-strong)]",
        className
      )}
    >
      {/* Top rule accent */}
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-[var(--brand)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />

      <header className="flex items-baseline justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--ink-muted)]">
          {eyebrow}
        </span>
        {delta && (
          <span
            className="font-mono text-[10px] uppercase tracking-[0.14em] tabnums"
            style={{ color: DELTA_COLOR[variant] }}
          >
            {delta}
          </span>
        )}
      </header>

      <div className="flex items-baseline gap-2">
        <span
          className="font-mono text-5xl font-medium leading-none tracking-[-0.02em] tabnums text-[var(--ink)] md:text-6xl"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {value}
        </span>
        {unit && (
          <span className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--ink-muted)]">
            {unit}
          </span>
        )}
      </div>

      {context && (
        <p className="font-sans text-xs leading-relaxed text-[var(--ink-muted)]">
          {context}
        </p>
      )}
    </article>
  );
}
