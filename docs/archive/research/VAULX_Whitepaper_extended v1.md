# Vaulx — Whitepaper v1

**Status:** Draft in progress · section-by-section delivery
**Date:** April 22, 2026
**Owner:** George (CEO)
**Purpose:** Single source of truth for white paper, MVP scope, investor deck, and pitch narrative. Supersedes `01_vaulx_white_paper_draft.md` (v0.9) and aligns with Marcelo's Architecture A tech spec.

**Brand note:** All legacy "Vaulx" references from Marcelo's V2.6 / V3.1 documents are rebranded to **Vaulx** per PRD v1.1 Delta Log.

---

## Document structure (target: 10–15 pages)

1. Executive Summary ✅ (v2 — revised per George feedback)
2. The Problem & The Wedge ✅ (v2 — revised per George feedback)
3. Product & Actors ✅ (v2 — §3.5 Phase 0 eligibility filter expanded, §3.7 retention mechanics added)
4. Technical Architecture ✅
5. Business Model & Unit Economics ✅ (v3 — Perplexity/council review applied: R$37K base ticket, custody scaled with asset value, Bristol renewal benchmark, two CAC scenarios, Y3–Y5 break-even range, §5.9 macro sensitivity)
6. Regulatory Path ✅ (v2 — §6.6 current commercial status added)
7. Team ✅ (v1 — draft pending George review)
8. Roadmap & Capital Ask ✅ (v2 — §8.7 Phase 0 → Phase 1 go/no-go gates added)
9. Risk Matrix ✅ (v1 — compact draft pending George review)
10. Appendix ✅ (v1 — BRL stablecoin framework, per-cycle formulas, token scoping, doc maintenance)

---

## 1. Executive Summary

Vaulx is a Solana-native lending infrastructure that connects global capital with asset-rich, credit-excluded borrowers in high-interest-rate economies, using physical luxury assets as on-chain-enforced collateral. The protocol's defining property is a single invariant: **no loan disburses until physical custody is confirmed on-chain**. This is enforced in smart contract logic, not in a process document — and it is what separates Vaulx from every RWA-lending protocol shipped to date.

**The category.** DeFi lending at scale has not yet reached movable physical collateral. Aave, Compound, and MakerDAO require crypto-native collateral. Centrifuge, Goldfinch, and Maple Finance handle tokenized invoices, institutional credit, and real estate — not watches, jewelry, art, or vehicles held by individual consumers. The gap is not a product gap; it is an operational one. Accepting a watch on-chain requires a custody chain, an appraiser network, and a licensed lending counterparty with legal standing to issue enforceable credit instruments. Building that stack in any jurisdiction takes 12–24 months, and the core insight of Vaulx is that the stack already exists — as a licensed-partner network operating in every country that has a modern financial system. Vaulx is the infrastructure layer that makes that network usable on-chain.

**What the product does.** A borrower brings a luxury asset (watches at launch; jewelry, art, vehicles in later phases) to a licensed custody partner. Three independent appraisals — remote expert, in-person specialist, and live market anchor against public price indices — set the collateral value. A Token Representing Credit Rights (TRDC) is minted on Solana as a compressed NFT, encoding the off-chain credit instrument's hash, the custodian ID, the appraisal date, and the loan-to-value ratio. A BACEN-licensed partner (SCD for Brazilian first deployment, equivalent licensed lender in each subsequent jurisdiction) signs the underlying credit instrument (a CCB with fiduciary alienation in Brazil, equivalent elsewhere). Only after the authorized custodian signs a `confirm_custody` transaction on-chain does the Vault Program release stablecoin to the borrower. Term: 120 days default, with monthly interest payments so defaults are caught within 30 days, not at end-of-term. On repayment, the asset returns to the borrower. On default, the licensed partner executes extrajudicial recovery — under Brazil's DL 911/69 + Lei 14.711/2023 + CNJ Provision 196/2025, and under equivalent secured-lending enforcement regimes in other jurisdictions — and the defaulted asset is offered first through a privileged auction window to platform lenders before going to the open market.

**Who funds the loans — both sides, by design.** Vaulx is a dual-track platform. On one track, regulated institutional depositors (SCDs, FIDCs, family offices, DeFi credit funds, strategic LPs) deposit directly into the protocol's vaults — this is the Phase 0 liquidity source, sufficient to support the first operating cohort without requiring retail on-chain capital. On the second track, retail lenders globally deposit stablecoins through a tokenized FIDC wrapper: a CVM-regulated fund aggregates retail capital and acts as the single institutional creditor that deposits into the Vault Program. The retail UX is an on-chain one-click flow — connect wallet, KYC (once, via Civic Pass or Blockpass, 0–3 minutes), accept fund terms, deposit, receive quota token. The compliance work runs in the background through a fund-administration-as-a-service provider (Vortx, Oliveira Trust, Singulare, or equivalent). All vaults are separated by depositor tier AND by currency — at launch, four vaults: Institutional-USDC, Institutional-BRL, Retail-FIDC-USDC, Retail-FIDC-BRL — all sharing the same Vault Program code with only token mint and authority parameters differing. **Vaulx's equity capital never funds the loan book.** Institutional partners and retail lenders fund the book; Vaulx's equity funds platform, compliance, legal, and expansion.

**Who this is for, both sides.** On the borrower side: asset-rich, credit-excluded individuals in markets where unsecured credit costs 40–150% APR and where local pawn or asset-backed lending is either monopolized with broken valuation methodology (as in Brazil) or priced at 25–50% APR with conservative LTV (as in most UK and US luxury-asset lenders). On the lender side: global capital allocators seeking yield materially above risk-free DeFi (tokenized Treasuries: 4–5%) and competitive with private DeFi credit (Maple, Centrifuge: 8–12%) — but with a superior collateral profile: physical assets at 50–60% LTV, extrajudicial legal recovery, and privileged access to defaulted-asset auctions. Target lender yields: 10–12% APY on USDC-denominated vaults; higher on local-currency vaults where the lender assumes FX exposure.

**How the protocol earns.** Vaulx is a fee-based platform, not a balance-sheet lender. Revenue stack: (a) origination fee 2.5–3% at disbursement, sized to fully cover appraisal and onboarding costs; (b) net platform margin of 4–6% annualized, taken from the spread between borrower APR and lender yield after paying licensed-partner revenue share; (c) late payment fees on overdue installments; (d) default processing fee covering recovery workflow; (e) auction commission on defaulted-asset sales to platform lenders. At the Base Case (R$37,000 average loan ticket — book average, not floor; R$25,000 remains the eligibility minimum; 26.4% borrower APR / 2.2%/month, 11% lender APY, 20% partner revenue share, R$450 target blended CAC requiring 70%+ channel concentration through Felipe's merchant network), per-cycle gross contribution is **+R$329 Cycle 1 / +R$73 Cycle 2** at Phase 0 single-partner custody rates (0.5%/month × asset value). At Phase 1 scale (500+ assets under volume SLA, custody dropping to 0.3%/month), gross contribution lifts to **+R$920 Cycle 1 / +R$665 Cycle 2**. **Customer lifetime value is the correct unit of analysis, not per-loan margin** — and CLV ranges from thin-negative at Phase 0 entry (approximately −R$40 per customer at 52% realistic base renewal and R$450 CAC) to decisively positive at Phase 1 scale (approximately +R$1,190 at the same renewal and CAC, rising to +R$1,555 with retention-UX mechanics lifting renewal to 62%). **The business works at scale, not at entry**; Year 1 is a lever-validation investment cohort, with the operational task of reaching Phase 1 custody economics, retention-UX-driven renewal, and premium-channel acquisition concentration. Pessimistic and optimistic scenarios (Position 1: R$20K loss-leader, structurally non-viable at Phase 0 entry under corrected custody scaling; Position 4: premium-tier at R$50K+ ticket, Cycle 1 alone clears any realistic CAC) are modeled in Section 5.

**Why now — four independent tailwinds that have just aligned.** Solana compressed NFTs via Metaplex Bubblegum made custody-proof tokens cost sub-cent and settle in 400ms — economically impossible at comparable scale before 2025. Local-currency stablecoin infrastructure matured (BRZ live on Solana, BRLV raised $13.5M from Paradigm, B3 announced its own stablecoin for 2026). The regulatory vehicles required to run this model cleanly — SCD, FIDC, SEP under Brazilian law; equivalent structures elsewhere — have stabilized after a decade of Fintech regulation in emerging markets. The CNJ Provision 196 of June 2025 formally codified extrajudicial recovery of movable fiduciary assets in Brazil, materially de-risking the legal enforcement path. And TradFi has publicly converged on RWA: Goldman, BNY, UBS, Citi, HSBC all live on tokenized products; BCG projects $9.4T tokenized assets by 2030. The category is no longer speculative — what remains contested is who executes the physical-collateral rails.

**Why us.** The model itself is the moat — custody partners, appraiser networks, and licensed-lender partnerships compound into an 18-month replication lead for any competitor — and the team is the accelerator on that replication lead. Five founders, five non-overlapping axes. **Marcelo Coelho (COO)** is CEO of Gitel, a 38-year-old industrial electronic-security integrator serving major Brazilian corporates (Gerdau, ArcelorMittal, CSN, ADM, Neoenergia, SICOOB, among 60+ reference clients) in video-monitoring, IoT, access control, and 24/7 NOC operations. Gitel does not operate the physical custody directly — the custody layer runs on licensed partners (Brinks, Prosegur, Loomis, and the well-distributed local Brazilian vault network that Marcelo has mapped). What Gitel and Marcelo bring is institutional access, corporate-bank relationships, Federal Police compliance posture, domain expertise in industrial security, and — distinctively — the ability to layer Gitel's own CFTV / IoT / access-control stack *onto* partner vaults as an added surveillance and audit layer. **Rodrigo Coelho (Head of Ops BR)** runs execution inside Gitel, delivering institutional redundancy and on-the-ground São Paulo operational depth. **George (CEO)** brings 15 years of European banking operations — LTV calibration, reserve mechanics, default waterfall structuring, and regulatory classification are trained skills, not hackathon weekend outputs; also opens the EU investor and regulatory channel. **Felipe (Strategic Advisor, US-based)** runs a crypto-rails company processing a large share of São Paulo's luxury watch transaction flow today, has direct access to US VCs who have backed BRL stablecoin infrastructure, and owns the relationship network of top Brazilian watch resellers — the default counterparty for privileged liquidation auctions. **Edson (Lead Developer)** is an experienced Solana engineer owning the on-chain Anchor programs and the off-chain integration backend. The borrower/lender dApp frontend is owned by George and Marcelo, building on Marcelo's existing dApp prototype and accelerated by AI-assisted development tooling — this split allows backend and frontend to progress in parallel during the 19-day hackathon sprint and beyond. The team composition is a go-to-market accelerator for Brazil; the protocol architecture works in every jurisdiction with a licensed lender, a commercial custodian (Brinks, Prosegur, Loomis, or the local vault network), certified appraisers, and a legal secured-lending framework — which is every market Vaulx plans to enter.

**Stage and scope.** Devnet MVP is complete. Technical Spec V3.1 (TRDC + partner SCD + triangular appraisal) is locked per Marcelo's documentation. Colosseum Frontier Hackathon submission targets May 10, 2026 (one-day buffer before the May 11 deadline). Beachhead: São Paulo, luxury watches, eligibility floor R$25,000 (Rolex sports tier), **book-average target R$37,000+ via channel curation through Felipe's premium-tier merchant network** (Daytona / AP Royal Oak / Patek Nautilus segment). Phase 0 target 20–50 CCBs with go/no-go gates (§8.7) before Phase 1 ramp. Brazil validation Phase 1: 400+ CCBs, NPS >80, renewal ≥62% (retention-UX-enabled target, lifted from 52% realistic base via §3.7 mechanics), default <5%. LatAm expansion Phase 2 (candidate markets in order of attractiveness: Colombia, Mexico, Peru, Chile, Panama — final sequencing tested in-market). US entry Phase 3 (late 2027+, state-level pawnbroker licensing in FL and NY). Unit economics are designed to hold at scale internationally: the 4–6% net platform margin is the defensible floor; borrower APR and lender APY dials adjust per market based on local rate environment, custody costs, and partner economics.

**The Ask — precisely framed.** Colosseum: $250,000 pre-seed investment to accelerator-accepted teams (the standard Frontier accelerator amount — the hackathon is the validation event, not the funding round). Separately: $750K–$1.2M pre-seed SAFE to complete the platform, fund smart-contract audit, close the first SCD partnership, onboard São Paulo custody and appraiser partners, secure legal opinion, and run 9–12 months of lean operations through first-cohort validation. Then $1.5M–$2M seed after Brazil validation, for LatAm rollout and a second engineer. **None of Vaulx's equity capital funds the loan book.** The SCD partner's balance sheet provides Phase 0 pilot liquidity as part of the revenue-share agreement; retail lender deposits via FIDC plus direct institutional deposits fund the book at scale. This separation is not just cleaner capital allocation — it is what makes Vaulx a platform rather than a capital-intensive lender, and what preserves the equity valuation logic that pre-seed and seed investors require.

---

## 2. The Problem & The Wedge

### 2.1 The structural problem: asset-rich, credit-excluded populations in high-APR economies

Hundreds of millions of consumers worldwide are asset-rich and credit-excluded. They own valuable physical goods — watches, jewelry, art, vehicles — but their income profile, employment status, or credit history locks them out of the formal financial system or subjects them to punitive pricing. The pattern is structural in emerging markets and a meaningful niche in developed ones: Brazil's 40 million underbanked adults; Latin America's 70%+ informal-lending penetration; Southeast Asia's estimated 290 million adults with no formal credit history (Findex 2024); sub-Saharan Africa's near-total exclusion from collateralized formal credit at individual scale. Developed markets have the same pattern in smaller but wealthier form — US pawn is a $39–42B market today with projections to $49–56B by 2030; UK luxury-asset lenders like Suttons & Robertsons, Ramsdens, and Fish Brothers run books at 25–52% effective APR against 50–75% LTV on watches. Even where the formal banking sector is price-competitive, collateralized credit against movable luxury goods remains under-served relative to demand.

The common failure mode across these markets is not that the product doesn't exist. It's that existing products charge too much, offer too little (LTV capped at 20–30% of real market value in most pawn operations, 50–75% in specialist luxury lenders), move too slowly (days to weeks for formal credit; longer for specialist luxury-asset lenders at scale), or demand credit bureau histories the target segment doesn't have. Vaulx's thesis is that a well-designed on-chain infrastructure layer, matched with licensed in-market lending partners and a commercial custody network that already exists everywhere, can deliver 50–60% LTV, 24–72 hour disbursement, and competitive APR — at a platform take rate that preserves both borrower affordability and lender yield.

### 2.2 Brazil as the test case — not because it is special, because it is instructive

Brazil is the deliberate first market for three reasons that are market-structural, not team-dependent. First, the spread between informal/unsecured credit rates and what a collateralized product can defensibly charge is the largest in the G20 — the World Bank reports Brazil's average lending rate at 40.22% per annum for 2024, with the Selic policy rate at 14.75% as of April 2026. A platform offering 24–30% APR at 50–60% LTV is materially better than the alternative, not marginally better. Second, Brazil's regulatory framework for this exact use case — CCBs with fiduciary alienation under Lei 10.931/2004 + DL 911/69 + Lei 14.711/2023, SCDs under BACEN Res 4.656/2018, SEPs under CMN Res 5.050/2022, FIDCs under CVM Res 175, extrajudicial recovery codified in CNJ Provision 196 of June 2025 — is the most developed for secured retail lending in Latin America, and it is the first in the region to explicitly permit tokenized fund quotas for retail on-chain distribution (the Mercado Bitcoin precedent, March 2025). Third, Brazil has the fifth-largest crypto user base globally (Chainalysis 2025: 30M users, $319B volume Jul-2024 to Jun-2025, ~90% stablecoin) and the single largest emerging-market stablecoin economy — the borrower and lender acquisition channels exist and are well-characterized.

What Brazil is not: a prerequisite. The protocol runs on four replaceable inputs — a licensed in-market lender (SCD in Brazil; equivalent fintech-banking partner in Colombia; Sofipo in Mexico; state-licensed pawnbroker in Florida), a commercial custodian (Brinks, Prosegur, Loomis, or local equivalents — present in every country Vaulx plans to enter), a certified appraiser network, and a legal framework that permits extrajudicial recovery of pledged or fiduciary-alienated movable property. All four inputs exist in every market on the roadmap. The team's presence in Brazil is a go-to-market accelerator for the first deployment — it does not constrain the model.

### 2.3 The Brazilian demand wedge — precisely sized, deliberately narrow

Within Brazil, Vaulx targets the specific intersection of (a) asset-rich, credit-excluded individuals, (b) owning luxury watches, jewelry, art, or vehicles with real-market value ≥ R$50,000 (minimum loan ticket R$25,000 at 50% LTV), (c) with no access to bank credit at reasonable rates, (d) whose assets the incumbent regulated offering either refuses or materially undervalues.

The incumbent offering in Brazil is **penhor**, held as a legal monopoly by TradFi (state bank) Federal since 1934 (contested by PL 4.188/2022 but operationally intact). TradFi's pawn portfolio grew to R$17B in 2024, tracking above R$18B for 2025, moving approximately 1.6 million contracts per year. TradFi's appraisal methodology values collateral primarily on the weight and purity of precious metal content — brand, movement, model, provenance, and secondary-market value are not material inputs. Effective LTV on real market value is 13–30%. A Rolex Submariner with real-market value of R$50,000 gets an R$8,000–15,000 loan. The asset sits in the vault. The borrower pays 2.19–2.97% per month (29–42% effective APR) on a loan that undercollateralizes their wealth by a factor of 3–5x. TradFi does not accept art at all. TradFi is not passive — in December 2024 it raised its nominal LTV cap to 100% to defend market share — but this raises the numerical cap, not the underlying valuation. The appraisal-methodology bottleneck remains.

The pre-owned luxury watch market in Brazil is approximately US$465M at 2023 levels — roughly 31,000 watches in circulation at any moment at the ~R$15,000 average price point. The relevant inventory for Vaulx is the upper tier (Rolex, Omega, AP, Patek, IWC, Panerai) where per-item values are R$40,000+; Felipe's network provides direct distribution access to the primary secondary-market resellers handling that inventory. Year 1 beachhead at R$25K minimum ticket and 400 CCBs is roughly R$10M TVL — 1–2% of the annualized addressable watch flow and well under 0.1% of TradFi's penhor book. This is a distribution-execution play in a market already starved, not a market-creation play. The SAM expands materially as jewelry (Phase 0.5), art (Phase 1), vehicles (Phase 1), and high-value NFTs (Phase 2) are added, each with its own custody, appraisal, and recovery profile.

### 2.4 The global lender wedge — yield arbitrage with superior collateral

The lender-side problem is symmetric. Global capital is over-allocated to low-yielding sovereign debt and under-allocated to secured emerging-market credit because the operational infrastructure to access that credit has not existed at retail scale. A Japanese household saving at 0.5% per annum, a German pension allocator benchmarking at 2–3% on EUR money-market funds, a US retail DeFi user earning 4–5% on tokenized Treasuries or 3–8% on Aave — all three populations share a common constraint: developed-market risk-free yields sit below their actuarial hurdle rates, and existing on-chain yield products are either unsecured (Maple: 8–15% APY, undercollateralized institutional credit) or collateralized by less-liquid instruments (Centrifuge: 6–12% APY, tokenized invoices/trade credit). None offer a clean secured physical-collateral product at retail-accessible scale.

Brazilian and LatAm collateralized lending at 18–30% borrower APR leaves substantial spread for a 10–12% USDC-denominated lender yield *with a physical luxury asset at 50–60% LTV and extrajudicial legal recovery behind it*. That is a fundamentally superior risk-return profile to every comparable yield product available on-chain today. Added to that: the privileged-auction access to defaulted assets, a mechanism that turns defaults from a loss event into an optionality feature for lenders with distribution or resale access. The constraint that has historically prevented this yield from being accessible to global capital is not economic — it is operational and regulatory. The 2025–2026 infrastructure stack (Solana cNFTs, mature BRL stablecoins, FIDC-tokenizado CVM precedent, CNJ Provision 196, Civic Pass / Blockpass for reusable on-chain KYC) has just made the bridge economically viable for the first time.

### 2.5 The replication thesis: same playbook, different jurisdictions

Once the Brazil cohort validates (target: 400+ CCBs, NPS >80, renewal >60%, default <5%, CAC R$350–500), the model replicates through an asset-light playbook to each target country: local legal opinion (R$5–20K), licensed-lender partner (SCD-equivalent: Colombian bank or fintech, Mexican Sofipo, US state-pawnbroker), commercial custodian (Brinks, Prosegur, or Loomis — all three operate in every target LatAm country, plus the US), certified appraisers (3–5 per country on SLA), platform localization (2–4 engineering sprints). Total activation cost: R$10–45K per country, zero incremental fixed cost, 6–10 weeks to first loan. Target order in LatAm (order of attractiveness, sequencing confirmed in-market): Colombia, Mexico, Peru, Chile, Panama. US entry (Phase 3): Miami and New York, contingent on FL/NY pawnbroker licensing and local compliance — structurally different from LatAm and deliberately deferred to late 2027+.

The unit economics stress-test at LatAm custody rates and US partner cuts is in the Section 5 appendix. The core conclusion: the 4–6% net platform margin is defensible internationally. Adjustments happen at the borrower-APR and lender-APY dials, not at the protocol take-rate. The mechanism — custody-gated on-chain enforcement, dual-track vaults (institutional + FIDC retail), licensed partner per jurisdiction — transfers cleanly.

---

## 3. Product & Actors

### 3.1 The five actors and what they each do

Vaulx's product surface involves five distinct actors, and the protocol's integrity depends on the clean separation of their roles. Any conflation (an actor performing functions outside their lane) breaks either the legal enforceability, the compliance posture, or the on-chain trust model.

**The Borrower** is an individual who owns a luxury asset and needs liquidity without selling. They interact with Vaulx through a dApp (web + mobile), submit their asset for appraisal, complete KYC once via Civic Pass or Blockpass, sign the off-chain credit instrument digitally, and receive stablecoin to their Solana wallet after custody is confirmed. They make monthly interest payments through the dApp and repay the principal at maturity (or renew for another cycle). They never interact with the Vault Program directly — the Loan Program mediates.

**The Lender** is an individual or institution supplying capital to the protocol's vaults, expecting pro-rata yield on active loans. Lenders come in two tiers. **Institutional lenders** (SCDs, FIDCs, family offices, DeFi credit funds, strategic LPs) deposit directly into dedicated Institutional vaults via a KYC-gated institutional onboarding flow; they receive vault shares representing pro-rata claim on the vault's assets. **Retail lenders** deposit through a tokenized FIDC wrapper: they connect a wallet, complete KYC (once), accept fund terms, deposit stablecoin, and receive FIDC quota tokens in their wallet. The FIDC aggregates all retail capital and acts as the single institutional creditor that deposits into the Retail-FIDC vault. From the lender's perspective it is a one-click on-chain experience; from a regulatory standpoint the lender is a CVM-registered quotaholder of a licensed fund.

**The Custodian** is a commercial partner (Brinks, Prosegur, Loomis, or a local vault operator) holding the physical asset during the loan term under a fiduciary custody agreement. The custodian operates as fiduciary custodian to the licensed lending partner (the SCD in Brazil), which is the formal owner of the asset under fiduciary alienation. Critically: the custodian holds a designated Solana keypair whose public key is registered in the Vault's state, and only that key can sign the `confirm_custody` transaction that flips the TRDC status from `PENDING_CUSTODY` to `ACTIVE`. The custodian also confirms asset release on repayment and ships or warehouses the asset for auction on default. In Brazil, Gitel's CFTV/IoT/access-control infrastructure can be layered onto custodian vault premises as an additional surveillance and audit track — a distinctive value-add that partner custodians gain by working with Vaulx.

**The Appraiser Network** consists of certified remote appraisers (online reports, 24h SLA) and in-person specialists (offline reports, 48h SLA after asset check-in), operating under a triangulated model with an automated market anchor (Chrono24 and WatchCharts medians for watches, GIA standards for jewelry, FIPE tables for vehicles). Each new intake passes through all three layers; any two-of-three divergence beyond tolerance fails the intake. Appraisers are paid per report, graded on a six-metric scoring system (appraisal convergence, completeness, SLA compliance, historical consistency, dispute rate, market anchoring), and renewed quarterly. Collusion between two appraisers is detectable through the third-check market anchor and triggers automatic review.

**The Licensed Lending Partner** — in Brazil, the SCD; in Colombia, a banking-licensed fintech; in Mexico, a Sofipo; in the US, a state-licensed pawnbroker — is the formal creditor of record. The partner issues the off-chain credit instrument (CCB with fiduciary alienation in Brazil, equivalent elsewhere), performs full KYC/AML under local regulation, disburses funds to the borrower through local payment rails (PIX in Brazil, direct stablecoin transfer in USDC vaults), and executes extrajudicial recovery in case of default. Vaulx's Vault Program and Loan Program are the technical infrastructure; the licensed partner is the legal wrapper. Revenue share is negotiated per jurisdiction — target 20% of net platform margin to the partner for Brazil Phase 0.

### 3.2 The borrower flow — end to end

**Step 1: Discovery and application.** Borrower finds Vaulx through marketing channels (content, paid acquisition, referrals), merchant partner networks (luxury watch resellers and dealers), institutional distribution partners (crypto exchanges, fintech affiliates), or word-of-mouth. Connects wallet to the dApp. Submits asset details: brand, model, reference number, photos, video, ownership documentation.

**Step 2: KYC.** Two KYC requirements apply: (a) BACEN-mandated KYC by the partner SCD for CCB issuance, which cannot be skipped or deferred under BR banking rules; (b) the on-chain credential the Vault Program checks, which is a Civic Pass or Blockpass attestation tied to the borrower's wallet. For a borrower new to Vaulx but already holding a valid credential from prior use of another Solana dApp or from a cross-platform issuer (Coinbase, Binance, Mercado Bitcoin via attestation bridge), the on-chain credential is recognized instantly and no re-verification is needed. The SCD's bureau check (CPF validation against Serpro/Federal Revenue + commercial bureau for biometric liveness) runs in parallel — it is a sub-3-minute flow for a first-time user and is fully automated. Returning users skip both.

**Step 3: Triangular appraisal with blinded identities.** The three validation layers run in parallel on anonymized identifiers. Each appraiser sees only a code name for the asset intake and never sees the other appraiser's submission or identity; the system enforces information separation to make collusion operationally difficult. Online appraiser (24h SLA, R$180–250) submits a remote report based on photos, video, and reference number. Offline specialist (48h SLA after asset check-in, R$380–520) submits an in-person report using timegrapher, caliber inspection, and authenticity checks. An automated market anchor runs against Chrono24 and WatchCharts in real-time (R$0 marginal). Crucially, the M6 market-anchor metric is computed *after* the appraiser submits — appraisers do not see market data during their assessment, eliminating anchoring bias and ensuring M6 is a genuinely independent third check. Convergence logic: if all three values fall within 10% of the median, the asset is accepted at the median. If the two human appraisers converge but both diverge >20% from the market, the system flags a collusion-pattern alert and triggers mandatory audit without revealing to either appraiser which pair was flagged. If convergence fails outright, the intake fails and the borrower is refunded the difference between the paid appraisal fee and the online-report cost (R$180–250 retention).

**Step 4: Offer and digital signature.** Vaulx's backend transmits the loan parameters (appraised value, LTV, loan amount, term, interest rate, monthly payment schedule) to the partner SCD via API. The SCD generates the CCB with fiduciary alienation on its existing banking infrastructure and sends it back to the borrower for digital signature through ICP-Brasil-compliant tooling — this is standard infrastructure used by every BR fintech (Clicksign, D4Sign, BRy or equivalent), costs a few reais per signed document, and takes minutes end-to-end. No bespoke signing system is built. Once signed by both borrower and SCD, the SCD returns the CCB hash and CCB external ID to Vaulx. The Loan Program's `create_ccb_trdc` instruction then mints a TRDC cNFT with status `PENDING_CUSTODY`, encoding `ccb_hash`, `ccb_external_id`, `custodian_id`, `appraisal_date`, LTV, loan amount, and `due_ts`. No money moves at this point — the TRDC simply records on-chain that a legally enforceable CCB exists off-chain.

**Step 5: Custody intake.** Borrower delivers the asset to the designated custody partner's São Paulo vault (Phase 0: in-person delivery only, no logistics chain). The custodian verifies the asset against the appraisal reports, issues a custody receipt, and signs the `confirm_custody` transaction on-chain. The TRDC flips to `ACTIVE`. Exactly one second later, the Loan Program calls `disburse_ccb` via CPI — the Vault Program validates the TRDC status, validates the CPI caller, and releases the stablecoin to the borrower's wallet. Total time from intake to disbursement: under 10 minutes.

**Step 6: Active term.** Borrower pays monthly interest (at 2%/month on R$25K principal = R$500/month) via the dApp. This monthly repayment structure is a deliberate design choice: defaults are caught within 30 days rather than at the 120-day end-of-term, materially reducing risk for lenders. Missed payment triggers a 5-day grace period, then a late fee. Two consecutive missed payments flip TRDC status to `OVERDUE` and notify the SCD, which can initiate early intervention before full default.

**Step 7: Resolution.** **Repayment path:** borrower pays accrued interest plus principal by maturity, the TRDC flips to `REPAID`, the Vault Program absorbs the repayment (increasing vault assets per share for lenders), and the custodian releases the asset. **Renewal path:** borrower pays accrued interest plus any late fees, signs an amendment to the CCB (`new_ccb_hash`), and the TRDC flips to `RENEWED` with a new `due_ts`. No new appraisal; the asset stays in custody. **Default path:** borrower fails to repay or renew by maturity. The SCD executes extrajudicial recovery under DL 911/69, the TRDC flips to `DEFAULTED` via `execute_af_default` (called by Squads 2/3 multisig), and the asset enters the liquidation queue. Privileged auction window opens to existing lenders and Felipe's watch-reseller network for 7 days before the asset goes to external liquidation channels. Proceeds settle the loan, and the 5% liquidation fee accrues to the protocol.

### 3.3 The lender flow — two tracks

**Institutional track.** SCD, FIDC, family office, or DeFi fund engages Vaulx directly. Legal onboarding: master lending agreement, KYC of the institution, authorized-signatory registration. Technical onboarding: institutional wallet is whitelisted as a depositor for the target Institutional vault (USDC or BRL). Deposit flow: institution deposits stablecoin directly into the vault via the Vault Program's `deposit_capital` instruction; receives vault shares pro-rata to their deposit; yield accrues as repayments come in; withdrawal is subject to vault utilization limits (max 80% utilization before withdrawal queue activates). Target Phase 0 institutional depositor: the partner SCD itself, providing pilot liquidity as part of the revenue-share agreement.

**Retail track (FIDC-wrapped).** Retail lender connects wallet to Vaulx retail dApp. First-time depositor goes through KYC via Civic Pass or Blockpass (3–5 minutes for fresh user, 30 seconds for cross-platform credential import, instant for existing Civic Pass holders). Reviews a 2-screen summary of fund terms (FIDC regulation, protections, risks, fee schedule) and accepts. Confirms Solana transaction: stablecoin is sent to a FIDC intake address. Off-chain, the fund administrator (Vortx, Oliveira Trust, or Singulare) reconciles the deposit, registers the lender as a CVM-registered quotaholder, and issues the FIDC quota token to the lender's wallet. The FIDC aggregates all retail capital and deposits into the Retail-FIDC vault (USDC or BRL) as the single institutional creditor. Yield accrues at the FIDC level; distribution to quota tokens is handled by the fund administrator; withdrawal is subject to the FIDC's regulated redemption terms plus vault utilization.

All KYC is mandatory, regardless of deposit amount. Lei 14.478/2022 governs VASPs in Brazil with zero threshold; FATF Travel Rule applies globally. KYC friction is solved through reusable on-chain credentials, not avoided — Civic Pass (native Solana, 2M+ verifications) is the primary integration, Blockpass with ZKP mode as secondary for privacy-sensitive lenders.

### 3.4 The privileged default auction — the lender retention flywheel

On default, the defaulted asset is offered first, for a 7-day window, to two whitelisted counterparty pools: (a) current lenders in the relevant vault (pro-rata access weighted by deposit size and tenure), and (b) Felipe's BR watch-reseller network (~20 top resellers, known buyers for luxury watches at scale). The offer is at a discount to the market anchor value (target: 15–20% below the M3 median on the appraisal date). Winners settle in stablecoin into the vault, which immediately goes to satisfy the CCB principal, interest, late fees, and the 5% liquidation fee to the protocol. Residual proceeds (if positive) return to the borrower per Brazilian fiduciary-alienation law.

This mechanism is strategically distinctive. For lenders, it turns default from a pure risk event into a yield-plus-optionality product: you earn yield while the loan is active, and if a default occurs, you have privileged access to a liquid physical asset at a discount — providing either resale profit or personal acquisition. For borrowers, it preserves dignity (no public auction, no credit-bureau black mark through the formal system) and maximizes recovery value (higher realized price than a forced open-market sale). For Vaulx, it creates the tightest possible lender-retention flywheel: every default is an opportunity to reward the most engaged lenders and the strongest counterparty network.

If the 7-day privileged window closes without a clearing bid, the asset goes to external liquidation — BR luxury auction houses (primary), and Vaulx-operated on-chain auction infrastructure (Phase 2). The 90%+ recovery rate modeled in the business case reflects the full stack.

### 3.5 The categorical roadmap — what gets accepted when

| Category | Appraisal | LTV | Custody | Phase |
|---|---|---|---|---|
| Luxury watches | Triangular V1.2 (online + offline + Chrono24/WatchCharts) | 50–60% | Partner vault | Phase 0 (MVP) |
| Fine jewelry | Triangular (report + GIA + market) | 40–55% against **resale** value | Partner vault | Phase 0.5 |
| Art (paintings) | Specialist + provenance + auction history | 30–45% | Climate-controlled | Phase 1 |
| Vehicles | FIPE table + mechanical inspection | 50–65% | Secured garage + insurance | Phase 1 |
| High-value NFTs | On-chain floor oracles | 30–50% | Solana PDA (on-chain) | Phase 2 |

The Anchor program accepts any compatible cNFT-represented collateral class; the bottleneck for category expansion is never the code — it is the combination of (a) appraiser availability, (b) custodian capability (climate control for art, secure garages for vehicles), and (c) secondary-market liquidity for default execution. Phase 0 launches with watches only to de-risk operational execution. Jewelry follows 4–6 months after Phase 0 launch (timeline extended from the prior 3-month target to allow GIA-certified gemologist network development — a materially scarcer specialist pool than watch appraisers).

**Phase 0 watch eligibility filter.** The categorical "luxury watches" scope is deliberately narrow at launch. In scope:

- **Rolex steel sports models** — Submariner, GMT-Master, Explorer (secondary market R$55K–R$90K)
- **Rolex gold/platinum and Daytona** — R$100K–R$300K+
- **Audemars Piguet Royal Oak / Royal Oak Offshore** — R$120K–R$250K
- **Patek Philippe Nautilus / Aquanaut / complications** — R$250K–R$500K+
- **IWC Portugieser, Panerai Luminor 1950, Vacheron Constantin classics** — R$40K–R$120K

Out of scope Phase 0 (revisit for Phase 1 with dedicated appraiser SLA): fashion/entry-level luxury (Tag Heuer, Longines, Tissot — secondary values typically below R$15K, insufficient for minimum ticket); vintage or unpapered pieces (secondary market illiquid, triangular-appraisal convergence unreliable).

**Minimum asset value R$50,000** (which generates the R$25,000 floor loan at 50% LTV). The floor is eligibility-only; the **book average must sit at R$74,000+ asset value / R$37,000+ loan** to clear the unit-economics threshold established in §5.2. Channel curation toward Daytona / AP Royal Oak / Patek Nautilus owners through Felipe's merchant network is the operational path to that book average.

**Phase 0.5 jewelry eligibility filter.** Fine jewelry economics differ from watches because resale recovery is structurally lower. Diamond resale typically prices at **30–60% of retail** — an R$80,000-retail ring liquidates for R$24,000–R$48,000 at auction. LTV must therefore be calculated against **resale floor**, not retail, or Vaulx is underwater on every forced-sale scenario.

In scope Phase 0.5:
- **GIA-certified natural diamond pieces ≥2ct** with grading report
- **Signed pieces by Cartier / Bulgari / Van Cleef & Arpels / Tiffany** with original papers, box, and purchase receipt
- **Minimum retail value R$100,000+** (required to generate a R$25K loan at 40% LTV against R$60K resale floor assumption)

Out of scope Phase 0.5 — despite appearance: gold jewelry by weight (TradFi's dominant segment, economics do not support Vaulx's appraisal stack), uncertified stones of any size, Brazilian artisan / local-goldsmith pieces without international secondary market. These are the Phase 2+ frontier if ever — not the near roadmap.

**UX roadmap note.** The launch dApp is a standard Solana wallet-connect experience targeting crypto-native borrowers and lenders. To reach mass-market non-crypto users (the majority of the asset-rich, credit-excluded segment in Brazil and LatAm), Vaulx's post-validation roadmap includes a white-labeled mobile app with familiar banking UX — IBAN or PIX-alias deposit rails, hidden custodial Solana wallet, FaceID-signed transactions, app-based repayment — built on a banking-as-a-service partnership (Dock, Swap, or Celcoin in Brazil). This is a Phase 2+ item detailed in Section 8; it is not in MVP scope and is flagged here only to signal that UX friction for non-crypto-native users is understood and addressed on the roadmap.

### 3.6 What the hackathon demo shows — core moments plus score-point moments

The Colosseum submission demo video (3 minutes, Devnet-only) is structured as a **core layer of six must-see moments** that prove the protocol works end-to-end, plus **three additional score-point moments** that demonstrate multi-currency, renewal mechanics, and the default auction flywheel. The additional layer is cuttable if build time tightens in the final week, but each score-point moment directly addresses a distinct dimension Colosseum judges reward (novelty, Solana integration depth, business potential).

**Core moments — must-see (the six frames that prove the mechanism):**

1. **Two lenders deposit USDC into the Institutional-USDC vault.** Solana Explorer shows the vault's associated token account balance go from zero to $30,000. One lender's wallet is labeled as institutional (whitelisted multisig), the other deposits with a Civic Pass constraint to demonstrate on-chain KYC enforcement.
2. **Borrower requests a R$25K-equivalent loan against a Rolex appraised at R$50K (50% LTV).** `create_ccb_trdc` is called. A TRDC cNFT mints with status `PENDING_CUSTODY`. Solana Explorer shows the full metadata: `ccb_hash`, `ccb_external_id`, `custodian_id`, `appraisal_date`, `loan_amount`, `due_ts`, `scd_pubkey`. The vault balance is unchanged.
3. **Custodian signs `confirm_custody` on-chain.** TRDC flips to `ACTIVE`. This is the critical state transition.
4. **`disburse_ccb` executes via CPI from the Loan Program to the Vault Program.** The vault's ATA balance drops by the loan amount. Borrower's wallet receives the stablecoin. Transaction trace is visible on-chain showing the CPI path.
5. **Borrower repays principal plus accrued interest.** The TRDC flips to `REPAID`. The vault's ATA balance shows a figure above the initial $30,000 — lenders have earned yield. The vault share value, visible in the dApp, increases accordingly.
6. **The failing test.** The Anchor test suite runs live. Among other tests, one test attempts to call `disburse_ccb` with a TRDC whose status is `PENDING_CUSTODY` (custody not confirmed). The test fails with the expected error: `CustodyNotConfirmed`. A second test attempts the call with a valid TRDC but from an unauthorized program — it fails with `UnauthorizedCaller`. These two failing tests, shown green in the suite, are the single most important frames in the entire submission: they visually prove that the custody gate and CPI caller validation are enforced in code, not in a process document.

**Score-point moments — layered on top (cut order: last three first if build time tightens):**

7. **Renewal flow — the margin lever made visible.** A second borrower, mid-term, calls `renew_ccb`. They pay accrued interest only, sign an amendment hash, and the TRDC transitions `ACTIVE → RENEWED → ACTIVE` with an updated `due_ts`. No new appraisal runs, no new custody intake. On-screen annotation highlights the business-model consequence: "Renewals drop variable cost by ~R$670 per event. The business compounds through customer retention, not through new-loan volume." This moment directly illustrates why the business model works at scale — judges see the unit economics engine, not just the loan cycle.
8. **Multi-currency architecture.** The demo flashes briefly to a second vault deployment: Institutional-BRL or Retail-FIDC-USDC, using the same Vault Program code deployed with different PDA seeds (`seeds = [b"vault_state", token_mint.key(), authority.key()]`). On-screen annotation: "Four-vault architecture at launch. One audit applies to all. Cross-currency lending without code changes." This reinforces Solana integration depth (judges value the primitive reuse) and signals global reach.
9. **Default branch with privileged auction.** Without waiting 90 days, the demo fast-forwards a third borrower to maturity without repayment. `mark_overdue` cron fires, TRDC goes to `OVERDUE`. Squads 2/3 multisig signs `execute_af_default` — TRDC transitions to `DEFAULTED`, off-chain the SCD initiates extrajudicial recovery, the asset enters the liquidation queue, and the privileged auction window opens to whitelisted counterparties (current lenders + watch-reseller network). One whitelisted buyer bids at 15% below M3 market anchor, the bid clears, proceeds return to the vault, and the 5% liquidation fee accrues to the protocol. On-screen annotation: "Default turned into yield-plus-optionality for lenders." This is the lender retention flywheel made concrete — uniquely distinctive vs. any existing RWA protocol.

The demo closes on the failing custody-gate test (Moment 6) regardless of whether the score-point moments are included. That frame is the mission-critical close: it is the visual proof that Vaulx enforces what every RWA protocol promises.

**Cut order, if build time tightens in the final 7 days:**
First: Moment 9 (default auction) — can be described verbally while showing the state machine diagram instead.
Second: Moment 8 (multi-currency vault) — can be shown as a static slide with the four-vault table.
Third: Moment 7 (renewal) — simulated as a terminal log rather than a live dApp flow.
The core six never cut.

### 3.7 Retention mechanics — the product architecture for renewal

Renewal rate is the single most consequential retention-side lever in the CLV equation (§5.3). The spec cannot credibly claim 60%+ renewal as a target without naming the product mechanisms that produce it. Four mechanisms are deployed as a coordinated system, each addressing a distinct failure mode of passive (do-nothing) retention:

**1. Day-60 renewal intent capture.** At day 60 of the 120-day term (midpoint), the dApp surfaces an in-app prompt asking the borrower to confirm renewal intention. Behavioral segmentation follows: high-intent borrowers (explicit confirm) are flagged for account-management touch; low-intent or non-responding borrowers enter a proactive outreach workflow (WhatsApp message via partner SCD's licensed channel, email, in-app reminder). This mechanism exists to eliminate passive attrition where the borrower simply forgets the renewal window and pays back to reclaim the asset, losing a natural renewal event.

**2. Day-90 early-renewal incentive.** At day 90 (30 days before maturity), confirmed early-renewal commitments receive either a **10% origination-fee reduction** on the renewed term OR a **0.1%/month rate concession**. Cash cost per retained renewal: approximately R$62–R$93 against an R$450 new-customer CAC replacement cost. This is the single most CAC-efficient retention spend in the model — always deploy. The mechanism trades a small margin concession for a high-certainty renewal at near-zero risk of loss.

**3. Tiered loyalty pricing.** Three-tier structure applied automatically: Cycle 1 at the standard base rate (2.2%/month at R$37K base ticket), Cycle 2 at 2.1%/month (−0.1pp), Cycle 3+ at 2.0%/month (−0.2pp). Rate concession per cycle is approximately R$50 at R$37K ticket at the third tier — net contribution remains strongly positive. The mechanism signals long-term customer relationship value back to the borrower and creates a commercial reason to stay within the Vaulx renewal stream rather than paying off and returning later with a fresh origination.

**4. Referral program.** Post-successful-repayment, the dApp offers R$200–R$300 fee credit (applied against origination fee on next cycle or payable at first renewal) for a successful referral completing their first loan. Effective CAC for referred borrowers lands at R$200–R$250 — approximately 60% below blended CAC — and referral-channel volume counts toward the channel-concentration target (§5.8 KPI #4). The mechanism compounds the merchant-network-heavy acquisition strategy by turning successful borrowers into distribution nodes.

**Implementation sequencing.** Mechanisms 1 and 2 deploy at Mainnet Beta (Phase 1) with the first cohort. Mechanisms 3 and 4 activate once the first 50 CCBs have completed at least one full cycle (approximately month 4–5 post-launch), because both require baseline behavior data for proper calibration. Before Month 4, retention is passive-plus-reminders; after Month 4, all four mechanisms are live. The renewal-rate target of 52% → 62% assumes all four mechanisms are operational by end of Y1.

**What this section is *not*.** It is not a claim that retention mechanics can compensate for wrong-ticket economics. At R$25K floor ticket, no retention mechanism closes the contribution-negative gap. Retention mechanics are a multiplier on a viable base, not a substitute for it. The Phase 0 strategy remains: curate to R$37K+ average ticket first, then deploy retention UX to lift renewal from 52% to 62%.

---

## 4. Technical Architecture

### 4.1 High-level architecture

Vaulx is two separate Anchor/Rust programs on Solana, plus an off-chain backend for KYC, custody oracle, CCB lifecycle integration with the licensed partner, and event monitoring.

**Vault Program.** Manages stablecoin liquidity. One instance per `(depositor_tier, token_mint)` combination; at launch, four instances: Institutional-USDC, Institutional-BRL, Retail-FIDC-USDC, Retail-FIDC-BRL. Handles `initialize_vault`, `deposit_capital`, `withdraw_capital`, `disburse_ccb` (via CPI only, from the Loan Program), `receive_repayment` (via CPI only), and `pause_vault` (emergency). The Vault Program is the sole custodian of lender funds; the Loan Program cannot access those funds except through the constrained CPI path.

**Loan Program.** Manages TRDC (Token Representing Credit Rights) lifecycle. Handles `create_ccb_trdc`, `confirm_custody`, `disburse_ccb` (which internally CPIs to the Vault Program), `repay_ccb`, `renew_ccb`, `execute_af_default`, and `mark_overdue` (called by hourly cron for maturity checks).

**TRDC.** A compressed NFT minted via Metaplex Bubblegum representing the on-chain state of each loan. Non-transferable during active loan lifecycle. Metadata includes: `ccb_hash` (SHA-256 of the off-chain CCB), `ccb_external_id` (CCB ID in the partner SCD's system), `status` (state machine enum), `loan_amount`, `due_ts`, `loan_token_mint`, `collateral_category`, `custodian_id`, `appraisal_date`, `scd_pubkey`, `vault_pubkey`. Status transitions are strictly enforced in program logic; only the authorized caller for each state transition can trigger it.

**Off-chain backend.** Five services: `ccb-service` (REST API integration with the partner SCD for CCB creation and status updates), `kyc-service` (integration with bureau + Civic Pass + Blockpass), `trdc-minter` (mints TRDC cNFTs after CCB is signed and `ccb_hash` is calculated), `custody-oracle` (receives webhook from custodian's physical-receipt workflow and calls `confirm_custody` on-chain), and `event-monitor` (Solana WebSocket with exponential reconnect + catchup via `getSignaturesForAddress`, to ensure no TRDC state transition is missed if the backend drops).

**Build ownership split.** Edson owns all on-chain Anchor programs (Vault, Loan, TRDC state logic, CPI validation, custody-gate enforcement) and the five off-chain backend services listed above. The frontend dApp (borrower onboarding, lender deposit flow, vault dashboard, demo UI for the hackathon) is owned by George and Marcelo, building on Marcelo's existing dApp prototype and accelerated by AI-assisted development tooling (Claude Code). This split enables parallel progress during the 19-day hackathon sprint and reduces Edson's critical path to the backend alone — which is where judges will concentrate their technical review. The API contract between frontend and backend is locked by Edson in the first 72 hours to avoid mid-sprint interface drift. Risk to flag: Marcelo's existing prototype was built against the V2.6 business model (SCD-as-lender, single vault). The V3.1 architecture (TRDC + dual-track vaults + Civic Pass gating) requires substantial rework of vault-interaction flows and lender onboarding UX — this rework is the primary frontend sprint task. Authentication flows, asset submission UI, and dashboard components from the prototype are largely reusable.

### 4.2 The custody gate — the single most important line of code

The instruction `disburse_ccb` in the Vault Program must satisfy three checks before releasing a single token:

1. **TRDC status check:** `require!(trdc.status == TRDCStatus::ACTIVE, VaulxError::CustodyNotConfirmed);`
2. **CPI caller validation:** the calling program must be the Loan Program, and the caller authority must be a PDA derived from a fixed seed in the Loan Program's namespace. Any other caller — including another program that has compromised itself — is rejected with `VaulxError::UnauthorizedCaller`.
3. **Vault balance source of truth:** the available balance is read from the actual associated token account (`vault_ata.amount`), never from a cumulative formula (`total_deposited - total_disbursed`). This eliminates an entire class of accounting-drift attack vectors.

If any of the three fails, the transaction reverts. If all three pass, the Loan Program's CPI proceeds, stablecoin moves from vault ATA to borrower wallet, and accounting state updates atomically.

This is the mechanism that makes Vaulx a real-world-custody protocol and not a DeFi wrapper. Every RWA protocol claims some version of custody enforcement; Vaulx enforces it in Anchor account constraints that the runtime cannot bypass. If that single `require!` line is ever removed — even during a refactor — the product's entire legal and competitive story collapses. This is why it is the single most monitored line in the codebase and why the test suite includes an explicit negative test (calling `disburse_ccb` with TRDC status `PENDING_CUSTODY` must fail) that runs on every commit.

### 4.3 The TRDC state machine

Seven states, with strictly enforced transitions:

```
PENDING_KYC ──► PENDING_CCB ──► PENDING_CUSTODY ──► ACTIVE ──┬──► OVERDUE ──► DEFAULTED
                                                              │
                                                              ├──► RENEWED ──► (loops to ACTIVE)
                                                              │
                                                              └──► REPAID
```

- `PENDING_KYC` → `PENDING_CCB`: partner SCD approves KYC via API callback
- `PENDING_CCB` → `PENDING_CUSTODY`: CCB signed by borrower and SCD, `ccb_hash` written to TRDC metadata
- `PENDING_CUSTODY` → `ACTIVE`: custodian signs `confirm_custody`. This is the critical invariant.
- `ACTIVE` → `REPAID`: borrower calls `repay_ccb` with principal + accrued interest + any late fees
- `ACTIVE` → `RENEWED` → `ACTIVE`: borrower calls `renew_ccb` with amendment hash; interest paid, term extended, no new appraisal
- `ACTIVE` → `OVERDUE`: `mark_overdue` cron triggers past maturity
- `OVERDUE` → `DEFAULTED`: Squads 2/3 multisig calls `execute_af_default` after extrajudicial process is complete

No state can be rewound. Every transition is atomic and emits an event consumed by `event-monitor` for off-chain accounting reconciliation.

### 4.4 The four-vault architecture

All four vaults use the same Vault Program code. Each vault is identified by a PDA derived from `seeds = [b"vault_state", token_mint.key(), authority.key()]` — the `token_mint` distinguishes USDC from BRL, and the `authority` distinguishes Institutional from Retail-FIDC.

| Vault | `token_mint` | `authority` (deposits gated to) | Target depositors |
|---|---|---|---|
| Institutional-USDC | USDC mainnet | Institutional-USDC multisig | SCDs, family offices, DeFi funds |
| Institutional-BRL | BRZ or BRLV (TBD) | Institutional-BRL multisig | BR-based institutions, local FIDCs |
| Retail-FIDC-USDC | USDC mainnet | FIDC-USDC admin (Vortx/etc) | Retail via tokenized FIDC |
| Retail-FIDC-BRL | BRZ or BRLV (TBD) | FIDC-BRL admin | BR retail via tokenized FIDC |

The code is identical; the deployment configuration differs. This is deliberate — it means all four vaults audit at the cost of one, all four benefit from any future security patch, and the TRDC and Loan Program do not need per-vault branching (the `vault_pubkey` in the TRDC metadata identifies which vault funded the loan).

Lenders cannot move capital between vaults through the protocol; withdrawals go back to the depositor's wallet, where they can independently deposit into a different vault (subject to re-KYC for the target tier if tiers differ). FX risk is structural and explicit: a lender in the BRL vault earns BRL yield and bears BRL FX exposure; a lender in the USDC vault earns USDC yield. No implicit cross-currency swaps at the protocol level.

### 4.5 KYC integration — Civic Pass as the primary layer

On the borrower side, KYC is executed by the partner SCD under BACEN rules. On the lender side, KYC is gated by the Vault Program itself: `deposit_capital` includes an account constraint requiring the depositor's wallet to hold a valid Civic Pass token. The pass is non-transferable, tied to a specific wallet, and reflects a verified identity through Civic's network (which recognizes attestations from Coinbase, Binance, and other major platforms — meaning a user who has already KYC'd elsewhere gets a Civic Pass in seconds rather than minutes).

For institutional depositors, the account constraint is a whitelist of authorized institutional wallets maintained by Vaulx's multisig. For retail lenders going through the FIDC, the FIDC administrator's off-chain KYC attestation is recognized by the protocol via a distinct credential type (`FIDC_QUOTAHOLDER`) — this is issued by Blockpass with a jurisdiction tag and tier metadata, and is equivalent in the Vault Program's account-constraint logic to a Civic Pass.

This architecture solves the historical crypto tension: the UX is on-chain, the credentials are reusable across dApps, PII never touches the blockchain, and regulatory compliance is satisfied without collapsing the Web3 ergonomics. For the hackathon demo, a Civic Devnet pass is integrated as an Anchor account constraint, and the failing test case shows that a wallet without a pass cannot call `deposit_capital` — a second reinforcing demonstration of enforcement-in-code.

### 4.6 Security posture

**Authority tiers.** Three levels: (L1) Vaulx Admin multisig (Squads, 2/3) — `confirm_custody`, TRDC status updates, vault pause; (L2) Licensed Partner multisig (Squads, 2/3, held by the SCD) — `deposit_capital`, `withdraw_capital`, `execute_af_default`; (L3) Operational hot wallet (bot) — `mark_overdue` cron only, isolated from vault access.

**CPI caller validation** is mandatory on `disburse_ccb` and `receive_repayment`. Without it, any program that gains execution on Solana could drain the vault. This is a known vulnerability pattern on Solana and the single most important code-level defense.

**Timelocks.** Changes to critical vault parameters (`min_ccb_amount`, `scd_authority`): 48-hour timelock. Vault pause: immediate (emergency). Capital withdrawal by the SCD for amounts exceeding 10% of TVL: 24-hour timelock.

**Additional protections.** Reentrancy guards via `is_in_progress` flag on disbursement operations. Integer overflow protection via `checked_add` and `checked_sub` in all accounting. Slippage guards on any token conversion paths (not used in MVP, but scaffolded). BRL stablecoin depeg monitoring: Jupiter Price API every 5 minutes; if deviation exceeds 3%, the BRL vaults auto-pause; fail-closed if the oracle is unreachable for >10 minutes.

**Mainnet audit.** Tier-1 Solana audit (OtterSec, Neodyme, or Halborn) is mandatory pre-mainnet. Budget: $30–80K. Triggered only after the legal structure is signed with the SCD partner, the TRDC spec is finalized against the partner SCD's API, and the full Devnet test suite passes — audit-before-spec-lock is wasted capital.

### 4.7 What is deliberately out of scope for the hackathon MVP

Out of scope, deferred to post-hackathon phases: real borrower-default flow (demo borrower always repays for the video); real-time price oracles for the BRL stablecoin (hardcoded price for demo); real KYC (mocked with Civic Devnet pass); secondary market for vault share positions; asset categories other than watches; mobile app (web-only dApp); Mainnet deployment. The MVP goal is to prove the mechanism, not to ship the business.

If scope compression is needed during the 19-day sprint, the cut order is: `execute_af_default` + `renew_ccb` first (retain only the happy path), then polish on the dApp, then frontend entirely (fall back to TypeScript script + Solana Explorer links), last resort hardcoded flat interest in place of accrual. The one thing that never cuts: the custody gate. If that `require!` line is ever removed during a refactor — even temporarily — the build is reverted immediately.

---

## 5. Business Model & Unit Economics

### 5.1 How Vaulx earns — the five revenue streams

Vaulx is a fee-based platform. It does not take balance-sheet risk on the loan book. Five revenue streams, structured so that the first three cover operations while the last two handle recovery and distress:

1. **Origination fee** — 2.5–3.0% of principal at disbursement. Sized to fully cover the triangular appraisal cost (R$560–770 per intake) and onboarding overhead. On a R$25,000 loan at 2.5%, this is R$625; appraisal cost is R$665 at the midpoint; the origination fee nets marginally negative vs. appraisal and is therefore treated as cost-recovery, not profit.
2. **Net platform margin** — the delta between borrower APR and (lender yield + partner revenue share). Target 4–6% annualized net. On a R$25K loan at 24% borrower APR and 11% lender APY, with 20% partner revenue share on the gross spread, the net platform margin is approximately 4.9% — comfortably inside the target band.
3. **Late payment fees** — 1–2% of overdue amount per missed monthly installment, accrued after a 5-day grace period. Modeled at 20% of loans incurring at least one late fee of ~R$150 blended average. This is a small but material recovery stream.
4. **Default processing fee** — 5% of recovered value, applied only when `execute_af_default` triggers. Covers the recovery workflow cost (legal notice, storage extension, auction administration, settlement reconciliation). Target default rate <5%.
5. **Auction commission** — Phase 2 feature: commission on privileged-auction clearings to whitelisted counterparties. Not modeled in MVP Year 1 numbers.

No balance-sheet spread capture. Vaulx never retains the full borrower-lender spread as a margin; the lender always takes the majority of interest paid, and the licensed partner takes its cut. The protocol's economics are the platform's economics, not a bank's economics.

### 5.2 The Base Case per-cycle P&L — ticket correctly calibrated, custody cost scaled

**Core correction from v2.** Earlier versions of this spec modeled economics at R$25,000 average ticket (the eligibility floor) and a flat R$750 custody+insurance charge. External market benchmarking (Suttons & Robertsons ~£6,000 average loan = ~R$44K; Borro luxury book average ~£55,000 = ~R$400K+; São Paulo secondary-market prices for Rolex Submariner R$55–70K, Daytona R$90–110K, AP Royal Oak R$120–180K, Patek Nautilus R$250–400K) shows the actual addressable book average for Vaulx's Phase 0 segment is approximately **R$37,000 base, R$50,000 premium-tier**. Simultaneously, custody cost does not sit at a flat R$750 — it scales with **asset value**, not with loan principal, because the custodian warehouses the asset, not the loan. Both corrections land in this table.

**Working assumptions (Base Case):** R$37,000 loan ticket, R$74,000 asset value (50% LTV), 120-day term with monthly interest payments, borrower APR 2.2%/month (= 26.4% annualized; spec convention is monthly simple interest × 4 months), 11% lender APY, partner revenue share 20% of gross platform spread, all-in custody at 0.5%/month × asset value (includes insurance on commercial-vault blanket policy at Phase 0 single-partner rate), and 20% of loans incurring late fees averaging R$150 blended.

**Three-tier per-cycle P&L at Phase 0 entry conditions (0.5%/month custody):**

| Line | R$25K (floor) · 2.0%/mo | R$37K (base) · 2.2%/mo | R$50K (premium) · 2.3%/mo |
|---|---:|---:|---:|
| Asset value (50% LTV) | R$50,000 | R$74,000 | R$100,000 |
| **Revenue — Cycle 1** | | | |
| Origination fee (2.5%) | +R$625 | +R$925 | +R$1,250 |
| Gross interest (rate × 4 mo) | +R$2,000 | +R$3,256 | +R$4,600 |
| Less: lender yield (11%/12 × 4) | −R$917 | −R$1,357 | −R$1,833 |
| Gross platform spread | +R$1,083 | +R$1,899 | +R$2,767 |
| Late fees (blended) | +R$40 | +R$40 | +R$40 |
| **Total Cycle 1 revenue** | **+R$1,748** | **+R$2,864** | **+R$4,057** |
| **Direct operational cost — Cycle 1** | | | |
| Triangular appraisal | −R$665 | −R$665 | −R$665 |
| Custody (0.5%/mo × asset × 4 mo) | −R$1,000 | −R$1,480 | −R$2,000 |
| Partner share (20% of spread) | −R$217 | −R$380 | −R$553 |
| cNFT mint + backend | −R$10 | −R$10 | −R$10 |
| **Total Cycle 1 direct cost** | **−R$1,892** | **−R$2,535** | **−R$3,228** |
| **Cycle 1 gross contribution** | **−R$144** | **+R$329** | **+R$829** |
| **Cycle 2+ (renewal) gross contribution** | **−R$104** | **+R$73** | **+R$249** |

**Reading this table.** The R$25K floor ticket shows **negative contribution at both cycles** under corrected custody scaling — i.e. the business loses money on every R$25K loan regardless of CAC, regardless of renewal. **R$25K is therefore floor-only positioning: an eligibility minimum, never targeted as an average.** The R$37K base case shows thin-positive contribution (+R$329 Cycle 1, +R$73 Cycle 2); it covers its direct costs but sits under CAC pressure. The R$50K premium tier shows robust contribution (+R$829 Cycle 1 alone clears typical CAC) and is what the unit economics look like when Felipe's merchant network concentrates the book toward Daytona / AP / Patek owners.

**At Phase 1 scale (0.3%/month custody with 500+ assets under volume SLA):**

| Ticket | Custody cost saving per cycle | Cycle 1 contribution | Cycle 2 contribution |
|---|---:|---:|---:|
| R$25K | +R$400 | +R$256 | +R$296 |
| R$37K (base) | +R$592 | +R$920 | +R$665 |
| R$50K (premium) | +R$800 | +R$1,629 | +R$1,049 |

Custody-cost reduction is the largest single operational lever in the model. Moving from 0.5%/month to 0.3%/month at volume adds roughly R$600 of per-cycle contribution at Base Case ticket — more than 10× the incremental gain from a 10-percentage-point renewal rate lift at comparable state.

**What is not on this table.** CAC is a separate line treated in §5.3 as part of the CLV equation — not in per-cycle direct cost, because it is a marketing decision that moves independently of loan mechanics. Fixed costs (team, ongoing legal, infrastructure, office) sit in §5.5 Y1 P&L. One-off startup costs (audit, legal setup, network onboarding, brand) are use-of-funds items in §5.4. The separations preserve a clean mapping between investment decisions and operating economics.

**Convention note.** Interest is calculated as monthly simple × number of months (2.2% × 4 = 8.8% effective over 120 days), matching how monthly installment loans actually accrue in Brazil. Lender yield is similarly monthly (11%/12 × 4 months). Versus the prior day-fraction convention (annualized ÷ 365 × 120), the monthly convention produces ~R$35–45 higher Cycle 1 contribution at Base Case. This is a methodological alignment with Brazilian CCB accounting, not a model tweak.

### 5.3 The cohort math — CLV vs. CAC across Phase 0 and Phase 1

Denominators matter. Four distinct concepts must be separated cleanly:

- **Unique borrowers** — individual clients who have ever taken a Vaulx loan
- **Originations** — Cycle 1 new loans issued in the period
- **Renewal events** — Cycle 2+ amendments to existing loans
- **Total cycle-events** — originations + renewals, the correct denominator for revenue analysis

The business case reduces to a single comparison: **cumulative gross contribution per customer** (the sum of Cycle 1 + all renewals that customer will ever do) **versus CAC**. If cumulative contribution exceeds CAC, every customer acquired is accretive; if not, acquisition spend is destroying value.

**Renewal rate benchmarks — correcting the prior citation.** The prior version of this spec cited the US National Pawnbrokers Association's 85% figure as a renewal ceiling. That number is a loan-*redemption* rate (borrower repays and reclaims the asset) — economically the opposite of renewal for Vaulx, since redemption ends the revenue cycle. The correct external benchmark is the University of Bristol 2020 study of UK pawn lending (85,000 loans observed), which reports **25% actual rollover rate, 62% redemption, 14% forfeit**. Adjusted upward for luxury-asset profile (emotional attachment to signature-piece watches + asymmetric cost of forced sale) and Brazilian low-default lending culture (TradFi's penhor reports 0.6% missed-payment rate), a defensible Phase 0 starting assumption is **50–55% renewal**, rising to **60–65%** with active retention UX (§3.7). 70%+ is a stretch target, not a base case.

**Expected total cycle-events per customer**, using the geometric formula 1/(1−*p*) where *p* = renewal rate per cycle:

| Renewal rate (*p*) | Expected cycle-events | Expected renewals |
|---|---:|---:|
| 40% (pessimistic) | 1.67 | 0.67 |
| 52% (Realistic Base — Bristol +luxury adjustment) | 2.08 | 1.08 |
| 62% (With retention UX mechanics) | 2.63 | 1.63 |
| 70% (Stretch target — strong retention) | 3.33 | 2.33 |
| 80% | 5.00 | 4.00 |

**CLV matrix — R$37K Base Case ticket, across operating regimes and CAC scenarios.** Two axes matter: (a) custody cost regime (Phase 0 entry at 0.5%/month vs. Phase 1 scale at 0.3%/month) and (b) CAC channel mix (R$270 merchant-channel-dominated, R$450 blended target, R$580 realistic mixed-channel). Each cell is cumulative gross contribution at stated renewal, minus CAC:

**At 52% Realistic Base renewal:**

| CAC | Phase 0 entry custody | Phase 1 scale custody |
|---|---:|---:|
| R$270 (Felipe network, 70%+ channel concentration) | +R$137 | +R$1,370 |
| R$450 (target blended) | **−R$43** (marginal negative) | **+R$1,190** (robust) |
| R$580 (realistic mixed-channel) | −R$173 | +R$1,060 |

**At 62% renewal (retention UX active):**

| CAC | Phase 0 entry custody | Phase 1 scale custody |
|---|---:|---:|
| R$270 (Felipe network) | +R$177 | +R$1,735 |
| R$450 | −R$3 (break-even) | +R$1,555 |
| R$580 | −R$133 | +R$1,425 |

**The honest finding.** At Phase 0 entry conditions (R$37K base ticket, 0.5%/month custody, 52% realistic renewal, R$450 target CAC), **CLV is approximately −R$43 per customer — thin negative**. This is neither a catastrophe nor positive; it is a cohort-investment dynamic where Y1 customers are acquired at small loss to build a renewal book that matures at Phase 1 scale. With retention UX lifting renewal to 62%, CLV closes to break-even (−R$3). With channel concentration bringing CAC to R$270, CLV is already positive at entry (+R$137 at 52%, +R$177 at 62%).

**At Phase 1 scale** (0.3%/month custody at 500+ assets under volume SLA), **CLV is +R$1,190 at Base Case assumptions** and +R$1,555 with retention UX — decisively positive. The business works robustly at scale; the operational task of Y1 is to reach Phase 1 conditions, not to find a version of Phase 0 that already produces Phase 1 economics.

**Break-even renewal thresholds at R$37K ticket, Phase 0 entry custody (the hardest regime):**

| CAC | Break-even renewal rate |
|---|---:|
| R$270 (Felipe network) | < 40% (any realistic renewal works) |
| R$450 (target blended) | **≈62%** |
| R$580 (realistic mixed) | **≈74%** |

At Base Case CAC R$450, break-even is 62% renewal — achievable only with retention UX deployed. At Realistic Mixed CAC R$580, break-even is 74% — not achievable in Phase 0. **The channel concentration decision (70%+ Felipe network vs. balanced mix) is as important as the renewal rate lever for Phase 0 survivability.**

**Why R$25K floor-only matters.** At R$25K ticket under corrected custody scaling, both Cycle 1 and Cycle 2 are contribution-negative before CAC is considered. More volume at R$25K makes the loss worse, not better. The floor exists for eligibility inclusion (a Rolex Submariner owner needing R$25K should not be turned away); it is never targeted as an average book tilt. The model book average must sit at R$37K+, earned by channel curation and merchant-partner concentration on Daytona / AP / Patek / Nautilus owners.

**The three-lever thesis, updated.** Under corrected custody math, three levers still compound but the hierarchy has shifted:

1. **Ticket correctly calibrated (biggest lever):** R$37K base vs. R$25K floor is the difference between viable and unviable. Every +R$5K of ticket adds roughly +R$100/cycle of gross contribution. Channel curation toward Felipe's premium network is the cleanest path.
2. **Custody cost reduction at volume (second biggest):** 0.5% → 0.3% custody at 500+ assets frees R$592/cycle at R$37K ticket, R$800/cycle at R$50K. This is the Phase 0 → Phase 1 economic inflection.
3. **Retention UX (reliable but moderate):** 52% → 62% renewal rate adds ~R$40/cycle at R$37K Phase 0 contribution, ~R$350 at Phase 1. Important but smaller in magnitude than ticket or custody levers.

**What this means operationally.** Year 1 is a **lever-validation year**, not a volume race. Top-of-funnel spend at R$450 CAC into a R$37K-average book at Phase 0 custody *without* channel concentration is exactly the configuration that loses money cohort-on-cohort. The survivable path requires either (a) 70%+ channel concentration through Felipe's network (brings CAC to R$270, CLV positive at entry) or (b) deliberate growth pacing at Phase 0 while custody scale is earned, with renewal UX deployed to bridge the gap. The KPI dashboard (§5.8) prioritizes these three levers as co-equal first-tier metrics.

*Math note.* Interest convention is monthly simple (2.2% × 4 = 8.8% over 120 days), matching Brazilian CCB accounting. CLV uses geometric expected cycle-events 1/(1−*p*). Custody is 0.5%/month × asset value × 4 months at Phase 0, 0.3%/month at Phase 1 scale. All per-cycle contribution figures inherit from §5.2 tables.

### 5.4 Use of Funds — pre-origination setup capital

Before Vaulx originates a single loan, a defined set of one-off investments must be completed: smart contract audit, legal entity setup, SCD partnership and CCB legal framework, custody-network and appraiser-network onboarding, brand and dApp build, KYC integration, and operational ramp. These are capital deployments, not ongoing opex, and should never be confused with Year 1 operating losses. This section separates them explicitly so that the Y1 P&L in §5.5 reflects only ongoing economics.

**Setup capital requirement — Base Case, 6-month ramp period:**

| Line | Amount (R$) | Amount (USD @ 6:1) | Notes |
|---|---:|---:|---|
| Smart contract audit (OtterSec or equivalent) | 250,000 | 42,000 | Single pre-mainnet audit; one full engagement |
| Legal entity setup (BR LTDA + US Delaware/Cayman) | 60,000 | 10,000 | Incorporation, IP assignment, founder agreements |
| SCD partnership legal + negotiation | 60,000 | 10,000 | Fintech counsel for partnership LOI + definitive agreement |
| CCB + fiduciary alienation legal framework | 45,000 | 7,500 | Template drafting, BACEN cross-check, Lei 14.711/2023 compliance |
| Custody network onboarding | 200,000 | 33,000 | Partner vault setup, insurance rider negotiation, operational integration with first custodian |
| Appraiser network onboarding (10–15 appraisers) | 70,000 | 12,000 | Recruitment, certification verification, SLA agreements, training |
| Brand + website + dApp frontend build | 100,000 | 17,000 | Logo, brand system, marketing site, React/Next.js dApp |
| KYC integration (Civic Pass + BR bureau APIs) | 50,000 | 8,000 | Sub-3-minute onboarding flow, attestation bridge |
| Insurance setup + initial annual premium | 80,000 | 13,000 | Custody policy binder, D&O Phase 0, cyber liability |
| Founder compensation during 6-month ramp (5 × R$18K × 6) | 540,000 | 90,000 | Ramp team through setup; below-market sustainable rates |
| Infrastructure + tools (6-month ramp) | 40,000 | 7,000 | Cloud, monitoring, dev tools, collaboration stack |
| Contingency reserve (~15%) | 220,000 | 37,000 | Unmodeled costs across all lines |
| **Total setup capital** | **1,715,000** | **286,000** | **Before first loan origination** |

**Why each line exists.** The smart-contract audit is non-negotiable for mainnet; without it the lender-side of the protocol is untrustable. The legal entity setup is a month-one item that unlocks banking, tax registration, and the SCD partnership discussion. The SCD partnership legal line is what the BR fintech counsel will cost — a one-off 2-to-4-month engagement, not a retainer. Custody-network onboarding is where serious capital lives: partner vault integration, insurance rider underwriting (specialty luxury goods at Phase 0 scale costs real money), and the physical-to-digital bridge workflows that the protocol depends on. The 6-month ramp of founder comp is honest ramp-mode pay — not equivalent to market rate for experienced operators, but sustainable, and it gets the team through setup without burning pre-seed cash on salaries-in-lieu-of-runway.

**What is NOT in setup capital.** Ongoing legal retainer, ongoing insurance premium (years 2+), Year 1 team cost, Year 1 marketing spend, Year 1 CAC. Those are §5.5 items. Setup capital is strictly the one-time deployment that turns a protocol into an operating business.

**Capital sourcing logic.** Setup capital comes from pre-seed round (Colosseum accelerator $250K at minimum, plus complementary pre-seed raise targeting $500K–$1M total). Of the pre-seed, approximately R$1.7M / $286K goes to setup; the remainder serves as Year 1 operating runway against the losses modeled in §5.5. The full capital ask and its staged deployment are detailed in §8 (Roadmap & Capital Ask).

### 5.5 Year 1 P&L — volume scenarios, Phase-staged operations

**Operational context.** Phase 0 is São Paulo, watches only, single custody partner on SLA, minimum ticket R$25K. Throughput ceiling at Phase 0 configuration: 10–30 new CCBs per month steady-state, ~360/year at the top of the range. Crossing that ceiling requires either a second SP custody partner (adds ~30 CCBs/month capacity) or expansion to a second city (Rio de Janeiro, adds a parallel operational lane).

The three Y1 scenarios below correspond to three different operational trajectories, not to three different demand scenarios. Demand is not the constraint.

- **Conservative (500 originations).** Phase 0 for the full year, single custody partner, ~42 CCBs/month average. Requires process maturity by month 3 and steady-state execution thereafter. No city expansion, no second partner. Achievable with current team.
- **Base (1,200 originations).** Phase 0 in H1 (~50/mo average), then Phase 1 trigger at month 6–7 — second SP custody partner comes online, appraiser network depth doubles, H2 averages ~150/mo. Requires successful partner addition and process scaling. The realistic trajectory if Y1 milestones hit.
- **Optimistic (2,000 originations).** Aggressive Phase 1 ramp. H1 matches Base (~50/mo); H2 runs at ~275/mo with three SP custody partners and a Rio launch at month 8–9. Requires hiring, second-city operational setup, and multi-partner custody reliability within 12 months. The top achievable trajectory without stretching execution credibility.

**Y1 P&L by scenario — R$37K Base Case ticket, Phase 0 entry custody, two CAC scenarios:**

Revenue and direct-cost lines scale off the §5.2 per-cycle figures at R$37K ticket (Cycle 1 revenue R$2,864, Cycle 1 direct cost R$2,535, Cycle 2 revenue R$1,938, Cycle 2 direct cost R$1,865; gross contribution +R$329 Cycle 1, +R$73 Cycle 2).

| Line | Conservative (500) | Base (1,200) | Optimistic (2,000) |
|---|---:|---:|---:|
| New originations | 500 | 1,200 | 2,000 |
| Renewal events in Y1 (~30% of total events) | 150 | 360 | 600 |
| Total cycle-events | 650 | 1,560 | 2,600 |
| | | | |
| **Revenue** | | | |
| Gross revenue (Cycle 1 × R$2,864 + renewals × R$1,938) | R$1,723K | R$4,134K | R$6,891K |
| Direct operational cost (Cycle 1 × R$2,535 + renewals × R$1,865) | (R$1,547K) | (R$3,713K) | (R$6,189K) |
| **Gross contribution (before CAC)** | **+R$176K** | **+R$421K** | **+R$702K** |
| | | | |
| **Sales & Marketing — Scenario A: R$450 target blended CAC (Felipe-network-heavy)** | | | |
| CAC (R$450/new origination) | (R$225K) | (R$540K) | (R$900K) |
| Fixed S&M | (R$180K) | (R$180K) | (R$180K) |
| **G&A** (team + legal + insurance + infra — detail below) | **(R$1,340K)** | **(R$1,340K)** | **(R$1,340K)** |
| **Operating result — A** | **(R$1,569K)** | **(R$1,639K)** | **(R$1,718K)** |
| **Operating result USD @ 6:1** | **($262K)** | **($273K)** | **($286K)** |
| | | | |
| **Sales & Marketing — Scenario B: R$580 realistic blended CAC (mixed channels)** | | | |
| CAC (R$580/new origination) | (R$290K) | (R$696K) | (R$1,160K) |
| Fixed S&M | (R$180K) | (R$180K) | (R$180K) |
| G&A | (R$1,340K) | (R$1,340K) | (R$1,340K) |
| **Operating result — B** | **(R$1,634K)** | **(R$1,795K)** | **(R$1,978K)** |
| **Operating result USD @ 6:1** | **($272K)** | **($299K)** | **($330K)** |

**G&A detail (same across all scenarios):** founder comp (5 × R$18K × 12 = R$1,080K), legal retainer + accounting + tax (R$100K), ongoing insurance (R$60K), office + infrastructure + tools (R$60K), admin + buffer (R$40K). Total R$1,340K.

**Reading this table.** Operating losses range from approximately **R$1.57M–R$1.98M (~$262K–$330K USD)** across the scenario matrix — wider than the prior v2 draft because (a) custody scales with asset value at higher ticket, absorbing some of the ticket-growth benefit, and (b) Scenario B models realistic mixed-channel CAC at R$580 rather than assuming best-case R$450. **Scenario A (CAC R$450) requires 70%+ channel concentration through Felipe's merchant network to achieve.** If early operating data shows channel mix tracking closer to 50/50, Scenario B becomes the operating base and adds R$65K–R$260K of additional Y1 loss.

**Operating losses are dominated by G&A (R$1.34M flat) and CAC (scaling from R$225K Conservative to R$1.16M Optimistic-Scenario-B).** Gross contribution is positive in all scenarios but small in absolute terms relative to fixed-cost base. This is a normal pre-scale lending-platform profile — revenue-per-loan economics are thin in early periods until the renewal book compounds.

**Year 2 trajectory under Base Case (1,200 Y1 originations at 52% realistic renewal rate):**

- Y1 cohort renewals carrying into Y2: 1,200 × 52% × (~1.6 Y2 renewal opportunities per loan average) ≈ **~850 renewal events in Y2 from Y1 cohort**
- Y2 new originations: target 2,000–3,000 as Phase 1 custody unlocks at 500+ assets and second SP partner or Rio launches
- Y2 cycle-events: 2,850–3,850
- Y2 gross contribution at Phase 1 custody (0.3%/mo, unlocked mid-Y2): mixed-regime estimate ~**R$900K–R$1.5M** depending on when Phase 1 custody activates
- Y2 CAC (2,500 new × R$500 blended): R$1,250K
- Y2 fixed opex with team expansion: ~R$2.2M
- **Y2 operating result: approximately (R$1.8M–R$2.6M)** — still negative, but with the Phase 1 custody inflection the *contribution side* begins to scale faster than cost. The marginal contribution from Y1 cohort renewals is pure margin at zero incremental CAC.
- **Y3 operating result:** potentially positive under favorable assumptions (Phase 1 custody fully active, retention UX proven at 60%+, ticket drifted toward R$40K+) or still modestly negative under conservative (0.5%/mo custody persists, 52% renewal, R$37K ticket unchanged)

**Break-even horizon: Y3 to Y5.** Under lever-improved assumptions (Phase 1 custody at 0.3%/mo, retention UX delivering 60%+ renewal, average ticket drifting to R$40K+), **operating break-even lands in Y3**. Under conservative assumptions (single custody partner holding at 0.5%/mo, renewal flat at 52%, no ticket drift), **break-even extends to Y4 or Y5**. The single point estimate "Y3 break-even" in the prior version was an overstatement — the honest investor framing is a range with named levers that determine where in the range the business lands.

**Four binding assumptions flagged for investor Q&A:**

1. **Book average ticket ≥R$37K maintained.** Requires channel curation toward Felipe's premium network. If book drifts toward R$25K floor, unit economics compress severely (R$25K ticket is contribution-negative at Phase 0 custody, per §5.2). Validated in first 50 CCBs.
2. **Channel concentration 70%+ through Felipe's merchant network achievable in Phase 0.** Required for CAC at R$450 (Scenario A). If mix drifts to 50/50, Scenario B applies and loss widens ~R$65–260K.
3. **Custody cost reduction path 0.5% → 0.3% at 500+ assets is commercially negotiable.** Without this, Y3+ economics compress materially. Volume-SLA with Brinks/Prosegur/Loomis is the primary path.
4. **Retention UX delivers 52% → 60%+ renewal rate lift within Y1.** §3.7 mechanics (Day-60 intent capture, Day-90 early-renewal incentive, tiered loyalty pricing, referral program). If retention UX underperforms, Y3 break-even slips.

### 5.6 Pricing-position sensitivities — Position 1 and Position 4

The Base Case (Position 2 at R$37K ticket) above is not the only viable configuration. Two alternatives are actively modeled and revisited after the first 50 Phase 0 CCBs based on observed borrower profile, renewal behavior, and real operational cost data:

**Position 1 — loss-leader at R$20K minimum ticket.** Lowers the entry threshold to capture the lower watch tier (~R$12,000–R$40,000 asset value, sub-R$20K loans). Under corrected custody scaling, Cycle 1 contribution at R$20K ticket is approximately **−R$180** and Cycle 2 is approximately **−R$130** — both cycles contribution-negative at Phase 0 entry custody. This position is **structurally non-viable at Phase 0 entry conditions**; it becomes viable only when Phase 1 custody (0.3%/mo, 500+ assets SLA) is active AND renewal rate is sustained above 50%, at which point both cycles turn marginally positive. Position 1 is retained as a sensitivity but is **not recommended as a Y1 strategy** — the operational cost of building volume in a contribution-negative book exceeds any benefit from broader market capture.

**Position 4 — premium-tier concentration at R$50K+ ticket.** Targets the Daytona / AP / Patek / Nautilus segment where Felipe's merchant network is strongest. Cycle 1 contribution at R$50K ticket is **+R$829 at Phase 0 entry custody** — already exceeding any realistic CAC. CLV is positive at any renewal rate and any CAC channel mix. At Phase 1 scale, Cycle 1 contribution reaches **+R$1,629**, producing CLV of +R$2,800–R$3,400 per acquired customer. Challenged by a narrower borrower pool (sub-1% of the BR luxury watch market by ticket-value concentration) and tighter channel dependency (Felipe's network is the feasible acquisition vector). Optimistic on margin — materially *more* optimistic under corrected custody math than the v2 draft suggested — and realistic if acquisition can be tightly curated through merchant partnerships and high-end channels.

**The corrected finding on positioning.** Under the v2 draft's flat R$750 custody assumption, Positions 1 / 2 / 4 showed modest sensitivity differences. Under corrected scaling-with-asset-value custody, **Position 4 dominates Position 2 decisively** and **Position 1 is structurally unviable at Phase 0 conditions**. The commercial decision after the first 50 CCBs is effectively binary: drift toward Position 4 (premium tier concentration, tighter book, stronger economics) or maintain Position 2 (R$37K base mix, larger addressable pool, thinner margins during Phase 0). Position 1 is eliminated from the canonical set.

The canonical business case in investor conversations uses Position 2 (R$37K base) as Base Case, with Position 4 (R$50K+ premium) shown as the demonstrated upside when channel concentration executes. A final commercial decision between Position 2 and Position 4 — or a hybrid book mix — is finalized after the first 50 Phase 0 CCBs.

### 5.7 International sensitivity — does the model hold at scale?

The Brazil unit economics assume a specific cost structure: R$665 appraisal, R$750 custody+insurance for 120 days on a R$50K asset, 20% partner revenue share. These cost drivers shift by market. The question for investors and for Vaulx's international roadmap is whether the 4–6% net platform margin target is defensible in other jurisdictions.

**Key cost drivers by market type:**

| Market cluster | Appraisal cost index | Custody cost index | Partner cut | Borrower APR | Lender APY |
|---|---|---|---|---|---|
| Brazil (Base) | 1.0x | 1.0x | 20% | 24% | 11% |
| LatAm (CO, MX, PE, CL) | 0.8–1.2x | 0.7–1.1x | 15–25% | 18–28% | 10–12% |
| US (FL, NY late 2027+) | 1.5–2.0x | 1.2–1.6x | 25–30% | 18–24% | 8–10% |
| EU (post-2028, remote consideration) | 2.0–3.0x | 1.0–1.4x | 20–30% | 10–15% | 5–7% |

Two observations. First: net platform margin holds around 4–6% in LatAm under realistic assumptions — LatAm is the natural extension, and the mechanism is portable. Second: the US and EU markets operate at materially lower nominal interest rates, which compresses the absolute spread available, but *also* compresses lender yield expectations (developed-market lenders benchmark against Treasuries and Bunds, not against emerging-market alternatives). The net platform margin target holds; the dial adjustments are at the borrower APR and lender APY ends, not at the protocol take rate.

**The international defensibility conclusion:** the 4–6% net platform margin is internationally robust because it is a function of operational complexity (appraisal, custody, legal, compliance) rather than of interest-rate environment. A borrower paying 12% in Germany and a borrower paying 24% in Brazil both generate the same platform work. The borrower APR and lender yield move in lockstep with local risk-free rates; Vaulx's cut of the work stays roughly constant as a percentage.

### 5.8 Operational KPIs — Year 1 dashboard

Seven metrics matter for Year 1 execution. Everything else is downstream:

1. **Renewal rate** — realistic base **52%**, target with retention UX **62%**, stretch **70%**. The single most important retention-side lever in the CLV equation. Tracked monthly, segmented by cohort. (Prior draft citing 60%/70% was benchmarked against an NPA 85% figure that was redemption, not renewal; see §5.3 for the corrected Bristol-study benchmark.)
2. **Average ticket** — target **R$37K base, R$45–50K with channel concentration**. R$25K is floor only (contribution-negative at Phase 0 custody); ticket drift below R$30K is a critical incident flag, not a benign observation. Tracked monthly.
3. **Custody cost as %/month of asset value** — target path from 0.5% (Phase 0 single-partner) to 0.3% (Phase 1 scale, 500+ assets SLA). Each step down lifts gross contribution per cycle-event by roughly R$500–800 at base-to-premium ticket. Tracked per contract negotiation.
4. **CAC** — realistic base **R$450–580 blended** (Felipe-network-concentrated vs. mixed-channel). Channel mix explicitly tracked: target 70%+ through merchant-network / referral / Felipe's Discord for the R$450 target to hold.
5. **Default rate** — target <5%. Tracked monthly, segmented by borrower acquisition channel.
6. **Custody-chain integrity** — 100%, non-negotiable. Every custody record must match the on-chain TRDC state. Any divergence is a critical incident.
7. **Appraisal SLA compliance** — target >95% of online reports within 24h, >90% of offline reports within 48h post-check-in.

NPS (target >80, post-settlement survey, quarterly) and technical KPIs (audit-clean migration from Devnet to Mainnet, zero critical vulnerabilities post-audit, <400ms average transaction finality, vault-balance-equals-ATA-balance always) sit on the secondary dashboard reported quarterly alongside investor-facing metrics (TVL, cumulative loan volume, revenue per cycle-event, operating margin trajectory).

### 5.9 Macroeconomic sensitivity — Brazilian rate cycle exposure

The Brazilian Selic rate was cut to 14.75% in March 2026, the first reduction in two years, with consensus forecasts (Capital Economics and others) projecting 11.25% by end-2026. Vaulx's economics interact with the rate cycle in two opposing ways:

**Risk — narrowing borrower-side spread.** As Selic falls, formal-sector credit rates for Vaulx's target borrower (SPB-excluded upper-middle-class consumers) also ease, though slowly. The 24–30% APR Vaulx offers becomes marginally less differentiated vs. formal personal loans. The advantage remains material (formal consumer rates for sub-prime or SPB-excluded profiles will stay 18–28% even at Selic 11%), but the competitive moat narrows.

**Opportunity — compressing lender-yield expectations.** As the risk-free benchmark falls, USDC lender yield expectations follow. A lender who accepted 11% APY at Selic 15% may accept 9–10% APY at Selic 11%. If Vaulx's lender-side yield drops 1–2 percentage points while borrower rates hold, platform margin expands by the equivalent amount. At R$37K ticket over 120 days, each 1pp of lender-yield compression adds approximately **R$123 of gross platform spread per cycle-event** — pure margin, at no operational cost. A 2pp lender-yield compression adds ~R$246/cycle-event, roughly offsetting a 0.5%→0.3% custody improvement.

**Base case assumption:** rate cycle is a net-neutral tailwind — compressed lender yield roughly offsets narrowed borrower spread. Model does not bake in positive rate-cycle impact. If rates move faster than consensus, this is genuine optionality that surfaces in §5 P&L as margin expansion.

---

## 6. Regulatory Path

### 6.1 The three-stage ladder

Vaulx's regulatory architecture escalates across three stages, each unlocking a larger depositor and borrower pool while building on proven foundations from the prior stage.

**Stage 0 (Phase 0 MVP → first mainnet cohort): SCD partnership, Vaulx as technology and origination layer.** The partner SCD — a BACEN-licensed Sociedade de Crédito Direto under Resolução 4.656/2018 — is the formal creditor of record. The SCD issues the CCB with fiduciary alienation (Lei 10.931/2004 + DL 911/69 + Lei 14.711/2023), performs KYC/AML-CFT on borrowers (mandatory under BACEN rules), and executes extrajudicial recovery in case of default (procedurally codified by CNJ Provision 196 of June 2025). Vaulx provides origination rails, on-chain state management via TRDC, custody orchestration, lender interface, and servicing. Revenue-share agreement between Vaulx and SCD, target 20% of net platform margin to SCD. Timeline to first signed agreement: 2–4 months from dedicated effort with a specialized fintech legal counsel. Pilot liquidity for the first 10–20 CCBs comes from the SCD's own balance sheet as part of the revenue-share deal — this is the cleanest source of Phase 0 liquidity and does not require any retail lender onboarding during the initial operational proof.

**Stage 1 (Phase 1 BR validation, Brazil scale + retail lender access): add FIDC-tokenizado as the retail lender wrapper.** Once the SCD partnership is operationally proven and the first cohort is in custody, retail on-chain lender access is enabled through a tokenized FIDC (Fundo de Investimento em Direitos Creditórios) under CVM Resolução 175. Vaulx contracts a licensed fund administrator who handles fund constitution, CVM registration, and quotaholder KYC/AML — FIDC-as-a-service is an established product offering in Brazil, with multiple vendors competing on cost and operational simplicity. Retail lenders deposit stablecoin via the dApp, receive FIDC quota tokens in their wallets, and the FIDC deposits into the Retail-FIDC vault as a single institutional creditor. This is the structure validated by the CVM's March 2025 reversal on the Mercado Bitcoin tokenized-FIDC-quota case — legally clean, operationally live, and specifically designed for credit rights portfolios. The exact vendor selection, cost structure, and timeline will be evaluated after Phase 0 operational validation; the decision will reflect real retail-lender demand signal and Phase 1 capital availability.

**Stage 2 (Phase 2 LatAm expansion, multi-jurisdiction scale): own SEP license if retail P2P volume justifies + equivalent partner architecture per jurisdiction.** If retail on-chain lender deposits grow to a scale where dependency on the FIDC administrator creates fee drag or regulatory bottleneck, Vaulx applies for its own SEP (Sociedade de Empréstimo entre Pessoas) under CMN Resolução 5.050/2022 — the regulatory vehicle specifically designed for P2P lending platforms in Brazil. R$1M minimum capital, 6–12 months BACEN approval process. In parallel, each LatAm expansion market operates on its own licensed-partner architecture: a Colombian fintech bank with prenda-sin-tenencia (the local equivalent of fiduciary alienation), a Mexican Sofipo with local extrajudicial enforcement, a Peruvian or Chilean equivalent. The SCD-in-Brazil structure is the template — the legal vehicle varies by country, the operational architecture is identical.

### 6.2 Legal blockers — what must be in place before mainnet

The following items are prerequisites for any production code touching real capital. No audit, no mainnet deployment, no retail lender onboarding until these are complete:

1. **Engage specialized Brazilian fintech legal counsel** covering banking + capital markets + crypto. Budget R$50–150K for Phase 0 work (CCB structuring, SCD partnership contract, TRDC classification opinion, LGPD compliance review).
2. **Sign the SCD partnership agreement** including revenue-share terms, operational SLAs, KYC integration specification, CCB issuance workflow, and pilot-liquidity commitment.
3. **Obtain a legal opinion on TRDC classification** — specifically confirming that TRDC is a credit-rights token (não é valor mobiliário) and not a security under CVM rules. This is the single most important legal question; an adverse ruling would force architectural rework.
4. **Confirm BRL stablecoin selection and issuer relationship** (BRZ via Transfero, BRLA via BRLA Digital, or another credible option) including commercial terms for liquidity backstop at TVL targets.
5. **Register as a VASP or contract a VASP-partner structure under Lei 14.478/2022**, with COAF reporting protocol and FATF Travel Rule compliance tooling in place.
6. **Execute LGPD compliance documentation** — data processing agreements with SCD, custodian, appraisers; privacy policy; consent management in the dApp.
7. **Complete the Civic Pass / Blockpass commercial agreement** for on-chain KYC attestation at the required tier.

The Phase 0 pre-seed capital is primarily allocated to items 1 through 4; items 5 through 7 are parallelized and close before mainnet audit begins.

### 6.3 Why the ladder, not a leap

A legitimate question: why not apply for an SEP license directly and operate as a retail P2P platform from day one? Three reasons.

First: timing. SEP authorization takes 6–12 months after the R$1M capital is in place. Vaulx cannot stage first mainnet cohort on a 12-month critical-path dependency; the SCD-partnership route is 2–4 months and unlocks first-loan operational data to present to investors and future BACEN applications.

Second: risk asymmetry. The first operational cohort is where unit-economics data is collected, custody processes are stress-tested, and the legal infrastructure is proven. Running that cohort under a partner-SCD umbrella means Vaulx's own regulated-entity status is not at risk from early operational errors; a first-cohort mistake under a Vaulx-owned SEP would be a regulatory incident on Vaulx's own record.

Third: capital efficiency. An SCD partnership requires zero minimum capital on Vaulx's side (the SCD brings its own R$1M+). Own-SEP status demands R$1M locked plus ongoing BACEN compliance overhead — capital and overhead that are better deployed in Year 1 toward platform, team, and custody network than toward regulatory posture.

The ladder is also asymmetric in one other useful way: each stage is additive, not replacement. Stage 0 infrastructure (SCD partnership, CCB workflow, custody network) remains in place when Stage 1 adds the FIDC wrapper. Stage 1 infrastructure remains in place when Stage 2 adds the own-SEP license. Nothing built in Phase 0 is thrown away.

### 6.4 The VASP question, clearly answered

Crypto-native users often ask whether Vaulx can operate as a "truly decentralized" protocol — permissionless deposits, no KYC, no VASP registration. The answer is no, and this needs to be said directly because any ambiguity here is a future regulatory incident waiting to happen.

Under Brazilian Lei 14.478/2022, a VASP is defined by activity, not by technical architecture. The law covers anyone "organizing, managing, offering or intermediating operations involving virtual assets." Vaulx does all four. BACEN finalized VASP authorization rules in early 2026 and both the activity-based definition and the KYC/AML obligations apply to Vaulx regardless of how decentralized the front-end is. Equivalent rules apply under MiCA in the EU, under FinCEN guidance in the US, and under FATF Travel Rule implementation in 85+ jurisdictions globally. There is no jurisdictional arbitrage available.

Practically this means: (a) every lender deposit is gated by KYC — via Civic Pass, Blockpass, or institutional onboarding whitelist — and there is no anonymous-deposit mode; (b) Vaulx registers as a VASP or contracts a licensed VASP partner for compliance reporting; (c) all transactions flow through the COAF reporting obligation and the FATF Travel Rule is honored for cross-border transfers above $1,000 equivalent. This is not a constraint on the protocol's decentralization narrative — it is what makes the protocol investment-grade. The 10–12% lender APY on physical collateral is only credible because the legal-recovery path exists, and the legal-recovery path exists only because the lender is a known legal counterparty through KYC.

### 6.5 Usury law — clarifying a known trap

Brazil's Decreto 22.626/1933 (Lei da Usura) caps interest at 12% per year. This cap sounds material and is frequently raised by competitors and by uninformed investor questions. It does not apply to Vaulx's structure. Two reasons: first, the cap does not apply to financial institutions, which includes SCDs (and, when Stage 2 activates, SEPs). Second, Lei 14.905 of September 2024 eliminated the usury cap for any company-to-company lending, further broadening the exemption. Vaulx's target borrower rates (24–30% APR for Base Case, 18–24% for Position 1, 30–42% for Position 4) sit comfortably inside the legal envelope. Legal opinion on this specific point is commissioned as part of the Phase 0 legal work and is expected to be straightforward.

### 6.6 Current commercial status — partnerships and underwriters

Two partnership tracks gate Phase 0 launch. Both are in active commercial dialog; both carry dependencies that investors will treat as primary due-diligence items. This section states where things stand, without naming parties that are under NDA.

**SCD partnership — the legal counterparty.** Vaulx does not issue CCBs directly; a BACEN-licensed SCD partner is the counterparty of record on every credit instrument, with Vaulx as the platform/agent receiving the revenue share. Target partner profile: licensed under BACEN Res. 4.656/2018, minimum R$1M equity capital, prior consumer-lending CCB issuance track record, operational back-office capable of 50+ CCB issuances per month at Phase 0 scale.

- **Status (April 2026):** Parallel commercial conversations active with 2 candidate SCDs meeting the target profile. Specialized fintech legal counsel has been briefed on partnership structure (revenue share + exclusivity language + platform-service agreement mechanics). Target: signed LOI within 6 weeks of pre-seed close, definitive agreement within 4 months.
- **Fallback path:** If neither primary candidate closes by the 4-month mark, (a) a third-ranked SCD candidate enters formal dialog, and (b) Vaulx evaluates the Stage 2 SEP license path (§6.1) with a compressed 6–9 month timeline using the seed-round capital runway. The Stage 2 path is strictly a fallback — SCD partnership at Phase 0 is materially faster, cheaper, and carries no direct regulatory obligations on Vaulx as a non-licensed entity.
- **Dependency flag:** This is the single largest pre-revenue gate. Risk #2 in §9 tracks it explicitly with named owner (Marcelo + fintech counsel).

**Custody partner — the operational counterparty.** Target custodian profile: Tier-1 commercial vault operator (Brinks, Prosegur, or Loomis), São Paulo-based facility with specialty-luxury-goods class, blanket commercial insurance covering single-item values up to R$200K within the base rate, rider available for pieces above R$200K.

- **Status (April 2026):** Commercial conversations initiated with 2 of the three Tier-1 candidates. Target Phase 0 vault location: São Paulo central-zone facility (commercial-grade, climate-regulated where required, Federal Police compliance posture aligned with Marcelo's Gitel-side operating standards).
- **Target volume-tiered rate schedule:** 0.5%/month all-in (storage + blanket insurance) at <100 assets — the Phase 0 single-partner rate modeled in §5.2. Step-down to 0.45%/month at 100–499 assets. Target **0.3%/month at 500+ assets under SLA** — the Phase 1 scale rate that §5.3 CLV matrix assumes. The 0.3% tier requires volume commitment and is the single largest operational lever in the Year 2+ economic model (§5.8 KPI #3).
- **Insurance structure:** Phase 0 runs under the custodian's commercial blanket policy (no per-item rider required for typical Phase 0 watch intake under R$200K). For premium-tier pieces above R$200K (Daytona gold, AP Royal Oak Offshore gold, Patek complications), an individual-item rider adds approximately R$500–800/year per piece — modeled as a pass-through cost that does not materially change per-cycle economics at realistic premium-tier book concentration.
- **Dependency flag:** Non-critical for Phase 0 go-live (single-partner single-city works at launch scale); critical for Phase 1 economics if 0.3%/month tier is blocked. Risk #4 in §9.

**What is not in this section.** Specific partner names, financial terms of draft LOIs, and the inner workings of ongoing commercial negotiations. These sit in the data room made available to pre-seed investors under NDA at term-sheet stage.

---

## 7. Team

### 7.1 Five founders, one critical axis each

Vaulx is led by five people. Four are operating founders — George (CEO), Marcelo (COO), Rodrigo (Head of Operations Brazil), Edson (Lead Developer). One is Strategic Advisor & Co-Founder — Felipe, US-based, with equity and governance weight but an external-facing advisor title that he has explicitly requested. Each founder covers exactly one critical axis that the product categorically demands and that no typical fintech or DeFi startup team can assemble. The composition argument is structural, not aspirational: every axis has a dedicated operating credential rooted in an active professional reality, not a credential acquired by reading documentation.

### 7.2 George Dimitrov — CEO & Co-Founder

**Role.** Strategy, protocol design oversight, fundraising, white paper and narrative authorship, European investor and regulatory interface, Phase 2+ EU expansion lead.

**Based in.** Vienna, Austria (EU regulatory gateway).

**Background.** Fifteen years in European banking operations across the UniCredit, Erste Group, and Raiffeisen Bank International corridor — one of Europe's most sophisticated emerging-market banking environments. Italian top-tier finance education. Active in crypto and Web3 across multiple cycles as independent investor and builder.

**Why this matters.** Physical-collateral lending is credit engineering, not a software project. LTV calibration, reserve mechanics, default waterfall sequencing, CCB contractual structure, and regulatory classification are skills developed inside regulated financial institutions over years — not acquired from DeFi documentation. George owns these dimensions of the product and the financial discipline that accompanies them. He also owns the EU investor conversation and the regulatory framing for eventual MiCA-era European expansion.

### 7.3 Marcelo Coelho — COO & Co-Founder

**Role.** Physical custody network and partnerships, institutional banking relationships in Brazil, SCD and custody-partner negotiation, Phase 0 operational rollout in São Paulo.

**Based in.** São Paulo, Brazil.

**Background.** CEO of Gitel (gitel.com.br), a Brazilian electronic-security integrator operating nationally. The Brazilian private security market is USD 3.1B (2024), federally regulated by the Polícia Federal. Gitel's core business is CFTV, access control, alarm monitoring, and IoT-overlay solutions for secure asset management; banks are the primary institutional clients, and Gitel's relationships span major Brazilian banking groups. Gitel is not itself a commercial custody operator — Vaulx's vault layer runs on Brinks / Prosegur / Loomis / specialized local vault partners — but Gitel's distinct additive advantage is the CFTV/IoT monitoring overlay on those partner vaults, and the bank-relationship inventory that makes those partnerships fast to close.

**Why this matters.** Vaulx's operational moat is the *speed and credibility* of custody partnership setup. Custody is not a feature that can be procured — it is an operator credential. Marcelo brings a functioning national security operation with existing bank relationships, federal compliance posture, and an institutional network that closes custody deals in weeks rather than quarters. A VC-funded competitor could replicate the protocol code in three months; reproducing an equivalent operator-and-relationship base at national scale is 18–24 months and several million dollars of operational setup — assuming they can find a comparable operator, which most cannot.

### 7.4 Rodrigo Coelho — Head of Operations Brazil & Co-Founder

**Role.** Execution of custody workflows, São Paulo on-the-ground coordination, institutional meeting support, appraiser and custodian day-to-day management.

**Based in.** São Paulo, Brazil.

**Background.** Works alongside Marcelo inside Gitel. Same institutional relationships, same operational discipline, focused at execution level. Second operational authority inside the custody function from day one.

**Why this matters.** Physical-collateral lending has one single-point-of-failure: the custody record is the legal record. A broken chain of custody invalidates the loan contract and eliminates recovery in default. Having two dedicated operators inside the founding team — not contractors, not post-seed hires — means the custody function has institutional redundancy and execution depth from the first mainnet CCB. Rodrigo's named share on the cap table is a deliberate signal to investors that operations is resourced as a co-founder responsibility, not as "someone else in Marcelo's company."

### 7.5 Felipe — Strategic Advisor & Co-Founder

**Role.** US investor pipeline, Solana ecosystem access, crypto rails integration, DeFi product economics critique, Discord community distribution. Equity and governance weight; external-facing Strategic Advisor title at Felipe's own request.

**Based in.** United States.

**Background.** Brazilian national, US-based. Founder and operator of a crypto rails company that processes a significant share of São Paulo's luxury watch transaction flow (USDT settlement rails). Runs an active Solana DeFi Discord community. Direct relationships inside Solana Brazil and with US VCs backing Solana-native infrastructure. Wall Street exposure; time in Boston and the US Northeast financial corridor.

**Why this matters.** Felipe bridges Vaulx's Brazilian operating reality to the Solana and US-VC ecosystem where the capital and the narrative live. He is the critique layer on Vaulx's DeFi product economics — LTV ceilings, interest curves, renewal incentives, multi-currency vault design, eventual securitization architecture — and the accuracy check on crypto-native positioning. His US base is the North American operational beachhead and the direct channel into US capital for the seed round and beyond.

### 7.6 Edson — Lead Developer & Co-Founder

**Role.** Smart contract development, cNFT minting logic, vault program architecture, on-chain loan lifecycle, frontend dApp integration, mainnet migration lead.

**Based in.** Brazil.

**Background.** Experienced Solana developer working with the Anchor framework, Metaplex Bubblegum, compressed NFTs, and PDA custody patterns — the exact stack Vaulx is built on.

**Why this matters.** A protocol handling physical assets cannot outsource its core smart contract logic. Every major RWA protocol exploit at scale has been a contract vulnerability. A dedicated in-house engineer who owns the codebase end-to-end from pre-audit through mainnet is the correct security posture. Edson's presence at Colosseum means Vaulx submits with running code, not slides.

### 7.7 Team composition — the structural argument

| Critical success factor | Owner(s) | Why they own it |
|---|---|---|
| Physical custody network + BR bank relationships | Marcelo + Rodrigo | Active operators of Gitel, federally regulated national security integrator |
| Credit engineering + regulatory framing | George | 15 years in European banking operations, top-tier finance education |
| DeFi product economics + crypto-native positioning | Felipe | US crypto-rails operator + Solana ecosystem insider |
| On-chain technical execution | Edson | Anchor, Metaplex Bubblegum, PDA custody expertise |
| US + EU capital and ecosystem bridges | George + Felipe | EU banking corridor in Vienna; active US-based DeFi operator |

Every axis has a dedicated owner. No gap, no redundancy-as-weakness, no "we'll hire for this" on a critical dimension. The only composition comparable to this would require a founding-team assembly process measured in years — Vaulx already has it.

### 7.8 Acknowledged gaps

Two gaps are explicitly not covered by the founding team and will be filled through external procurement or targeted hires:

1. **Brazilian fintech legal counsel.** SCD partnership formalization, BACEN interface, CCB issuance framework, ongoing regulatory defense. This is professional services, not a founder skill; the cost is budgeted in §5.4 (Use of Funds) and §8 (Capital Ask).
2. **Brazil growth marketing.** Direct-to-consumer borrower acquisition in São Paulo beyond the founder-led warm-channel approach. A Year 2 hire; Phase 0 acquisition runs through Felipe's merchant-network relationships and referral paths from Gitel's institutional base.

Both gaps are normal and expected for a pre-seed team of this composition. They are line items in the capital plan, not structural weaknesses.

---

## 8. Roadmap & Capital Ask

### 8.1 Roadmap by phase

| Phase | Window | Exit criterion |
|---|---|---|
| **Hackathon MVP** | Apr–May 2026 | Devnet full-cycle demo working; custody gate enforced in contract; Colosseum submission May 10 |
| **Pre-seed + Mainnet Prep** | Jun–Aug 2026 | Pre-seed closed; SCD partner signed; lawyer engaged with regulatory memo in hand; smart-contract audit engaged |
| **Seed / Mainnet Beta** | Sep–Nov 2026 | Audit clean; mainnet deployed in SP; 20–50 CCBs/month steady-state; NPS baseline captured |
| **BR Validation** | Dec 2026 – Jun 2027 | 500+ CCBs cumulative in SP; renewal rate >60% observed; CAC R$350–600 validated; at least one lever from §5.3 confirmed (custody cost ↓, ticket ↑, or renewal ↑) |
| **LatAm rollout** | H2 2027 | 3–5 countries (CO / MX / PE / CL / PA) live via asset-light per-market playbook; second FIDC wrapper operational |
| **US entry** | Late 2027+ | Miami + NYC pilot; pawnbroker licenses FL + NY; USDC-native loan product; European remote exploration begins |
| **Global + securitization** | 2028+ | On-chain marketplace; Vault-as-a-Service live; first tokenized loan-book tranche to institutional LPs |

### 8.2 What each phase de-risks

Every phase closes exactly one open investor question; nothing is hand-waved.

| Phase | Question it closes |
|---|---|
| Hackathon MVP | Can the team ship running code under a deadline? |
| Pre-seed + Mainnet Prep | Can Vaulx run legally in Brazil and survive a first audit? |
| Seed / Mainnet Beta | Does real money flow cleanly through the custody gate on mainnet? |
| BR Validation | Do the unit economics hold in real operating conditions (renewal rate, CAC, custody cost)? |
| LatAm rollout | Is this Brazil-specific or categorically replicable? |
| US entry | Does the model survive a developed-market regulatory regime? |

### 8.3 The pre-seed ask

**Target: $500K–$1M. Instrument: SAFE. Valuation cap: to be set at term-sheet time based on market comparables at raise (indicative range $8M–$12M).** Lead investor terms: board observer seat (not a board seat at pre-seed), pro-rata, information rights. Close target: August 2026, aligned with mainnet-prep phase exit.

**Colosseum accelerator treatment.** The Colosseum accelerator invests $250K at ~7% equity (per prior cohort terms). If Vaulx is accepted into the accelerator, that $250K sits *inside* the pre-seed range as a potential anchor investment — not as a grant additive on top. The pre-seed is sized to be complete with or without Colosseum, with Colosseum acceptance as upside signal, not funding dependency.

**Full-time commitment at pre-seed close.** George, Marcelo, Rodrigo, and Edson move to full-time on Vaulx at pre-seed close. Felipe continues as Strategic Advisor from the US in parallel with his primary role. This is the commitment inflection investors should expect to see in the Aug 2026 SAFE documentation.

### 8.4 Use of pre-seed funds

| Bucket | Range (USD) | What it buys | Detail in |
|---|---:|---|---|
| One-off setup capital | $280K–$300K | Audit, legal entity, SCD + CCB framework, custody + appraiser onboarding, brand + dApp, KYC, insurance, 6-month founder ramp, 15% contingency | §5.4 |
| Year 1 operating runway | $280K–$370K | Founder comp Y1, ongoing legal + insurance + infra, S&M fixed, CAC | §5.5 |
| Strategic reserve | $50K–$150K | Buffer for unmodeled items + opportunistic hires (e.g., BR growth marketer ahead of Year 2 if data supports) | — |
| **Total** | **$610K–$820K** | — | — |

The range above represents Base Case coverage. At $500K pre-seed (tight end), the strategic reserve compresses and the team tracks to Year 2 seed close tightly. At $1M (top end), the team has 14–16 months of runway and optionality on lever-validation experiments in §5.3. The midpoint — approximately $750K — is the target.

### 8.5 Seed round — the post-validation path

**Target: $1.5M–$3M priced round, Q4 2026 / Q1 2027.** Triggered by concrete validation milestones, not by runway pressure:

- 100+ mainnet CCBs on the book, renewal rate observed ≥55% on month-6 cohort
- At least one §5.3 lever materially moved (custody cost negotiated ≤0.4%/month, average ticket drift to ≥R$30K, or renewal rate ≥65%)
- SCD partnership operating at steady-state with no regulatory flags
- Second custody partner in SP signed or Rio launch scoped

**Use of seed (directional, finalized at term-sheet time):** extended team build (BR growth marketer, second Solana developer reducing Edson single-point-of-failure, part-time fintech lawyer retainer), FIDC-tokenizado wrapper build for retail access (§6.1 Stage 1), Rio and first LatAm market activation, marketing infrastructure. Not modeled here in detail — §5.5 Year 2 trajectory sets the operating context.

**Investor pipeline.** Dual channel by design: EU via George (European family offices with crypto allocations, EU DeFi-thesis funds) and US via Felipe (Solana RWA-thesis funds, crypto-rails and fintech-crossover investors, warm referrals from Felipe's ongoing US network).

### 8.6 Layer 2 revenue — optionality, not Y1 assumption

Beyond the five revenue streams modeled in §5.1, the roadmap unlocks additional streams that are deliberately **not** modeled in the Y1 P&L because they depend on scale or regulatory clearance:

- **Float yield.** Idle vault balance deployed to Kamino / MarginFi at 4–8% APY. Small at Y1 TVL; material at Y2+.
- **Vault-as-a-Service (VaaS).** Audited vault program licensed to third-party RWA platforms. Subscription + basis-point fee on TVL.
- **Asset Scoring API.** Per-query fee against on-chain luxury-asset credit history. Becomes monetizable only at 10,000+ historical loans — a late-Phase-3 asset.
- **On-chain securitization.** At 100+ active loans, tokenize the book as fixed-income product for institutional LPs. Vaulx retains a first-loss tranche. Unlocks institutional capital at scale.

These streams compound on top of the Year 1 unit economics modeled in §5. They are the upside the roadmap unlocks — not the assumption base of the ask.

### 8.7 Phase 0 → Phase 1 go/no-go gates

The transition from Phase 0 (20–50 CCBs, first cohort validation) to Phase 1 (400+ CCBs, paid-acquisition ramp, second custody partner or Rio expansion) is a deliberate decision, not a calendar event. Four gates must clear before Phase 1 ramp is approved. If any gate fails, the response is to hold at Phase 0 and iterate on the failed lever — not to proceed and hope the data improves at scale.

| # | Gate | Threshold | What happens if missed |
|---|---|---|---|
| 1 | **Renewal rate** on first cohort at first 120-day maturity | ≥55% | Hold Phase 0. Deploy §3.7 retention mechanisms 3 (tiered loyalty) and 4 (referral) earlier; reassess at Month 8. |
| 2 | **Blended CAC** across first 30 originations | ≤R$500 | Hold paid-acquisition spend flat. Concentrate further through Felipe's merchant network; reassess channel mix at 50 CCBs. |
| 3 | **Default rate** on first cohort | ≤7% | Tighten §3.5 eligibility filter (exclude marginal tiers); reassess appraisal conservatism; reduce max LTV from 50% toward 40% for borderline intake. |
| 4 | **SCD partnership stability** — CCB issuance workflow operational without incident | ≥30 consecutive days | Do not originate net new CCBs under a degraded legal pipeline. Escalate SCD relationship; hold until stability is reestablished. |

These gates operationalize a principle already implicit in the roadmap: Phase 1 is a *validated* scale ramp, not a planned one. A go/no-go decision meeting at the end of Phase 0 reviews the gate dashboard with all five founders present. If all four gates clear, Phase 1 origination ramp begins. If two or more gates miss, the default action is to hold and iterate. The mid-case (one gate missed) is case-by-case — Gate #4 (SCD stability) is non-negotiable; Gates #1–3 can tolerate modest shortfall if the trajectory is clearly improving across the cohort.

This structure is lifted directly from lending-platform operating discipline: shipping a lending product to scale before the first cohort has returned actual renewal and default data is the single most common way early-stage lending businesses destroy capital. Vaulx's Phase 0 → Phase 1 inflection is the moment that discipline matters most.

---

## 9. Risk Matrix

Twelve material risks, prioritized by (likelihood × impact). L / I scale: Low / Medium / High / Critical. This matrix is maintained as a live document outside the whitepaper; the version below reflects Phase 0 snapshot. Every risk has a named owner and an explicit mitigation path — no "we hope this doesn't happen."

| # | Risk | L | I | Mitigation | Owner |
|---|---|---|---|---|---|
| 1 | Smart contract vulnerability exploited post-mainnet | Med | Critical | Tier-1 audit (OtterSec-class); bug bounty on launch; custody-gate invariant covered by negative test on every commit; 2/3 Squads multisig on protocol upgrades; formal verification on the `disburse_ccb` access check | Edson + audit firm |
| 2 | SCD partnership fails to close before mainnet | Low–Med | Critical | Parallel conversations with 2+ SCD candidates from Phase 0; fallback strategy-memo (3 named operators in active dialog) if no LOI by May 5; timeline for independent SEP license articulated in §6.1 Stage 2 | Marcelo + fintech counsel |
| 3 | Renewal rate sits below 55% in Phase 0 | Med | High | Retention UX + automated reminder flows + explicit renewal incentive (fee waiver, longer term); §5.3 lever validation program active from month 1; Position 4 pricing pivot available if acquisition targets premium tier | George + product |
| 4 | Custody cost does not reach 0.3%/month at Y2 volume | Med | Med | Multi-partner negotiation (Brinks / Prosegur / Loomis) from Year 1; volume SLA tied to 500+ assets threshold; ticket growth to R$35K+ as compensating lever | Marcelo |
| 5 | Appraiser collusion despite blinding | Low | High | Triangular convergence gate + market-anchor independence (§3.2 Step 3); >20% divergence triggers mandatory audit without revealing flagged pair; rotating specialist pool; fraud-detection ML post-Year 2 | Rodrigo + ops |
| 6 | BRL stablecoin liquidity shock or regulatory block | Low–Med | High | USDC as primary Phase 0 currency; multi-BRL routing roadmap (BRZ / BRLV / BBRL); FIDC-BRL wrapper as native BRL track (§6.1 Stage 1); full decision framework in §10.1 | George + Felipe |
| 7 | Edson unavailable or departs | Med | High | Second Solana developer hired from seed close (§8.5); continuous technical documentation maintained through Phase 0; Felipe's Solana network as emergency bench | George |
| 8 | Usury-law reinterpretation or CVM 88/2022 expansion to TRDC | Low | High | Pre-mainnet legal opinion on Lei 14.905 exemption (§6.5); quarterly legal review; SEP-license long-term fallback (§6.1 Stage 2); token strategy scoped conservatively (§10.3) | Marcelo + counsel |
| 9 | CAC drifts above R$600 blended | Med | Med | Channel diversification (merchant-partner, referral, content) from month 1; paid-acquisition pause trigger at CAC threshold; compensating renewal-rate leverage; BR growth-marketer hire if data supports | George → Y2 GM hire |
| 10 | Well-funded competitor enters (crypto-native RWA pivot or BR fintech) | Med | Med | Custody-moat replication gap 18–24 months (§7.3); SCD partnership exclusivity language where achievable; first-mover narrative + Colosseum validation | George + Felipe |
| 11 | Default rate exceeds 5% in Phase 0 | Low–Med | Med | 50% LTV ceiling; triangular-appraisal conservatism; partner-SCD extrajudicial recovery (Lei 14.711/2023 + CNJ Provision 196); privileged auction flywheel (§3.4); default-processing fee in unit economics | Marcelo + partner SCD |
| 12 | Solana network disruption or major chain incident during Phase 0 | Low | Med | 400ms finality tracked; event-monitor reconciliation; CCB legal instrument remains enforceable off-chain even if on-chain state is temporarily unavailable (the SCD partnership is the legal wrapper, the chain is the state machine) | Edson + George |

**The three that keep us up at night.** Risk #2 (SCD failure) is the single-point-of-failure on the legal side — without a licensed counterparty, there is no CCB and therefore no product. Risk #3 (renewal rate) is the single-point-of-failure on the economic side — below 55% renewal at current cost structure, CLV is negative regardless of volume. Risk #7 (Edson departure) is the single-point-of-failure on the technical side until the second Solana developer hires in. Every other risk on the matrix has either a clean mitigation, a natural structural ceiling, or both.

---

## 10. Appendix

### 10.1 BRL stablecoin decision framework

BRL stablecoin selection is deferred to Phase 0 mainnet prep. Decision criteria (weighted):

| Criterion | Weight | Notes |
|---|---:|---|
| Solana-native liquidity depth | 30% | On-chain circulating supply + active pools; deepest currently = BRZ (Transfero), limited across alternatives |
| Regulatory posture (BACEN Feb 2026 stablecoin-as-forex rule) | 25% | Issuer compliance with BACEN guidance; preference for BR-issuer with bank partnership |
| Issuer capitalization + track record | 20% | Operational history, reserve auditing, recovery rails |
| Protocol partnership openness | 15% | Willingness to co-market + integrate at institutional level |
| Holder base diversity | 10% | Concentration risk — avoid issuers where top 10 holders hold >80% |

**Candidate matrix (Apr 2026 snapshot):**

| Stablecoin | Issuer | Status | Our read |
|---|---|---|---|
| **BRZ** | Transfero Group | Live on Solana, deepest BRL pool | Default Phase 0 BRL leg; zero-partnership integration required |
| **BRLV** | Crown | Paradigm-backed, 360M+ circulating | Integration conversation in progress; partnership upside |
| **BBRL** | Grupo Braza | Announced, early deployment | Monitor; not Phase 0 |
| **Future: B3 native** | B3 (BR stock exchange) | Announced for 2026 | Institutional-grade option if live before Phase 1; watch closely |
| **USDC** | Circle | Native on Solana | Primary Phase 0 currency; BRL leg sits alongside, not instead |

**Phase 0 decision: USDC primary + BRZ as BRL leg, multi-BRL routing roadmap as upside.** Final integration list revisited at Month 3 post-mainnet-launch based on operational experience.

### 10.2 Per-cycle-event formula reference

The §5.2 table expressed as formulas, for reviewers who want to audit the math:

```
Let:
  P      = principal (loan ticket)
  A      = appraised asset value (A = P / LTV, LTV = 0.5 Base)
  r_b    = borrower APR (annualized)
  r_l    = lender APY (annualized)
  t      = term in days (120 Base)
  f_o    = origination fee rate (2.5% Base)
  c_cust = custody rate per month (0.5%/mo Base)
  c_ins  = insurance annualized rate (2%/yr Base)
  c_apr  = triangular appraisal flat cost (R$665 Base)
  s_part = partner revenue share fraction (20% Base)
  k_tx   = on-chain + payment-rails flat cost (~R$10 Cycle 1, ~R$5 Cycle 2+)
  p_late = fraction of loans with late fee (20% Base)
  f_late = blended late fee (R$150 Base)

Cycle 1 (new loan) gross contribution:
  Revenue     = P·f_o + P·r_b·(t/365) − P·r_l·(t/365) + p_late·f_late
  Direct cost = c_apr + A·c_cust·(t/30) + A·c_ins·(t/365) + s_part·[P·(r_b−r_l)·(t/365)] + k_tx_1
  Gross contribution = Revenue − Direct cost

Cycle 2+ (renewal):
  Same formula, with c_apr = 0 and k_tx → k_tx_2 (R$5).
  Origination fee = 0 (renewal fee only, captured separately in future if applied).

CLV at renewal rate p (geometric):
  Expected total cycle-events per customer = 1/(1−p)
  Expected renewals per customer = p/(1−p)
  CLV = GC_cycle1 + [p/(1−p)] · GC_cycle2 − CAC
```

Base Case values plugging into these formulas recover the §5.2 table exactly (GC_cycle1 = +R$85, GC_cycle2 = +R$130, Base-Case CLV at p=0.6 = −R$170). The formulas are in the live working model; any investor request for sensitivity scenarios (different ticket, APR, renewal rate, custody cost) is answered by re-running the same formulas, not by rebuilding the model.

### 10.3 Token strategy scoping (Phase 2+ optionality)

Vaulx does **not** launch a token at Phase 0, Phase 1, or as part of the pre-seed or seed rounds. Launching a utility token before product-market fit is the 2021 mistake that killed dozens of Solana projects. VCs value the *option* of a future token; they do not value premature launch.

**Scoping note, held as optionality for Phase 2+:**

| Utility (candidate) | Rationale | Securities risk |
|---|---|---|
| Governance rights | Vote on risk parameters, new collateral categories | Low |
| Origination fee discount for stakers | Aligns incentives, creates demand driver | Low–Med |
| Pro-rata revenue share to stakers | Strongest economic alignment | **High — CVM 88/2022 likely reclassifies as security** |
| Privileged-auction access for stakers | Integrates with §3.4 retention flywheel | Low |

**Pre-launch requirements:**
1. Written CVM 88/2022 classification opinion from BR fintech counsel; offshore structuring opinion (Cayman / BVI) from crypto-competent international counsel
2. Post-PMF signal: 500+ active borrowers and 100+ active lenders on mainnet
3. Regulatory stability window (no active CVM rulemaking on token classification)
4. Seed-round investors aligned with token-launch timing through explicit SAFE conversion mechanics

**Earliest realistic window: H2 2027** — post-BR-validation phase exit (§8.1), with legal opinions and regulatory posture confirmed. Before that, tokens are discussed as roadmap optionality, never promised.

### 10.4 Document maintenance

This canonical spec is the single source of truth for Vaulx's product, business, and financial model. Changes are tracked in the Delta Log (§section top). The live working model (P&L spreadsheet, sensitivity analyses, cohort models) references these formulas and scenarios exactly. Any contradiction between investor materials, internal docs, and this canonical spec resolves in favor of this document until a superseding v2 is explicitly issued.

---

**END OF CANONICAL SPEC v1 — ALL SECTIONS COMPLETE**

*Changes from v1 per George feedback:*
- Brazil reframed as the **test case** (market-structural reasons), not the **thesis foundation**
- Marcelo / Gitel corrected: industrial electronic-security integrator, not national custody operator. Custody runs on Brinks/Prosegur/Loomis/local vault network. Gitel's distinct additive advantage (CFTV/IoT overlay on partner vaults) preserved
- Dual-track model explicit: institutional depositors (direct) + retail depositors (via FIDC wrapper), separated by depositor tier AND by currency (four vaults at launch)
- Geographies compressed: Brazil → LatAm (candidates: CO, MX, PE, CL, PA) → US (Phase 3). No multi-paragraph LatAm breakdown
- Global replication thesis spelled out: same four replaceable inputs (licensed lender / commercial custodian / appraiser network / extrajudicial-recovery legal framework) exist in every target market
- "VC never funds the loan book" preserved and restated
- Team advantages reframed as accelerators for Brazil execution, not prerequisites for the model

*Changes in Sections 3–4 (newly drafted, §3 revised v2 per George feedback):*
- Step 1: removed specific people/partner names; replaced with generic channel categories
- Step 2: clarified dual KYC — SCD bureau check (BACEN-mandated, cannot skip) + on-chain Civic/Blockpass credential (reusable from prior dApps or cross-platform issuers)
- Step 3: added explicit appraiser identity blinding (code names, no visibility into other appraisers' work or market data during submission); collusion detection triggers audit without revealing flagged pair
- Step 4: reframed to clarify SCD generates and digitally signs the CCB on existing ICP-Brasil infrastructure (Clicksign/D4Sign/BRy at standard rates, no bespoke system). Vaulx only integrates via API to transmit parameters and receive back the signed hash
- Step 6: strengthened lender-risk-reduction framing of monthly repayments (30-day default detection vs. 120-day)
- §3.5: brief UX-roadmap note on Vaulx Wallet (white-label mobile app with IBAN/PIX rails via BaaS partner) as Phase 2+ item, pointer to Section 8
- §3.6 fully restructured into 6 must-see core moments + 3 score-point moments (renewal, multi-currency, default auction), with explicit cut order for build-time compression
- Five-actor model made explicit (Borrower, Lender, Custodian, Appraiser, Licensed Lending Partner) with role separation
- Dual-track lender flow fully documented (Institutional direct + Retail-via-FIDC)
- Borrower flow end-to-end with the seven steps from discovery to resolution
- Privileged default auction mechanism specified (the lender retention flywheel)
- Four-vault architecture laid out (Institutional/Retail × USDC/BRL) with same program code, differentiated by PDA seeds
- Custody gate stated as the single most monitored line of code, with the three checks
- TRDC seven-state machine with strict transition rules
- Civic Pass as primary KYC layer, FIDC_QUOTAHOLDER attestation type for retail

*Changes in Sections 5–6 (revised per George feedback v2, §5 rebuilt v3 Apr 22):*
- §5.2 restructured: per-cycle P&L separates **gross contribution (before CAC)** from **fully-loaded (after CAC)**. CAC pulled out as its own line. Gross contribution +R$85 Cycle 1 / +R$130 Cycle 2+; fully-loaded −R$365 Cycle 1 / +R$130 Cycle 2+
- §5.3 cohort math corrected to standard geometric formula 1/(1−p) — prior version overstated total cycle-events per customer. Base Case (60% renewal) CLV is **−R$170** at baseline cost structure; turns positive at ~73% renewal. Three levers explicitly modeled (custody cost 0.3%/mo, ticket R$35K, CAC R$350) — each individually sufficient to close the gap
- §5.4 **NEW: Use of Funds** — one-off setup capital (R$1.715M / ~$286K USD) separated from ongoing Y1 opex. Covers audit, legal, SCD partnership, custody + appraiser network onboarding, brand/dApp, KYC integration, insurance, 6-month founder ramp, contingency
- §5.5 Y1 P&L rewritten with **500 / 1,200 / 2,000** origination scenarios and Revenue → Gross Contribution → S&M → G&A → Operating Result structure. Phase-staged operations (Phase 0 all year / Phase 0→1 mid-year trigger / aggressive Phase 1 with Rio launch). Operating result range −R$1.68M to −R$2.17M (~$281K–$362K USD). Honest Y2 trajectory included
- §5.6 Position 1/4 renumbered; contribution figures updated to match new §5.2 structure
- §5.7 International sensitivity renumbered
- §5.8 Operational KPIs renumbered; **custody cost %/month and average ticket elevated to co-equal Y1 levers alongside renewal rate** (reflecting the §5.3 three-lever finding)
- §6.1 FIDC-as-a-service simplified — explicit cost/timeline figures deferred to post-MVP vendor evaluation
- Executive summary §1 updated to reflect CLV framing not per-loan margin
- Demo moment 7 annotation updated to reflect new economics framing
- Three-stage regulatory ladder specified: SCD partnership (Phase 0) → SCD + FIDC-tokenizado (Phase 1) → own SEP license if volume justifies (Phase 2), each stage additive not replacement
- Legal blockers list enumerated (7 items, all prerequisite to mainnet)
- VASP question answered directly — no anonymous-deposit mode, legal recovery requires KYC, this is a feature not a constraint
- Usury law clarification (Lei da Usura does not apply to financial institutions or to Lei 14.905-covered lending)
- Five revenue streams decomposed (origination, net platform margin, late fees, default processing, auction commission)
- International sensitivity: LatAm / US / EU cost-driver comparison showing 4–6% net platform margin is internationally robust
- Year 1 KPI dashboard (7 operational metrics) defined

*Changes in Section 7 (Team, newly drafted v1 Apr 22):*
- Five-founder composition explicit — four operating founders + one Strategic Advisor & Co-Founder (Felipe, US-based, equity-and-governance weight with externally-facing advisor title at his own request)
- Each founder bio structured as Role / Based in / Background / Why this matters
- Marcelo's Gitel framing corrected per v2 §3 feedback: electronic-security integrator with CFTV/IoT overlay and bank relationships, not a commercial custody operator — commercial custody runs on Brinks/Prosegur/Loomis/local vault partners
- Rodrigo's explicit named share called out as deliberate cap-table signal (not bundled with Marcelo)
- Structural argument table: five critical success factors, each with dedicated owner
- Two gaps acknowledged (BR fintech legal counsel, BR growth marketing) — framed as professional services and Year-2 hire, not structural weaknesses

*Changes in Section 8 (Roadmap & Capital Ask, newly drafted v1 Apr 22 — compact):*
- Seven-phase roadmap table with exit criterion per phase (Hackathon MVP → Pre-seed → Seed/Mainnet Beta → BR Validation → LatAm → US → Global+securitization)
- De-risk table: each phase closes one named investor question
- Pre-seed ask: $500K–$1M SAFE, indicative cap $8M–$12M (final set at term-sheet time), Colosseum $250K treated as potential anchor *inside* the range, not additive grant
- Full-time commitment inflection specified: George + Marcelo + Rodrigo + Edson go full-time at pre-seed close; Felipe continues as Strategic Advisor
- Use of pre-seed funds: three buckets with ranges linking back to §5.4 (setup, $280K–$300K), §5.5 (Y1 runway, $280K–$370K), plus strategic reserve ($50K–$150K); target midpoint ~$750K
- Seed round: $1.5M–$3M Q4 2026 / Q1 2027, triggered by concrete validation milestones (not runway pressure) — 4 explicit triggers listed
- Dual investor pipeline: EU via George, US via Felipe
- Layer 2 revenue streams flagged as roadmap optionality, explicitly NOT in Y1 P&L assumptions (float yield, VaaS, Asset Scoring API, on-chain securitization)
- Token strategy deliberately excluded from §8 — deferred to §10 Appendix

*Changes in Section 9 (Risk Matrix, newly drafted v1 Apr 22 — compact):*
- 12 material risks prioritized by (likelihood × impact), each with named owner and explicit mitigation
- Categories covered: technical, regulatory, operational, market, commercial, team, competitive, legal, infrastructure
- Three "single-points-of-failure" called out explicitly: SCD partnership (legal), renewal rate (economic), Edson (technical until second dev hires)

*Changes in Section 10 (Appendix, newly drafted v1 Apr 22 — compact):*
- §10.1 BRL stablecoin decision framework with 5-criterion weighted scoring; candidate matrix (BRZ / BRLV / BBRL / B3 native / USDC); Phase 0 decision USDC primary + BRZ as BRL leg
- §10.2 Per-cycle-event formulas as reference (Revenue / Direct cost / Gross contribution / CLV geometric formula); recovers §5.2 Base Case exactly
- §10.3 Token strategy scoping deferred from §8: explicit "no token at Phase 0, Phase 1, pre-seed, or seed"; four candidate utilities with securities-risk column; CVM 88/2022 pre-launch requirements; earliest realistic window H2 2027
- §10.4 Document maintenance note: this spec is single source of truth; Delta Log tracks changes; contradictions resolve in favor of this document

*Canonical spec v1 complete. Ready for George review and circulation to founding team.*

---

*v3 — Perplexity / model council review applied Apr 22 (post-initial-v1-close):*

**Structural economic corrections (§5 rebuilt):**
- §5.2 rebuilt: **R$37,000 base case ticket** (was R$25,000). R$25K retained as eligibility floor only, shown explicitly as contribution-negative at Phase 0 entry custody. Three-tier sensitivity table: R$25K floor / R$37K base (2.2%/mo APR) / R$50K premium (2.3%/mo APR). **Custody cost corrected to scale with asset value, not loan principal** — 0.5%/month × asset value × term-months, producing R$1,000 / R$1,480 / R$2,000 per cycle at the three tiers. Phase 1 scale custody (0.3%/mo at 500+ assets SLA) modeled as delta table. Interest convention migrated to monthly simple × months (Brazilian CCB accounting alignment).
- §5.3 rebuilt: **Bristol University 2020 study (25% baseline rollover, 85,000 UK loans)** replaces prior NPA 85% citation — which was loan-redemption, not renewal (category error). Luxury-profile + Brazilian-low-default upward adjustment → 52% realistic base, 62% achievable with retention UX, 70% stretch. CLV matrix across Phase 0 entry vs. Phase 1 scale custody × 52%/62% renewal × R$270/R$450/R$580 CAC. **Break-even analysis disclosed**: at R$37K base / R$450 CAC / Phase 0 custody, break-even is 62% renewal; at R$580 CAC, 74% renewal. **Three-lever thesis updated**: ticket (largest) > custody reduction at scale > retention UX.
- §5.5 rebuilt: Y1 P&L at R$37K ticket with scaled custody, **two CAC scenarios** (R$450 Felipe-network-concentrated / R$580 realistic mixed-channel). Operating losses R$1.57M–R$1.98M (~$262K–$330K USD) across 500/1200/2000 origination scenarios × both CAC. **Four binding assumptions flagged** (book-average ticket, channel concentration, custody scale, retention UX). Break-even horizon **Y3–Y5 range** (not Y3 point estimate).
- §5.6 updated: **Position 1 (R$20K loss-leader) declared structurally non-viable** at Phase 0 entry under corrected custody — both cycles contribution-negative. Position 4 (R$50K+ premium) dominates — Cycle 1 alone at R$829 exceeds typical CAC. Commercial decision reframed as binary: Position 2 base or Position 4 premium concentration.
- §5.8 KPIs updated: renewal targets 52% realistic / 62% with UX (was 60% / 70%); ticket target R$37–50K (was R$25–35K, which was the floor); CAC as range R$450–580 with explicit channel-mix tracking requirement.
- §5.9 **NEW: Brazilian macro rate-cycle sensitivity**. Falling Selic → narrowed borrower spread (risk) and compressed lender-yield expectations (opportunity, +R$123/cycle per 1pp lender-yield compression at R$37K ticket). Modeled as net-neutral — not baked into base P&L as tailwind.

**Product architecture additions:**
- §3.5 expanded: **Phase 0 watch eligibility filter** specified (Rolex sports/gold/Daytona, AP Royal Oak, Patek Nautilus/Aquanaut, IWC, Panerai, Vacheron IN; Tag Heuer / Longines / Tissot / vintage-unpapered OUT). Minimum asset R$50K (floor only); book average must be R$74K+ asset / R$37K+ loan. **Phase 0.5 jewelry filter**: GIA ≥2ct OR signed Cartier/Bulgari/VCA/Tiffany; minimum retail R$100K; **LTV against resale value (30–60% of retail), not retail**. Phase 0.5 timeline extended from 3 months to 4–6 months post Phase 0 (gemologist network development).
- §3.7 **NEW: Retention mechanics**. Four coordinated mechanisms — Day-60 renewal intent capture, Day-90 early-renewal incentive (10% origination fee reduction), tiered loyalty pricing (Cycle 1/2/3+ at 2.2%/2.1%/2.0%/mo), referral program (R$200–300 fee credit). Implementation sequencing: mechanisms 1+2 at Mainnet Beta, 3+4 after first 50 CCBs.

**Commercial / operational transparency additions:**
- §6.6 **NEW: Current commercial status** — SCD partnership (2 candidates in parallel active dialog, target LOI within 6 weeks of pre-seed close, definitive within 4 months, SEP-license fallback path) and custody partner (2 of Tier-1 candidates in conversation, target volume-tiered rate schedule 0.5% → 0.45% → 0.3%, São Paulo central-zone vault, blanket commercial insurance structure with rider for >R$200K pieces).
- §8.7 **NEW: Phase 0 → Phase 1 go/no-go gates**. Four gates: renewal ≥55% first cohort, CAC ≤R$500 first 30 originations, default ≤7% first cohort, SCD stability ≥30 consecutive days. Explicit "hold-and-iterate" default if any gate misses.

**Executive summary updates:**
- §1 "How the protocol earns" paragraph reframed: R$37K base ticket, per-cycle contribution stated at both Phase 0 (+R$329/+R$73) and Phase 1 (+R$920/+R$665) regimes, CLV range explicit (−R$40 Phase 0 entry → +R$1,555 Phase 1 + retention UX), "business works at scale, not at entry" thesis stated directly.
- §1 "Stage and scope" paragraph: floor vs. book-average distinction made explicit (R$25K eligibility, R$37K+ target via channel curation); Phase 1 renewal target updated from >60% to ≥62% (retention-UX-enabled target lifted from 52% realistic base).

**Review math-error finding flagged for record:** The source review's Part 5 stated Cycle 2 gross contribution of +R$642 and +R$1,007 at R$37K ticket with scaled custody. Arithmetic check: at revenue R$1,955, custody R$1,480, partner share R$383, cNFT R$5, total cost R$1,868 → contribution ≈ +R$89 (not R$642 or R$1,007). The review's consequent CLV claims (+R$983 at R$450 CAC, +R$833 at R$580 CAC) therefore overstate by roughly R$1,000 per customer. The directional findings of the review (ticket is the biggest lever, custody scales with asset value, NPA conflation, retention mechanics missing, eligibility filter needed, SCD status underspecified) are **correct and applied in full**. The magnitude has been recomputed with verifiable math. The honest finding: business is thin-negative at Phase 0 entry (−R$40 at base assumptions), decisively positive at Phase 1 scale (+R$1,190 → +R$1,555 with retention UX). Three levers still compound; the narrative tightens around the Phase 0 → Phase 1 inflection rather than claiming robust positive at entry.

*Canonical spec v3 locked. Next review cycle: George sign-off + team distribution.*
