"use client";
// Final tour step. Borrower pays principal + accrued interest in full.
// Math goes through `@vaulx/terms.computePayoff` so this surface stays in
// lockstep with what the on-chain Rust mirror would compute on settlement.
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { computeInterestAccrued, computePayoff } from "@vaulx/terms";
import { DemoShell } from "../../_components/demo-shell";
import { useDemoSession } from "../../_lib/use-demo-session";

const SECONDS_PER_DAY = 86_400;

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

type RepayState = "ready" | "paying" | "done";

export default function RepayPage() {
  const router = useRouter();
  const { session, patch } = useDemoSession();
  const [state, setState] = useState<RepayState>("ready");

  useEffect(() => {
    if (session && !session.loan?.disbursedAt) {
      router.replace("/demo/borrow/disburse");
    }
  }, [session, router]);

  const principalAtoms = useMemo(() => {
    if (!session?.loan) return 0n;
    try {
      return BigInt(session.loan.principalAtoms);
    } catch {
      return 0n;
    }
  }, [session?.loan]);

  const createdAtSec = useMemo(() => {
    if (!session?.loan) return 0;
    return session.loan.dueTs - session.loan.termDays * SECONDS_PER_DAY;
  }, [session?.loan]);

  const nowSec = useMemo(() => Math.floor(Date.now() / 1000), []);

  const daysElapsed = useMemo(() => {
    if (!createdAtSec) return 0;
    return Math.max(0, Math.floor((nowSec - createdAtSec) / SECONDS_PER_DAY));
  }, [createdAtSec, nowSec]);

  const accruedAtoms = useMemo(() => {
    if (!session?.loan) return 0n;
    return computeInterestAccrued(principalAtoms, session.loan.rateBps, daysElapsed);
  }, [session?.loan, principalAtoms, daysElapsed]);

  const payoffAtoms = useMemo(() => {
    if (!session?.loan) return 0n;
    return computePayoff(principalAtoms, session.loan.rateBps, createdAtSec, nowSec);
  }, [session?.loan, principalAtoms, createdAtSec, nowSec]);

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

  const loan = session.loan;

  const handlePay = () => {
    if (state !== "ready") return;
    setState("paying");
    window.setTimeout(() => {
      patch((s) => {
        if (!s.loan) return s;
        let balance = 0n;
        try {
          const cur = BigInt(s.loan.inAppBalanceAtoms);
          balance = cur > payoffAtoms ? cur - payoffAtoms : 0n;
        } catch {
          balance = 0n;
        }
        return {
          ...s,
          loan: { ...s.loan, inAppBalanceAtoms: balance.toString() },
          tour: { ...s.tour, step: 14 },
        };
      });
      setState("done");
    }, 1500);
  };

  const ctaLabel =
    state === "paying" ? "Paying…" : state === "done" ? "Loan repaid" : "Pay full payoff";

  return (
    <DemoShell formFactor="phone">
      <div className="px-6 py-8">
        <p className="eyebrow" style={{ color: "var(--brand)" }}>
          Step 14 / 14 · Repay
        </p>
        <h1 className="display-md mt-3">Pay it off. Get your watch back.</h1>
        <p className="mt-3 text-sm text-[var(--ink-dim)]">
          Principal plus accrued interest. Single payment, single transaction.
        </p>

        {/* Breakdown */}
        <div className="mt-6 rounded-md border border-[var(--rule)] bg-[var(--bg-elev-1)] p-5">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
            Payoff breakdown
          </div>
          <div className="mt-4 divide-y divide-[var(--rule)]">
            <div className="flex items-baseline justify-between py-2">
              <span className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                Principal
              </span>
              <span
                className="font-mono text-sm text-[var(--ink)]"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {fmtUsdc(principalAtoms)} USDC
              </span>
            </div>
            <div className="flex items-baseline justify-between py-2">
              <span className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                Interest · {daysElapsed}d at {fmtBpsPct(loan.rateBps)} APR
              </span>
              <span
                className="font-mono text-sm text-[var(--ink)]"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {fmtUsdc(accruedAtoms)} USDC
              </span>
            </div>
            <div className="flex items-baseline justify-between py-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--brand)]">
                Total payoff
              </span>
              <span
                className="font-mono text-2xl text-[var(--brand)]"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {fmtUsdc(payoffAtoms)} USDC
              </span>
            </div>
          </div>
        </div>

        {state === "paying" && (
          <div className="mt-6 flex items-center gap-3 rounded-md border border-[var(--rule)] bg-[var(--bg-elev-1)] p-4">
            <span
              className="inline-block h-2 w-2 rounded-full bg-[var(--brand)]"
              style={{ animation: "vxRepayPulse 1.4s ease-in-out infinite" }}
            />
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--ink-dim)]">
              Settling on-chain…
            </p>
          </div>
        )}

        {state === "done" && (
          <div
            className="mt-6 rounded-md border border-emerald-500/60 bg-emerald-500/10 p-5"
            style={{ animation: "vxReveal 600ms cubic-bezier(.22,1,.36,1)" }}
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-400">
              ✓ Loan repaid
            </p>
            <p className="mt-2 text-sm text-[var(--ink)]">
              Custody release pending — your watch is on its way home from Vault A-32.
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={handlePay}
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
          @keyframes vxRepayPulse {
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
