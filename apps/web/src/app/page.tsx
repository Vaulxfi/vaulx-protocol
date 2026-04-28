import Link from "next/link";

import { EditorialSection } from "@/components/vaulx/editorial-section";
import { MarqueeRule } from "@/components/vaulx/marquee-rule";
import { MetricCard } from "@/components/vaulx/metric-card";
import { OnchainTicker } from "@/components/vaulx/onchain-ticker";
import { Pullquote } from "@/components/vaulx/pullquote";
import { SiteFooter } from "@/components/vaulx/site-footer";
import { SiteHeader } from "@/components/vaulx/site-header";

const HOW_IT_WORKS = [
  {
    n: "01",
    t: "Custody",
    b: "Collateral is physically received, inspected and archived by a regulated custodian. Every intake generates a signed record and a photographic dossier."
  },
  {
    n: "02",
    t: "Mint",
    b: "A Cédula de Crédito Bancário is drafted and its SHA-256 digest is anchored on Solana as a TRDC — an executable, transferable credit instrument."
  },
  {
    n: "03",
    t: "Settle",
    b: "USDC disburses from the vault the moment custody is confirmed. Repayment releases the asset. Default escalates through legally-binding Brazilian rails."
  }
] as const;

const MOMENTS = [
  { n: "01", t: "Discover", d: "Open the lender vault and scan the live flow." },
  { n: "02", t: "Supply", d: "Deposit USDC with a single transaction." },
  { n: "03", t: "Verify", d: "Civic Pass + gov.br — identity resolved in seconds." },
  { n: "04", t: "Appraise", d: "Chrono24 + WatchCharts + Vaulx model triangulate a value." },
  { n: "05", t: "Sign", d: "Download and sign the Brazilian CCB against your TRDC." },
  { n: "06", t: "Ship", d: "Courier the asset to the vault with a dated receipt." },
  { n: "07", t: "Confirm", d: "Custodian stamps the intake — chain goes live." },
  { n: "08", t: "Disburse", d: "USDC lands in your wallet. Upside retained." },
  { n: "09", t: "Redeem", d: "Repay the note, reclaim your asset, walk away." }
] as const;

export default function Home() {
  return (
    <>
      <SiteHeader />

      {/* ============================================================
       * HERO
       * ============================================================ */}
      <main className="relative">
        <section className="relative flex min-h-[calc(100vh-72px)] flex-col">
          <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col justify-end px-6 pb-12 pt-20 md:px-10 md:pb-16 md:pt-32">
            <div className="grid gap-10 md:grid-cols-12 md:gap-8">
              <div className="md:col-span-9">
                <div className="vx-reveal flex items-center gap-3" data-delay="1">
                  <span className="h-px w-10 bg-[var(--brand)]" />
                  <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--ink-muted)]">
                    VX-01 · Solana RWA Lending · Devnet
                  </span>
                </div>

                <h1
                  className="vx-reveal mt-8 font-display font-extrabold leading-[1.02] tracking-[-0.025em] text-[var(--ink)]"
                  data-delay="2"
                  style={{
                    fontSize: "clamp(2.75rem, 8vw, 6.75rem)",
                    fontVariationSettings: '"opsz" 144'
                  }}
                >
                  Lend against the
                  <br />
                  world&apos;s most{" "}
                  <em className="not-italic text-[var(--brand)] font-normal italic">
                    resilient
                  </em>{" "}
                  assets.
                </h1>

                <p
                  className="vx-reveal mt-10 max-w-[58ch] font-sans text-base leading-[1.65] text-[var(--ink-dim)] md:text-[17px]"
                  data-delay="3"
                >
                  Vaulx is a private credit protocol for collateral that appreciates — luxury watches today,
                  art and rare passports tomorrow. Every loan is a Brazilian CCB, anchored on Solana, settled in
                  USDC, and secured by a regulated custodian.
                </p>

                <div className="vx-reveal mt-12 flex flex-col items-start gap-4 sm:flex-row sm:items-center" data-delay="4">
                  <Link href="/demo/lend" className="btn-gold-outline">
                    <span>Earn · USDC yield</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
                      <path strokeLinecap="round" d="M5 12h14M13 5l7 7-7 7" />
                    </svg>
                  </Link>
                  <Link href="/demo/borrow/onboard" className="btn-ghost">
                    <span>Borrow against your watch</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
                      <path strokeLinecap="round" d="M5 12h14M13 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>

              {/* Right hero gutter — editorial colophon */}
              <div className="hidden md:col-span-3 md:flex md:flex-col md:items-end md:justify-end md:pb-4">
                <div className="vx-reveal flex flex-col items-end gap-3 text-right" data-delay="5">
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--ink-muted)]">
                    Issue N° 01
                  </span>
                  <span className="font-display italic text-lg text-[var(--ink-dim)]">
                    A private members&apos; club
                    <br />
                    for resilient capital.
                  </span>
                  <span className="mt-4 h-px w-16 bg-[var(--brand)]" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                    São Paulo · New York · Lisbon
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom ticker */}
          <div className="vx-reveal w-full" data-delay="6">
            <OnchainTicker />
          </div>
        </section>

        {/* ============================================================
         * HOW VAULX WORKS
         * ============================================================ */}
        <section className="relative border-t border-[var(--rule)] py-24 md:py-32">
          <div className="mx-auto w-full max-w-[1440px] px-6 md:px-10">
            <div className="flex items-center gap-3">
              <span className="h-px w-10 bg-[var(--brand)]" />
              <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--ink-muted)]">
                How Vaulx works
              </span>
            </div>
            <h2 className="mt-6 max-w-[16ch] font-display font-bold text-[clamp(2rem,5vw,4rem)] leading-[1.05] tracking-[-0.02em] text-[var(--ink)]">
              Three movements, one instrument.
            </h2>

            <div className="mt-20 grid gap-12 md:grid-cols-3 md:gap-10">
              {HOW_IT_WORKS.map((step, i) => (
                <div
                  key={step.n}
                  className={i === 1 ? "md:mt-12" : ""}
                >
                  <div
                    className="font-display italic font-extrabold text-[6rem] leading-none text-[var(--ink)]"
                    style={{ fontVariationSettings: '"opsz" 144' }}
                  >
                    {step.n}
                  </div>
                  <div className="mt-4 h-px w-12 bg-[var(--brand)]" />
                  <h3 className="mt-6 font-display text-[1.75rem] font-semibold tracking-[-0.01em] text-[var(--ink)]">
                    {step.t}
                  </h3>
                  <p className="mt-4 max-w-[38ch] font-sans text-base leading-[1.65] text-[var(--ink-dim)]">
                    {step.b}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================
         * LIVE METRICS
         * ============================================================ */}
        <section className="border-t border-[var(--rule)] bg-[var(--bg-elev-1)] py-24 md:py-32">
          <div className="mx-auto w-full max-w-[1440px] px-6 md:px-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <span className="eyebrow">The ledger · Devnet</span>
                <h2 className="mt-4 font-display text-[clamp(1.75rem,3.5vw,3rem)] font-bold leading-[1.1] tracking-[-0.015em] text-[var(--ink)]">
                  Operator-grade transparency.
                </h2>
              </div>
              <p className="max-w-[44ch] font-sans text-sm leading-relaxed text-[var(--ink-muted)]">
                Every number below is read directly from Solana devnet and the on-chain event index. No rollups, no marketing aggregates.
              </p>
            </div>

            <div className="mt-14 grid gap-px border border-[var(--rule)] bg-[var(--rule)] sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                eyebrow="USDC in vault"
                value="1,284,500"
                unit="USDC"
                delta="+12.4%"
                context="30-day net inflow · single pool · overcollateralized at 60% max LTV"
                variant="positive"
              />
              <MetricCard
                eyebrow="Active TRDCs"
                value="37"
                delta="+4"
                context="Notes live on-chain. Each one backed by physical collateral in custody."
                variant="positive"
              />
              <MetricCard
                eyebrow="Average LTV"
                value="47.3"
                unit="%"
                delta="-1.1%"
                context="Conservative leverage. Default cushion survives a 40% drawdown in spot value."
                variant="neutral"
              />
              <MetricCard
                eyebrow="Disbursement"
                value="02:41"
                unit="min avg"
                delta="-0:08"
                context="Median time from custody-confirmed to USDC in borrower wallet."
                variant="positive"
              />
            </div>
          </div>
        </section>

        {/* ============================================================
         * PULL QUOTE
         * ============================================================ */}
        <div className="mx-auto w-full max-w-[1440px] px-6 md:px-10">
          <Pullquote
            quote="Cédula de Crédito Bancário — executável, transferível, resistente."
            translation="A Brazilian credit instrument: executable, transferable, resistant. Three words that translate centuries of private-law craftsmanship into on-chain primitives."
            attribution="Vaulx · Design Principles"
          />
        </div>

        {/* ============================================================
         * MOMENTS RAIL
         * ============================================================ */}
        <section className="border-t border-[var(--rule)] py-24 md:py-32">
          <div className="mx-auto w-full max-w-[1440px] px-6 md:px-10">
            <div className="flex items-end justify-between gap-4">
              <div>
                <span className="eyebrow">The nine moments</span>
                <h2 className="mt-4 font-display text-[clamp(1.75rem,3.5vw,3rem)] font-bold leading-[1.1] tracking-[-0.015em] text-[var(--ink)]">
                  One borrower, start to finish.
                </h2>
              </div>
              <span className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--ink-muted)] md:inline-block">
                Scroll →
              </span>
            </div>

            <div className="mt-14 grid snap-x snap-mandatory grid-flow-col auto-cols-[85%] gap-px overflow-x-auto border border-[var(--rule)] bg-[var(--rule)] sm:auto-cols-[45%] md:auto-cols-auto md:grid-flow-row md:grid-cols-3 lg:grid-cols-5">
              {MOMENTS.map((m, i) => (
                <article
                  key={m.n}
                  className={`snap-start bg-[var(--bg-elev-1)] p-6 ${i === 8 ? "lg:col-span-2" : ""}`}
                >
                  <div className="flex items-baseline justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--brand)]">
                      Moment {m.n}
                    </span>
                    <span
                      aria-hidden
                      className="h-1 w-1 rounded-full bg-[var(--brand)]"
                    />
                  </div>
                  <h3 className="mt-6 font-display text-2xl font-semibold tracking-[-0.01em] text-[var(--ink)]">
                    {m.t}
                  </h3>
                  <p className="mt-3 font-sans text-sm leading-relaxed text-[var(--ink-dim)]">
                    {m.d}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================
         * CCB CUTAWAY
         * ============================================================ */}
        <section className="border-t border-[var(--rule)] bg-[var(--bg-elev-1)] py-24 md:py-32">
          <div className="mx-auto grid w-full max-w-[1440px] gap-16 px-6 md:grid-cols-12 md:gap-12 md:px-10">
            <div className="md:col-span-5">
              <span className="eyebrow">The instrument</span>
              <h2 className="mt-4 font-display text-[clamp(1.75rem,3.5vw,3rem)] font-bold leading-[1.08] tracking-[-0.015em] text-[var(--ink)]">
                Every loan mints a legally-binding Brazilian credit instrument.
              </h2>
              <p className="mt-6 font-sans text-base leading-[1.65] text-[var(--ink-dim)]">
                The Cédula de Crédito Bancário is Brazil&apos;s most weaponized private-debt instrument — extra-judicial execution, transferable by endorsement, resistant to fraud. Vaulx generates a deterministic PDF for each loan, hashes it with SHA-256, and anchors that hash on Solana. The paper is real. The chain proves it.
              </p>
              <div className="mt-10 flex flex-col gap-2 border-l border-[var(--brand)] pl-6">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--ink-muted)]">
                  Why it matters
                </span>
                <p className="font-display italic text-lg text-[var(--ink)]">
                  Paper + chain = a note you can enforce in both worlds.
                </p>
              </div>
            </div>

            <figure className="md:col-span-7">
              <div className="border border-[var(--rule-strong)] bg-[var(--bg)] p-8 md:p-12">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 border-b border-[var(--rule)] pb-6">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--ink-muted)]">
                      Cédula de Crédito Bancário
                    </div>
                    <div className="mt-2 font-display text-2xl font-bold tracking-[-0.01em] text-[var(--ink)]">
                      VX-2026-0042
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                      Issued · 2026-04-24
                    </div>
                    <div className="mt-2 font-mono text-xs text-[var(--ink-dim)] tabnums">
                      São Paulo · BR
                    </div>
                  </div>
                </div>

                {/* Body */}
                <dl className="mt-8 grid grid-cols-2 gap-x-8 gap-y-5 font-mono text-xs">
                  <div>
                    <dt className="text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">Borrower</dt>
                    <dd className="mt-1 text-[var(--ink)]">Oliveira, L.M.</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">CPF</dt>
                    <dd className="mt-1 text-[var(--ink)] tabnums">•••.•••.•••-42</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">Collateral</dt>
                    <dd className="mt-1 text-[var(--ink)]">Rolex Submariner · 116610LN</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">Appraisal</dt>
                    <dd className="mt-1 text-[var(--ink)] tabnums">USD 14,200</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">Principal</dt>
                    <dd className="mt-1 text-[var(--ink)] tabnums">USDC 8,520</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">Term · Rate</dt>
                    <dd className="mt-1 text-[var(--ink)] tabnums">60 days · 10.00% APR</dd>
                  </div>
                </dl>

                {/* Hash ribbon */}
                <div className="mt-10 border-t border-[var(--rule)] pt-6">
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--brand)]">
                    SHA-256 · anchored on Solana
                  </div>
                  <div className="mt-3 break-all font-mono text-xs leading-relaxed text-[var(--ink-dim)] blur-[0.5px] tabnums">
                    0xa3f7b9c2e48d01f4c6a9b23e8d5f7091 4e2b9c0a8d3f1e7b2c4a6d8e0f2b4c6a
                  </div>
                </div>
              </div>
              <figcaption className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--ink-muted)]">
                Exhibit A · A real CCB, pseudonymized
              </figcaption>
            </figure>
          </div>
        </section>

        {/* ============================================================
         * CLOSING CTA
         * ============================================================ */}
        <section className="border-t border-[var(--rule)] py-24 md:py-32">
          <div className="mx-auto w-full max-w-[1440px] px-6 text-center md:px-10">
            <MarqueeRule glyph="—·—" />
            <h2
              className="mx-auto max-w-[20ch] font-display font-extrabold leading-[1.02] tracking-[-0.025em] text-[var(--ink)]"
              style={{
                fontSize: "clamp(2.5rem, 7vw, 5.5rem)",
                fontVariationSettings: '"opsz" 144'
              }}
            >
              Money built for assets that{" "}
              <em className="not-italic italic font-normal text-[var(--brand)]">appreciate</em>.
            </h2>
            <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/demo/lend" className="btn-gold">
                <span>Open the vault</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-4 w-4">
                  <path strokeLinecap="round" d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              </Link>
              <Link href="/demo/borrow/onboard" className="btn-ghost">
                <span>Request a line</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
