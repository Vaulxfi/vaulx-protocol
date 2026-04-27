import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AuctionTierTimeline, type Tier } from "../auction-tier-timeline";

const tiers: [Tier, Tier, Tier] = [
  {
    number: 1,
    name: "Platform lenders",
    durationHours: 72,
    description: "Privileged window for the lenders who funded the loan.",
    status: "active",
    elapsedHours: 31,
    highBid: 8800,
    reserve: 8700,
    bidders: 12,
  },
  {
    number: 2,
    name: "Reseller curated network",
    durationHours: 48,
    description: "Vaulx-curated luxury watch dealers.",
    status: "pending",
  },
  {
    number: 3,
    name: "Public auction",
    durationHours: 168,
    description: "Open Solana + off-chain.",
    status: "pending",
  },
];

describe("<AuctionTierTimeline>", () => {
  it("renders 3 tiers with correct labels", () => {
    render(<AuctionTierTimeline tiers={tiers} />);
    expect(screen.getByText(/Platform lenders/)).toBeDefined();
    expect(screen.getByText(/Reseller curated network/)).toBeDefined();
    expect(screen.getByText(/Public auction/)).toBeDefined();
    expect(screen.getByText(/TIER 1 · 72H/)).toBeDefined();
    expect(screen.getByText(/TIER 2 · 48H/)).toBeDefined();
    expect(screen.getByText(/TIER 3 · 168H/)).toBeDefined();
  });

  it("active tier shows countdown + high bid + bidders", () => {
    render(<AuctionTierTimeline tiers={tiers} />);
    // High bid rendered
    expect(screen.getByText(/8,800 USDC/)).toBeDefined();
    // Bidders count
    expect(screen.getByText("12")).toBeDefined();
    // Reserve cleared (high bid >= reserve)
    expect(screen.getByText(/8,700 USDC ✓/)).toBeDefined();
    // Countdown HH:MM:SS pattern present
    const countdowns = screen.getAllByText(/^\d{2}:\d{2}:\d{2}$/);
    expect(countdowns.length).toBeGreaterThan(0);
  });

  it("pending tiers carry the opacity dim class", () => {
    const { container } = render(<AuctionTierTimeline tiers={tiers} />);
    const pendingCards = container.querySelectorAll('[data-status="pending"]');
    expect(pendingCards.length).toBe(2);
    pendingCards.forEach((card) => {
      expect(card.className).toContain("opacity-60");
    });
  });

  it("renders rose 'No bids placed' pill for no-bids state", () => {
    const noBidsTiers: [Tier, Tier, Tier] = [
      { ...tiers[0], status: "complete", highBid: 8800 },
      {
        number: 2,
        name: "Reseller curated network",
        durationHours: 48,
        description: "Vaulx-curated luxury watch dealers.",
        status: "no-bids",
      },
      { ...tiers[2] },
    ];
    render(<AuctionTierTimeline tiers={noBidsTiers} />);
    expect(screen.getByText(/No bids placed/i)).toBeDefined();
  });
});
