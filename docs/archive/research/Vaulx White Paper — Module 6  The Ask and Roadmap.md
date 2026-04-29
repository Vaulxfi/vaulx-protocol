VAULX WHITE PAPER — MODULE 6: THE ASK AND ROADMAP
WHAT IS BEING ASKED AND WHY
Vaulx is applying to the Colosseum Frontier Hackathon accelerator program. Winners are admitted into an 8-week program — two weeks in person in San Francisco, six weeks remote — and receive $250,000 in pre-seed funding in exchange for approximately 7% equity. Colosseum is co-founded by former Solana Foundation operators, is backed by a $60 million venture fund with the Solana Foundation as LP, and runs the closest analog to a Y Combinator that exists in the Solana ecosystem.

The $250,000 is not a grant in the traditional sense. It is a pre-seed investment. It is structured, milestone-tracked, and expected to produce a fundable company ready to raise a seed round at Demo Day, which Colosseum runs as a live VC pitch event. The ask is therefore not just "give us money to build." It is: "here is precisely what $250,000 buys, here is what we will have built at the end of 8 weeks, and here is why that positions Vaulx to raise $2–5M in the subsequent seed round."

THE REGULATORY ARCHITECTURE: SCD, SEP, OR BOTH
This is the single most important legal question in the business model and must be answered before any budget is allocated to compliance.

The SEP (Sociedade de Empréstimo entre Pessoas) is the Brazilian Central Bank's framework for P2P lending platforms, established by CMN Resolution 4,656 (2018), updated by Resolution 5,050. An SEP is a pure intermediary: it connects lenders to borrowers but cannot use its own capital to lend. This is exactly Vaulx's model — the vault pools lenders' capital and deploys it to borrowers. The SEP cannot raise deposits from the general public, but Vaulx's lenders are investing, not depositing — a critical distinction.

Critical constraint: SEP loan caps are set at R$15,000 per borrower per operation in the original resolution language. For Vaulx's target loan size of R$10,000–50,000, this creates a structural ceiling. One of two paths addresses this:

SCD license instead: The SCD (Sociedade de Crédito Direto) lends its own capital (including investor-deposited capital structured as equity/CRI/FIDC instruments). Minimum capital requirement is R$1,000,000. This route has no per-loan cap and is more flexible for higher-value collateral loans. Over 60 SCDs are currently authorized by BACEN. The Conta Simples case shows this path works: they obtained the SCD license, then raised a $41.5M Series B.

SEP + CCB issuance: The SEP originates each loan as a CCB (Cédula de Crédito Bancário), a negotiable instrument. The R$15,000 limit applies to the SEP's role as intermediary, but the CCB itself can be issued for higher values via a partnered financial institution (a "banking as a service" arrangement with an existing SCD or bank). This is the faster and cheaper path to launch, using Gitel's existing banking relationships as the bridge.

Recommended path: Launch via CCB issuance in partnership with an existing SCD (using a BaaS arrangement), which requires no new BACEN license. Simultaneously apply for the Vaulx SEP license in parallel. By Month 8–10, operate under own license. By Year 2, upgrade to SCD as capital scales above R$1 million.

Estimated legal and compliance cost:

External fintech counsel for structure and BaaS agreements: R$80,000–150,000 (one-time)

SEP application preparation and filing: R$50,000–80,000

SEP minimum capital requirement: R$1,000,000 (balance sheet item, not an expense)

Ongoing BACEN reporting and SCR compliance: R$15,000–25,000/month

BUDGET BREAKDOWN: WHAT $250,000 COVERS
The $250,000 pre-seed is denominated in USD. At current BRL/USD rates (~5.7x), this converts to approximately R$1,425,000. The budget is allocated across four categories: Technology, Legal/Compliance, Operations, and Go-to-Market.

Technology (40% — ~$100,000 / R$570,000)
Smart contract development (Anchor framework, Solana/Rust):
Vaulx's protocol requires five core smart contract modules: (1) vault manager (deposit, withdrawal, share token mint/burn), (2) loan originator (disbursement, collateral lock, maturity tracking), (3) cNFT custody proof (Metaplex Bubblegum integration), (4) default and liquidation handler, (5) secondary market for vault share tokens.

A mid-complexity DeFi lending protocol on Solana costs $40,000–$80,000 in development, with Rust/Solana carrying a 10–30% premium over Solidity equivalents due to auditor and developer scarcity. With an experienced in-house developer (the 5th team member), the external development spend is primarily on specialist Anchor framework contributors and UI/UX front-end.

Estimated smart contract development: $35,000–50,000 externally, remainder covered by in-house developer salary (included in team runway below).

Smart contract audit (Sherlock, OtterSec, Sec3, or Neodyme — all specialize in Solana/Rust):
A mid-complexity DeFi protocol (multiple contracts, lending + vault logic) costs $15,000–$60,000 for the initial audit. A re-audit pass after remediation adds $5,000–$20,000. Budget: $30,000–40,000 for two-pass audit before mainnet launch. This is non-negotiable — over $3.1 billion was lost to smart contract exploits in H1 2025 alone.

Infrastructure (Solana RPC, IPFS/Arweave for cNFT metadata, monitoring, DevOps):
Estimated $3,000–6,000/month for initial scale. Budget: $15,000 for 3 months pre-revenue.

Front-end dApp development: R$60,000–100,000 for MVP borrower and lender interfaces. Mobile-responsive, PIX on-ramp integration, wallet connection (Phantom, Backpack).

Total technology budget: ~$100,000

Legal and Compliance (20% — ~$50,000 / R$285,000)
BaaS partner agreement with existing SCD (legal structuring): $15,000–20,000

CCB issuance framework and BACEN pre-consultation: $10,000–15,000

SEP license application filing: $10,000–15,000

KYC/AML compliance provider integration (Truora, Idwall, or Serpro): $5,000–8,000 setup + $1,000–2,000/month

Terms of service, privacy policy, borrower agreements: $5,000–8,000

CVM analysis for lender-side tokenized vault positions: $5,000–10,000

Total legal/compliance budget: ~$50,000

Operations (25% — ~$62,500 / R$356,000)
Gitel custody network integration (dedicated staff, security protocols, intake equipment): R$50,000 setup + R$30,000/month (partially offset by custody fees charged to borrowers)

Appraiser network onboarding (São Paulo, Rio de Janeiro, Belo Horizonte — initial 3 cities): R$80,000 (training, certification, insurance)

Appraisal equipment and photography studio setup (2 locations): R$30,000

Insurance for custodied assets (Mapfre Seguros or Lloyd's Brazil correspondent): R$20,000 setup

Total operations budget: ~$62,500

Team Runway and Go-to-Market (15% — ~$37,500 / R$213,000)
Partial team salaries for 4 months (founders drawing reduced salaries during accelerator period): R$120,000

Marketing and user acquisition (borrower side): R$40,000 (pilot 200 borrowers)

Lender community development (Solana DeFi community, Brazilian crypto investors): R$20,000

Demo Day preparation and travel: R$15,000

Contingency (10% of total): R$18,000

Total team/GTM budget: ~$37,500

MILESTONE MAP: WHAT GETS BUILT AND WHEN
The 8-week Colosseum accelerator structure defines the tactical timeline. Beyond that, three additional phases take Vaulx from accelerator graduation to Series A ready.

Phase 0 — Pre-Accelerator Preparation (Now → Hackathon Submission)
Deliverables:

White paper completed and team-aligned (this document)

Legal structure defined (BaaS path confirmed with a banking partner)

Smart contract architecture designed (full spec, not code)

Borrower prototype: static demo with 2–3 real luxury assets photographed and appraised, cNFT minted on devnet

Pitch video: 3 minutes, covers all six Colosseum criteria (problem, solution, market, team, model, traction)

GitHub repository with initial Anchor framework scaffolding

Capital required: Zero (pre-award). Team time only.

Risk removed: Submission quality risk. The prototype and cNFT devnet demo are the single most differentiating elements against competing teams that submit only concepts.

Phase 1 — Colosseum Accelerator (8 Weeks, $250K Deployed)
Weeks 1–2 (San Francisco, in person):

Finalize smart contract specification with mentors

Confirm BaaS partner and legal structure

Complete full smart contract development (vault manager + loan originator + cNFT integration)

First internal devnet deployment

Weeks 3–6 (Remote):

Smart contract audit initiated (Sherlock or OtterSec)

Front-end dApp development (borrower intake, lender vault interface)

KYC/AML integration

Gitel custody protocol formalized and documented

Appraiser network: 10 certified appraisers onboarded in São Paulo and Rio

First 20 beta borrowers onboarded (friends, Gitel network, Marcelo's business contacts)

Beta lenders: minimum R$200,000 in vault from known investors

Weeks 7–8 (Demo Day Preparation):

Audit remediation complete; mainnet deployment

20+ live loans completed on mainnet with real collateral

Key metrics for Demo Day: loan volume, repayment rate, lender yield, avg loan size

Investor deck prepared for seed raise

End-of-Phase 1 Milestones:

Mainnet-deployed protocol (not testnet)

R$200,000+ in active loan volume

20+ completed loan cycles

0 security incidents

Regulatory path confirmed (BaaS agreement signed or SEP filing submitted)

Capital deployed: $250,000 (full accelerator grant)

Risk removed: Technology risk (audited code), regulatory risk (legal structure confirmed), market risk (real borrower demand validated with 20+ transactions)

Phase 2 — Seed Round and Scale (Months 3–14 Post-Accelerator)
Target raise: $2,000,000–$3,500,000 seed round

This is the standard trajectory for Colosseum accelerator graduates — Colosseum's Demo Day is attended by 150+ investors, and the program's explicit goal is to position teams to raise seed funding immediately post-graduation. Comparable RWA seed rounds in 2025–2026: Aura Finance raised $5M seed led by Pantera and Founders Fund; Brickken raised €3M Pre-A; RWA pre-seed checks in Brazil range from $200K to $2M from Canary, Maya Capital, Valor Capital, and QED Investors.

For Vaulx's seed, the target investor profile is:

Brazilian fintech VCs: QED Investors (invested in Nubank, Creditas, Rebel), Valor Capital Group (invested in Nubank, OLX, iFood), Canary (Bull, Kanastra)

Solana ecosystem funds: Colosseum's own continuation check, Multicoin Capital, Distributed Global

RWA specialist funds: Pantera Capital, Framework Ventures, Coinbase Ventures

Seed round use of proceeds ($2.5M target):

Category	Amount	Purpose
Technology (V2 + audit)	$400,000	Multi-collateral support, secondary market, mobile app
Legal (SEP license + SCD prep)	$300,000	Own license, R$1M SCD capital contribution begins
Operations (national expansion)	$600,000	10 cities, 50 appraisers, Gitel facility expansion
Team (full salaries)	$700,000	18-month runway for 5 core team members at market rates
Marketing and acquisition	$300,000	1,000 active borrowers target, lender community
Liquidity reserve seeding	$200,000	Protocol liquidity buffer (10% vault reserve)
End-of-Phase 2 Milestones (Month 14):

400+ active monthly loans (breakeven threshold per Module 5 analysis)

R$8,000,000+ active loan book

SEP license granted or SCD application filed

10 Brazilian cities covered

R$3,000,000+ in lender vault TVL

CLV/CAC ratio validated in the field (target: >5x)

First rollover cohort generating the 26% margin (vs 16.8% initial cycle)

Valuation at seed: Based on comparable RWA/DeFi seed rounds and Brazilian fintech precedents, a pre-money valuation of $8–12M is defensible at this stage. At $2.5M seed on a $10M pre-money, the cap table is: founders ~60%, Colosseum 7%, seed investors ~21%, option pool 12%.

Phase 3 — Series A and LatAm Expansion (Months 15–30)
Target raise: $8,000,000–$15,000,000 Series A

Trigger conditions: R$20M+ loan book, 1,000+ active monthly loans, SEP/SCD license held, first non-Brazil market validated.

LatAm expansion economics (evidence-based):
The business model document estimates R$10,000–45,000 per country for LatAm expansion. This is plausible for markets where:

A local BaaS partner absorbs regulatory complexity (same path as Brazil Phase 1)

Local custody partners exist with existing security infrastructure (Gitel's model replicated via franchise/partnership)

Digital appraisal handles the majority of the loan book (reducing in-person infrastructure requirement)

Target markets: Colombia (35M crypto users, large informal credit market), Mexico (Bitso infrastructure, peso stablecoin liquidity), Argentina (dollarization pressure driving demand for hard-currency lending against physical assets).

US market entry (Phase 3, Month 24+):
The US pawn lending market is valued at $8.6 billion and projected to reach $45.6 billion by 2030. Florida and New York are the two priority states based on Brazilian diaspora concentration and luxury asset density.

US pawnbroker license requirements (Florida): State license via the Florida Office of Financial Regulation, background checks, bonded requirement ($10,000), local municipal permits per location. Total licensing cost: $15,000–40,000 plus ongoing compliance. This is not a regulatory barrier — it is a cost of entry that is well-understood and manageable.

The US market requires a separate legal entity (Delaware C-Corp), local compliance counsel, and a custody partner with CFTC/SEC-compliant asset management procedures for high-value items. Budget: $200,000–400,000 for US legal setup and first-city pilot (Miami).

Phase 4 — Institutional Product and Token Launch (Months 30–48)
Institutional securitization:
At R$50M+ loan book, Vaulx packages CCBs into a FIDC (Fundo de Investimento em Direitos Creditórios) — the Brazilian equivalent of an ABS (Asset-Backed Security). Senior tranches are sold to institutional investors at 12–15% yield in BRL terms. This is Centrifuge's playbook, which used this structure to reach $1B+ TVL. A FIDC structure attracts pension funds, family offices, and institutional treasuries as lenders — transforming Vaulx from a retail platform to an institutional credit marketplace.

GFI token (optional, market-dependent):
A governance and yield-sharing token could be introduced to align lenders, appraisers, and borrowers with the long-term protocol. Token design: staked GFI earns a portion of origination fees; GFI is required for access to premium borrower rates; governance votes on risk parameters and new collateral categories. Token launch is deferred until the protocol has demonstrated durable unit economics — a lesson learned from every DeFi protocol that launched tokens before product-market fit.

RISK MATRIX: WHAT COULD FAIL AND HOW IT IS MITIGATED
Risk	Probability	Impact	Mitigation
Regulatory: BACEN rejects SEP application	Low	High	BaaS partner path operates legally without own license; 60+ SCDs currently operating shows path is open
Technology: smart contract exploit	Medium	Critical	Two-pass audit mandatory before mainnet; bug bounty program; 10% liquidity reserve
Market: borrower demand slower than projected	Medium	Medium	Gitel's existing customer base is the initial demand pool; conservative base case requires only 400 loans/month at breakeven
Lender liquidity: insufficient vault deposits	Medium	High	George and Fernando's finance networks seed the first R$500K; Colosseum network provides access to Solana DeFi capital
Custody: asset theft or damage	Low	High	Professional insurance (Mapfre/Lloyd's), Gitel's existing Federal Police-regulated security infrastructure
Collateral depreciation below LTV floor	Very Low	Medium	50% LTV means >50% collapse required for loss; luxury watches and jewelry have historically maintained value over 30–90 day windows
Competition: TradFi launches digital pawn	Low	Medium	TradFi has 900 branches and a 2-3 year digital transformation timeline; Vaulx will have 10,000+ completed loan cycles before any competitor reaches the market
BRL stablecoin depeg	Medium	Medium	Dual-vault architecture (USDC + BRLz); all high-value loans denominated in USDC
VALUATION AND EXIT SCENARIOS
Why investors should care about Vaulx beyond the fintech narrative:

Comparable exits and valuations in adjacent spaces:

Creditas (Brazilian secured lending fintech): valued at $4.8B at peak, $1.75B in last known round

Nexo: acquired by Crédit Mutuel Arkéa at implied $3.5B valuation

Centrifuge: $1B+ TVL, seed investors (Coinbase Ventures, IOSG) hold positions worth multiples of entry

EZCorp (US pawnbroker public): ~$600M market cap on $1B revenue — 0.6x revenue multiple for a traditional operator

Vaulx's on-chain, asset-light model should command a significant premium to EZCorp's multiple. At $10M ARR (achievable at base case Year 3) and a 5–10x revenue multiple (appropriate for a fintech platform with network effects), enterprise value is $50–100M. At the optimistic projection ($30M+ ARR, 1,000+ monthly loans), $200–500M enterprise value is a realistic 5-year target — consistent with DeFi protocol valuations at equivalent TVL.

Strategic acquirers who would be interested in Vaulx at maturity:

Nubank: expanding into collateralized credit, lacks physical custody infrastructure

MercadoLibre (Mercado Crédito): deep LatAm payments but no luxury asset lending

Coinbase: building RWA infrastructure, physical collateral on Solana is a gap

Traditional Brazilian banks (Itaú, Bradesco): buying fintech to accelerate digital credit transformation

## THE PITCH LOGIC FOR COLOSSEUM: ONE PARAGRAPH
Vaulx is asking Colosseum for $250,000 to build and audit the first DeFi lending protocol secured by physical luxury assets — a category that does not yet exist on any chain. Brazil has 80.6 million defaulters, a luxury goods market worth $5B, and a pawn lending infrastructure capped at 900 branches with 20–30% LTV. Vaulx delivers 50–60% LTV, on-chain in under 24 hours, through a custody network that already exists via Gitel. The $250,000 funds four months of audited product development, 10 cities of appraiser coverage, and 20+ live mainnet loan cycles. At Demo Day, Vaulx will have a running protocol, a validated unit economics story (CLV/CAC >5x), and a clear path to $2.5M seed. The Colosseum grant is not the destination — it is the credentialing event that unlocks the institutional capital that follows.