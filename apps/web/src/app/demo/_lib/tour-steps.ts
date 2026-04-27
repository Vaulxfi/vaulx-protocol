// 14-step canonical Rolex story (per design doc §5).
// `selector` highlights an element; if absent, the popover floats centered.
// Step 9 (`pauseAfter: true`) is the AHA moment — no auto-advance until the
// user actually disburses (detected via `session.loan.disbursedAt`).

export type TourStep = {
  index: number;
  route: string;
  selector?: string;
  headline: string;
  caption: string;
  pauseAfter?: boolean;
};

export const TOUR_STEPS: TourStep[] = [
  {
    index: 0,
    route: "/demo",
    headline: "This is Vaulx — let's borrow against a Rolex in two minutes.",
    caption: "Tap continue to start the canonical flow.",
  },
  {
    index: 1,
    route: "/demo/borrow/onboard",
    headline: "60-second KYC.",
    caption: "Civic Pass real on Solana. gov.br for Brazilian PII.",
  },
  {
    index: 2,
    route: "/demo/borrow/wallet",
    headline: "Sign in once. Solana smart wallet provisioned.",
    caption:
      "Crossmint provides email/Apple/Google login. No seed phrase. Smart wallet keyed to your identity.",
  },
  {
    index: 3,
    route: "/demo/borrow/wallet",
    headline: "Wallet ready in <2 sec.",
    caption:
      "Vaulx and the borrower share the keys via Crossmint's smart wallet model.",
  },
  {
    index: 4,
    route: "/demo/borrow/register",
    headline: "Register your watch.",
    caption: "Make + model + reference + 3 photos.",
  },
  {
    index: 5,
    route: "/demo/borrow/appraisal",
    headline: "Triangular appraisal.",
    caption:
      "Chrono24 scrape. WatchCharts API. Vaulx model. Median locks the appraisal floor.",
  },
  {
    index: 6,
    route: "/demo/borrow/loan-offer",
    headline: "Pick LTV, term, rate.",
    caption: "Sign the CCB.B3 — Brazil's most weaponized credit instrument.",
  },
  {
    index: 7,
    route: "/demo/borrow/custody",
    headline: "Book a licensed vault.",
    caption: "Watch ships to Brinks SP. 48h expert eval.",
  },
  {
    index: 8,
    route: "/demo/borrow/awaiting-custody",
    headline: "Live IoT feed from the vault.",
    caption:
      "Custodian signs the on-chain confirmation. Watch every step.",
  },
  {
    index: 9,
    route: "/demo/borrow/disburse",
    headline: "AHA MOMENT.",
    caption:
      "Tap Release before custody → contract refuses with CustodyNotConfirmed. Custodian signs. Tap again → USDC streams.",
    pauseAfter: true,
  },
  {
    index: 10,
    route: "/demo/borrow/funds",
    headline: "Funds in your Vaulx wallet.",
    caption: "Three ways out — Pix, Solana wallet, debit card.",
  },
  {
    index: 11,
    route: "/demo/borrow/funds/pix",
    headline: "Pix in 2 seconds.",
    caption: "R$ at your bank.",
  },
  {
    index: 12,
    route: "/demo/borrow/dashboard",
    headline: "Live LTV + RedStone-wrapped Chrono24.",
    caption:
      "Vault telemetry. The borrower never wonders if their watch is safe.",
  },
  {
    index: 13,
    route: "/demo/borrow/repay",
    headline: "Repay anytime.",
    caption: "Renew if you need more time. Default → 3-tier auction.",
  },
];
