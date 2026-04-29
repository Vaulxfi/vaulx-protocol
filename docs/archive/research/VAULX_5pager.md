# Vaulx — Five-Page Brief
**For: Team, Advisors, Investors · April 22, 2026 · Owner: George (CEO)**

*This is the compressed operating truth. Source of record: Canonical Spec v3. Where this brief and the spec conflict, the spec governs.*

---

## 1. What Vaulx is

Vaulx is a Solana-native lending protocol connecting global capital with asset-rich, credit-excluded borrowers in high-interest-rate economies — using physical luxury assets (watches first; jewelry, art, vehicles later) as on-chain-enforced collateral. The defining technical claim: **no loan disburses until physical custody is confirmed on-chain**, enforced in Anchor account constraints the Solana runtime cannot bypass. This is the 18–24-month replication gap every competitor would need to close. First deployment: São Paulo, luxury watches, Q3 2026.

## 2. Why now — four aligned tailwinds

1. **Solana compressed NFTs** (Metaplex Bubblegum) made custody-proof tokens sub-cent cost + 400ms finality. Economically impossible at scale before 2025.
2. **Local-currency stablecoin maturity** — BRZ live on Solana, BRLV raised $13.5M from Paradigm, B3 announced native BRL for 2026.
3. **Brazilian regulatory clarity** — CNJ Provision 196/2025 codified extrajudicial recovery of movable fiduciary assets; Lei 14.905/2024 eliminated usury cap for financial-institution lending.
4. **TradFi RWA convergence** — Goldman, BNY, UBS, Citi live on tokenized products; BCG projects $9.4T tokenized assets by 2030.

Competitors sit at the "tokenize invoices and real estate" layer. The physical-movable-collateral layer is open.

## 3. How it works (the custody gate)

Borrower → licensed custody partner (Brinks / Prosegur / Loomis São Paulo vault) → triangular appraisal (remote expert + in-person specialist + Chrono24/WatchCharts market anchor) → TRDC (Token Representing Credit Rights) minted on Solana as a compressed NFT with the custody hash → BACEN-licensed SCD partner signs the CCB (credit instrument with fiduciary alienation) → custodian signs `confirm_custody` on-chain → **Vault Program releases stablecoin only after the custody bit flips**.

On default (under DL 911/69 + Lei 14.711/2023 + CNJ Prov. 196/2025): extrajudicial recovery, privileged auction window to platform lenders first, open market second. Target recovery 90% at 50% LTV.

**Four vaults at launch, same code, different PDA seeds:** Institutional-USDC, Institutional-BRL, Retail-FIDC-USDC, Retail-FIDC-BRL. One audit applies to all four. **Vaulx's equity capital never funds the loan book** — institutional depositors, SCD balance sheet at Phase 0, and a retail FIDC wrapper fund origination.

---

## 4. The economics — honest framing

**Fundamentals:**
- **Book-average target: R$37,000 loan** against R$74,000 asset value at 50% LTV. R$25K is the eligibility floor only — contribution-negative at Phase 0 entry custody. Channel-curated book average via Felipe's merchant network (Rolex Daytona / AP Royal Oak / Patek Nautilus / IWC / Panerai).
- **Borrower rate:** 2.2%/month (26.4% APR) blended base, vs. Brazilian formal-sector 40%+ average lending rate.
- **Lender rate:** 11% APY USDC vaults, competitive with Maple / Centrifuge at a superior collateral profile.
- **Partner share:** 20% of gross platform spread to SCD counterparty.

**Per-cycle gross contribution at R$37K base ticket:**

| Regime | Cycle 1 | Cycle 2 (renewal) |
|---|---:|---:|
| Phase 0 entry (custody 0.5%/mo × asset value) | **+R$329** | **+R$73** |
| Phase 1 scale (custody 0.3%/mo at 500+ assets SLA) | +R$920 | +R$665 |

**Customer Lifetime Value** (geometric cycle-events = 1/(1−renewal rate), minus CAC):

| | 52% renewal (realistic) | 62% renewal (retention UX) |
|---|---:|---:|
| Phase 0 entry · R$450 CAC | **−R$43** (thin negative) | −R$3 (break-even) |
| Phase 0 entry · R$270 CAC (Felipe network) | +R$137 | +R$177 |
| Phase 1 scale · R$450 CAC | **+R$1,190** | +R$1,555 |
| Phase 1 scale · R$270 CAC | +R$1,370 | +R$1,735 |

**Renewal rate benchmark:** Bristol University 2020 study of 85,000 UK pawn loans reports 25% rollover baseline. Adjusted upward for luxury-asset profile + Brazilian low-default culture → **52% realistic Phase 0**, 62% with retention UX. (Prior "60% base" cited NPA's 85% redemption rate — category error; redemption ends the revenue cycle, renewal extends it.)

**Thesis in one line:** Business is thin at Phase 0 entry, robust at Phase 1 scale. Year 1 is a lever-validation cohort investment, not a volume race.

**Three compounding levers:**
1. **Ticket calibration** (biggest) — R$37K base vs. R$25K floor via channel curation. Every +R$5K of ticket adds ~R$100/cycle gross contribution.
2. **Custody scale** (second) — 0.5% → 0.3%/month at 500+ assets SLA. Frees ~R$600/cycle at R$37K ticket. This is the Phase 0 → Phase 1 economic inflection.
3. **Retention UX** (third) — 52% → 62% renewal via Day-60 intent capture + Day-90 early-renewal incentive (10% origination-fee concession) + tiered loyalty pricing (Cycle 1/2/3+ at 2.2%/2.1%/2.0%/mo) + referral program (R$200–300 fee credit, referral CAC ~R$220).

**Y1 operating result, Base Case 1,200 originations:** loss of **R$1.6M–R$1.8M (~$273K–$299K USD)** across CAC scenarios (R$450 Felipe-concentrated vs. R$580 realistic mixed-channel). G&A dominates at R$1.34M flat (5 founders at R$18K/mo + legal + insurance + infra). **Break-even horizon: Y3 under lever-improved assumptions, Y4–Y5 under conservative.** Not Y3 as a point estimate.

**Revenue stack:** origination fee 2.5–3% · net platform margin 4–6% · late fees · default processing fee · privileged-auction commission. Five independent streams.

---

## 5. The team (the structural argument)

Five founders, five non-overlapping axes. The team is the execution moat on top of the custody-gate architecture.

| Founder | Role | Why they matter |
|---|---|---|
| **George Dimitrov** | CEO · Vienna | 15 years EU banking (UniCredit / Erste / RBI corridor). LTV calibration + default waterfall structuring as trained skills, not weekend output. EU investor + regulatory channel. |
| **Marcelo Coelho** | COO · São Paulo | CEO of Gitel (38-year electronic-security integrator; 60+ corporate clients including Gerdau, ArcelorMittal, CSN, ADM, SICOOB). BR institutional-bank relationships. Federal Police compliance posture. CFTV/IoT overlay on partner vaults as distinctive audit layer. |
| **Rodrigo Coelho** | Head of Ops BR · São Paulo | Second operator inside Gitel. Institutional redundancy on BR execution. Explicit named cap-table share — deliberate signal of independent role, not bundled with Marcelo. |
| **Felipe** | Strategic Advisor & Co-Founder · US | CEO of crypto-rails company processing material São Paulo luxury-watch transaction flow. US VC network (Solana + BRL-stablecoin backers). SP watch-reseller network = privileged auction counterparties + acquisition channel. Advisor title externally; co-founder equity + governance internally (his preference). |
| **Edson** | Lead Developer · BR | Anchor / Bubblegum / PDA. Owns on-chain programs + integration backend. Borrower/lender dApp frontend owned by George + Marcelo in parallel. |

**Acknowledged gaps:** BR fintech legal counsel (engaged as professional service — not structural), BR growth marketer (Y2 hire). Neither blocks Phase 0.

---

## 6. Roadmap + gates

| Phase | Milestone | Trigger |
|---|---|---|
| 0 — Hackathon MVP | Colosseum submission | May 10, 2026 |
| 1 — Pre-seed | $500K–$1M SAFE close, audit, SCD LOI, BR entity | Colosseum exit |
| 2 — Mainnet Beta | 20–50 CCBs São Paulo, Phase 0 eligibility enforced | Pre-seed close + 4–6 months |
| 3 — BR Validation | 400+ CCBs, NPS >80, renewal ≥62%, default <5% | Phase 0 → Phase 1 gates cleared |
| 4 — Seed + LatAm | $1.5M–$3M seed, Rio, first LatAm market | BR validation complete |
| 5 — US entry | FL / NY state pawnbroker licensing | Q4 2027+ |
| 6 — Securitization | Book tokenized as institutional fixed-income | 100+ active loans |

**Phase 0 → Phase 1 go/no-go gates — no exceptions:**
1. Renewal rate first cohort **≥55%**
2. Blended CAC first 30 originations **≤R$500**
3. Default rate first cohort **≤7%**
4. SCD partnership operational **≥30 consecutive days** without incident

Fail → hold and iterate on the failed lever. Two+ gates miss → Phase 1 ramp does not begin. This discipline is the thing most early-stage lending businesses skip and most often regret.

---

## 7. The Ask

**Pre-seed: $500K–$1M SAFE · $8M–$12M indicative cap** (final at term-sheet). **Target midpoint: $750K.** Colosseum $250K treated as anchor inside this range, not additive.

**Full-time commitment at pre-seed close:** George, Marcelo, Rodrigo, Edson. Felipe continues as Strategic Advisor.

**Use of funds (indicative midpoint $750K):**
- **Setup capital** — audit, legal entity, SCD partnership negotiation, custody + appraiser onboarding, brand + dApp, KYC integration: ~$286K
- **Y1 runway** — team + ongoing opex through first-cohort validation: ~$280K–$370K
- **Strategic reserve** — contingency + opportunistic: $50K–$150K

**Seed trajectory:** $1.5M–$3M in Q4 2026 / Q1 2027, **triggered by four concrete validation milestones, not runway pressure**: (a) 400+ CCBs originated, (b) ≥62% renewal rate, (c) ≤5% default rate, (d) second SP custody partner or Rio launch scoped.

**What Vaulx's equity capital never funds: the loan book.** Partner SCD + institutional depositors + retail FIDC wrapper fund origination. This is what makes Vaulx a platform rather than a capital-intensive lender — and what preserves the equity valuation logic that pre-seed and seed investors require.

---

## 8. The three risks that keep us up at night

1. **SCD partnership fails to close before mainnet** (Low-Med × Critical). Single-point-of-failure on the legal side — without a licensed counterparty, there is no CCB and therefore no product. Mitigation: 2 candidates in parallel active dialog now, target signed LOI within 6 weeks of pre-seed close, SEP-license Stage 2 fallback documented. *Owner: Marcelo + fintech counsel.*
2. **Renewal rate sits below 55% in Phase 0** (Med × High). Single-point-of-failure on economics — CLV is negative regardless of volume if this misses. Mitigation: §3.7 retention architecture (four coordinated mechanisms), lever-validation program active from Month 1, Position 4 pricing pivot available. *Owner: George + product.*
3. **Edson unavailable or departs** (Med × High). Single-point-of-failure on technical execution until the second Solana developer hires in. Mitigation: second Solana dev hired from seed close, continuous technical documentation through Phase 0, Felipe's Solana ecosystem network as emergency bench. *Owner: George.*

Full 12-risk matrix with named owners and explicit mitigations in Canonical Spec §9.

---

## The one-line thesis

**Every RWA protocol claims custody enforcement; Vaulx enforces it in Anchor account constraints the Solana runtime cannot bypass. The model works at scale; Year 1 earns us to Phase 1 economics through three compounding levers. The team is five non-overlapping axes with an 18-month replication moat built in. We are raising a $750K pre-seed to execute the São Paulo beachhead, close the SCD partnership, and validate the first cohort.**

---

*Questions on the math, the team, or the ask: George Dimitrov · [contact]. Full canonical spec available under NDA at term-sheet stage.*
