# Vaulx — Pitch & Tech Demo Triage

**Date**: 2026-05-04 · revised after team direction confirmed
**Submission deadline**: 2026-05-10 (per `docs/STATUS.md`) — **6 days, not 7**
**Sources**: Colosseum official rubric (via Perplexity), `docs/STATUS.md` (Phase 3 baseline, 45+ anchor tests with Civic+Sumsub admin ixs landed since), `docs/PARTNERSHIPS.md`, codebase scan (4 Anchor programs, 15 anchor spec files + Playwright E2E suite, demo cockpit live)

> **Important — repo docs are partially stale.** `STATUS.md` and `PARTNERSHIPS.md` still reference an older BR-licensed-SCD direction (CCB / fiduciary alienation under Brazilian law). **Team has pivoted away from that.** Current direction:
> - Pure cNFT tokenization, global protocol — **no BR-licensed legal scaffolding**.
> - Legal framing in `PITCH_SCRIPT.md` (cNFT as bearer instrument, BVI-style offshore wrapper) is the correct one — **keep as is**.
> - Oracle: **Pyth and RedStone both** on slides, final choice still TBD.
> - Lending rail: **Kamino + Loopscale both** as partners.
> - Tests: **45 baseline + Civic admin ixs + Sumsub server-side helper since** — actual current count needs `anchor test` confirmation; static baseline captured at `/admin/tests` (`apps/web/public/demo/test-run.log`).

---

## A. What Colosseum actually scores

The 6 official judging criteria, in order of typical weight. **Every revision must improve at least one.**

| Criterion | Plain-English question | Where it has to land |
|---|---|---|
| Functionality | Does it work? Code quality? | Tech demo: live Solana Explorer, real txs, test count |
| Potential Impact | TAM size? Solana ecosystem benefit? | Pitch: market sizing, capital flows unlocked |
| Novelty | First protocol to do X? | Both: name the unique invariant explicitly |
| UX | Does it use Solana speed for real UX? | Pitch: end-to-end latency, frictionless onboarding |
| Open-source | Public repo + composability with other Solana primitives | **Pre-submission action: flip repo to public** |
| Business Plan | Viable startup, not a coding contest | Pitch: revenue, fees, scaling story |

---

## B. Pitch video — non-negotiable points

Max 3:00 hard cap. First filter — judges open the tech demo only if this lands.

1. **Hook (≤20s)**: one sentence — what + for whom + the one number that makes the problem real.
2. **The problem (~30s)**: who hurts, why it matters at scale, named incumbent failure (concrete, not abstract).
3. **The solution (~40s)**: in plain language, including **the one architectural invariant** that defines the protocol — say it exactly.
4. **Why now (~20s)**: 2–3 converging facts that make this possible *only now* (regulatory, technical, market). Each fact must be verifiable.
5. **Team (~30s)**: each member maps to one non-overlapping unfair advantage. No vague titles. No "10 years experience" — say what specific axis they own.
6. **Validation (~15s)**: any evidence of demand. User conversations, partner LOIs, paid pilots, even informal. Colosseum asks for this explicitly — don't skip.
7. **Vision + ask (~15s)**: where this goes post-hackathon + the prize ask if you're going for it.

**Hard disqualifiers**:
- Over 3:00 (penalized hard)
- Buzzwords without numbers ("DeFi", "Web3", "disrupting")
- Product walkthrough leaking into pitch (that's the demo's job)
- Vague team slide
- Flashy visuals with no substance

---

## C. Tech demo video — non-negotiable points

2–3 min. Judges are explicitly looking for **Solana integration reasoning**. **Never re-pitch.**

1. **Live on-chain proof (~30–45s)**: Solana Explorer, real Devnet program ID, real transactions in sequence. Show, don't tell.
2. **The architectural invariant (~30s)**: the one structural decision no competitor has shipped. Name competitors explicitly.
3. **Why Solana specifically (~20s)**: 2–3 features of Solana that make this build economically/technically possible. Not "fast cheap" — say why *for this use case*.
4. **Stack rundown (~30s)**: programs, frameworks, off-chain components, test count.
5. **Decisions and tradeoffs (~30s)**: 2–3 design choices with explicit "we chose X over Y because Z."

**Hard disqualifiers**:
- Broken demo (instant DQ)
- Slides-only walkthrough — judges need to see the live thing
- Re-pitching market or problem
- No Solana integration explanation
- GitHub repo private at submission time

---

## D. Triage — Pitch script (current v3) vs must-haves

| Must-have | Current state | Gap | Priority |
|---|---|---|---|
| 1. Hook ≤20s with one number | Slide 1 (Asymmetry) ~21s with rate table | ✓ Land — but the "scrap metal" line should move from slide 6 footer to be the *opening number* on slide 1 | low |
| 2. Problem at scale | Slide 1 + 6 cover this | ⚠️ Need explicit named-incumbent failure: "Caixa values a R$50k Rolex at R$8–15k" — don't bury it | medium |
| 3. Solution + invariant | Slide 2 (Architecture) | ❌ **The atomic confirm-and-disburse invariant is the killer feature and it's not articulated as such.** Currently buried in "5 atomic gates." Should be one sentence: *"No USDC disburses until the licensed custodian's keypair signs custody-confirmation in the same transaction."* | **HIGH** |
| 4. Why now | Implicit only | ❌ Not on any slide. Need 3 converging facts: cNFT sub-cent (only since 2024), CNJ Provision 196 (June 2025 codified extrajudicial recovery of movable assets in BR), Sumsub native SAS integration (May 2025 — first reusable on-chain KYC at scale) | **HIGH** |
| 5. Team — unfair-advantage axes | Slide 7 has names but generic credentials | ⚠️ Reframe each person as an unfair-advantage axis: Marcelo→custody-deal-closing, George→LTV calibration, Felipe→watch-flow, Edson→Solana code shipped, Rodrigo→BD network | medium |
| 6. Validation | **Not on any slide** | ❌ Colosseum explicitly asks. Needs one slide or footer line: "Active commercial conversations with N SCD candidates and N Tier-1 custodians" | **HIGH** |
| 7. Vision + ask | Slide 8 is just one tagline | ⚠️ Add post-hackathon path: $250k → audit → first SCD partnership → 20–50 mainnet loans → seed | medium |

**Pitch script error log — factual corrections needed (codebase truth vs current draft):**

| Item | Current draft says | Codebase truth | Fix |
|---|---|---|---|
| Custodian | "Sekuro" (slide 2 + 6) | Brinks SP / Prosegur / Loomis-class (per old `PARTNERSHIPS.md`); current real LOI status TBC | Replace "Sekuro" with "Brinks / Prosegur / Loomis-class — in discussion" |
| Oracle | "Pyth" (slide 2 visual) | **Both Pyth and RedStone** on the table — final choice TBD; codebase has RedStone integrated (`tests/redstone-ltv.spec.ts`) | Show both on slide 2 with footnote: *"Pyth + RedStone both supported; production oracle finalized post-hackathon"* |
| KYC | "Sumsub" only | **Dual stack: Civic Pass (CAPTCHA gate, on-chain) + Sumsub (full KYC w/ native SAS integration, May 2025)** + on-chain `KycAttestation` PDA admin ix | Reframe — Sumsub is the named partner with the strongest narrative; Civic is the on-chain gate |
| Lending rail | "Loopscale + Kamino" | **Both — Kamino + Loopscale stay** as partner rails. Re7 + MEV Capital are capital relationships *through* Kamino V2 curator infra | Keep both. Add Re7/MEV as anchor curators reachable via Kamino V2 |
| Tokenization partner | "Mercado Bitcoin as regulated BR issuer" | **No BR-licensed issuer in the current direction.** On-chain tokenization happens via TRDC program directly (cNFT mint via Bubblegum). MB, Transfero, and crypto-native credit facilities are positioned as **institutional anchor lenders** | Drop "regulated BR issuer" framing entirely. MB is a lending-side partner, not issuer. |
| Legal structure | "BVI Discretionary Trust per asset" | **Keep this framing.** Pure cNFT-as-bearer-instrument + offshore wrapper. **No CCB, no fiduciary alienation, no BR-licensed SCD.** Older docs (`STATUS.md`, `PARTNERSHIPS.md` mentions of BACEN/CCB) are stale relative to current direction | **Keep PITCH_SCRIPT v3 legal framing as is.** Disregard my earlier recommendation to reframe around CCB. |
| Number of programs | "An Anchor program" (singular) | **4 programs**: vault, loan, trdc, auction with CPI between | Reflect on architecture diagram |
| Tests passing | Not mentioned | **45+ anchor tests green** (Phase 3 baseline); has grown since with Civic admin ixs (set_kyc_required, close_kyc_attestation), Sumsub server-side mint helper, atomic confirm-and-disburse refactor, e2e Playwright suite. **Run `anchor test` to confirm exact current count before recording.** | Add to traction line |

---

## E. Triage — Tech demo spec (current `DEMO_BUILD_SPEC.md`) vs must-haves

| Must-have | Current state | Gap | Priority |
|---|---|---|---|
| 1. Live Solana Explorer proof | Mentioned in shots 4, 5; "show real Solana Explorer" | ⚠️ Should be the **opening shot** (0:00–0:30), not a side beat | **HIGH** |
| 2. Architectural invariant articulated | Shot 4 shows the atomic gate firing as a borrow-fail toast | ❌ Doesn't state the invariant explicitly. Needs one sentence on screen + voice: *"The custodian keypair is registered in vault state. Only that key can sign confirm_custody. USDC disburses atomically in the same transaction. No competitor (Aave, Maple, Centrifuge) has shipped this."* | **HIGH** |
| 3. Why Solana — 3 quantified reasons | Shot 8 covers cNFT/SAS/composability | ⚠️ Should be sharper: cNFT 2,400× cost reduction at loan-book scale, 400ms finality enables sub-60-second disbursement, Anchor PDAs enforce invariant at program level | medium |
| 4. Stack rundown | Shot 8 lists primitives | ❌ Missing: 4 programs (vault/loan/trdc/auction), 45/45 tests, `anchor test` one-liner, GitHub repo URL, frontend live at vaulx.vercel.app | **HIGH** |
| 5. Decisions and tradeoffs | Not covered | ❌ **Entirely missing.** Need 2–3: (a) cNFT vs Metaplex Core for cost; (b) custodian keypair in program state vs off-chain trust; (c) USDC-primary vs BRL for FX-volatility isolation | **HIGH** |

**Tech demo factual corrections (codebase truth):**

| Item | Current spec says | Codebase truth | Fix |
|---|---|---|---|
| Architecture overlay | "Anchor program (singular)" | 4 programs: vault, loan, trdc, auction with CPI between | Redraw |
| KYC integration | "Sumsub demo-mocked, presented as live" | **Civic Pass on-chain CAPTCHA gate is real**; on-chain `KycAttestation` PDA admin ix lets operator mint attestations after Sumsub GREEN webhook; Sumsub WebSDK wired sandbox | Reframe — Civic gate is live, Sumsub for full KYC, on-chain attestation PDA is the bridge |
| Oracle | "Pyth on devnet, live" | RedStone integrated via `tests/redstone-ltv.spec.ts`; **Pyth still on the table** — production choice TBD | Show both as supported; pick one for the live demo flow |
| LP cutaway pool | "Loopscale curated vault dashboard" | Built UI is **`/lend/auctions` ("The Foreclosure Floor")** + **`/lend/vaults`** for deposit. Kamino + Loopscale are partner-rail destinations, not separate UIs in the demo build | Show the actual built pages; mention Kamino + Loopscale as the partner rails the curated vault routes to |
| Demo flow controller | Not mentioned | **`/admin/demo` cockpit is live** with 6 buttons + accelerate-time toggle + Moment 06 (default+auction) full sequence in ~10s | Use this as the demo backbone |
| Test runner | Not mentioned | **`/admin/tests` SSE runner** spawns `anchor test --skip-build` with live ANSI-colored output | Show this on-screen for the "45/45 tests" beat |
| Solana Pay | Not mentioned | **QR code integration shipped** (pay/repay/renew at `/borrow/loans/[trdc]/{pay,renew,repay}`) | Show on phone — this is a strong UX moment |

---

## F. Critical content corrections (read before any further design work)

These are the highest-impact gaps between the current scripts and the real build. Address these before further slide design.

1. **Submission deadline = May 10, 2026** (per `STATUS.md`), not May 11. We have **6 days**, not 7.
2. **The killer differentiator is the atomic confirm-and-disburse invariant.** Two-layer gate in code (`vault.disburse` requires `loan_authority` PDA signer + sysvar check that top-level tx is from loan program). **No competitor has shipped this for physical collateral.** This deserves its own slide and the lead position in the tech demo. It's currently underweighted everywhere.
3. **Legal structure: pure cNFT-as-bearer-instrument, offshore wrapper, no BR-licensed scaffolding.** Earlier `STATUS.md` / `PARTNERSHIPS.md` references to CCB (Cédula de Crédito Bancário), fiduciary alienation, BACEN-licensed SCDs are **stale**. Current direction is the cleaner one — global protocol with the cNFT itself as the legal carrier. Keep `PITCH_SCRIPT.md` legal framing as written.
4. **The repo is private (`gogysss/vaulx`) and must go public before submission.** This is an Open-source criterion hard requirement — flip it the day before submission.
5. **Phase 3 is fully complete** — 45+ anchor tests with growth since (Civic admin ixs, Sumsub server-side helper, atomic confirm-and-disburse refactor, Playwright e2e suite added), demo cockpit at `/admin/demo`, Solana Pay QR, auction flow with permissionless `execute_af_default` after 3-day grace. Run `anchor test` once more before recording to capture the exact current number. Way more shipped than the pitch acknowledges — lean on this in the traction line.
6. **Sumsub partnership is the strongest "why now" angle**: native Solana Attestation Service (SAS) integration with Solana Foundation, May 2025. Reusable on-chain KYC via ID Connect across 200+ partners. This stack literally did not exist 18 months ago.
7. **Oracle: keep both Pyth and RedStone on slides** — production choice still TBD. Frame as: *"Multi-oracle support — Pyth and RedStone both integrated; production source pinned post-hackathon based on uptime + LTV-feed coverage."* This is honest and shows engineering rigor.

---

## G. Revision priorities — ranked

Pre-submission revisions, in order of impact-per-effort. Top 5 are non-negotiable; 6–10 are upside.

1. **Add a "Why Now" slide** with three converging facts:
   - cNFT minting sub-cent — only economically viable since 2024 (Bubblegum state compression matured)
   - **Sumsub native SAS integration** with Solana Foundation, May 2025 — first reusable on-chain KYC at scale
   - Mature Solana lending markets (Kamino, Loopscale, Drift) — composable curated rails available since 2024–25
   
   15 seconds, hits Novelty + Potential Impact + Why-Solana.
2. **Lead the tech demo with the atomic confirm-and-disburse invariant** in the first 30 seconds. Open with Solana Explorer showing the failed-borrow tx (custody not confirmed) → custodian signs confirm_custody → USDC disburses atomically in next tx. Same scene answers Functionality + Novelty + UX.
3. **Add a Validation line** on the team or traction slide: "N commercial conversations with custodian candidates and lending-pool curators" — even if informal. Colosseum explicitly asks.
4. **Fix the factual errors** across both scripts (table in §D and §E above): Civic+Sumsub dual-stack, both Pyth and RedStone, Brinks/Prosegur/Loomis-class custodians, Kamino + Loopscale (both), 4 programs, 45+ anchor tests.
5. **Add a "Stack + Build Status" slide** with the real numbers: 4 programs, 45+ anchor tests + Playwright E2E, frontend live at vaulx.vercel.app, indexer + bridge running, demo cockpit at `/admin/demo`. Hits Functionality + Open-source.
6. **Reframe team as unfair-advantage axes** rather than tenure/role: Marcelo→custody-deal closing in weeks (Gitel's 60 corporate bank clients), George→banking-grade LTV calibration, Felipe→watch transaction flow already on crypto rails, Edson→shipped 4 programs in 18 days.
7. **Move the "Caixa values a R$50k Rolex at R$8–15k" line to the opening hook**, not slide 6 footer. It's the most quotable number in the deck.
8. **In the tech demo, open Solana Explorer first thing** with the live program IDs (one for each of vault/loan/trdc/auction) — not as a side beat in shot 5.
9. **Show `/admin/demo` cockpit driving the demo** rather than re-staging from a fresh wallet — it's already built, it accelerates time, it cleanly hits all 6 moments. Use it.
10. **Run `anchor test` once before recording** and capture the exact current test count for the traction line. The static baseline at `apps/web/public/demo/test-run.log` shows 45 passing; recent commits (Civic admin ixs, Sumsub helper, atomic-disburse refactor, Playwright suite) likely push the number higher.

---

## H. Out-of-scope for this triage

- Slide-by-slide rewrite. The user explicitly asked not to write the script; this is the punch list.
- Visual / Claude-Designs prompts. Those come after the user picks which revisions to commit.
- Validating the addressable-market numbers ($90B / $20B / $1–3B). Worth a 30-min sanity check before recording but not a structural revision.

---

## I. What to read next

- `docs/STATUS.md` — current build state with task-level granularity (referenced for §F)
- `docs/PARTNERSHIPS.md` — partnership tracker with the actual deck-pitch language for Sumsub (§F.6)
- `programs/loan/src/lib.rs` — confirm_custody + disburse atomic flow (§F.2 invariant)
- `programs/vault/src/lib.rs` — disburse 2-layer gate, KYC attestation lifecycle
- `tests/redstone-ltv.spec.ts`, `tests/civic-gate.spec.ts` — verify oracle + KYC integration (§E)
