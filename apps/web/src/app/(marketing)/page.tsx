import Link from "next/link";
import type { Metadata } from "next";
import {
  Bitcoin,
  Camera,
  Car,
  Gem,
  Palette,
  ShieldCheck,
  Watch,
} from "lucide-react";

import { AssetTypeCard } from "@/components/marketing/home/asset-type-card";
import { CtaBand } from "@/components/marketing/home/cta-band";
import { ExampleLoanCard } from "@/components/marketing/home/example-loan-card";
import { Hero } from "@/components/marketing/home/hero";
import { LiveVaultStrip } from "@/components/marketing/home/live-vault-strip";
import { PitchLine } from "@/components/marketing/home/pitch-line";
import { PitchNumber } from "@/components/marketing/home/pitch-number";
import { StepIcon } from "@/components/marketing/home/step-icon";
import { readHomeOnchain } from "@/lib/marketing/onchain";

// Server-side render every 60s — mirrors Laravel HomeController's
// `ONCHAIN_CACHE_TTL_SECONDS = 60` cache window.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Vaulx — Luxury Asset Collateral on Solana",
  description:
    "Vaulx unlocks instant USDC loans against luxury watches, jewelry, and high-value physical assets — on-chain, collateral-backed, no credit score.",
};

const TRUST_STATS = [
  { value: "$3T+", label: "Global luxury asset market", accent: false },
  { value: "95%", label: "Of these assets are illiquid", accent: true },
  { value: "40–65%", label: "Conservative LTV", accent: false },
  { value: "24h", label: "From appraisal to liquidity", accent: true },
] as const;

const STEPS = [
  {
    Icon: Camera,
    title: "1. Register",
    body: "Submit your asset with photos, description and estimated value.",
  },
  {
    Icon: ShieldCheck,
    title: "2. Custody",
    body: "Ship to our insured, audited vault in São Paulo — fully climate-controlled.",
  },
  {
    Icon: Gem,
    title: "3. Tokenize",
    body: "An on-chain credit record (TRDC state PDA) is created on Solana, representing your loan against the collateral.",
  },
  {
    Icon: Bitcoin,
    title: "4. Receive",
    body: "USDC or BRZ wired to your wallet — on-chain, instant, trustless.",
  },
] as const;

const COLLATERAL = [
  {
    Icon: Watch,
    title: "Luxury Watches",
    subtitle: "Rolex · Patek Philippe · AP · Omega",
  },
  {
    Icon: Gem,
    title: "Fine Jewelry",
    subtitle: "Diamonds · Emeralds · Gold · Platinum",
  },
  {
    Icon: Palette,
    title: "Fine Art",
    subtitle: "Paintings · Sculptures · Photography",
  },
  {
    Icon: Car,
    title: "Classic Cars",
    subtitle: "Classics · Supercars · Collectibles",
  },
] as const;

const ECONOMICS = [
  {
    value: "2–3%",
    label: "ORIGINATION",
    sub: "Charged on disbursement — no hidden fees.",
    accent: false,
  },
  {
    value: "8–12%",
    label: "NET MARGIN",
    sub: "Annual interest spread over funding cost.",
    accent: true,
  },
  {
    value: "24% APR",
    label: "SIMPLE LINEAR",
    sub: "BACEN-aligned; no compound surprises.",
    accent: false,
  },
] as const;

export default async function HomePage() {
  const onchain = await readHomeOnchain();

  return (
    <>
      {/* HERO */}
      <Hero />

      {/* ANCHOR TRUST BAND */}
      <section className="border-b border-[var(--vx-border)] bg-[var(--vx-bg)] py-[3rem]">
        <div className="mx-auto w-full max-w-[1320px] px-4 md:px-6">
          <div className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4">
            {TRUST_STATS.map((s) => (
              <PitchNumber
                key={s.label}
                value={s.value}
                label={s.label}
                accent={s.accent}
              />
            ))}
          </div>
        </div>
      </section>

      {/* LIVE ON-CHAIN STATS — hidden when both reads fail */}
      <LiveVaultStrip onchain={onchain} />

      {/* HOW IT WORKS */}
      <section
        id="how"
        className="bg-[var(--vx-bg)] py-[3rem]"
      >
        <div className="mx-auto w-full max-w-[1320px] px-4 py-6 md:px-6">
          <div className="mb-12 text-center">
            <PitchLine variant="inline">The Protocol</PitchLine>
            <h2
              className="font-sans font-bold tracking-[-0.025em] text-[var(--vx-text)]"
              style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.25rem)", lineHeight: 1.15 }}
            >
              How it works
            </h2>
            <p
              className="text-[var(--vx-text-muted)]"
              style={{ maxWidth: "38rem", margin: "1rem auto 0" }}
            >
              Four steps from asset to on-chain liquidity. Zero credit bureaus.
              Zero paperwork.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.title} className="text-center">
                <StepIcon Icon={s.Icon} />
                <h5 className="mb-2 font-sans text-[1rem] font-bold text-[var(--vx-text)]">
                  {s.title}
                </h5>
                <p className="text-[0.875rem] text-[var(--vx-text-muted)]">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COLLATERAL TYPES */}
      <section
        id="collateral"
        className="bg-[var(--vx-surface-2)] py-[3rem]"
      >
        <div className="mx-auto w-full max-w-[1320px] px-4 py-6 md:px-6">
          <div className="mb-12 text-center">
            <PitchLine variant="inline">Accepted Collateral</PitchLine>
            <h2
              className="font-sans font-bold tracking-[-0.025em] text-[var(--vx-text)]"
              style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.25rem)", lineHeight: 1.15 }}
            >
              A curated universe
            </h2>
            <p
              className="text-[var(--vx-text-muted)]"
              style={{ maxWidth: "38rem", margin: "1rem auto 0" }}
            >
              We accept only assets with liquid secondary markets and
              verifiable provenance.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {COLLATERAL.map((c) => (
              <AssetTypeCard
                key={c.title}
                Icon={c.Icon}
                title={c.title}
                subtitle={c.subtitle}
              />
            ))}
          </div>
        </div>
      </section>

      {/* PROTOCOL ECONOMICS */}
      <section
        id="lend"
        className="bg-[var(--vx-bg)] py-[3rem]"
      >
        <div className="mx-auto w-full max-w-[1320px] px-4 py-6 md:px-6">
          <div className="mb-12 text-center">
            <PitchLine variant="inline">Protocol Economics</PitchLine>
            <h2
              className="font-sans font-bold tracking-[-0.025em] text-[var(--vx-text)]"
              style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.25rem)", lineHeight: 1.15 }}
            >
              Aligned incentives
            </h2>
            <p
              className="text-[var(--vx-text-muted)]"
              style={{ maxWidth: "38rem", margin: "1rem auto 0" }}
            >
              Transparent, on-chain, conservatively underwritten.
            </p>
          </div>
          <div className="mx-auto grid max-w-[920px] gap-6 md:grid-cols-3">
            {ECONOMICS.map((e) => (
              <div
                key={e.label}
                className="flex h-full flex-col items-center rounded-md border border-[var(--vx-border)] bg-[var(--vx-surface)] p-6 text-center"
              >
                <div
                  className={
                    "font-sans text-[3rem] font-bold tracking-[-0.03em] leading-[1.05] " +
                    (e.accent
                      ? "text-[var(--vx-teal-2)]"
                      : "text-[var(--vx-text)]")
                  }
                >
                  {e.value}
                </div>
                <h6 className="mt-3 font-sans text-[0.95rem] font-bold tracking-[0.04em] text-[var(--vx-text)]">
                  {e.label}
                </h6>
                <small className="mt-1 text-[0.78rem] text-[var(--vx-text-muted)]">
                  {e.sub}
                </small>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EXAMPLE TX */}
      <section className="bg-[var(--vx-surface-2)] py-[3rem]">
        <div className="mx-auto w-full max-w-[1320px] px-4 py-6 md:px-6">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div>
              <PitchLine variant="inline">A Live Example</PitchLine>
              <h2
                className="font-sans font-bold tracking-[-0.025em] text-[var(--vx-text)]"
                style={{ fontSize: "clamp(1.9rem, 3.6vw, 2.4rem)", lineHeight: 1.1 }}
              >
                One Submariner.
                <br />
                Eight Thousand.
              </h2>
              <p
                className="mt-3 text-[var(--vx-text-muted)]"
                style={{ fontSize: "1.05rem", lineHeight: 1.7 }}
              >
                A Rolex Submariner with independent appraisal at{" "}
                <strong className="text-[var(--vx-teal)]">$15,000</strong>{" "}
                unlocks{" "}
                <strong className="text-[var(--vx-teal)]">$8,250 USDC</strong>{" "}
                at 55% LTV in under 24 hours. On-chain. Non-custodial after
                disbursement. Return the loan, reclaim the watch.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/simulator"
                  className="inline-flex items-center justify-center bg-[var(--vx-text)] px-4 py-3 text-[var(--vx-bg)] font-mono text-[0.875rem] uppercase tracking-[0.14em] font-semibold border border-[var(--vx-text)] hover:bg-transparent hover:text-[var(--vx-text)] transition-colors duration-150 ease-glide"
                >
                  Run the Simulator
                </Link>
              </div>
            </div>
            <ExampleLoanCard />
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <CtaBand />
    </>
  );
}
