// 3-tier liquidity routing visualization. Surfaces the corrected framing:
// capital comes from manually-closed anchor relationships; Kamino V2 + Plume
// Nest are infrastructure rails, not capital sources.
import Link from "next/link";
import { DemoShell } from "../../_components/demo-shell";
import { MockBadge } from "../../_components/integration-badges";

type AnchorTile = {
  partner: string;
  role: string;
  target: string;
  via?: string;
  later?: boolean;
};

const TIER_1: AnchorTile[] = [
  {
    partner: "Re7 Labs",
    role: "Curator deploying via Kamino V2",
    target: "$2–4M target",
    via: "via Kamino V2",
  },
  {
    partner: "MEV Capital",
    role: "Curator deploying via Kamino V2",
    target: "$2–4M target",
    via: "via Kamino V2",
  },
  {
    partner: "Mercado Bitcoin",
    role: "BR institutional anchor lender",
    target: "$1–2M target",
  },
  {
    partner: "Transfero",
    role: "BR institutional anchor lender",
    target: "$1–2M target",
  },
];

export default function LiquidityRoutingPage() {
  return (
    <DemoShell formFactor="desktop">
      {/* Hero */}
      <header className="border-b border-[var(--rule)] pb-12">
        <div className="flex items-center gap-3">
          <span className="h-px w-10 bg-[var(--brand)]" />
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--ink-muted)]">
            VAULX · LIQUIDITY ROUTING
          </span>
        </div>
        <h1
          className="mt-8 max-w-[22ch] font-display font-extrabold leading-[1.04] tracking-[-0.02em] text-[var(--ink)]"
          style={{
            fontSize: "clamp(2.25rem, 5.5vw, 4.25rem)",
            fontVariationSettings: '"opsz" 144',
          }}
        >
          Liquidity does not come from protocols.{" "}
          <em className="not-italic italic font-normal text-[var(--brand)]">
            It comes from relationships.
          </em>
        </h1>
        <p className="mt-8 max-w-[68ch] font-sans text-base leading-[1.65] text-[var(--ink-dim)] md:text-[17px]">
          Kamino V2 and Plume Nest are infrastructure rails — curator
          marketplaces and institutional issuance venues. They do not redirect
          their existing TVL into third-party protocols. Vaulx bootstraps via
          two to three anchor relationships closed manually with crypto-native
          curators (Re7, MEV Capital) deploying through Kamino V2, and BR
          institutional desks. Target launch TVL: $5–10M.
        </p>
      </header>

      {/* Stat strip */}
      <section className="mt-12 grid grid-cols-1 gap-px border border-[var(--rule)] bg-[var(--rule)] md:grid-cols-3">
        <Stat eyebrow="Target launch TVL" value="$5–10M" />
        <Stat eyebrow="Anchor relationships" value="2–3" />
        <Stat eyebrow="Liquidity stack" value="3 tiers" />
      </section>

      {/* Tier 1 */}
      <section className="mt-20">
        <TierLabel
          n="01"
          title="Anchor capital relationships"
          status="P1 · foreground"
          caption="Closed manually. The capital that actually funds Phase 1 origination."
          prominent
        />
        <div className="mt-8 grid gap-px border border-[var(--brand)]/40 bg-[var(--brand)]/5 md:grid-cols-2 lg:grid-cols-4">
          {TIER_1.map((t) => (
            <AnchorCard key={t.partner} tile={t} />
          ))}
        </div>
      </section>

      {/* Tier 2 */}
      <section className="mt-16">
        <TierLabel
          n="02"
          title="Crypto-native credit facility"
          status="P1 · middle"
          caption="The next anchor crypto-native credit relationship. Target close: post-submission."
          prominent
        />
        <div className="mt-8 border border-[var(--brand)]/40 bg-[var(--brand)]/5 p-8 md:max-w-[52%]">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
            Pending
          </div>
          <div className="mt-3 font-display text-2xl font-semibold tracking-[-0.01em] text-[var(--ink)]">
            TBD crypto-native credit facility
          </div>
          <p className="mt-3 max-w-[52ch] font-sans text-sm leading-[1.6] text-[var(--ink-dim)]">
            Anchor crypto-native credit relationship. Target close:
            post-submission. Adds dollar-denominated credit capacity alongside
            the curator and BR institutional rails.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[var(--brand)]/40 bg-[var(--brand)]/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--brand)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand)]" />
            MOCK · Crypto credit facility · agreement pending
          </div>
        </div>
      </section>

      {/* Tier 3 */}
      <section className="mt-20 opacity-70">
        <TierLabel
          n="03"
          title="Infrastructure rails"
          status="Substrate · background"
          caption="Market venues + curator frameworks. Not capital sources."
        />
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <InfraCard
            partner="Kamino V2"
            label="LIVE INFRASTRUCTURE"
            caption="Curator marketplace where Re7 + MEV Capital deploy capital. Vaulx integrates as a curated market alongside other strategies."
          />
          <InfraCard
            partner="Plume Nest"
            label="LATER-STAGE"
            caption="Phase 2 / post-launch institutional issuance rail. Not part of the Phase 1 capital plan."
            isLater
          />
        </div>
      </section>

      {/* Footer note */}
      <section className="mt-20 border-t border-[var(--rule)] pt-10">
        <p className="max-w-[78ch] font-sans text-sm leading-[1.65] text-[var(--ink-muted)]">
          Infrastructure rails (Kamino V2, Plume Nest) provide market venues
          and curator frameworks. They do not redirect their existing TVL to
          third-party protocols. Vaulx closes capital relationships manually,
          then connects them to these rails.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/demo/lend"
            className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)] hover:text-[var(--ink)]"
          >
            ← Lender dashboard
          </Link>
          <span className="text-[var(--ink-muted)]">·</span>
          <Link
            href="/demo/lend/onboard"
            className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)] hover:text-[var(--ink)]"
          >
            Become an LP →
          </Link>
        </div>
      </section>
      <MockBadge partner="Liquidity routing" />
    </DemoShell>
  );
}

function Stat({ eyebrow, value }: { eyebrow: string; value: string }) {
  return (
    <div className="bg-[var(--bg)] p-6">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
        {eyebrow}
      </div>
      <div className="mt-4 font-mono text-3xl tracking-[-0.02em] text-[var(--ink)] tabnums">
        {value}
      </div>
    </div>
  );
}

function TierLabel({
  n,
  title,
  status,
  caption,
  prominent,
}: {
  n: string;
  title: string;
  status: string;
  caption: string;
  prominent?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div className="flex items-baseline gap-5">
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--brand)] tabnums">
          {n}
        </span>
        <h2
          className={`font-display font-bold tracking-[-0.015em] ${
            prominent ? "text-[var(--ink)]" : "text-[var(--ink-dim)]"
          }`}
          style={{ fontSize: "clamp(1.5rem, 2.6vw, 2.25rem)", lineHeight: 1.15 }}
        >
          {title}
        </h2>
      </div>
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
        {status}
      </span>
      <p className="md:hidden font-sans text-sm leading-[1.6] text-[var(--ink-muted)]">
        {caption}
      </p>
      <p className="hidden md:block font-sans text-sm leading-[1.6] text-[var(--ink-muted)] md:max-w-[40ch]">
        {caption}
      </p>
    </div>
  );
}

function AnchorCard({ tile }: { tile: AnchorTile }) {
  return (
    <div className="flex flex-col gap-4 bg-[var(--bg)] p-6">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
          Pending
        </span>
        {tile.via && (
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--brand)]">
            {tile.via}
          </span>
        )}
      </div>
      <h3 className="font-display text-xl font-semibold tracking-[-0.01em] text-[var(--ink)]">
        {tile.partner}
      </h3>
      <p className="font-sans text-sm leading-[1.55] text-[var(--ink-dim)]">
        {tile.role}
      </p>
      <div className="mt-auto pt-4 border-t border-[var(--rule)] font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--brand)] tabnums">
        {tile.target}
      </div>
      <span className="inline-flex items-center gap-2 rounded-full border border-[var(--brand)]/40 bg-[var(--brand)]/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--brand)]">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand)]" />
        MOCK · {tile.partner} · agreement pending
      </span>
    </div>
  );
}

function InfraCard({
  partner,
  label,
  caption,
  isLater,
}: {
  partner: string;
  label: string;
  caption: string;
  isLater?: boolean;
}) {
  return (
    <div
      className="flex flex-col gap-4 border border-dashed p-6"
      style={{
        borderColor: "var(--rule-strong)",
        background: "var(--bg-elev-1)",
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
          {label}
        </span>
        {isLater && (
          <span className="rounded-full border border-[var(--rule-strong)] bg-[var(--bg)] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
            LATER-STAGE
          </span>
        )}
      </div>
      <h3 className="font-display text-xl font-semibold tracking-[-0.01em] text-[var(--ink-dim)]">
        {partner}
      </h3>
      <p className="font-sans text-sm leading-[1.55] text-[var(--ink-muted)]">
        {caption}
      </p>
      <span className="mt-auto inline-flex items-center gap-2 rounded-full border border-[var(--rule-strong)] bg-[var(--bg)] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--ink-muted)]" />
        MOCK · {partner} · agreement pending
      </span>
    </div>
  );
}
