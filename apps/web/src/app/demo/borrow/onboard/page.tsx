"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { DemoShell } from "../../_components/demo-shell";

/**
 * Single-step intro to the borrower demo. Sign-in (Crossmint or wallet) and
 * KYC (Sumsub) both happen downstream:
 *   - Sign-in: `/demo/borrow/wallet` — Crossmint Auth modal handles non-crypto
 *     users (Google/email auto-provisioned smart wallet) + crypto-natives
 *     (Phantom/Solflare) in one button.
 *   - KYC: lazy `<KycRequiredModal>` (via `useKycGate`) fires only at
 *     money-touching CTAs (Submit asset / Disburse / Deposit). No friction
 *     while browsing.
 *
 * Replaces the old 14-step Civic + gov.br stacked-gate wizard
 * (commit 025f832 dropped Civic; gov.br is superseded by Sumsub Brazil
 * Non-Doc CPF flow inside the lazy KYC modal).
 */
export default function OnboardPage() {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <DemoShell formFactor="phone">
      <div className="px-6 py-8">
        <p className="eyebrow">Welcome · 60-sec onboarding</p>
        <h1 className="display-md mt-3">Sign in. Browse. Verify when ready.</h1>
        <p className="mt-3 text-sm text-[var(--ink-dim)]">
          Sign in with Google, email, or your existing Solana wallet.
          Identity verification kicks in only when you submit an asset,
          disburse, or lend — not before.
        </p>

        <div className="mt-6 rounded-md border border-[var(--rule)] p-4">
          <p className="font-mono text-xs uppercase tracking-wider text-[var(--ink-muted)]">
            Elapsed: {elapsed}s
          </p>
          <ul className="mt-3 space-y-2 text-sm text-[var(--ink-dim)]">
            <li>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                Step 1
              </span>{" "}
              Sign in (Crossmint or your wallet)
            </li>
            <li>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                Step 2
              </span>{" "}
              Register an asset
            </li>
            <li>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                Step 3
              </span>{" "}
              Verify identity at submission (Sumsub, ~60s for Brazil)
            </li>
            <li>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                Step 4
              </span>{" "}
              Custodian books pickup, then disburse to your wallet
            </li>
          </ul>
        </div>

        <Link
          href="/demo/borrow/wallet"
          className="mt-8 block w-full rounded-md border border-[var(--brand)] bg-[var(--brand)] px-4 py-3 text-center font-mono text-sm uppercase tracking-wider text-[var(--bg)]"
        >
          Continue to sign in →
        </Link>
      </div>
    </DemoShell>
  );
}
