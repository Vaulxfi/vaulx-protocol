// Mock auction floor — always-populated list of currently-defaulted TRDCs.
// Pseudonymized lender data only. No real bidder names anywhere.

const HOUR = 3600 * 1000;
const NOW = 1714500000000; // Stable timestamp so SSR + client agree on `endTs`.

export type AuctionFloorEntry = {
  trdc: string;
  watch: string;
  appraisal: number;
  outstanding: number;
  tier: 1 | 2 | 3;
  endTs: number;
  highBid: number;
  bidders: number;
  reserve: number;
};

export const AUCTION_FLOOR: readonly AuctionFloorEntry[] = [
  {
    trdc: "VX-7A2F",
    watch: "Rolex Submariner 116610LN · 2018",
    appraisal: 14500,
    outstanding: 8700,
    tier: 1,
    endTs: NOW + 41 * HOUR,
    highBid: 8800,
    bidders: 12,
    reserve: 8700,
  },
  {
    trdc: "VX-A13C",
    watch: "Patek Nautilus 5711/1A · 2017",
    appraisal: 95000,
    outstanding: 57000,
    tier: 1,
    endTs: NOW + 18 * HOUR,
    highBid: 0,
    bidders: 0,
    reserve: 57000,
  },
  {
    trdc: "VX-D4F8",
    watch: "Audemars Piguet 15500ST · 2019",
    appraisal: 32000,
    outstanding: 19200,
    tier: 2,
    endTs: NOW + 36 * HOUR,
    highBid: 19500,
    bidders: 4,
    reserve: 19200,
  },
  {
    trdc: "VX-9C03",
    watch: "Omega Speedmaster 311.30 · 2020",
    appraisal: 6200,
    outstanding: 3700,
    tier: 3,
    endTs: NOW + 96 * HOUR,
    highBid: 3800,
    bidders: 2,
    reserve: 3700,
  },
] as const;

export function getAuction(trdc: string): AuctionFloorEntry | undefined {
  return AUCTION_FLOOR.find((a) => a.trdc === trdc);
}
