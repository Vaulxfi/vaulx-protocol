// 8 synthetic bids replayed over a 60s loop on the auction detail page.
// Pseudonymized bidder ids only. NEVER add a real name here.

export type MockBid = {
  ts: string;       // HH:MM:SS — display only
  bidder: string;   // pseudonym, e.g. vaulx-lender-04
  amount: number;
  tier: 1 | 2 | 3;
};

export const MOCK_BIDS: readonly MockBid[] = [
  { ts: "14:32:08", bidder: "vaulx-lender-04", amount: 8800, tier: 1 },
  { ts: "14:31:42", bidder: "vaulx-lender-04", amount: 8775, tier: 1 },
  { ts: "14:30:11", bidder: "vaulx-lender-12", amount: 8740, tier: 1 },
  { ts: "14:29:55", bidder: "vaulx-lender-04", amount: 8720, tier: 1 },
  { ts: "14:28:39", bidder: "vaulx-lender-19", amount: 8705, tier: 1 },
  { ts: "14:27:14", bidder: "vaulx-lender-12", amount: 8700, tier: 1 },
  { ts: "14:25:02", bidder: "vaulx-lender-08", amount: 8690, tier: 1 },
  { ts: "14:22:48", bidder: "vaulx-lender-04", amount: 8650, tier: 1 },
] as const;
