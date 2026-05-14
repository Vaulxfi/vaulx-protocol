import Link from "next/link";
import type { Metadata } from "next";
import { Calculator } from "lucide-react";

import { PitchLine } from "@/components/marketing/home/pitch-line";

export const metadata: Metadata = {
  title: "FAQ — Vaulx",
  description: "Clear answers about how Vaulx works.",
};

// Source of truth: site/resources/views/faq.blade.php:11-21
// (the Laravel inline `@foreach([...]) as $i => $qa)` array).
const FAQS: ReadonlyArray<readonly [string, string]> = [
  [
    "How does collateralized lending work?",
    "You register a physical asset (watch, jewelry, art, vehicle), ship it to audited custody, and after the protocol creates the on-chain loan record you can borrow USDC up to the allowed LTV (capped at 60%).",
  ],
  [
    "Can I receive in reais (BRZ) or only in dollars (USDC)?",
    "Both. In step 2 of the wizard you choose. BRZ is BRL-backed and removes FX risk; USDC has deeper liquidity. Repayment must be in the same currency as the disbursement.",
  ],
  [
    "How is interest calculated?",
    "Linear simple interest: Principal × (annual_bps / 10,000) × (elapsed_seconds / 31,536,000). Example: R$5,000 at 24% APR for 90 days = R$ 295.89.",
  ],
  [
    "What happens if I miss a payment?",
    "1.5% monthly late fee on the principal. After maturity the loan automatically becomes OVERDUE via the cron bot. Continued delinquency leads to admin-executed liquidation.",
  ],
  [
    "Can I see my loan on Solana?",
    "Yes — every active loan has a TRDC state PDA on-chain (program: Loan). You can verify the principal, due date, status, and the disbursement transaction on Solana Explorer. The PDA is owned by the Loan Program, so it cannot be reassigned or tampered with off-chain.",
  ],
  [
    "What is the Squads 2/3 Multisig?",
    "All sensitive actions (deposit, withdraw, pause, default) require 2 of 3 signatures from the team: Founder, Co-founder and a cold-storage Backup. No single key controls funds.",
  ],
  [
    "Can the mark_overdue bot touch my vault?",
    "No. The cron bot wallet has ZERO vault access — it can only call the mark_overdue instruction. A compromised server cannot move funds.",
  ],
  [
    "How is BRZ depeg monitored?",
    "Every 5 minutes the backend queries Jupiter Price API (BRZ/USD) + AwesomeAPI (USD/BRL). >1% deviation alerts the admin; >3% pauses the BRZ vault; >5% triggers a conversion offer to USDC.",
  ],
  [
    "Can I withdraw the liquidity I deposited?",
    "Vault deposits are made by the admin (protocol treasury). Withdrawals are only allowed when there are no active loans in the vault, to guarantee solvency.",
  ],
] as const;

export default function FaqPage() {
  return (
    <>
      <PitchLine variant="inline">Protocol</PitchLine>
      <h2
        className="mb-3 font-sans font-bold tracking-[-0.025em] text-[var(--vx-text)]"
        style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.25rem)", lineHeight: 1.15 }}
      >
        Frequently Asked Questions
      </h2>
      <p className="mb-8 text-[var(--vx-text-muted)]">
        Clear answers about how Vaulx works.
      </p>

      <div className="flex flex-col gap-0 border border-[var(--vx-border)]">
        {FAQS.map(([question, answer], i) => (
          <details
            key={question}
            className="group bg-[var(--vx-surface)] open:bg-[var(--vx-surface-2)] [&:not(:last-child)]:border-b [&:not(:last-child)]:border-[var(--vx-border)]"
            open={i === 0}
          >
            <summary
              className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-[var(--vx-text)] group-open:text-[var(--vx-teal)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(14,124,123,0.25)] [&::-webkit-details-marker]:hidden"
            >
              <span className="font-sans text-[1rem] font-medium leading-snug">
                {question}
              </span>
              <span
                aria-hidden
                className="shrink-0 text-[var(--vx-text-muted)] transition-transform duration-200 group-open:rotate-180"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3 5l4 4 4-4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </summary>
            <div className="border-t border-[var(--vx-border-soft)] px-5 py-4 text-[0.95rem] leading-relaxed text-[var(--vx-text-muted)]">
              {answer}
            </div>
          </details>
        ))}
      </div>

      <div className="mt-12 flex flex-wrap justify-center gap-3">
        <Link
          href="/simulator"
          className="inline-flex items-center justify-center gap-2 bg-transparent px-4 py-3 text-[var(--vx-text)] font-mono text-[0.875rem] uppercase tracking-[0.14em] font-semibold border border-[rgba(10,10,11,0.3)] hover:bg-[var(--vx-text)] hover:text-[var(--vx-bg)] transition-colors duration-150 ease-glide"
        >
          <Calculator size={16} strokeWidth={1.75} aria-hidden />
          Simulate loan
        </Link>
        <Link
          href="/register"
          className="inline-flex items-center justify-center bg-[var(--vx-text)] px-4 py-3 text-[var(--vx-bg)] font-mono text-[0.875rem] uppercase tracking-[0.14em] font-semibold border border-[var(--vx-text)] hover:bg-transparent hover:text-[var(--vx-text)] transition-colors duration-150 ease-glide"
        >
          Create account
        </Link>
      </div>
    </>
  );
}
