import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use — Vaulx",
  description:
    "Vaulx terms of use governing the platform during the private beta.",
};

// Laravel renders `now()->format('m/d/Y')` — a per-render timestamp.
// In the static Next port the timestamp is pinned to the date this page
// was last revised. Update when the policy itself changes.
const LAST_UPDATED = "05/13/2026";

interface Section {
  heading: string;
  body: string;
}

// Source of truth: site/resources/views/terms.blade.php:9-31
const SECTIONS: ReadonlyArray<Section> = [
  {
    heading: "1. Overview",
    body: 'Vaulx is a luxury asset collateral protocol — "luxury pawn meets private bank" — operating on the Solana network. This document governs the use of the platform during the private beta.',
  },
  {
    heading: "2. Eligibility",
    body: "Users must be at least 18 years old and own a compatible Solana wallet (Phantom, Backpack or Ledger). KYC information will be required for the production release.",
  },
  {
    heading: "3. Collateral custody",
    body: "Physical assets must be shipped to the audited custody facility indicated by the protocol. The on-chain loan record (TRDC state PDA) is held by the Loan Program until the loan is fully repaid, at which point the physical asset is released back to the borrower.",
  },
  {
    heading: "4. Interest model",
    body: "Linear simple interest, annual rate declared in basis points. 1.5% monthly late fee over the principal for delinquent loans. 2.5% origination fee is charged upon disbursement.",
  },
  {
    heading: "5. Multi-token",
    body: "Disbursement can be made in USDC or BRZ. Repayment must be made in the same currency as the disbursement — there is no automatic on-chain conversion.",
  },
  {
    heading: "6. BRZ depeg risk",
    body: "If the BRZ/BRL peg deviates by more than 3%, the BRZ vault is automatically paused. Deviations above 5% trigger an option to convert the outstanding balance to USDC at the adjusted rate.",
  },
  {
    heading: "7. Default",
    body: "After maturity and the grace period, the admin may execute liquidation: the on-chain loan record is transitioned to Defaulted and the physical asset is auctioned or retained according to operational policy.",
  },
  {
    heading: "8. Limitation of liability",
    body: "The platform is in private beta. The team is not liable for losses resulting from use prior to a formal independent audit of the on-chain programs and custody operations.",
  },
];

export default function TermsPage() {
  return (
    <>
      <h2 className="mb-3 font-sans text-[2rem] font-bold text-[var(--vx-text)]">
        Terms of Use
      </h2>
      <p className="text-[var(--vx-text-muted)]">Last updated: {LAST_UPDATED}</p>

      {SECTIONS.map((section) => (
        <section key={section.heading}>
          <h5 className="mt-6 font-sans text-[1.25rem] font-bold text-[var(--vx-text)]">
            {section.heading}
          </h5>
          <p className="mt-2 text-[var(--vx-text)] leading-relaxed">
            {section.body}
          </p>
        </section>
      ))}

      <p className="mt-6 text-[0.875rem] text-[var(--vx-text-muted)]">
        Contact: support@vaulx.fi
      </p>
    </>
  );
}
