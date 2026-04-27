"use client";
import Link from "next/link";
import { useDemoSession } from "../_lib/use-demo-session";
import { TOUR_STEPS_TOTAL } from "../_lib/types";

export function DemoTopBar() {
  const { session, patch, reset } = useDemoSession();
  const tourLabel =
    session?.tour.resumable && session.tour.step > 0
      ? `Resume tour · ${session.tour.step}/${TOUR_STEPS_TOTAL}`
      : "Tour";

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between gap-4 border-b border-[var(--rule)] bg-[var(--bg)]/85 px-6 py-3 backdrop-blur-sm">
      <Link href="/demo" className="font-display text-lg tracking-tight">
        <span className="text-[var(--brand)]">●</span> Vaulx{" "}
        <span className="text-xs font-mono text-[var(--ink-muted)] tracking-widest uppercase">demo</span>
      </Link>
      <div className="flex items-center gap-2">
        <button
          onClick={() => session && patch((s) => ({ ...s, tour: { ...s.tour, active: !s.tour.active } }))}
          className="rounded-md border border-[var(--rule)] px-3 py-1.5 text-xs font-mono uppercase tracking-wide text-[var(--ink-dim)] hover:bg-[var(--bg-elev-1)]"
        >
          {tourLabel}
        </button>
        <button
          onClick={() => {
            if (confirm("Reset demo? This clears your progress.")) reset();
          }}
          className="rounded-md border border-[var(--rule)] px-3 py-1.5 text-xs font-mono uppercase tracking-wide text-[var(--ink-dim)] hover:bg-[var(--bg-elev-1)]"
        >
          Reset
        </button>
        <Link
          href="/"
          className="rounded-md border border-[var(--rule)] px-3 py-1.5 text-xs font-mono uppercase tracking-wide text-[var(--ink-dim)] hover:bg-[var(--bg-elev-1)]"
        >
          Exit
        </Link>
      </div>
    </header>
  );
}
