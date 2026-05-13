import { cn } from "@/lib/utils";

interface Props {
  children: React.ReactNode;
  variant?: "pill" | "inline";
  className?: string;
}

/**
 * Section eyebrow used across Laravel marketing views. Two visual modes:
 *
 * - `pill`   — teal dot + label inside a 1px hairline pill, used in hero
 *              and live-data strip eyebrows.
 * - `inline` — flat mono uppercase label used above section headlines.
 */
export function PitchLine({ children, variant = "inline", className }: Props) {
  if (variant === "pill") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-2 px-[1.1rem] py-[0.4rem]",
          "border border-[var(--vx-border-soft)] rounded-full",
          "font-mono text-[0.75rem] uppercase tracking-[0.14em]",
          "text-[var(--vx-text-muted)]",
          className,
        )}
      >
        <span className="text-[var(--vx-teal)]" aria-hidden>
          ●
        </span>
        <span>{children}</span>
      </span>
    );
  }

  return (
    <p
      className={cn(
        "mb-2 font-mono text-[0.75rem] font-medium uppercase tracking-[0.14em]",
        "text-[var(--vx-text-muted)]",
        className,
      )}
    >
      {children}
    </p>
  );
}
