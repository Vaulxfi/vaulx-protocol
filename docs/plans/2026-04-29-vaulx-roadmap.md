# Vaulx — Roadmap (post-hackathon)

**Date:** 2026-04-29
**Audience:** team · partnerships · investors · future hires
**Purpose:** Single forward-looking timeline. Aggregates everything tagged 🔜 P1 (Phase 1) or ⏳ P2+ (Phase 2+) across our docs. Sequences them. Names dependencies. Lives next to the canon, the unified design, and the journey doc.

**Conflict rule:** if any timeline detail conflicts with another doc, **canon wins on architecture**, **PARTNERSHIPS.md wins on partner-specific actions**, **this doc wins on phase / sequencing / dependencies**. Promote a Phase 2 item to Phase 1 only after the dependency it was blocked on is resolved.

---

## How to read this

| Phase | When | Definition |
|---|---|---|
| **γ (HACK)** | by May 10 hackathon submission | Unified architecture build per [`unified-architecture-design.md`](2026-04-29-vaulx-unified-architecture-design.md). Out of scope for this doc. |
| **Phase 1** | 1–3 months post-hackathon | Everything required to enable the **first real Brazilian borrower** on mainnet. Critical-path partnerships + engineering hardening + product polish for production-grade ops. |
| **Phase 2** | 3–6 months post-hackathon | Productionization breadth: retail liquidity (FIDC), card/Pix rails, secondary partnerships. The vault matures from "first borrower" to "first 100 borrowers." |
| **Phase 3+** | 6–12+ months | Geographic expansion (LatAm: AR, MX) + speculative / defensive tracks (quantum readiness, agentic borrowing, asset-class breadth). |

**Sources we pull from:**

- [`composable-blocks.md`](../architecture/2026-04-29-vaulx-composable-blocks.md) §3 status column · §6 critical review · §7 open product calls
- [`PARTNERSHIPS.md`](../PARTNERSHIPS.md) — partner-specific tactical actions
- [`unified-architecture-design.md`](2026-04-29-vaulx-unified-architecture-design.md) §6 phase plan · §10 risks
- [`user-journeys-current-vs-ideal.md`](2026-04-29-vaulx-user-journeys-current-vs-ideal.md) §0.3 non-negotiables · §7 open questions

---

## Phase 1 — first Brazilian borrower (1–3 months)

The Phase-1 success metric is exactly one thing: **a real Brazilian borrower receives a real loan against a real watch, signed on a real CCB by a real SCD partner, custodied in a real vault, with real LP capital, on mainnet.** Everything below is in service of that.

### 1.1 Critical-path partnerships (the 5 that gate mainnet)

These are the same 5 from canon §1 — repeated here for sequencing visibility.

| # | Block | What we need closed | ETA | Dependency | Status today |
|---|---|---|---|---|---|
| 1 | **SCD partner** (M5) | Signed agreement with a regulated BR sociedade de crédito direto. Mercado Bitcoin SCD is the lead candidate (Daniel · ~3% all-in). Felipe pursuing alternative warm path in parallel. | 2–4 months | none | 🟠 SHORTLIST |
| 2 | **Custodian** (C14) | Signed agreement with insured BR vault provider. Brinks · Prosegur · Lumis · Securo are the four candidates. Marcelo + Rodrigo opening in parallel. | 1–2 months | none | 🟠 SHORTLIST |
| 3 | **Appraiser network** (C11 + C12) | 5–10 online specialists hired (24h SLA) + 2–3 offline watchmakers stationed near custodian (48h SLA). Two distinct pools — no overlap. | ~1 month | C14 (offline pool placement depends on chosen vault location) | 🔴 TODO |
| 4 | **Digital signature** (M8) | ICP-Brasil-accredited e-sig provider integrated with SCD's CCB issuance flow. Clicksign · D4Sign · DocuSign-BR are candidates. | 2–4 weeks after #1 | M5 (SCD chooses signer) | 🔴 TODO |
| 5 | **On/off rails** (S12) | Crossmint production tier active for BR + ramp validation complete. | 1–2 months | none | 🟡 PARTIAL (sandbox live) |

**Reading the dependency graph:** #1 (SCD) gates #4 (digital signature). #2 (Custodian) gates #3 (offline appraiser pool placement). #5 (rails) is independent. **Critical path = SCD → digital signature.**

### 1.2 Engineering hardening (post-γ)

| Item | Why | Source |
|---|---|---|
| Squads multisig migration of remaining admin ixs | Day-to-day admin actions (KYC mints, config writes, oracle admin, set_kyc_required) move from operator-key signing to Squads PDA. **`execute_af_default` migrates in γ** as proof-of-pattern; the rest follows. | unified design §H · canon S1 |
| `multisig-monitor` self-hosted | Watches our Squads multisig, emits notifications when proposals are created/voted/executed. Wires into vaulx-site `OnchainEvent` table. | unified design §H · canon S1 |
| Sumsub production tier | Sandbox approval → production. Requires real KYC volumes + Sumsub legal review. | canon S7 · M5 dependency |
| Crossmint production tier (BR ramp validation) | Real BR fiat ramp. Validates Crossmint covers Pix at our volumes. | canon S12 |
| AML / PEP / sanctions monitoring (S9) | **Required by SCD** before they sign. Continuous Sumsub product (not a one-shot at onboarding). | canon §6.2 #4 · M5 dependency |
| 7-day auction window | Replace the 60s demo timer with prod-grade 7-day window + bidder whitelist enforcement | canon C2 |
| Real custodian webhook integration | Custodian's inventory system POSTs HMAC-signed events to `/api/onchain-events/custody-confirmed`. Per-custodian signing-key whitelist. Replaces the operator-key-signed admin-button shortcut. | unified design §G · canon §2.5 sequence note |
| ICP-Brasil signature integration | CCB legally binding via API. Provider follows from #1 SCD selection. | canon M8 |
| CCB document generation pipeline | PDF generation tied to SCD's preferred CCB template; signed reference stored in DB + on-chain attestation hash. | journey doc §2.7 · canon M6 |
| Solana bridge production hardening | Operator key rotation procedure · rate limits · monitoring · circuit breakers. Documented runbook. | unified design §10 |

### 1.3 Product / UX

| Item | Why | Source |
|---|---|---|
| Day-60 renewal nudge UI + scheduled cron | Renewal is the highest-margin path (no acquisition cost, no new physical handling). Day-60 nudge captures intent early. | journey doc §2.2 |
| Tiered loyalty rates | Cycle 1 = 2.2%/mo · Cycle 3+ = 2.0%/mo. Encodes repeat-borrower value. | journey doc §2.2 |
| Borrower notification preferences page | Email + WhatsApp opt-in; default SMS off. | canon S13 |
| Risk Officer scaling model | Auth model in `/admin/evaluations/*` already supports multi-officer. Phase 1 = formalize role definitions + add 1-2 backup officers. Global policy + per-market operators. | canon §6.1 #2 |
| Re-eval-on-decline policy | If borrower declines final terms, can they re-request without re-appraising? Design doc + product call. | canon §7 #3 |

### 1.4 Institutional capital — Kamino V2 track

The institutional liquidity rail. Three distinct uses of Kamino, all in Phase 1.

| Use | What | Why | Dependency |
|---|---|---|---|
| **Capital rail** | Kamino V2 = curator marketplace; Re7 Labs + MEV Capital are the actual capital relationships closed *through* Kamino V2's curator vaults. We share Vault + Loan IDLs with Kamino BD; warm intros to Re7 + MEV. | Institutional LPs don't go to vaulx.fi directly — they deposit into curator vaults that hold Vaulx CCB-backed yield as part of a portfolio. | First Brazilian borrower must close · public on-chain track record |
| **Float yield** | 10–15% liquidity reserve parked in Kamino USDC vaults (5.1–6.5% APY per Kamino docs as of 2026). Earns passive yield on idle disbursement-ready capital. | Modest but free — adds ~R$40-80K/year at Y1 TVL. Scales linearly. | Kamino USDC vault choice + ops hardening |
| **Recognition as collateral primitive** | Vaulx exposure recognized by Kamino curators. Curators can underwrite Vaulx CCB-backed yield in their own portfolio risk models. | Establishes Vaulx as a yield primitive in Solana DeFi rather than a standalone product. | Months of track record |

**Dependency: SCD + custodian + first borrower must close first.** Kamino BD won't close without a real track record to underwrite. This track is sequenced AFTER critical-path #1–#5.

### 1.5 Bootstrap liquidity (parallel to Kamino track)

| Item | Why | Source |
|---|---|---|
| F&F + Web3 funds bootstrap | First-money path while regulation closes. Pre-FIDC. Per-meeting consensus this is the fastest path to first borrower. | canon M11 · §7 #8 |
| Founders / Advisor wallet allocations | Initial vault deposits from founders + early advisors as "skin in the game" liquidity. | PARTNERSHIPS.md decision log |

---

## Phase 2 — productionization breadth (3–6 months)

The vault matures from "first borrower" to "first 100 borrowers." Retail-side rails come online; the partnership network deepens.

### 2.1 Retail liquidity wrapper — FIDC

The single largest legal project on the roadmap. 3–6 month timeline because it requires CVM-registered fund vehicle.

| Item | What | Source |
|---|---|---|
| FIDC fund admin onboarded (M7) | Vórtx · Oliveira Trust candidates. Admin entity that issues quota tokens to retail LPs. | canon M7 |
| FIDC quota token | Tokenized FIDC quota that retail LPs hold. Compliant retail-LP exposure to Vaulx CCB-backed yields. | canon M10 |
| Tax reporting (S11) | IR for BR FIDC yields. Tax accountant + reporting platform. Surfaces only after FIDC is live. | canon S11 |

### 2.2 Partnerships breadth

| Item | Why | Source |
|---|---|---|
| Whitelisted reseller network (~20 BR luxury resellers) | Primary auction bidders. Comp = exclusivity in default auctions for that brand/category. Felipe lead. | canon C15 · §7 #5, #9 |
| Fallback luxury auction houses | Sotheby's-BR · Christie's-BR or peer agreement for unsold default lots. Not blocking; runs in parallel. | canon C16 |
| BR legal recovery counsel retained (C17) | BR firm with DL 911/69 experience. Casa Solana SP for warm intros (Marcelo). 2–4 weeks once first default is realistic. | canon C17 |
| Mercado Bitcoin + Transfero anchor lender deals | P1 capital relationships (named in 2026-04-27 decision log) | PARTNERSHIPS.md |
| TBD crypto-native credit facility | Round out the P1 anchor-lender set | PARTNERSHIPS.md |

### 2.3 Product breadth

| Item | What | Source |
|---|---|---|
| Vaulx Card BIN sponsor | "Spend USDC like cash" card flow. Replaces the demo-only `/funds/card` shell. | canon S12 (extends) |
| Asset authenticity DB (C8) | Brand serial-number checks (Rolex, Patek, …) — automated cross-reference. Replaces manual cross-check. | canon C8 |
| i18n shell (S6) | Multi-language UI. EN + ES first. | canon S6 |
| Legal entity / incorporation finalized (S10) | BVI ($24k, fast) vs Hong Kong (stronger banking, slower). | canon S10 · §7 #7 |
| Plume Nest integration | Later-stage institutional rail (moved to P2 per 2026-04-27 decision log) | PARTNERSHIPS.md |
| Dispute / appeal path | Bounded appeal triggers a second offline appraisal at borrower cost. Design when first contested case lands in production. | canon §6.2 #6 |

---

## Phase 3+ — expansion + speculation (6–12+ months)

### 3.1 LatAm geographic expansion

Per canon's adapter manifest (Appendix A → Appendix B template), each new geography is an adapter file, not a rewrite.

| Country | Trigger | Adapter readiness | Dependencies |
|---|---|---|---|
| **Argentina** | first BR borrower closes; ARG legal scoping begins | template ready (canon Appendix B) | AFIP integration (S8) · ARG SCD equivalent (M5) · ARG custodian |
| **Mexico** | parallel to AR or after | template ready | CURP integration · SOFOM equivalent · MX custodian |
| **EU / US** | only after LatAm proves pattern | template needs additions (eIDAS for EU, ICP-Brasil-equivalents) | jurisdiction-by-jurisdiction legal review |

### 3.2 Speculative / defensive tracks

| Item | Trigger | Source |
|---|---|---|
| Quantum readiness migration | Solana Foundation announces Falcon migration roadmap. PDAs already quantum-resistant; user wallets migrate when Solana migrates. WinterWallet (Blueshift) optional bridge for high-value accounts in interim. | external · Solana Foundation roadmap |
| Asset class expansion | Jewelry · art · vehicles per whitepaper · luxury bags. Each new class needs: appraiser pool · custodian compatibility · authenticity DB · price oracle. | whitepaper Module 3 |
| Agentic borrowing (OKX APP) | Regulatory clarity on agent-mediated credit; Vaulx-internal experiments | external · OKX Agent Payments Protocol |
| Apify Chrono24 production upgrade | If fallback HTML scraper breaks down at volume | PARTNERSHIPS.md |

---

## Cross-cutting open product calls

These don't fit a single phase — they need decisions early but their outcome shapes multiple phases. Owned at founder level.

(Exact list in [canon §7](../architecture/2026-04-29-vaulx-composable-blocks.md#7-open-product-calls). Summary mirror here for visibility.)

| # | Decision | Owner | Why phase-spanning |
|---|---|---|---|
| 1 | Vault simplification 4 → 2 (USDC + Local) | George | Phase γ build sizing |
| 2 | SCD architecture: API-only vs portal fallback | George + Marcelo | Phase 1 SCD integration shape |
| 5 | Retailer comp model: exclusivity in default auctions vs commission per loan | Felipe | Phase 2 reseller network design |
| 7 | Incorporation: BVI vs HK vs both | George + Marcelo | Phase 2 entity selection |
| 8 | Bootstrap sequencing: F&F-funded loans before FIDC vs wait for FIDC | George + Marcelo | Phase 1 vs Phase 2 ordering |
| 10 | Authorized retailer access: Rolex retailers admit external appraisers + act as collection points? | George (verify) | Phase 1 appraiser hire + collection-point design |

---

## Cadence — when this doc gets reviewed

- **Weekly** during Phase 1 (until first borrower closes): roadmap items + critical-path partnerships reviewed in team sync. Status table in §1.1 updated.
- **Monthly** Phase 2 onwards: full roadmap review · phase promotions decided here.
- **Quarterly** Phase 3+: strategic direction review; expansion-country priorities; speculative-track investment.

Each review produces a one-line update in the **Document changelog** at the bottom of this doc.

---

## What this doc is NOT

- **Not a build plan.** Engineering implementation lives in unified-architecture-design + the implementation plan (writing-plans output).
- **Not a partnership tracker.** Per-partner action items live in [`PARTNERSHIPS.md`](../PARTNERSHIPS.md). This doc references them with timeline + sequencing.
- **Not the architecture canon.** Architecture lives in [`composable-blocks.md`](../architecture/2026-04-29-vaulx-composable-blocks.md). This doc references blocks by ID (S1, M5, C14, etc.).
- **Not investor-facing.** Investor messaging is its own artifact. This is the team's internal sequencing tool.

---

## Document changelog

- **2026-04-29 (initial):** roadmap created · Phase 1/2/3 split · Kamino V2 track formalized · cross-references to canon, PARTNERSHIPS.md, unified design, journey doc.

**End.** Update this doc whenever a Phase 1 item promotes to "in flight" or completes. Update this doc whenever a Phase 2 → Phase 1 promotion happens (with the dependency-resolved justification). Keep it alive.
