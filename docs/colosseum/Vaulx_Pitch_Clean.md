# Vaulx — Colosseum Pitch Deck

**Format**: 11 slides, ~3-minute voice-over.
**Style**: Editorial / financial-press. Black + warm off-white + teal accent + muted gold. Inter Tight + JetBrains Mono. Dense data tables, infographics, minimal animation.

---

## Slide 1 — Cover

# Vaul*x*

### The on-chain credit protocol.

Connecting asset-rich individuals in high-rate markets to yield-seeking global capital — secured by verifiable physical luxury collateral with deterministic on-chain liquidation.

**All in smart contracts. Vaulx doesn't take custody. Vaulx doesn't hold capital.**

`github.com/Vaulxfi` · `Solana Devnet · Live today`

**Speaker notes (~18s):**
> Vaulx is the on-chain credit protocol that connects asset-rich individuals in high-rate markets to global onchain capital — secured by verifiable physical luxury collateral with deterministic on-chain liquidation. All in smart contracts. We don't take custody. We don't hold capital. We're live on Solana Devnet today.

---

## Slide 2 — The asymmetry

# Asset-rich, credit-trapped — meets capital with nowhere to go.

### LEFT — Brazil's credit ladder is broken at every rung.

**Marcelo · São Paulo**
Rolex Submariner Ref. 116610LN
R$80,000 / ~$14,000 idle

| Tier | Brazilian product | LTV / Rate |
|---|---|---|
| **Penalty / worst case** | Credit card *rotativo* (revolving balance) | — · **~450% APR** |
| **Standard consumer credit** | General bank lending rate | — · **~61% APR** |
| **Cheapest formal credit** | Caixa Federal *penhor* — only legal pawn institution | **20% LTV (scrap-metal value)** · **~30% APR** |

*Sources: Banco Central do Brasil · Trading Economics · Caixa Federal published rates.*

*Rotativo applies to credit-card balances carried past the 30-day grace period — the rate that hits the ~50M Brazilians who revolve credit-card debt.*

### RIGHT — Onchain institutional capital is the cheapest in the world. He can't reach it.

**8–10% APR** *(institutional onchain yield)*

Global liquidity offered at single-digit APR. Yet there's no trustable rail between this capital and Marcelo's Rolex.

*(BTC/ETH-as-collateral exists. Not the use case.)*

### NO RAIL.

**Speaker notes (~36s):**
> Marcelo lives in São Paulo. He owns a fourteen-thousand-dollar Rolex, but he needs short-term liquidity. His options are fundamentally broken. If his credit card balance revolves, the *rotativo* penalty rate hits four hundred and fifty percent APR. A standard consumer loan: roughly sixty. The cheapest formal credit option is Caixa Federal *penhor* — Brazil's only legal pawn institution — at thirty percent APR. But they value his Rolex as literal scrap metal, lending only twenty percent of its value. Meanwhile, on Solana, institutional capital is offered at eight percent — and has no way to reach him. Until now.

---

## Slide 3 — Protocol architecture

# Modular. Atomic. Composable.

Solid blocks ship once. Dashed blocks swap per market. Four Anchor programs in the middle never move.

### LAYER 01 — Off-chain, user-side (3 modules · all GLOBAL)

| Module | Tech | Tag |
|---|---|---|
| Borrower wallet | Crossmint · 1-tap social login · embedded Solana wallet | GLOBAL |
| KYC self-onboarding | Sumsub + native SAS (May 2025) → on-chain KycAttestation PDA | GLOBAL |
| Online appraisal | Vaultik · Chrono24 · WatchCharts · 3-source median · live API | GLOBAL |

### LAYER 01 — Off-chain, asset-side (3 modules · 2 LOCAL · 1 GLOBAL)

| Module | Tech | Tag |
|---|---|---|
| Offline appraisal | Certified appraiser per market · in-person physical evaluation | LOCAL |
| Licensed custodian | Sekuro · Brinks-class · Loomis-class network | LOCAL |
| Global insurance (Lloyd's) | Lloyd's master policy · theft + damage to trustee | GLOBAL |

### ANCHOR PROGRAMS — Solana · 4 programs · 5 atomic gates · GLOBAL

`vault · loan · trdc · auction`

**G1 Appraisal → G2 Custody → G3 cNFT mint → G4 Borrow → G5 Repay/Default**

### LAYER 02 — On-chain (4 modules · all GLOBAL)

| Module | Tech | Tag |
|---|---|---|
| cNFT + Oracle | Bubblegum cNFT · SAS attestations · Pyth + RedStone (multi-oracle) | GLOBAL |
| Curated lending rails | Kamino V2 + Loopscale USDC · composable curator infra | GLOBAL |
| Vaulx UI + indexer | Next.js · indexer · bridge · admin cockpit /admin/demo | GLOBAL |
| Vaulx Trust (reg co.) | Regulated counterparty entity · noteholder of record | GLOBAL |

### Three takeaways

- **8 of 10 modules ship globally.** Only offline appraisal and licensed custodian swap per market — 60–90 days per new country.
- **The atomic invariant:** no USDC disburses until the licensed custodian's keypair signs custody-confirmation — atomically, in the same transaction. **No competitor** in physical-collateral lending has shipped this on-chain (Aave · Maple · Centrifuge — none).
- Vaulx orchestrates licensed counterparties. We don't take custody. We don't hold capital. We post a 5% protocol-owned first-loss buffer on every loan.

**Speaker notes (~33s):**
> Four Anchor programs — vault, loan, trdc, auction — enforce five atomic gates: appraisal, custody, cNFT mint, borrow, repay or default. The killer line: no USDC disburses until the licensed custodian signs custody-confirmation, atomically, in the same transaction. No competitor has shipped this on-chain. Off-chain: Sumsub KYC with native SAS, online appraisal API, certified offline appraisers, Sekuro plus Brinks-class custody, Lloyd's insurance. On-chain: Kamino and Loopscale curated vaults, Vaulx Trust as noteholder. Eight of ten modules ship globally — only offline appraisal and custody swap per market.

---

## Slide 4 — Cycle economics

# Vaulx beats every formal credit option in Brazil.

At 24% APR with 50% LTV, Vaulx is **cheaper than the cheapest** formal credit — and lends **2.5× more** capital per asset.

### Comparison — $14,000 Rolex · 12-month horizon

| Option | APR | LTV | $ borrowable on a $14k Rolex | 12-mo interest cost |
|---|---|---|---|---|
| Credit card *rotativo* *(penalty)* | **~450%** | n/a (unsecured) | n/a | massive |
| General consumer loan | **~61%** | n/a (unsecured) | n/a | $3,050 on $5k |
| Caixa *penhor* *(cheapest formal)* | **~30%** | 20% scrap-metal | **~$2,800** | $840 on $2,800 |
| **Vaulx** *(2% / month)* | **24%** | **50% full asset value** | **$7,000** | **$1,680 on $7,000** |

### The headline

- **Cheaper rate** than even Caixa *penhor* (24% vs 30%)
- **2.5× more capital** per asset (50% LTV vs 20% LTV at scrap-metal valuation)
- **3-month cycles** for short-term, immediate-need credit — quick disbursement, repay or roll over, asset returned at exit

### Cost-of-credit breakdown — 24% all-in

| Bucket | APR |
|---|---|
| **Cost of capital** — LP yield (USDC supplier) | 8% |
| **Cost of operations** — origination · custody · insurance · servicing · curator | 12% |
| **Cost of risk** — protocol first-loss buffer + risk margin | 4% |
| **Borrower all-in** | **24%** *(2% / month)* |

### Bottom line

| Borrower all-in | Vaulx revenue per asset | LP net (post EL) |
|---|---|---|
| **24% APR** | **~$300–600** *(6–12% of borrowed, per year)* | **~5% APR** *(collateralized, insured)* |

**Speaker notes (~34s):**
> One year of credit, four options on the table. Brazilian *rotativo* penalty rate: four hundred and fifty percent. Standard bank lending: sixty-one. Caixa *penhor* — the cheapest formal option — thirty percent at twenty-percent LTV, valuing Marcelo's Rolex as scrap metal. Vaulx: twenty-four percent at fifty-percent LTV against full market value. Cheaper than Brazil's cheapest formal credit, and two-and-a-half times more capital per asset. Three buckets: eight percent cost of capital, twelve percent cost of operations, four percent cost of risk. Vaulx earns three to six hundred dollars per asset per year. Lender nets five percent, collateralized and insured.

---

## Slide 5 — Risk + liquidation

# Risk is tiered. Default is choreographed.

### LTV by asset class

| Asset class | Origination LTV | Liquidation threshold |
|---|---|---|
| Steel sport watches | 50% | 70% |
| Gold / precious watches | 40% | 60% |
| Handbags (Hermès, Chanel) | 35% | 55% |
| Art / one-offs *(Phase 2)* | 25% | 45% |

### 14-day Dutch auction — four tiers

| Time | Tier | Detail |
|---|---|---|
| T+0 | Margin call | 24h to top up via USDC or Pix |
| T+1 | Tier 1 — Pool LPs | Last-appraisal floor · defaulted-pool first |
| T+3 | Tier 2 — Resellers | Authorized reseller network · governance holders |
| T+7 | Tier 3 — Open auction | Open onchain · Dutch decay |
| T+14 | Tier 4 — Backstop | Offline auction house · 70% reserve |

### Loss waterfall

**Borrower equity → POL first-loss buffer → Junior LP tranche → Senior LP tranche**

Insurance covers theft & damage to trustee — **never default risk**.

### LP tranche structure

Vaulx splits the LP layer into two risk-priced tranches above the protocol-owned first-loss buffer:

| Tranche | Yield | Capital share | Position in waterfall |
|---|---|---|---|
| **Senior** | **8% APR fixed** *(USDC)* | ~75% | Last to take losses · paid first |
| **Junior** | **12% APR fixed** *(USDC)* | ~25% | First to take losses above POL buffer |
| Vaulx POL first-loss buffer | n/a — protocol-owned | 5% of every loan | Absorbs first 5% of any default loss |

**Why this works for institutional anchors**: senior tranche beats Maple syrupUSDC (~7% APY) by 100 bps — backed by physical collateral with insurance and a 5% protocol-owned first-loss buffer. Junior tranche compensates for taking direct first-loss exposure above POL.

**Speaker notes (~36s):**
> Risk is tiered. Steel sport watches at fifty-percent LTV, lower thresholds for thinner secondary markets, art excluded from launch. On default, the borrower has twenty-four hours to top up. After that, a fourteen-day Dutch auction runs in four tiers — lenders first, authorized resellers, open market, offline auction house backstop at seventy percent reserve. The LP layer is tranched: senior LPs earn eight percent fixed APR, junior LPs earn twelve percent and absorb first losses above our protocol-owned five-percent buffer. Senior beats Maple by a hundred basis points. Insurance covers theft and damage to the trustee — never default risk.

---

## Slide 6 — Why Solana & Why Now

# Three primitives. Four signals. One window.

None of this stack existed 18 months ago. The institutional money is moving onchain — on Solana — this quarter.

### Why Solana — three primitives

| Primitive | Quantified | What it unlocks |
|---|---|---|
| **cNFT (Bubblegum)** | ~$0.0005 per mint | Luxury class scales globally |
| **SAS** | 1× verified, read everywhere | Reusable on-chain KYC |
| **Composability** | Anchor CPI → Kamino + Loopscale | We originate. They run lending markets. |

### Why Now — four institutional adoption signals on Solana

| Signal | Number / event | Detail |
|---|---|---|
| **RWA TVL on Solana** | $1.82B (March 2026) | +90% MoM growth · 3rd-largest RWA chain |
| **Western Union USDPT** | Launched May 2026 | Fully USD-backed · Anchorage Digital Bank · "Stable by Western Union" in 40+ countries |
| **Payments giants** | Visa · Stripe · PayPal · Fiserv | Production stablecoin workflows live · USDC settlement for US banks |
| **Tokenized funds** | BUIDL · FOBXX | BlackRock $2.3B AUM · Franklin Templeton $594M money fund · live on Solana |

### The single-signature thesis

Sumsub's native Solana Attestations Service integration (May 2025) gave us reusable KYC. **Atomic transactions enforce every gate in one signature.** The institutional rails moved onto Solana. We move physical luxury onto them.

**Speaker notes (~30s):**
> Why Solana, why now. RWA tokenization on Solana hit one-point-eight-two billion in March — ninety percent month-over-month growth. Western Union launched USDPT on Solana this month. Visa, Stripe, PayPal, Fiserv all running production stablecoin workflows. BlackRock and Franklin Templeton tokenized money funds live. Compressed NFTs at a fraction of a cent. Sumsub's native Solana Attestations Service integration last May. None of this stack existed eighteen months ago. The institutional rails moved onto Solana. We move physical luxury onto them.

---

## Slide 7 — Market & addressable

# Where credit is expensive, luxury collateral is everywhere.

### Bottom-up sizing — 5-year horizon

| Tier | Size | Detail |
|---|---|---|
| **Watches in private hands** | **$90B** | High-credit-cost markets: BR · MX · TR · IN · SEA · ZA · NG |
| **Realistically addressable** | **$20B** | Owner willingness × asset eligibility |
| **Year-5 origination target** | **$1–3B** | 1–5% capture of the addressable pool |

*Source: Bain Luxury Goods Worldwide 2024 · Morgan Stanley Watches estimates · Vaulx analysis.*

### Global markets — one protocol stack

| Market | Credit card APR | Local rail |
|---|---|---|
| Brazil | ~400% | Pix |
| Mexico | ~80% | SPEI |
| Turkey | ~70% | FAST |
| India | ~40% | UPI |
| SE Asia (ID/PH/VN) | ~30–45% | Local rails |
| USA (boutique) | "credit-invisible HNW" | ACH / wire |

Each market shares the same Solana protocol stack. Local modules swap in 60–90 days.

### Partners — signed or in active discussion

Sekuro · Brinks-class · Lloyd's · Vaultik · Sumsub · Kamino V2 · Loopscale · Mercado Bitcoin · Transfero · Vaulx Trust

### Punchline

> Caixa values your Patek Philippe as **scrap metal**. We value it as a Patek Philippe.

**Speaker notes (~22s):**
> Where credit is expensive, luxury collateral is everywhere. Ninety billion dollars in private-hand luxury watches across high-cost-credit markets — twenty billion realistically addressable, one-to-three billion year-five originations. Each market shares the same Solana stack — only custody swaps per country. Sekuro, Sumsub, Kamino, Loopscale, Mercado Bitcoin, Transfero — in active discussions. Caixa values your Patek as scrap metal. We don't.

---

## Slide 8 — Competitive landscape

# We're not first. We're built for a different market.

### The competitive matrix

| Player | Asset class | Chain | Custody | Geography | Status / traction |
|---|---|---|---|---|---|
| Kettle Finance | Watches | Blast L2 | Own NYC vault | US-first | $4M raised · $20M GMV · $6M loans · live |
| 4K Protocol | Physical luxury | Ethereum / Polygon | Own Guardians | Global | Live · Rolex DeFi loans via Arcade |
| Tangible | RE + watches | Polygon | Various SPVs | Global | Live · USDR collapsed 2023 |
| Arcade.xyz | Wrapped NFTs | Ethereum | n/a (digital) | Global | $1B/mo NFT lending |
| ~~Caixa Federal~~ | Anything | — | Bank vault | Brazil | 36% APR · scrap-metal pricing |
| **Vaulx** | **Luxury physical** | **Solana** | **Independent · licensed** | **Global / Brazil → LATAM-first** | **Devnet live · mainnet Q3 2026 · 50 loans Q3 / 100 Q4** |

### The unoccupied vertex

| Chain | Geography | Architecture | Issuance |
|---|---|---|---|
| Solana — economics, not just narrative | LATAM-first — where credit costs 60–400% | Composable — not closed marketplace | Joint with regulated local partner |

**Speaker notes (~21s):**
> We're not first. We're built for a different market. Kettle, 4K, Tangible, Arcade — all live, none on Solana, none LATAM-first, none composable with mature lending markets. Caixa pawns at scrap-metal pricing. The unoccupied vertex: Solana economics, LATAM-first geography, composable architecture, joint regulated-local issuance. Vaulx sits in that vertex.

---

## Slide 9 — Team

# Five founders. Five non-overlapping axes.

No competitor can assemble this team.

### George Dimitrov — CEO / CTO
*15+ yrs · Banking*

Global banking & financial operations · institutional & regulatory affairs.

**Owns:** Vaulx is corporate-grade across business, governance, legal, compliance, tech. Drives institutional partnerships on-chain and off-chain.

### Marcelo — COO
*38 yrs · Gitel.com.br*

Brings the **Gitel** network into Vaulx: corporate & institutional reach in Brazil, deep custody and security tech expertise.

**Owns:** Vaulx is operationally solid for protocol, participants, and partners.

### Rodrigo — Head Partnerships & BD
*BR + LATAM · BD*

Proven networking and BD across Brazil and LATAM.

**Owns:** Mercado Bitcoin and other BR partnerships (with Marcelo) — local compliance, fast adoption, growth.

### Edson — Senior Solana Engineer
*Anchor · Bubblegum · Pyth*

Owns all on-chain and protocol-level engineering. Shipped 4 Anchor programs across Phase 1–3: vault · loan · trdc · auction.

### Felipe — DeFi & Community Advisor
*CEO · 4p.finance*

Brings the **4p.finance** position into Vaulx: existing crypto-native luxury watch flow in São Paulo, deep DeFi network across US and Brazil. Advises on community + DeFi partnerships.

### Pull quote

> **Gitel** has been building Brazilian *electronic-security* infrastructure for **38 years** — CCTV, IoT sensors, access control, NOC operations. That is the exact tech stack behind Vaulx's atomic custody invariant.

**Validation:** Active commercial conversations with appraisers, custodians, and curators.

**Speaker notes (~25s):**
> Five founders, five non-overlapping axes. I run global banking, corporate, and institutional. Marcelo, CEO of Gitel — thirty-eight years in Brazilian security — runs custody and operational solidity. Rodrigo runs Brazil and LATAM BD, including Mercado Bitcoin. Edson shipped four Anchor programs. Felipe, CEO of four-p-finance, advises on DeFi and community. Active commercial conversations with appraisers, custodians, and curators are open today. No competitor can assemble this team.

---

## Slide 10 — Distribution: built-in

# Distribution is built-in.

The team's existing networks + reusable Solana identity = low customer-acquisition cost in the early phase.

### Channel 01 — Direct (BR + LATAM) · borrower-side

- **4p.finance pipeline** — Felipe already processes São Paulo's luxury-watch flow on crypto rails today · onboarded crypto-luxury buyer base ready
- **Rodrigo's BD network** — Brazil + LATAM bank, custodian, and partner relationships · second-degree connection to every key counterparty
- **Marcelo + Gitel** — operational credibility + supplier network from 38 years in BR electronic-security across industry, ports, agribusiness, energy

> Founders bring credibility, network, and the first cohort of customers. Paid acquisition is not the launch lever.

### Channel 02 — Reusable identity · onboarding

- **Sumsub ID Connect** — 200+ partner protocols on the network · users who KYC'd anywhere can borrow on Vaulx with zero re-friction
- **Native SAS attestations** — Sumsub's native Solana Attestations Service integration (May 2025) · KYC once on Solana, borrow anywhere
- **Crossmint social login** — 1-tap onboarding via Google / Apple / email · embedded Solana wallet provisioned automatically · no seed phrase friction

> The borrower already passed KYC somewhere on Solana. We just read the attestation.

### Channel 03 — Institutional & LP-side · lender-side

- **Mercado Bitcoin · Transfero** — Brazilian institutional anchor lenders · MB has ~4M users · regulated CVM exchanges with deep BR distribution
- **Kamino V2 + Loopscale curators** — curated lending vaults reach the existing Solana yield audience · composable USDC pools at scale
- **LP-side flywheel** — curated vaults attract pre-qualified institutional liquidity · TVL feeds borrower capacity feeds yield feeds TVL

> LPs already exist on Solana. We give them yield backed by physical luxury.

### Bottom line

**Low CAC at launch.** Growth is *partner-network multiplication*, not paid acquisition.

The most expensive part of any lending protocol is the borrower funnel. Ours is partly built — and the rest sits inside reusable Solana identity that did not exist eighteen months ago.

**Speaker notes (~22s):**
> Distribution is built-in. Felipe at four-p-finance already processes São Paulo's luxury-watch flow on crypto rails today. Rodrigo's BR and LATAM BD network gives us direct partnership reach. Sumsub's ID-Connect network has two hundred plus partner protocols — every Solana user who KYC'd elsewhere can borrow on Vaulx with no friction. Lender side: Mercado Bitcoin, Transfero, Kamino, Loopscale. Low customer-acquisition cost at launch — partner-network multiplication, not paid acquisition.

---

## Slide 11 — Traction · Ask · Close

# Vaul*x*

The rail between physical luxury and onchain capital. **Built on Solana.** Live on Devnet today.

### Traction — live today

- **4 Anchor programs** on Devnet — vault · loan · trdc · auction
- **45+ anchor tests** · all green · CI gating
- **vaulx.vercel.app** — frontend live · demo cockpit at /admin/demo
- Indexer + bridge running · Supabase event log

### Our ask — Colosseum prize

# $250K
*Solana RWA track · pre-seed*

- To get to **mainnet** with audited contracts
- To close the **first custodian + appraiser + curator**
- Bridge to **seed round** with traction + revenue

### Use of funds — concrete milestones

| Milestone | Target |
|---|---|
| **Day 0** | Audit kickoff · 4 Anchor programs · external review + bug bounty |
| **Day 60** | Sekuro custodian agreement signed · Lloyd's binder confirmed |
| **Day 90** | Mainnet launch · first loan originated (team-side asset, real USDC) |
| **Q3 2026** | **50 customers** · first revenue · LP cohort onboarded (senior + junior tranches live on Loopscale + Kamino) |
| **Q4 2026** | **100 customers** · seed raise close · $1.5–3M to scale Brazil + first LATAM market (MX or AR) |

### Close

`github.com/Vaulxfi` · `vaulx.vercel.app` · `Solana Devnet · Mainnet Q3 2026`

**Come build with us.**

**Speaker notes (~28s):**
> Vaulx. Built. Tested. Live on Devnet today — four programs, forty-five-plus tests, frontend running, demo cockpit shipped. Our ask: the two-hundred-and-fifty-thousand-dollar Colosseum prize, to take Vaulx from Devnet to mainnet. Audit our four programs, close Sekuro as our first custodian, originate our first fifty mainnet loans by Q3, one hundred by Q4, and bridge to seed. The rail between physical luxury and onchain capital. Built on Solana. Come build with us.
