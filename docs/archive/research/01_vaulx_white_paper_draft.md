# Vaulx — White Paper (Draft v0.9)

**The first Solana protocol that lends against physical luxury assets held in real-world custody.**

Protocol version: V3.1 (TRDC / Partner SCD / Triangular Appraisal V1.2)
Document version: 0.9 Draft — April 21, 2026
For: Colosseum Frontier Hackathon submission · Investor circulation · Internal alignment
Team: George (CEO) · Marcelo (COO) · Rodrigo (Head of Ops BR) · Felipe (Strategic Advisor, US) · Edson (Lead Developer)

---

## Document map

| # | Section | For judges | For investors | For operators |
|---|---------|------------|---------------|---------------|
| 0 | Executive Summary | Essential | Essential | Essential |
| 1 | The Problem | Essential | Essential | Context |
| 2 | Why Now | Essential | Essential | — |
| 3 | The Product | Essential | Context | Essential |
| 4 | The Team | Essential | Essential | — |
| 5 | Business Model & Moat | Context | Essential | Context |
| 6 | Roadmap & The Ask | Essential | Essential | Essential |
| 7 | Risk Matrix | Essential | Essential | Essential |
| 8 | Appendix: Legal, BRL Stablecoin, Token Strategy | Context | Essential | Essential |

---

## 0. Executive Summary

Vaulx is a Solana protocol that turns physical luxury assets — watches, jewelry, art, vehicles — into on-chain collateral for stablecoin loans, with custody handled by a regulated real-world partner. The protocol's core guarantee is that **no loan disburses until physical custody is confirmed on-chain**. That single rule is enforced in smart contract logic and is the feature that separates Vaulx from every "RWA lending" protocol shipped to date.

**What it does.** An owner of a high-value physical asset (minimum ticket ~R$12,000) can obtain a stablecoin loan in 24–72 hours after custody intake, at 18–24% APR, for 50–60% LTV. When they repay, the asset is returned. If they default, the partner SCD executes fiduciary alienation under Brazilian law (DL 911/69 + Lei 14.711/2023) and the proceeds make lenders whole.

**Who it's for.** Brazil's ~40 million adults with valuable assets but no formal credit access — the "asset-rich, cash-poor" population shut out of bank credit and overcharged by informal lenders at 40–150% APR. Initial beachhead: São Paulo luxury watch owners.

**How revenue works.** Three streams: origination fee (2–3%), interest spread (8–12% p.a. net to protocol), and liquidation fee (5%, only on defaults). Break-even at ~800 active CCBs/year with 60% renewal. 1-year customer lifetime value: R$2,865 per active borrower.

**Architecture.** Two isolated Anchor/Rust programs (Vault + Loan) on Solana. TRDC — a Token Representing Credit Rights, implemented as a compressed NFT via Metaplex Bubblegum — records the on-chain state of each CCB (Cédula de Crédito Bancário) with fiduciary alienation. The partner SCD (Sociedade de Crédito Direto) is the formal lender under BACEN license; Vaulx provides the rails.

**Stage.** MVP on Devnet, full technical spec V3.1 locked. Colosseum Frontier Hackathon submission scheduled for May 10, 2026.

**The Ask.** Colosseum accelerator acceptance ($30K cash prize + path into the $2.5M accelerator investment pool) as the validation event. Separately, a $500K–$2M pre-seed/seed round to fund smart contract audit, SCD partnership formalization, the first custodian network in SP, and 12 months of runway to reach 400+ CCBs in Brazil.

---

## 1. The Problem

### 1.1 Brazil has a structural credit problem that no existing solution addresses

Brazil has the world's fifth-largest crypto user base (~30 million adults, Chainalysis 2025) and one of the world's most expensive consumer credit markets. Bank unsecured credit lines routinely quote 40–150% APR. Informal credit — agiotas, card-on-debit schemes — pushes higher still. Meanwhile, ~40 million Brazilians have either no credit history or a damaged one, even when they own significant physical assets.

Two thirds of the country's pawn lending is monopolized by the largest TradFi pawn channel in BR (state-bank monopoly), which has held a legal monopoly on pawnbroking since 1969. TradFi's active pawn portfolio was R$2.04 billion as of its last publicly-verified integrated report (2021); branch coverage is ~900 locations, concentrated in metropolitan areas. The operational footprint is real — and insufficient for a country of 215 million.

### 1.2 TradFi's offer is structurally bad for asset owners

The real ceiling is not branch coverage. It's the appraisal methodology.

TradFi advertises an LTV of 85–100%, but that percentage is computed against an internal appraisal that considers only the weight and purity of the precious metal. Brand, movement, model, provenance, and secondary market value are ignored. The practical consequence: a Rolex Submariner with a real-market value of R$50,000 is appraised by TradFi at R$8,000–15,000. The borrower walks out with 13–30% of real market value. The asset sits in TradFi's vault. The borrower pays interest on a loan that under-collateralizes their own wealth by 3–5x.

**TradFi also does not accept art.** For Brazil's art-owning segment — a non-trivial slice of high-net-worth households — there is no pawnbroking product at any scale.

### 1.3 DeFi cannot solve this today

Every major DeFi lending protocol (Aave, Compound, MakerDAO) accepts only crypto-native collateral. RWA-specialized protocols (Centrifuge, Goldfinch, Maple Finance) focus on tokenized invoices, institutional credit, or real estate — not movable physical assets held by individuals. The gap is not a product gap. It is an **operational gap**: accepting a watch on-chain requires a custody chain that no pure-DeFi team can build in a few sprints.

Physical-collateral DeFi has a second attack surface that on-chain-only protocols don't: the interface between the physical world and the blockchain. That interface needs a network of certified appraisers, bonded custodians, tracked transport, insurance, and — in Brazil specifically — a regulated lending counterparty with a BACEN license and the legal standing to record CCBs with fiduciary alienation. Building that from scratch takes 18–24 months. Vaulx doesn't need to. Its COO already operates it at national scale.

### 1.4 The addressable wedge

We are not solving "credit in Brazil." We are solving the specific intersection of:

- Asset-rich, credit-excluded borrowers owning watches, jewelry, art, or vehicles worth ≥ R$24,000 (minimum ticket R$12,000 at 50% LTV)
- Who have no access to bank credit at reasonable rates
- And whose assets TradFi either refuses or dramatically under-values

**Rough sizing.** If 0.5% of Brazilian adults own a luxury asset ≥ R$24K and would use it as collateral given a fair LTV, that is ~800,000 potential borrowers. At an average ticket of R$15,000 and a 120-day term, the addressable flow is measured in billions of reais per year. Vaulx needs ~800 active CCBs to be break-even. The market is three orders of magnitude larger than our break-even point.

---

## 2. Why Now

### 2.1 Four inflection points have just lined up

**(a) Solana RWA has crossed the usability threshold.** Compressed NFTs (Metaplex Bubblegum) have made minting a custody-proof token cost less than $0.001 per transaction. Transaction finality is ~400ms. This removes the economic and UX barrier that blocked physical-collateral DeFi on Ethereum, where a mint + custody update + disbursement sequence would cost $20–80 in gas alone. On Solana, the same sequence costs fractions of a cent.

**(b) BRL stablecoin infrastructure has matured in 2026.** As of early 2026, non-USD stablecoin usage on Solana has tripled, driven by BRZ (Transfero Group) and EURC. Crown (BRLV) raised $13.5M from Paradigm in late 2025 with 360M+ tokens in circulation. The first BRL credit market on Solana launched in March 2026. B3 (the Brazilian stock exchange) is publicly planning its own stablecoin for 2026. The "we're waiting for a real BRL stablecoin" excuse no longer holds — multiple production-grade options exist, and the issuer market is actively competing for protocol integrations.

**(c) Brazil's regulatory window is open for SCDs.** The Sociedade de Crédito Direto framework (BACEN Resolução 4.656/2018, updated 4.972/2021) allows a partner company to issue credit directly — including CCBs with fiduciary alienation — without a full banking license. This is the specific legal vehicle Vaulx needs. The regulatory framework is stable, tested, and used by dozens of Brazilian fintechs today. The window will not stay this open as institutional players enter.

**(d) TradFi is converging on RWA.** Goldman Sachs, BNY Mellon, UBS, Citi, and HSBC are all publicly live on tokenized asset projects. BCG's 2025 revision of tokenized RWA TAM sits at $9.4T by 2030. Paradigm and Framework Ventures have specifically backed BRL stablecoin infrastructure. The "is RWA the next cycle?" question stopped being debatable in 2025. What remains contested is who executes the rails in each emerging market.

### 2.2 What doesn't exist anywhere in the world today

**A DeFi protocol with enforced real-world custody for movable physical assets.** Centrifuge does invoices. Goldfinch does institutional emerging-markets credit. Maple does corporate credit. TangibleDAO does real estate. None of them accept a watch, a ring, or a painting. The on-chain plumbing for this category has not been shipped at scale — on Solana or anywhere else.

Vaulx is first. First-mover advantage in this category is meaningful because the moat is not the code. It is the custody network + the appraiser network + the lender relationships, and all three compound over time.

### 2.3 Why Brazil first, not Brazil only

Brazil is the right beachhead because:
- Highest informal credit spread vs. regulated alternatives in any G20 country
- Mature crypto user base (30M+, stablecoin-dominant)
- TradFi's bad pawn product creates a real, unmet demand with existing customer expectations
- One of the founders (Marcelo) already operates the exact custody infrastructure the protocol needs, in Brazil

Brazil is not the endpoint. The product structure is country-agnostic — every market has appraisers, custodians, and asset-rich-cash-poor segments. Post-Brazil validation, LatAm expansion is asset-light (R$10–45K activation per country, zero incremental fixed cost). US entry follows with pawnbroker licensing in Florida and New York (US pawn market: $8.6B today → projected $45.6B by 2030).

---

## 3. The Product

### 3.1 What Vaulx does, in plain English

A borrower with a valuable physical asset walks into a partner custodian in São Paulo. The asset gets appraised three ways — remote expert, in-person specialist, and a real-time market anchor against Chrono24/WatchCharts. If the three appraisals converge within tolerance, the asset is accepted into custody and a Token Representing Credit Rights (TRDC) is minted on Solana. The TRDC encodes the CCB hash, the custody ID, the LTV, and the loan amount.

The partner SCD signs the CCB with fiduciary alienation (the borrower remains the owner; the SCD holds the alienation as security). Only after the TRDC status flips to `ACTIVE` — which requires a custody confirmation transaction from the authorized custodian — does the Vault Program release USDC or BRL stablecoin to the borrower. The borrower receives the stablecoin directly in their Solana wallet.

When the borrower repays principal plus accrued interest, the TRDC is marked `REPAID` and the custody release is triggered. If the borrower defaults, the TRDC flips to `DEFAULTED`; the SCD executes fiduciary alienation off-chain under DL 911/69, the asset is sold, and proceeds settle the loan.

### 3.2 Architecture overview

Two separate Solana programs, both Anchor/Rust:

**Vault Program.** Holds stablecoin liquidity supplied by the partner SCD (and, in V4+, by a FIDC securitization vehicle). Enforces:
- Only the SCD authority can deposit or withdraw capital.
- Disbursement is gated by a CPI (Cross-Program Invocation) from the Loan Program and a hard check that the TRDC status is `ACTIVE`.
- Balance is read from the actual vault ATA (Associated Token Account), never from a cumulative formula — this eliminates accounting-drift attack vectors.
- Manual pause flag for BRL stablecoin depeg response.

**Loan Program.** Manages TRDC lifecycle. Instructions: `create_ccb_trdc`, `confirm_custody`, `disburse_ccb` (internal CPI only), `repay_ccb`, `renew_ccb`, `execute_af_default`. Each instruction has strict account-constraint validation and CPI caller checks.

**TRDC (compressed NFT).** Metaplex Bubblegum cNFT, minted once per CCB. Metadata includes `ccb_hash`, `ccb_external_id`, `status`, `loan_amount`, `due_ts`, `collateral_category`, `custodian_id`, `appraisal_date`, `scd_pubkey`. Status transitions are strictly enforced in program logic.

**Custody release gate.** The single invariant that makes Vaulx a real-world-custody protocol and not a DeFi wrapper: `disburse_ccb` fails unless `trdc.status == ACTIVE`, and the only way to flip to `ACTIVE` is a `confirm_custody` transaction signed by the authorized custodian PDA. If that check ever disappears — even during a refactor — the product's entire legal and competitive story collapses.

### 3.3 The triangular appraisal

Any asset is only accepted after three independent validation layers converge:

| Layer | Who | SLA | Cost |
|---|---|---|---|
| Online appraisal | Certified remote appraiser (photos, video, reference number) | 24h | R$180–250 |
| Offline appraisal | In-person specialist (timegrapher, caliber, authentication) | 48h after check-in | R$380–520 |
| Market anchoring (M6) | Automated system (Chrono24 + WatchCharts median + range) | Real-time | R$0 marginal |

Total cost per new intake: R$560–770. Renewals use the same custody + policy and pay zero incremental appraisal cost — which is why the unit economics improve materially on cycle 2+ (margin moves from ~17% on first loan to ~26% on renewal).

The model was designed to detect two specific fraud vectors: (1) a single appraiser inflates; (2) two appraisers collude. A collusion-proof third check — the market anchor — makes the system robust against either.

### 3.4 Collateral categories by phase

| Category | Appraisal | LTV | Custody | Phase |
|---|---|---|---|---|
| Luxury watches | Triangular (Chrono24/WatchCharts) | 50–60% | Partner custodian | MVP |
| Jewelry | Triangular (GIA + gemologist) | 40–55% | Partner custodian | MVP |
| Art | Specialist + provenance + auction history | 30–45% | Climate-controlled | Phase 1 |
| Vehicles | FIPE table | 50–65% | Secure garage + insurance | Phase 1 |
| High-value NFTs | On-chain oracles (floor price) | 30–50% | On-chain PDA | Phase 2 |

The Anchor code accepts any cNFT mint. The bottleneck for category expansion is never code — it is the appraiser, the custodian with the right physical conditions, and secondary-market liquidity for default execution.

### 3.5 KYC/AML/CFT compliance

The partner SCD, as a BACEN-regulated financial institution, is required by law to perform KYC and AML/CFT on every borrower. Vaulx integrates this off-chain via API: identity verification, PEP screening, sanctions screening, source-of-funds check for tickets above BACEN thresholds. The on-chain TRDC carries only a KYC-approved flag; PII stays off-chain with the SCD, compliant with LGPD (Brazil's GDPR-equivalent).

### 3.6 Default and recovery

**Primary path: fiduciary alienation under DL 911/69 and Lei 14.711/2023.** The CCB with fiduciary alienation gives the SCD a legal right to extrajudicial recovery — no court order needed, provided documentation is clean. The asset is retrieved from custody, sold (primary channel: Brazilian luxury auction houses; secondary channel: on-chain auction at Phase 2), and proceeds settle the loan with a 5% liquidation fee captured by the protocol.

**Why this works.** The custody chain is unbroken from intake to resolution — a federally-regulated security operator (Gitel) runs it. The CCB is enforceable. The SCD has standing to execute. The recovery rate benchmark in analog pawn operations is 90–95% of loan value at luxury-asset tickets; Vaulx targets the same.

### 3.7 What a judge sees in the hackathon demo

A three-minute video showing the six-step happy path on Devnet:
1. Two lenders deposit USDC into a vault. Vault balance visible on Solana Explorer.
2. A borrower requests a $10,000 loan against a Rolex appraised at $20,000 (50% LTV). TRDC is minted with status `PENDING_CUSTODY`. No money moves.
3. Custodian signs a `confirm_custody` transaction. TRDC flips to `ACTIVE`.
4. `disburse_ccb` executes via CPI — USDC moves from vault to borrower wallet. Vault balance drops.
5. Borrower repays principal + interest. TRDC status becomes `REPAID`. Lenders' vault shares now worth more than at deposit.
6. Anchor test suite runs green — including a test that proves `disburse_ccb` fails when custody is not yet confirmed.

That sixth moment — the failing disburse test — is the single frame that proves Vaulx is not vaporware.

---

## 4. The Team

Five founders. Each covers exactly one critical axis no other member could substitute.

### 4.1 George — CEO & Co-Founder

**Role.** Strategy, protocol design oversight, fundraising, European expansion, investor and regulatory interface.

**Background.** Fifteen years in European banking operations, including Italian and Central-Eastern-European banking environments — one of the world's most sophisticated emerging-market banking corridors. Bocconi-tier finance education. Independent crypto and Web3 experience spanning several cycles. Operates from Vienna (EU regulatory gateway).

**Why this matters.** Physical-collateral lending is credit engineering, not a tech project. LTV calibration, reserve mechanics, default waterfall sequencing, and regulatory classification are skills that come from fifteen years inside regulated financial institutions — not from a hackathon weekend. George also owns the EU investor conversation (including a relationship path into a former KuCoin CEO in Vienna) and the regulatory framing for the eventual EU expansion under MiCA and national financial regimes.

### 4.2 Marcelo Coelho — COO & Co-Founder

**Role.** Physical custody network, appraiser partnerships, bank and corporate relationships, Brazilian operational rollout, SCD and pawn-partner negotiation.

**Background.** CEO of Gitel (gitel.com.br), a Brazilian security solutions company operating nationally in the electronic security sector. The Brazilian private security market is USD 3.1B (2024), regulated by the Federal Police, with Gitel's subsector covering CCTV, access control, alarm monitoring, and secure asset management. Banks are the primary institutional buyers — Gitel's relationships span the major BR banking groups.

**Why this matters.** Vaulx's custody layer is its moat. Custody is not a feature you procure. It is an operator credential. Marcelo brings a functioning national security operation with existing bank relationships, existing compliance posture with the Federal Police, and an institutional network that closes custody deals in weeks, not quarters.

### 4.3 Rodrigo Coelho — Head of Operations Brazil & Co-Founder

**Role.** Operational execution of custody processes, São Paulo on-the-ground coordination, institutional network support, day-to-day appraiser and custodian management.

**Background.** Works alongside Marcelo inside Gitel. Same institutional relationships, same operational discipline, at execution level.

**Why this matters.** Physical-collateral lending has one specific single-point-of-failure: the custody record is the legal record. A broken chain invalidates the loan contract and erases recovery in default. Having a second dedicated operator inside the founding team — not a contractor, not a hire — means the custody function has institutional redundancy from day one. This is the difference between "we'll figure out operations" and "operations already run at national scale."

### 4.4 Felipe — Strategic Advisor & Co-Founder

**Role.** Crypto rails integration, DeFi product economics, Solana ecosystem access, US investor relations, community distribution.

**Background.** Brazilian national, US-based. Founder of a crypto rails company that processes a large share of São Paulo's luxury watch transaction flow (USDT rails). Runs a substantial Solana DeFi Discord community. Direct relationships inside Solana Brazil and with US VCs who have backed BRL stablecoin infrastructure (Paradigm, Framework Ventures). Wall Street exposure and time in Boston — the US's second-largest financial center.

**Why this matters.** Felipe is the bridge between Vaulx's Brazilian operating reality and the Solana/VC ecosystem where the capital and the narrative live. He is also the designer of Vaulx's financial product economics — LTV ceilings, interest curves, renewal incentives, the eventual securitization architecture. His US base is a structural asset: it is the North American operational beachhead and a direct channel to US capital. He is in the cap table; he operates as Strategic Advisor externally — a positioning he has explicitly requested.

### 4.5 Edson — Lead Developer & Co-Founder

**Role.** Smart contract development, cNFT minting, vault architecture, on-chain loan lifecycle, frontend dApp integration.

**Background.** Experienced Solana developer. Anchor framework + Metaplex Bubblegum + compressed NFT + PDA custody patterns — the exact stack Vaulx requires.

**Why this matters.** A protocol handling physical assets cannot outsource its core smart contract logic. Every RWA protocol that has been exploited at scale was exploited through a contract vulnerability. Having a dedicated in-house engineer who owns the codebase end-to-end is the correct security posture. Crucially, Edson's presence means Vaulx submits to Colosseum with code, not slides.

### 4.6 Team composition — the structural argument

| Critical success factor | Owner | Why they own it |
|---|---|---|
| Physical custody infrastructure | Marcelo + Rodrigo | Active operators of a national security business |
| Financial product design | Felipe | Wall Street exposure + DeFi build experience |
| Protocol safety + banking operations | George | 15 years European banking, elite finance education |
| On-chain technical execution | Edson | Experienced Solana developer, Anchor + Bubblegum |
| US & EU capital / institutional bridges | George + Felipe | EU regulatory fluency + US VC access |

No redundancy. No gap. Each axis covered by the person whose existing operating reality already demands those skills.

### 4.7 Acknowledged gaps

Two gaps are not yet covered by the founding team and will be filled as hires or external partners:

1. **Brazilian fintech legal counsel.** SCD partnership formalization, BACEN interface, CCB issuance framework. Not a founder skill — an external procurement. Budget included in Section 6.
2. **Brazil growth marketing.** Direct-to-consumer borrower acquisition in São Paulo. Phase 2 priority; Phase 1 acquisition runs through Felipe's existing luxury-watch merchant network and the Mercado do Bitcoin relationship.

Both are normal and expected for a pre-seed team.

---

## 5. Business Model & Moat

### 5.1 Revenue — three streams at MVP

**Origination fee.** 2–3% of principal, charged at disbursement. On a R$10,000 loan: R$200–300. Covers appraisal costs, logistics, cNFT mint, transaction fees.

**Interest spread.** Borrower pays 18–24% APR. Cost of capital ranges from 0% (bootstrap with SCD's own capital) to 6–12% p.a. (external LPs or FIDC in later phases). Net spread to protocol: 8–12% p.a.

**Liquidation fee.** 5% of sale value, charged only in the event of default. Target default rate: <5%. Liquidation revenue is not desirable revenue — it's a cost-recovery mechanism.

### 5.2 Unit economics

| Metric | Cycle 1 (new loan) | Cycle 2+ (renewal) |
|---|---|---|
| Average ticket | R$20,000 | R$20,000 |
| Variable cost per loan | R$1,728 (incl. triangular appraisal R$665) | R$1,063 (no new appraisal) |
| Gross margin | ~16.8% | ~26% |
| 1-year CLV (1 new + 3 renewals) | R$2,865 | — |
| Blended CAC | R$350–500 | — |
| CLV/CAC target | >5x | — |

The renewal lever is the most important variable in the model. The NPA (US National Pawnbrokers Association) benchmark for repeat borrowing is ~85% of loans in the pawn category. Vaulx models 60% as a conservative base. Each renewal adds R$665 of margin and requires no new triangular appraisal (same custody, same policy, same asset).

### 5.3 Break-even

At an average ticket of R$20,000 and 60% renewal rate: **~800 active CCBs per year.**

Without renewal: ~1,200. This is why renewal is the #1 operational KPI in Year 1 — a 60% renewal rate reduces break-even by 33%.

### 5.4 Year 1 scenarios (SP only, in-person logistics model)

| Metric | Conservative | Base | Optimistic |
|---|---|---|---|
| Loans in the year | 200 | 400 | 700 |
| TVL (avg) | US$ 800K | US$ 1.6M | US$ 2.8M |
| Gross revenue | R$ 416K | R$ 831K | R$ 1.46M |
| Variable costs | R$ 346K | R$ 691K | R$ 1.21M |
| Fixed costs | R$ 600K | R$ 720K | R$ 840K |
| Operating result | –R$ 530K | –R$ 580K | –R$ 590K |

**Year 1 is designed to prove the model, not to be profitable.** The number to move in Year 1 is the renewal rate and the NPS baseline. Year 2 projects 800 CCBs and first-quarter break-even if renewal holds at 60%.

### 5.5 Moat — four layers

**1. Custody network.** An on-chain lending protocol without a real-world custody operation is a slide deck. Marcelo and Rodrigo bring an existing national security operation. A VC-funded competitor could replicate the code in 3 months and the custody network in 18–24 months — if they can find the equivalent operator, which most cannot.

**2. SCD partnership.** The formal SCD relationship takes months to negotiate and requires a BACEN-standing counterparty willing to co-design a protocol-facing credit product. Once inked, it's an exclusivity channel for physical-collateral on-chain lending in Brazil.

**3. Appraiser network.** Triangular appraisal requires certified remote appraisers, offline specialists, and live market-anchor data feeds — built as relationships, not as APIs. Felipe's existing luxury-watch merchant network is a shortcut no clean-sheet competitor can buy.

**4. On-chain reputation (Phase 2+ moat).** Every loan Vaulx issues builds a cNFT-anchored borrower credit history. At 10,000+ loans, this dataset is unique globally — no dataset exists today for default rates on luxury-asset collateral lending in LatAm. It becomes monetizable as an Asset Scoring API and as borrower reputation NFTs (see Layer 2 revenue streams, Section 8).

### 5.6 Why TradFi doesn't replicate

TradFi cannot deploy on-chain infrastructure inside its risk framework on a sub-5-year timeline. Its pawn product is a 56-year-old monopoly with no commercial pressure to innovate. TradFi also cannot accept art — that alone carves a defensible category where Vaulx has no direct competitor in Brazil.

### 5.7 Why a well-funded startup doesn't replicate

A well-capitalized crypto startup without an operating partner like Gitel faces the 18–24 month custody-network build. A well-capitalized fintech startup without a Solana developer like Edson faces the same on the technical side. The specific combination — TradFi-credentialed operators + Solana engineer + Brazil custody operator + US-based crypto rails advisor — is not available off-the-shelf. That's the thesis.

### 5.8 LatAm & US expansion economics

**LatAm (2026–2027).** Asset-light per country: R$10–45K activation cost (appraiser identification, custodian LOI, local legal opinion, SCD-equivalent partner). Zero incremental fixed cost. Target markets: Colombia, Mexico, Panama, Peru, Chile.

**US (late 2027).** Material investment. Florida and New York pawnbroker licenses, state-level compliance overhead, US banking partner, dollar-denominated loan product. Market size: $8.6B → $45.6B by 2030. Felipe's US base is the entry vector.

### 5.9 Layer 2 revenue streams (V3+)

Twelve identified streams beyond the core three. Priorities:
- **Float yield.** Idle vault tokens deployed to Kamino/MarginFi for 4–8% APY. +$40–80K/year at $1M TVL. Low effort.
- **Vault-as-a-Service (VaaS).** License the audited vault program to third-party RWA platforms. R$500–2,000/month + 0.1–0.3% p.a. on TVL.
- **Asset Scoring API.** Per-query fee against on-chain asset history. A "Carfax for luxury goods." R$0.50–2.00/query.
- **On-chain securitization.** At 100+ active loans, tokenize the book as fixed-income product for institutional investors. Vaulx retains 10–20% first-loss tranche.

These are not assumed in the Year 1 plan. They are upside the roadmap unlocks.

---

## 6. Roadmap & The Ask

### 6.1 Roadmap by phase

| Phase | Window | Exit criterion |
|---|---|---|
| **Hackathon MVP** | Apr–May 2026 | Devnet full-cycle demo, TRDC V3.1 working, Colosseum submission May 10 |
| **Pre-seed** | Jun–Aug 2026 | Legal opinion locked; SCD partner signed; SP custodian + appraiser network live; smart contract audit scoped |
| **Seed / Mainnet Beta** | Sep–Nov 2026 | Audit complete; mainnet deployed in SP; 20–50 CCBs/month; NPS baseline captured |
| **Brazil validation** | Dec 2026 – Jun 2027 | 400+ CCBs in SP; NPS >80; CLV ~R$2,865 confirmed; CAC R$350–500 validated; renewal rate >60% |
| **LatAm rollout** | 2027 | 3–5 LatAm countries (CO, MX, PA, PE, CL) via asset-light playbook |
| **US entry** | Late 2027 | Miami + NYC; pawnbroker licenses FL/NY |
| **Global + securitization** | 2028+ | Remaining LatAm + Europe; on-chain marketplace; VaaS API live |

### 6.2 What each phase de-risks

**Hackathon MVP → Pre-seed.** Proves the core technical invariant (custody gate enforced on-chain) and earns validation from Colosseum judges + the accelerator network. This de-risks the question: "can the team actually ship the code?"

**Pre-seed → Seed.** Locks the legal and operational perimeter: SCD, lawyer, custodian LOI, appraiser LOI, audit firm. De-risks the question: "can this run in Brazil without getting shut down?"

**Seed → BR validation.** First mainnet loans. Real borrowers, real defaults, real recovery. De-risks the question: "does the model actually work at unit economics?"

**BR validation → LatAm.** Replicates the playbook in non-BR legal regimes. De-risks the question: "is this Brazil-only, or global?"

### 6.3 Use of funds — pre-seed ($500K–$1M)

| Bucket | Range | What it buys |
|---|---|---|
| Smart contract audit | $30K–80K | One tier-1 Solana audit firm. Non-negotiable before mainnet. |
| Legal (BR + entity structure) | $50K–100K | SCD partnership contract, CCB framework review, entity formation (BR LTDA + likely US Delaware or Cayman holding), LGPD compliance |
| SCD partnership setup | $30K–60K | Onboarding, API integration, compliance integration, operational setup |
| Custodian & appraiser network (SP) | $40K–80K | LOIs, operational integration, initial asset intake capacity for 50–100 CCBs/month |
| Team runway (6 founders, 9–12 months) | $250K–450K | Sub-market salaries for 4 full-time founders + Felipe's advisory cadence |
| First marketing/acquisition | $40K–80K | Luxury-watch merchant partnerships, content, Mercado do Bitcoin channel activation |
| Reserve / buffer | $60K–150K | The things you can't predict |

### 6.4 Use of funds — seed ($1.5M–$3M, post-accelerator or direct)

| Bucket | Range | What it buys |
|---|---|---|
| Mainnet deployment + infrastructure | $100K–200K | Devops, observability, incident response |
| SCD operational capital | $500K–1M | Loan book at launch; the book itself is the working capital |
| Hiring: BR growth, second Solana dev, compliance | $400K–700K | 3 hires, 12-month runway |
| Legal & regulatory (BR + LatAm + US prep) | $150K–300K | Multi-jurisdiction counsel; FL/NY licensing prep |
| Marketing & category creation | $200K–400K | Content, partnerships, paid acquisition at unit-tested CAC |
| Reserve | $150K–400K | — |

### 6.5 The Ask — framed correctly

**From Colosseum.** The Frontier Hackathon prize is $30K cash plus a path into the $2.5M accelerator investment pool and the Colosseum portfolio network. Frame this correctly in investor conversations: the hackathon is the funnel, not the ceiling. It is the validation event and the network opener. It is not the funding that gets Vaulx to mainnet.

**From pre-seed investors.** $500K–$1M on a SAFE, valuation cap to be set based on Colosseum outcome. Lead investor gets board observer, pro-rata, and information rights. The EU network (George) and the US network (Felipe + Mercado do Bitcoin relationship) are the two parallel investor pipelines.

**From seed.** $1.5M–$3M post-validation, either through Colosseum's accelerator channel or through a priced round with a Solana-native or RWA-focused lead.

### 6.6 Comparable precedents

Recent RWA/DeFi seed rounds (2025–2026): $2M–$8M on $10M–$40M post-money caps, typical. Vaulx's differentiation in the cap table conversation: working Devnet demo, a founder with an operating custody business, a partner SCD pathway, and a US-based operator in the crypto rails layer. This is a materially stronger founder profile than the median Colosseum cohort.

### 6.7 Exit / liquidity scenarios

Three realistic paths:
1. **Strategic acquisition** by a Brazilian fintech (Nubank-scale) or global RWA protocol looking for LatAm entry.
2. **Series A + token launch (Phase 2+)** if governance/utility token makes real commercial sense (see Appendix §8.3). Liquidity via token markets.
3. **Sustainable operating business.** Year 3+ profitability with international expansion. Investors get distributions or secondary.

---

## 7. Risk Matrix

| # | Risk | Severity | Likelihood | Mitigation |
|---|---|---|---|---|
| 1 | SCD partner fails to close | CRITICAL | Medium | Parallel conversations with 2+ SCD candidates; pawn-operator backup path (Fidix-style partner who already has BACEN authorization) |
| 2 | Smart contract exploit | CRITICAL | Low-Medium | Mandatory tier-1 audit pre-mainnet; custody gate as hard invariant; two-program isolation; Squads 2/3 multisig |
| 3 | Custody chain broken (lost/stolen asset) | HIGH | Low | Gitel-grade custody + insurance from day one; documented intake; climate-controlled facilities for art |
| 4 | BRL stablecoin depeg | HIGH | Medium | Pause flag on vault; dual USDC+BRL architecture; active depeg monitoring; contractual depeg clauses with borrowers |
| 5 | Brazilian regulatory change (CVM reclassifies TRDC as security) | HIGH | Medium | TRDC is a credit-rights token, not a security under current framework; legal opinion from day one; EU + LatAm expansion option if BR path closes |
| 6 | Default rate exceeds 5% | MEDIUM | Medium | Conservative LTV (50–60%, not 70%); fiduciary alienation with DL 911/69 enforcement; 5% liquidation fee covers cost of recovery |
| 7 | Appraisal fraud (collusion) | MEDIUM | Low-Medium | Triangular appraisal with independent M6 market anchor eliminates collusion risk |
| 8 | Team attrition (Edson drops) | CRITICAL (short-term) | Medium | Compensation agreement locked pre-crunch; backup developer identified post-seed |
| 9 | Competitor enters with better-funded team | MEDIUM | Medium | First-mover + custody network as moat; 18-month build lead on any new entrant |
| 10 | Low borrower acquisition in Year 1 | HIGH | Medium | Felipe's luxury-watch merchant network as pre-validated channel; Mercado do Bitcoin partnership; TradFi unhappiness as latent demand |
| 11 | Liquidity mismatch (lenders want early exit) | MEDIUM | Medium | V1: SCD as single institutional lender (no mismatch). V3+: secondary market for vault positions or tranching |
| 12 | Gitel conflict-of-interest challenge | MEDIUM | Low | Gitel provides custody services at arm's length, market rate; contract documented; Marcelo's role separated between Gitel CEO and Vaulx COO |

The two critical-severity items that block everything are #1 (SCD partner) and #2 (smart contract exploit). Both have clear mitigation paths with time and capital. They are not existential — they are engineering problems.

---

## 8. Appendix

### 8.1 Legal framework (summary)

**SCD (Sociedade de Crédito Direto).** BACEN Resolução 4.656/2018 (updated 4.972/2021). Allows credit issuance with direct lending; CCBs can be issued and traded. This is the legal vehicle for Vaulx's lending partner.

**CCB (Cédula de Crédito Bancário) with Fiduciary Alienation.** Brazilian credit instrument; Lei 10.931/2004 + DL 911/69 (extrajudicial enforcement) + Lei 14.711/2023 (strengthened recovery). The borrower remains the asset's owner; the SCD holds the alienation as security. In default, recovery is extrajudicial (no court order required).

**VASP status.** Vaulx the protocol does not take custody of customer crypto assets — the vault is operated by the SCD under its BACEN license. VASP classification is not triggered by the MVP architecture. Legal opinion pending.

**LGPD.** Lei Geral de Proteção de Dados (Brazilian GDPR-equivalent). All PII handling is off-chain at the SCD; TRDC on-chain carries only a KYC-approved flag, no PII.

**Pawn partner model.** If Marcelo's conversation with Fidix (or an equivalent BACEN-authorized pawn/lending operator) closes, Vaulx can initially operate as a technology and origination partner to an already-authorized entity, with revenue share. This is the fastest legal path to the first live loan. Terms TBD.

### 8.2 BRL stablecoin — pre-mainnet decision

As of April 2026, the BRL stablecoin decision is still open. Requirements:

- Minimum Solana pool liquidity: $500K (critical)
- Depeg risk: public reserve attestations + stability history (critical)
- 6 decimals (matches USDC, zero code change)
- BACEN-regulated or credible counterparty (high)
- Kamino/Jupiter integration for float yield (medium)
- 2026 Solana expansion roadmap (medium)

**Candidates:**

| Option | Pros | Cons |
|---|---|---|
| BRZ (Transfero) | BACEN correspondent; 6 decimals; confirmed Solana mint | Low Solana liquidity as of audit |
| BRLV (Crown) | $13.5M Paradigm-backed raise; 360M+ tokens in circulation; strong issuer momentum | Newer; track record shorter |
| BBRL (Polygon-native, extending to Solana?) | Backed by BR's largest FX bank | Solana status unclear |
| Proprietary / white-label | Full control | Regulatory and operational cost |

**Decision path.** Integration test on Devnet for top two candidates; commercial conversation with both issuers (Transfero + Crown); decision lock before mainnet (likely Q3 2026).

**The architectural impact is zero.** The Vault Program uses `seeds = [b"vault_state", token_mint.key()]` — any 6-decimal mint is directly compatible. This is not a code decision. It is a commercial decision about partner economics and liquidity depth.

### 8.3 Token strategy — Phase 2+ (not MVP)

The question was raised in the team meeting: should Vaulx have a token? Short answer: not at MVP, yes on the roadmap — but only with real utility and clean legal standing.

**What a token is NOT for:** raising capital via ICO (regulatory risk), creating pump-and-dump dynamics (alienates institutional investors and SCD partners), speculative yield.

**What a Vaulx token could legitimately be used for (Phase 2+):**
1. **Governance.** Holders vote on LTV ceilings, category additions, protocol parameters. Standard DeFi governance utility.
2. **Revenue share.** Fee distribution to stakers. This is the variant Felipe mentioned as "VCs love" — but it carries material CVM-as-security classification risk in Brazil. Would require US/Cayman structure.
3. **Borrower reputation / discount tier.** Hold X tokens → preferential LTV (58–62% vs baseline 50%). Utility tied to on-chain reputation.
4. **Network-effect incentives.** Bootstrap liquidity via LP token rewards at scale.

**Default position.** Vaulx ships without a token. Token launch is a roadmap item, gated on: (a) CVM legal opinion confirming utility classification, (b) 10,000+ loans of operational history, (c) clear economic model that passes a regulatory stress test in both Brazil and the US/EU. Anything earlier is optics, not utility.

### 8.4 Governance & team structure

Current governance: founder-led, with George as CEO and final decision authority on strategy, finance, and external narrative; Marcelo as final decision authority on Brazilian operations and custody; Felipe as advisory on product economics and US relationships.

Equity framework (final allocation subject to the Apr 23 call + signed Google Doc by Apr 27):

| Person | Role | Founder / Advisor | Vesting |
|---|---|---|---|
| George | CEO | Founder | 4yr / 1yr cliff |
| Marcelo | COO | Founder (Gitel IP contribution separately valued) | 4yr / 1yr cliff |
| Rodrigo | Head of Ops BR | Founder / Co-founder (own named share) | 4yr / 1yr cliff |
| Felipe | Strategic Advisor | Advisor (his stated preference) OR Founder — pick one structure | 2yr advisor OR 4yr founder |
| Edson | Lead Developer | Founder OR paid contractor + smaller equity (his preference) | 4yr/1yr if founder, 2yr if contractor |

**Legal entity.** Decision pending (likely BR LTDA + US Delaware C-Corp or Cayman holding for investor friendliness). Driven by lawyer recommendation and investor preferences at seed.

### 8.5 Metrics & KPIs

**Year 1 operational KPIs.**
- Active CCBs (monthly growth)
- Renewal rate (target: >60%)
- Default rate (target: <5%)
- Average ticket size (target: R$15K–20K)
- CAC (target: R$350–500)
- CLV/CAC (target: >5x)
- NPS (target: >80)
- Custody chain integrity: 100% (non-negotiable)

**Technical KPIs.**
- Devnet → Mainnet migration clean
- Smart contract audit passed
- Zero critical vulnerabilities post-audit
- <400ms average transaction finality
- Vault balance = real ATA balance (always; enforced in code)

**Investor-facing KPIs.**
- TVL
- Cumulative loan volume
- Revenue per CCB
- Operating margin trajectory
- International expansion LOI count

### 8.6 Credits & sources

Primary sources referenced in this document: BACEN public data; World Bank Global Findex; TradFi Integrated Report 2021; Chainalysis 2025 Global Crypto Adoption Index; Banco Central do Brasil market reports; NPA (US National Pawnbrokers Association); BCG x Ripple "Approaching the Tokenization Tipping Point" (2025); ResearchAndMarkets "Latin America Alternative Lending Databook 2024"; Colosseum Frontier Hackathon public documentation; team's Technical Spec V3.1 (Apr 2026); Vaulx Business Model V2.6.

---

**End of draft v0.9.**

*This document is a working draft. Sections pending final review: 4 (team — per-person bios to be approved by each member), 8.1 (legal — lawyer sign-off needed), 8.2 (BRL stablecoin — final issuer decision). Target final version: May 9, 2026, in time for Colosseum submission May 10.*

*Reviewers: Felipe (full pass, target May 3–7) · Marcelo (operational sections, target May 7) · Lawyer (legal section, target May 5).*

*Next document: 1-page investor teaser (May 5) + 10-slide investor deck in PPTX (May 9).*
