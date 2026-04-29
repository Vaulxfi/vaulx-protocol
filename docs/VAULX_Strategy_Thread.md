# Vaulx — Strategy Thread (Hackathon Direction + MB Dinner)

*Conversation log between George Dimitrov and Claude (Colosseum Copilot + Superpowers).*
*Working session output — saved for team reference.*

---

## Session 1 — Setup + Deep-Dive Vetting

### George
Install and activate the Colosseum Copilot. PAT token + env vars provided. Then run a deep-dive validation on Vaulx — global framing, not Brazil-only.

> Vaulx — a Solana-native, globally-deployable RWA lending protocol where borrowers post physical luxury assets (watches first; jewelry, art, vehicles later) into licensed custodian vaults, and an Anchor program will not release stablecoin loans until on-chain `confirm_custody` flips. Compressed-NFT TRDC carries the custody hash. Default flow uses jurisdiction-specific extrajudicial recovery + privileged-auction waterfall to platform lenders. Four vaults at launch (Institutional-USDC, Institutional-BRL, Retail-FIDC-USDC, Retail-FIDC-BRL), one audited program. First launch São Paulo Q3 2026, but architecture is jurisdiction-pluggable and intended to expand into other high-rate / asset-rich economies (LATAM, MENA, SE Asia). Borrower 26% APR vs 40%+ formal sector; lender 11% APY USDC. Five-founder team mixing EU banking, BR institutional security ops (Gitel), BR luxury-watch reseller network, and Solana/Anchor dev.

### Claude — Deep-dive findings (summary)

- **Custody-gated physical-RWA lending is genuine whitespace on Solana.** No shipped competitor in the corpus. Real Mint was a hackathon concept that never shipped.
- **Closest race-condition competitor:** Credible Finance (selected for Colosseum's C4 Accelerator). Same playbook shape — RWA-collateral lending on Solana — but for **real estate in India / Gulf**. Different asset class, different geography. They are weeks ahead, not months.
- **Solana lending category is saturated** (86 products / 71 distinct roots in The Grid) — but **physical-luxury-collateral is empty**.
- **Civic Pass + Solana Token Extensions transfer-hook** is production-ready (`civicteam/token-extensions-transfer-hook`).
- **Kamino's Off-Chain Collateral** launches Q1 2026 with Chainlink + Anchorage Digital. Framing line: *"Kamino built it for institutional BTC; we built it for retail watches."*
- **Plume Nest** is live on Solana with WisdomTree, Hamilton Lane, Securitize; partnered with Squads Lab; plugs into Loopscale + Jupiter.
- **Solana RWA market** grew $200M → $873M in 2025.

**Verdict:** the idea is investable, the moat is real, and the timing is right — but **product alone is no longer enough**. The winning shape at Frontier is **custody-gate + ecosystem composability + signed off-chain partners + post-submission momentum**.

---

## Session 2 — Strategy Pivot: Simple Demo vs. Maximalist Vision

### George
> The team wants to do it simple: I have a Rolex, I need cash, I deposit at a licensed vault, get appraisal and loan in USDC. I came up with all the app and integration ideas — does it make sense? Are we stronger with the maximalist version, or with a clean idea + warm off-chain partnership discussions?

### Claude — first answer (later reversed)
*"The team is right about the demo. The integrations are right about the narrative. They are not opposites — they are different layers."*

Recommended a middle path: simple demo + Civic only on-chain + signed off-chain LOIs + named ecosystem partners in the deck.

### George — pushback
> Edson has 15 days and Claude Code — he can do most of the integrations. Felipe's warm partnership convos = points gained even if not fully wired. We need a clear e2e vision. Why each integration matters. What gap each fills.

### Claude — reversal + maximalist version

**You were right. I gave you the wrong advice. Here is the corrected direction:**

#### The problem
- Similar ideas already exist (Real Mint dormant, **Credible Finance in C4**).
- Product alone is no longer the moat.
- Frontier rewards: distribution > product, ecosystem composability, signed off-chain partners, one polished AHA moment, post-submission momentum.

#### The solution — ecosystem player, not solo builder
**Vaulx becomes the custody-gated lending layer that plugs into:**
- Identity: **Civic + gov.br**
- Wallets: **Crossmint + LazorKit**
- Off-ramps: **Privy → Pix**
- Liquidity: **Kamino, Plume**
- Oracles: **RedStone / Pyth + Chrono24 custom feed**

**Custody-gate is the moat. Composability is the distribution. Both, not either.**

#### End-to-end user flow

```
1. User opens vaulx.app — never used crypto before
2. KYC in 60 seconds              → Civic + gov.br (BR digital ID)
3. Embedded wallet auto-created   → Crossmint (email login) or LazorKit (FaceID)
4. Registers Rolex                → model, ref#, photos
5. Instant approx valuation       → Chrono24 / WatchCharts feed
6. Loan terms preview             → LTV, rate, repayment schedule
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
    • Solflare / lobster card spend
12. Dashboard                     → asset photo + IoT/CFTV vault feed
                                    + loan terms + repayment + live LTV
13. Auto LTV oracle               → Chrono24 prices + RedStone wrapper
14. Liquidation-risk alerts       → 7-day cooling-off grace period
                                    pay down OR add collateral
15. On default:                   → 3-tier auction waterfall
    Tier 1: platform lenders (72h privileged window)
    Tier 2: reseller partners (Felipe's network)
    Tier 3: public auction (Solana + off-chain)
```

#### The integrations — why each matters

| Partner | What it does | Why Vaulx needs it |
|---|---|---|
| **Civic** | KYC + transfer-hook on Token-2022 | 60-sec onboarding, KYC-gated TRDC transfers, compliance baked in |
| **gov.br** | Brazil's official digital ID (170M+ users) | Fastest BR-user onboarding; trust signal for BR regulators |
| **Crossmint** | Embedded smart wallets, email login | Non-crypto-native users get a Solana wallet without knowing it. Squads-secured ($10B TVL) |
| **LazorKit** | Passkey / FaceID wallets (Apple Secure Enclave) | iPhone biometric signing — strongest UX moment on demo |
| **Privy** | Fiat on/off-ramps including **Pix** | "1-click to my bank account" line. Stripe-acquired |
| **Kamino** | Off-Chain Collateral (Q1 2026) | Institutional liquidity — we become a borrower-side originator on their rails |
| **Plume Nest** | Institutional asset issuance on Solana | TradFi capital channel; partners Squads Lab → Loopscale + Jupiter |
| **RedStone / Pyth** | Solana price oracles | LTV monitoring; we wrap Chrono24 into a RedStone-compatible feed |
| **Chrono24 / WatchCharts** | Luxury watch market prices (ChronoPulse 600K+ tx) | Actual price data for our asset class |
| **Solflare Card / lobster.cash** | Spend USDC on Mastercard / Visa | "Borrow against your watch, pay your dinner" demo moment |

#### TODO by founder

**Marcelo + Rodrigo — Off-chain partnerships (highest leverage)**
- 2 BACEN-licensed SCDs in parallel; goal: 1 signed LOI by May 10.
- Brinks SP + Prosegur SP + Loomis SP custody talks; goal: 1 signed MOU.
- Fintech counsel on CCB + fiduciary alienation language.

**Felipe — Solana protocol intros (this week)**
- Warm intros to Civic, Crossmint, LazorKit, Privy, Kamino, Plume.
- Goal A: 2 of those reach working integration with Edson by May 10.
- Goal B: all 6 reach logo + supportive quote permission for the deck.
- Bonus: 50 waitlist names from SP watch-reseller WhatsApp groups.

**Edson — Backend (15 days + Claude Code is enough)**
- Anchor program: 5 instructions with custody-gate invariant `require!(custody_confirmed && terms_accepted)`.
- Civic transfer-hook on TRDC (Token-2022).
- Crossmint + LazorKit wallet flow.
- Privy Pix off-ramp (real if API access lands, mocked if not).
- Kamino integration stub or LOI-level coordination.
- Auction PDA (3-tier waterfall).
- Chrono24 scraper → RedStone-compatible feed → on-chain LTV.
- Frontend dashboard: asset photo + IoT placeholder + LTV gauge + alerts + 7-day grace UI.
- Failed-state demo path polished — 30-second AHA.

**George — Pitch + videos**
- 12-slide deck by May 5.
- 90s pitch video by May 8.
- 2-min demo video by May 9.
- Drive narrative across investor + partner conversations.

**Rodrigo and/or Felipe — X / socials / waitlist**
- @VaulxProtocol live this week. Pinned tweet = custody-gate AHA.
- Landing page + waitlist (Tally, 2 hours).
- 2–3 posts/week tagging Helius, Superteam Brasil, Plume, Kamino, Phantom, Civic, Crossmint.
- Long-form Superteam Brasil post in Portuguese.
- 50 waitlist signups before May 10.

#### Pitch + demo video ideas

**Demo video (2 min) — the proof**
- 0:00–0:15  KYC with gov.br in 60 sec (sped up)
- 0:15–0:30  Embedded wallet auto-created. Register Rolex
- 0:30–0:50  Instant valuation + loan preview. Book vault drop-off
- 0:50–1:10  **THE AHA MOMENT.** Disburse before custody → contract rejects with `CustodyNotConfirmed`. Custodian signs. Contract accepts. USDC flows.
- 1:10–1:30  1-click to Pix. Card spend
- 1:30–2:00  Dashboard: live LTV, IoT vault feed, repayment

**Pitch video (90s) — the story**
- 0:00–0:10  "40% interest. Asset-rich. Credit-poor. 200M people."
- 0:10–0:30  "Vaulx is the Solana protocol where the smart contract refuses to release the loan until a licensed vault has the asset."
- 0:30–0:55  Partners flash: Civic, Crossmint, LazorKit, Kamino, Plume, Brinks, [SCD]. "We didn't rebuild Solana. We composed it."
- 0:55–1:15  Team — five non-overlapping axes, 18-month replication moat.
- 1:15–1:30  "São Paulo Q3 2026. Then LatAm. Then global. Frontier, let's go."

#### The one-line reframe

> **"Vaulx is not a Solana lending app. Vaulx is the custody-gated lending layer that turns Solana's best identity, wallet, off-ramp, liquidity, and oracle protocols into a working credit product for asset-rich, credit-excluded users — starting with São Paulo and a Rolex."**

---

## Session 3 — Mercado Bitcoin Dinner Strategy

### Marcelo
> Tomorrow night Rodrigo and I are having dinner with Daniel, CEO of Mercado Bitcoin. What's the partnership angle? What can we ask for? Concern: would they push us to BNB chain? What strong intros could they give us?

### Claude — strategy brief

#### The most important framing
**MB and Daniel are simultaneously potential partner AND potential competitor.** MB tokenizes Brazilian credit instruments (CCBs, agribusiness receivables, real estate). We tokenize credit instruments too. Different asset class, different chain — but the same neighborhood.

**The conversation must be warm, open, and mindful.** Share enough to interest. Do NOT share what makes us hard to replicate (Anchor custody-gate logic, SCD shortlist names, internal economics).

**Goal of the dinner:** open a relationship, not close a deal.

#### Who MB is
Brazil's largest crypto exchange by historical volume. 2TM Group, SoftBank-backed. Tokenizes credit at scale via **MB Tokens**. Securitization arm **MB Trust / MB Asset Management**. BACEN-licensed entities. Regulatory team that has cleared most of BR fintech path.

**Honest read:** half potential partner, half potential competitor. They have not done physical-movable-collateral. That's the door we walk through.

#### What MB gets from Vaulx
1. New asset class (luxury physical) — distinct from agribusiness/real estate.
2. Solana-ecosystem footprint without building it themselves.
3. First-mover narrative in LatAm physical RWA.
4. White-label optionality ("Vaulx-by-MB" inside their app).
5. Senior, institutional-discipline team.

#### What Vaulx gets from MB — ranked

**Tier 1 — Critical**
1. **SCD / CCB partnership intro.** *Note: Marcelo also has his own SCD pipeline running in parallel; Daniel's intro is additive, not a substitute.*
2. **MB Trust securitization** — wrap Vaulx-originated TRDCs as institutional fixed-income product.

**Tier 2 — High value**
3. Custodian relationships — *secondary*. Marcelo already has Brinks/Prosegur/Loomis through Gitel. Daniel = cross-check.
4. Regulatory tailwind — co-signed legal opinion on CCB-on-Solana.
5. Distribution channel — eventually list Vaulx vault yields inside MB app.

**Tier 3 — Nice-to-haves**
6. Strategic intro to SoftBank LatAm / their VC network.
7. Co-marketing at LatAm crypto events.

#### The chain question — short answer, do not debate
MB historically builds on other chains (mostly EVM). Vaulx stays on Solana for technical reasons (compressed NFTs sub-cent + 400ms finality + Anchor account constraints). Calm one-line answer if Daniel raises it:

> *"Solana is what makes the custody-gate work the way it does. Down the road we are open to (1) bringing the Solana-native protocol to MB's audience as a co-branded product, (2) launching Vaulx on additional chains in future phases. For now the v1 lives on Solana — and that is also where the partnership conversation is easiest to start."*

Then change subject. Do not negotiate the chain at the table.

#### Concrete asks

**Best-case dinner outcome**
- Intro to MB's credit / SCD team lead — follow-up call within 2 weeks.
- Intro to MB Trust securitization team.
- Soft commitment: Daniel introduces us to one tier-1 BR investor or SoftBank LatAm.
- Follow-up scheduled: George + Felipe + Daniel within 14 days.

**Minimum acceptable**
- One named contact at MB.
- Permission to use MB's name in the deck as "in active conversation".
- Daniel agrees to read the Vaulx 5-pager.

#### Signal table

| Signal | Meaning | Response |
|---|---|---|
| "We've thought about luxury collateral" | Already scoping it | "Then partner — don't build it twice" |
| "What chain are you on?" | Chain-gravity test | The calm line above. Do not debate |
| "How much are you raising?" | Investor curiosity | "$750K pre-seed midpoint. Open to strategic check" |
| "Who's on your cap table?" | Validation | Five-founder structure, no outside money yet. Clean |
| "What's your moat?" | The big one | Custody-gate on-chain + 18-month replication gap + five non-overlapping founder axes |
| "Have you talked to BACEN?" | Real partnership intent | "Through fintech counsel. We'd value MB's perspective" |

#### Marcelo's opening line

> *"Daniel, before we get into our pitch — we'd love your read on one thing. We think there's a partnership shape where MB doesn't do what we do, we don't do what MB does, and together we own physical RWA in LatAm. The custody-gate, the luxury asset class, and Solana — that's our lane. Credit tokenization at scale, the institutional desk, BR regulatory weight — that's yours. Does that resonate, or do you see it differently?"*

Then **shut up and listen**.

#### What NOT to do
- Don't ask for money at dinner.
- Don't show the deck. Send 5-pager next morning.
- Don't disclose Anchor custody-gate code-level details.
- Don't commit to anything technical without George's sign-off.
- Don't trash competitors.
- Don't oversell. Pre-mainnet — confident on direction, humble on stage.
- Don't share SCD shortlist names or custodian terms.

#### Mindfulness checklist (because MB is also a competitor)
1. Could Daniel build this himself in 90 days with what I'm about to share? If yes → withhold.
2. Is this in the public 5-pager? If yes → share freely.
3. Relationship-building or technical-disclosure answer? Lean relationship.
4. Naming an unsigned partner? Say "in active conversation", no name.
5. If MB tries to copy us tomorrow, did I just hand them the playbook?

#### Logistics

**Tonight:** Re-read brief. Read §5, §8, §10 twice. Decide who opens / follows up / takes notes.

**During dinner:** Open with §8. Listen 2× more than you talk. Chain → §5 line → move on. Take physical notes.

**Day after:**
- Marcelo sends thank-you + 5-pager to Daniel by 10:00 AM.
- Marcelo + Rodrigo + George + Felipe debrief.
- Book follow-up call within 7 days if contact named.
- George updates partner pipeline tracker — MB enters as **active strategic**.

#### Bottom line
> MB is one of the three most strategic partnership doors that exists for Vaulx in Brazil. Treat tomorrow as the most important relationship-opener of the year — **not as a sales pitch**.
>
> If we walk away with one warm intro to their credit team and a scheduled follow-up with Daniel + George + Felipe, **the dinner was a complete win**. Anything beyond that is bonus.
>
> Be warm. Be mindful. Open the door. We close it later, together.

---

## Artifacts produced in this thread

- `VAULX_MB_Dinner_Brief.pdf` — 4-page printable strategy brief for Marcelo + Rodrigo.
- `VAULX_Strategy_Thread.md` — this file.

## Open follow-ups (offered, not yet executed)
- Half-page printable cheat-sheet (jacket-pocket version of MB brief).
- Next-morning thank-you email + 5-pager cover note for Daniel.
- WhatsApp brief Rodrigo can read in the Uber.
- Slide-by-slide deck outline.
- Partner outreach scripts (SCD, custodian, Civic, Crossmint, LazorKit, Privy, Kamino, Plume).
- Edson's full Anchor program file structure with custody-gate invariant + test scaffold.
- X-account + landing-page launch plan.
