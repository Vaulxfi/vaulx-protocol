"use client";
// Vault tranche detail. 7/5 editorial split — left: numerals + sparkline +
// stat strip; right: deposit form. Deposit submissions are mocked, but the
// useKycGate intercept still fires so the lazy-KYC UX shows on first deposit.
import { useMemo, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DemoShell } from "../../../_components/demo-shell";
import { MockBadge } from "../../../_components/integration-badges";
import { TRANCHES, type VaultTranche } from "../../../_fixtures/vault-tranches";
import { useKycGate, KycCancelledError } from "@/lib/use-kyc-gate";

const APY_FMT = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const NUM_FMT = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

function fmtTvl(amount: number, currency: "USDC" | "BRL"): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(2)}M ${currency}`;
  if (amount >= 1_000) return `${Math.round(amount / 1_000)}K ${currency}`;
  return `${NUM_FMT.format(amount)} ${currency}`;
}

// Deterministic PRNG seeded by the tranche id (xmur3 + sfc32-lite).
function seedFromString(s: string): () => number {
  let h = 1779033703 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

function genSparkline(id: string, base: number): number[] {
  const rng = seedFromString(id);
  const points: number[] = [];
  let cur = base * 0.92;
  for (let i = 0; i < 60; i++) {
    const drift = (rng() - 0.45) * base * 0.012;
    cur = Math.max(base * 0.85, cur + drift);
    points.push(cur);
  }
  // Force last point to land near current TVL.
  points[points.length - 1] = base;
  return points;
}

function genEvents(id: string, currency: "USDC" | "BRL") {
  const rng = seedFromString(`${id}-events`);
  const verbs: ("Deposit" | "Withdraw" | "Yield claim")[] = [
    "Deposit",
    "Deposit",
    "Yield claim",
    "Withdraw",
    "Deposit",
  ];
  return verbs.map((verb, i) => {
    const amount = Math.round((rng() * 80_000 + 5_000) / 1_000) * 1_000;
    const lp = `vaulx-lp-${String(Math.floor(rng() * 60) + 1).padStart(2, "0")}`;
    const minutesAgo = (i + 1) * Math.ceil(rng() * 9 + 2);
    return { verb, amount, lp, minutesAgo, currency };
  });
}

type Params = { id: string };

export default function VaultDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = params;
  const tranche = TRANCHES.find((t) => t.id === id);
  if (!tranche) {
    notFound();
  }
  return <VaultDetail tranche={tranche!} />;
}

function VaultDetail({ tranche }: { tranche: VaultTranche }) {
  const sparkline = useMemo(() => genSparkline(tranche.id, tranche.tvl), [tranche]);
  const events = useMemo(
    () => genEvents(tranche.id, tranche.currency),
    [tranche],
  );
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const { guard, modalNode } = useKycGate(`Deposit ${tranche.currency}`);

  async function handleDeposit() {
    if (!amount) return;
    setSubmitting(true);
    try {
      await guard(
        () =>
          new Promise<void>((resolve) => {
            setTimeout(() => {
              setToast(
                `✓ Deposit confirmed (mock) · ${amount} ${tranche.currency}`,
              );
              setAmount("");
              setTimeout(() => setToast(null), 4000);
              resolve();
            }, 2000);
          }),
      );
    } catch (err) {
      if (!(err instanceof KycCancelledError)) {
        setToast(
          `✗ ${err instanceof Error ? err.message : String(err)}`,
        );
        setTimeout(() => setToast(null), 4000);
      }
    } finally {
      setSubmitting(false);
    }
  }

  const isSenior = tranche.risk === "senior";

  return (
    <DemoShell formFactor="desktop">
      {modalNode}
      <Link
        href="/demo/lend"
        className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)] hover:text-[var(--ink)]"
      >
        ← All vaults
      </Link>

      <div className="mt-6 grid gap-12 md:grid-cols-12">
        {/* Left: 7/12 */}
        <div className="md:col-span-7">
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.16em] ${
                isSenior
                  ? "border border-[var(--brand)]/40 bg-[var(--brand)]/10 text-[var(--brand)]"
                  : "border border-[var(--rule-strong)] bg-[var(--bg-elev-1)] text-[var(--ink-muted)]"
              }`}
            >
              {isSenior ? "Senior" : "Subordinate"}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
              {tranche.audience}
            </span>
          </div>

          <h1
            className="mt-6 font-display font-bold leading-[1.04] tracking-[-0.02em] text-[var(--ink)]"
            style={{
              fontSize: "clamp(2rem, 4.5vw, 3.5rem)",
              fontVariationSettings: '"opsz" 144',
            }}
          >
            {tranche.name}
          </h1>

          <div className="mt-10 grid grid-cols-2 gap-px border border-[var(--rule)] bg-[var(--rule)]">
            <div className="bg-[var(--bg)] p-6">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                APY
              </div>
              <div className="mt-3 font-mono text-5xl tracking-[-0.02em] text-[var(--brand)] tabnums">
                {APY_FMT.format(tranche.apy)}
                <span className="ml-2 text-base text-[var(--ink-muted)]">%</span>
              </div>
              <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                gross · paid weekly · {tranche.currency}
              </div>
            </div>
            <div className="bg-[var(--bg)] p-6">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                TVL
              </div>
              <div className="mt-3 font-mono text-5xl tracking-[-0.02em] text-[var(--ink)] tabnums">
                {fmtTvl(tranche.tvl, tranche.currency)}
              </div>
              <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                deposited capital
              </div>
            </div>
          </div>

          <div className="mt-8 border border-[var(--rule)] bg-[var(--bg-elev-1)] p-6">
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                TVL · last 30 days
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--brand)]">
                +4.2%
              </span>
            </div>
            <Sparkline values={sparkline} />
          </div>

          <div className="mt-8 grid grid-cols-2 gap-px border border-[var(--rule)] bg-[var(--rule)] md:grid-cols-4">
            <Stat eyebrow="30D Flow" value="+184K" sub={tranche.currency} positive />
            <Stat eyebrow="Active loans" value="47" sub="TRDCs" />
            <Stat eyebrow="Avg LTV" value="47.3" sub="%" />
            <Stat eyebrow="Reserve" value="6.2" sub="% TVL" />
          </div>

          {/* Recent events */}
          <div className="mt-12">
            <span className="eyebrow">Recent activity</span>
            <ul className="mt-5 flex flex-col border border-[var(--rule)]">
              {events.map((e, i) => (
                <li
                  key={i}
                  className="flex items-baseline justify-between gap-4 border-b border-[var(--rule)] px-5 py-4 font-mono text-xs last:border-b-0"
                >
                  <span
                    className={`uppercase tracking-[0.14em] ${
                      e.verb === "Withdraw"
                        ? "text-[var(--ink-muted)]"
                        : "text-[var(--ink-dim)]"
                    }`}
                  >
                    {e.verb}
                  </span>
                  <span className="tabnums text-[var(--ink)]">
                    {NUM_FMT.format(e.amount)} {e.currency}
                  </span>
                  <span className="text-[var(--ink-muted)]">{e.lp}</span>
                  <span className="text-[var(--ink-muted)] tabnums">
                    {e.minutesAgo} min ago
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right: 5/12 — deposit form */}
        <aside className="md:col-span-5">
          <div className="md:sticky md:top-24">
            <div className="border border-[var(--rule)] bg-[var(--bg-elev-1)] p-6">
              <span className="eyebrow">Deposit</span>
              <h2 className="mt-3 font-display text-2xl font-semibold tracking-[-0.01em] text-[var(--ink)]">
                Supply {tranche.currency}.
              </h2>
              <p className="mt-3 font-sans text-sm leading-[1.6] text-[var(--ink-dim)]">
                Funds are wrapped via FIDC structure (retail) or Tokeny ERC-3643
                identity (institutional). Yield accrues from the moment the
                deposit clears.
              </p>

              <label className="mt-8 block">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                  Amount
                </span>
                <div className="mt-2 flex items-baseline gap-2 border border-[var(--rule)] bg-[var(--bg)] px-4 py-3 focus-within:border-[var(--brand)]">
                  <input
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) =>
                      setAmount(e.target.value.replace(/[^\d.]/g, ""))
                    }
                    placeholder="0.00"
                    className="flex-1 bg-transparent font-mono text-2xl tabnums text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none"
                  />
                  <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                    {tranche.currency}
                  </span>
                </div>
              </label>

              <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                Estimated APY ·{" "}
                <span className="text-[var(--brand)]">
                  {APY_FMT.format(tranche.apy)}%
                </span>
              </p>

              <button
                type="button"
                onClick={handleDeposit}
                disabled={!amount || submitting}
                className="mt-8 inline-flex w-full items-center justify-center gap-2 border border-[var(--brand)] bg-[var(--brand)] px-5 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--bg)] transition-opacity disabled:opacity-30"
              >
                {submitting ? (
                  <>
                    <Spinner /> Submitting…
                  </>
                ) : (
                  <>Deposit {tranche.currency} →</>
                )}
              </button>

              <div className="mt-6 border-t border-[var(--rule)] pt-4 font-mono text-[10px] uppercase leading-[1.6] tracking-[0.14em] text-[var(--ink-muted)]">
                Risk: {isSenior ? "senior — first to be repaid" : "subordinate — first-loss bearer"}.
                Capital is non-custodial; vault enforces share accounting.
              </div>
            </div>
          </div>
        </aside>
      </div>

      {toast && (
        <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 border border-[var(--brand)] bg-[var(--bg-elev-1)] px-5 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--brand)] shadow-lg">
          {toast}
        </div>
      )}
      <MockBadge partner="Vault deposit" />
    </DemoShell>
  );
}

function Stat({
  eyebrow,
  value,
  sub,
  positive,
}: {
  eyebrow: string;
  value: string;
  sub?: string;
  positive?: boolean;
}) {
  return (
    <div className="bg-[var(--bg)] p-5">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
        {eyebrow}
      </div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span
          className={`font-mono text-2xl tracking-[-0.02em] tabnums ${
            positive ? "text-[var(--signal-good)]" : "text-[var(--ink)]"
          }`}
        >
          {value}
        </span>
        {sub && (
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
            {sub}
          </span>
        )}
      </div>
    </div>
  );
}

function Sparkline({ values }: { values: number[] }) {
  const w = 800;
  const h = 120;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = w / (values.length - 1);
  const path = values
    .map((v, i) => {
      const x = i * stepX;
      const y = h - ((v - min) / range) * h * 0.85 - h * 0.075;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const fill = `${path} L${w},${h} L0,${h} Z`;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="mt-4 h-32 w-full"
      aria-hidden
    >
      <path d={fill} fill="var(--brand)" fillOpacity="0.08" />
      <path
        d={path}
        fill="none"
        stroke="var(--brand)"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden
      className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-[1.5px] border-current border-t-transparent"
    />
  );
}
