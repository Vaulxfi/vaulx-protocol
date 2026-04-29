# Vaulx — Pitch Deck Script

**Two outputs in this document:**

1. **The 2-minute Colosseum submission pitch video** (script + on-camera direction) — hard deadline May 9
2. **The 10-slide investor deck** (slide-by-slide narrative for VC meetings) — hard deadline May 9

Both are in English. A Portuguese version of the 2-min pitch will be prepared as a secondary asset for BR conversations.

---

## PART 1 — The 2-Minute Pitch Video (Colosseum Submission)

**Format:** George on camera. Clean background. Single continuous cut if possible; one clean b-roll insert allowed for the on-chain demo flash.
**Delivery:** Direct, confident, no jargon in the first 20 seconds. No corporate voice. Speak like an operator explaining what you built to another operator.
**Runtime target:** 1:55–2:05. If you go over 2:10 you're cutting.
**Tool:** Record at 1080p, good mic, natural light. Not a screen-record style — this is the founder's video.

---

### [0:00–0:15] Hook — the hard fact nobody in crypto is solving

> "A Rolex Submariner worth fifty thousand reais. Walk into TradFi (state bank) in Brazil, the country's only legal pawnbroker, and they'll lend you eight thousand. That's thirteen percent of what the watch is worth.

> Forty million Brazilians are in this position — asset-rich, credit-excluded, and ignored by every DeFi protocol shipped to date.

> We're Vaulx. We fix this."

*[Visual: George direct to camera. Hold eye contact. No graphics yet.]*

---

### [0:15–0:35] What Vaulx does — in one sentence then one demo

> "Vaulx is the first Solana protocol that lends stablecoins against physical luxury assets held in real-world custody.

> Here's how it works: a borrower brings a watch to our custodian in São Paulo. Three independent appraisals — remote, in-person, and a live market anchor — set the value. A Token Representing Credit Rights is minted on Solana. A regulated Brazilian SCD issues the loan. And here's the part that makes this different —"

*[Visual: cut to 5-second b-roll of the Devnet demo. Show the Solana Explorer transaction where `disburse_ccb` fails before custody is confirmed, then succeeds after. No voiceover on the b-roll — let the code speak.]*

> "— the loan money cannot leave the vault until custody is confirmed on-chain. Every RWA protocol promises this. Vaulx enforces it in smart contract logic."

---

### [0:35–0:55] Why this, why now, why us

> "Three things have just lined up.

> One — Solana's compressed NFTs make custody proofs cost less than a cent per transaction. This wasn't economically viable on any chain until 2026.

> Two — Brazil's BRL stablecoin infrastructure matured this year. Crown just raised thirteen and a half million from Paradigm. The rails are here.

> Three — and this is the one you can't replicate — our COO, Marcelo Coelho, runs a national security operation in Brazil. The custody infrastructure we need already exists at scale. A VC-funded competitor would take two years to build it. We start with it."

*[Visual: George to camera. One bottom-third graphic sliding through: "Solana RWA · BRL stablecoin · National custody network" as three visual bullets.]*

---

### [0:55–1:20] The product economics

> "Borrower gets fifty to sixty percent LTV — two to three times what TradFi offers — at eighteen to twenty-four percent APR, in twenty-four to seventy-two hours. Brazil's unsecured credit market runs at forty to a hundred and fifty percent. We're not marginally cheaper. We're a different category.

> On our side: a two to three percent origination fee, an eight to twelve percent net interest spread, and a five percent liquidation fee on defaults. Break-even at eight hundred active loans with sixty percent renewal — the pawn industry's historical baseline is eighty-five.

> This is a real credit product built on on-chain rails. Not a crypto experiment."

*[Visual: a clean single-column infographic fading in the key numbers: LTV 50–60% · APR 18–24% · Break-even 800 CCBs · Renewal 60%. No animation noise.]*

---

### [1:20–1:40] The team — the structural argument

> "Five of us. Each covers exactly one axis nobody else could.

> Marcelo runs the security business that becomes our custody network. Rodrigo runs operational execution inside it. Felipe runs a crypto rails company in the US that processes the majority of São Paulo's luxury watch transaction flow today — and opens the door to US capital. Edson is a senior Solana developer owning the Anchor code end to end. And I — George — spent fifteen years inside European banking structuring credit products that look exactly like this one.

> We didn't assemble this team to fit a pitch. We assembled this pitch around the team."

*[Visual: five headshots, simple grid, name + one-line role under each. Hold for 8 seconds. No glitz.]*

---

### [1:40–2:00] The ask and the close

> "We're submitting to Colosseum with a working Devnet deployment — not slides. Full loan cycle, mint to repay, custody gate enforced in code, test suite green.

> The prize gets us to the next milestone. But the real ask is the accelerator path — because Vaulx is a protocol you build in public, with partners, over three years. We've already briefed the CEO of Mercado do Bitcoin, Brazil's twenty-five million user exchange. He likes it.

> Physical-collateral DeFi has been waiting for the right team and the right moment. This is both.

> Vaulx. Real world. Real custody. Real credit. On Solana."

*[Visual: final logo + tagline + domain (app.vaulx.fi). Hold for 3 seconds. End.]*

---

### Notes for George on delivery

- **Pace.** The whole script is ~340 words. At 175 wpm (professional pace) that's 1:58. You can slow down slightly on the three technical moments (custody gate, the stablecoin infrastructure, the break-even math).
- **Where to emphasize.** "cannot leave the vault until custody is confirmed on-chain" — this is the product. Land it. "We didn't assemble this team to fit a pitch. We assembled this pitch around the team." — land this too.
- **What not to do.** No "we're excited to announce." No "disrupting." No "democratizing." No smile-at-end jingle tone. This is a credit operator speaking to credit operators and Solana engineers.
- **Felipe reviews before recording.** May 5 written review. May 8 he watches the first cut.

---

## PART 2 — The 10-Slide Investor Deck (Post-Submission VC Use)

**Format:** PDF + PPTX. 16:9. Clean, minimal. No stock photos.
**Target length:** 10 slides excluding cover and appendix.
**Use case:** VC meetings post-Colosseum. Also attached to cold outreach in EU and US.
**Principle:** Every slide answers one question. If a slide has more than one idea, split it.

---

### Slide 1 — COVER

**Visual:** Vaulx logo, tagline, one-liner, contact.

> **Vaulx**
> Real-world-custody lending on Solana
>
> The first protocol that lends stablecoins against physical luxury assets — with on-chain enforcement of physical custody.
>
> George — CEO · george@vaulx.fi · app.vaulx.fi
>
> *Colosseum Frontier Hackathon · Brazil-first · Solana-native · Q2 2026*

**What to say:** "Thanks for the time. I'll take you through ten slides. Stop me whenever."

---

### Slide 2 — THE PROBLEM

**Headline:** **40 million Brazilians are asset-rich and credit-excluded.**

**Body:**
- TradFi (state bank) — the only legal pawnbroker in Brazil — offers LTV of 13–30% on real market value. A R$50,000 Rolex gets an R$8,000 loan. The customer walks away angry.
- Unsecured bank credit: 40–150% APR. Informal lenders: higher still.
- Every DeFi lending protocol — Aave, Compound, Centrifuge, Goldfinch, Maple — requires crypto-native collateral. None accepts a watch.
- The gap is not a product gap. It's an operational one. Accepting a physical asset on-chain requires a custody network, an appraiser network, and a regulated lending counterparty.

**What to say:** "The category exists — it's just broken. Vaulx is the first protocol built for this specific wedge: asset-rich borrowers owning watches, jewelry, art, or vehicles worth R$24,000 or more, who can't access fair credit anywhere today."

---

### Slide 3 — THE PRODUCT

**Headline:** **Custody-gated on-chain lending. One invariant. Enforced in code.**

**Visual:** A simple 5-step flow diagram.

1. Asset intake → triangular appraisal (remote + in-person + market anchor)
2. TRDC minted on Solana (compressed NFT, Metaplex Bubblegum)
3. Partner SCD signs CCB with fiduciary alienation under Brazilian law
4. **Custody confirmed on-chain** → *only now* does the Vault Program release USDC
5. Repay → asset returned. Default → SCD executes fiduciary alienation, proceeds settle the loan.

**Call-out box:** *"The single line in smart contract logic that makes this different: `disburse_ccb` fails unless `trdc.status == ACTIVE`, and only a signed `confirm_custody` transaction from the authorized custodian can flip that status. If the line disappears, the product doesn't exist. That's why it's enforced in code, not in a process document."*

**What to say:** "Everything before step 4 is normal RWA lending. Step 4 is the product. This is the difference between 'RWA washing' and actual real-world-custody DeFi."

---

### Slide 4 — WHY NOW

**Headline:** **Four inflection points have just converged.**

1. **Solana RWA infrastructure is mature.** cNFTs via Bubblegum cost < $0.001 per mint. 400ms finality. This wasn't economically possible on Ethereum at scale.
2. **BRL stablecoin market just matured.** Crown (BRLV) raised $13.5M from Paradigm. BRZ on Solana drove the tripling of non-USD stablecoin usage. First BRL credit market on Solana went live March 2026.
3. **Brazil's SCD regulatory window is open.** BACEN Res. 4.656/2018 lets us partner with a licensed lender without building a bank. Window stable but closing as institutions enter.
4. **TradFi is converging on RWA.** BCG projects $9.4T tokenized RWA by 2030. Goldman, BNY, UBS live. The "is this real" question is over.

**What to say:** "This is why 2026 is the right year — not 2022, not 2028. The custody-on-chain mechanic needed all four of these to hold at once."

---

### Slide 5 — THE TEAM

**Headline:** **Five founders. Five axes. Zero overlap.**

**Visual:** 5-column table.

| Marcelo Coelho | Rodrigo Coelho | George | Felipe | Edson |
|---|---|---|---|---|
| COO | Head of Ops BR | CEO | Strategic Advisor | Lead Developer |
| CEO of Gitel — national security operation, Federal Police-regulated, existing bank-custody relationships | Operational execution inside Gitel; same institutional network at execution depth | 15 years European banking; Italian + CEE banking environments; Bocconi-tier finance education; crypto/Web3 operator | Brazilian, US-based. Crypto rails founder; processes a large share of São Paulo's luxury watch flow. Solana + US VC relationships | Senior Solana developer. Anchor + Metaplex Bubblegum + compressed NFT + PDA custody patterns |
| Custody infrastructure | Operational execution | Credit engineering + fundraising | US capital + Solana ecosystem | Technical execution |

**Bottom of slide:** *"This team can't be assembled out of a Twitter DM. The specific stack — operating custody business + BR ops depth + European bank credentials + US crypto rails + Solana engineer — is what makes the moat defensible."*

**What to say:** "Colosseum judges look at founder-market fit first. This isn't assembled to fit a pitch. It's the only configuration of humans that could run this protocol."

---

### Slide 6 — BUSINESS MODEL & UNIT ECONOMICS

**Headline:** **Three revenue streams. Break-even at 800 active loans. Real unit economics.**

**Body — left column (per-loan economics):**

| Metric | Cycle 1 | Cycle 2+ (renewal) |
|---|---|---|
| Avg ticket | R$20,000 | R$20,000 |
| Variable cost | R$1,728 | R$1,063 |
| Gross margin | ~17% | ~26% |
| 1-yr CLV | R$2,865 (1 new + 3 renewals) | — |
| CLV/CAC | >5x target | — |

**Body — right column (revenue streams):**

- Origination fee: 2–3% of principal
- Interest spread: 8–12% p.a. net
- Liquidation fee: 5% (default only)

**Call-out:** *Renewal rate is the #1 KPI. NPA pawn industry baseline: 85%. Vaulx models 60% conservatively. Each renewal adds R$665 of margin with zero new appraisal cost.*

**What to say:** "Break-even at 800 active loans at R$20K average with 60% renewal. Brazil's addressable pool is 800,000+ potential borrowers. We need one-thousandth of 1% of that to reach break-even. This is not a market-creation play — it's a distribution-execution play in a market that's already starved."

---

### Slide 7 — THE MOAT

**Headline:** **Four layers. 18-month build lead.**

1. **Custody network.** We start with Gitel. A competitor would need 18–24 months to replicate it. Most cannot.
2. **SCD partnership.** Multi-month negotiation. Once inked, it's a de facto exclusivity channel in physical-collateral on-chain lending in Brazil.
3. **Appraiser network + triangular model.** Certified remote + in-person + live market anchor. Built as relationships, not APIs.
4. **On-chain reputation dataset (Phase 2+).** Every loan builds a global-first dataset on luxury-asset credit behavior in LatAm. Monetizable as Asset Scoring API.

**Why TradFi doesn't do this:** 56-year monopoly. No pressure to innovate. Cannot deploy on-chain rails inside their risk framework in under 5 years. Also cannot accept art.

**Why a well-funded startup doesn't do this:** Can clone the code in 3 months. Cannot clone the custody operator in 18 months.

---

### Slide 8 — TRACTION & ROADMAP

**Headline:** **Devnet working now. Mainnet Q3 2026. Brazil validation Q1 2027. LatAm Q2 2027. US late 2027.**

**Body — Traction to date:**
- Technical Spec V3.1 locked (TRDC + Partner SCD + triangular appraisal)
- Full Devnet deployment + working demo: lenders deposit, loan request, custody confirmed, disbursement, repayment, tests green
- Mercado do Bitcoin (25M user BR crypto exchange) CEO briefed and positive
- Partner SCD pipeline: conversations in progress
- Pawn-operator partner (Fidix-class) conversation in progress
- Rebrand + domain + social live

**Body — Roadmap:**

| Phase | Exit criterion |
|---|---|
| Hackathon MVP (Q2 2026) | Colosseum submission with working code |
| Pre-seed (Jun–Aug 2026) | Legal opinion; SCD signed; audit scoped |
| Seed / Mainnet Beta (Sep–Nov 2026) | Audit clean; 20–50 CCBs/month in SP |
| BR validation (Dec 26 – Jun 27) | 400+ CCBs; NPS >80; renewal >60% |
| LatAm (2027) | 3–5 countries, asset-light playbook |
| US (late 2027) | Miami + NYC; pawnbroker licenses FL/NY |

**What to say:** "Every phase de-risks one specific question. Pre-seed de-risks 'can this run legally in Brazil.' Seed de-risks 'does the model work at unit economics.' BR validation de-risks 'is this Brazil-only or global.' Nothing is hand-waved."

---

### Slide 9 — THE ASK

**Headline:** **$500K–$1M pre-seed on a SAFE. Colosseum as validation, not ceiling.**

**Body:**

**Pre-seed use of funds:**
- Smart contract audit: $30K–80K (tier-1 Solana firm)
- Legal & entity (BR + US/Cayman holding): $50K–100K
- SCD partnership setup: $30K–60K
- Custodian & appraiser network (SP): $40K–80K
- Team runway (9–12 months): $250K–450K
- First marketing: $40K–80K
- Reserve: $60K–150K

**What you get:**
- Lead investor: board observer seat, pro-rata, information rights
- Dual investor pipelines: EU (George) + US (Felipe, including Paradigm-network and Mercado do Bitcoin-adjacent capital)

**What comes next:**
- $1.5M–$3M seed post-BR-validation (Q4 2026–Q1 2027)
- Target post-money: comparable to recent RWA/DeFi rounds ($10M–$40M)

**What to say:** "Colosseum is the validation event. It's not the funding that gets us to mainnet. For that we need a pre-seed now, and we're running two parallel channels — EU via my own network and Felipe in the US. The hackathon submission goes live May 10; this deck goes to warm contacts the same week."

---

### Slide 10 — CLOSE

**Headline:** **Real world. Real custody. Real credit. On Solana.**

**Body:**
- The product: the first Solana protocol with enforced on-chain physical custody for movable luxury assets.
- The team: the only configuration of founders who can actually run this — operator, credit engineer, crypto rails, Solana dev, BR on-ground.
- The market: 40 million underserved borrowers in Brazil alone. Multi-billion-reais addressable flow. Break-even at 800 loans.
- The moment: Solana cNFTs + mature BRL stablecoins + open BR SCD regulatory window. This exact combination is new this year.

**Contact:**
- George — CEO — george@vaulx.fi
- Demo video: app.vaulx.fi/demo (or YouTube link TBD)
- Repo: github.com/Vaulxfi
- Colosseum submission: submitted May 10, 2026

**What to say:** "That's Vaulx. Happy to go deeper on any of these. What's the part that matters most to you?"

---

### Appendix slides (optional, for Q&A)

- **A1 — Risk matrix (all 12 risks + mitigations)**
- **A2 — BRL stablecoin decision framework**
- **A3 — Token strategy (Phase 2+ utility options + CVM risk)**
- **A4 — Legal framework (SCD, CCB/AF, VASP, LGPD)**
- **A5 — Competitive landscape deep dive**
- **A6 — Unit economics scenarios (conservative/base/optimistic)**
- **A7 — LatAm expansion economics**
- **A8 — Layer 2 revenue streams (VaaS, Asset Scoring, Float yield, etc.)**

---

## Delivery & Recording Plan

| Date | Task | Owner |
|---|---|---|
| May 3 | Felipe reviews 2-min pitch script — written feedback | Felipe |
| May 4 | Script locked | George |
| May 5 | 10-slide deck v1 drafted (PPTX + PDF) | George |
| May 7 | Demo video b-roll recorded (Edson screen, narrated by George) | Edson + George |
| May 8 | 2-min pitch video recorded | George |
| May 8 | Felipe reviews first cut | Felipe |
| May 9 | Final edits; export at 1080p/MP4/H.264 | George |
| May 9 | Deck v1 final (PPTX + PDF) | George |
| May 10 | Submit to Colosseum with pitch video + full materials | George |

---

*Last updated: Apr 21, 2026. Brand: Vaulx (rebrand confirmed per PRD v1.1 Delta Log, Apr 21).*
