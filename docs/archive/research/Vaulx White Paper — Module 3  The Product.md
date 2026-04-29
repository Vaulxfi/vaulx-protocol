# Vaulx White Paper — Module 3: The Product
## Executive Summary
Vaulx is a Solana-native P2P crowdlending protocol that accepts physical luxury assets — watches, jewelry, vehicles, art — as on-chain collateral. The architecture has five interlocking layers: (1) physical custody and appraisal, (2) compressed NFT minting as collateral proof, (3) lender vault pools, (4) on-chain loan disbursement in stablecoins, and (5) recovery mechanics upon default or early lender exit. Each layer has been designed against real market precedents and technical constraints. This module documents every layer in full, including the open problems — liquidity mismatch and default recovery — and the proposed solutions benchmarked against industry practice.

***
## 1. Physical Custody and Appraisal Layer
### 1.1 The Custody Network
The custody layer is Vaulx's primary structural moat. Without a reliable, tamper-evident chain of custody, no on-chain collateral proof is credible. The protocol uses a network of certified custodians — professional security and vault operators — to receive, store, and release physical assets. Marcelo Coelho's existing infrastructure at Gitel.com.br, which operates Brazil-wide in the physical security sector with established bank and corporate relationships, is the seed network for this layer.

Each custodian location operates as a **Custody Node**: a physical vault point with biometric access control, insurance coverage, 24/7 CCTV, and tamper-evident packaging. Assets are received with a formal **Custody Receipt** that is cryptographically hashed and stored on IPFS, then referenced by the cNFT minted on Solana.

**Custody node requirements:**
- ISO 17712-certified tamper-evident seals on all packaged assets
- Insurance coverage minimum equal to the appraised value of assets held
- Documented chain of custody with timestamped handoffs
- Real-time inventory sync with the Vaulx smart contract layer
### 1.2 Appraisal Model
Vaulx uses a **triangulated appraisal model** combining three inputs to produce the Certified Appraisal Value (CAV):

| Input | Method | Cost | Weight in CAV |
|---|---|---|---|
| Digital pre-screening | AI-assisted photo analysis, market comparables (Chrono24, WatchBox, eBay sold listings) | Included in platform fee | 30% |
| On-site appraisal | Certified gemologist / watchmaker at custody node | R$215–450 (borrower-paid) | 50% |
| Market liquidity discount | 15–25% haircut applied to CAV based on asset category liquidity score | Automated | 20% |

The liquidity discount is critical: it ensures the Loan-to-Value (LTV) of 50–60% is calculated against a **conservative, liquid-exit value**, not an optimistic retail price. For watches, Chrono24 provides real-time secondary market data for 500,000+ reference numbers. For jewelry, GIA-certified weight and grade determine baseline. For vehicles, FIPE table provides standardized Brazilian market values.[^1][^2]

**Appraisal categories and reference standards:**

| Asset Class | Reference Standard | Typical LTV Applied | Liquidity Score |
|---|---|---|---|
| Swiss mechanical watches (Rolex, Patek, AP) | Chrono24 sold listings, 90-day average | 55–60% | High |
| Diamond jewelry (GIA certified) | Rapaport price sheet + GIA cert | 50–55% | Medium-High |
| Vehicles (under 5 years, major brands) | FIPE table | 45–50% | High |
| Art (established artists) | Auction house comparable + expert appraisal | 40–45% | Medium |
| Other fine jewelry (non-GIA) | Local market comparable | 40–45% | Medium |

***
## 2. Compressed NFT (cNFT) as Collateral Proof
### 2.1 Why Compressed NFTs on Solana
Standard NFTs on Solana (Metaplex Token Metadata) cost approximately 0.012 SOL to mint — around R$0.50 at current prices. But the critical advantage of Solana's state compression infrastructure (Metaplex Bubblegum v2) is cost at scale. Minting 1 million cNFTs on Solana costs approximately 5 SOL — versus 12,000 SOL for uncompressed NFTs — a 2,400x cost reduction. For a protocol targeting high loan volume in a price-sensitive Brazilian market, this matters: each cNFT mint costs approximately $0.001.[^3][^4][^5]
### 2.2 What the cNFT Contains
Each cNFT minted upon loan origination contains the following metadata, stored via a hybrid on-chain/off-chain architecture:

**On-chain (Solana ledger, immutable):**
- Unique Asset ID (UUID linked to physical custody receipt)
- Appraised Value (CAV) in BRL and USD equivalent at time of mint
- Custody Node address (physical location hash)
- Loan parameters: principal, LTV, interest rate, maturity date
- Borrower wallet address (pseudonymous)
- Appraisal date and appraiser credential hash

**Off-chain (IPFS/Arweave, content-addressed, permanent):**
- High-resolution photographs (minimum 12 angles)
- Appraisal certificate PDF (digitally signed by certified appraiser)
- Custody receipt with tamper-evident seal serial number
- Asset provenance documents (where available: box, papers, certificates)

The IPFS content hash is stored in the cNFT's `uri` field, making the off-chain data tamper-evident: any modification to the appraisal documents would produce a different hash, immediately detectable on-chain.[^6][^7]
### 2.3 cNFT Lifecycle
```
Borrower submits asset → Custody Node receives → Appraiser certifies →
cNFT minted (Bubblegum v2) → cNFT locked in Loan Vault →
Loan active: cNFT status = ENCUMBERED →
Loan repaid: cNFT burned, asset released →
Loan defaulted: cNFT transferred to Recovery Vault → auction/liquidation process
```

The cNFT is locked in a **program-controlled escrow** (Solana PDA — Program Derived Address) during the loan term. Neither the borrower nor any single party can release it unilaterally. Release requires a smart contract condition: either full repayment confirmed, or default flag triggered after grace period.

***
## 3. Lender Vault Architecture (Crowdlending Layer)
### 3.1 The Vault Model
Vaulx's funding mechanism follows the **pooled vault model** used by institutional on-chain credit protocols. Lenders deposit USDC (or BRLA stablecoin) into a shared Vault Pool. The Vault Pool is the counterparty to all loans originated in the period. This design has three advantages over bilateral P2P matching: (a) lenders are diversified across multiple loans automatically, (b) borrowers receive instant liquidity confirmation without waiting for individual lender matching, and (c) yield is distributed pro-rata to vault share.

**Vault Pool architecture:**

| Component | Description |
|---|---|
| **Senior Tranche (80% of vault)** | Priority claim on repayment and recovery proceeds. Lower yield (target 12–15% APY). Target: conservative lenders, institutions |
| **Junior Tranche (20% of vault)** | First-loss capital. Higher yield (target 18–24% APY). Absorbs first defaults. Target: yield-seeking retail, protocol treasury |
| **Reserve Fund (5% of vault, protocol-funded)** | Liquidity buffer. Funded by origination fees. Used for early withdrawal requests before triggering secondary market |
| **Insurance Module (optional)** | Third-party DeFi insurance (e.g., Nexus Mutual or Coinsurance equivalent on Solana) against smart contract failure |

This senior/junior structure is the **industry standard** for on-chain real-world asset lending. Centrifuge's Tinlake protocol pioneered it for RWA on Ethereum. Maple Finance uses a similar pool-delegate model with credit underwriting separation. Goldfinch, despite its challenges, validated that senior/junior tranching reduces senior lender loss rates to near zero even when junior pools absorb defaults.[^8][^9][^10][^11]
### 3.2 The Liquidity Mismatch Problem and Solution
This is the most operationally critical design challenge in the entire protocol. **Lenders want liquidity. Loans have fixed terms (90–120 days). These two realities conflict.**

**The problem in concrete terms:** A lender deposits R$10,000 into the vault on Day 1. A borrower takes a 90-day loan on Day 5. The lender wants to withdraw on Day 30. The loan has not matured. The borrower's collateral is locked. Where does the lender's R$10,000 come from?

There are four established solutions, each with trade-offs:

**Option A: Liquidity Reserve Fund (Recommended for Phase 1)**
The protocol maintains a liquidity reserve of 10–15% of total vault assets in liquid form (USDC in Kamino or similar yield vault). Early withdrawal requests up to the reserve cap are fulfilled instantly. Above the cap, withdrawal enters a queue with a defined processing window (7–14 days).[^12][^13]

- *Pros:* Simple, no secondary market infrastructure required, predictable
- *Cons:* Capital idle in reserve earns less; large simultaneous withdrawal events can breach reserve
- *Precedent:* Standard practice for European crowdlending platforms (Mintos, Estateguru, Reinvest24) — all maintain 5–15% liquidity buffers[^13]

**Option B: Secondary Market for Vault Positions (Phase 2)**
Lenders receive vault share tokens (SPL tokens on Solana) representing their proportional claim on the pool. These tokens can be traded on a Vaulx internal secondary market or listed on Solana DEXes (Jupiter aggregator). A lender wanting early exit sells their vault share token to another buyer at market price.

- *Pros:* True liquidity without capital reserve drag; market-driven pricing
- *Cons:* Requires liquidity in the secondary market itself; vault tokens may trade at a discount during stress
- *Precedent:* Centrifuge DROP/TIN tokens; Maple pool tokens; Credix senior pool tokens[^10][^11]

**Option C: Loan-Level Position Transfer**
Rather than trading vault shares, individual loan positions are tokenized as separate SPL tokens. A lender with R$1,000 in Loan #47 can sell that specific position. The buyer receives all future cash flows from that loan.

- *Pros:* Granular; allows buyers to select specific risk profiles
- *Cons:* Low secondary market liquidity for individual loans; complexity in pricing
- *Precedent:* PeerStreet (real estate), October (SME lending) operated similar models[^12]

**Option D: Tranched Lock-ups with Premium Yield**
Lenders who commit to full-term lock-up receive higher yield. Lenders who want flexibility accept lower yield. No early exit outside the reserve fund.

- *Pros:* Aligns incentives; no infrastructure complexity
- *Cons:* Reduces attractiveness for retail lenders who value liquidity
- *Precedent:* Standard practice in private credit and hedge fund structures

**Recommended architecture for Vaulx:**
- **Phase 1:** Option A (Reserve Fund, 10% of vault) + Option D (two yield tiers: 12% flexible / 18% locked)
- **Phase 2:** Option B (vault share SPL tokens tradeable on Jupiter/Orca)
- **Phase 3:** Option C (individual loan NFTs for institutional secondary market)

***
## 4. Loan Disbursement and Stablecoin Architecture
### 4.1 Currency Design
Vaulx loans are denominated in **USDC as the primary settlement currency**, with BRL-equivalent display for borrowers. This decision addresses three risks simultaneously:

1. **BRL devaluation risk:** Loans in BRL stablecoins would expose the protocol to FX volatility if BRL depreciates against USDC during the loan term. Historical BRL/USD volatility is 15–25% annually.
2. **Stablecoin depeg risk:** USDC has the strongest regulatory compliance track record and largest liquidity pool of any USD stablecoin. The Federal Reserve's April 2026 stablecoin stability report confirmed USDC maintains robust reserve attestation.[^14][^15]
3. **Borrower UX:** Brazilian borrowers see loan amount in BRL at time of origination. Smart contract records USD equivalent. Repayment uses prevailing BRL/USDC rate at maturity.

**For borrowers who need BRL:** BRLA (Brazil's regulated BRL stablecoin issued by Transfero) or integration with Drex (Brazil's CBDC, currently in sandbox phase with BCB) can serve as a conversion layer. Funds are converted at disbursement and at repayment using a Pyth Network oracle price feed — the most widely used price oracle on Solana with sub-second latency.
### 4.2 Disbursement Flow (Under 1 Minute)
```
1. Smart contract confirms cNFT locked in escrow PDA           [~2 seconds]
2. Vault Pool checks available liquidity                        [~1 second]
3. Loan terms recorded on-chain (principal, rate, maturity)    [~2 seconds]
4. USDC transferred from Vault Pool to borrower wallet         [~400ms]
5. Borrower converts USDC→BRL via PIX integration (optional)  [~30 seconds]
Total: < 60 seconds from custody confirmation to funds in wallet
```

This compares to TradFi's penhor process: in-person visit, physical appraisal on-site, paper contract, funds available same day at best but typically within 24–48 hours across branch locations.[^16]

***
## 5. Default and Recovery Mechanics
This is the section requiring the most rigorous design, as it determines lender confidence and protocol solvency. Three default scenarios exist, each with distinct mechanics.
### 5.1 Default Rate Benchmarking
The global pawn industry maintains **redemption rates of 70–85%**, meaning 15–30% of pledged goods are forfeited by borrowers. TradFi's penhor division historically reports redemption rates above 80%, with luxury goods (watches, jewelry) above 85% due to their high personal and monetary value to borrowers. For Vaulx's conservative underwriting model (50–60% LTV against conservatively appraised collateral), a **target default rate of 10–15%** is modeled, with recovery expected to exceed 90% of loan value even in default scenarios, because the asset sold at auction should yield well above the outstanding loan principal given the LTV buffer.[^16][^17]
### 5.2 Scenario A — Borrower Fails to Repay at Maturity
**Process:**

1. **Grace period (7 days):** Smart contract sends automated wallet notification. Borrower can repay + accrued penalty interest. cNFT remains in escrow.
2. **Default declaration (Day 8):** Smart contract automatically flags loan as DEFAULT. cNFT transferred to Recovery Vault (separate PDA).
3. **Recovery process begins** (see options below).
4. **Recovery proceeds** distributed: first to senior tranche lenders (principal + interest), then junior tranche, then any surplus to protocol treasury.

**Recovery Option 1: On-Platform Auction (Recommended Primary)**

The physical asset is put to auction on the Vaulx platform. The auction is conducted as a **public digital auction** with a minimum reserve price set at 110% of outstanding loan value. Bidders can be Brazilian or international. The winning bidder pays in USDC. Upon payment confirmation on-chain:
- cNFT is transferred to winning bidder's wallet as proof of ownership
- Custody node is instructed to release physical asset to winning bidder (via secure logistics)
- Loan vault is repaid from auction proceeds

**Legal basis:** Brazil's Superior Court of Justice (STJ) in 2025 authorized the extrajudicial sale of movable assets pledged under fiduciary alienation, significantly accelerating recovery timelines. Separately, Brazil's extrajudicial search and seizure framework for movable assets under fiduciary alienation was further regulated in 2025, allowing creditors to act without court involvement in many cases.[^18][^19][^20]

**Recovery Option 2: NFT Full Ownership Transfer**

Rather than conducting a traditional auction, the cNFT itself is listed as a **full ownership NFT** on the Vaulx platform or compatible Solana NFT marketplaces (Magic Eden, Tensor). The cNFT metadata already contains the complete appraisal record, custody proof, and provenance documentation. A buyer purchasing the NFT acquires:
- Legal title to the physical asset (documented via signed transfer agreement)
- Instruction to custody node to release asset upon NFT transfer confirmation
- Full appraisal history and chain of custody record

This approach eliminates the need for a separate auction platform. It is the cleanest on-chain recovery path. Execution requires one smart contract interaction: buyer sends USDC, receives cNFT, custody node releases asset.

**Recovery Option 3: NFT Fractionalization**

For high-value assets (above R$50,000) that may not sell quickly as a single unit, the cNFT can be **fractionalized** using Solana's SPL token standard. The cNFT is locked in a fractionalization vault, and a fixed supply of fungible tokens (e.g., 1,000 WATCH tokens) are issued, each representing 0.1% ownership of the underlying asset. Token holders collectively own the asset and can vote to:
- Hold and wait for appreciation
- Trigger a full buyout at any time (any single holder can buy all outstanding tokens at the last valuation)
- Authorize custody node to sell the asset through traditional luxury goods channels (Christie's, Sotheby's, Chrono24 dealer network)

Fractionalization is technically mature on Solana via Metaplex's fractionalization standard and has legal precedent in co-ownership structures. The primary risk is **coordination failure** among fractional holders — mitigated by requiring supermajority (67%) for hold/sell decisions and including a mandatory buyout mechanism.[^21][^22]

**Comparison of Recovery Options:**

| Option | Speed | Legal Complexity | Recovery Rate | Best For |
|---|---|---|---|---|
| On-platform auction | 7–21 days | Low (extrajudicial basis clear)[^19] | 85–95% of loan value | Standard defaults, all asset classes |
| Full NFT sale | 1–7 days | Low (single transaction) | 80–100% of loan value | Liquid asset categories (watches, vehicles) |
| Fractionalization | 14–60 days | Medium (co-ownership docs) | 90–110% over time | High-value, illiquid assets (art, rare watches) |
| Traditional auction (Christie's / Sotheby's) | 30–90 days | Low | 90–130% of loan value | Trophy assets >R$200K |

**Recommended default recovery protocol:**
- Assets under R$50K → Full NFT sale (primary) + on-platform auction (fallback)
- Assets R$50K–200K → On-platform auction (primary) + fractionalization (fallback)
- Assets above R$200K → Traditional auction house (primary) + fractionalization (secondary)
### 5.3 Scenario B — Borrower Rollover Request
This is the most economically important scenario and the primary driver of protocol margin. A borrower who cannot repay at maturity but does not want to forfeit the asset requests a **rollover**: extension of the loan for another 90-day term.

**Rollover mechanics:**
- New appraisal required only if more than 180 days since last appraisal (or asset price volatility >10%)
- New cNFT minted with updated terms (or existing cNFT metadata updated via Bubblegum update instruction)
- Interest rate may be adjusted based on updated market conditions
- Protocol charges rollover origination fee (1% of outstanding principal)

**Rollover economics:** The business model analysis (Module 5) shows rollovers increase operating margin from 16.8% to approximately 26%, because re-appraisal cost is eliminated on the second and third cycle. This is the compounding margin flywheel of the entire business.
### 5.4 Scenario C — Borrower Early Repayment
Smart contract accepts early repayment at any time. Interest is prorated to days outstanding (no prepayment penalty in Phase 1, to maximize borrower adoption). cNFT is burned, physical asset released from custody within 24 hours of repayment confirmation.

***
## 6. Smart Contract Architecture and Risk Matrix
### 6.1 Smart Contract Stack
| Contract | Function | Audit Priority |
|---|---|---|
| `loan_origination.rs` | Mints cNFT, locks in escrow, records loan terms | Critical |
| `vault_pool.rs` | Manages lender deposits, yield accrual, tranche accounting | Critical |
| `disbursement.rs` | Transfers USDC from vault to borrower | Critical |
| `repayment.rs` | Processes repayment, releases cNFT, distributes yield | Critical |
| `default_recovery.rs` | Flags default, transfers to recovery vault, triggers auction | High |
| `oracle_integration.rs` | Pyth price feeds for BRL/USD, asset price monitoring | High |
| `governance.rs` | Protocol parameter updates (LTV limits, fee structure) | Medium |
### 6.2 Audit Requirements and Cost
Smart contract audit is **non-negotiable** before mainnet deployment. The 2026 market for Solana-specific audits:

- **Tier 1 firms** (OtterSec, Halborn, Trail of Bits): $40,000–$80,000 for a full protocol audit, 4–8 week timeline[^23][^24][^25]
- **Tier 2 firms** (Sec3, Zellic): $20,000–$40,000, 3–5 weeks
- **Recommended approach:** Tier 2 for initial testnet audit, Tier 1 for mainnet. Budget: $60,000–$80,000 total.
### 6.3 Technical Risk Matrix
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Smart contract exploit | Low (post-audit) | Critical | Tier 1 audit + bug bounty program ($10K–$50K) |
| Oracle price manipulation (Pyth feed) | Very Low | High | Use time-weighted average price (TWAP), not spot price |
| USDC depeg | Very Low | High | Dual-currency vault; automatic halt if peg deviation >0.5%[^14][^15] |
| Custody node fraud | Low | High | Multi-sig release, insurance coverage, random audits |
| Solana network outage | Low | Medium | Loans paused, not liquidated, during outage; grace period extended |
| Regulatory action on DeFi in Brazil | Medium | Medium | SCD license structure, CVM compliance, legal counsel engaged |
| Low lender adoption | Medium | High | Senior tranche APY competitive with Tesouro Direto (13–15%); backed by physical assets |
| Asset price collapse (luxury market) | Very Low | Medium | Conservative LTV (50–60%) provides 40–50% buffer against price decline |
| Liquidity crisis (mass withdrawal) | Low | High | Reserve fund + secondary market (Phase 2) + loan maturity laddering |

***
## 7. Regulatory Compliance Architecture
### 7.1 Brazilian Legal Framework
**The key legal instruments that make Vaulx legally sound in Brazil:**

- **CCB (Cédula de Crédito Bancário):** The loan instrument. CCBs are legally recognized debt instruments in Brazil under Law 10.931/2004. They can be issued digitally and are enforceable without court intervention for collection.[^18]
- **Alienação Fiduciária de Bens Móveis (Fiduciary Alienation of Movable Assets):** The legal framework governing asset-backed lending on movable goods. The STJ's 2025 ruling authorizing extrajudicial sale of movable assets under this framework is a direct legal tailwind.[^19]
- **SCD License (Sociedade de Crédito Direto):** Regulated by BCB Resolution 4.656/2018. Allows fintechs to originate credit using their own funds or through P2P matching. Vaulx's crowdlending model fits the SCD structure. Capital requirement: R$1 million minimum paid-in capital.
- **CVM Regulation on Tokenized Securities:** CVM Resolution 88/2022 and subsequent guidance covers tokenized financial instruments. Vault share tokens issued to lenders may qualify as securities and require CVM registration or exemption.
### 7.2 KYC/AML Requirements
All borrowers and lenders undergo KYC via Brazilian identity verification (CPF validation, Serpro biometric check). Smart contract wallets are linked to verified identities in an off-chain compliance database. Transactions are monitored against COAF (Brazil's financial intelligence unit) watchlists. This architecture is consistent with BCB's open finance framework and PIX compliance standards.

***
## 8. Technology Implementation Timeline
| Phase | Milestone | Duration | Key Deliverable |
|---|---|---|---|
| **0: Foundation** | Smart contract development (Anchor framework, Solana) | 8 weeks | All 7 contracts deployed on devnet |
| **1: Testnet** | Internal testing, bug bounty, Tier 2 audit | 6 weeks | Audited testnet deployment |
| **2: Pilot** | 20–50 loans, closed beta, 5 custody nodes | 8 weeks | First real-world loans, first yield distributed |
| **3: Mainnet v1** | Public launch, Tier 1 audit complete, 20 custody nodes | 4 weeks | Mainnet live, lender vault open |
| **4: Scale** | Secondary market for vault tokens, 3 new asset classes | 12 weeks | 400+ active loans, vault token tradeable on Jupiter |

***
## 9. Competitive Differentiation Summary
No existing DeFi protocol on any chain accepts physical movable assets as collateral. The table below maps Vaulx's architecture against the closest comparables:[^26][^27]

| Protocol | Chain | Collateral Type | Physical Assets | LTV | Lender Exit |
|---|---|---|---|---|---|
| Aave | Ethereum/Polygon | Crypto, stablecoins | No | 50–80% | Instant (liquid markets) |
| MakerDAO | Ethereum | Crypto, RWA financial | No | 50–75% | Variable |
| Maple Finance | Solana/Ethereum | Uncollateralized (institutional) | No | 0% (trust-based) | Pool withdrawal queue |
| Goldfinch | Ethereum | Uncollateralized (emerging market) | No | 0% (trust-based) | Senior pool withdrawal |
| Centrifuge | Ethereum | Invoices, trade receivables, mortgages | No (financial RWA) | 70–80% | DROP/TIN token secondary market |
| TradFi pawn channel | Off-chain | Physical assets | Yes | 20–30% | N/A (traditional) |
| **Vaulx** | **Solana** | **Physical luxury assets** | **Yes** | **50–60%** | **Reserve fund + SPL token market** |

Vaulx is the **only protocol** combining: physical asset collateral + on-chain proof via cNFT + P2P crowdlending vault + sub-60-second disbursement + structured recovery mechanics. This is not a feature gap — it is an architectural category that does not yet exist on-chain.

---

## References

1. [Metaplex: The hero behind reducing Solana NFT minting costs 1000x](https://www.binance.com/en/square/post/1703212385978) - Metaplex's compressed NFTs reduce the cost of minting NFTs by over 1,000x (from over $10 on Ethereum...

2. [Pawn Market Size, Share | Industry Report [2026-2035]](https://www.businessresearchinsights.com/market-reports/pawn-market-122812) - The global pawn market size is forecasted to be worth USD 40.3 Billion in 2026, expected to achieve ...

3. [Solana NFT Compression: Cost-Efficient Mass NFT Minting - Helius](https://www.helius.dev/docs/nfts/nft-compression) - The most cost-efficient way to mint large numbers of NFTs on Solana. Learn Merkle trees, compressed ...

4. [Compressed NFTs on Solana - Accretion](https://accretion.xyz/blog/compressed-nfts-solana) - We'll cover how cNFTs use Merkle trees to store NFT data off-chain, significantly reducing costs and...

5. [State compression brings down cost of minting 1 million NFTs on ...](https://solana.com/news/state-compression-compressed-nfts-solana) - State compression brings down cost of minting 1 million NFTs on Solana to ~$110.

6. [Fetching Compressed NFTs - Bubblegum V2 - Metaplex](https://www.metaplex.com/docs/smart-contracts/bubblegum-v2/fetch-cnfts) - This page covers the DAS API setup, asset IDs, fetching individual and multiple cNFTs, and retrievin...

7. [FAQ - Bubblegum V2 - Metaplex](https://www.metaplex.com/docs/smart-contracts/bubblegum-v2/faq) - This page answers the most common questions about Bubblegum V2 compressed NFTs, including costs, tra...

8. [Maple Finance: Institutional Crypto-Capital Network](https://www.blockchain-gt.io/newsletters/maple-finance) - Lenders act as the senior tranche (last to be liquidated in a default event) and Cover Providers act...

9. [Yield Generation, Underwriting and Risk Management](https://maple.finance/insights/yield-generation-underwriting-and-risk-management) - Both Maple Direct & Syrup lending pools generate above-market yields for lenders by issuing secured ...

10. [How Goldfinch Scaled RWA Lending Without Collateral](https://www.blockchainappfactory.com/blog/goldfinch-rwa-under-collateralized-lending/) - Explore how Goldfinch built a trust-first, under-collateralized RWA lending model and what founders ...

11. [Goldfinch: A DeFi Credit Protocol - Nansen Research](https://research.nansen.ai/articles/goldfinch-a-defi-credit-protocol) - Goldfinch loans introduce default risk. Although loans are overcollateralized off-chain, enforcement...

12. [Secondary Market for Crowdfunding : Opportunities and Challenges](https://www.linkedin.com/pulse/secondary-market-crowdfunding-opportunities-challenges-roy-tyahf) - Secondary markets in peer-to-peer (P2P) crowdfunding enable investors to trade loan parts, offering ...

13. [What is secondary market? Navigating liquidity in crowdfunding](https://thecrowdspace.com/blog/what-is-secondary-market-navigating-liquidity-in-crowdfunding/) - (3)

14. [The Fed - Stablecoins in 2025: Developments and Financial Stability ...](https://www.federalreserve.gov/econres/notes/feds-notes/stablecoins-in-2025-developments-and-financial-stability-implications-20260408.html) - This note examines recent developments in the stablecoin industry and their implications for financi...

15. [Stablecoins Regulations in 2026: USDT vs USDC Compliance ...](https://kyc-chain.com/stablecoins-regulations-in-2026-usdt-vs-usdc-compliance-mica-market-access-and-listing-risk/) - Stablecoins are moving from a “crypto market infrastructure” topic into a regulated payments and fin...

16. [Overview | Bubblegum - Metaplex](https://www.metaplex.com/docs/smart-contracts/bubblegum) - Bubblegum is the Metaplex Protocol program for creating and interacting with compressed NFTs (cNFTs)...

17. [Pawn Service Market Size | Research Report, 2025 To 2035](https://www.marketgrowthreports.com/market-reports/pawn-service-market-115156) - Global Pawn Service Market size was valued at USD 47739.01 million in 2025 and is poised to grow fro...

18. [Extrajudicial search and seizure of fiduciary alienation on movable ...](https://www.demarest.com.br/en/busca-e-apreensao-extrajudicial-de-alienacao-fiduciaria-sobre-bens-moveis-e-regulamentada/) - The Legal Framework for Guarantees provides for the “dejudicialization” of search and seizure proced...

19. [Credit Recovery | Brazilian Superior Court of Justice Authorizes the ...](https://www.feijolopes.com.br/en/2025/08/18/credit-recovery-brazilian-superior-court-of-justice-authorizes-the-sale-of-movable-property-fiduciary-alienated-without-debtors-prior-notice-3-key-points-for-creditors/) - Article 2 of Decree-Law No. 911/69 categorically allows the fiduciary owner to sell the movable prop...

20. [Extrajudicial Search and Seizure of Movable Assets Given as ...](https://www.demarest.com.br/en/busca-e-apreensao-extrajudicial-de-bem-movel-objeto-de-alienacao-fiduciaria/) - The creditor can consolidate the ownership of the secured asset with the purpose of carrying out its...

21. [How Fractionalization of NFTs Enables Co-Ownership](https://tokeny.com/how-fractionalization-of-nfts-enables-co-ownership/) - NFTs are unique and indivisible by nature, so how can we fractionalize these assets? We can “wrap” u...

22. [NFT Fractional Ownership](https://www.meegle.com/en_us/topics/nft/nft-fractional-ownership) - NFT fractional ownership refers to the process of dividing a single NFT into smaller, tradable fract...

23. [Smart Contract Audit Pricing: A Market Reference for 2026 - Sherlock](https://sherlock.xyz/post/smart-contract-audit-pricing-a-market-reference-for-2026) - Smart contract audit costs range from $5K to $250K+ in 2026. This research guide breaks down pricing...

24. [Smart Contracts Audit | Alula Finance - Halborn](https://www.halborn.com/audits/alula-finance/smart-contracts-cd8f6d) - Alula Finance engaged Halborn to conduct a security assessment on their smart contracts beginning on...

25. [What Smart Contract Audits Actually Cost in 2026 - YouTube](https://www.youtube.com/watch?v=LO_UphPDS1w) - Most audit firms don't publish prices. They make you fill out a form, get on a call, and hit you wit...

26. [Using Real-World Assets as Collateral in DeFi - RWA.io](https://www.rwa.io/post/using-real-world-assets-as-collateral-in-defi) - Key Takeaways. Real-world assets can unlock liquidity in DeFi lending, allowing asset owners to acce...

27. [Tokenized RWAs in DeFi Collateralized Lending: A Technical Guide ...](https://www.linkedin.com/pulse/tokenized-rwas-defi-collateralized-lending-technical-guide-singh-mr2ic) - As of 2025, the tokenized RWA market has expanded to $24 billion, with forecasts pointing toward a $...

