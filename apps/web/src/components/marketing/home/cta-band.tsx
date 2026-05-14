import Link from "next/link";

import { PitchLine } from "./pitch-line";

/**
 * Final CTA band — gradient surface→bg, top hairline, ink + outline
 * button pair. Mirrors `.cta-section` from site/resources/css/app.css.
 */
export function CtaBand() {
  return (
    <section
      className="border-t border-[var(--vx-border)] py-[6rem] text-center text-[var(--vx-text)]"
      style={{
        background:
          "linear-gradient(135deg, var(--vx-surface) 0%, var(--vx-bg) 100%)",
      }}
    >
      <div className="mx-auto w-full max-w-[1320px] px-4 md:px-6">
        <div className="mb-2">
          <PitchLine variant="inline">Private Wealth · Public Chain</PitchLine>
        </div>
        <h2
          className="mb-3 font-sans font-bold tracking-[-0.025em] text-[var(--vx-text)]"
          style={{ fontSize: "clamp(2rem, 4vw, 2.75rem)", lineHeight: 1.1 }}
        >
          Luxury pawn, reimagined.
        </h2>
        <p className="mx-auto mb-8 max-w-[34rem] text-[var(--vx-text-muted)]">
          Join the private beta. Create an account in under two minutes.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/simulator"
            className="inline-flex items-center justify-center bg-transparent px-4 py-3 text-[var(--vx-text)] font-mono text-[0.875rem] uppercase tracking-[0.14em] font-semibold border border-[rgba(10,10,11,0.3)] hover:bg-[var(--vx-text)] hover:text-[var(--vx-bg)] transition-colors duration-150 ease-glide"
          >
            Try Simulator
          </Link>
          <Link
            href="/simulator"
            className="inline-flex items-center justify-center bg-[var(--vx-text)] px-4 py-3 text-[var(--vx-bg)] font-mono text-[0.875rem] uppercase tracking-[0.14em] font-semibold border border-[var(--vx-text)] hover:bg-transparent hover:text-[var(--vx-text)] transition-colors duration-150 ease-glide"
          >
            Launch App
          </Link>
        </div>
      </div>
    </section>
  );
}
