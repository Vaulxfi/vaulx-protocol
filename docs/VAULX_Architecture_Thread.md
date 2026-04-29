# Vaulx — Architecture & Strategy Thread
**Saved: April 27, 2026**

Full conversation thread covering the strategy pivot from "simple borrower demo" to "two-sided composable Solana platform," and the design of the one-slide architecture deliverable.

---

## Context (carried over from prior session)

Prior session covered:
- Installing Colosseum Copilot skill + auth verification (PAT token, env vars)
- Reading `VAULX_5pager.md` — the canonical brief
- Running deep-dive validation against builder history, crypto archives, market signals
- Validating that custody-gated physical-RWA lending is genuine whitespace on Solana
- Identifying Credible Finance (Colosseum C4 Accelerator) as primary race-condition competitor — different asset class (real estate India/Gulf) but same playbook shape
- Confirming Solana lending category saturation (86 products / 71 distinct roots) but physical-luxury-collateral empty
- Producing initial team-facing 1-pager with task assignments per founder
- Producing WhatsApp-pasteable team onboarding brief

This thread picks up from a user question about whether to scope down or scale up the hackathon vision.

---

## User Q1: simplify or stay big?

> the team wanted to do it simple: i have a rolex, i need cash, i go deposit it to licensed vault, i get appraisal and loan in usdc. i came up with all the app and integration ideas - does it make sense? is this the way to proceed for hackathon? do we look stronger like this or are we stronger if we just state the idea and warm discussions on offchain partnerships?

### Assistant response — "the team is right about the demo. you are right about the narrative"

Honest answer: **the team is right about the demo. You are right about the narrative.** They are not opposites — they are different layers.

**The trap to avoid:** trying to wire Civic + Crossmint + LazorKit + Kamino + Plume in 14 days = logo soup demo. Judges see through it instantly. Half-working integrations look worse than no integrations.

**The shape that wins Frontier:**

- **Demo (what runs on stage):** the team's simple version. Rolex → licensed vault → appraisal → USDC loan, with the custody-gate refusing to disburse until the vault signs. One screen. 30 seconds. The AHA moment is the contract **rejecting** the disburse call before custody, then accepting it after.
- **Deck (what you say around the demo):** the bigger picture. "We're live with [SCD name] + [Brinks SP]. Civic transfer-hook integrated for KYC. Kamino Off-Chain Collateral and Plume Nest are the institutional liquidity path post-hackathon."
- **Off-chain partnerships (the credibility):** signed LOIs from a BACEN-licensed SCD and one licensed custodian. **This is the single biggest signal to judges** — it's the part competitors can't copy in a weekend.

**Why this is stronger than either extreme:**

- "Just the idea + warm talks" = looks like a pitch, not a product. Frontier explicitly weights working demos.
- "Full integration stack" = looks like vapor. 5 half-wired protocols = 0 working ones.
- Simple demo + 1 real on-chain integration (Civic, because TRDC needs KYC anyway) + signed off-chain LOIs + named ecosystem partners in the deck = grounded 10x case + ambitious 100x case.

| Layer | Hackathon scope | Post-hackathon |
|---|---|---|
| Demo | Rolex → vault → USDC, custody-gate live on devnet | Same flow, mainnet |
| On-chain integrations | Civic only (transfer-hook on TRDC) | Crossmint, LazorKit, Kamino, Plume |
| Off-chain partnerships | 1 SCD LOI + 1 custodian LOI (real paper) | Full SCD contract + 2nd custodian |
| Deck mentions | All the above as named partners + roadmap | — |

**Answer:** middle path — the team's simple demo + signed off-chain LOIs + Civic as the one real integration + everyone else named as partners in the deck.

---

## User Q2: pushback — Edson + Claude Code can do more in 15 days

> i am confused now. Edson has still 15 days to build and with claude code he can do any of the above integrations. same goes for the app and the web UI - isnt it? Felipe&all team - any discussion we manage to kick off before the hackathon submission - these are gained points, and we should at least try to kick off kamino, crossmint, lazor, privy, plume etc discussion - probably it needs to be explained short but clear to the team why these partners are valuable to be integrated and what they do and bring for vaulx. i am not saying we do all integrations now and all poorly. but we make a clear vision e2e. hey, Vaulx is an app where user (even non crypto native = new users onto solana) can register, KYC in 60sec with civic and or gov digital id, register his rolex, get instant approx valuation and loan terms, drop watch at licensed vault, in 48h get full expert eval and confirmed loan, if accepted = loan disbursed (2 conditions must exist = custody_confirmed + eval+loan terms accepted), loan on user wallet, 1 click instant send to crypto wallet, pix account, spend on card etc...

### Assistant response — reversed prior advice, produced full team-facing direction document

> You're right, and I gave you the wrong advice. Edson + Claude Code in 15 days can wire 4-5 integrations to demo-quality. A warm partnership convo Felipe kicks off this week = a logo on the deck + a quote = real Frontier points. The maximalist vision is the right one.

# Vaulx — The Direction (Team Brief)

## 1. The Problem We Actually Face

Three findings from deep research:

- **Similar ideas already exist.** Real Mint (dormant), Goldfinch, Centrifuge (off-Solana), and **Credible Finance — selected for Colosseum's C4 Accelerator** doing RWA-collateral lending on Solana for real estate in India/Gulf. Different asset class, same playbook shape.
- **Product alone is no longer the moat.** Custody-gate is necessary but not sufficient.
- **What Frontier judges now reward:** distribution > product, ecosystem composability, signed off-chain partners, one polished AHA moment, post-submission momentum.

## 2. The Solution: Ecosystem Player, Not Solo Builder

We do not rebuild what already works on Solana. We integrate, compose, distribute.

Vaulx becomes the **custody-gated lending layer** that plugs into:
- Identity: Civic + gov.br
- Wallet: Crossmint + LazorKit
- Off-ramp: Privy → Pix
- Liquidity: Kamino, Plume
- Oracle: RedStone/Pyth + Chrono24 custom feed

**Custody-gate is the moat. Composability is the distribution. Both, not either.**

## 3. Why This Direction Wins

| Reason | What it gets us |
|---|---|
| Frontier judging criteria | Composability + working demo + named partners = top-decile score |
| VC investability | "Plugged into Solana ecosystem" is the phrase pre-seed VCs underwrite |
| Network effect | Every integration = a partner ecosystem we inherit users from |
| Credibility | Big-name logos shortcut 6 months of "are these guys real?" |
| Speed of build | Edson + Claude Code does in days what would take a team a quarter |
| Defensive moat | When Credible Finance pivots toward us, they face our integrations as a wall |

## 4. End-to-End User Flow

```
1. User opens vaulx.app — never used crypto before
2. KYC in 60 seconds              → Civic + gov.br
3. Embedded wallet auto-created   → Crossmint or LazorKit
4. Registers Rolex                → model, ref#, photos
5. Instant approx valuation       → Chrono24/WatchCharts feed
6. Loan terms preview             → LTV, rate, repayment
7. Books vault drop-off           → Brinks / Prosegur / Loomis SP
8. Watch deposited                → in-person expert eval ≤48h
9. Final terms confirmed          → user accepts in-app
10. Smart contract checks TWO conditions:
    ✓ custody_confirmed (custodian signed)
    ✓ terms_accepted (user signed)
    → only then disburse USDC
11. USDC lands in wallet          → 1-click to:
    • another Solana wallet
    • Pix account (Privy off-ramp)
    • Solflare/lobster card spend
12. Dashboard                     → asset photo + IoT/CFTV vault feed
                                    + loan terms + repayment + live LTV
13. Auto LTV oracle               → Chrono24 prices + RedStone wrapper
14. Liquidation-risk alerts       → 7-day cooling-off grace period
15. On default:                   → 3-tier auction waterfall
    Tier 1: platform lenders (72h privileged window)
    Tier 2: reseller partners (Felipe's network)
    Tier 3: public auction (Solana + off-chain)
```

## 5. The Integrations — Why Each One Matters

| Partner | What it does | Why Vaulx needs it |
|---|---|---|
| **Civic** | KYC + Token-2022 transfer-hook | 60-sec onboarding, KYC-gated TRDC transfers |
| **gov.br** | BR official digital ID (170M users) | Fastest BR onboarding + regulatory trust signal |
| **Crossmint** | Embedded smart wallets, email login | Non-crypto users get Solana wallet without knowing it. Squads-secured ($10B TVL) |
| **LazorKit** | Passkey/FaceID wallets (Apple Secure Enclave) | iPhone biometric signing — strongest UX moment |
| **Privy** | Fiat on/off-ramps incl. Pix (Stripe-acquired) | 1-click to bank account |
| **Kamino** | Off-Chain Collateral (Q1 2026, Chainlink + Anchorage) | Institutional liquidity routing — Kamino lenders fund Vaulx |
| **Plume Nest** | Institutional asset issuance on Solana | TradFi capital channel; partners with Squads Lab → Loopscale + Jupiter |
| **RedStone / Pyth** | Solana price oracles | LTV monitoring; wrap Chrono24 data |
| **Chrono24 / WatchCharts** | Luxury watch market prices | Actual price data for our asset class |
| **Solflare Card / lobster.cash** | Spend USDC on Mastercard/Visa | "Borrow against watch, pay your dinner" |

## 6. TODO — By Founder

### Marcelo + Rodrigo — Off-chain partnerships
- 2 BACEN-licensed SCDs in parallel. Goal: 1 signed LOI by May 10.
- Brinks SP + Prosegur + Loomis. Goal: 1 signed MOU by May 10 incl. CFTV/IoT overlay rights.
- Fintech counsel engaged on CCB + fiduciary alienation.

### Felipe — Solana protocol introductions
- Warm intros: Civic, Crossmint, LazorKit, Privy, Kamino, Plume.
- Goal A: 2 of those reach working integration by May 10.
- Goal B: all 6 reach logo + supportive quote permission for the deck.
- Bonus: 50 waitlist names from SP watch-reseller WhatsApp groups.

### Edson — Backend (with Claude Code, 15 days is enough)
- Anchor program: 5 instructions with custody-gate invariant `require!(custody_confirmed && terms_accepted)`
- Civic transfer-hook on TRDC (Token-2022)
- Crossmint + LazorKit wallet flow on borrower frontend
- Privy Pix off-ramp stub
- Kamino Off-Chain Collateral integration stub or LOI-level coordination
- Auction PDA (3-tier waterfall)
- Price oracle: Chrono24 scraper → RedStone-compatible feed
- Frontend dashboard: asset photo + IoT feed placeholder + LTV gauge + liquidation alert + 7-day grace UI
- **Failed-state demo path** ruthlessly polished

### George — Pitch + videos
- 12-slide deck by May 5
- 90s pitch video by May 8
- 2-min demo video by May 9

### Rodrigo and/or Felipe — X / socials / waitlist
- @VaulxProtocol live this week
- Landing site + waitlist (Tally, 2 hours)
- 2-3 posts/week tagging Helius, Superteam Brasil, Plume, Kamino, Phantom, Civic, Crossmint
- Long-form Superteam Brasil post (Portuguese)
- 50 waitlist signups before May 10

## 7. Pitch + Demo Video Ideas

### Demo video (2 min)
- 0:00–0:15 — KYC with gov.br in 60 sec (sped up)
- 0:15–0:30 — Embedded wallet + register Rolex
- 0:30–0:50 — Instant valuation + loan preview + book drop-off
- 0:50–1:10 — **THE AHA MOMENT.** Borrower hits "Disburse" before custody → contract rejects with `CustodyNotConfirmed`. Custodian signs. Contract accepts. USDC flows.
- 1:10–1:30 — 1-click to Pix. Card spend.
- 1:30–2:00 — Dashboard with live LTV + IoT feed.

### Pitch video (90s)
- 0:00–0:10 — "40% interest. Asset-rich. Credit-poor. 200M people."
- 0:10–0:30 — "Vaulx is the Solana protocol where the smart contract refuses to release the loan until a licensed vault has the asset."
- 0:30–0:55 — Partners flash: Civic, Crossmint, LazorKit, Kamino, Plume, Brinks, [SCD]. "We didn't rebuild Solana. We composed it."
- 0:55–1:15 — Team — five non-overlapping axes, 18-month replication moat.
- 1:15–1:30 — "São Paulo Q3 2026. Then LatAm. Then global. Frontier, let's go."

### One-Line Reframe

> **"Vaulx is not a Solana lending app. Vaulx is the custody-gated lending layer that turns Solana's best identity, wallet, off-ramp, liquidity, and oracle protocols into a working credit product for asset-rich, credit-excluded users — starting with São Paulo and a Rolex."**

---

## User Q3: how to represent architecture in 1 slide

> how do i represent this architecture in 1 slide, visually clear? platform flow, the platform concept, the plugins/integrations for each step and why they are needed/wanted? Civic, Crossmint, LazorKit, Kamino, Plume, Brinks/loomis/prosegur, SCDs, privy, quartz offramp, Tokeny / ERC-3643, cnFT bubblegum, etc?

### Assistant response — initial single-swimlane proposal

Recommended a **horizontal swimlane**: User journey runs left→right across 6 steps. Custody-gate Anchor program sits as a spine bar above. Partners stack below each step. One-line "why" caption per cluster.

Initial 6 columns: ONBOARD → REGISTER → CUSTODY → DISBURSE → MANAGE → REPAY/DEFAULT

Provided ASCII preview, color coding (Blue=Identity, Purple=Wallet, Orange=Oracle, Red=Custody, Green=On-chain, Yellow=Off-ramp, Grey=Liquidity), per-column content copy-paste-ready, visual treatment tips.

**Mistake:** placed Kamino + Plume in the DEFAULT column.

---

## User Q4: correction — Kamino and Plume are supply-side, not default

> i don't understand why kamino and plume sit on default side of the flow. in theory, they are liquidity providers? as a platform, to be successful we need to grow both sides: demand(borrowers) and supply (liquidity providers: retail via FIDC + institutional) isn't it?

### Assistant response — corrected to two-swimlane architecture

> You're right — I placed them wrong. Kamino and Plume are supply-side liquidity rails, not default-side actors. The slide needs to show two swimlanes converging on the Anchor core, because Vaulx is a two-sided marketplace and that framing is itself a stronger pitch.

### Corrected layout (ASCII)

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

### Per-step partner map (corrected)

**DEMAND side — borrower-facing:**

| Step | Partners |
|---|---|
| Onboard | Civic, gov.br, Crossmint, LazorKit |
| Register | Chrono24, WatchCharts, RedStone, Pyth |
| Custody | Brinks, Prosegur, Loomis, Gitel IoT, SCD/CCB |
| Disburse | USDC/BRZ, TRDC=cNFT (Bubblegum), Anchor gate |
| Manage | Privy, Quartz, Solflare Card, lobster.cash |
| Repay/Default | Auction PDA, 3-tier waterfall, Extrajudicial recovery |

**SUPPLY side — lender-facing:**

| Step | Partners |
|---|---|
| Onboard | Civic accredited, Tokeny/ERC-3643, FIDC wrapper, B2B onboarding |
| Allocate | 4 vaults (Inst-USDC, Inst-BRL, Retail-FIDC-USDC, Retail-FIDC-BRL) |
| Deposit | Kamino OCC, Plume Nest, SCD balance sheet, Direct USDC/BRZ |
| Earn | 11% APY USDC, ~14% APY BRL, LTV live oracle, risk transparency |
| Recoveries | Privileged 72h, Platform first-look, Reseller curation, Public auction |
| Distribute | Loopscale, Jupiter, TRDC secondary, Composable cNFT |

### Why two swimlanes is strategically stronger

1. **Tells the right story to VCs.** Two-sided marketplace = network-effect business. Lending app = single-product play.
2. **Explains why Vaulx's equity capital never funds the loan book.** Both swimlanes have third-party rails feeding them — that's why Vaulx is a platform, not a balance-sheet lender.
3. **Makes the integrations feel earned.** Kamino + Plume on supply side reads as "we plugged into Solana's institutional liquidity." On default side, they look like vendor logos.
4. **Mirrors how Felipe's network actually segments.** Borrower acquisition = SP reseller channel. Supply acquisition = US VC + institutional crypto. Two distinct GTM motions, one diagram.

### Spine line

> **VAULX CORE — 1 audited Anchor program · 4 vaults · `require!(custody_confirmed ∧ terms_accepted)`**

---

## User Q5: write to file first

> write this to a file first.

### Assistant response

Wrote `/Users/gogy/MyCODE/VAULX/VAULX_Architecture_Slide.md` containing the two-swimlane framing, ASCII layout, full per-step partner tables, color coding map, visual treatment notes, strategic argument for two swimlanes, spine line, and next-deliverable options.

---

## User Q6: build them

> ok do them

### Assistant response — produced both deliverables

**File 1: `/Users/gogy/MyCODE/VAULX/VAULX_Architecture_Slide.svg`** (16 KB)

Deck-ready 1920×1080 SVG. Two swimlanes converging on a black spine bar containing the `require!(custody_confirmed ∧ terms_accepted)` invariant in monospace. Color-coded step boxes by category. Drops directly into Keynote/PPTX.

**File 2: `/Users/gogy/MyCODE/VAULX/VAULX_Architecture_Interactive.html`** (29 KB)

Same layout as the SVG but interactive. Every partner has a hover tooltip with:
- What it is (1 line)
- Why Vaulx needs it (1 line)
- Integration status (Target / Phase 0 / Phase 1 / Live / Build now)

Responsive: collapses to 3 cols < 1500px, 1 col mobile. Print-friendly.

### To preview

```
open /Users/gogy/MyCODE/VAULX/VAULX_Architecture_Interactive.html
open /Users/gogy/MyCODE/VAULX/VAULX_Architecture_Slide.svg
```

---

## Files produced this thread

| File | Size | Purpose |
|---|---|---|
| `VAULX_Architecture_Slide.md` | 8.8 KB | Source-of-truth spec for the layout |
| `VAULX_Architecture_Slide.svg` | 16 KB | Deck-ready 1920×1080 slide |
| `VAULX_Architecture_Interactive.html` | 29 KB | Hover-to-explain interactive version |
| `VAULX_Architecture_Thread.md` | this file | Full conversation thread |

---

## Open next-step options

- (a) Generate PPTX version of the slide
- (b) Pull architecture into existing `vaulx-team-walkthrough-v2.html` as a new section
- (c) Build printable A4/A3 PDF for partner meetings
- (d) Draft partner outreach scripts (one each for SCD, custodian, Civic, Crossmint, LazorKit, Privy, Kamino, Plume)
- (e) Write 12-slide pitch deck content slide-by-slide
- (f) Sketch Anchor program file structure with custody-gate invariant + test scaffold
- (g) Build X-account + landing-page launch plan

---

## Key strategic decisions captured in this thread

1. **Maximalist vision wins, not minimalist demo.** Edson + Claude Code in 15 days can wire 4-5 integrations to demo-quality. Warm partnership conversations Felipe kicks off this week = real Frontier points, not vapor.

2. **Custody-gate is the moat. Composability is the distribution. Both, not either.**

3. **Two-sided marketplace framing >> lending app framing.** Same code, different valuation logic. VCs underwrite network-effect businesses.

4. **Vaulx's equity capital never funds the loan book.** SCD + institutional depositors + retail FIDC wrapper fund origination. This is the platform/lender distinction that pre-seed valuation logic requires.

5. **The race window is now.** Credible Finance is in Colosseum's C4 Accelerator with the same playbook shape (different asset class). Speed matters.

6. **The single-line thesis:** "Vaulx is not a Solana lending app. Vaulx is the custody-gated lending layer that turns Solana's best identity, wallet, off-ramp, liquidity, and oracle protocols into a working credit product for asset-rich, credit-excluded users — starting with São Paulo and a Rolex."
