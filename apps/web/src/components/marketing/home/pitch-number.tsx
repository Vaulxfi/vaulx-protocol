import { cn } from "@/lib/utils";

interface Props {
  value: React.ReactNode;
  label: React.ReactNode;
  accent?: boolean;
  className?: string;
}

/**
 * Stat block used in the hero trust band, the live on-chain strip and
 * the protocol-economics cards. The accent variant flips the number to
 * teal; ink (default) is used for the primary stat in each pair.
 */
export function PitchNumber({ value, label, accent = false, className }: Props) {
  return (
    <div className={cn("text-center", className)}>
      <div
        className={cn(
          "font-sans text-[3rem] font-bold tracking-[-0.03em] leading-[1.05]",
          accent ? "text-[var(--vx-teal-2)]" : "text-[var(--vx-text)]",
        )}
      >
        {value}
      </div>
      <p className="mt-2 font-sans text-[0.875rem] tracking-[0.04em] text-[var(--vx-text-muted)]">
        {label}
      </p>
    </div>
  );
}
