# Vaulx Pitch Deck — AI Builder Instructions (Gamma / Gemini / Beautiful.ai)

**Purpose:** paste-ready instructions to generate the Vaulx Colosseum pitch deck via an AI tool, then refine.
**Target output:** 9 slides, 16:9, dark editorial / financial-press aesthetic, infographic-heavy.
**Source content:** mirrors `Vaulx_Pitch_Voiceover.md` v9 narrative.

---

## How to use

### Path A — Gamma (recommended)

1. Go to **gamma.app** → **Create new** → **Generate** → **Paste in text**.
2. Paste the **MASTER PROMPT** block below into the text area.
3. When Gamma asks for style: choose **"Modern, dark, professional"** or upload a custom theme matching the palette in the design spec.
4. Set: **Format = Presentation · Aspect = 16:9 · Density = Detailed · Tone = Direct**.
5. Click **Generate**. Wait for 9-slide output.
6. Open each slide → click **Edit with AI** → use the **PER-SLIDE REFINEMENT PROMPTS** to push back on generic layouts.
7. Export: **PDF + PPTX + Web link** (use the web link in Loom recording).

### Path B — Gemini / ChatGPT / Claude (for HTML output)

1. Paste the entire **MASTER PROMPT** block.
2. Add: *"Generate a single-file responsive HTML deck using inline CSS only. 16:9, 1920×1080. Use the visual specs per slide. Output complete HTML."*
3. Iterate per slide using **PER-SLIDE REFINEMENT PROMPTS**.

### Path C — Beautiful.ai / Pitch / Tome

1. Paste **MASTER PROMPT**.
2. These tools tend to over-decorate; paste the **ANTI-PATTERNS** block as well.
3. Let them generate, then manually swap stock images for the SVG/diagram specs noted per slide.

---

## MASTER PROMPT — paste this first

```
You are designing a 9-slide investor pitch deck for VAULX, a Solana on-chain credit
protocol that connects asset-rich Brazilians to global onchain capital using physical
luxury collateral with deterministic on-chain liquidation.

CONTEXT
- Submitting to Colosseum Cypherpunk Hackathon 2026 (deadline May 10, 2026)
- 3-minute Loom voice-over will play over these slides
- Audience: technical Solana judges + venture investors
- The visual style must be EDITORIAL / FINANCIAL-PRESS, not SaaS / startup-marketing

DESIGN PHILOSOPHY (NON-NEGOTIABLE)
- Data-rich, not poetic. Every slide must contain at least one number, table, or
  diagram a judge would underline.
- Voice-over carries the story; slides carry the substance.
- Editorial whitespace. Generous breathing room. Restraint over decoration.
- Read like a private bank annual report meets engineering whitepaper.

PALETTE (USE EXACTLY THESE)
- Background: #0A0A0B (near-black) for hero/dark slides; #FAFAF7 (warm off-white) for content slides
- Body text: #F5F0E8 on dark, #1A1A1D on light
- Primary accent: #0E7C7B (deep teal) — used for emphasis, CTAs, key numbers
- Secondary accent: #2BA09E (lighter teal) — used for hover/highlight states only
- Warning/penalty color: #B8412C (rust red) — used SPARINGLY, only for predatory rates
- DO NOT use: bourbon orange (#C18C45 reserved sparingly for funnel SAM band only),
  bright blues, purples, gradients, neons

TYPOGRAPHY
- Headlines: serif (Editorial New, Tiempos, Canela, or fallback Georgia)
- Body / data / monospace numbers: sans-serif (Inter Tight, Söhne, or fallback Inter)
- Code/refs/labels: JetBrains Mono
- One serif + one sans + one mono. NO third font.

VISUAL LANGUAGE
- Tables, diagrams, real numbers in monospace, right-aligned
- Hairline gold/teal dividers between table columns
- NO emoji
- NO stock photos of "businesspeople shaking hands" or generic abstract gradients
- NO 3D shapes
- NO drop shadows except subtle (max 4px blur, 8% opacity)
- ONE hero photograph per deck: a real Rolex Submariner (slide 1)
- Diagrams should be hand-built SVG-style — engineered, not whiteboarded

ANIMATION
- Minimal. Slow fades, slow type-on for key numbers.
- No swooshes, no parallax, no auto-rotate.
- Numbers should fade in 100ms apart so the reader can scan sequentially.

STRUCTURE: 9 SLIDES (in order)
1. The Asymmetry (dark)
2. Protocol Architecture (light)
3. The Atomic Gate (light)
4. Unit Economics (light)
5. LP Tranches & Risk (light)
6. Competitive Landscape (light)
7. Why Now & Distribution (dark)
8. Team (light)
9. Ask & Roadmap (dark)

Each slide is detailed below. Render exactly as specified. Do not add slides.
Do not change slide order. Do not reword headlines.
```

---

## PER-SLIDE CONTENT + VISUAL SPECS

Paste each block one at a time when refining individual slides, OR include them all in the initial generation prompt.

---

### SLIDE 1 — The Asymmetry (dark theme)

```
HEADLINE: "Asset-rich, credit-trapped — meets capital with nowhere to go."

LAYOUT: Two-column split, vertical teal divider with rotated "NO RAIL" text in the
center gap. Left column ~55% width, right column ~45%.

LEFT COLUMN — "Demand side · Asset-rich, credit-trapped"
- Top: photo card showing a Rolex Submariner with caption:
  "Marco · São Paulo · Rolex Submariner Ref. 116610LN · R$80,000 / ~$14,000 idle"
- Below photo, a 3-row rate table with columns: Tier · Brazilian Product · LTV/Rate
  Row 1 (RED text in rate column): "Penalty · Credit card rotativo · — · ~400% APR"
  Row 2 (RED): "Standard · Consumer loan · — · ~60% APR"
  Row 3 (RED): "Cheapest formal · Caixa Federal penhor · 20% LTV scrap-metal · ~30% APR"
- Two small footnotes in monospace muted gray:
  "Caixa is the only Brazilian institution legally authorized for penhor."
  "Rotativo applies to credit-card balances carried past the 30-day grace period — the
  rate that hits the ~50M Brazilians who revolve credit-card debt."

CENTER DIVIDER: vertical teal stripe with rotated text "NO RAIL" in white serif

RIGHT COLUMN — "Supply side · Capital seeking yield"
- Subtitle in body: "Onchain USDC capital is the cheapest, most patient credit in the
  world — sitting idle at single-digit APR, with no trustable rail to physical-luxury
  collateral."
- Hero number block (teal border, semi-transparent teal fill):
  Label: "USDC ONCHAIN · IDLE"
  Big number: "8–10% APR"
  Sublabel: "Insured RWA collateral · rare"
- Closing line in mono muted:
  "→ The gap is not interest rates."
  "→ It is the absence of a rail."
```

---

### SLIDE 2 — Protocol Architecture

```
HEADLINE: "Modular. Atomic. Composable."
SUBLINE: "Solid blocks ship once. Dashed blocks swap per market. Four Anchor programs
in the middle never move."

LAYOUT: Three horizontal layers stacked vertically, each with a left-side label rail.

LAYER 01 — OFF-CHAIN, USER-SIDE (3 modules · all GLOBAL · solid borders)
  A · Borrower wallet — Crossmint · 1-tap social login · embedded Solana wallet
  B · KYC self-onboarding — Sumsub + native SAS (May 2025) → on-chain KycAttestation PDA
  C · Online appraisal — Vaultik · Chrono24 · WatchCharts · 3-source median · live API

LAYER 01 — OFF-CHAIN, ASSET-SIDE (3 modules · 2 LOCAL/dashed · 1 GLOBAL/solid)
  D · Offline appraisal [LOCAL] — certified appraiser per market · in-person eval
  E · Licensed custodian [LOCAL] — Sekuro · Brinks-class · Loomis-class network
  F · Global insurance (Lloyd's) [GLOBAL] — master policy · theft + damage to trustee

ANCHOR PROGRAMS BAND (full-width teal background, white text)
  Header: "Solana · 4 programs · 5 atomic gates · Global"
  Programs row: "vault · loan · trdc · auction"
  Gates flow: "G1 Appraisal → G2 Custody → G3 cNFT mint → G4 Borrow → G5 Repay/Default"

LAYER 02 — ON-CHAIN (4 modules · all GLOBAL · solid borders)
  G · cNFT + Oracle — Bubblegum cNFT · SAS attestations · Pyth + RedStone (multi-oracle)
  H · Curated lending rails — Kamino V2 + Loopscale USDC · composable curator infra
  I · Vaulx UI + indexer — Next.js · indexer · bridge · admin cockpit /admin/demo
  J · Vaulx Trust (reg co.) — Regulated counterparty entity · noteholder of record

FOOTER (full-width strip):
"▸ 8 of 10 modules ship globally. Only offline appraisal and licensed custodian swap
per market — 60–90 days per new country.
▸ THE ATOMIC INVARIANT: no USDC disburses until the licensed custodian's keypair signs
custody-confirmation — atomically, in the same transaction.
▸ Vaulx orchestrates licensed counterparties. We post a 5% protocol-owned first-loss
buffer on every loan."

VISUAL TREATMENT
- Solid borders for GLOBAL modules (1.5px solid teal)
- Dashed borders for LOCAL modules (1.5px dashed gray) plus diagonal hatching pattern
  inside the box at 7% opacity
- Each module shows a step letter (A-J) in monospace teal in the top-left corner
- Each module has a small "GLOBAL" or "LOCAL" tag in the top-right corner
```

---

### SLIDE 3 — The Atomic Gate

```
HEADLINE: "Five gates. One signature. No middleman."

LAYOUT: Center-stage horizontal flow diagram showing the 5 gates connected by arrows.
Below the flow: a "killer invariant" callout box.

GATES FLOW (left to right, equal-width cells, large)
  G1 · Appraisal     →   G2 · Custody     →   G3 · cNFT Mint   →   G4 · Borrow      →   G5 · Repay/Default
  Trilateral         Custodian keypair    Bubblegum +          USDC released         Onchain settlement
  blinded eval       signs on-chain       SAS metadata         atomically            or auction trigger

KILLER INVARIANT BOX (full-width below the gates, dark-on-light or light-on-dark high
contrast, with a small "ATOMIC INVARIANT" tag):
"No USDC is disbursed until the licensed custodian physically vaults the asset and
signs on-chain — atomically, in the same transaction."

NAMED-COMPETITOR CALLOUT (small mono row at the bottom):
"vs Aave · Maple · Centrifuge — none have shipped this on-chain."

DEFAULT FOOTNOTE (smaller, muted):
"Default is managed purely at the smart-contract level via event-triggered auctions —
no off-chain operator control."
```

---

### SLIDE 4 — Unit Economics

```
HEADLINE: "Vaulx beats every formal credit option in Brazil."
SUBLINE: "At 24% APR with 50% LTV, Vaulx is cheaper than the cheapest formal credit —
and lends 2.5× more capital per asset."

LAYOUT: Full-width comparison table at top, then 3-bucket cost-of-credit panel below.

COMPARISON TABLE (5 columns: Option · APR · LTV · $ on $14k Rolex · 12-mo cost)
  Row 1 (rust-red rate, faded background):
    "Credit card rotativo (penalty) · ~450% · — unsecured · n/a · massive"
  Row 2 (neutral):
    "General consumer loan · ~61% · — unsecured · n/a · ~$3,050 on $5k"
  Row 3 (neutral):
    "Caixa penhor (cheapest formal) · ~30% · 20% scrap-metal · ~$2,800 · ~$840"
  Row 4 (FULL-WIDTH TEAL BACKGROUND, white text, larger type):
    "VAULX (2% / month) · 24% · 50% full asset value · $7,000 · ~$1,680"

BELOW THE TABLE (split layout: 60% cost-bucket panel · 40% headline benefit panel)

LEFT — 3-BUCKET COST PANEL ("Cost of credit · 24% all-in · 3 buckets")
  | Bucket | APR |
  | Cost of capital — LP yield (USDC supplier) | 8% |
  | Cost of operations — origination · custody · insurance · servicing · curator | 12% |
  | Cost of risk — protocol first-loss buffer + risk margin | 4% |
  | Borrower all-in (2% / month) | 24% |

RIGHT — Two headline benefit cards
  Card 1 (teal-bordered, accent): "vs Caixa penhor — Cheaper rate. 2.5× more capital
  per asset. (24% vs 30% APR · 50% vs 20% LTV at full vs scrap-metal value)"
  Card 2 (gray-bordered): "Why 3 months — Short-term, immediate-need credit. Quick
  disbursement · repay or roll over · asset returned at exit · 4× renewable"

BOTTOM SUMMARY STRIP (4 cells, full-width, teal background)
  | BORROWER ALL-IN | VAULX REVENUE / ASSET | LP NET (POST EL) | vs ROTATIVO PENALTY |
  | 24% APR · 2%/mo | ~$300–600/yr · 6–12% of borrowed | ~5% APR · collateralized | 19× cheaper · 24% vs 450% |
```

---

### SLIDE 5 — LP Tranches & Risk

```
HEADLINE: "Risk is tiered. Default is choreographed."

LAYOUT: Three columns side by side.

LEFT — LTV BY ASSET CLASS (table)
  | Asset class | Origination LTV | Liquidation threshold |
  | Steel sport watches | 50% (bar) | 70% (bar) |
  | Gold/precious watches | 40% | 60% |
  | Handbags (Hermès, Chanel) | 35% | 55% |
  | Art / one-offs (Phase 2) | 25% | 45% |
Render the LTV/threshold values as small horizontal progress bars, not just numbers.

MIDDLE — 14-DAY DUTCH AUCTION (vertical timeline)
  T+0  · Margin call · 24h to top up via USDC or Pix
  T+1  · Tier 1 · Pool LPs · last-appraisal floor
  T+3  · Tier 2 · Resellers · authorized network + governance holders
  T+7  · Tier 3 · Open onchain auction · Dutch decay
  T+14 · Tier 4 · Backstop · offline auction house · 70% reserve
First row (T+0) gets a rust-red/warning treatment; all others use ink/neutral.

RIGHT — LP TRANCHE STRUCTURE (the new addition)
  Header: "LP Tranches"
  | Tranche | Yield | Capital share | Position |
  | Senior  | 8% APR fixed  | ~75% | Last to take losses · paid first |
  | Junior  | 12% APR fixed | ~25% | First to take losses (above POL) |
  | Vaulx POL | n/a · protocol-owned | 5% of every loan | Absorbs first 5% |
  Footnote in mono: "Senior beats Maple syrupUSDC (~7%) by 100 bps — backed by physical
  collateral with insurance + 5% POL."

FULL-WIDTH FOOTER (loss waterfall as horizontal flow)
  "Loss waterfall: Borrower equity → POL first-loss → Junior LP tranche → Senior LP tranche"
  Below: "Insurance covers theft & damage to trustee — never default risk."
```

---

### SLIDE 6 — Competitive Landscape

```
HEADLINE: "We're not first. We're built for a different market."

LAYOUT: Comparison matrix table, full-width, with Vaulx row highlighted in teal.

TABLE COLUMNS: Player · Asset class · Chain · Custody · Geography · Status

ROWS (in this order):
  | Kettle Finance | Watches | Blast L2 | Own NYC vault | US-first | $4M raised · $20M GMV · live |
  | 4K Protocol | Physical luxury | Ethereum / Polygon | Own Guardians | Global | Live · Rolex DeFi loans via Arcade |
  | Tangible | RE + watches | Polygon | Various SPVs | Global | Live · USDR collapsed 2023 |
  | Arcade.xyz | Wrapped NFTs | Ethereum | n/a (digital) | Global | $1B/mo NFT lending |
  | ~Caixa Federal~ (strikethrough, faded gray) | Anything | — | Bank vault | Brazil | 36% APR · scrap-metal pricing |
  | VAULX (FULL-WIDTH TEAL BACKGROUND, white text, bolder) | Luxury physical | Solana | Independent · licensed | Global / Brazil → LATAM-first | Devnet live · mainnet Q3 2026 · 50 loans Q3 / 100 Q4 |

BELOW THE TABLE — "THE UNOCCUPIED VERTEX" callout (teal-bordered box, 4 columns)
  Chain: "Solana — economics, not just narrative"
  Geography: "LATAM-first — where credit costs 60–400%"
  Architecture: "Composable — not closed marketplace"
  Issuance: "Joint with regulated local partner"
```

---

### SLIDE 7 — Why Now & Distribution (dark theme)

```
HEADLINE: "Three primitives. Four signals. One window."
SUBLINE: "None of this stack existed 18 months ago. The institutional money is moving
onchain — on Solana — this quarter."

LAYOUT: Two-row layout.

TOP ROW — "WHY SOLANA · primitives" (3 cards)
  cNFT (Bubblegum) · ~$0.0005 per mint · "Luxury class scales globally"
  SAS · 1× verified, read everywhere · "Reusable on-chain KYC"
  Composability · CPI: Anchor → Kamino + Loopscale · "We originate. They run lending."

BOTTOM ROW — "WHY NOW · institutional adoption on Solana" (4 cards, with one card
flagged as "NEW" for fresh news)

  Card 1: RWA TVL on Solana · "$1.82B" (March 2026) · "+90% MoM growth · 3rd-largest
  RWA chain after Ethereum and BNB"

  Card 2 (flagged "NEW" with small badge in top-right):
  Western Union · "USDPT live" · "Launched May 2026 on Solana via Anchorage Digital
  Bank · 'Stable by Western Union' in 40+ countries"

  Card 3: Payments giants · "Visa · Stripe · PayPal · Fiserv" · "Production stablecoin
  workflows live on Solana · USDC settlement for US banks"

  Card 4: Tokenized funds · "BUIDL · FOBXX" · "BlackRock $2.3B AUM · Franklin Templeton
  $594M money fund · both live on Solana"

DISTRIBUTION CALLOUT BAR (full-width below, teal background, white text)
"Off-chain: Felipe (4p.finance) processes São Paulo's luxury-watch flow on crypto rails
today. Rodrigo's BR + LATAM BD network. Sumsub ID Connect — 200+ partner protocols.
On-chain: Kamino + Loopscale curators reach existing Solana yield audience. WE BRING
THE BORROWERS. SOLANA BRINGS THE CAPITAL."
```

---

### SLIDE 8 — Team

```
HEADLINE: "Anyone can fork a smart contract."
SUBLINE: "You cannot fork our team."

LAYOUT: 5 founder cards in a row, each with name, role, "what they bring."

  George Dimitrov · CEO/CTO
  "15+ yrs · Banking"
  Global banking & financial operations · institutional & regulatory affairs.
  Owns: Vaulx is corporate-grade across business, governance, legal, compliance, tech.

  Marcelo · COO
  "38 yrs · Gitel.com.br"
  Runs Gitel — 38 years building Brazilian electronic-security infrastructure: CCTV,
  IoT sensors, access control, NOC operations. That is the exact tech stack behind
  Vaulx's atomic custody invariant.

  Rodrigo · Head Partnerships & BD
  "BR + LATAM · BD"
  Proven networking and BD across Brazil and LATAM. Owns: Mercado Bitcoin and other BR
  partnerships — local compliance, fast adoption, growth.

  Edson · Senior Solana Engineer
  "Anchor · Bubblegum · Pyth"
  Owns all on-chain and protocol-level engineering. Shipped 4 Anchor programs across
  Phase 1–3.

  Felipe · DeFi & Community Advisor
  "CEO · 4p.finance"
  Founder of 4p.finance. Already processes São Paulo's luxury-watch flow on crypto
  rails today. Advises on community + DeFi partnerships.

VISUAL: each card has a 4:5 aspect-ratio "portrait" placeholder at the top with diagonal
hatching pattern (no actual portrait — judges/team can swap real photos in later).

BOTTOM BAND (full-width, ink background, white text, with teal left border):
"Active commercial conversations with appraisers, custodians, and curators."
Right side: in monospace muted gray, the credentials line "BANKING · SECURITY · BD ·
SOLANA · DEFI"
```

---

### SLIDE 9 — Ask & Roadmap (dark theme)

```
LAYOUT: Three-column hero panel.

HERO (top, large): "Vaul[x]" wordmark with italic 'l' in teal, super large
TAGLINE: "The rail between physical luxury and onchain capital. Built on Solana. Live
on Devnet today."

THREE PANELS (middle, full-width):

  PANEL 1 — TRACTION · LIVE TODAY
  Header: "Built. Tested. Live."
  ▸ 4 Anchor programs on Devnet — vault · loan · trdc · auction
  ▸ 45+ anchor tests · all green · CI gating
  ▸ vaulx.vercel.app — frontend live · demo cockpit at /admin/demo
  ▸ Indexer + bridge running · Supabase event log

  PANEL 2 — OUR ASK · COLOSSEUM PRIZE (HIGHLIGHTED with teal-gradient bg + accent border)
  Big number: "$250K"
  Sublabel: "Solana RWA track · pre-seed"
  ▸ To get to mainnet with audited contracts
  ▸ To close the first custodian + appraiser + curator
  ▸ Bridge to seed round with traction + revenue

  PANEL 3 — USE OF FUNDS · CONCRETE MILESTONES
  Header: "Audit → mainnet → 100 customers."
  ▸ Day 0  · audit kickoff · 4 Anchor programs · external review + bug bounty
  ▸ Day 60 · Sekuro custodian agreement signed · Lloyd's binder confirmed
  ▸ Day 90 · mainnet launch · first loan originated (real watch, real USDC)
  ▸ Q3 2026 · 50 customers · senior + junior tranches live · LP cohort onboarded
  ▸ Q4 2026 · 100 customers · seed close · $1.5–3M to scale BR + first LATAM market

FOOTER (bottom, split):
Left: links — github.com/Vaulxfi · vaulx.vercel.app · Solana Devnet · Mainnet Q3 2026
Right (CTA pill, teal background): "Come build with us."
```

---

## ANTI-PATTERNS — push back if Gamma/AI does these

If the AI generates any of the following, reject and re-prompt:

| Anti-pattern | Push-back prompt |
|---|---|
| Stock photos of "businesspeople in offices" / "shaking hands" / "city skylines" | *"Remove all stock photography. Replace with hand-built SVG diagrams or solid-color cards. The only photo in this deck is a real Rolex Submariner on Slide 1."* |
| Generic "feature" icons (lightbulb, gear, rocket, shield) | *"Remove decorative icons. Use only typography + tables + diagrams. No icons except the small dot before slide-number labels."* |
| Bullet-point soup with no hierarchy | *"Restructure as a comparison table or two-column grid. Bullets only inside cards, not as the whole slide."* |
| Bright purple / blue / orange palette | *"Change to ink-on-paper editorial palette: #0A0A0B (near-black), #FAFAF7 (warm off-white), #0E7C7B (deep teal accent only)."* |
| Sans-serif headlines (looks like SaaS landing) | *"Change headlines to a serif font (Editorial New, Tiempos, or Georgia fallback). Body stays sans."* |
| 3D charts / pie charts / decorative gradients | *"Replace with 2D bar charts or hairline-divided tables. No gradients. No 3D."* |
| AI-generated abstract images / "blockchain visualization art" | *"Remove. The visual story is told by tables and diagrams, not aesthetic backdrops."* |
| Crammed text with <16px body | *"Reduce content density. Body minimum 18px. Editorial whitespace required between sections."* |
| "Disrupting", "revolutionizing", "the future of" filler | *"Remove all promotional language. Stick to the exact slide text I provided. No additions."* |
| Auto-translated / paraphrased headlines | *"Use the exact headlines I provided word-for-word. Do not improve them."* |

---

## POST-GENERATION CHECKLIST

After Gamma/AI produces the deck, verify each slide hits these:

- [ ] Slide 1 — Three-tier rate stack (450 / 60 / 30) with Caixa scrap-metal note
- [ ] Slide 2 — All 10 modules visible with GLOBAL/LOCAL tags · Anchor band centered
- [ ] Slide 3 — 5 gates flow horizontal · "atomically, in the same transaction" callout
- [ ] Slide 4 — 4-row comparison table with Vaulx in teal · 3-bucket cost panel · summary strip
- [ ] Slide 5 — LP tranche table (8% senior · 12% junior · 5% POL) visible
- [ ] Slide 6 — Vaulx row in teal background with strikethrough on Caixa · "Unoccupied vertex" 4-col callout
- [ ] Slide 7 — 3 primitive cards top + 4 institutional adoption cards bottom · WU "NEW" badge
- [ ] Slide 8 — 5 founder cards · Marcelo bio mentions Gitel + electronic-security (NOT physical security) + IoT/NOC · NO "60 corporate bank clients" claim
- [ ] Slide 9 — $250K big number · Q3/Q4 milestones explicit · "Come build with us" CTA

---

## FILES THIS REFERENCES

- `Vaulx_Pitch_Voiceover.md` — v9 voice-over for Loom recording (mirrors slide narrative)
- `Vaulx_Pitch_Clean.md` — slide content in plain markdown (alternative paste source)
- `PITCH_SCRIPT.md` — full design spec (more detail than needed for AI tools, but useful for manual refinement)

If Gamma/AI output diverges from these files, **the .md files are source of truth**.
