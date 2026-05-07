# Mercado Bitcoin meeting — top priorities

**Goal of the meeting**: walk out with a verbal "yes, let's pilot together" on **one** of the two below, and a named counterpart for follow-up. Anything else is bonus.

---

## Topic #1 (PRIMARY) — Brazilian regulated issuance partnership

**The ask**: Mercado Bitcoin acts as the **regulated Brazilian issuer/intermediary** for Vaulx-tokenized luxury assets, under MB's existing CVM-authorized framework (ICVM 88 crowdfunding / DLT issuance regime).

**Why this is #1**: This single deal solves Vaulx's biggest non-tech weakness — Brazilian regulatory standing — in one move. Without it, the cNFT-as-claim story is hand-waved. With it, you have a legitimate, name-brand issuer between the borrower and the protocol. It's the difference between "interesting hackathon project" and "fundable RWA infrastructure."

**Concrete shape we're proposing**:
- MB is the **issuance counterparty** in Brazil. Vaulx Brasil ltda originates and operates; MB legally issues the tokenized claim under its CVM license; Vaulx mints the corresponding cNFT on Solana.
- Custodian (Sekuro or equivalent) holds the physical asset; MB maintains the registered ownership records on the regulated side; the cNFT is the digital bearer instrument that mirrors the MB-registered claim.
- Joint AML/KYC: MB's existing KYC stack feeds Vaulx via SAS attestation token. No duplication.

**What we want from MB at this meeting**:
1. Confirmation they can / want to be the regulated Brazilian issuer
2. A named legal/product counterpart at MB to spec the structure with
3. A 60-day pilot agreement target — say, first 10 luxury watches issued under the joint framework
4. Their lawyer's read on whether this fits ICVM 88 or needs a different regime (CVM Resolution 175 funds, securities token, etc.)

**What we offer**:
- A **new RWA vertical** for MB — luxury physical, fundamentally differentiated from agribusiness receivables and real estate debt that everyone in BR already does
- **Solana-native deal flow**: MB is currently Polygon-heavy. We give them a credible Solana foothold without them having to build it
- **Branded co-issuance / white-label option**: "Powered by Mercado Bitcoin" appears on the cNFT metadata and the Vaulx UI. They get the brand exposure to a new HNW-leaning audience (luxury asset owners)
- **Revenue split** on origination + servicing fees from BR borrowers — propose 25/75 in MB's favor for the regulated pilot, scaling toward 50/50 at volume
- **Co-marketing** in BR around the launch: joint PR, joint event at the next Solana BR meetup or LatAm Crypto Summit

---

## Topic #2 (SECONDARY) — Pix on/off-ramp + retail LP distribution

**The ask**: integrate MB as the **default BRL on/off-ramp partner** inside the Vaulx app, and explore exposing the Vaulx-Watches USDC pool to MB's retail and institutional users as a yield product.

**Why this is #2 (not #1)**: it's important and unlocks the user experience, but it's a more transactional partnership — easier to negotiate, easier to replace if MB doesn't move. Lead with #1 because it requires more strategic alignment.

**Two sub-asks bundled here**:

**2a — Pix off-ramp for borrowers**
- Borrower draws USDC, clicks "Off-ramp to Pix" → MB receives USDC, settles BRL to borrower's Pix key in seconds
- This closes the loop for the entire Brazilian user journey
- MB earns the FX/spread on every loan disbursement

**2b — Vaulx-Watches as MB-listed yield product**
- MB's users (4M+) become a native LP pool — they buy a Vaulx-Watches USDC yield position through MB's interface, MB routes funds to the Loopscale curated vault on Solana
- Solves Vaulx's cold-start TVL problem
- Gives MB a **collateralized, insured 6–9% net yield product** that competes structurally better than the ag receivables they currently push (which carry significant default risk)

**What we want from MB at this meeting**:
1. A named contact for the on/off-ramp integration (probably API/product team)
2. Indicative pricing on the BRL/USDC swap leg
3. Read on whether they'd consider listing a Vaulx-curated yield position for their retail users

**What we offer**:
- Volume on the off-ramp side from every loan disbursed
- A differentiated, collateral-backed yield product to anchor against their existing ag/RE offerings
- First-mover positioning in BR for luxury RWA — likely a press story when launched

---

## What to AVOID offering / committing in the first meeting

- **Don't offer custody of the physical assets to MB.** Their custody license is for digital assets. Physical custody must stay with Sekuro / Brink's / Loomis. Don't conflate.
- **Don't agree to use Polygon "for parity"** — MB will probably probe this. Hold the line: Solana-native because of cNFT economics + composability with Loopscale/Kamino. Polygon is a parallel future option, not a launch surface.
- **Don't commit to a token swap or equity exchange.** Premature. Keep the conversation on revenue-share + pilot.
- **Don't promise exclusivity.** A non-exclusive pilot leaves room to negotiate from strength later.
- **Don't quote the $250k Colosseum prize.** This is a long-term commercial conversation, not a hackathon ask.

---

## Land mines to anticipate

| MB might say | Your response |
|---|---|
| "We already do RWA on Polygon" | "Right — and your ag/RE issuances stay there. We're proposing a *new vertical* (luxury physical) on Solana, where the cNFT economics make per-asset minting actually viable at retail scale. Polygon mints are 100× the cost." |
| "Why not let us issue our own luxury asset tokens?" | "You can — and we'd love to be your origination + custody-orchestration partner so you don't have to build the offline operational layer. We've spent 18 months on it. Marcelo runs Gitel — 38 years in BR security." |
| "What's your CVM stance?" | "We need a regulated BR counterparty — that's exactly why we're here. We're not trying to operate around CVM, we're trying to operate *with* it via the right partner." |
| "How big is your team?" | Lead with Marcelo + Gitel. The physical security + custodian operations are the unfakeable moat MB can't build. |
| "Can you do this without us?" | "Technically yes, but slower and with more regulatory friction in BR. With you: 90 days to first regulated issuance. Without you: 9 months to build the same standing." |

---

## Concrete asks to leave on the table

1. **Named counterpart for follow-up** within MB on each of the two topics (different people likely — issuance/legal vs product/integration)
2. **Pilot scoping call within 14 days** to spec the regulated structure
3. **NDA exchange** if they want to look at the Vaulx Anchor program / smart contract design
4. **Indicative term sheet** on a 60-day pilot for the first 10 watches, even if non-binding

---

## One-line framing for the meeting opener

> "We're building the rail between Brazil's asset-rich, credit-trapped consumers and global onchain capital — and we want Mercado Bitcoin to be the regulated Brazilian counterparty that makes it legitimate. We bring you a new luxury RWA vertical, the operational stack to run it, and Solana-native composability you don't currently have. Here's how we think it fits together."

Then go straight to topic #1.

---

## Pre-meeting prep checklist

- [ ] One-page deck mockup of the joint structure (MB issues / Vaulx mints / Sekuro custody / Loopscale lends) — Claude Designs can produce this in a day
- [ ] Pull MB's most recent RWA issuances (volumes, asset classes) so you can speak to where you fit
- [ ] Identify if anyone in your network knows someone at MB to warm-intro vs cold
- [ ] Bring a printed list of the 3 partners already aligned (Sekuro, Lloyd's broker, Loopscale) — even if soft — so you don't look like you're starting from zero
