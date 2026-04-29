# Vaulx — Phase 1: Source Reconciliation

**Purpose:** Map what the 6 sources agree on, where they conflict, and what decisions you need to make before we lock the canonical spec.
**Date:** Apr 22, 2026
**Timeline:** 19 days to Colosseum (May 11). Phase 1 target close: Apr 28.

---

## Documents reviewed (6 sources)

| # | Doc | Status | Role |
|---|-----|--------|------|
| S1 | `00_GOLDEN-research-VAULX.md` | Authoritative (per George) | Multi-model council + 5 rounds of deep research |
| S2 | `01_vaulx_white_paper_draft.md` | Subject of critique | WP v0.9, flagged as flawed |
| S3 | `02_tasks_per_person.md` | Execution tracker | Apr 21 – May 11 |
| S4 | `03_pitch_deck_script.md` | Derivative | Derived from flawed WP — will need rewrite |
| S5 | `vaulx-business-model-v2.6-EN.pdf` (Marcelo) | Authoritative (per George) | Board deck, V2.6 |
| S6 | `vaulx-spec-v31-en-final.docx` (Marcelo) | Authoritative (per George) | Tech spec V3.1, "Architecture A" |

**Notable:** S5 and S6 use the old brand name "Vaulx" (rebrand to Vaulx is per PRD v1.1 Delta Log). S2, S3, S4 use "Vaulx."

---

## 1. Stable Truth — All Sources Agree

These are locked. No further discussion needed unless you disagree:

1. **Custody-gate is the core invariant.** `disburse_ccb` fails unless `TRDC.status == ACTIVE`, flipped only by signed `confirm_custody` from authorized custodian PDA. This single line of code is the product.
2. **TRDC architecture.** cNFT via Metaplex Bubblegum representing a CCB with fiduciary alienation. Two isolated Anchor programs (Vault + Loan). CPI caller validation mandatory.
3. **Triangular Appraisal V1.2.** Online (R$180–250, 24h) + Offline (R$380–520, 48h) + Market Anchor (Chrono24/WatchCharts, R$0 marginal). R$560–770 per new intake, R$0 on renewal.
4. **Beachhead:** SP + luxury watches. Phase 0 Bootstrap: 1 city, 1 custodian, 1 appraiser, watches only, min ticket R$12K, 20–50 CCBs target.
5. **LTV framework:** 50–60% watches, 40–55% jewelry, 30–45% art (Phase 1+), 50–65% vehicles (Phase 1+).
6. **TradFi's flaw:** Appraises only on metal weight, producing 13–30% effective LTV on real market value — the structural inefficiency Vaulx exploits.
7. **Legal instruments:** CCB with fiduciary alienation (Lei 10.931/2004 + DL 911/69 + Lei 14.711/2023 + CNJ Provision 196/2025 for extrajudicial recovery).
8. **Team:** George CEO, Marcelo COO (Gitel custody), Rodrigo Ops BR, Felipe Strategic Advisor (US), Edson Lead Dev.
9. **Break-even:** ~800 active CCBs/year at R$20K avg ticket with 60% renewal. ~1,200 without.
10. **Expansion model:** LatAm asset-light (R$10–45K activation/country), zero incremental fixed cost. Order: CO, MX, PA, PE, CL (2026–27). US entry 2027+ (FL+NY licenses).
11. **Renewal is the profitability lever.** Cycle 2+ margin materially higher (no new appraisal). Cycle 1 is loss-adjacent.
12. **Solana-native rationale:** cNFT Bubblegum = sub-cent custody proof, 400ms finality, multi-token vaults with same code (mint parameter only).

---

## 2. CRITICAL CONFLICTS — Decisions You Need to Make

These are the conflicts that block the canonical spec. I've ranked them by how load-bearing they are.

---

### 🔴 CONFLICT #1 — Fundamental Business Model: Platform vs. Lender Rail

This is the single biggest conflict in the material. Everything downstream depends on how you resolve it.

**Marcelo's Tech Spec V3.1 (S6) — "Architecture A":**
> "In V3, the vault receives institutional capital from the SCD (which holds a BACEN license). Vaulx does not handle the end depositor's money. LPs become shareholders of the FIDC/securitization vehicle — they do not deposit into the vault directly. The vault is the SCD's operational liquidity buffer."

**WP v0.9 (S2):** Aligns with Marcelo. "Vault holds stablecoin liquidity supplied by the partner SCD."

**GOLDEN research (S1) — all 3 models + your own clarification:**
> "Vaulx is a platform, defi platform connecting borrowers and lenders. lenders can be anyone anywhere in the world... we are not looking to raise money from investors to run the book, the VC money should go on developing the platform."

All 3 council models converged: Vaulx is a P2P marketplace; retail lenders deposit directly into vaults; VC money only funds the platform.

**Decision needed — pick one:**

| Option | Description | Regulatory fit | UX | Recommend? |
|--------|-------------|---------------|----|------------|
| **A — Pure P2P** | Lender → Vault direct, under SEP license | Requires own SEP (R$1M cap, 6–12mo BACEN process) OR SEP partner | Permissionless-feeling | ❌ Too slow for MVP |
| **B — SCD rail (Marcelo)** | SCD funds vault; retail accesses only via FIDC quotas, separate flow | Clean under Arch A | Retail sees FIDC UX, not "deposit to vault" | ❌ Loses P2P positioning |
| **C — Hybrid: FIDC-pooled** | Retail deposits on-chain → FIDC aggregates as single institutional depositor → FIDC deposits into vault | Clean (FIDC = CVM Res 175 + FIDC-tokenizado live in BR) | Feels P2P to user; compliance handled in background | ✅ **Recommended** |

**Why C:** It keeps Marcelo's technical architecture intact (vault still receives from a regulated institutional depositor), delivers the marketplace UX you want (user clicks "deposit", reads T&Cs, gets FIDC quota token in wallet), and is legally sound (GOLDEN's FIDC deep-dive confirmed this is live infrastructure — Vortx, Oliveira Trust, Singulare already offer FIDC-as-a-service). The CVM reversed on Mercado Bitcoin's tokenized FIDC quotas in March 2025 — precedent is established.

**The compromise this requires:** KYC is mandatory. Zero threshold. Lei 14.478/2022 + FATF Travel Rule. Civic Pass + Blockpass solve the friction (0–3 min for crypto-natives who already KYC'd at Binance/Coinbase/MB) but you cannot offer anonymous deposits. Your own response in GOLDEN accepted this.

---

### 🔴 CONFLICT #2 — Interest Rate Architecture

**Marcelo / WP v0.9:** Borrower APR 18–24%, protocol net spread 8–12% p.a.
**GOLDEN:** Mercado Bitcoin CEO (to Marcelo, per you) criticized 18–24% as too high. All 3 council models converged on borrower 1.8–2.2%/mo (23–30% APR), platform **net** spread 4–6%, lender APY 10–12%.
**Research benchmarks (GOLDEN):** TradFi 2.19–2.97%/mo (29–42% APR), UK pawn 2–4%/mo, US luxury lenders 2–4%/mo. Vaulx at 1.8–2.2%/mo is **competitive globally**, not just locally.

**Reality check — GOLDEN's per-loan P&L at R$20K ticket, 2%/mo borrower, 11% lender APY, R$40K asset (50% LTV):**

| Line | R$ |
|------|-----|
| Origination fee (2.5%) | +500 |
| Gross interest (120 days) | +1,333 |
| Less: lender return | −726 |
| **Gross platform spread** | **+607** |
| **Total protocol revenue Cycle 1** | **+1,107** |
| Custody + insurance (120d) | −1,129 |
| Partner license cut (20% of spread) | −121 |
| cNFT + gas | −5 |
| **Cycle 1 contribution** | **−148 (negative)** |
| **Cycle 2+ contribution (no appraisal)** | −114 (still negative) |

**The math forces a decision:**

| Option | Fix | Tradeoff |
|--------|-----|----------|
| **A** | Raise minimum ticket to R$25–30K | Narrows borrower pool but lowers custody-as-% dramatically |
| **B** | Raise lender yield floor to 8–9% APY (not 11%) | Risks losing yield-seeker appeal vs Maple/Centrifuge (8–12%) |
| **C** | Raise borrower APR to 2.5–3%/mo | Still cheaper than UK/US, matches TradFi, gives more room — but contradicts Mercado Bitcoin feedback |
| **D** | Negotiate custody below 0.3%/mo at volume with Brinks/Prosegur | Requires signed volume agreement — possible but not at MVP |

**My recommendation:** **A + D together.** Launch with R$25K minimum ticket. Position publicly as "superior LTV, not cheaper rate" (this is what the research confirms borrowers actually value). Run with 4–6% platform margin, 10–12% lender APY, 60%+ renewal. Negotiate custody rate down as volume materializes. Own the loss-leader Cycle 1 dynamic explicitly in investor materials — don't hide it.

---

### 🔴 CONFLICT #3 — Capital Ask

**Marcelo / WP v0.9 (S2, Section 6.4):** $500K–$1M pre-seed, $1.5M–$3M seed. Seed includes "$500K–$1M SCD operational capital" (loan book).
**GOLDEN (consensus):** "Zero balance sheet risk. Protocol is pure infrastructure." VC funds platform/legal/team only. Colosseum $250K + $300–500K SAFE pre-seed. Seed $1.5M–$2M (no loan book line).
**GOLDEN / Sonar grounding:** Challenges the lean framing. Realistic pre-seed is $1M–$1.5M once you honestly cost custody rollout (Brinks/Prosegur setup fees + insurance riders), team runway at SP market rates, legal (120K+ for SCD/SEP structuring), audit ($50K tier-1).

**Decision needed:**

| Option | Colosseum | Pre-seed SAFE | Seed | Position |
|--------|-----------|---------------|------|----------|
| A (lean) | $250K | $300–500K | $1.5–2M | Aggressive, but Sonar is right it's underfunded |
| **B (honest)** | **$250K** | **$750K–$1.2M** | **$1.5–2M** | **Recommended — honest costing** |
| C (Marcelo original) | N/A | $500K–$1M | $1.5–3M (w/ book) | Rejected: contradicts P2P vision |

**My recommendation:** B. Lean founder compensation (R$15K/mo, not R$37K — Gemini's correction) + honest legal/audit/custody costs. "Greedy" was your correct instinct on Marcelo's original framing; undersized is also a problem. Sonar's grounding is right.

---

### 🔴 CONFLICT #4 — Regulatory Vehicle

**Marcelo (S6):** "Architecture A" = SCD partner as formal creditor. Future: FIDC for LP integration.
**WP v0.9 (S2 §8.1):** "SCD is the legal vehicle."
**GOLDEN (Gemini + Sonar):** SCD cannot intermediate P2P funds — BACEN Res 4.656/2018 defines SCD as lending *only its own capital*. For P2P/LP pooling you need **SEP** (CMN Res 5.050/2022) OR securitize via **FIDC** (CVM Res 175).

**Decision needed — regulatory ladder:**

| Phase | Path 1 (Marcelo) | Path 2 (GOLDEN P2P) | **Path 3 (Recommended — hybrid ladder)** |
|-------|------------------|--------------------|------------------------------------------|
| Phase 0 (MVP → mainnet) | Partner with SCD | Partner with SEP | **Partner with BACEN-authorized pawn operator** (Fidix-class), 1–3 mo setup, 70/30 rev share |
| Phase 1 (BR validation) | Own SCD license | Own SEP license | **Own SEP** (6–12mo BACEN process, R$1M cap) — correct for P2P |
| Phase 2 (retail P2P scale) | FIDC | FIDC | **FIDC-tokenizado** (Vortx/Oliveira Trust/Singulare as admin) — pools retail on-chain deposits into single institutional flow to vault |

**Why Path 3:** Matches the Conflict #1 resolution (Option C). Fastest path to first live loan (pawn-partner BaaS = 1–3 months). Eventual own SEP = P2P compliance. FIDC layer = retail on-chain UX at scale. All three stages are legally sound per GOLDEN's research.

**Load-bearing risk flag:** Legal opinion is still pending in all sources. This is the single biggest binary risk carrying forward. The Apr 25 lawyer engagement in `02_tasks_per_person.md` is non-negotiable.

---

### 🟡 CONFLICT #5 — TradFi Monopoly Date

**WP v0.9:** "Monopoly since 1969"
**GOLDEN + Marcelo:** 1934 is correct. DL 759/1969 created TradFi as a state-owned enterprise; pawn exclusivity predates it (1934). PL 4.188/2022 passed Câmara to end exclusivity; CDE rejected PLC 230 in Oct 2025. Status is legally contested.

**Fix:** "Historically dominant public operator in penhor since 1934, exclusivity contested in recent years."

---

### 🟡 CONFLICT #6 — TradFi Portfolio & Market Data

**WP v0.9:** "R$2.04B (2021)" — stale by 5 years
**GOLDEN research:** R$17B (2024), tracking R$18B+ (2025). TradFi moved ~1.6M loans/year. **TradFi raised LTV to 100% in Dec 2024 to defend market share** — they are not passive incumbents.

**Fix:** Update all market-size figures. Add competitive-response paragraph: TradFi is defending, not sleeping. Removes the "sleeping giant" framing.

---

### 🟡 CONFLICT #7 — US Market Sizing

**WP/Marcelo:** "$8.6B → $45.6B by 2030"
**GOLDEN:** Global pawn $39–42B (2024), $49–56B by 2030. US alone ~$39–42B now. The $45.6B figure conflates definitions.

**Fix:** Use sourced global figures. Keep US entry late 2027+.

---

### 🟡 CONFLICT #8 — Year 1 P&L Inversion

**Marcelo / WP v0.9:** Conservative −R$530K, Base −R$580K, Optimistic −R$590K. Optimistic is *worse* than Conservative — unexplained.
**GOLDEN:** This is the Cycle 1 loss-leader math playing out — more originations = more Cycle 1 losses. Either rebuild around cohort math OR explicitly state the dynamic to investors.

**Fix:** Rebuild Section 5 around cohort mechanics. Separate 4 denominators: unique borrowers / originations / renewal events / total cycle-events. State explicitly: "Year 1 losses scale with volume because Cycle 1 is a deliberate loss-leader."

---

### 🟡 CONFLICT #9 — Default Auction Mechanism

**Marcelo / WP v0.9:** Defaulted assets sold via "Brazilian luxury auction houses" (external).
**GOLDEN (Felipe's meeting contribution):** Private auction — existing lenders + Felipe's top-20 BR watch reseller network get privileged first-offer window. External auction is fallback only.

**Why this matters:** Lender acquisition. This is the "yield + optionality" hook that differentiates Vaulx from Maple/Centrifuge. Absent in WP.

**Fix:** Add Section 3.6 explicit mechanism. Make it a featured lender benefit.

---

### 🟡 CONFLICT #10 — Monthly Repayment vs Bullet

**WP v0.9:** Implies bullet repayment at 120 days.
**Felipe (meeting, via GOLDEN):** Monthly interest payments — catches defaults in 1–3 months, not at end of term.

**Fix:** Add monthly interest repayment structure to product spec.

---

### 🟡 CONFLICT #11 — KYC Positioning

**Current docs:** Implicit, framed as SCD responsibility.
**GOLDEN:** KYC is non-negotiable (Lei 14.478/2022, zero threshold). But friction is solved: Civic Pass (Solana-native, 2M+ verifications, non-transferable pass integrated into Anchor constraints) + Blockpass (ZKP mode, FATF-compliant) deliver 0 seconds for existing-pass users, 30–60 sec for cross-platform credentials, 3–5 min for fresh users. Same UX as Aave Arc / Maple / Centrifuge.

**Fix:** Add explicit KYC architecture section. Position as a *feature* (regulatory clarity = yield credibility), not a wart.

---

## 3. Gaps — Present in GOLDEN, Absent from WP

These must be added to the canonical spec:

1. **Lender-side value proposition** — WP is 90% borrower-focused. Dedicated section required.
2. **Sensitivity analysis** — renewal rate 40/50/60/70%, CAC tolerance, spread sensitivity 4–8%.
3. **FX policy** — currency-matched vaults, explicit lender-bears-FX-risk stance.
4. **Utilization curve** — Aave-style dynamic yield based on pool utilization.
5. **Late fee schedule** — Klarna-style escalation (notice → penalty → notice → penalty → liquidation).
6. **KYC architecture** — Civic Pass + Blockpass integration roadmap.
7. **FIDC-tokenizado bridge** — retail on-chain → FIDC quota → vault (the Conflict #1 resolution made concrete).
8. **Provenance policy** — gray-market luxury watch inventory is common in BR; need acceptance standards.
9. **Mercado Bitcoin integration** — CEO feedback on 6% spread is not structurally reflected.
10. **Cohort unit economics** — separate denominators (originations vs renewals vs unique borrowers vs cycle-events).

---

## 4. Factual Fixes Needed (Fast)

| Item | Current in WP/Marcelo | Corrected |
|------|----------------------|-----------|
| TradFi monopoly date | 1969 | 1934 (contested since 2022) |
| TradFi portfolio | R$2.04B (2021) | R$17B (2024), R$18B+ (2025) |
| TradFi LTV position | 85% advertised | Raised to 100% Dec 2024 |
| "First in the world" | Absolute | "To our knowledge, among the first..." |
| US pawn market | $8.6B → $45.6B | $39–42B now, $49–56B by 2030 globally |
| Colosseum ask | $30K + $2.5M pool | $250K pre-seed to accelerator winners |
| SEP R$15K cap | Oversimplified | "No creditor can lend >R$15K to same debtor in same SEP" |
| Interest spread target | 8–12% | 4–6% net platform margin |

---

## 5. The Two Decisions That Unlock Everything

Lock these two and the canonical spec writes itself:

### DECISION A — Business model: P2P marketplace or SCD rail?
**My recommendation:** **Option C (Hybrid FIDC-pooled).** Retail on-chain → FIDC tokenizado → Vault. Keeps Marcelo's Architecture A technically; delivers GOLDEN's marketplace positioning commercially; is legally sound per current BR regulations.

### DECISION B — Cycle 1 profitability: hide it or own it?
**My recommendation:** **Own it.** Cycle 1 is a loss-leader by design. Raise min ticket to R$25K. Run with 4–6% platform margin, 10–12% lender APY, 60%+ renewal target. Don't let investors discover this in diligence — state it upfront as a cohort math feature, not a bug.

### Knock-on consequences of A + B

If you confirm A+B, here is what flows automatically:

- **Regulatory path:** Pawn-partner BaaS (Ph0) → own SEP (Ph1) → FIDC-tokenizado (Ph2)
- **Capital ask:** Colosseum $250K + $750K–$1.2M pre-seed SAFE + $1.5M–$2M seed (no loan book line)
- **Revenue model:** Origination (2.5–3%, absorbs appraisal) + net platform margin 4–6% + late fees + default processing fee + auction commission (Phase 2)
- **Hackathon demo scope:** Two lenders deposit → TRDC mint pending custody → custody confirmation → disburse → monthly interest flow → repay / (default branch via Squads multisig) → failing `disburse_without_custody` test
- **Pitch narrative:** TradFi's R$17B broken-LTV monopoly + global lender yield arbitrage + custody-gated on-chain enforcement + the only team that can run it

---

## 6. Phase 1 Open Questions for George

Before we write the canonical spec (Phase 1 close Apr 28), I need your calls on:

1. **DECISION A** — confirm Option C (hybrid FIDC-pooled)?
2. **DECISION B** — confirm R$25K min ticket + 4–6% margin + Cycle 1 loss-leader framing?
3. **Regulatory Path 3 ladder** — confirm pawn-partner BaaS as Phase 0?
4. **Capital ask Option B** — confirm $250K Colosseum + $750K–$1.2M pre-seed?
5. **Hackathon scope** — confirm 6-moment demo (per GOLDEN §7.2) as MVP target, not the 8-moment expanded version?
6. **Brand** — Vaulx confirmed (PRD v1.1 Delta). All Marcelo docs to be rebranded in the canonical spec?
7. **Pitch rewrite scope** — `03_pitch_deck_script.md` currently reflects the flawed 18–24% APR / SCD-funded model. Confirm full rewrite after canonical spec locks?

---

**Next step once you respond:** I write the **Vaulx Canonical Spec v1** (10–15 pages), then derive the MVP demo scope and the hackathon pitch from it.
