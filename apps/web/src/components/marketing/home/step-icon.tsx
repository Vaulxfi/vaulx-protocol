import type { LucideIcon } from "lucide-react";

interface Props {
  Icon: LucideIcon;
}

/**
 * 60px circular outlined-teal icon used in the "How it works" steps.
 * Mirrors `.step-icon` from site/resources/css/app.css.
 */
export function StepIcon({ Icon }: Props) {
  return (
    <div
      className="mx-auto mb-4 flex h-[60px] w-[60px] items-center justify-center rounded-full border border-[var(--vx-teal)] bg-[var(--vx-surface)] text-[var(--vx-teal)]"
      aria-hidden
    >
      <Icon className="h-6 w-6" strokeWidth={1.5} />
    </div>
  );
}
