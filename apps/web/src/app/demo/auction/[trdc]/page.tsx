"use client";
// Auction detail — the moat in motion.
// Top: asset reveal + IoT clip · Middle: <AuctionTierTimeline> · Below: 3 editorial blocks
// Right column: live bid feed (60s loop) + bid form (mock submit).
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { toast } from "sonner";
import { DemoShell } from "../../_components/demo-shell";
import {
  AuctionTierTimeline,
  type Tier,
} from "../../_components/auction-tier-timeline";
import { AUCTION_FLOOR, getAuction } from "../../_fixtures/auction-floor";
import { MOCK_BIDS } from "../../_fixtures/auction-bids";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);

const TIER_DURATIONS = { 1: 72, 2: 48, 3: 168 } as const;

const TIER_NAMES = {
  1: "Platform lenders",
  2: "Reseller curated network",
  3: "Public auction",
} as const;

const TIER_DESCRIPTIONS = {
  1: "Vaulx lenders who funded the loan get first refusal.",
  2: "Vaulx-curated luxury watch dealer network.",
  3: "Open Solana + off-chain auction. Liquidity backstop.",
} as const;

function buildTiers(
  active: 1 | 2 | 3,
  highBid: number,
  bidders: number,
  reserve: number,
  endTs: number,
): [Tier, Tier, Tier] {
  return [1, 2, 3].map((n) => {
    const num = n as 1 | 2 | 3;
    const duration = TIER_DURATIONS[num];
    if (num < active) {
      // Earlier tier — completed (no bids matched, escalated)
      return {
        number: num,
        name: TIER_NAMES[num],
        durationHours: duration,
        description: TIER_DESCRIPTIONS[num],
        status: "no-bids" as const,
      };
    }
    if (num === active) {
      const remainingMs = Math.max(0, endTs - Date.now());
      const elapsedHours = duration - remainingMs / (3600 * 1000);
      return {
        number: num,
        name: TIER_NAMES[num],
        durationHours: duration,
        description: TIER_DESCRIPTIONS[num],
        status: "active" as const,
        elapsedHours: Math.max(0, elapsedHours),
        highBid,
        reserve,
        bidders,
      };
    }
    return {
      number: num,
      name: TIER_NAMES[num],
      durationHours: duration,
      description: TIER_DESCRIPTIONS[num],
      status: "pending" as const,
    };
  }) as [Tier, Tier, Tier];
}

export default function AuctionDetailPage() {
  const params = useParams<{ trdc: string }>();
  const trdc = params?.trdc ?? "";
  const auction = getAuction(trdc);

  if (!auction) {
    if (typeof window !== "undefined") {
      // Client-side guard; keep server-side render with notFound() too.
    }
    notFound();
  }

  const tiers = useMemo(
    () =>
      buildTiers(
        auction.tier,
        auction.highBid,
        auction.bidders,
        auction.reserve,
        auction.endTs,
      ),
    [auction],
  );

  return (
    <DemoShell formFactor="desktop">
      {/* Breadcrumb */}
      <nav className="mb-8 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--ink-muted)]">
        <Link href="/demo/auction" className="hover:text-[var(--brand)]">
          Foreclosure floor
        </Link>
        <span className="mx-2 text-[var(--rule-strong)]">/</span>
        <span className="text-[var(--ink-dim)]">{auction.trdc}</span>
      </nav>

      <header className="border-b border-[var(--rule)] pb-10">
        <div className="flex items-center gap-3">
          <span className="h-px w-10 bg-[var(--brand)]" />
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--ink-muted)]">
            VAULX · TRDC {auction.trdc}
          </span>
        </div>
        <h1
          className="mt-6 font-display font-extrabold leading-[1.04] tracking-[-0.02em] text-[var(--ink)]"
          style={{
            fontSize: "clamp(1.8rem, 4vw, 2.75rem)",
            fontVariationSettings: '"opsz" 144',
          }}
        >
          {auction.watch}
        </h1>
        <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
          BRINKS SP · Vault A-32
        </p>
      </header>

      {/* Editorial 7/5 split */}
      <div className="mt-12 grid grid-cols-1 gap-12 md:grid-cols-12">
        {/* Left column · 7 */}
        <div className="md:col-span-7">
          <AssetReveal />

          <section className="mt-12">
            <span className="eyebrow">Waterfall · live</span>
            <h2 className="mt-3 font-display text-[clamp(1.25rem,2vw,1.75rem)] font-bold leading-[1.1] tracking-[-0.015em] text-[var(--ink)]">
              The three gates between default and panic.
            </h2>
            <div className="mt-8">
              <AuctionTierTimeline tiers={tiers} />
            </div>
          </section>

          {/* Three editorial moat blocks */}
          <section className="mt-16 grid grid-cols-1 gap-px border border-[var(--rule)] bg-[var(--rule)] md:grid-cols-3">
            <MoatBlock
              tag="TIER 1 · 72H"
              title="Platform lenders"
              body="Vaulx lenders who funded the loan get first refusal at par or better. They already underwrote the borrower; they get the recovery upside."
            />
            <MoatBlock
              tag="TIER 2 · 48H"
              title="Reseller network"
              body="Vaulx-curated luxury-watch dealer network. They can resell at retail margin, so they outbid retail wholesale. Network effect: every dealer Vaulx onboards widens this tier's demand."
            />
            <MoatBlock
              tag="TIER 3 · 168H"
              title="Public auction"
              body="Open to anyone with USDC and a wallet. Hybrid: Solana-native bids on-chain, off-chain bids reconciled by oracle. Ensures liquidity even in cold markets."
            />
          </section>
        </div>

        {/* Right column · 5 */}
        <aside className="md:col-span-5">
          <BidFeedCard />
          <BidFormCard auction={auction} />
        </aside>
      </div>
    </DemoShell>
  );
}

function AssetReveal() {
  return (
    <div className="flex flex-col gap-4 rounded-md border border-[var(--rule)] bg-[var(--bg-elev-1)] p-5">
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--brand)]"
          style={{ animation: "vx-pulse 1.4s ease-in-out infinite" }}
        />
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--brand)]">
          📡 LIVE · IoT feed
        </span>
        <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
          VX-CCTV · MOCK
        </span>
      </div>
      <div className="overflow-hidden rounded-sm border border-[var(--rule-strong)] bg-black">
        <div className="relative aspect-video">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/demo/iot-feed-placeholder.svg"
            alt="Vault interior IoT feed (placeholder)"
            className="h-full w-full object-cover"
          />
        </div>
      </div>
      <style jsx>{`
        @keyframes vx-pulse {
          0%,
          100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

function MoatBlock({
  tag,
  title,
  body,
}: {
  tag: string;
  title: string;
  body: string;
}) {
  return (
    <div className="bg-[var(--bg)] p-6">
      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--brand)]">
        {tag}
      </div>
      <h3 className="mt-3 font-display text-lg font-semibold text-[var(--ink)]">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-relaxed text-[var(--ink-dim)]">
        {body}
      </p>
    </div>
  );
}

function BidFeedCard() {
  // Replay the 8 mock bids over a 60s loop. We rotate the visible window so the
  // top bid stays at the most-recent. Server initial = MOCK_BIDS as-is so SSR
  // and client agree on the first paint.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000 / MOCK_BIDS.length);
    return () => clearInterval(id);
  }, []);
  const ordered = useMemo(() => {
    if (tick === 0) return MOCK_BIDS;
    const offset = tick % MOCK_BIDS.length;
    return [...MOCK_BIDS.slice(offset), ...MOCK_BIDS.slice(0, offset)];
  }, [tick]);

  return (
    <div className="rounded-md border border-[var(--rule)] bg-[var(--bg)]">
      <header className="flex items-center justify-between border-b border-[var(--rule)] px-4 py-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--ink-muted)]">
          Live bid feed
        </span>
        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--brand)]">
          <span
            className="inline-block h-1 w-1 rounded-full bg-[var(--brand)]"
            style={{ animation: "vx-pulse 1.4s ease-in-out infinite" }}
          />
          Replay · 60s
        </span>
      </header>
      <ul className="max-h-[340px] divide-y divide-[var(--rule)] overflow-y-auto">
        <li className="bg-[var(--brand)]/5 px-4 py-2.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--brand)]">
            Reserve cleared · 8,700 USDC ✓
          </span>
        </li>
        {ordered.map((b, i) => (
          <li key={`${b.ts}-${i}`} className="flex items-center gap-3 px-4 py-2.5">
            <span
              className="font-mono text-[11px] text-[var(--ink-muted)]"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {b.ts}
            </span>
            <span className="font-mono text-xs text-[var(--ink-dim)]">
              {b.bidder}
            </span>
            <span className="ml-auto inline-flex items-center gap-2">
              <span
                className="font-mono text-sm text-[var(--ink)]"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {fmt(b.amount)} USDC
              </span>
              <span className="rounded-full border border-[var(--brand)]/30 bg-[var(--brand)]/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--brand)]">
                T{b.tier}
              </span>
            </span>
          </li>
        ))}
      </ul>
      <style jsx>{`
        @keyframes vx-pulse {
          0%,
          100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

function BidFormCard({
  auction,
}: {
  auction: (typeof AUCTION_FLOOR)[number];
}) {
  const minBid = Math.max(auction.reserve, auction.highBid + 25);
  const [amount, setAmount] = useState(String(minBid));
  const [submitting, setSubmitting] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(amount);
    if (Number.isNaN(n)) {
      toast.error("Enter a valid amount");
      return;
    }
    if (n < auction.reserve) {
      toast.error(`Must be at least reserve · ${fmt(auction.reserve)} USDC`);
      return;
    }
    if (n <= auction.highBid) {
      toast.error(`Must beat current high · ${fmt(auction.highBid)} USDC`);
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      toast.success(`Bid placed · ${fmt(n)} USDC`, {
        description: "Synthetic feed only · Devnet bidding wires through Phase 4 deploy.",
      });
    }, 600);
  };

  return (
    <form
      onSubmit={submit}
      className="mt-6 flex flex-col gap-4 rounded-md border border-[var(--rule)] bg-[var(--bg-elev-1)] p-5"
    >
      <header>
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--ink-muted)]">
          Place a bid
        </span>
        <p className="mt-2 text-xs text-[var(--ink-dim)]">
          Minimum bid · {fmt(minBid)} USDC (reserve + min increment)
        </p>
      </header>
      <label className="flex flex-col gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
          Amount (USDC)
        </span>
        <input
          type="number"
          min={minBid}
          step="25"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="rounded-sm border border-[var(--rule-strong)] bg-[var(--bg)] px-3 py-2 font-mono text-sm text-[var(--ink)] focus:border-[var(--brand)] focus:outline-none"
          style={{ fontVariantNumeric: "tabular-nums" }}
        />
      </label>
      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-[var(--brand)] px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-[var(--bg)] transition-opacity disabled:opacity-60"
      >
        {submitting ? "Placing…" : "Place bid"}
      </button>
    </form>
  );
}
