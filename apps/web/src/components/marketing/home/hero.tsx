import Link from "next/link";

import { PitchLine } from "./pitch-line";

/**
 * Top-of-page hero. Mirrors `.hero` in site/resources/css/app.css:
 * radial-gradient wash over paper bg, h1 with italic teal `<em>`, lead
 * paragraph, paired CTAs (ink primary, ink-outlined secondary).
 */
export function Hero() {
  return (
    <section
      className="border-b border-[var(--vx-border)] py-[7rem] pb-[6rem] text-[var(--vx-text)]"
      style={{
        background:
          "radial-gradient(ellipse at top left, rgba(201,168,76,0.08) 0%, transparent 55%)," +
          "radial-gradient(ellipse at bottom right, rgba(255,140,0,0.05) 0%, transparent 55%)," +
          "var(--vx-bg)",
      }}
    >
      <div className="mx-auto w-full max-w-[1320px] px-4 text-center md:px-6">
        <div className="mb-4">
          <PitchLine variant="pill">Solana · RWA · DeFi Protocol</PitchLine>
        </div>

        <h1
          className="mb-4 font-sans font-bold leading-[1.05] tracking-[-0.025em] text-[var(--vx-text)]"
          style={{ fontSize: "clamp(2.8rem, 6vw, 5rem)" }}
        >
          Your Assets.
          <br />
          Your{" "}
          <em className="italic font-bold text-[var(--vx-teal-2)]">
            Liquidity
          </em>
          .
        </h1>

        <p
          className="mx-auto mb-[3rem] max-w-[38rem] text-[var(--vx-text-muted)]"
          style={{ fontSize: "1.15rem", lineHeight: 1.6 }}
        >
          Unlock instant USDC loans against luxury watches, jewelry, and
          high-value physical assets — on-chain, collateral-backed, no credit
          score.
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/simulator"
            className="inline-flex items-center justify-center bg-[var(--vx-text)] px-4 py-3 text-[var(--vx-bg)] font-mono text-[0.875rem] uppercase tracking-[0.14em] font-semibold border border-[var(--vx-text)] hover:bg-transparent hover:text-[var(--vx-text)] transition-colors duration-150 ease-glide"
          >
            Launch App
          </Link>
          <Link
            href="/simulator"
            className="inline-flex items-center justify-center bg-transparent px-4 py-3 text-[var(--vx-text)] font-mono text-[0.875rem] uppercase tracking-[0.14em] font-semibold border border-[rgba(10,10,11,0.3)] hover:bg-[var(--vx-text)] hover:text-[var(--vx-bg)] transition-colors duration-150 ease-glide"
          >
            View Simulator
          </Link>
        </div>
      </div>
    </section>
  );
}
