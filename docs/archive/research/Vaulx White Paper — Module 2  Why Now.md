# Vaulx White Paper — Module 2: Why Now
*This module establishes the convergence of forces that makes 2026 the precise moment to launch Vaulx. Four independent vectors — Brazil's digital finance infrastructure, the Solana RWA ecosystem, the global tokenization inflection point, and the regulatory maturation of Brazilian crypto law — have reached critical mass simultaneously. No single vector alone is sufficient; their convergence defines the window.*

***
## Executive Summary
Vaulx is not early. It is precisely timed. In 2026, Brazil has crossed the threshold from crypto curiosity to regulated financial infrastructure, processing $318.8 billion in annual crypto volume and ranking #5 globally for adoption. Solana has simultaneously become the leading blockchain for real-world asset lending, with $1.23 billion in RWA deposits — a 115% quarter-on-quarter increase — and has overtaken Ethereum in this category for the first time. The global RWA tokenization market crossed $25 billion in mid-2025 and carries institutional projections of $9.4–16 trillion by 2030. Brazil's regulatory architecture — BVAL, BCB Resolutions 519–521, CVM tokenization sandbox, and the Drex CBDC program — is now operational, creating a legal runway that did not exist in 2022 or 2023. Physical movable assets as collateral remain the one unclaimed category across all active RWA protocols on any chain. The gap is real, the timing is validated, and the infrastructure to fill it is live.[^1][^2][^3][^4][^5]

***
## 2.1 Brazil's Digital Finance Infrastructure Is Now Mature
### 2.1.1 PIX: The Payment Rail That Changes Everything
Brazil's instant payment system PIX, launched by the Banco Central do Brasil (BCB) in November 2020, has achieved the kind of adoption that fintech players in most markets spend a decade trying to reach. By September 2025, PIX had processed 196.2 billion cumulative transactions worth USD 16 trillion — more than seven times Brazil's full-year 2024 GDP. Monthly transaction volume is now approaching 8 billion, on pace for approximately 7.9 billion in December 2025.[^6]

The critical fact for Vaulx: while 60 million Brazilians have no credit card, over 170 million — 93% of the adult population — use PIX. This means the underbanked population that represents Vaulx's core borrower is already digitally active and transacts on a real-time payment rail. Loan disbursement via PIX or PIX-compatible stablecoin is not a future aspiration; it is a present capability. The friction of reaching asset-rich, cash-poor borrowers who were previously excluded from the financial system has been structurally removed.[^6]

Person-to-business (P2B) transactions surpassed P2P volume in September 2025 for the first time, confirming that PIX has moved from peer payments to commercial financial infrastructure. This behavioral maturation means borrowers are comfortable receiving and repaying funds through digital channels — reducing Vaulx's user education burden substantially.[^6]
### 2.1.2 Brazil's Crypto Market: Scale and Seriousness
Brazil ranks #5 globally in the Chainalysis 2025 Global Crypto Adoption Index, the highest for any Latin American country. Between July 2024 and June 2025, Brazil processed $318.8 billion in crypto value — nearly one-third of all LatAm crypto volume — with a 109.9% period-over-period growth rate. This was 3x Argentina ($94 billion) and 4.5x Mexico ($71.2 billion).[^4][^5][^7][^8]

90% of that $318.8 billion came in stablecoin form, reflecting their role as practical financial instruments rather than speculative vehicles. Brazil's crypto activity is not primarily speculative trading; it is a population using stablecoin infrastructure for payments, remittances, savings, and increasingly, lending. By December 2025, Brazil's crypto activity had grown a further 43%, with average investment per user increasing in parallel.[^8][^9]

The institutional dimension is equally notable. Chainalysis categorizes institutional-sized transactions (above $10 million) as responsible for most of Brazil's crypto growth, signaling that the infrastructure attracting large capital flows is present. Brazil approved its first spot crypto ETF in early 2025. The Brazilian stock exchange B3 announced plans to launch a tokenization platform and proprietary stablecoin in 2026 to bridge traditional market infrastructure with blockchain settlement.[^5][^10][^4]
### 2.1.3 Solana Stablecoins in BRL: The On-Chain Infrastructure Is Live
The Brazilian real stablecoin ecosystem on Solana is no longer theoretical. Three developments in 2025–2026 confirm the on-chain BRL lending infrastructure is operational:

- **BRZ (Transfero)**: The world's first Brazilian real stablecoin, issued by Transfero, is live on Solana. Non-USD stablecoin usage on Solana tripled in early 2026, led by EURC and BRZ. Solana's stablecoin total reached $17 billion by early 2026.[^11][^12]
- **Loopscale + BRZ**: In March 2026, Loopscale — Solana's leading modular lending protocol, backed by Coinfund, Solana Ventures, Coinbase Ventures, and Jump — launched the first BRL-denominated credit market on Solana, enabling users to lend, borrow, and earn yield using BRZ. As of Q3 2025, Loopscale had crossed $100 million in deposits and was processing 4,000+ active loans.[^13][^14][^15]
- **BRD (CF Inovação)**: Former BCB Deputy Governor Tony Volpon launched BRD in January 2026 — a stablecoin pegged 1:1 to the Brazilian real, backed by government bonds at the Selic rate (15%), and distributing yield directly to token holders. This instrument signals that Brazil's former central banking establishment is now building on-chain financial products.[^16][^17]

For Vaulx, this infrastructure has a direct practical implication: loan disbursement and repayment can occur natively in BRL-denominated stablecoins on Solana, without requiring borrowers to hold SOL or manage cryptocurrency exposure. The "crypto complexity" barrier is effectively eliminated from the user experience.

***
## 2.2 Solana: The Only Viable Chain for This Protocol
### 2.2.1 Solana Has Become the RWA Lending Leader
Solana's RWA trajectory in Q1 2026 is unambiguous. Total RWA value on Solana crossed $2 billion in March 2026. The number of RWA holders on Solana reached a record 182,000, surpassing Ethereum in total RWA holders for the first time.[^18]

Most significantly for Vaulx: Solana's RWA lending deposits climbed to $1.23 billion in Q1 2026, a 115% quarter-on-quarter increase, overtaking Ethereum's $1.13 billion and making Solana the #1 blockchain globally for RWA lending. Institutional investment followed: $208 million flowed into Solana-linked ETPs in Q1 2026, while Ethereum saw $198 million in outflows from ETH-linked ETPs during the same period.[^1]

By late March 2026, Solana had settled approximately 94% of all-time on-chain tokenized equity spot volume. The network is not one of several competing options for RWA infrastructure — it has separated from the field.[^18]
### 2.2.2 Technical Infrastructure: Why Solana, Not Ethereum
The choice of Solana is not ideological; it is economic. For a protocol serving R$10,000–R$45,000 loan ticket sizes in Brazil, transaction cost is not a secondary consideration — it directly determines whether the unit economics are viable at the lower end of the market.

| Chain | Avg. Transaction Cost | Complex DeFi Interaction | 100,000 Daily Tx Monthly Cost |
|---|---|---|---|
| Ethereum L1 | $0.30–$15 | $50–$500+ | $900K–$4.5M |
| Polygon PoS | $0.01–$0.10 | $0.10–$1 | $10K–$100K |
| Base (L2) | $0.05–$0.30 | $0.50–$6 | $50K–$300K |
| **Solana** | **$0.00025** | **$0.001–$0.01** | **$750** |

Source:[^19][^20]

Solana processes over 65,000 transactions per second with sub-second finality, and the Firedancer validator client rollout in 2026 is targeting 100,000+ TPS. The median fee as of January 2026 sits at $0.0008 — more than three times cheaper than Base (Ethereum's lowest-cost L2).[^21][^22][^20]

For a protocol issuing compressed NFTs (cNFTs) as collateral proof documents, where each loan origination involves multiple on-chain events (appraisal hash commit, cNFT mint, vault contribution, loan disbursement, depeg monitoring), the cost difference between Solana and any Ethereum-based chain is not marginal — it is existential for the R$10,000 loan segment. On Solana, the total on-chain cost of a loan origination cycle is measurable in cents, not dollars.
### 2.2.3 The Ecosystem Advantage
Solana's ecosystem provides Vaulx with composable building blocks that would otherwise require custom development:

- **Metaplex Bubblegum cNFT standard**: Compressed NFTs that reduce minting costs by 99%+ compared to standard NFTs — essential for Vaulx's collateral documentation model
- **Kamino Finance**: The leading Solana yield optimization protocol, relevant for Vaulx's idle vault liquidity deployment strategy
- **Etherfuse TESOURO**: Tokenized Brazilian government bonds already live on Solana, creating a yield-generating option for lender vault reserves
- **Loopscale**: The BRL credit market launch in March 2026 validates that Solana can handle the Brazilian real credit stack — and creates a potential integration partner for Vaulx's vault lending mechanism

***
## 2.3 The Global RWA Tokenization Inflection Point
### 2.3.1 The Market Has Already Moved
The RWA tokenization market is no longer a projection — it is a documented growth event. In the first half of 2025 alone, the global RWA market grew over 260%, from approximately $8.6 billion to over $23 billion. By Q2 2025, the figure exceeded $25 billion — a 245x increase since 2020.[^2]

The credible institutional forecasts for 2030 range across an order of magnitude, reflecting genuine uncertainty about adoption speed rather than disagreement on direction:

| Institution | 2030 Forecast | Basis |
|---|---|---|
| McKinsey (base) | $1.9–$2 trillion | Traditional assets: bonds, equities, real estate |
| BCG + Ripple (2025 update) | $9.4 trillion | Institutional adoption + regulatory clarity |
| BCG + ADDX (original) | $16 trillion | ~10% of global GDP |
| Standard Chartered | $30 trillion by 2034 | Broad asset class inclusion |

Source:[^3][^23][^2]

Even McKinsey's conservative $2 trillion base scenario represents a 80x increase from current levels. The debate is not whether tokenized RWAs will scale — it is the speed. In every plausible scenario, the market that Vaulx is entering is growing.
### 2.3.2 The Physical Asset Gap
Every major RWA protocol active today operates in the same narrow band of asset classes: tokenized US Treasuries (Ondo, Franklin Templeton, BlackRock BUIDL), tokenized private credit (Maple Finance, Goldfinch, Credix), real estate (Homebase, RealT), and tokenized equities. The common denominator across all of them: the assets are financial instruments or financial-instrument-adjacent real estate, with digital custody and legal enforceability already solved.

Physical movable assets — watches, jewelry, vehicles, art, luxury goods — have not been touched by any live DeFi protocol on any chain. This is not because the market is small. Globally, the luxury goods market is valued at $369 billion and growing. In Brazil specifically, the luxury goods market reached USD 4.9–5.35 billion, and Brazil's pawn market processes over R$14 billion per year through TradFi alone.[^24][^25][^26][^27][^28]

The reason physical assets have not been tokenized for lending is not lack of demand — it is the complexity of custody. Building the appraisal-to-custody-to-NFT pipeline requires physical infrastructure, legal enforceability in the specific jurisdiction, and operational know-how that is entirely outside the competency of a blockchain development team. Vaulx's team brings that infrastructure. This is the structural barrier that defines the moat.
### 2.3.3 "2026 is the Pivot Year" — Institutional Consensus
The assessment that 2026 marks the inflection from experimental to structural is not Vaulx's framing — it is the institutional consensus. A February 2026 analysis co-authored by 1exchange CEO Sheena Lim stated: *"2026 marks the year RWA tokenization moves from experimental to a real economic force. We are operationalizing blockchain for the global financial core."* The RWA.io 2026 outlook describes the year as "a strategic inflection point for global capital markets" where "tokenized RWA will no longer be a niche experiment but a cornerstone of institutional portfolios."[^29][^30][^31]

For Vaulx, the timing implication is direct: entering in 2026 means building on proven infrastructure, in a proven market, with regulatory clarity that did not exist 18 months earlier — while still being first in the physical collateral category. The window for a first-mover advantage with infrastructure support is now.

***
## 2.4 Brazil's Regulatory Architecture: From Absent to Operational
### 2.4.1 The Legislative Timeline
Brazil's crypto regulatory journey has been structured and fast by emerging market standards:

- **December 2022**: Congress passed the Brazilian Virtual Assets Law (BVAL), establishing the legal framework for virtual asset service providers (VASPs) and requiring KYC/AML compliance. This was the foundational legislation.[^4]
- **June 2023**: BVAL came into force.
- **2025**: BCB issued three operational resolutions — Resolution 519 (licensing regime for intermediary, custodian and broker VASPs), Resolution 520 (Travel Rule for all domestic transfers), and Resolution 521 (additional operational requirements) — all taking effect in February 2026.[^32][^4]
- **August 2025**: COFECI published Resolution 1.551, the first regulation in Latin America specifically governing real estate tokenization — creating direct precedent for Vaulx's physical asset model.[^33]
- **Early 2025**: Brazil approved its first spot crypto ETF.[^4]
- **February 2026**: BCB's full VASP licensing framework came into force. Brazil officially transitioned from a "developing crypto ecosystem" to a "globally recognized licensed jurisdiction."[^32]
### 2.4.2 SCD Licensing: Vaulx's Regulatory Path
The Sociedade de Crédito Direto (SCD) — Direct Credit Company license issued by the BCB — is the most relevant regulatory instrument for Vaulx's lending operations. The SCD framework was updated with CMN Resolution covering digital lending operations in 2025, clarifying requirements for digital-first credit operations.[^34][^35]

An SCD license grants the holder the legal right to originate credit operations in Brazil without requiring a full banking license, using its own capital or third-party capital raised through regulated instruments. This is the same structure used by Brazilian digital lending fintechs operating today. For Vaulx, an SCD provides the legal wrapper to issue CCBs (Cédula de Crédito Bancário — Brazilian bank credit notes), which are legally enforceable debt instruments that can be tokenized and used as collateral or transferred on-chain.[^36]

The critical point: the SCD framework already exists, has been used successfully by digital lenders, and has been recently updated to accommodate blockchain-based operations. Vaulx does not need to create new law — it needs to operate within an existing, functioning framework.
### 2.4.3 CVM Regulatory Sandbox and Tokenization Precedent
The CVM (Comissão de Valores Mobiliários, Brazil's SEC equivalent) operates an active regulatory sandbox in which tokenized asset projects go through full issuance and distribution cycles under supervisory oversight. CVM Resolution 88 already governs equity crowdfunding including tokenized offerings, providing a clear pathway for Vaulx's vault token structure (where lender vault positions represent a tokenized credit instrument).[^33]

The sandbox approach is important for Vaulx: it means the regulator is actively trying to learn and accommodate innovation in tokenized finance, not block it. Projects that engage the CVM sandbox proactively receive regulatory clarity faster than those operating in ambiguity.
### 2.4.4 Drex: Context and Significance
Brazil's CBDC program, known as Drex (Digital Real), represents the BCB's long-term infrastructure ambition. Despite the August 2025 news that BCB was reconsidering the blockchain layer architecture for Drex, the program's core objective — creating a government-backed programmable settlement layer for tokenized assets — remains intact.[^37][^38][^39]

For Vaulx, Drex's significance is strategic rather than operational. The fact that the BCB has committed to building tokenized settlement infrastructure sends an unambiguous signal to financial institutions, regulators, and investors: Brazil's central bank is aligned with the direction Vaulx is building toward. The Drex framework explicitly contemplates smart contracts and tokenized collateral. Vaulx's protocol is architecturally compatible with Drex integration in its later phases, which represents both a competitive moat (institutional trust) and an eventual partnership opportunity.[^37]

***
## 2.5 Why Not Earlier — and Why Not Later
The argument for 2026 as the precise entry point is not simply "now is a good time." It requires answering two specific counterfactuals.
### Why Not 2022–2024?
Three critical components were missing:

1. **BRL stablecoin infrastructure on Solana was not established.** BRZ's Solana integration was early-stage; the BRL credit market launched by Loopscale did not exist until March 2026. Loan disbursement in BRL on-chain was operationally complex.
2. **Brazil's VASP regulatory framework was not in force.** BVAL passed in December 2022 but came into effect in June 2023, with operational BCB resolutions only issued in 2025 and effective February 2026. Operating a lending protocol before this framework created unacceptable regulatory risk.
3. **Solana's RWA ecosystem was pre-institutional.** The $1.23 billion in RWA lending deposits, the Etherfuse TESOURO tokenized bond integration, the cNFT standard maturity, and the Firedancer upgrade were not present. The infrastructure layer that makes composable RWA lending viable on Solana did not reach critical mass until late 2025.
### Why Not 2027–2028?
The physical collateral category is currently empty. That will not remain true indefinitely. The combination of:
- Validated market demand (TradFi pawn volume growing)
- Proven regulatory frameworks (SCD + CVM sandbox)
- Operational on-chain BRL infrastructure
- Global institutional capital moving toward RWA protocols

...means the category will attract well-capitalized entrants, potentially including fintech incumbents, traditional pawnbrokers seeking digital channels, or well-funded Web3 teams. The first-mover advantage in building the custodian network, the appraiser network, and the on-chain credit history of borrowers is time-limited. The defensible moat — Gitel's physical security and custody infrastructure, the appraiser relationships, the regulatory positioning, and the brand trust with Brazilian borrowers — must be established before competitors have a reason to build the same stack.

The window is open now. It will not remain open indefinitely.

***
## 2.6 Confluence Summary: The Five Forces That Converge in 2026
| Force | Status in 2026 | Vaulx Relevance |
|---|---|---|
| Brazil crypto adoption | #5 globally, $318.8B volume, 90% stablecoin | Borrower base is crypto-capable; BRL stablecoin disbursement is viable |
| BRL on-chain infrastructure | BRZ live, Loopscale BRL credit market launched March 2026, Selic-yield BRD stablecoin launched | Loan ops in BRL natively on Solana |
| Solana RWA leadership | $1.23B lending deposits, #1 globally, +115% QoQ | Protocol infrastructure, ecosystem composability, institutional credibility |
| Global RWA inflection | $25B market, $9.4–16T forecast for 2030, "2026 = structural pivot" | Market timing validated by institutional consensus |
| Brazil regulatory framework | BVAL in force, BCB 519/520/521 live, CVM sandbox active, SCD pathway clear | Legal operating environment established; risk of regulatory ambiguity eliminated |

Source:[^1][^2][^4][^5][^13]

No single force is sufficient. The five in combination create the precise window Vaulx is built to enter.

***

*Module 2 complete. Next: Module 3 — The Product (cNFT mechanics, vault architecture, crowdlending P2P model, liquidity mismatch solutions, default and recovery mechanics, risk matrix).*

---

## References

1. [Solana Overtakes Ethereum in RWA Lending as Institutional Inflows ...](https://www.kucoin.com/news/flash/solana-overtakes-ethereum-in-rwa-lending-as-institutional-inflows-rise-in-q1-2026) - Solana took the lead in real-world assets (RWA) news in Q1 2026, with RWA deposits hitting $1.23 bil...

2. [$16-30 Trillion by 2030: Unlocking the RWA Opportunity - Mintlayer](https://www.mintlayer.org/blogs/16-30-trillion-by-2030-unlocking-the-rwa-opportunity) - In conservative forecasts, BCG sees tokenized assets reaching $16 trillion by 2030, which would repr...

3. [Asset Tokenization Forecasts Range: $2T to $30T by 2030](https://www.assettokenization.com/resources/asset-tokenization-forecasts-range-from-2t-to-30t-by-2030) - In its base forecast, McKinsey cautiously estimates a $1.9 trillion tokenization market by 2030, inc...

4. [How Brazil is Realizing its Crypto Potential](https://cryptoforinnovation.org/how-brazil-is-realizing-its-crypto-potential/) - In November 2025, the BCB released a new set of rules for virtual asset service providers (VASPs) in...

5. [Breaking Down Brazil's New Crypto Framework - Chainalysis](https://www.chainalysis.com/blog/brazil-crypto-asset-regulatory-framework-2025/) - Brazil is extending financial sector regulation to encompass crypto activities as part of a comprehe...

6. [Pix to approach 8 billion monthly transactions as it marks](https://www.globenewswire.com/news-release/2025/11/14/3188285/0/en/Pix-to-approach-8-billion-monthly-transactions-as-it-marks-five-year-milestone-EBANX-study-finds.html) - Since its launch in 2020 through September 2025, Pix has processed 196.2 billion transactions, movin...

7. [Global Crypto Adoption 2025: Chainalysis Reveals Which Countries ...](https://www.mexc.com/news/84830) - (187 117)

8. [#210: Brazil crypto volumes at $319 billion from 2024-25, says ...](https://www.linkedin.com/pulse/210-brazil-crypto-volumes-319-billion-from-2024-25-says-aaron-stanley-bityf) - Brazil checked in at #5 in the global rankings, and has emerged as a far larger market than competit...

9. [Crypto News: Brazil's Crypto Activity Jumps 43% in 2025 as Average ...](https://www.binance.com/en/square/post/34052410521026) - Brazil's cryptocurrency market showed clear signs of maturation in 2025, with transaction volumes ri...

10. [Brazil's main stock exchange plans to roll out tokenization platform ...](https://cryptobriefing.com/brazil-tokenization-platform-launch/) - Brazil's main stock exchange B3 will launch a tokenization platform and stablecoin in 2026 to expand...

11. [Loopscale Solana Token Launch 2026 - Instagram](https://www.instagram.com/popular/loopscale-solana-token-launch-2026/) - Loopscale Solana Token Launch 2026 · Stablecoins on Solana have tripled in a year, reaching $17 bill...

12. [Solana Non-USD Stablecoin Usage Triples with EURC, BRZ - Phemex](https://phemex.com/news/article/solana-nonusd-stablecoin-usage-triples-led-by-eurc-and-brz-70447) - Solana's non-USD stablecoin usage triples, led by EURC and BRZ, as major institutions integrate its ...

13. [NEW: @Loopscale launches a $BRL-denominated credit market ...](https://x.com/SolanaFloor/status/2036467418671800401) - NEW: @Loopscale launches a $BRL-denominated credit market on @solana, enabling users to lend, borrow...

14. [Loopscale Q3 2025 Recap](https://blog.loopscale.com/posts/q32025recap) - In Q3, Loopscale established itself as Solana's defining modular, order book-based lending protocol,...

15. [Solana Launches First Credit Market in Brazilian Real - LinkedIn](https://www.linkedin.com/posts/rafael-giuga-borba-de-mello-a2029b16a_transfero-and-loopscale-launched-the-first-activity-7442597982887219200-Zkk5) - Transfero and Loopscale launched the first credit market denominated in the Brazilian Real on Solana...

16. [Yield-Sharing Stablecoin BRD Unveiled by Former Central Banker ...](https://cryptorank.io/news/feed/0c9f5-yield-sharing-stablecoin-brd-brazil) - Existing examples include BRZ, launched by Transfero Swiss AG, and BBRl, from the Brazilian exchange...

17. [Former Brazil central banker intros yield-bearing stablecoin](https://crypto.news/brazil-central-bank-official-yield-bearing-stablecoin/) - Tony Volpon introduced BRD, a stablecoin pegged 1:1 to the Brazilian real and backed by Brazilian go...

18. [Solana Ecosystem Roundup: March 2026](https://solana.com/news/solana-ecosystem-roundup-march-2026) - Solana's RWA lending deposits reached $1.2 billion, leading all networks and, by late March, Solana ...

19. [Blockchain Platform Economics: 20000x Cost Difference & Selection ...](https://23stud.io/blog/smart-contract-platform-economics-cost-comparison-2025) - Transaction costs vary 20,000x: Solana $0.00025 vs Ethereum $0.30-$15 per transfer. Learn which plat...

20. [What Are Solana Gas Fees and Why They're So Cheap | 2025 Guide](https://learn.backpack.exchange/articles/solana-gas-fees) - Understand how Solana gas fees work, why they stay under one cent, and how they compare to Ethereum ...

21. [Solana News April 2026: RWA Lead & $110 Rebound - BYDFi](https://www.bydfi.com/en/cointalk/solana-news-april-2026-rwa-lending-firedancer-update) - Latest Solana news for April, 2026. BYDFi analyzes $SOL's climb to $110, its leadership in RWA lendi...

22. [Solana Ranks Among the Cheapest Major Blockchains by Median ...](https://www.mexc.co/news/678824) - According to the chart, Solana's median fee sits around $0.0008, placing it more than three times ch...

23. [Real-World Asset Tokenization Market Has Grown Almost Fivefold in ...](https://finance.yahoo.com/news/real-world-asset-tokenization-market-140000752.html) - " McKinsey predicts it to become a $2 trillion market, while BCG estimates $16 trillion by 2030. The...

24. [Using Real-World Assets as Collateral in DeFi - RWA.io](https://www.rwa.io/post/using-real-world-assets-as-collateral-in-defi) - Key Takeaways. Real-world assets can unlock liquidity in DeFi lending, allowing asset owners to acce...

25. [Brazil Luxury Goods Market Size, Share | Statistics 2033](https://www.imarcgroup.com/brazil-luxury-goods-market) - Brazil luxury goods market size reached USD 4.9 Billion in 2024. Looking forward, IMARC Group expect...

26. [Brazil Luxury Goods Market - Brands, Trends & Share Analysis](https://www.mordorintelligence.com/industry-reports/brazil-luxury-goods-market) - The Brazil luxury goods market size is expected to grow from USD 5.35 billion in 2025 to USD 5.63 bi...

27. [TradFi aumenta em 20% valor de avaliação em penhor](https://agenciabrasil.ebc.com.br/economia/noticia/2024-12/caixa-aumenta-em-20-valor-de-avaliacao-em-penhor) - Quem não tem relacionamento do banco pode obter até 85% do valor do item no penhor. Os objetos aceit...

28. [Tokenized Collectibles: Blockchain for Physical Assets - RWA.io](https://www.rwa.io/post/bringing-physical-collectibles-to-the-blockchain) - Tokenizing collectibles means creating unique digital tokens on a blockchain that represent actual p...

29. [Why 2026 Marks the Pivot for Real-World Asset Tokenization from ...](https://www.newswire.ca/news-releases/why-2026-marks-the-pivot-for-real-world-asset-tokenization-from-experimental-pilots-to-active-global-markets-886882524.html) - "2026 marks the year RWA tokenization moves from experimental to a real economic force," concludes S...

30. [Why 2026 Marks the Pivot for Real-World Asset Tokenization from ...](https://www.prnewswire.com/in/news-releases/why-2026-marks-the-pivot-for-real-world-asset-tokenization-from-experimental-pilots-to-active-global-markets-302677244.html) - "2026 marks the year RWA tokenization moves from experimental to a real economic force," concludes S...

31. [Rwa Tokenization Future for 2026 - RWA.io](https://www.rwa.io/post/rwa-tokenization-future-for-2026) - Explore the rwa tokenization future 2026. Discover key drivers, challenges, and technological advanc...

32. [Navigating Brazil's Crypto Regulations: KYC, AML, and Compliance ...](https://bingx.com/en/learn/article/navigating-brazil-crypto-regulations-kyc-aml-compliance-beginners-guide) - In 2026, Brazil has transitioned from a developing crypto ecosystem into a globally recognized Licen...

33. [Real Estate Tokenization in Brazil 2026](https://blog.tokenizer.estate/real-estate-tokenization-in-brazil-2026-latin-americas-biggest-market-makes-its-move/) - Brazil has dedicated RE tokenization regulation, a CBDC designed for tokens, and a live exchange. Ho...

34. [New Regulation for Credit, Financing, and Investment Companies](https://www.demarest.com.br/en/new-regulation-for-credit-financing-and-investment-companies/) - As of September 01, 2025, SCFIs must be incorporated as corporations (sociedades anônimas). Their op...

35. [The New Face of Finance Companies: What Changes with CMN ...](https://www.mayerbrown.com/en/insights/publications/2025/08/the-new-face-of-finance-companies-what-changes-with-cmn-resolution-no-5237-2025) - For credit fintechs, it represents an opportunity to migrate from the Direct Credit Company (SCD) mo...

36. [Digital Lending in Brazil: What it is and how It works](https://silvalopes.adv.br/digital-lending-in-brazil-what-it-is-and-how-it-works/) - Digital lending in Brazil, Central Bank regulations for fintechs (SCD & SEP), and how Open Finance a...

37. [Digital Real: everything you need to know about DREX - BRICS Brasil](https://bricsbrasil.com.br/en/digital-real-everything-you-need-to-know-about-drex/) - ... Brazil (BCB). Scheduled for launch in 2025, DREX has the potential to revolutionise the use of m...

38. [Drex – Digital Brazilian Real - Banco Central do Brasil](https://www.bcb.gov.br/en/financialstability/digital_brazilian_real) - The BCB established the guidelines for issuance of the digital Brazilian currency, henceforth named ...

39. [Brazil Abandons Blockchain For Its Drex CBDC Project - Forbes](https://www.forbes.com/sites/digital-assets/2025/08/13/brazil-abandons-blockchain-for-its-drex-cbdc-project/) - Brazil's Drex CBDC project will no longer use blockchain due to scalability and privacy challenges.

