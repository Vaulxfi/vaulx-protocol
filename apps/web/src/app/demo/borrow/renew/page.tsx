"use client";
// Roll into a new term. Fee math: flat 2% of outstanding principal via
// `@vaulx/terms.computeRenewalFee`; the rate for the new term comes from
// the canonical RATE_TABLE_BPS so 30/60/90 stay the only legal options.
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { computeRenewalFee, rateForTermDays } from "@vaulx/terms";
import { DemoShell } from "../../_components/demo-shell";
import { useDemoSession } from "../../_lib/use-demo-session";

const SECONDS_PER_DAY = 86_400;
const TERMS = [30, 60, 90] as const;
type TermDays = (typeof TERMS)[number];

const USDC_FMT = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function fmtUsdc(atoms: bigint): string {
  return USDC_FMT.format(Number(atoms) / 1_000_000);
}

function fmtBpsPct(bps: number): string {
  const whole = Math.floor(bps / 100);
  const rem = bps % 100;
  return `${whole}.${rem.toString().padStart(2, "0")}%`;
}

function toIsoDate(unixSec: number): string {
  return new Date(unixSec * 1000).toISOString().slice(0, 10);
}

type RenewState = "ready" | "renewing" | "done";

export default function RenewPage() {
  const router = useRouter();
  const { session, patch } = useDemoSession();
  const [termDays, setTermDays] = useState<TermDays>(60);
  const [state, setState] = useState<RenewState>("ready");

  useEffect(() => {
    if (session && !session.loan?.disbursedAt) {
      router.replace("/demo/borrow/disburse");
    }
  }, [session, router]);

  // Lock the renewal anchor at first paint so the preview is stable.
  const [renewAtSec] = useState(() => Math.floor(Date.now() / 1000));

  const principalAtoms = useMemo(() => {
    if (!session?.loan) return 0n;
    try {
      return BigInt(session.loan.principalAtoms);
    } catch {
      return 0n;
    }
  }, [session?.loan]);

  const feeAtoms = useMemo(() => computeRenewalFee(principalAtoms), [principalAtoms]);

  const newRateBps = useMemo(() => rateForTermDays(termDays), [termDays]);
  const newDueTs = useMemo(() => renewAtSec + termDays * SECONDS_PER_DAY, [renewAtSec, termDays]);

  if (!session) {
    return (
      <DemoShell formFactor="phone">
        <div className="px-6 py-12 text-[var(--ink-muted)]">Loading…</div>
      </DemoShell>
    );
  }

  if (!session.loan?.disbursedAt) {
    return (
      <DemoShell formFactor="phone">
        <div className="px-6 py-12 text-[var(--ink-muted)]">Redirecting…</div>
      </DemoShell>
    );
  }

  const handleRenew = () => {
    if (state !== "ready") return;
    setState("renewing");
    window.setTimeout(() => {
      patch((s) => {
        if (!s.loan) return s;
        let balance = 0n;
        try {
          const cur = BigInt(s.loan.inAppBalanceAtoms);
          balance = cur > feeAtoms ? cur - feeAtoms : 0n;
        } catch {
          balance = 0n;
        }
        return {
          ...s,
          loan: {
            ...s.loan,
            termDays,
            rateBps: newRateBps,
            dueTs: newDueTs,
            inAppBalanceAtoms: balance.toString(),
          },
        };
      });
      setState("done");
    }, 1500);
  };

  const ctaLabel =
    state === "renewing"
      ? "Renewing…"
      : state === "done"
        ? "Renewed"
        : `Renew ${termDays} days`;

  return (
    <DemoShell formFactor="phone">
      <div className="px-6 py-8">
        <p className="eyebrow" style={{ color: "var(--brand)" }}>
          Renew · Roll into a new term
        </p>
        <h1 className="display-md mt-3">Keep the loan. Pay the carry.</h1>
        <p className="mt-3 text-sm text-[var(--ink-dim)]">
          Pick a new term. The 2% renewal fee is flat on outstanding principal.
        </p>

        {/* Term radio */}
        <div className="mt-6">
          <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
            New term length
          </div>
          <div className="grid grid-cols-3 gap-2">
            {TERMS.map((d) => (
              <label
                key={d}
                className={`flex cursor-pointer items-center justify-center rounded border px-3 py-3 font-mono text-xs uppercase tracking-[0.14em] transition-colors ${
                  termDays === d
                    ? "border-[var(--brand)] bg-[var(--brand)]/10 text-[var(--brand)]"
                    : "border-[var(--rule)] bg-[var(--bg)] text-[var(--ink-dim)]"
                }`}
              >
                <input
                  type="radio"
                  name="termDays"
                  value={d}
                  checked={termDays === d}
                  onChange={() => setTermDays(d)}
                  className="sr-only"
                />
                {d}d
              </label>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="mt-6 rounded-md border border-[var(--rule)] bg-[var(--bg-elev-1)] p-5">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
            Renewal preview
          </div>
          <div className="mt-4 divide-y divide-[var(--rule)]">
            <div className="flex items-baseline justify-between py-2">
              <span className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                New due date
              </span>
              <span
                className="font-mono text-sm text-[var(--ink)]"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {toIsoDate(newDueTs)}
              </span>
            </div>
            <div className="flex items-baseline justify-between py-2">
              <span className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                New rate
              </span>
              <span
                className="font-mono text-sm text-[var(--ink)]"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {fmtBpsPct(newRateBps)} APR
              </span>
            </div>
            <div className="flex items-baseline justify-between py-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--brand)]">
                Renewal fee · 2% flat
              </span>
              <span
                className="font-mono text-2xl text-[var(--brand)]"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {fmtUsdc(feeAtoms)} USDC
              </span>
            </div>
          </div>
        </div>

        {state === "renewing" && (
          <div className="mt-6 flex items-center gap-3 rounded-md border border-[var(--rule)] bg-[var(--bg-elev-1)] p-4">
            <span
              className="inline-block h-2 w-2 rounded-full bg-[var(--brand)]"
              style={{ animation: "vxRenewPulse 1.4s ease-in-out infinite" }}
            />
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--ink-dim)]">
              Rolling term on-chain…
            </p>
          </div>
        )}

        {state === "done" && (
          <div
            className="mt-6 rounded-md border border-emerald-500/60 bg-emerald-500/10 p-5"
            style={{ animation: "vxReveal 600ms cubic-bezier(.22,1,.36,1)" }}
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-400">
              ✓ Renewed for {termDays} days
            </p>
            <p className="mt-2 text-sm text-[var(--ink)]">
              New due date {toIsoDate(newDueTs)}. Watch stays in Vault A-32.
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={handleRenew}
          disabled={state !== "ready"}
          className="mt-8 w-full rounded-md border border-[var(--brand)] bg-[var(--brand)] px-4 py-4 font-mono text-sm uppercase tracking-[0.16em] text-[var(--bg)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {ctaLabel}
        </button>

        <Link
          href="/demo/borrow/dashboard"
          className="mt-6 block text-center font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)] hover:text-[var(--brand)]"
        >
          ← Back to dashboard
        </Link>

        <style jsx>{`
          @keyframes vxRenewPulse {
            0%,
            100% {
              opacity: 1;
            }
            50% {
              opacity: 0.3;
            }
          }
        `}</style>
      </div>
    </DemoShell>
  );
}
