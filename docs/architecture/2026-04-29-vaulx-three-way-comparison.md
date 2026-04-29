# Vaulx — three-way comparison: γ plan / our `vaulx` / Edson's `program`

**Date:** 2026-04-29
**Audience:** George + Edson — alignment conversation
**Purpose:** Clear side-by-side of what each of us has built, so we can decide which architecture goes forward and where the gaps are.
**Source data:**
- γ plan: [`../plans/2026-04-29-vaulx-gamma-scope-implementation-plan.md`](../plans/2026-04-29-vaulx-gamma-scope-implementation-plan.md)
- Our `vaulx`: this repo (Vaulxfi/vaulx) — last commit `38cb082`
- Edson's `program`: [`Vaulxfi/program`](https://github.com/Vaulxfi/program) — last commit `d2cd4d2` (2026-04-25)

## Legend

| Symbol | Meaning |
|---|---|
| ✅ | Present and working (tested) |
| 🟡 | Partial / mocked / sandbox-only |
| 🔵 | Planned in γ scope (not yet built) |
| ❌ | Absent |
| — | Not applicable to this layer |

## Snapshot — counts at a glance

| Layer | γ Plan target | Our `vaulx` today | Edson's `program` today |
|---|---|---|---|
| Anchor programs | 4 (vault · loan · auction · trdc) | 4, all on Devnet | 1 (`vaulx`), on Devnet |
| Anchor instructions | 16+ across 4 programs | 16+ across 4 programs | 5 (+ 1 witness) |
| On-chain state types | 5+ (Vault, Loan, KycAttestation, PriceFeed, Auction…) | 5+ | 3 (Vault, LenderPosition, Trdc) |
| API routes (server) | ~8 | 6 (Sumsub × 3, demo admin, onchain-events, appraisal) | 0 (no Next.js / web-server in repo) |
| Frontend routes | ~30 (post-cleanup) | ~50 (16 deletions pending in γ Phase F) | 0 (Laravel at vaulx.fi is elsewhere) |
| Tests | passing many | 69 Anchor + 52 vitest + 27 Playwright | 6 Anchor (full lifecycle) |
| Demo verifiability | Devnet | Devnet (live at `vaulx.vercel.app`) | Devnet (5 tx signatures in his README) |

---

## Group 1 — Smart contracts (Solana programs)

| Feature / Process | What it is | γ Plan | Our `vaulx` | Edson's `program` |
|---|---|---|---|---|
| **Lender deposits** | Lender funds the vault treasury | ✅ keep | ✅ `vault::deposit` | ✅ `deposit_capital` (per-lender shares vs NAV) |
| **Lender withdraws** | Lender redeems shares | ✅ keep | ✅ `vault::withdraw` | ❌ not in his |
| **Vault NAV / share accounting** | Yield grows lender pro-rata | ✅ | ✅ via vault accounting | ✅ NAV grows on `repay_ccb` interest |
| **Vault config (LTV cap, APY, cooldown)** | Per-vault parameters | ✅ | ✅ `initialize_vault_config` + `initialize_vault` | ✅ `initialize_vault` (LTV cap 75%, APY, cooldown) |
| **Multi-vault / tranches** | USDC + Local (BRL) — 2 vaults | 🔵 simplify 4→2 | 🟡 4 fixture rows currently | ❌ single-vault model |
| **Loan creation (borrower opens)** | Mints loan record + cNFT, status PENDING | ✅ | ✅ `loan::create_ccb_trdc` (CPI to trdc + bubblegum) | ✅ `create_ccb_trdc` (single-program; CPI to bubblegum direct) |
| **TRDC cNFT mint (Bubblegum)** | Compressed NFT representing the loan | ✅ | ✅ `trdc` program | ✅ inline in `create_ccb_trdc`; leaf_owner = vault PDA |
| **TRDC state machine** | PENDING → ACTIVE → REPAID/DEFAULTED | ✅ | ✅ `TrdcStatus` enum | ✅ `TrdcStatus` enum (same 4 states) |
| **30-day min maturity check** | Loan term must be ≥ 30 days | 🔵 verify | ❓ check loan config | ✅ enforced in `create_ccb_trdc` |
| **75% LTV hard cap** | LTV ≤ 75% | 🔵 verify | ❓ check loan config | ✅ enforced; reverts if exceeded |
| **Custody confirmation** | Custody node attests; flips loan to ACTIVE | ✅ | ✅ `vault::confirm_custody` (separate ix from disburse) | ✅ `confirm_custody` (atomic — also disburses in same tx) |
| **Disburse principal** | USDC: vault treasury → borrower | ✅ | ✅ `vault::disburse` + `vault::disburse_from_vault` (CPI from loan) | ✅ inside `confirm_custody` (atomic gate-and-disburse) |
| **Custody-gate `require!`** | Money cannot leave vault before custody confirmed | ✅ critical invariant | ✅ `KycAttestation` PDA + `kyc_required` flag (also adds KYC gate) | ✅ `require!(trdc.status == Active)` — load-bearing |
| **Negative test (custody bypass)** | Proves disburse reverts if custody not confirmed | 🔵 keep | ✅ exists in test suite | ✅ `disburse_ccb` standalone — kept as witness for negative test |
| **Repay full principal + interest** | Borrower closes loan; NAV grows | ✅ | ✅ `loan::repay_ccb` | ✅ `repay_ccb` (interest grows NAV) |
| **Pay installment** | Per-period payment, schedule advances | 🔵 (γ D.5: `/demo/borrow/pay`) | 🔵 ix exists (`pay_installment` per program lib.rs) but no UI | ❌ not in his program |
| **Renew loan (extend)** | Cycle ACTIVE → RENEWED → ACTIVE; pay accrued interest only | 🔵 | ✅ `loan::renew_ccb` (chain-side); UI 🔵 | ❌ not in his program |
| **Default execution** | Trigger after grace period; transitions to DEFAULTED, opens auction | 🔵 critical | ✅ `loan::execute_af_default` | ❌ not in his program (status DEFAULTED defined but not transitioned to) |
| **Auction (privileged 7-day window + bid + settle)** | Whitelisted bidders + settlement on default | 🔵 keep, refine timer to 7d | ✅ separate `auction` program (60s demo timer) | ❌ no auction program at all |
| **Auction inflow back to vault** | Recovered USDC repays lenders | 🔵 | ✅ `vault::record_auction_inflow` (CPI from auction) | ❌ |
| **KYC attestation PDA on-chain** | Reusable on-chain credential per wallet | ✅ | ✅ `vault::issue_kyc_attestation` + `KycAttestation` PDA | ❌ no on-chain KYC layer |
| **`kyc_required` admin flag** | Toggle production KYC enforcement | ✅ | ✅ `vault::set_kyc_required` | ❌ |
| **Oracle / price-feed PDA** | RedStone push-oracle for asset prices | ✅ | ✅ `vault::publish_price` + PriceFeed PDA | ❌ |
| **Squads multisig as program upgrade authority** | 2-of-3 multisig for upgrades | ✅ | ✅ live | ❓ check his Anchor.toml deploy keys |
| **Inter-program CPIs (vault ↔ loan ↔ auction ↔ trdc)** | Multi-program coordination | ✅ | ✅ all 4 programs CPI each other | ❌ single program — no inter-program CPIs |
| **External CPIs (Bubblegum + SPL Token)** | cNFT mint + token transfers | ✅ | ✅ in `trdc` + `vault` | ✅ in `vaulx` (direct) |

---

## Group 2 — Off-chain backend / API routes

| Feature / Process | What it is | γ Plan | Our `vaulx` | Edson's `program` |
|---|---|---|---|---|
| **Sumsub WebSDK init-token** | Generates short-lived iframe token per wallet | ✅ keep | ✅ `/api/sumsub/init-token` | ❌ no Sumsub backend in repo |
| **Sumsub webhook receiver** | HMAC-verified event ingest; mints SAS attestation on GREEN | ✅ keep | ✅ `/api/sumsub/webhook` (signed, idempotent) | ❌ |
| **On-chain SAS-status read API** | FE polls to see if KYC PDA exists | ✅ keep | ✅ `/api/sumsub/applicant-status` | ❌ |
| **Custody-confirmed webhook (custodian → us)** | Real custodian inventory system POSTs after intake | 🔵 (γ Phase G) | 🟡 `/api/onchain-events/custody-confirmed` exists; no real partner webhook signing yet | ❌ |
| **Demo admin endpoints (devnet ops)** | 7 admin shortcuts for live demo: disburse, confirm-custody, mint-trdc, default-auction, repay, reset, seed-pool | ✅ keep, gate behind basic-auth | ✅ all 7 routes wired (`/api/admin/demo/*`) | ❌ but his `scripts/demo_devnet.ts` is the equivalent — runs from CLI, not from a UI |
| **Appraisal API (triangular convergence)** | Combines WatchCharts + Apify Chrono24 + offline anchor | 🟡 keep, evolve to multi-eval | 🟡 `/api/appraisal/*` exists | ❌ |
| **Per-case API (online appraiser fetch)** | Returns blinded case detail for assigned appraiser | 🔵 γ Phase B.2 | ❌ doesn't exist | ❌ |
| **Online appraiser submission API** | Accepts online valuation; transitions case state | 🔵 γ Phase B.2 | ❌ | ❌ |
| **Offline appraiser submission API** | Accepts offline valuation + photos + defects | 🔵 γ Phase B.4 | ❌ | ❌ |
| **Photo upload API + EXIF stripping** | Receives photo, strips metadata, stores | 🔵 γ Phase A.3 + B.4 | ❌ | ❌ |
| **EXIF-stripped photo serving** | `GET /api/photos/[caseCode]/[idx]` — strips before serve | 🔵 γ Phase A.3 | ❌ | ❌ |
| **Risk Officer review API + bound enforcement** | Server-side bounded override (`prudent ∈ [min, max]`) | 🔵 γ Phase C.2 (server-enforced) | ❌ | ❌ |
| **Persistent asset / appraisal-case DB** | Postgres/Supabase rows for asset, case, photos, decisions | 🔵 γ Phase A.1 | 🟡 Supabase wired; tables not yet created | ❌ |
| **CCB document generation + signature** | PDF / structured CCB; ICP-Brasil signature integration | 🔴 partner-blocked (post-hackathon) | 🟡 `<CcbDocument>` shell only | ❌ |
| **Notifications (WhatsApp / email)** | Day-60 renewal nudge, status updates | 🔴 (deferred) | ❌ | ❌ |

---

## Group 3 — Frontend / UI surfaces

> Edson's column is mostly empty here — his Laravel frontend at `vaulx.fi` is hosted on his VPS (currently 500-erroring), and **its source is not in `Vaulxfi/program` or any other org repo I can see**. If he has a separate frontend repo, we need to find it. For now: assume his frontend is the Laravel app at vaulx.fi that we don't have source-code visibility into.

| Feature / Process | What it is | γ Plan | Our `vaulx` | Edson's `program` |
|---|---|---|---|---|
| **Marketing landing** | `/` — pitch + demo CTAs | ✅ | ✅ live | ❌ Laravel at vaulx.fi (currently 500) |
| **Demo entry hub** | `/demo` | ✅ | ✅ | ❌ |
| **Architecture pitch page** | `/demo/architecture` | ✅ | ✅ | ❌ |
| **Borrower onboarding intro** | `/demo/borrow/onboard` | ✅ | ✅ (just collapsed from 14-step to 1-step) | ❌ |
| **Sign-in surface (Crossmint + wallet)** | Single button → Crossmint or Phantom/Solflare | 🔵 unify into `<UnifiedConnectButton>` (γ Phase A.5) | 🟡 currently split: Crossmint on `/demo/borrow/wallet`, wallet-adapter on `/demo/lend` | ❌ no Crossmint integration |
| **Asset registration form** | brand/model/serial/photos, KYC gate fires here | ✅ keep | 🟡 `/demo/borrow/register` (localStorage; no Supabase persistence) | ❌ |
| **Indicative terms (pre-custody)** | Online API valuation + indicative loan terms | 🔵 rewrite of `/demo/borrow/loan-offer` (γ Phase D.1) | 🟡 `/demo/borrow/loan-offer/[reqId]` exists but at WRONG MOMENT (pre-custody but treated as final) | ❌ |
| **Custody booking** | Pick custodian + slot | ✅ | ✅ `/demo/borrow/custody` (fixtures) | ❌ |
| **Awaiting custody (dual-clock UI)** | 24h online + 48h offline + Risk Officer wait state | 🔵 evolve | 🟡 `/demo/borrow/awaiting-custody/[trdc]` (single-clock) | ❌ |
| **Final terms (post-Risk Officer) — accept/decline** | Borrower sees prudent eval; accepts or declines | 🔵 BUILD `/demo/borrow/final-terms/[reqId]` (γ Phase D.2) | ❌ doesn't exist | ❌ |
| **Decline → asset return flow** | Custodian release; courier return shipping | 🔵 BUILD `/demo/borrow/return-asset/[reqId]` (γ Phase D.3) | ❌ | ❌ |
| **Disbursement page (KYC gate fires)** | Confirms terms; signs + executes on-chain | ✅ keep | ✅ `/demo/borrow/disburse` (KYC gate wired) | ❌ |
| **Spend USDC (card / pix / wallet)** | Off-ramp UI shells | 🟡 keep demo-only | 🟡 `/demo/borrow/funds/{card,pix,wallet}` (shells; only wallet is real) | ❌ |
| **Borrower dashboard (loan list)** | All active loans at a glance | ✅ extend | 🟡 `/demo/borrow/dashboard` (thin) | ❌ |
| **Per-loan detail (LTV, schedule, next payment)** | Full per-loan view | 🔵 BUILD `/demo/borrow/loans/[trdc]` (γ Phase D.4) | ❌ doesn't exist | ❌ |
| **Installment payment** | Pay one installment | 🔵 BUILD `/demo/borrow/pay/[trdc]` (γ Phase D.5) | ❌ | ❌ |
| **Renew loan UI** | Pay interest; cycle | ✅ | 🟡 `/demo/borrow/renew` (mocked) | ❌ |
| **Repay loan UI** | Full payoff; asset release | ✅ | 🟡 `/demo/borrow/repay` | ❌ |
| **KYC gate modal** | Lazy-fires on money-touching CTAs | ✅ keep | ✅ `<KycRequiredModal>` + `useKycGate` hook | ❌ |
| **Lender vault index** | List + filter | ✅ simplify to 2 vaults | 🟡 `/demo/lend` (4 vaults; merge in γ Phase E) | ❌ |
| **Lender vault detail + deposit** | Per-vault stats + deposit form | ✅ | 🟡 `/demo/lend/vaults/[id]` (mocked deposit; γ E.2 unifies) | ❌ |
| **LP onboarding (institutional)** | Application form | ✅ | ✅ `/demo/lend/onboard` | ❌ |
| **Auction list** | Active auctions | ✅ | ✅ `/demo/auction` | ❌ |
| **Auction bid screen** | Place bid, countdown | ✅ | ✅ `/demo/auction/[trdc]` | ❌ |
| **Online appraiser workspace** | `/appraiser/online` queue + submission, blinded | 🔵 BUILD (γ Phase B.1 + B.2) | ❌ | ❌ |
| **Offline appraiser workspace** | `/appraiser/offline` queue + own photos + defects, blinded | 🔵 BUILD (γ Phase B.3 + B.4) | ❌ | ❌ |
| **Risk Officer review screen** | `/admin/evaluations/[reqId]` — trilateral + bounded override | 🔵 BUILD (γ Phase C.1 + C.2) | ❌ | ❌ |
| **Custodian fallback portal** | `/custodian/intake/[trdc]` for partners without webhook | ✅ keep, gate behind basic-auth | ✅ exists (legacy) | ❌ |
| **Ops admin cockpit** | `/admin/demo` — driver for live demo | ✅ keep, gate behind basic-auth | ✅ live | — (he uses CLI scripts: `demo_devnet.ts`) |
| **Live SSE Anchor test runner** | `/admin/tests` — show 69-test suite running | ✅ keep | ✅ live | — |

---

## Group 4 — Infrastructure & integrations

| Feature / Process | What it is | γ Plan | Our `vaulx` | Edson's `program` |
|---|---|---|---|---|
| **Solana wallet adapter** | Phantom / Solflare connect | ✅ | ✅ via `@solana/wallet-adapter-react` | — (no FE in repo) |
| **Crossmint Auth + smart wallet** | Non-crypto sign-in (Google / email / SMS) → smart wallet | ✅ | ✅ sandbox live (`@crossmint/client-sdk-react-ui` 4.1.5) | ❌ no Crossmint |
| **Sumsub WebSDK** | KYC iframe + webhook | ✅ | ✅ sandbox live (`@sumsub/websdk` 2.6.2) | ❌ |
| **Solana Attestation Service (SAS)** | On-chain reusable KYC credential | ✅ | ✅ `KycAttestation` PDA pattern | ❌ |
| **Squads V4 multisig** | Program upgrade authority | ✅ | ✅ live as upgrade authority | ❓ verify in his deploy keys |
| **Helius RPC** | Solana RPC | ✅ | ✅ | ✅ uses `api.devnet.solana.com` directly (no Helius) |
| **Bubblegum (Metaplex cNFT)** | Compressed NFT for TRDC | ✅ | ✅ via separate `trdc` program | ✅ inline CPI |
| **SPL Account Compression** | Bubblegum dependency | ✅ | ✅ | ✅ |
| **Postgres / Supabase** | Off-chain persistence (asset records, appraisal cases, photos) | 🔵 γ Phase A.1 | 🟡 client wired; no schema yet | ❌ |
| **WatchCharts API** | Online watch-price source | ✅ | ✅ live (server-side) | ❌ |
| **Apify Chrono24 actor** | Secondary online price source | ✅ | ✅ live (with fallback fixture) | ❌ |
| **Hosting (Next.js)** | Vercel — auto-deploy on push | ✅ | ✅ `vaulx.vercel.app` (Pro plan, linked to Vaulxfi/vaulx) | — |
| **Hosting (PHP / Laravel)** | VPS at vaulx.fi | — | — | 🟡 Laravel at vaulx.fi (currently 500-erroring; source not in this repo) |
| **CI / GitHub Actions** | Build + lint + test on PR | ✅ | ✅ `.github/workflows/ci.yml` | ❌ no workflows in his repo |
| **Playwright E2E suite** | Smoke + KYC gate + API spec | ✅ keep | ✅ 27 tests passing on `vaulx.vercel.app` | ❌ |
| **Vitest unit tests (FE)** | Sumsub client, webhook, useKycGate, etc. | ✅ keep | ✅ 52 tests passing | ❌ |
| **Anchor / Mocha tests** | On-chain integration | ✅ keep | ✅ 69 passing + 2 pending + 2 failing (pre-existing) | ✅ 6/6 passing (`full_lifecycle.ts`) |

---

## Strategic summary

### Where Edson is ahead of us

- **Cleaner narrative.** His 5-instruction monolith is the "elevator pitch" of Vaulx in code. One program, one test file, one demo script, six on-chain transactions documented with explorer links. Easy to absorb.
- **Atomic confirm-and-disburse.** His `confirm_custody` does both in a single tx. Ours splits them across `vault::confirm_custody` + `vault::disburse_from_vault` (called via CPI from loan). His pattern is a simpler audit story.
- **30-day min maturity + 75% LTV cap enforced on-chain.** We have these in `loan_config` but should verify they're actually enforced as `require!` checks in our code.
- **Live demo transactions documented.** His README has a clean 6-tx table with Devnet explorer links. Our README is more sprawling.

### Where we're ahead of Edson

- **KYC layer.** He has none. We have on-chain `KycAttestation` PDA, `kyc_required` admin flag, Sumsub WebSDK + webhook + on-chain mint pipeline. Production-mandatory.
- **Auction program + default execution.** His program has a `Defaulted` status enum but no transition path. Ours has `loan::execute_af_default` + a separate `auction` program with bid/settle ix.
- **Renewal flow.** Ours has `loan::renew_ccb`. His doesn't.
- **Pay installment.** Ours has `loan::pay_installment`. His doesn't.
- **Multi-vault tranches.** Ours supports per-asset-mint vaults (currently 4 fixtures). His is single-vault.
- **Oracle / price-feed PDA.** We have it. He doesn't.
- **Frontend.** Next.js + Crossmint + Sumsub iframe + lazy KYC gate, deployed and live at vaulx.vercel.app. His Laravel is broken at vaulx.fi.
- **Test coverage.** 69 + 52 + 27 = 148 tests vs his 6.

### Where they diverge architecturally

- **Single program (his) vs four programs + CPIs (ours).** His is simpler; ours is more modular but with overhead. This is a real design call.
- **Atomic gate-and-disburse (his) vs separate ix (ours).** He saves a tx; we have more granular state transitions.
- **`leaf_owner = vault PDA` for cNFT (his)** vs **leaf_owner = loan PDA (verify ours)** — ownership model differs.

### What to decide

| Decision | Options | Our vote |
|---|---|---|
| **Which on-chain architecture goes forward?** | (A) Edson's monolith. We refactor our FE to use his IDL. γ plan needs partial rewrite. (B) Our 4-program split. He archives `Vaulxfi/program`, ports any salvageable Laravel to talk to our IDLs. (C) Hybrid — adopt his atomic confirm-and-disburse pattern, keep our 4-program split for KYC + auction + renewal. | We can argue (C) is best of both, but it's the most engineering work. (B) is fastest for hackathon. |
| **What happens to the Laravel app at vaulx.fi?** | (A) Retire — it's currently 500-erroring and not in any org repo we can see. (B) Edson migrates it to a Vaulxfi org repo + fixes the 500. (C) Repurpose as a marketing site, not the demo. | Probably (A) or (C). Demo lives at vaulx.vercel.app already. |
| **Frontend codebase.** | (A) Continue with our Next.js. (B) Edson rebuilds his Laravel to match. (C) Edson takes our Next.js, becomes its primary maintainer. | (A) or (C). (B) wastes work. |
| **Who owns what going forward?** | TBD per the conversation | — |

### Convergence math

- **24 features Edson has built** (his Anchor program inventory).
- **17 of those are also in our `vaulx` program tree** — same intent, different shape.
- **7 features unique to him** (atomic confirm+disburse style, etc.).
- **30+ features unique to us** (KYC, auction, renewal, frontend, backend, tests, hosting).

His repo is **roughly 30% of our scope**, but it's a clean 30%. Our 70% extra is mostly KYC + auction + renewal + frontend.

### Recommended call agenda (30 min)

1. **5 min — context.** This doc. He reads §1 + §4.
2. **5 min — design call on architecture.** Pick (A), (B), or (C) for on-chain.
3. **5 min — design call on Laravel.** Retire / migrate / repurpose vaulx.fi.
4. **5 min — frontend ownership.** Who maintains the Next.js codebase going forward?
5. **5 min — γ plan adjustments.** What changes in the γ plan based on the architecture decision?
6. **5 min — division of labor.** Who builds Phase A, B, C, D, E? Schedule.

---

**End.** This doc is the alignment artifact for the conversation. Update it after the call with decisions reached.
