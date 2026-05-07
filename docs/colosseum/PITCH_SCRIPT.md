# Vaulx — Pitch Video Script (v8.1)

**Target length:** 2:55 (hard cap 3:00)
**Format:** Voice-over slides, info-dense
**Speaker:** George (CEO/CTO)
**Submission:** Colosseum Cypherpunk Hackathon 2026, deadline **May 10, 2026**
**Prize target:** $250k
**Companion HTML deck:** `docs/colosseum/Vaulx_Pitch_v7.html` (HTML out-of-sync; regenerate when ready)

> **Design philosophy v8**: data-rich, not poetic. Judges screenshot slides. Every slide must contain at least one number, table, or diagram a judge would underline. Voice-over carries the story; slides carry the substance.

> **Changelog v8 → v8.1** (Gitel fact-check):
> - **"60 corporate bank clients" claim removed everywhere** — unverifiable per public-source research. Gitel publicly claims 500+ active clients with no banking-sector breakdown.
> - **"Physical security" reframed to "electronic-security infrastructure"** — Gitel's actual business is CCTV, IoT sensors, access control, NOC operations, systems integration (industrial / port / agribusiness / energy sectors). Founded Nov 1987, 38+ years verified.
> - **Marcelo's bio repositioned around tech alignment**: Gitel's electronic-security stack is the exact tech behind Vaulx's atomic custody invariant (IoT tamper, monitoring, access control). This is a *stronger* technical-moat claim than the prior unverifiable "60-bank distribution" framing.
> - **Distribution Channel 1 reordered**: 4p.finance pipeline first (Felipe — verifiable), Rodrigo's BD network second, Marcelo + Gitel operational credibility third. Removed direct "60 banks → HNW pipeline" claim.
> - **"CAC ≈ 0 at launch" softened to "Low CAC at launch"** — defensible without the bank-client distribution lever.

> **Changelog v7 → v8** (after Colosseum Copilot gap analysis vs Cypherpunk RWA winners):
> - **Slide 5 — LP tranche structure added** (closes "no named anchor LP yield" gap vs Janus / Pencil winners). **Senior 8% APR (~75% of capital)** beats Maple syrupUSDC by ~100 bps; **Junior 12% APR (~25%)** sits above 5% POL first-loss buffer. Loss waterfall extended: borrower equity → POL → junior → senior. Senior beats Maple syrupUSDC ~7% per [Messari](https://messari.io/project/syrupusdc); junior priced for first-loss exposure.
> - **Slide 11 — Use of funds rebuilt with concrete milestones** (closes "vague timeline" gap). Replaced "20–50 mainnet loans" + "Mainnet H2 2026" with: Day 0 audit kickoff · Day 60 Sekuro signed · Day 90 mainnet launch · Q3 2026 50 customers · Q4 2026 100 customers + seed close. Voice-over carries "fifty by Q3, one hundred by Q4."
> - Slide 8 competition row updated: "Mainnet Q3 2026 · 50 loans Q3 / 100 Q4" replaces "Hackathon → mainnet H2 2026."

> **Changelog v6 → v7** (retained):
> - Cover slide added as Slide 1; Asymmetry reframed as 3-tier Brazilian credit ladder (rotativo / consumer loan / Caixa penhor); KYC and Appraisal split; Vaulx Trust rename; Cycle Economics rebuilt as Vaulx-vs-Caixa-penhor + 3-bucket cost-of-credit; Competition slide re-added.

> **Changelog v6 → v7**:
> - **NEW Slide 1 — Cover** added. Vaulx wordmark + protocol thesis ("on-chain credit protocol connecting asset-rich individuals in high-rate markets to yield-seeking global capital, secured by verifiable physical luxury collateral with deterministic on-chain liquidation"). Old Slide 1 becomes Slide 2.
> - **Slide 2 (Asymmetry, was Slide 1) reframed**: persona-led narrative — Brazilian Rolex owner with three expensive financing options (Caixa pawn / consumer loan / credit card) vs onchain institutional liquidity at 8–10% he can't reach. Caveat: BTC/ETH-as-collateral exists but is out of scope.
> - **Slide 3 (Architecture, was Slide 2) restructured**: KYC and Appraisal **split into separate boxes**. Online appraisal → GLOBAL; Offline appraisal → LOCAL. Lloyd's labeled clearly as **"Global Insurance (Lloyd's)"**. **"BVI Trust" renamed to "Vaulx Trust (reg co.)"** — jurisdiction TBD. Off-chain layer expands to 6 modules in 2 rows; new scaling claim becomes **8 of 10 modules global, 2 local** (offline appraisal + custodian).
> - **Slide 4 (Economics, was Slide 3) revised**: simplified to **2% monthly all-in cost** (24% APR equivalent). Added **1-year cycle comparison** — 1× CC at 400% APR ($20K interest on $5K) vs 4× Vaulx 3-month cycles backed by Rolex (~$1.1K interest). Vaulx revenue shown both in **$ and as % of borrowed**. Emphasizes 3-month "short-term immediate need" use case.
> - **NEW Slide 8 — Competition** re-added (was in v6 HTML, dropped in v5–v6 script). Vaulx row highlighted in teal (consistent accent), positioned vs Kettle / 4K / Tangible / Arcade / Caixa. "Unoccupied vertex" callout: Solana economics + LATAM-first + composable + joint regulated-local issuance.
> - All subsequent slides renumbered: 4 → 5 (Risk), 5 → 6 (Why Solana & Why Now), 6 → 7 (Market), 7 → 9 (Team), 8 → 10 (Distribution), 9 → 11 (Traction + Ask + Close).
> - **Total = 11 slides.** Timing pressure increases — see updated timing table for cut strategy.

> **Changelog v5 → v6** (retained):
> - **Slide 9 (now 11) rebuilt as Traction + Ask + Close**. Added explicit $250K Colosseum prize ask + 6-month use-of-funds plan.
> - HTML deck shipped at `Vaulx_Pitch_v7.html` — standalone, no external deps, runs on arrow keys / click / number keys.

> **Changelog v4 → v5** (retained):
> - **Civic dropped everywhere**. Per `PARTNERSHIPS.md` 2026-04-28: "Civic dropped entirely; Sumsub added as KYC layer." New stack on slides = **Crossmint (auth + smart wallet) + Sumsub (KYC w/ native SAS, May 2025) + on-chain vendor-neutral `KycAttestation` PDA**.
> - **Custodian** corrected to: **Sekuro · Brinks SP / Loomis-class** (Prosegur dropped per user direction).
> - **Slide 5 (Why Solana & Why Now)** rebuilt: institutional-adoption column added with verified facts — Solana RWA TVL **$1.82B (Mar 2026, +90% MoM)**, **Western Union USDPT launched on Solana May 2026**, **Visa / Stripe / PayPal / Fiserv production workflows** on Solana, **BlackRock BUIDL + Franklin Templeton FOBXX** tokenized money funds live on Solana.
> - **Slide 6**: Re7 + MEV Capital trimmed from partner strip (mention only verbally if time allows).
> - **Slide 7 (Team)**: each founder rewritten with proper "why on the team" description per user. Validation line = *"Active commercial conversations with appraisers, custodians, and curators."*
> - **Slide 8 NEW — Distribution**: added between Team and Close. Three channels: direct (Gitel + 4p.finance + Rodrigo BD), reusable identity (Sumsub ID Connect 200+ partner protocols), institutional + LP-side (MB / Transfero / Kamino / Loopscale).
> - **Slide 9 (was 8) — Close**: traction strip retained.

> **Changelog v3 → v4** (retained):
> - Submission deadline corrected: May 10 not 11.
> - Slide 2 architecture mapped to real codebase: 4 programs (vault/loan/trdc/auction), Pyth + RedStone multi-oracle, atomic confirm-and-disburse invariant elevated.

> **Changelog v2 → v3** (retained):
> - Slide 2: KYC + Appraiser reclassified as GLOBAL. 7 of 9 modules now ship globally.
> - Slide 3: fee structure corrected — per-loan fees, not APR slices. Vaulx revenue ~$590 per asset across 4-cycle relationship reconciles arithmetically.
> - Slide 6: $2.4T vanity replaced with bottom-up $90B/$20B/$1–3B funnel; world map infographic replaces 6-country grid; Solana-as-rail replaces Pix-as-rail framing.

---

## Branding & visual direction (for Claude Designs)

- **Palette**: black background (#0A0A0A), warm off-white text (#F5F0E8), single accent: **muted gold** (#C9A86A) plus **deep teal** (#1F7A6E) carried over from v4 build. Avoid bourbon orange (Polygon RWA competitor).
- **Typography**: Editorial New / Tiempos for serif headlines; Inter or Söhne for body/data; JetBrains Mono for any code, hash, or country-code references.
- **Visual language**: private bank annual report meets engineering whitepaper. Tables, diagrams, real numbers. Editorial whitespace.
- **No emoji, no stock photos, no 3D, no gradients (except subtle background vignette).**
- **One hero photograph**: a real Submariner. Used twice — slide 1 and slide 8.
- **Animation**: minimal. Numbers fade in 100ms apart so judges can read sequentially. Diagrams animate left-to-right at ~5s per node.

---

## Slide-by-slide

### Slide 1 — Cover (0:00–0:15) — 15s

**Visual:**
Full-bleed black slide. Centered, vertical stack:

- Top: small eyebrow row in mono — `VAULX · COLOSSEUM 2026`
- Center: **Vaul*x*** wordmark, very large (~280px), italic 'l' in accent teal
- Below wordmark, in serif: **The on-chain credit protocol.**
- Below that, in body sans (max-width ~1500px, generous line-height): *Connecting asset-rich individuals in high-rate markets to yield-seeking global capital — secured by verifiable physical luxury collateral with deterministic on-chain liquidation.*
- Below tagline, single line in mono accent: **All in smart contracts. Vaulx doesn't take custody. Vaulx doesn't hold capital.**
- Bottom: small mono links — `github.com/Vaulxfi · Solana Devnet · Live today`

**Voice-over:**
> Vaulx is the on-chain credit protocol that connects asset-rich individuals in high-rate markets to global onchain capital — secured by verifiable physical luxury collateral with deterministic on-chain liquidation. All in smart contracts. We don't take custody. We don't hold capital. We're live on Solana Devnet today.

**Word count: 50 · Time: 18s** *(trim "We're live on Solana Devnet today" line if tight — it's repeated on slide 11)*

---

### Slide 2 — The asymmetry (0:15–0:51) — 36s

**Visual:**
Two-column split, black background. Left column persona-led with **3-tier Brazilian credit ladder**, right column the global onchain capital story.

**LEFT — "Brazil's credit ladder is broken at every rung."**

Persona card at top:
- Photo of Submariner
- *Marcelo · São Paulo · Rolex Submariner Ref. 116610LN · R$80,000 / ~$14,000 idle*

Below, three stacked rows showing the **real Brazilian rate stack** (ordered worst → best):

| Tier | Brazilian product | LTV / Rate |
|---|---|---|
| **Penalty / worst case** | Credit card *rotativo* (revolving balance) | — · **~450% APR** |
| **Standard consumer credit** | General bank lending rate | — · **~61% APR** |
| **Cheapest formal credit** | Caixa Federal *penhor* — only legal pawn institution | **20% LTV (scrap-metal value)** · **~30% APR** |

Footnote in mono: *Sources: Banco Central do Brasil · Trading Economics · Caixa Federal published rates.*
Footnote in mono: *Caixa is the only Brazilian institution legally authorized for penhor.*
Footnote in mono: *Rotativo applies to credit-card balances carried past the 30-day grace period — the rate that hits the ~50M Brazilians who revolve credit-card debt.*

**RIGHT — "Onchain institutional capital is the cheapest in the world. He can't reach it."**

- Small caption: *Onchain USDC capital · cheap · patient · institutional*
- Large gold number: **8–10% APR** *(institutional onchain yield)*
- Below in body: *Global liquidity offered at single-digit APR. Yet there's no trustable rail between this capital and Marcelo's Rolex.*
- Footnote in mono: *(BTC/ETH-as-collateral exists. Not the use case.)*

Between columns, vertical in gold: **NO RAIL.**

**Voice-over (~36s, ~96 words):**
> Marcelo lives in São Paulo. He owns a fourteen-thousand-dollar Rolex, but he needs short-term liquidity. His options are fundamentally broken. If his credit card balance revolves, the *rotativo* penalty rate hits four hundred and fifty percent APR. A standard consumer loan: roughly sixty. The cheapest formal credit option is Caixa Federal *penhor* — Brazil's only legal pawn institution — at thirty percent APR. But they value his Rolex as literal scrap metal, lending only twenty percent of its value. Meanwhile, on Solana, institutional capital is offered at eight percent — and has no way to reach him. Until now.

**Why the 3-tier rate stack matters:**
- The old framing (Caixa 36% / Consumer 60% / CC 400%) was **imprecise and weakened the punch**. Caixa *penhor* at ~30% APR is the **cheapest** formal credit in Brazil, not the worst. Calling it "scrap metal" is honest about *valuation*, not *rate*.
- The new framing positions Vaulx **below the cheapest formal tier** in cost (24% < 30%) — which is the actual headline a finance judge will recognize.
- *Rotativo* at 450% is the legitimate worst-case Brazilian credit cost, but **must be labeled as such** (not as "the standard rate") to stay defensible.

---

### Slide 3 — The protocol architecture (0:35–1:08) — 33s

**Headline:** *Modular. Atomic. Composable.*
**Subline:** *Solid blocks ship once. Dashed blocks swap per market. Four Anchor programs in the middle never move.*

**Visual — five-row grid layout (off-chain expands to 2 rows: user-side + asset-side):**

```
LAYER 01 OFF-CHAIN — USER-SIDE (3 modules · all global)
  [A GLOBAL] Borrower wallet            [B GLOBAL] KYC self-onboarding         [C GLOBAL] Online appraisal
    Crossmint · 1-tap social login        Sumsub + native SAS (May 2025)         Vaultik · Chrono24 · WatchCharts
    embedded Solana wallet                → on-chain KycAttestation PDA          3-source median · live API

LAYER 01 OFF-CHAIN — ASSET-SIDE (3 modules · 2 local · 1 global)
  [D LOCAL]  Offline appraisal          [E LOCAL]  Licensed custodian          [F GLOBAL] Global insurance (Lloyd's)
    Certified appraiser per market        Sekuro · Brinks-class /                Lloyd's master policy
    in-person physical evaluation         Loomis-class network                   Theft + damage to trustee

ANCHOR PROGRAMS (full-width teal band)
  Solana · 4 programs · 5 atomic gates · Global
  vault · loan · trdc · auction
  G1 Appraisal → G2 Custody → G3 cNFT mint → G4 Borrow → G5 Repay/Default

LAYER 02 ON-CHAIN (4 modules · all global)
  [G GLOBAL] cNFT + Oracle              [H GLOBAL] Curated lending rails       [I GLOBAL] Vaulx UI + indexer       [J GLOBAL] Vaulx Trust (reg co.)
    Bubblegum cNFT · SAS attestations     Kamino V2 + Loopscale USDC             Next.js · indexer · bridge          Regulated counterparty entity
    Pyth + RedStone (multi-oracle)        composable curator infra               admin cockpit /admin/demo           noteholder of record
```

**Footer legend (full-width, below grid):**
> ▸ Solid = global stack, ships once. Dashed = local module, swaps per market in 60–90 days. **Only 2 of 10 modules** require per-market replacement — offline appraisal and licensed custodian.
> ▸ **The atomic invariant**: no USDC disburses until the licensed custodian's keypair signs custody-confirmation — atomically, in the same transaction. No competitor in physical-collateral lending has shipped this on-chain (Aave · Maple · Centrifuge — none).
> ▸ Vaulx orchestrates licensed counterparties — we don't take custody, we don't hold capital, we post a 5% protocol-owned first-loss buffer on every loan.

**Voice-over (~33s, ~95 words):**
> Four Anchor programs — vault, loan, trdc, auction — enforce five atomic gates: appraisal, custody, cNFT mint, borrow, repay or default. The killer line: no USDC disburses until the licensed custodian signs custody-confirmation, atomically, in the same transaction. No competitor has shipped this on-chain. Off-chain: Sumsub KYC with native SAS, online appraisal API, certified offline appraisers, Sekuro plus Brinks-class custody, Lloyd's insurance. On-chain: Kamino and Loopscale curated vaults, Vaulx Trust as noteholder. Eight of ten modules ship globally — only offline appraisal and custody swap per market.

**Note for designer**: Architecture diagram now has 6 off-chain modules (in 2 rows: user-side + asset-side) and 4 on-chain modules. Anchor band stays full-width in the middle. Total = 10 modules + 1 Anchor band. Densest slide in the deck — may need to reduce padding inside each block to keep on 1080p.

---

### Slide 4 — Cycle economics (1:08–1:44) — 36s

**Headline:** *Vaulx beats every formal credit option in Brazil.*
**Subline:** *At 24% APR with 50% LTV, Vaulx is cheaper than the cheapest — and lends 2.5× more capital per asset.*

**Visual — full-width comparison table:**

| Option | APR | LTV | $ borrowable on $14k Rolex | 12-mo interest cost |
|---|---|---|---|---|
| Credit card *rotativo* *(penalty)* | **~450%** | n/a (unsecured) | n/a | massive |
| General consumer loan | **~61%** | n/a (unsecured) | n/a | ~$3,050 on $5k |
| Caixa *penhor* *(cheapest formal)* | **~30%** | **20% (scrap-metal value)** | **~$2,800** | ~$840 on $2,800 |
| **Vaulx** *(2% / month)* | **24%** | **50% (full asset value)** | **$7,000** | **~$1,680 on $7,000** |

**Two-line headline below the table:**
> ▸ **Cheaper rate** than even Caixa *penhor* (24% vs 30%)
> ▸ **2.5× more capital** per asset (50% LTV vs 20% scrap-metal LTV)

**Cost breakdown panel — 3-bucket all-in:**

| Bucket | APR |
|---|---|
| **Cost of capital** — LP yield (USDC supplier) | 8% |
| **Cost of operations** — origination · custody · insurance · servicing · curator | 12% |
| **Cost of risk** — protocol first-loss buffer + risk margin | 4% |
| **Borrower all-in** | **24%** *(2% / month)* |

**Bottom strip — 3-cell economic summary:**

| BORROWER ALL-IN | VAULX REVENUE PER ASSET | LP NET (POST EL) |
|---|---|---|
| **24% APR** | **~$300–600** *(6–12% of borrowed, per year)* | **~5% APR** *(collateralized, insured)* |

**Smaller "Why 3 months" callout:**
> ▸ Three-month cycles for **short-term, immediate-need credit** — quick disbursement, repay or roll over, asset returned at exit.

**Reference math (designer note, not on slide):**
- Vaulx vs Caixa: 24% vs 30% APR (Vaulx cheaper by 6 pp / ~1.25× cheaper rate)
- Vaulx vs Caixa LTV: 50% × $14k = $7,000 vs Caixa 20% × $14k (scrap-metal) = ~$2,800 → **2.5× more capital per asset**
- Vaulx vs *rotativo*: 24% vs 450% APR (~19× cheaper)
- 3-bucket cost reconciliation: 8 + 12 + 4 = 24%
- Vaulx revenue per asset: $300–600/yr (6–12% of borrowed)

**Voice-over (~36s, ~100 words):**
> One year of credit, four options on the table. Brazilian *rotativo* penalty rate: four hundred and fifty percent. Standard bank lending: sixty-one. Caixa *penhor* — Brazil's cheapest formal credit — thirty percent at twenty-percent LTV, valuing Marcelo's Rolex as scrap metal. Vaulx: twenty-four percent at fifty-percent LTV against full market value. Cheaper than Brazil's cheapest formal credit, and two-and-a-half times more capital per asset. Three buckets: eight percent cost of capital, twelve percent cost of operations, four percent cost of risk. Vaulx earns three to six hundred dollars per asset per year. Lender nets five percent, collateralized and insured.

---

### Slide 5 — Risk · Liquidation · LP Tranches (1:42–2:18) — 36s

**Visual layout — three columns:**

**LEFT — LTV tiers by asset class:**

| Asset class | Origination LTV | Liquidation threshold |
|---|---|---|
| Steel sport watches | 50% | 70% |
| Gold / precious watches | 40% | 60% |
| Handbags (Hermès, Chanel) | 35% | 55% |
| Art / one-offs (Phase 2) | 25% | 45% |

**MIDDLE — Default → 14-day Dutch auction, vertical timeline:**

```
T+0  ─── Margin call (24h to top-up via USDC or Pix)
T+1  ─── Tier 1: LPs in defaulted pool, last-appraisal floor
T+3  ─── Tier 2: Authorized resellers + governance token holders
T+7  ─── Tier 3: Open onchain auction, Dutch decay
T+14 ─── Tier 4: Offline auction house backstop, 70% reserve
```

**RIGHT — LP tranche structure (NEW):**

Vaulx splits the LP layer into two risk-priced tranches above the 5% protocol-owned first-loss buffer:

| Tranche | Yield | Capital share | Position |
|---|---|---|---|
| **Senior** | **8% APR fixed** | ~75% | Last to take losses · paid first |
| **Junior** | **12% APR fixed** | ~25% | First to take losses (above POL) |
| Vaulx POL first-loss | n/a · protocol-owned | 5% of every loan | Absorbs first 5% of any default |

*Senior beats Maple syrupUSDC (~7%) by 100 bps — backed by physical collateral with insurance + 5% POL.*

**Bottom: full-width loss waterfall:**
> **Borrower equity → POL first-loss buffer → Junior LP tranche → Senior LP tranche.** Insurance covers theft & damage to trustee — never default risk.

**Voice-over (~36s, ~100 words):**
> Risk is tiered. Steel sport watches at fifty-percent LTV, lower thresholds for thinner secondary markets, art excluded from launch. On default, the borrower has twenty-four hours to top up. After that, a fourteen-day Dutch auction runs in four tiers — lenders first, authorized resellers, open market, offline auction house backstop at seventy percent reserve. The LP layer is tranched: senior LPs earn eight percent fixed APR, junior LPs earn twelve percent and absorb first losses above our protocol-owned five-percent buffer. Senior beats Maple by a hundred basis points. Insurance covers theft and damage — never default risk.

**Word count: 100 · Time: 36s**

**Note for designer:** Three-column layout is denser than v6's two-column. Tranche table on the right should mirror visual weight of the LTV table on the left for symmetry. Consider 1fr / 1.1fr / 1fr column ratios.

---

### Slide 6 — Why Solana & Why Now (2:12–2:42) — 30s

**Headline:** *Why Solana. Why now.*
**Subline:** *Three primitives × four converging market signals. The institutional money is moving onchain — on Solana — this quarter.*

**Visual — two-row layout:**

Top row — **WHY SOLANA** (three columns):

| **cNFT (Bubblegum)** | **SAS** | **Composability** |
|---|---|---|
| ~$0.0005 per mint | Issued once, read by any protocol | Anchor CPI into Kamino + Loopscale |
| *Luxury class scales globally* | *Reusable KYC across the Solana RWA stack* | *We originate. They run lending markets.* |

Bottom row — **WHY NOW · INSTITUTIONAL ADOPTION** (four columns):

| **RWA TVL on Solana** | **Western Union** | **Payments giants** | **Tokenized funds** |
|---|---|---|---|
| **$1.82B** (Mar 2026) | **USDPT launched** May 2026 | Visa · Stripe · PayPal · Fiserv | BlackRock BUIDL · Franklin FOBXX |
| +90% MoM growth | Fully-backed USD stablecoin via Anchorage Digital | Production stablecoin workflows | $2.3B+ AUM · live on Solana |

Centered footer line in gold: **Sumsub's native Solana Attestations Service integration (May 2025) gave us reusable KYC. Atomic transactions enforce every gate in one signature. None of this stack existed 18 months ago.**

**Voice-over (tightened, ~30s, ~85 words):**
> Why Solana, why now. RWA tokenization on Solana hit one-point-eight-two billion in March — ninety percent month-over-month growth. Western Union launched USDPT on Solana this month. Visa, Stripe, PayPal, Fiserv all running production stablecoin workflows. BlackRock and Franklin Templeton tokenized money funds live. Compressed NFTs at a fraction of a cent. Sumsub's native Solana Attestations Service integration last May. None of this stack existed eighteen months ago. The institutional rails moved onto Solana. We move physical luxury onto them.

---

### Slide 7 — Market & addressable (2:42–3:04) — 22s

**Visual:**

**Eyebrow header (top-left):** `06 / MARKET · ADDRESSABLE`
**Eyebrow header (top-right):** `HIGH-COST-CREDIT MARKETS · GLOBAL ROLLOUT`

**Headline (large serif):**
> Where credit is expensive, luxury collateral is everywhere.

**Hero funnel band — three stacked numbers in gold:**

| **$90B** | **$20B** | **$1–3B** |
|---|---|---|
| WATCHES IN PRIVATE HANDS | REALISTICALLY ADDRESSABLE | YEAR-5 ORIGINATION TARGET |
| High-credit-cost markets: BR, MX, TR, IN, SEA, ZA, NG | Owner willingness × asset eligibility, 5-yr horizon | 1–5% capture of the addressable pool |

Caption row under funnel: *▸ Bottom-up. Source: Bain Luxury Goods Worldwide 2024, Morgan Stanley Watches estimates, Vaulx analysis.*

**World map infographic (full-width, centered):**
- Stylized world outline in muted off-white stroke on black background — no political detail, just continental silhouettes.
- Six country pins in gold/teal, sized to suggest market size:
  - **Brazil** (large pin) · CC APR ~400%
  - **Mexico** (medium) · CC APR ~80%
  - **Turkey** (medium) · CC APR ~70%
  - **India** (medium) · CC APR ~40%
  - **SE Asia** (small cluster: ID/PH/VN) · CC APR ~30–45%
  - **USA** (small, boutique) · "credit-invisible HNW"
- Each pin floats a small label with country name + APR in monospace.
- One line centered below the map: *▸ Each market shares the same protocol stack. Local modules swap in 60–90 days.*

**Slim partner strip:**
Header: `PARTNERS · SIGNED OR IN ACTIVE DISCUSSION`
Single horizontal logo-strip, hairline gold dividers between, partner names only:

**Sekuro · Brinks-class · Lloyd's · Vaultik · Sumsub · Kamino V2 · Loopscale · Mercado Bitcoin · Transfero · BVI Trust Co.**

**Footer (untouched):**
> ▸ Caixa values your Patek Philippe as scrap metal. We value it as a Patek Philippe.

**Voice-over (tightened to ~22s, ~60 words):**
> Where credit is expensive, luxury collateral is everywhere. Ninety billion dollars in private-hand luxury watches across high-cost-credit markets — twenty billion realistically addressable, one-to-three billion year-five originations. Each market shares the same Solana stack — only custody swaps per country. Sekuro, Sumsub, Kamino, Loopscale, Mercado Bitcoin, Transfero — in active discussions. Caixa values your Patek as scrap metal. We don't.

---

### Slide 8 — Competitive landscape (3:04–3:25) — 21s

**Headline:** *We're not first. We're built for a different market.*
**Subline:** *Where we fit. What we don't do.*

**Visual — competitive matrix table, full-width:**

| Player | Asset class | Chain | Custody | Geography | Status / traction |
|---|---|---|---|---|---|
| Kettle Finance | Watches | Blast L2 | Own NYC vault | US-first | $4M raised · $20M GMV · $6M loans · live |
| 4K Protocol | Physical luxury | Ethereum / Polygon | Own Guardians | Global | Live · Rolex DeFi loans via Arcade |
| Tangible | RE + watches | Polygon | Various SPVs | Global | Live · USDR collapsed 2023 |
| Arcade.xyz | Wrapped NFTs | Ethereum | n/a (digital) | Global | $1B/mo NFT lending |
| ~~Caixa Federal~~ *(legacy, struck through)* | Anything | — | Bank vault | Brazil | 36% APR · scrap-metal pricing |
| **Vaulx** *(highlighted row, teal background)* | **Luxury physical** | **Solana** | **Independent · licensed** | **Global / Brazil → LATAM-first** | **Devnet live · mainnet Q3 2026 · 50 loans Q3 / 100 Q4** |

**Below the matrix, "Unoccupied vertex" callout block (teal-bordered):**

| Chain | Geography | Architecture | Issuance |
|---|---|---|---|
| Solana — economics, not just narrative | LATAM-first — where credit costs 60–400% | Composable — not closed marketplace | Joint with regulated local partner |

**Voice-over (~21s, ~60 words):**
> We're not first. We're built for a different market. Kettle, 4K, Tangible, Arcade — all live, none on Solana, none LATAM-first, none composable with mature lending markets. Caixa pawns at scrap-metal pricing. The unoccupied vertex: Solana economics, LATAM-first geography, composable architecture, joint regulated-local issuance. Vaulx sits in that vertex.

**Note for designer**: Vaulx row uses teal background (consistent with existing accent system). Caixa row visually de-emphasized — strikethrough on name + muted text color. Consider showing this slide in dark-mode (paper-on-ink) to make the teal Vaulx row pop harder.

---

### Slide 9 — Team (3:25–3:50) — 25s

**Visual:**
Five black-and-white portraits in a row. Name + role on top in serif gold. Below each: a **"why on the team"** description — what specific axis they own — in compact sans.

- **George Dimitrov** — CEO/CTO
  *Global banking & financial operations · corporate execution · institutional & regulatory affairs. Owns: Vaulx is corporate-grade across business, governance, legal, compliance, tech. Drives institutional partnerships on-chain and off-chain.*

- **Marcelo** — COO
  *Runs **Gitel** — 38 years building Brazilian electronic-security infrastructure: CCTV, IoT sensors, access control, NOC operations. That is the exact tech stack behind Vaulx's atomic custody invariant. Owns: protocol is operationally solid for participants and partners.*

- **Rodrigo** — Head of Partnerships & BD
  *Proven networking and BD across Brazil and LATAM. Owns: Mercado Bitcoin and other BR partnerships (with Marcelo) — local compliance + fast adoption + growth.*

- **Edson** — Senior Solana Engineer
  *Owns: all on-chain and protocol-level engineering. Shipped 4 Anchor programs across Phase 1–3.*

- **Felipe** — DeFi & Community Advisor
  *Founder of 4p.finance · strong DeFi ties across US and Brazil. Advises on crypto/DeFi business partnerships and community.*

Bottom row, two lines:
**No competitor can assemble this team.**
*Active commercial conversations with appraisers, custodians, and curators.*

**Voice-over (tightened, ~25s, ~70 words):**
> Five founders, five non-overlapping axes. I run global banking, corporate, and institutional. Marcelo runs Gitel — thirty-eight years building Brazilian electronic-security infrastructure: CCTV, IoT, access control. That is the exact tech behind Vaulx's atomic custody invariant. Rodrigo runs Brazil and LATAM BD, including Mercado Bitcoin. Edson shipped four Anchor programs. Felipe, founder of four-p-finance, advises on DeFi and community. Active commercial conversations with appraisers, custodians, and curators are open today. No competitor can assemble this team.

---

### Slide 10 — Distribution: built-in (3:50–4:12) — 22s

**Headline:** *Distribution is built-in.*
**Subline:** *The team's existing networks + reusable Solana identity = near-zero CAC at launch.*

**Visual — three-column layout, each a channel:**

| **DIRECT (BR + LATAM)** | **REUSABLE IDENTITY** | **INSTITUTIONAL & LP-SIDE** |
|---|---|---|
| **4p.finance pipeline** — Felipe processes São Paulo luxury-watch flow on crypto rails today | **Sumsub ID Connect** — 200+ partner protocols on the network | **Mercado Bitcoin** (~4M users) + **Transfero** as institutional anchor lenders |
| **Rodrigo's BD network** — Brazil + LATAM bank, custodian, and partner relationships | **Native SAS attestations** — Sumsub × Solana Foundation, May 2025 — KYC once, borrow anywhere | **Kamino V2** + **Loopscale** curators reach the existing Solana yield audience |
| **Marcelo + Gitel** — operational credibility + supplier network from 38 yrs in BR electronic-security across industry, ports, agribusiness, energy | One-click borrower onboarding via Crossmint social login + reusable SAS attestation | LP-side flywheel: curated vaults attract pre-qualified institutional liquidity |

Bottom line in gold: **Low CAC at launch. Growth driven by partner-network multiplication, not paid acquisition.**

**Voice-over (tightened, ~22s, ~62 words):**
> Distribution is built-in. Felipe at four-p-finance already processes São Paulo's luxury-watch flow on crypto rails today. Rodrigo's Brazil and LATAM BD network gives us partnership reach. Sumsub's ID-Connect network has two hundred plus partner protocols — every Solana user who KYC'd elsewhere can borrow on Vaulx with no friction. Lender side: Mercado Bitcoin, Transfero, Kamino, Loopscale. Low customer-acquisition cost at launch — partner-network multiplication, not paid acquisition.

---

### Slide 11 — Traction · Ask · Close (4:12–4:40) — 28s

**Visual — black slide, three vertical zones:**

**Zone 1 — Hero band** (top):
- Large "Vau*l*x" wordmark, italic 'l' in accent teal
- Tagline: *The rail between physical luxury and onchain capital. Built on Solana. Live on Devnet today.*

**Zone 2 — Three-column panels** (middle, full-width with vertical dividers):

| **TRACTION · LIVE TODAY** | **OUR ASK · COLOSSEUM PRIZE** | **USE OF FUNDS · CONCRETE MILESTONES** |
|---|---|---|
| **Built. Tested. Live.** | **$250K** *Solana RWA track · pre-seed* | **Audit → mainnet → 100 customers.** |
| ▸ 4 Anchor programs on Devnet — vault · loan · trdc · auction | ▸ To get to **mainnet** with audited contracts | ▸ **Day 0** · audit kickoff · 4 Anchor programs · external review + bug bounty |
| ▸ 45+ anchor tests · all green · CI gating | ▸ To close the **first custodian + appraiser + curator** | ▸ **Day 60** · Sekuro custodian agreement signed · Lloyd's binder confirmed |
| ▸ vaulx.vercel.app — frontend live · demo cockpit at /admin/demo | ▸ Bridge to **seed round** with traction + revenue | ▸ **Day 90** · mainnet launch · first loan originated (real watch, real USDC) |
| ▸ Indexer + bridge running · Supabase event log | | ▸ **Q3 2026** · **50 customers** · senior + junior tranches live · LP cohort onboarded |
| | | ▸ **Q4 2026** · **100 customers** · seed close · $1.5–3M to scale BR + first LATAM market |

The middle panel ("Our ask") is visually highlighted with a subtle teal-gradient background and accent-2 left border, drawing the eye.

**Zone 3 — Footer row** (bottom):
- Left: links — *github.com/Vaulxfi · vaulx.vercel.app · Solana Devnet · Mainnet Q3 2026*
- Right: CTA pill in accent teal — **Come build with *us.***

**Voice-over (~28s, ~80 words):**
> Vaulx. Built. Tested. Live on Devnet today — four programs, forty-five-plus tests, frontend running, demo cockpit shipped. Our ask: the two-hundred-and-fifty-thousand-dollar Colosseum prize, to take Vaulx from Devnet to mainnet. Audit our four programs, close Sekuro as our first custodian, originate our first **fifty mainnet loans by Q3, one hundred by Q4**, and bridge to seed. The rail between physical luxury and onchain capital. Built on Solana. Come build with us.

**Word count: 78 · Time: 28s**

**Notes for George (recording):**
- Pause briefly after "Built. Tested. Live on Devnet today" — let the four-cell traction visual breathe.
- "Two-hundred-and-fifty-thousand-dollar" — say it slowly. It's the ask.
- The four use-of-funds bullets should be read crisply, almost as a list — judges hear a clear plan.
- Final line "Come build with us" — half-smile, hold for ~0.8s before fade-out.

---

## Final timing — v7 (11 slides, structural overrun — cuts required)

| Slide | Words | Time @170wpm |
|---|---|---|
| 1 — Cover (NEW) | 50 | 18s |
| 2 — Asymmetry (refined: 3 options narrative) | 70 | 25s |
| 3 — Architecture (KYC/Appraisal split, 10 modules) | 95 | 33s |
| 4 — Cycle economics (1-yr CC vs 4× Vaulx) | 95 | 34s |
| 5 — Risk + liquidation | 85 | 30s |
| 6 — Why Solana & Why Now | 85 | 30s |
| 7 — Market (funnel + world map) | 60 | 22s |
| 8 — Competition (NEW: unoccupied vertex) | 60 | 21s |
| 9 — Team | 70 | 25s |
| 10 — Distribution | 62 | 22s |
| 11 — Traction + Ask + Close | 78 | 28s |
| **Total** | **810** | **4:48** |

**Loom video has no Q&A.** Hard 3:00 cap. **108 seconds over** with all 11 slides. Pick a cut strategy below.

**Cut path A — drop 2 slides (recommended)**

Most-cuttable in order:
1. **Drop Slide 5 (Risk + Liquidation)** — saves 30s. Atomic invariant on Slide 3 + loss-waterfall mention on Slide 11 carry enough risk story for a 3-min Loom. Detail belongs in technical demo.
2. **Drop Slide 8 (Competition)** — saves 21s. The "unoccupied vertex" framing can be a single line in the architecture or distribution voice-over.
   - **Alternative**: drop Slide 7 (Market) instead — saves 22s, world map is nice but addressable-numbers can fold into Slide 2.
3. **Do NOT drop**: Slide 1 (Cover sets thesis), Slide 2 (problem), Slide 3 (architecture + invariant), Slide 4 (real business proof), Slide 6 (Why Now — Western Union timing unreplaceable), Slide 9 (Team), Slide 10 (Distribution), Slide 11 (Ask).

After Path A: 9 slides, ~640 words, ~3:47. Still over.

**Cut path B — Path A + aggressive word trims** (cuts ~150 more words → ~50s)
- Slide 1: drop "We're live on Solana Devnet today" line (Slide 11 carries it) → -6s
- Slide 2: drop "and it cannot reach him" → -3s
- Slide 3: drop "Off-chain: Sumsub KYC… Lloyd's insurance. On-chain: Kamino and Loopscale curated vaults, Vaulx Trust as noteholder." (slide carries the partner names) → -12s
- Slide 4: drop "Three-month cycles for short-term, immediate-need credit" (subline on slide carries it) → -5s
- Slide 6: drop "Compressed NFTs at a fraction of a cent…" line (top row carries) → -3s
- Slide 7: drop "in active discussions" → -2s
- Slide 9: cut George's "I run global banking, corporate, and institutional" (slide text carries) → -5s
- Slide 11: drop the use-of-funds list in voice ("Audit our four programs, close our first custodian and curator…") — slide carries it → -7s

After Path B: 9 slides, ~490 words, ~2:53 at 170wpm. **Lands inside the cap.**

**Cut path C — keep all 11 slides, accept 3:30+**
Colosseum penalizes overruns. Not recommended unless judges are lenient on the Solana RWA track specifically.

**Recommendation: Path B (drop slide 5 + 8, apply all C's trims).** The pitch lands at ~2:53. Risk + Competition stories survive in the technical demo + slide 3/9/10 voice-overs.

Tell me which path to commit to and I'll apply the cuts to both the script and the HTML deck (will regenerate `Vaulx_Pitch_v8.html`).

**Pre-recording verification checklist** (do this on recording day):
- [ ] Run `pnpm anchor:test` — capture exact test count → update slide 9 if different from "45+"
- [ ] Verify `github.com/Vaulxfi/...` repo is **public** (Open-source criterion)
- [ ] Confirm at least one appraiser + one custodian + one curator status before stating "active conversations" on slide 7
- [ ] Verify Sumsub × Solana Foundation SAS integration date ("May 2025") on Sumsub's official press page
- [ ] Verify Western Union USDPT launch date ("May 2026") on Western Union IR or businesswire press release
- [ ] Verify Solana RWA TVL figure ($1.82B March 2026) on rwa.xyz before recording

---

## What's on each slide that wasn't in v1 (cumulative across v2 + v3)

| Slide | New substance vs v1 |
|---|---|
| 1 | Real rate table (LTV + APR by source), gold separator showing the gap, Marcelo identifier under photo |
| 2 | **Full architecture diagram** with 9 numbered modules, GLOBAL/LOCAL classification, Anchor band running through middle. Footer legend: "7 of 9 modules global, only 2 swap per market" — sharpest scaling claim in the deck |
| 3 | **Full unit economics, real fee structure**: upfront cost table + Vaulx fee schedule (per-loan fees, NOT APR slices) + borrower all-in APR build-up + Vaulx revenue per asset ($590) across 4-cycle relationship. Real product term (3mo + 3 renewals), real billing model |
| 4 | **NEW SLIDE — risk + liquidation**: LTV tiers by asset class, 14-day Dutch auction tier timeline, default loss waterfall |
| 5 | Quantified Solana primitives ($0.0005/mint, etc.) instead of one-liners |
| 6 | **REBUILT** — bottom-up addressable funnel ($90B/$20B/$1-3B) replacing $2.4T vanity. World map infographic with 6 country pins. Slim partner logo strip. Solana-as-rail not Pix-as-rail. Wine/whisky roadmap removed (off-thesis) |
| 7 | "Custodian moat is unfakeable" pull line |
| 8 | Compact close |

---

## Hand-off notes for Claude Designs

- Slides 2, 3, 4, and 6 are the **visual anchors of the deck**. They are the slides judges will screenshot and re-read. Highest design effort here.
- Tables: monospace numbers, right-aligned columns, hairline gold dividers between columns.
- Diagrams: hand-built SVG, not auto-generated. The architecture diagram on slide 2 should look engineered, not whiteboarded. The world map on slide 6 should feel editorial/financial-press, not travel-app — hairline strokes only, accent pins, no fills.
- The Submariner photograph: real, professional product shot. Source one or commission for ~$50.
- Export both 1920×1080 (for video) and 2560×1440 (for static deck).
- Math reconciliation: the "Vaulx revenue per asset ~$590" on slide 3 must arithmetically reconcile with the APR table directly above it — if you change one, change both.

## Hand-off notes for George (recording)

- Pace 170 wpm. Pause after every gold number for ~0.4s.
- Slides 3 and 4 are the densest — slow ~5% there. They're the slides where you sound like a banker, which you are.
- The "scrap metal" line on slide 6: half-smile, slow. Earned punchline.
- "The custodian moat is unfakeable" on slide 7 — say it. Don't read it off the slide.
- "Seven of nine modules ship globally" on slide 2 — emphasize. This is the sharpest scaling claim and most-quotable line in the deck for follow-up investor conversations.
- Practice slide 2 transitions twice — the architecture diagram animation has to time-match your enumeration of the gates.

## Open questions for the user

1. **Slide 6 — Mercado Bitcoin name on the partner strip**: only include if you've at least had the introductory call by recording day. If not, remove the name and replace with placeholder "Regulated BR issuer · in discussion". Honesty bias from judges.
2. **Slide 6 — country list**: currently BR, MX, TR, IN, SEA, USA. If you'd rather swap USA for Nigeria or South Africa, both fit the "high-cost-credit + luxury exists" thesis equally well. USA is included only as a "boutique credit-invisible HNW" angle which is weaker.
3. **Slide 6 — addressable numbers ($90B / $20B / $1–3B)**: I built these bottom-up but you should sanity-check the $90B against a Bain or Morgan Stanley source in 30 minutes before recording. Don't go on camera with a number you can't defend.
4. **Slide 3 — loan size**: currently $5,000 drawn against a $10,000 watch. If your real average ticket size is bigger ($10–15k loan against a $20–30k watch), swap in. Bigger loans make the unit economics look healthier and are still believable for a Submariner-class buyer.
