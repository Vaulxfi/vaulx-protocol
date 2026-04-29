# Vaulx White Paper — Module 1: The Problem
> *This module is the first of six sections of the Vaulx White Paper. It establishes the evidentiary foundation for the problem Vaulx addresses: a structurally broken credit system that excludes asset-rich borrowers, charges predatory rates, and has no on-chain solution.*

***
## 1.1 Executive Summary
Brazil operates one of the most expensive credit markets in the world while simultaneously holding one of the largest concentrations of physical private wealth in Latin America. The collision of these two realities — extreme credit cost on one side, idle tangible assets on the other — defines the market failure Vaulx is built to correct. Approximately 80 million Brazilians are in formal default, revolving credit card rates reached 451.5% per year in August 2025, and 44% of the entire adult population carries a negative credit record. At the same time, Brazil's luxury goods market is valued at USD 4.9 billion, the luxury watch market alone at USD 629 million, and 433,000 Brazilians are classified as millionaires. The country's only mass-market physical collateral lending institution — TradFi Econômica Federal — operates penhor (pawn credit) through approximately 900 specialized branches in a country of 215 million people, processes loans in person only, and offers loan-to-value ratios of 85–100% against jewelry and luxury goods but confined to its physical network. No DeFi protocol on any blockchain accepts physical movable assets as collateral. Vaulx fills a gap that is simultaneously gigantic and uncontested.[^1][^2][^3][^4][^5][^6][^7][^8]

***
## 1.2 The Macroeconomic Context: A Credit System Built Against Its Users
### 1.2.1 The World's Most Expensive Consumer Credit
Brazil's benchmark Selic rate stood at 15% per year from June 2025 until March 2026, when the Banco Central do Brasil reduced it by 25 basis points to 14.75% — the first cut in nearly two years. This base rate is already elevated by global standards, but the transmission to retail lending is what makes Brazil exceptional. Average household credit carries an effective rate of 58.4% per annum as of August 2025. Personal loan rates without payroll deduction run at approximately 88.79%. And revolving credit card debt — the most widely used consumer credit product in the country — reached 451.5% per year in August 2025, rising 24.6 percentage points over the prior twelve months. By February 2026, revolving credit card rates were reported at 436% per year, approximately thirty times the Selic base rate.[^9][^10][^11][^4][^12][^13]

The Brazilian Central Bank itself, as recently as April 2026, rejected legislative proposals to cap credit card rates, arguing that price controls reduce credit supply. The structural spread between funding costs and retail lending rates in Brazil remains among the highest in the world, driven by high default risk provisions, operating costs, credit market concentration, compulsory reserve requirements, and implicit taxation on financial intermediation. For the average borrower without payroll credit access, formal credit is economically irrational.[^14][^15]
### 1.2.2 A Default Crisis of Systemic Proportions
The debt burden on Brazilian households has crossed into systemic territory. By November 2025, Serasa Experian recorded 80.6 million people in formal default — representing 49.3% of the entire adult population. Total delinquent debt reached R$511 billion, with average debt per defaulted person climbing to R$6,345. The CNDL/SPC Brazil data for December 2025 placed the total defaulter count at 73.49 million, an increase of 10.17% compared to December 2024. Debts with delays between four and five years grew 32.64%, indicating a population trapped in long-term exclusion rather than short-term liquidity crisis.[^1][^3]

Between 2017 and 2025, the share of Brazilian families carrying debt rose from 58% to 79%, while the share in default increased to 30%. Banks and credit cards remain the primary source of default (26.9–27.3% of cases), followed by utilities, suggesting defaults are concentrated in essential consumption credit, not discretionary spending. The IMF's 2025 analysis of Brazil's credit market confirms this dynamic: rapid fintech expansion and income growth drove credit demand, but the high Selic transmitted fully into retail rates, compressing household repayment capacity even as incomes rose.[^16][^3][^17]

The practical consequence for the credit-excluded population is binary: either pay 400%+ per year for revolving credit, access informal lenders (*agiotas*) at rates that are entirely unregulated, or remain without liquidity entirely. This is the market Vaulx enters.

***
## 1.3 The Asset Side: Idle Wealth at Scale
### 1.3.1 Brazil's Luxury Asset Base
The credit exclusion problem exists against a backdrop of substantial private asset accumulation. Brazil's luxury goods market was valued between USD 3.58 billion and USD 5.35 billion in 2024–2025, depending on the source, with forecasts ranging from USD 5.32 billion by 2032 to USD 5.63 billion by 2026. The luxury watch segment reached USD 629 million in 2024 and is projected to reach USD 795 million by 2033. The jewelry market is valued at approximately USD 3.2 billion in 2025. Combined, watches and jewelry alone represent a USD 3.8+ billion market in Brazil — assets that appreciate, are globally liquid, and serve as near-perfect collateral because their value is portable, verifiable, and independent of income or creditworthiness.[^18][^19][^8][^20][^21]

Brazil leads Latin America in millionaire count. The UBS Global Wealth Report 2025 counts 433,000 Brazilians with net worth above USD 1 million, 19th globally and first in the region, with projections of 464,000 by 2028. The country's millionaire population grew 1.6% from 2023 to 2024. Below the millionaire threshold, Brazil has a large and growing middle-to-upper-middle class that holds significant assets in jewelry, luxury watches, art, and vehicles, purchased during periods of relative prosperity — assets now sitting idle as credit access deteriorates.[^22][^7]
### 1.3.2 The Asset-Rich, Cash-Poor Dynamic
The structural mismatch is precise: households own appreciating physical assets but are denied credit because their formal income is irregular, their credit score is negative, or they operate in the informal economy. Brazil's per capita monthly household income was R$2,069 in 2024 according to IBGE, but income distribution is severely uneven, with a Gini coefficient that places Brazil among the most unequal of 56 countries studied by UBS. A significant share of Brazil's population accumulates wealth in tangible form — gold jewelry, branded watches, vehicles — not in financial instruments. This population has no credit market that reads their asset wealth.[^7][^23]

TradFi's penhor explicitly acknowledges this: it requires no credit analysis, accepts anyone over 18 regardless of default status, and requires only ID and proof of residence. This is an admission by Brazil's largest retail bank that collateral-backed credit bypasses the entire credit scoring infrastructure. The problem is not that the concept is unproven — TradFi has proven it. The problem is that the delivery infrastructure is inadequate, the digital channel does not exist, and the LTV and product terms have remained static for decades.[^5][^6]

***
## 1.4 The Existing Solutions and Their Failures
### 1.4.1 Traditional Banks: Exclusionary by Design
Brazilian banks apply standard credit scoring and formal income verification. For the 80.6 million people in default and millions more with irregular income profiles, formal bank credit is structurally unavailable. Banks in 2025 explicitly tightened credit criteria: Itaú, Santander, Banco do Brasil, and TradFi all reinforced restrictions for delinquent consumers, requiring demonstrated formal income, stable employment, and clean credit history — precisely the criteria that exclude the asset-rich but income-irregular demographic. Even for borrowers who qualify, personal loan rates run above 88% per year, eliminating the financial logic of borrowing for short-term liquidity.[^3][^12][^24]
### 1.4.2 TradFi pawn channel: The Right Concept, the Wrong Infrastructure
TradFi's penhor (pawn credit) is the closest functional analog to Vaulx. It accepts jewelry, watches, gold, silver, platinum, pearls, coins, and high-value pens as collateral. In December 2024, TradFi raised its appraisal tables by 20%, signaling rising demand and the increasing value of gold-backed collateral. The average monthly interest rate for penhor is 2.97% per month (approximately 42% annualized) — expensive but far below revolving credit. As of 2025, with SELIC at 15%, Brazilians were actively seeking penhor as a cheaper alternative to revolving credit, and the media reported rising demand.[^5][^6][^25]

The failures of TradFi pawn channel are structural, not conceptual:

- **Geographic coverage**: TradFi operates approximately 900 penhor-specialized branches across a country with 5,570 municipalities. Coverage is concentrated in state capitals and major cities. Rural and semi-urban populations with significant jewelry assets have no access.[^26]
- **In-person only**: There is no digital channel. The borrower must physically bring the asset to a branch, wait for appraisal, sign paper contracts, and return in person to reclaim the asset. Processing is not instant.
- **LTV limitations**: Non-TradFi customers receive up to 85% of appraised value. The appraisal methodology is conservative and follows internal TradFi tables, not real market prices for luxury goods.[^5]
- **Product rigidity**: Standard 90-day terms with manual renewal. No on-chain credit history, no rollover automation, no stablecoin disbursement.
- **Asset ceiling**: Limited to gold, silver, and pearls. High-end luxury items — branded watches, art, designer goods, vehicles — are outside scope.
- **No digital borrower record**: Each transaction is isolated. There is no accumulation of borrower reputation or history that could reduce rates over time.
### 1.4.3 Existing DeFi: Crypto-Native Collateral Only
Decentralized finance has created sophisticated lending infrastructure — Aave, Compound, MakerDAO, Maple Finance, Goldfinch, Centrifuge — but every protocol accepts only on-chain assets as collateral: cryptocurrencies, tokenized treasuries, tokenized real estate in specific jurisdictions, or on-chain financial instruments. The tokenized RWA market reached USD 24 billion in 2025, driven primarily by US Treasuries and money market funds. No protocol on Solana, Ethereum, or any other major chain accepts physical luxury movable assets — watches, jewelry, art, vehicles — as DeFi collateral. This gap is not an oversight. It exists because the custody, appraisal, and off-chain legal framework required to underwrite physical assets has not been built. Vaulx builds that layer.[^27][^28][^29]
### 1.4.4 Informal Lenders (*Agiotas*)
The informal credit market fills part of the gap. Brazilian *agiotas* operate outside regulation with effective interest rates that range from 10% to 30% per month (120% to 360% per year), with no legal recourse for borrowers and collection methods that are coercive and sometimes violent. The size of the informal lending market in Brazil is not precisely measured, but the persistence of 80+ million defaulted consumers who continue to seek short-term credit confirms its scale. This population would rationally choose collateral-backed DeFi credit at 40–60% annualized if accessible, over informal credit at 120–360%.

***
## 1.5 The Market Gap: Quantified
| Dimension | Data Point | Source |
|---|---|---|
| Brazilians in formal default | 80.6 million (49.3% of adults) | Serasa Experian, Nov 2025[^3] |
| Revolving credit card APR | 451.5% per year (Aug 2025) | Banco Central do Brasil[^4] |
| Average household lending rate | 58.4% per year (Aug 2025) | BCB[^4] |
| Selic rate (Apr 2026) | 14.75% | BCB[^9] |
| Brazil millionaires (2024) | 433,000 | UBS Global Wealth Report 2025[^7] |
| Brazil luxury goods market | USD 4.9–5.35 billion (2024–2025) | IMARC / Mordor Intelligence[^2][^19] |
| Brazil luxury watch market | USD 629 million (2024) | IMARC[^8] |
| Brazil jewelry market | USD 3.2 billion (2025) | IMARC[^20] |
| TradFi pawn channel rate | 2.97%/month (~42% annual) | G1/Jornal Nacional, May 2025[^25] |
| TradFi pawn channel branch coverage | ~900 specialized branches | TradFi IR / Vaulx source[^26] |
| Global pawn market (2024) | USD 38.8–43 billion | Intent MR / Maia Research[^30][^31] |
| Brazil alternative lending market | USD 1.9 billion (2025), growing 14.3% CAGR | Yahoo Finance / Research[^32] |
| On-chain RWA lending deposits on Solana | Crossed USD 1.2 billion (March 2026) | Prior research[^33] |
| DeFi protocols accepting physical movable collateral | Zero | All available RWA protocol data[^27][^28] |

***
## 1.6 The Structural Problem Statement
The credit market failure in Brazil has three distinct layers:

**Layer 1 — Rate failure.** Even credit-eligible borrowers pay 58–88% annually on personal loans. This is not a marginal premium over risk-free rates; it is a systematic transfer of wealth from borrowers to financial intermediaries. No productive economic activity — and certainly no short-term liquidity need — justifies 88% financing costs.

**Layer 2 — Access failure.** 80 million defaulted consumers, plus millions more with informal income or thin credit files, are excluded from all formal credit despite owning assets with verifiable, liquid market value. The system screens out creditworthiness by income proxies rather than by actual collateral quality.

**Layer 3 — Technology failure.** The only institutional actor addressing collateral-backed lending for physical assets — TradFi — operates a 19th-century infrastructure. Paper contracts, in-person appraisal, geographic concentration in ~900 branches, manual renewals. The technology to digitize, tokenize, and automate this workflow has existed since 2020. No one has built it for the Brazilian physical asset market.

Vaulx addresses all three layers simultaneously: it reduces effective lending rates through protocol efficiency and P2P lending economics, extends access to any borrower with a qualifying asset regardless of credit history, and delivers the entire workflow — appraisal, custody, cNFT minting, disbursement, and rollover — through a digital protocol on Solana. The problem is large, evidence-backed, and structurally unaddressed by any existing player.

***
## 1.7 Why This Problem Is Not Already Solved
Three barriers have historically prevented a digital collateral-backed lending solution for physical luxury assets:

1. **Custody infrastructure**: Physical assets require a trusted custodian network. Building verified custody partners across a country of 215 million requires either direct investment or a pre-existing network. Vaulx accesses Marcelo and Rodrigo Coelho's existing security and custody operations through Gitel, which operates nationwide.

2. **Appraisal accuracy**: Physical luxury goods require professional appraisal. The triangular methodology (platform pre-assessment + professional in-person valuation + custody chain-of-custody hash) has not been formalized on-chain previously.

3. **Legal enforceability**: In the event of default, on-chain liquidation of a physical asset requires a legal framework connecting smart contract execution to off-chain custody transfer. This requires a combination of Brazilian civil law expertise and on-chain mechanism design — a combination that has not been assembled for this market.

Vaulx's founding team resolves all three barriers by direct operational capability, not by outsourcing them to future partners. This is why the problem has been unaddressed: the specific combination of custody network + financial architecture + technical build + regulatory navigation required a team that did not exist until now.

---

## References

1. [Record Default Exposes Crisis in Brazilian Family Indebtedness](https://en.clickpetroleoegas.com.br/recorde-de-inadimplencia-expoe-crise-no-endividamento-das-familias-brasileiras-sima00/) - Brasil fecha 2025 com alta da inadimplência, milhões de consumidores negativados e crédito mais caro...

2. [Brazil Luxury Goods Market Size, Share | Statistics 2033](https://www.imarcgroup.com/brazil-luxury-goods-market) - Brazil luxury goods market size reached USD 4.9 Billion in 2024. Looking forward, IMARC Group expect...

3. [Debt Explosion in Brazil: Over 80 Million in Default and the Situation ...](https://www.linkedin.com/pulse/debt-explosion-brazil-over-80-million-default-situation-lopes-btjqf) - Almost a year after my last newsletter on Brazil's debt crisis, I return to this space — and unfortu...

4. [Interest on revolving credit cards reaches 451.5% per year in Brazil](https://agenciabrasil.ebc.com.br/en/economia/noticia/2025-09/interest-revolving-credit-cards-reach-4515-year-brazil) - In the 12 months ending in August, revolving credit card interest rates rose 24.6 percentage points ...

5. [TradFi aumenta em 20% valor de avaliação em penhor](https://agenciabrasil.ebc.com.br/economia/noticia/2024-12/caixa-aumenta-em-20-valor-de-avaliacao-em-penhor) - Quem não tem relacionamento do banco pode obter até 85% do valor do item no penhor. Os objetos aceit...

6. [TradFi aumenta em até 20% valor de avaliação de bens para penhor](https://istoedinheiro.com.br/caixa-aumenta-em-ate-20-valor-de-avaliacao-de-bens-para-penhor-entenda) - Com a alteração das tabelas de avaliação dos bens aceitos, o valor do empréstimo poderá ser acrescid...

7. [Brazil Leads Latin America in Millionaires but Inequality Remains](https://www.riotimesonline.com/brazil-leads-latin-america-in-millionaires-but-inequality-remains-stark-ubs-report-shows/) - The bank's latest Global Wealth Report, released in June 2025, counts 433,000 Brazilians with over $...

8. [Brazil Luxury Watch Market Size, Share, Growth, Trends, 2033](https://www.imarcgroup.com/brazil-luxury-watch-market) - The Brazil luxury watch market reached USD 629.17 Million in 2024 and is projected to reach USD 794....

9. [Brazil's Central Bank cuts benchmark interest rate to 14.75% per year](https://agenciabrasil.ebc.com.br/en/economia/noticia/2026-03/brazils-central-bank-cuts-benchmark-interest-rate-1475-year) - Since June of last year, the Selic rate had been at 15 percent per year. The last time Copom reduced...

10. [Brazil Cuts Interest Rate for First Time in Two Years - The Rio Times](https://www.riotimesonline.com/brazil-interest-rate-cut-selic-copom-march-2026/) - Brazil interest rate drops to 14.75% as Copom cuts 25 basis points — the first reduction since May 2...

11. [Credit Card Interest Rates Soar in 2025, Hitting Highest Level Since ...](https://en.clickpetroleoegas.com.br/juros-do-cartao-de-credito-rotativo-alta-divida-novas-regras-ama01/) - Credit Card Interest Rates Rose Again In August, Reaching 451% Per Year. · How Revolving Credit Impa...

12. [Credit and Risk Trends in Brazil Highlight Need for Tailored Treatment](https://www.fico.com/blogs/credit-and-risk-trends-brazil-highlight-need-tailored-treatment) - Brazil's credit portfolio is in good shape and this, combined with a decline in delinquency, ensures...

13. [Credit card interest rates reach 436% per year in Brazil - YouTube](https://www.youtube.com/watch?v=5JezGDA5lTY) - Os juros médios cobrados pelos bancos nas operações com cartão de crédito rotativo subiram para 436%...

14. [[PDF] Why is bank credit in Brazil the most expensive in the world?](https://periodicos.fgv.br/rbfin/article/download/81507/78702/178007) - Other variables that help explain why spread in Brazil is among the highest in the world include mar...

15. [The Central Bank of Brazil rejects freezing credit card interest rates ...](https://en.clickpetroleoegas.com.br/the-central-bank-of-brazil-rejects-freezing-credit-card-interest-rates-which-exceed-400-per-year-while-lula-demands-relief-for-family-debts-ctl01/) - The Central Bank of Brazil rejects freezing credit card interest rates, which exceed 400% per year, ...

16. [Explaining Strong Credit Growth in Brazil Despite High Policy Rates](https://www.imf.org/en/news/articles/2025/10/09/explaining-strong-credit-growth-in-brazil-despite-high-policy-rates) - Higher income and fintech expansion boosted credit growth, even as monetary policy remained effectiv...

17. [Brazil Reaches 8.1 Million Negative CNPJs and 78.8 Million ...](https://en.clickpetroleoegas.com.br/inadimplencia-no-brasil-bate-recorde-em-2025-caes/) - The main sources of debts are banks and cards (27.27%), utilities (20.83%), and financial institutio...

18. [Brazil Luxury Goods Market Size, Overview & Forecast](https://www.verifiedmarketresearch.com/product/brazil-luxury-goods-market/) - Brazil Luxury Goods Market size was valued at USD 3.58 Billion in 2024 and is projected to reach USD...

19. [Brazil Luxury Goods Market - Brands, Trends & Share Analysis](https://www.mordorintelligence.com/industry-reports/brazil-luxury-goods-market) - The Brazil luxury goods market size is expected to grow from USD 5.35 billion in 2025 to USD 5.63 bi...

20. [Brazil Jewelry Market Size, Growth and Forecast to 2034](https://www.imarcgroup.com/brazil-jewelry-market) - The Brazil Jewelry market size was valued at USD 3.20 Billion in 2025. Looking forward, IMARC Group ...

21. [Brazil Jewelry Market | 2019 – 2030 - Ken Research](https://www.kenresearch.com/brazil-jewelry-market) - The Brazil Jewelry Market is valued at approximately USD 3.2 billion, with estimates ranging from US...

22. [Number of Brazilian millionaires rises to nearly 400,000 - UPI.com](https://www.upi.com/Top_News/World-News/2025/06/24/Brazil-Brazilian-millionaires-400000/4981750781341/) - The UBS report estimates that 380,585 Brazilians had a net worth of at least $1 million in 2024, a f...

23. [IBGE releases per capita household earnings 2024 for Brazil and ...](https://agenciadenoticias.ibge.gov.br/en/agencia-press-room/2185-news-agency/releases-en/42766-ibge-releases-per-capita-household-earnings-2024-for-brazil-and-federation-units) - The IBGE released today the values of the per capita household earnings related to 2024 for Brazil a...

24. [TradFi, Banco do Brasil, Itaú, and Santander Adopt Strict Measures ...](https://en.clickpetroleoegas.com.br/caixa-banco-do-brasil-itau-e-santander-adotam-medidas-rigorosas-em-2025-credito-mais-restrito-juros-elevados-e-exclusao-de-negativados-preocupam-brasileiros-afch/) - Bancos no Brasil endurecem crédito em 2025 com juros altos, menos financiamentos e restrição a negat...

25. [Com taxa básica de juros em alta, brasileiros recorrem a penhor ...](https://g1.globo.com/jornal-nacional/noticia/2025/05/24/com-taxa-basica-de-juros-em-alta-brasileiros-recorrem-a-penhor-para-conseguir-emprestimos.ghtml) - No Brasil, também subiu a busca pelos contratos de penhor — a operação em que você pega dinheiro emp...

26. [Integrated Report - TradFi](https://ri.caixa.gov.br/en/integrated-report/) - TradFi in Numbers – 2024 ; 4.3 thousand. Branches and Service Points. 1. Automated Container ; 21.8 t...

27. [Using Real-World Assets as Collateral in DeFi - RWA.io](https://www.rwa.io/post/using-real-world-assets-as-collateral-in-defi) - Key Takeaways · Real-world assets can unlock liquidity in DeFi lending, allowing asset owners to acc...

28. [Tokenized RWAs in DeFi Collateralized Lending: A Technical Guide ...](https://www.linkedin.com/pulse/tokenized-rwas-defi-collateralized-lending-technical-guide-singh-mr2ic) - As of 2025, the tokenized RWA market has expanded to $24 billion, with forecasts pointing toward a $...

29. [Real-World Assets on Blockchain: Why RWA Matters in 2025 - OSL](https://www.osl.com/hk-en/academy/article/real-world-assets-on-blockchain-why-rwa-matters-in-2025) - By 2025, RWAs are expected to play a crucial role in integrating traditional finance with decentrali...

30. [Pawn Shop Market Size, Share, Growth | Trends, 2030](https://intentmarketresearch.com/latest-reports/pawn-shop-market-6437) - The pawn shop market was valued at USD 38.8 billion in 2024-e and will surpass USD 48.0 billion by 2...

31. [Global Pawn Industry Trends Analysis Report 2025, Forecast to ...](https://www.marketresearch.com/Maia-Research-v4212/Global-Pawn-Trends-Forecast-Broken-43640260/) - The Global Pawn Market size is projected at USD 42897.17 Million in 2025 and is expected to reach US...

32. [Brazil Alternative Lending Business Report 2025: A $3.35 Billion ...](https://finance.yahoo.com/news/brazil-alternative-lending-business-report-150100157.html) - Alternative lending market in Brazil is expected to grow by 14.3% annually, reaching US$1.90 billion...

33. [Solana Ecosystem Roundup: March 2026](https://solana.com/news/solana-ecosystem-roundup-march-2026) - RWAs remained one of the clearest growth stories on Solana in March. The total RWA value on the netw...

