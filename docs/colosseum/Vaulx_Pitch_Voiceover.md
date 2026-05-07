# Vaulx — Pitch Video Voice-over (Recording-Ready · v9 final)

**Target length:** ~2:55 (hard cap 3:00)
**Speaker:** George Dimitrov (CEO/CTO)
**Word count:** ~448 words
**Pacing:** ~150 wpm with deliberate pauses on numbers, the atomic invariant, and the "Until now" beat
**Submission:** Colosseum Cypherpunk Hackathon 2026, deadline May 10, 2026

---

## Director's notes (read once before recording)

- **No traditional intro.** Open cold on Marco. Drop "Until now" + Vaulx logo only AFTER the cold open lands.
- **Pause discipline.** Hold ~0.4s after every number. Hold the full 2.5s on the "Until now" pause before slide 2.
- **Three mic-drop moments:**
  1. *"Until now."* (Slide 1 close) → drop volume, hold 2.5s
  2. *"Atomically, in the same transaction. No competitor has shipped this on-chain."* (Slide 3) → slow down, enunciate
  3. *"Anyone can fork a smart contract. You cannot fork our team."* (Slide 8 open) → measured, paced, ~0.5s gap between sentences
- **Trust the cuts.** Don't say "now let's look at the architecture" — just change the slide while you talk.
- **Vocal range.** Frustrated on "scrap metal" callback. Confident on "killer invariant." Calm on the ask.
- **Persona vs team member**: "Marco" is the persona on Slide 1; "Marcelo" is the COO on Slide 8. Two different names — say each clearly.

---

## SLIDE 1 — The Asymmetry (0:00 – 0:38) — ~38s

**Visual:**
Split screen. **Left:** Rolex Submariner photo. Caption: *Market value: $14,000.*
**Right:** Three-tier rate stack:
- *Rotativo* (credit-card revolving) · **~400% APR** *(penalty)*
- Consumer loan · **~60% APR** *(standard)*
- Caixa *penhor* · **~30% APR @ 20% LTV** *(cheapest formal · scrap-metal valuation)*

Two small mono footnotes:
- *Caixa is the only Brazilian institution legally authorized for penhor.*
- *Rotativo applies to credit-card balances carried past the 30-day grace period — the rate that hits the ~50M Brazilians who revolve credit-card debt.*

**Voice-over:**
> Meet Marco in São Paulo. He owns a fourteen-thousand-dollar Rolex, but his options for short-term liquidity are predatory. The official pawn monopoly lends twenty percent LTV at thirty percent APR. Consumer loans start at sixty percent. Credit-card revolving balances hit four hundred percent.
>
> Meanwhile, physical-asset-rich individuals cannot access the cheap global liquidity sitting idle on-chain at eight percent. Vaulx Protocol built the rail to connect them.
>
> **Until now.**

**[Hold black for 2.5 seconds. Then Vaulx wordmark appears in white with the italic 'l' in teal. Tagline: "The on-chain credit protocol."]**

**Recording notes for Slide 1:**
- Three-tier rate cadence: 30% → 60% → 400%. Each spoken as a beat with ~0.3s pause between. Don't rush.
- "scrap metal" implication is built into "twenty percent LTV at thirty percent APR" — sound mildly frustrated, but save the explicit "scrap metal" for the Slide 4 callback.
- "Until now" — drop volume, hold the pause **for the full 2.5 seconds**. Have confidence. Don't fill silence.

---

## SLIDE 2 — Protocol Architecture (0:38 – 1:08) — ~30s

**Visual:**
Architecture diagram: Appraiser → Custodian → cNFT → Solana. Sub-layer: licensed independent partners (Sumsub · Sekuro · Lloyd's · Kamino V2 · Loopscale).

**Voice-over:**
> I'm George, ex-banker. This is Vaulx.
>
> We orchestrate off-chain complexity through licensed independent partners. A trilateral blinded appraisal ensures fair value. That data is minted into a cNFT on Solana, embedding the appraisal, independent custody, insurance, and direct redemption rights — enforceable as a bearer instrument.
>
> Counterparty risks are removed by an institutional-grade legal structure.

**Recording notes for Slide 2:**
- "I'm George, ex-banker." — neutral, factual. Two words establish domain authority.
- "Trilateral blinded appraisal" — slow slightly; it's a technical term most judges won't have heard.
- "Bearer instrument" — emphasize. This is the legal positioning that makes the cNFT-as-redemption-right credible.

---

## SLIDE 3 — The Atomic Gate (1:08 – 1:34) — ~26s

**Visual:**
Highlight the 5 gates: Appraisal → Custody → cNFT mint → Borrow → Repay/Default. Smart-contract invariant flagged on the Custody → Borrow transition.

**Voice-over:**
> Our atomic contract enforces five strict gates. The killer invariant: **no USDC is disbursed until the licensed custodian physically vaults the asset and signs on-chain — atomically, in the same transaction.**
>
> No competitor has shipped this on-chain.
>
> Default is managed purely at the smart-contract level via event-triggered auctions.

**Recording notes for Slide 3:**
- "killer invariant" — slight emphasis, but don't oversell.
- **"atomically, in the same transaction"** — slow down 30%. Enunciate every syllable. Mic-drop #2.
- "No competitor has shipped this on-chain." — declarative. ~0.4s pause before next sentence.

---

## SLIDE 4 — Unit Economics (1:34 – 1:55) — ~21s

**Visual:**
Comparison table: 50% LTV at 24% APR (Vaulx) vs 20% LTV at 30% APR (Caixa scrap-metal). 4-row matrix on $14k Rolex showing $7,000 Vaulx vs $2,800 Caixa borrowing capacity.

**Voice-over:**
> The economics beat the market. We offer borrowers fifty percent LTV at twenty-four percent APR. We beat the cheapest formal credit, provide two-and-a-half times the capital, and value the watch as a watch — not scrap metal.

**Recording notes for Slide 4:**
- "Two-and-a-half times the capital" — emphasize. This is the LTV claim.
- **"value the watch as a watch — not scrap metal"** — half-smile. Earned callback to Slide 1's pawn-monopoly line. Hold ~0.6s before clicking to Slide 5.

---

## SLIDE 5 — LP Tranches & Risk (1:55 – 2:14) — ~19s

**Visual:**
Tranche table: Senior 8% APR (75% of capital), Junior 12% APR (25%), Vaulx POL 5% first-loss buffer below. Loss-waterfall arrow: borrower equity → POL → junior → senior.

**Voice-over:**
> LPs are tranched to match risk. Senior LPs earn eight percent fixed, while Junior LPs earn twelve percent — sitting above our five percent protocol-owned first-loss buffer.

**Recording notes for Slide 5:**
- "Eight percent" / "twelve percent" / "five percent" — clean cadence. Each spoken with ~0.2s separation.
- Don't editorialize ("which is great" / "really attractive"). Numbers carry it.

---

## SLIDE 6 — Competitive Landscape (2:14 – 2:30) — ~16s

**Visual:**
Comp matrix highlighting Vaulx's row in teal: Solana · independent licensed custody · LATAM-first · composable. Other rows: Kettle (Blast L2 · US), 4K (ETH/Polygon · global), Tangible (Polygon · USDR collapsed).

**Voice-over:**
> Competitors exist on Ethereum or Polygon, but none have Solana's economics, a composable architecture, or a LATAM-first focus where credit costs are highest.

**Recording notes for Slide 6:**
- Tight slide. Don't add filler.
- "LATAM-first focus where credit costs are highest" — close on this beat. ~0.4s pause before Slide 7.

---

## SLIDE 7 — Why Now & Distribution (2:30 – 3:00) — ~30s

**Visual:**
Logos for Western Union (USDPT), Kamino V2, Loopscale, Sumsub. Bottom strip: "Solana RWA TVL · $1.82B · March 2026 · +90% MoM."

**Voice-over:**
> Why now? Solana RWA TVL crossed one-point-eight billion dollars in March, and Western Union launched their dollar stablecoin on Solana this month. The institutional rails are here.
>
> Off-chain, our founders drive low CAC. On-chain, we tap directly into Kamino and Loopscale for USDC liquidity.
>
> We bring the borrowers; Solana brings the capital.

**Recording notes for Slide 7:**
- "One-point-eight billion dollars" / "this month" — emphasize both numbers. Western Union timing is the freshest data point in the deck.
- **"We bring the borrowers; Solana brings the capital."** — short, declarative, ~0.4s pause between halves. Sharpest line in the slide.

---

## SLIDE 8 — Team (3:00 – 3:28) — ~28s

**Visual:**
Five founders with credentials below each portrait. Bottom band: "Anyone can fork a smart contract. You cannot fork our team."

**Voice-over:**
> Anyone can fork a smart contract. You cannot fork our team.
>
> I bring fifteen years of global banking.
>
> Marcelo runs Gitel — thirty-eight years building Brazilian electronic-security infrastructure, including IoT and NOC operations. **That is the exact tech stack powering our atomic custody invariant.**
>
> Rodrigo leads LATAM BD. Felipe — founder of four-p-finance — already processes São Paulo's luxury-watch flow on crypto rails. Edson shipped four Anchor programs in eighteen days.

**Recording notes for Slide 8:**
- **"Anyone can fork a smart contract. You cannot fork our team."** — measured. ~0.5s gap between sentences. Mic-drop #3.
- "I bring fifteen years of global banking." — first time George identifies his domain on this slide (already opened on Slide 2). Confident, not boastful.
- "Marcelo runs Gitel" — clearly enunciate the company name.
- Names cadence: Rodrigo / Felipe / Edson — list pace, ~0.2s between each.

---

## SLIDE 9 — Ask & Roadmap (3:28 – 3:55) — ~27s

**Visual:**
Three-cell layout: $250K (ask) · Q3 2026 → 50 loans · Q4 2026 → 100 loans. Footer: github.com/Vaulxfi · vaulx.vercel.app · "Come build with us."

**Voice-over:**
> Today, four Anchor programs are live on Devnet with **forty-five-plus tests passing**.
>
> We're asking for the Colosseum prize to audit our contracts, sign our first custodian, originate **fifty mainnet loans by Q3 — one hundred by Q4** — and bridge to our seed round.
>
> We are Vaulx. Come build with us.

**Recording notes for Slide 9:**
- "Forty-five-plus tests passing" — concrete. Not "lots of." Numbers make it real.
- **"Fifty mainnet loans by Q3 — one hundred by Q4"** — emphasize. These are concrete commitments, not vague mainnet aspirations.
- "Come build with us." — final beat. Hold for ~1.5s on the closing card before fade.

---

## Final timing — v9 (~448 words)

| Slide | Words | Time @ 152 wpm |
|---|---|---|
| 1 — The Asymmetry | 92 | 38s (incl. 2.5s "Until now" pause) |
| 2 — Protocol Architecture | 55 | 30s |
| 3 — The Atomic Gate | 47 | 26s |
| 4 — Unit Economics | 34 | 21s |
| 5 — LP Tranches & Risk | 27 | 19s |
| 6 — Competitive Landscape | 22 | 16s |
| 7 — Why Now & Distribution | 60 | 30s |
| 8 — Team | 70 | 28s |
| 9 — Ask & Roadmap | 41 | 27s |
| **Total** | **448** | **~3:00** |

**If you run hot during recording, cuts in priority order:**
1. Drop "ex-banker" from Slide 2 → save ~1s
2. Drop "Default is managed purely at the smart-contract level via event-triggered auctions" from Slide 3 → save ~3s (the atomic-invariant line carries the slide)
3. Drop "Off-chain, our founders drive low CAC" from Slide 7 → save ~3s

---

## Pre-recording verification checklist

- [ ] GitHub repo `Vaulxfi/*` set to public
- [ ] Run `pnpm anchor:test` — confirm exact passing count (update "forty-five-plus" if higher)
- [ ] Verify Western Union USDPT launch date (May 2026) still accurate at recording time
- [ ] Confirm Sekuro is OK to be named publicly
- [ ] Confirm Gitel + 4p.finance OK with being named
- [ ] Practice run x3 with stopwatch — must land ≤2:58
- [ ] Record audio in separate track from visuals for clean editing
- [ ] Final cut: review for any "um" / "uh" / nervous filler — pitch judges score on polish

---

## What's NOT in this voice-over (intentional cuts)

These belong on slides for visual impact and judge-screenshot value, but **not** in voice-over:

- $90B / $20B / $1–3B addressable market funnel (visual on Slide 7 if applicable)
- Full LTV tier table by asset class
- 14-day Dutch auction tier timeline
- Loss waterfall details
- Per-loan fee schedule
- 6-channel distribution breakdown

The slides carry these. The voice carries the narrative + invariant + economics + tranches + moat + ask.
