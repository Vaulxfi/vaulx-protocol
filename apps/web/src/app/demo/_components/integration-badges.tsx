"use client";
import { useDemoSession } from "../_lib/use-demo-session";

type Props = { partner: string };

export function MockBadge({ partner }: Props) {
  const { session, patch } = useDemoSession();
  const dismissed = session?.mocksDismissed.includes(partner);
  if (!session || dismissed) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full border border-[var(--brand)]/30 bg-[var(--brand)]/10 px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider text-[var(--brand)] backdrop-blur-sm">
      <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand)]" />
      MOCK · {partner} · agreement pending
      <button
        onClick={() => patch((s) => ({ ...s, mocksDismissed: [...s.mocksDismissed, partner] }))}
        className="ml-1 opacity-60 hover:opacity-100"
        aria-label="Dismiss"
      >×</button>
    </div>
  );
}

export function LiveBadge({ partner }: Props) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-emerald-400">
      <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
      LIVE · {partner}
    </span>
  );
}
