import type { LucideIcon } from "lucide-react";

interface Props {
  Icon: LucideIcon;
  title: string;
  subtitle: string;
}

/**
 * Square card from the "Accepted Collateral" section. Surface fill, ink
 * hairline border, large teal lucide icon, bold title, muted subtitle.
 * Hover lifts and re-tints the border (Laravel `.asset-type-card:hover`).
 */
export function AssetTypeCard({ Icon, title, subtitle }: Props) {
  return (
    <div className="group h-full rounded-md border border-[var(--vx-border)] bg-[var(--vx-surface)] px-5 py-8 text-center text-[var(--vx-text)] transition-all duration-200 ease-glide hover:-translate-y-[3px] hover:border-[var(--vx-teal)]">
      <Icon
        className="mx-auto mb-3 h-[2.25rem] w-[2.25rem] text-[var(--vx-teal)]"
        strokeWidth={1.5}
        aria-hidden
      />
      <h6 className="font-sans text-[1rem] font-bold text-[var(--vx-text)]">
        {title}
      </h6>
      <small className="block text-[0.75rem] text-[var(--vx-text-muted)]">
        {subtitle}
      </small>
    </div>
  );
}
