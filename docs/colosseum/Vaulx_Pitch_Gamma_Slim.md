# Vaulx Pitch — Slim Gamma Input

**Use this when**: Gamma rendered the dense version as 2-page slides. This version is rule-bound to fit ONE slide per slide.

**The rule**: max 35 words of body content per slide. Voice-over carries the substance — slides are *visual punctuation*, not text dumps.

---

## How to use with Gamma

1. **gamma.app** → **Create new** → **Generate** → **Paste in text**.
2. Paste this entire file.
3. **Settings before generating**:
   - Format: **Presentation**
   - Aspect: **16:9**
   - Density: **CONCISE** (not Detailed)
   - Tone: **Direct**
   - Number of cards: **9** (force exactly 9, no auto-expansion)
4. After generation, if any slide spills to 2 pages: click that slide → **Edit with AI** → paste *"Compress this slide to fit one page. Maximum 5 visual elements. No paragraphs."*

---

## MASTER PROMPT (paste first)

```
Generate a 9-slide investor pitch deck for VAULX, an on-chain credit protocol on
Solana that connects asset-rich Brazilians to global liquidity using physical
luxury collateral.

ABSOLUTE RULES:
- Exactly 9 slides. Do not add. Do not split. Do not collapse.
- Each slide fits on ONE page (1920×1080). Maximum 5 visual elements.
- Maximum 35 words of body text per slide.
- 16:9 aspect, dark editorial palette: black background OR warm off-white,
  teal accent (#0E7C7B), no other colors.
- NO stock photos. NO decorative icons. NO 3D. NO gradients.
- Headlines in serif. Body in sans-serif. Numbers in monospace.
- Tables are minimal — max 4 rows, 4 columns.
- Voice-over carries the story. Slides are visual punctuation only.

If a slide would spill to 2 pages, drop bullets — do not split.
```

---

## SLIDE-BY-SLIDE CONTENT (paste after master prompt)

---

### Slide 1 — The Asymmetry

**Headline:** Asset-rich. Credit-trapped. No rail.

**Visual:** Split screen. Left: Rolex Submariner photo. Right: rate ladder.

**3 rate rows (right side):**
- Credit-card rotativo · ~400% APR
- Consumer loan · ~60% APR
- Caixa pawn · 30% APR @ 20% LTV (scrap-metal value)

**Closing line:** Onchain USDC sits idle at 8% APR.

---

### Slide 2 — Protocol Architecture

**Headline:** Modular. Atomic. Composable.

**Visual:** Three-row diagram — Off-chain · Anchor band · On-chain.

**5 labels around the Anchor band:** vault · loan · trdc · auction · 5 atomic gates

**Closing line:** 8 of 10 modules ship globally. Only custody swaps per market.

---

### Slide 3 — The Atomic Gate

**Headline:** Five gates. One signature. No middleman.

**Visual:** Horizontal flow — Appraisal → Custody → cNFT → Borrow → Repay/Default

**Hero callout (full-width box):** No USDC disburses until the licensed custodian signs custody-confirmation — atomically, in the same transaction.

**Footer:** No competitor has shipped this on-chain.

---

### Slide 4 — Unit Economics

**Headline:** Cheaper than Brazil's cheapest formal credit.

**Hero comparison (2 columns):**
- **Vaulx**: 24% APR · 50% LTV · $7,000 borrowable
- **Caixa pawn**: 30% APR · 20% LTV · $2,800 borrowable

**Bottom strip:** 2× more capital. 6 pp lower rate. 19× cheaper than rotativo.

---

### Slide 5 — LP Tranches

**Headline:** Two tranches. Real risk pricing.

**3-row table:**
- **Senior** · 8% APR fixed · 75% of capital
- **Junior** · 12% APR fixed · 25% of capital
- **Vaulx POL** · 5% protocol-owned first-loss · absorbs first hit

**Footer:** Senior beats Maple syrupUSDC by 100bps.

---

### Slide 6 — Competitive Landscape

**Headline:** We're not first. We're built for a different market.

**4-row comparison table:**
- Kettle · ETH L2 · US-first
- 4K · Ethereum · global
- Arcade · Ethereum · digital NFTs
- **Vaulx · Solana · LATAM-first · physical luxury**

**Footer:** The unoccupied vertex: Solana economics + LATAM-first + composable.

---

### Slide 7 — Why Now

**Headline:** None of this stack existed 18 months ago.

**4 signals:**
- $1.82B Solana RWA TVL · March 2026 · +90% MoM
- Western Union USDPT · launched May 2026
- Visa · Stripe · PayPal · Fiserv · production stablecoin workflows
- BlackRock BUIDL · Franklin FOBXX · live on Solana

**Closing line:** We bring the borrowers. Solana brings the capital.

---

### Slide 8 — Team

**Headline:** Anyone can fork a smart contract. You cannot fork our team.

**5 team rows (name · role · one-liner):**
- George · CEO/CTO · 15+ years global banking
- Marcelo · COO · runs Gitel — 38 years BR electronic-security infrastructure
- Rodrigo · Head BD · LATAM partnerships
- Edson · Senior Solana Engineer · 4 Anchor programs in 18 days
- Felipe · DeFi Advisor · CEO 4p.finance · São Paulo luxury watch flow

---

### Slide 9 — Ask & Roadmap

**Headline:** Vaulx. Built. Tested. Live on Devnet.

**3 panels:**
- **Traction**: 4 Anchor programs · 45+ tests passing · vaulx.vercel.app live
- **Ask**: $250K Colosseum prize → audit + first custodian + first loans
- **Milestones**: 50 mainnet loans by Q3 · 100 by Q4 · seed close

**Footer CTA:** Come build with us. · github.com/Vaulxfi

---

## PUSH-BACK PROMPTS (use if Gamma misbehaves)

| Problem | Paste this into "Edit with AI" |
|---|---|
| Slide became 2 pages | *"Compress to one page. Drop bullets. Maximum 5 visual elements."* |
| Generic stock photo appeared | *"Remove image. Replace with a clean number, table, or hairline-bordered box."* |
| Decorative icons added (gear, lightbulb, etc.) | *"Remove all icons. Use typography only."* |
| Bright purple/blue/orange palette | *"Change to dark editorial palette: near-black background, off-white text, single teal accent #0E7C7B."* |
| Bullet-point soup | *"Restructure as a 3- or 4-row table or comparison grid."* |
| Headline was rewritten | *"Restore the exact headline I provided. Do not paraphrase."* |
| "Disrupting / revolutionizing / future of" filler | *"Remove promotional language. Use only the words I provided."* |

---

## IF GAMMA STILL STRUGGLES

Some Gamma prompts produce dense output regardless of constraints. Fallback options:

1. **Generate slide-by-slide instead of all at once.** Paste only one slide block at a time. Gamma is more compliant on single-slide generation.
2. **Use Gamma "Cards" mode** instead of "Presentation" — simpler templates, less likely to over-decorate.
3. **Switch to a different tool**:
   - **Pitch.com** — better for investor decks specifically
   - **Beautiful.ai** — minimalist by default
   - **Manual Keynote/Google Slides** — paste each slide block, render manually with the suggested visual treatment. Takes 30 min, looks better than Gamma's auto-generation for any pitch deck judges will scrutinize.
4. **Use the v7 HTML directly** — open `Vaulx_Pitch_v7.html` in Chrome, F11 fullscreen, screen-record while reading voice-over. No deck tool needed. (Note: HTML may need v8.1/v9 content sync.)

---

## VERIFICATION CHECKLIST AFTER GENERATION

- [ ] Exactly 9 slides (no auto-expansion)
- [ ] Each slide is one page (no 2-page slides)
- [ ] No stock photos (only the Submariner on Slide 1, optional)
- [ ] No decorative icons
- [ ] Palette is near-black + off-white + single teal accent
- [ ] Slide 1 shows three rate tiers (rotativo / consumer loan / Caixa)
- [ ] Slide 4 shows Vaulx-vs-Caixa 2-column comparison
- [ ] Slide 5 shows tranche structure (8% senior / 12% junior / 5% POL)
- [ ] Slide 8 mentions Gitel + electronic-security (NOT physical security)
- [ ] Slide 8 does NOT mention "60 corporate bank clients"
- [ ] Slide 9 shows $250K + Q3/50 + Q4/100
