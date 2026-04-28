// Vaulx lender-side operator dashboard. Four launch tranches across two
// currencies, surfaced as the supply-side counterpart to the borrower flow.
//
// As of the Wave-D wiring this page also mounts <LendDepositPanel> above
// the tranche grid. The panel calls the real `vault.deposit` ix on Devnet
// against `NEXT_PUBLIC_USDC_MINT`, so a connected wallet can supply USDC
// to the live program from inside the demo. With no wallet connected the
// rest of the page (TVL fixtures, marketing tiles) keeps working.
import Link from "next/link";
import { DemoShell } from "../_components/demo-shell";
import { LendDepositPanel } from "../_components/lend-deposit-panel";
import { TRANCHES, totalTvl, type VaultTranche } from "../_fixtures/vault-tranches";

const USD_FMT = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const APY_FMT = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

function fmtTvl(amount: number, currency: "USDC" | "BRL"): string {
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(2)}M ${currency}`;
  }
  if (amount >= 1_000) {
    return `${Math.round(amount / 1_000)}K ${currency}`;
  }
  return `${USD_FMT.format(amount)} ${currency}`;
}

function fmtTotalTvl(amount: number): string {
  return `${(amount / 1_000_000).toFixed(2)}M`;
}

export default function LendDashboardPage() {
  const sum = totalTvl();

  return (
    <DemoShell formFactor="desktop">
      <header className="border-b border-[var(--rule)] pb-12">
        <div className="flex items-center gap-3">
          <span className="h-px w-10 bg-[var(--brand)]" />
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--ink-muted)]">
            VAULX · LENDER PROTOCOL
          </span>
        </div>
        <h1
          className="mt-8 font-display font-extrabold leading-[1.04] tracking-[-0.02em] text-[var(--ink)]"
          style={{
            fontSize: "clamp(2.25rem, 5.5vw, 4.25rem)",
            fontVariationSettings: '"opsz" 144',
          }}
        >
          Four vaults. Two currencies.{" "}
          <em className="not-italic italic font-normal text-[var(--brand)]">
            One credit thesis.
          </em>
        </h1>
        <p className="mt-8 max-w-[68ch] font-sans text-base leading-[1.65] text-[var(--ink-dim)] md:text-[17px]">
          Brazil&apos;s policy rate clears 7%; formal-sector unsecured credit
          clears 40%+; TradFi physical-collateral lenders sit in between with
          bank-grade margin and zero transparency. Vaulx originates pawn-style
          loans on-chain at a 26% borrower APR and pays USDC LPs 11% — the
          spread funds custody, FIDC structure, and credit reserves.
        </p>
        <p className="mt-4 max-w-[68ch] font-sans text-sm leading-[1.65] text-[var(--ink-muted)]">
          Senior tranches absorb principal first; subordinate tranches earn
          uplift in exchange for taking the first dollar of any loss. All four
          vaults reference the same loan book — different cuts of the same
          waterfall.
        </p>
      </header>

      {/* Live Devnet deposit panel — wired to vault.deposit on Devnet */}
      <section className="mt-12">
        <LendDepositPanel />
      </section>

      {/* Stat strip */}
      <section className="mt-12 grid grid-cols-2 gap-px border border-[var(--rule)] bg-[var(--rule)] md:grid-cols-4">
        <Stat eyebrow="Total TVL" value={fmtTotalTvl(sum)} unit="USD eq." />
        <Stat eyebrow="Active TRDCs" value="47" />
        <Stat eyebrow="Average LTV" value="47.3" unit="%" />
        <Stat eyebrow="Avg Borrower APR" value="26" unit="%" />
      </section>

      {/* Tranche grid */}
      <section className="mt-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <span className="eyebrow">The vault book</span>
            <h2 className="mt-3 font-display text-[clamp(1.5rem,2.6vw,2.25rem)] font-bold leading-[1.1] tracking-[-0.015em] text-[var(--ink)]">
              Pick a tranche.
            </h2>
          </div>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--ink-muted)] md:inline-block">
            Sort · Risk → APY
          </span>
        </div>

        <div className="mt-8 grid gap-px border border-[var(--rule)] bg-[var(--rule)] md:grid-cols-2">
          {TRANCHES.map((t) => (
            <TrancheTile key={t.id} tranche={t} />
          ))}
        </div>
      </section>

      {/* Secondary CTAs */}
      <section className="mt-16 flex flex-wrap items-center gap-4 border-t border-[var(--rule)] pt-12">
        <Link href="/demo/lend/onboard" className="btn-gold">
          <span>Become an LP</span>
          <Arrow />
        </Link>
        <Link href="/demo/lend/liquidity" className="btn-gold-outline">
          <span>View liquidity routing</span>
          <Arrow />
        </Link>
      </section>
    </DemoShell>
  );
}

function Stat({
  eyebrow,
  value,
  unit,
}: {
  eyebrow: string;
  value: string;
  unit?: string;
}) {
  return (
    <div className="bg-[var(--bg)] p-6">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
        {eyebrow}
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="font-mono text-3xl tracking-[-0.02em] text-[var(--ink)] tabnums">
          {value}
        </span>
        {unit && (
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

function TrancheTile({ tranche }: { tranche: VaultTranche }) {
  const isSenior = tranche.risk === "senior";
  return (
    <Link
      href={`/demo/lend/vaults/${tranche.id}`}
      className="group relative flex flex-col gap-6 bg-[var(--bg)] p-8 transition-colors hover:bg-[var(--bg-elev-1)]"
    >
      <div
        aria-hidden
        className="absolute left-0 top-8 h-12 w-px bg-transparent transition-colors group-hover:bg-[var(--brand)]"
      />
      <div className="flex items-start justify-between gap-4">
        <div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.16em] ${
              isSenior
                ? "border border-[var(--brand)]/40 bg-[var(--brand)]/10 text-[var(--brand)]"
                : "border border-[var(--rule-strong)] bg-[var(--bg-elev-1)] text-[var(--ink-muted)]"
            }`}
          >
            {isSenior ? "Senior" : "Subordinate"}
          </span>
          <h3 className="mt-4 font-display text-[clamp(1.25rem,2vw,1.75rem)] font-semibold leading-[1.15] tracking-[-0.01em] text-[var(--ink)]">
            {tranche.name}
            {tranche.kaminoFloat && (
              <span className="ml-2 inline-flex items-center rounded bg-emerald-50 px-2 py-1 align-middle font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-emerald-700">
                +{tranche.kaminoFloatApy}% Kamino float
              </span>
            )}
          </h3>
          <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
            {tranche.audience}
          </p>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
          {tranche.currency}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-6 border-t border-[var(--rule)] pt-6">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
            APY
          </div>
          <div className="mt-2 font-mono text-3xl tracking-[-0.02em] text-[var(--brand)] tabnums">
            {APY_FMT.format(tranche.apy)}
            <span className="ml-1 text-sm text-[var(--ink-muted)]">%</span>
          </div>
        </div>
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
            TVL
          </div>
          <div className="mt-2 font-mono text-2xl tracking-[-0.02em] text-[var(--ink)] tabnums">
            {fmtTvl(tranche.tvl, tranche.currency)}
          </div>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-[var(--rule)] pt-5">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
          {isSenior ? "First-loss protected" : "First-loss bearer"}
        </span>
        <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--brand)]">
          Open vault
          <Arrow />
        </span>
      </div>
    </Link>
  );
}

function Arrow() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="h-4 w-4"
      aria-hidden
    >
      <path strokeLinecap="round" d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}
