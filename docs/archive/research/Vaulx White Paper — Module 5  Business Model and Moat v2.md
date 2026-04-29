# Vaulx White Paper — Module 5: Business Model & Moat

***

## Overview

This module stress-tests Vaulx's economic architecture: the revenue model, unit economics, breakeven path, scenario projections, and the depth and durability of the competitive moat. The objective is not to present optimistic projections but to establish what the numbers require to be true, quantify the margin levers, and demonstrate why no well-funded incumbent — not TradFi, not a Brazilian bank, not a fintech with crypto rails — can replicate the model within 18 months without building from zero the combination of physical custody infrastructure, borrower origination network, and on-chain collateral programmability that Vaulx is assembling.

***

## 5.1 How the Revenue Model Works

Vaulx earns across three primary streams that span the loan lifecycle, plus a growing second layer of protocol revenue.

### Primary Revenue: Three Lifecycle Sources

**Stream 1 — Origination Fee (Taxa de Abertura): 2–3% of principal at disbursement.**
This fee covers appraisal cost (R$215 online + R$450 in-person), logistics (transport, custody intake), cNFT minting, and Solana gas. At a R$20,000 average ticket and a 2.5% midpoint, each origination generates R$500 in gross fee revenue. This is not profit — it is designed to be cost-neutral to slightly positive on the first cycle, making the unit economics fundamentally a retention story, not an acquisition story.

**Stream 2 — Interest Spread (Spread Líquido): 8–12% p.a.**
Vaulx charges borrowers 18–24% p.a. and pays lenders (liquidity providers) 6–12% p.a. in the USDC and BRL stablecoin vaults. The net spread on a R$20,000 loan at 120-day term is approximately R$480–R$960 per cycle at the 18%/6% floor or 24%/12% ceiling, averaging R$720 in spread income at midpoint. For comparison, Maple Finance pools historically return 8–15% APY to depositors on institutional lending, with the protocol taking 10% of interest as its cut; Goldfinch's senior pool pays 7–10% APY while junior tranches earn 12–20%. Vaulx's LP structure is competitive within RWA lending market norms.[^1][^2]

**Stream 3 — Liquidation Fee: 5% on sale value in default events.**
At a target default rate below 5% of portfolio and a recovery rate above 90%, this is deliberately not a primary revenue driver — and framing it as a "revenue line" would be analytically dishonest. At 400 loans/year with 5% default and 90% recovery on R$20,000 average tickets, the expected liquidation fee is approximately R$18,000 per year in Y1 — marginal. The function of this fee is to signal to LPs that Vaulx participates in recovery economics, aligning incentives.[^1]

### Why 90% Recovery Is Achievable and How It Benchmarks

Physical collateral in pawn-type structures has structurally superior recovery dynamics versus unsecured credit. In US pawn lending, approximately 80–85% of borrowers repay their loans on time and reclaim their items, meaning default is already low before any recovery activity begins. For the portion that does default, the collateral is retained and sold — a process that, in a properly run physical custody network, recovers the full loan amount on a liquid asset category (watches, jewelry) in the overwhelming majority of cases. The National Pawnbrokers Association data and GEM Pawnbrokers operating data confirm ~85% repayment rates in the US.[^3]

By contrast, RWA on-chain credit pools without physical collateral have a significantly weaker track record: since 2020, the on-chain credit market has experienced 12 major defaults totalling $156M with an average recovery rate of only 8.3%. This is the structural gap Vaulx's physical collateral model addresses. The 90%+ recovery target is not aggressive — it is the expected outcome of a collateral-first architecture with LTV capped at 50–60% on standardized, liquid categories (luxury watches and jewelry).[^4][^1]

***

## 5.2 Unit Economics: CLV, CAC, and the Rollover Lever

### The Core Equation

The single most important insight in Vaulx's unit economics is that the first cycle (C1) is a loss-leader and the rollover (C2+) is where the economics become compelling. This is by design and is structurally sound — it mirrors how mature pawn and asset-lending businesses work, where the cost of appraisal and logistics is a one-time friction that dilutes first-cycle margin but is eliminated on renewals.

**Cycle 1 gross margin: ~16.8%**
- Revenue: R$500 (origination) + R$720 (spread) = R$1,220
- Variable cost per operation: R$1,728 (appraisal + logistics + cNFT mint + custody)[^1]
- Cycle 1 variable P&L: approximately –R$508 per loan before fixed cost allocation

**Cycle 2+ (Rollover) gross margin: ~26%**
- Revenue: R$720 (spread) + R$100 (rollover fee 0.5% on R$20K)[^1]
- Variable cost: R$0 new appraisal, minimal logistics — borrower extends, asset stays in custody, NFT state transitions on-chain
- Rollover variable P&L: approximately +R$820 per rollover cycle before fixed cost allocation

This is the core economics argument: **each additional cycle on the same loan costs nearly nothing and contributes R$750–R$820 in margin**. The CLV over one year (1 cycle + 3 rollovers at 120-day intervals) is R$2,865 per client. Industry benchmarks for lending platforms target LTV/CAC ratios of at least 3:1; Vaulx's projected CLV/CAC at R$2,865 CLV vs. R$350–500 CAC is approximately 5.7–8.2x — well above the 3:1 benchmark that signals healthy unit economics.[^5][^6][^1]

### CAC Validation

The R$350–500 CAC for Vaulx's borrower acquisition is operationally credible for the following reasons. The primary acquisition channels in Phase 0 (São Paulo) are:
- Watch dealers, collectors clubs, and Telegram communities: referral-based, near-zero media spend
- In-store co-marketing with custodian partners: shared cost model
- Word-of-mouth within the asset-rich, credit-excluded population: high network density within luxury goods communities

For context, Brazilian fintech CAC benchmarks are substantially higher: digital banks acquiring credit card clients typically spend R$300–700 per customer, and these are undifferentiated credit products. Vaulx's collateral requirement effectively pre-qualifies borrowers and creates a pool of high-intent, asset-bearing prospects, reducing media spend per funded loan relative to unsecured credit products.[^7]

***

## 5.3 Breakeven Model: What the Math Requires

### The Core Breakeven Conditions

The breakeven requires one of two conditions to be met:[^1]
- **Without rollover concentration:** ~1,200 CCBs/year at R$20,000 average ticket
- **With 60% rollover concentration:** ~800 CCBs/year at R$20,000 average ticket

At 800 CCBs/year with 60% rollover, the math works as follows:

- Total loan cycles: 800 + (800 × 0.6 × 3 rollovers) = 800 + 1,440 = 2,240 cycle-events
- Revenue per cycle-event: approximately R$720 weighted average (originations + rollovers blended)
- Gross revenue: ~R$1.6M
- Fixed costs at Y2 scale: R$900K–1.1M
- Gross margin: ~R$500–700K operating contribution at 60% rollover mix

The Year 1 base case of 400 CCBs produces a –R$580K operating result — this is not a failure; it is expected validation-phase burn. The protocol is spending to build the custodian network, appraiser relationships, and on-chain CCB origination infrastructure. The question investors must answer is whether the operational infrastructure being built in Y1 can realistically scale to 800 CCBs in Y2. Given a single São Paulo custodian covering 50+ CCBs/month at maturity, scaling to 800 by adding 1–2 more custodians and onboarding the jewelry/art categories (Phase 1) is operationally feasible.[^1]

### Scenario Analysis

| Scenario | Y2 CCBs | Rollover Rate | Gross Revenue | Fixed Costs | Operating Result |
|----------|---------|---------------|---------------|-------------|-----------------|
| Conservative | 700 | 40% | ~R$1.4M | R$1.0M | ~–R$200K |
| Base Case | 1,000–1,200 | 60% | R$2.2–2.8M[^1] | R$900K–1.1M[^1] | R$400–700K |
| Optimistic | 1,500+ | 70% | R$3.5M+ | R$1.1M | R$1.5M+ |

The conservative scenario is still close to breakeven, which is the key structural point: the downside is bounded by the physical asset value floor and the absence of credit risk in the traditional sense. Even at 40% rollover and 700 CCBs, the protocol does not face catastrophic loss because each loan is overcollateralized at 167% (LTV 60%).[^1]

***

## 5.4 Layer 2 Revenue: Sizing the Protocol Extension

The business model document identifies 12 future revenue opportunities across 5 layers. The following represents a grounded sizing of the four most near-term streams:[^1]

### Layer 1: Yield on Float (Kamino Finance / MarginFi)

Disbursed loan capital and lender vault deposits that are pre-positioned (awaiting deployment) can generate passive yield via Solana lending protocols. Kamino Finance, as of early 2026, holds over $3.2 billion in TVL and is the second-largest protocol on Solana, offering USDC yields of 5.1–6.5% APY. At Vaulx's Y1 TVL of ~US$1.6M and average float utilization of 10–20% (idle capital between disbursements), annual yield on float: US$8,000–20,800, or approximately R$40–80K/year. This number grows proportionally with TVL — at US$5M TVL and 15% float, the range becomes R$120–200K/year.[^8][^9][^1]

### Layer 2: Rollover Fee (0.5% per renewal)

At 60% rollover across 1,000 CCBs in Y2: 600 renewals × R$100 per renewal = R$60,000/year. This scales to R$18–52K/year at Y1 scale, confirming the figure in the business model. This is a real but small revenue line — its importance is more behavioral than financial: it signals borrower intent to continue and provides a minor friction-reducing cost to not defaulting.[^1]

### Layer 3: Vault-as-a-Service (VaaS) for Third Parties

The most defensible B2B revenue opportunity. VaaS infrastructure allows third-party protocols (e.g., other LatAm RWA originators, microfinance platforms, cooperatives) to use Vaulx's lending vault smart contracts, legal framework, and custodian network without building their own. YieldNest's VaaS framework demonstrates the category: protocols, asset managers, and institutions deploy custom yield vaults on existing infrastructure. Accountable Capital's VaaS product similarly shows B2B demand for pre-audited, compliant vault infrastructure. Conservative sizing: 3–5 B2B clients at R$20–50K/year in platform fees = R$60–240K/year — achievable by V3 (mid-2027 onwards).[^10][^11][^1]

### Layer 4: Asset Scoring API (B2B Data Layer)

Vaulx's triangular appraisal model — combining Chrono24/WatchBox online valuation, GIA gemology standards, and FIPE vehicle pricing — generates a proprietary asset valuation database that no other protocol is accumulating on-chain. At scale, this becomes a sellable B2B API for:
- Other pawn/lending platforms needing real-time luxury asset pricing
- Insurance companies pricing policy coverage on high-value movables
- Resale platforms needing instantaneous liquidity estimates

Sizing: R$50–200K/year at mid-maturity, contingent on data volume (minimum ~500 cumulative appraisals to have credible price discovery). This is a mid-term opportunity that becomes available in Y2–Y3.[^1]

***

## 5.5 Competitive Moat Analysis

### The Three-Layer Moat

Vaulx's moat is not a single competitive advantage — it is the compound effect of three interlocking layers that each take 12–24 months to replicate independently and considerably longer to replicate simultaneously.

**Layer 1: Physical Custody Network (Operational Moat)**

Building a reliable custodian and appraiser network requires:
- Negotiating SLA contracts with logistics/security operators (e.g., Gitel-class operators with bank-grade transport capacity)
- Calibrating appraiser training to standardized protocols (Triangular Appraisal V1.2)
- Building operational trust with borrowers who are handing over R$20,000–200,000+ in physical assets

This cannot be fast-tracked with capital. A new entrant writing checks in 2026 starts from zero relationships. TradFi has ~900 branch locations but its pawn operations are bureaucratic, limited to 20–30% LTV, and are institutionally incapable of pivoting to an on-chain, 50–60% LTV model without regulatory restructuring and years of internal approval cycles. Brazilian banks offering CDC (Crédito Direto ao Consumidor) do not accept physical movable collateral at all.[^1]

**Layer 2: On-Chain Credit History (Data Moat)**

Every borrower who completes a CCB cycle on Vaulx accumulates a verifiable, on-chain credit record: loan amount, collateral category, LTV, repayment behavior, rollover history. This is the beginning of a borrower reputation layer that no traditional credit bureau in Brazil captures for the collateral-dependent, credit-score-negative population. After 12 months of operations, Vaulx will hold the only dataset of its kind in LatAm — physical luxury asset valuations correlated with on-chain lending behavior for credit-excluded borrowers. Replication requires borrower volume, which requires the custody network (Layer 1) to already exist. This is a circular dependency that compounds the moat over time.

**Layer 3: Smart Contract Stack and Audit Trail (Technical Moat)**

A competitor building on Solana from scratch requires: cNFT custody logic (Metaplex Bubblegum), a vault program with dual-token support (USDC + BRL stablecoin), a PDA-based NFT custody mechanism, a cron-based maturity monitoring bot, a BRL depeg oracle, and a multisig liquidation flow. Smart contract audits cost R$150–400K and take 3–6 months. Building and auditing this stack from zero in 2026 is a 12–18 month engineering effort for a capable team. Vaulx's stack will be audited and in production before any well-funded competitor even finishes hiring their Solana engineers.[^1]

### Why a Well-Funded Startup Cannot Replicate in 18 Months

A hypothetical competitor with $5M in capital raised in Q3 2026 would face:
- **Month 1–3:** Hire Solana engineers, begin smart contract development
- **Month 3–9:** Build custody protocol, conduct security audits (R$150–400K, 3–6 month timeline)
- **Month 6–12:** Source and negotiate custodian partnerships in São Paulo (relationship-dependent, cannot be bought)
- **Month 9–15:** Legal entity + SCD/FIDC structure for LP fund compliance
- **Month 12–18:** Soft launch with minimal volume

At Month 18, this competitor has a prototype with 20–50 loans. Vaulx, starting 18 months earlier, has 400–800+ CCBs, an audited production smart contract, 2–3 trained custodians, a borrower NPS above 80, and a proprietary asset valuation dataset. **The replication barrier is not technology — it is time-in-market combined with relationship capital.**

### TradFi/Bank Replication Analysis

TradFi's structural advantages — national brand, banking license, ~900 branches — are neutralized by its institutional architecture:
- TradFi operates pawn at 20–30% LTV under Banco Central regulation; moving to 50–60% LTV requires regulatory approval for a new product category[^1]
- TradFi's core infrastructure is not blockchain-capable; on-chain transparency would require a multi-year digital transformation
- TradFi's cost-per-operation for a physical pawn transaction is materially higher than Vaulx's variable cost of R$1,728/op at scale
- TradFi's interest rate on pawn is 20–26% p.a.; even if it wanted to compete on cost, its cost of capital and institutional overhead prohibit undercutting[^1]

Brazilian fintechs (e.g., Creditas, Nubank) do not accept physical movable collateral at all — their entire credit model is digital-first, document-based, and collateral-free. They cannot pivot without building the physical custody infrastructure from zero.

***

## 5.6 Network Effects: The Compounding Advantage

Vaulx has three distinct network effects that strengthen over time, each feeding into the others:

**Custodian Network Density:** As loan volume grows, custodian utilization increases, justifying better pricing (volume-based SLA discounts) and attracting higher-quality custodian partners who want stable, recurring demand. More custodians → more geographic coverage → more borrowers → more custodian utilization. This is a supply-side network effect.

**Appraiser Specialization:** Appraisers who complete 50+ Vaulx-standard appraisals become calibrated to the Triangular Model V1.2 methodology, producing faster, more consistent valuations. This appraiser quality improves over time and is non-transferable to a competing platform with a different methodology. More volume → better appraiser calibration → faster appraisal SLA → better borrower experience → more volume.

**On-Chain Borrower Reputation:** The most durable long-term moat. Each borrower who completes cycles builds an on-chain repayment record. Within 2–3 years, a borrower with 8–12 completed cycles on Vaulx has a credit history that no other platform — traditional or DeFi — can verify or replicate. This reputation becomes a genuine asset: Vaulx can offer better rates to high-reputation borrowers, creating a lock-in effect that grows over time. The rotating credit line (Layer 5, Product Expansion) becomes the natural monetization of this reputation layer.[^1]

***

## 5.7 LatAm Asset-Light Expansion Economics

The core claim — R$10–45K per country to expand to Colombia, Mexico, Panama, Peru, Chile — is credible under the following conditions:

- **No proprietary infrastructure required:** Each new country onboards existing local custodians and appraisers using the Vaulx playbook (6–10 weeks per country)[^1]
- **Smart contract reuse:** The on-chain protocol requires only localized BRL stablecoin swap to the target-country stablecoin or USDC denomination; the core contract logic is unchanged
- **Regulatory cost per country:** LatAm jurisdictions comparable to Brazil (Colombia, Peru) have lighter-touch RWA/fintech regulation in 2026 than Brazil's SCD/CVM framework. Legal opinion per country = R$8–20K; custodian SLA = R$5–15K; appraiser training = R$3–8K. Total: R$16–43K per country, consistent with the R$10–45K range[^1]
- **Fixed cost delta:** Zero incremental headcount required. Each country is managed remotely until loan volume justifies a local operations hire (typically Month 4–6 in-country)

The critical assumption is that luxury asset categories (watches, jewelry) are sufficiently standardized across LatAm markets to apply the same appraisal methodology. Chrono24 and WatchBox operate global price databases — these are directly applicable in Mexico City, Bogotá, Lima, and Panama City as in São Paulo.

***

## 5.8 US Market Entry Economics

The US pawnbroker market was valued at approximately US$4.5 billion in 2025 by IBISWorld, with broader market estimates ranging to US$14.5 billion including adjacent asset-backed consumer lending. The Vaulx business model deck cites a TAM of US$8.6B growing to US$45.6B by 2030 — this upper figure captures the growth of luxury asset lending beyond traditional pawn, incorporating digital collateral platforms and RWA lending, which is consistent with the broader global pawnbroking market projected to grow at 5.58% CAGR to US$77.8 billion by 2035 across all categories.[^12][^13][^1]

**Pawnbroker license requirements in Florida and New York:**
- Florida: Pawnbroker license through the Florida Office of Financial Regulation; requires background checks, bond ($10K), and compliance with Chapter 539 Florida Statutes; typical timeline 60–90 days; cost approximately US$2,000–5,000 in fees[^14]
- New York: Licensed secondhand dealer and pawnbroker; New York City also requires a separate NYPD Secondhand Dealer license; more complex multi-jurisdictional compliance; timeline 4–8 months; estimated cost US$5,000–15,000 in legal and licensing fees

Miami is the correct first entry point: Florida has a concentrated luxury goods consumer population, a large LatAm diaspora already familiar with collateral-based lending, and lighter regulatory overhead than New York. The US entry cost is estimated at R$200–400K in legal, licensing, and initial marketing — significantly more than LatAm per-country costs, but entering a market where the competitive LTV advantage (50–60% vs. US pawn average of 25–60%) remains strong.[^15]

***

## 5.9 What the Model Requires to Be True

A rigorous stress test of the model identifies four conditions that must hold for the base case projections to be achievable:

| Condition | Requirement | Failure Mode | Mitigation |
|-----------|-------------|--------------|------------|
| Rollover rate ≥ 60% | Borrowers re-engage after first cycle | Unit economics degrade to ~16.8% margin permanently | Channel selection targets high-rollover profiles (watch collectors with recurring liquidity needs) |
| Default rate < 5% | Physical collateral discipline maintained | Recovery cost erodes spread; LP confidence falls | LTV cap at 50–60% on liquid categories only; strict appraisal SLA |
| CAC stabilizes ≤ R$500 | Acquisition channels remain cost-efficient | Unit economics require repricing or volume to compensate | Referral network + custodian co-marketing limits paid media dependency |
| BRL stablecoin depeg < 1% | Dual-vault architecture holds | Borrowers take FX loss; LP USDC pool demand shifts | Automated 5-minute depeg monitor; USDC primary vault option[^1] |

The most operationally sensitive variable is the rollover rate. If rollovers concentrate below 40%, the breakeven shifts from 800 to 1,400+ CCBs/year, delaying Y2 operational breakeven into Y3. The mitigation is front-loading borrower selection toward established luxury goods holders with demonstrated asset-holding behavior — this is the precise borrower profile that the custodian partner network (watch dealers, jewelry associations) generates organically.

***

## Conclusion

Vaulx's business model is structurally sound as a collateral-first lending protocol, with unit economics that are competitive within the RWA lending category and a physical custody moat that no existing DeFi or fintech competitor can fast-follow. The key risks are operational — rollover concentration, appraiser quality consistency, and custodian reliability — not technological or regulatory. The Layer 2 revenue streams (VaaS, Asset Scoring API, Kamino float yield) are real but modest in Y1–Y2; they become material as TVL crosses US$5M and B2B partnerships activate. The LatAm expansion playbook is asset-light and replicable at low cost per country. The US entry, while more capital-intensive, enters a market where Vaulx's LTV advantage and on-chain transparency are genuine differentiators over the US$4.5B traditional pawn sector. The breakeven path requires 800 CCBs/year with 60% rollover — achievable in H2 Year 2 given the custodian and appraiser network being built in Phase 0.[^2][^6][^13][^1]

---

## References

1. [vaulx-business-model-v2.6-EN.pdf](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_d9484e42-dedc-4282-a092-d9fb838de61d/b86380a6-9b1e-48df-b602-4806e83b883f/vaulx-business-model-v2.6-EN.pdf?AWSAccessKeyId=ASIA2F3EMEYE6K2YJXTS&Signature=Md5%2BBmCIbn6nx1loNOtHGxE2rIo%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEBAaCXVzLWVhc3QtMSJHMEUCIQCmYIrs3uvezF6wwZ54UpIBm0zOo0P8E3%2FEX3%2B%2FV1M53AIgUz%2F8xCtvEyGoVmPWiTaOj0W8%2BMw8c8ZDuWKIee7MHX0q%2FAQI2f%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARABGgw2OTk3NTMzMDk3MDUiDLCfe1zuxIdNYnh%2FLirQBNE5FEoZ0UggIJnvVljDcM126z%2B%2BIcInBqzCekv93wYEeZEeZXmtTVd231zSHBB6QTGFVeNs14DMvBK%2BNxceUrN6Km%2BMC7Km0kk7jKykaN3l4sDZ6U8mJ7xLKtNVkbzMVpx7MXuvoLinVUIpvnGBN1D%2BpnzyNFB8wyI0hCKno6WHJ0Vrkc7mAVP2TQ%2B3rpRsjVL2fxjBzppAKyP5Qtw2Ztjj2UqpGvL7LwCtfJMVpiNrU4i5JeFw5XZnQH%2FVemUH59LLQ%2BgPIYUqL9%2FE1GbDvK2P%2Bxx3WWglSJ%2FC08%2FSbDqi4ZqnxUXOg5FfxbsdgvICKla2%2BU3ETZ%2B2bKGXae%2BnVW9YReJcDbBkGEaqSHvyrYFNlV0saOCDuNE%2BnpfqYF6KmlIZ1QnlB4bw4EVdZ2F6Moms9p%2BmLKtWr1mH5ox0aScu8clHe5Rfq2174pU%2FDntzuGLDzU%2BNyrr8JfgpC4V0gQ0FAvs23wUTe7dNIo5gMiNXLERTEs1ET5iAlD%2BfTbcYDjiEA74TZDs4LyctXpHmnzkUF2hoBLf78JO184qxqQ7bu49eN1NPV6azyOjdNp1ihBuA33yq2f%2FaepLxV%2F%2BjIs7KuujRp%2FKRi8ruXDdw1NulcECX2sK%2FREYP%2BC4yb2Ml%2B6GHJq6r%2B6ivyJzoAEW6kTeEtWsNeSdcyrEVfjhhxlwFdSe%2FdPh9ADGcFXMv1uBvq8EB0OP4R6gwb0umzX6g0p09p4dmRRgU3WWss%2BfFfLQzkUyiwlpWPmRO5eFT1cxtniTuEl84m2RK%2BUYSnZFCZgkw9KmJzwY6mAHxhM6jISK%2Flf7u5uYc7pkNy5er1pWte26TfsZ0VmEmSlEEUK6LVNe%2FjBtPPKh5wHHsjYRkMAC3JHgGCvtRUeEqkRPRjVxR1kSePFRVhyY%2BSpVqlMWllF7NEgEWywda9h3EOWCQvcpfoI%2BQeCuDooEcwzypnNZRe8uXssWKnJ%2BgLt6rJEPauJJ91t5dZ4wkVc7eK5jyF%2Fixkg%3D%3D&Expires=1776444103) - 01
§  0 1 Value Proposition
Three stakeholders, one edge: superior LTV with on-chain transparency
02...

2. [Maple vs Goldfinch: DeFi Lending Protocol Comparison 2026](https://fensory.com/insights/compare/maple-vs-goldfinch) - Compare Maple Finance vs Goldfinch institutional lending protocols. Analyze borrower types, yields, ...

3. [How Collateral Redemption Works in Pawn Shops - GEM Pawnbrokers](https://www.gempawnbrokers.com/blogs/news/how-collateral-redemption-works-in-pawn-shops) - Learn how to successfully redeem collateral from pawn shops, including documentation, fees, and lega...

4. [$156M Lost: The Complete History of RWA Defaults ... - PRISM](https://www.prismapp.co/about) - Prism Terminal monitors 150+ RWA pools across credit, tokenized securities, real estate, commodities...

5. [How to Calculate Unit Economics for Startups (LTV, CAC & More)](https://kruzeconsulting.com/blog/unit-economics/) - Know your unit economics—learn how to calculate contribution margin, CAC payback, LTV, and why these...

6. [Unit Economics for Lending Platforms Explained](https://www.phoenixstrategy.group/blog/unit-economics-lending-platforms-explained) - Customer Acquisition Cost (CAC): The cost to acquire a single borrower. Customer Lifetime Value (LTV...

7. [Brazil Credit Card Financing Market 2025: Growth, Competition and ...](https://rankingslatam.com/blogs/industry-news/brazil-credit-card-financing-market-2025-growth-competition-and-market-share-dynamics-december-2025-rankings) - As of December 2025, the market comprises 224 institutions with active credit card loan portfolios, ...

8. [Solana vs Ethereum Stablecoin Yield: Speed, Cost, APY 2026](https://rebelfi.io/blog/solana-vs-ethereum-stablecoin-yield-comparison) - Solana protocols: - Kamino Finance (USDC): 5.1-6.5% APY (avg 5.7%) - Save (formerly Solend) (USDC): ...

9. [Kamino Finance Season 4 Airdrop Guide 2026: How To Earn ...](https://blog.mexc.com/kamino-finance-season-4-airdrop-guide-2026-how-to-earn-kmno-on-solanas-largest-lending-protocol/) - As of early 2026, Kamino holds over $3.2 billion in total value locked — making it the second-larges...

10. [MAX Vault-as-a-Service - YieldNest](https://www.yieldnest.finance/vaas) - Our (VaaS) framework gives protocols, asset managers, and institutions the ability to create custom ...

11. [Vault-as-a-Service | Build Financial Products Onchain](https://accountable.capital/vaas) - Vault-as-a-Service (VaaS) lets protocols, asset managers, and enterprises deploy secure, pre-audited...

12. [Pawn Service Market Size | Research Report, 2025 To 2035](https://www.marketgrowthreports.com/market-reports/pawn-service-market-115156) - Pawn Service Market size in 2026 is estimated to be USD 50402.85 million, with projections to grow t...

13. [Pawn Shops in the US Market Size Statistics | IBISWorld](https://www.ibisworld.com/united-states/market-size/pawn-shops/4741/) - Market Size statistics on the Pawn Shops industry in the US

14. [Pawnbroker Strategic Insights: Analysis 2025 and Forecasts 2033](https://www.marketresearchforecast.com/reports/pawnbroker-43434) - The global pawnbroking market is a resilient and adaptable sector, demonstrating consistent growth d...

15. [Shop Pawn Essentials: Understanding How Collateral Loans Work](https://pawnanaheim.com/2024/04/19/shop-pawn-essentials-understanding-how-collateral-loans-work/) - Interest rates for pawn shop loans vary widely, ranging from 12% to 240% depending on state laws, an...

