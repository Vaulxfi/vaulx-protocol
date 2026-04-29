# Vaulx — One-Slide Architecture (Two-Sided)
**For: Team · Deck slide · April 26, 2026**

A single-slide visual that shows: the platform concept, the user flow on **both sides** of the marketplace, the Solana + off-chain integrations attached to each step, and one-line rationale per partner.

---

## The framing

Vaulx is a **two-sided RWA credit market on Solana**.

- **Demand side:** asset-rich, credit-excluded borrowers post physical luxury collateral.
- **Supply side:** yield-seeking capital — institutional, FIDC retail, and Solana-native liquidity protocols — funds the loan book.
- **The Anchor program is the spine.** One audited program, four vaults, one invariant: `require!(custody_confirmed ∧ terms_accepted)`.

This framing matters: "two-sided marketplace" reads as a network-effect business to VCs. "Lending app" reads as a single-product play. Same code, different valuation logic.

---

## ASCII layout (proof the slide fits on one page)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  VAULX — Two-sided RWA credit market on Solana                              │
│  Demand: asset-rich borrowers · Supply: yield-seeking capital               │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  DEMAND SIDE (Borrower)                                                      │
│  ▶ Onboard ▶ Register ▶ Custody ▶ Disburse ▶ Manage ▶ Repay/Default        │
│   Civic     Chrono24   Brinks SP  USDC/BRZ   Privy      Auction PDA         │
│   gov.br    WatchCh.   Prosegur   TRDC=cNFT  Quartz     (3-tier)           │
│   Crossmint RedStone   Loomis     Bubblegum  Solflare                      │
│   LazorKit  Pyth       Gitel IoT             lobster                        │
│                        SCD/CCB                                              │
│                                                                              │
│  ▓▓▓▓▓▓▓▓▓▓▓▓ VAULX CORE — 1 audited Anchor program ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓       │
│  ▓ Inst-USDC │ Inst-BRL │ Retail-FIDC-USDC │ Retail-FIDC-BRL        ▓       │
│  ▓ require!(custody_confirmed ∧ terms_accepted) — the moat          ▓       │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓        │
│                                                                              │
│  SUPPLY SIDE (Liquidity provider)                                            │
│  ▶ Onboard ▶ Allocate ▶ Deposit ▶ Earn ▶ Recoveries ▶ Distribute            │
│   Civic     4 vaults   Kamino     LTV    Privileged   Loopscale             │
│   Tokeny    (pick      OCC        oracle auction      Jupiter               │
│   ERC-3643  USDC/BRL)  Plume      11%    first-look   (TRDC                 │
│   FIDC                 Nest       APY    72h          secondary)            │
│   wrapper              SCD                                                   │
│                        balance                                              │
│                        sheet                                                │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Per-step content (copy-paste ready)

### DEMAND side — borrower-facing

| Step | Partners | Why |
|---|---|---|
| **Onboard** | Civic, gov.br | KYC in 60s; gov.br = 170M BR users |
| **Onboard** | Crossmint, LazorKit | Wallet for non-crypto users — email or FaceID |
| **Register** | Chrono24, WatchCharts | Real luxury market price data |
| **Register** | RedStone, Pyth | Wrap into Solana-native oracle |
| **Custody** | Brinks, Prosegur, Loomis | Licensed SP vaults |
| **Custody** | Gitel | IoT/CFTV overlay (Marcelo's edge) |
| **Custody** | BACEN-licensed SCD | CCB + fiduciary alienation (legal paper) |
| **Disburse** | USDC, BRZ | Stablecoin rail |
| **Disburse** | cNFT Bubblegum | TRDC mint with custody hash |
| **Manage** | Privy | Pix off-ramp (Stripe-acquired) |
| **Manage** | Quartz | Alt off-ramp |
| **Manage** | Solflare Card, lobster.cash | Card spend (Mastercard / Visa) |
| **Repay/Default** | Auction PDA | 3-tier waterfall (in-program) |

### SUPPLY side — lender-facing

| Step | Partners | Why |
|---|---|---|
| **Onboard** | Civic (accredited tier) | KYC for institutional lenders |
| **Onboard** | Tokeny / ERC-3643 | Compliant security wrapper for institutional capital |
| **Onboard** | FIDC wrapper | Brazilian retail securitization vehicle (Retail-FIDC vaults) |
| **Allocate** | 4 Vaulx vaults | Pick risk: Inst-USDC, Inst-BRL, Retail-FIDC-USDC, Retail-FIDC-BRL |
| **Deposit** | Direct USDC/BRZ | Native depositors |
| **Deposit** | Kamino Off-Chain Collateral | Institutional lenders on Kamino route to Vaulx originations |
| **Deposit** | Plume Nest | TradFi capital tokenized via Plume → Vaulx vaults |
| **Deposit** | SCD balance sheet | Phase 0 originator capital |
| **Earn** | LTV oracle | Live LTV via Chrono24 + RedStone |
| **Earn** | 11% APY USDC, ~14% BRL | Yield from blended book |
| **Recoveries** | Privileged auction first-look | Platform lenders get 72h window on defaulted assets |
| **Distribute** | Loopscale, Jupiter | TRDC tradeable on secondary venues — composability = liquidity exit |

---

## Color coding (one color = one role)

| Color | Category | Partners |
|---|---|---|
| Blue | Identity | Civic, gov.br, Tokeny/ERC-3643 |
| Purple | Wallet UX | Crossmint, LazorKit |
| Orange | Asset data / Oracle | Chrono24, WatchCharts, RedStone, Pyth |
| Red | Off-chain custody / Legal | Brinks, Prosegur, Loomis, Gitel, SCD, FIDC |
| Green | Stablecoin / On-chain core | USDC, BRZ, cNFT Bubblegum, Anchor program |
| Yellow | Off-ramp / Spend | Privy, Quartz, Solflare, lobster |
| Grey | Liquidity / Distribution | Kamino OCC, Plume Nest, Loopscale, Jupiter |

The spine bar = **black with white text**. It's the only thing that's ours. Everything else plugs in.

---

## Visual treatment notes

- **Spine bar dominates** — ~15% of slide height, fully black, `require!(...)` line in monospace font. This single element is the entire pitch in one glance.
- **Logo hierarchy** — hero partners larger (Civic, Crossmint, Kamino, Plume, Brinks). Supporting partners smaller. Uniform sizes kill comprehension.
- **Single arrow per swimlane** — thin grey, 6 dots showing flow direction. No overlapping arrows.
- **No legend** — color groupings should be self-evident. Legends mean the diagram failed.
- **Bottom-right corner caption** — *"One audited program. Four vaults. Global jurisdiction-pluggable."*

---

## Why two swimlanes is strategically stronger than one

1. **Tells the right story to VCs.** Two-sided marketplace = network-effect business. Lending app = single-product play.
2. **Explains why Vaulx's equity capital never funds the loan book.** Both swimlanes have third-party rails feeding them — that's *why* Vaulx is a platform, not a balance-sheet lender.
3. **Makes the integrations feel earned.** Kamino + Plume on the supply side reads as "we plugged into Solana's institutional liquidity." On the default side, they look like vendor logos.
4. **Mirrors how Felipe's network actually segments.** Borrower acquisition = SP reseller channel. Supply acquisition = US VC + institutional crypto. Two distinct GTM motions, one diagram.

---

## Spine line (the one sentence that does the work)

> **VAULX CORE — 1 audited Anchor program · 4 vaults · `require!(custody_confirmed ∧ terms_accepted)`**

Code reuse + product breadth + moat invariant — all in one strip.

---

## Next deliverables (to be produced from this spec)

- (a) **SVG slide** — deck-ready, drops into Keynote/PPTX
- (b) **Interactive HTML artifact** — hover-to-explain on every partner, lives on the landing page
- (c) **PPTX** — editable in PowerPoint/Keynote
- (d) **Excalidraw / Figma spec** — exact coordinates + colors for a designer
