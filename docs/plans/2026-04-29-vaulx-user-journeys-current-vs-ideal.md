# Vaulx User Journeys — Current Demo vs. Ideal Production

**Date:** 2026-04-29
**Scope:** AS-IS (Devnet hackathon demo, commit `8ecfae1`) vs. IDEAL (mainnet production)
**Purpose:** Catalogue every persona's journey, surface every gap, and decide every route's fate before deletion. Output two hard artifacts: a route-coverage matrix and a Cut List.

**This is an analysis document. No code changes.** Deletions follow a separate plan after the user signs off.

---

## 0. Executive summary

Vaulx today is **two products colliding under one Next.js app**: a live hackathon demo (the `/demo/*` tree) and a half-shed legacy Next.js prototype (the `/borrow/*`, `/lend/*`, `/custodian/*` trees). The redesign work shipped today (Civic Auth dropped, Sumsub WebSDK added, lazy KYC gate via `useKycGate`) was a clean cut on the demo side, but the legacy tree was left in place — most of it now duplicates demo intent or shows hard error pages for the canonical demo fixture slugs.

Stripping the legacy tree is half the cleanup. The other half is recognising that **"Borrower" and "Admin" are each masking two-to-three distinct personas**:

- **Borrower** is really *first-time borrower* (origination) + *returning borrower* (servicing/renewal/repayment). Renewal is the highest-margin path in the unit economics; today it's a single under-built page.
- **Admin** is really *operations admin* (devnet seed/state) + *risk-compliance reviewer* (KYC/AML/SCD oversight, missing today) + *treasury / Squads multisig governance* (program upgrades, default execution, missing today). Lumping them together is why the cockpit looks both over-built (11 buttons, 7 ops endpoints) and under-built (zero compliance UI).

Two roles the council flagged but the codebase does not yet surface:

- **Appraiser** — the BRD describes an appraiser role; the code has `api/appraisal` (backend) and `/demo/borrow/appraisal/[reqId]` (borrower-facing) but no `/appraiser/*` workspace. Either it's deferred to post-hackathon or the spec changed. **UNKNOWN_BLOCKED.**
- **SCD / Licensed Lending Partner** — legally the creditor of record in BR Phase 0. Surfaces today only as `<CcbDocument>` copy. No portal, no API. **DEFER for prod, KEEP_DEMO state-of-the-art as today.**

**Top deletion hypotheses to validate during journey walks**:

1. Delete every `/borrow/*`, `/lend/*`, and `/custodian/*` legacy route source file. Replace with redirects in `next.config.mjs`. (Cluster of ~20 files, ~2 500 LOC.)
2. Delete the entire `verify-id` quad-tree (4 routes × 2 trees = 8 routes) — Sumsub replaced gov.br.
3. Demote `/admin/*` to an internal-only basic-auth tier; do not remove (we use it for the demo).
4. Delete `/demo/dev/bezel` ("Hello bezel" sandbox).
5. Keep the `/custodian/*` legacy tree for now — confirm with user whether real custodians use a Vaulx UI in prod or only their own inventory system + webhook.

---

## 1. Persona taxonomy

| # | Persona | Production / Internal / Demo | Has UI today? | First-class for hackathon? |
|---|---|---|---|---|
| 1 | First-time Borrower | Production | ✅ `/demo/borrow/*` | ✅ Hero of pitch |
| 2 | Returning Borrower | Production | ⚠️ partial — `/demo/borrow/renew`, `/demo/borrow/repay` | ⚠️ thin |
| 3 | Institutional Lender / LP | Production | ✅ `/demo/lend/*` (institutional vaults) | ✅ |
| 4 | Retail Lender via FIDC | Production | ✅ same routes, retail vault row | ✅ |
| 5 | Custodian | Production | ✅ `/custodian/intake/[trdc]`, `/custodian/done/[trdc]` (legacy) + `/demo/borrow/custody` (borrower-side) | ⚠️ legacy only |
| 6 | Appraiser | Production | ❌ no UI; only `api/appraisal` backend | ❌ |
| 7 | Licensed Lending Partner / SCD | Production | ❌ no UI; legal layer only | ❌ |
| 8 | Auction Bidder / Recovery Buyer | Production | ✅ `/demo/auction`, `/demo/auction/[trdc]` | ✅ |
| 9 | Operations Admin (devnet ops) | Internal | ✅ `/admin/demo` cockpit | ✅ for demo only |
| 10 | Risk / Compliance Admin | Internal | ❌ no UI today | ❌ |
| 11 | Treasury / Governance / Squads Multisig | Internal | ❌ no Vaulx UI; uses Squads UI | ❌ |
| 12 | Visitor / Judge | Demo-only | ✅ `/`, `/demo`, `/demo/architecture` | ✅ |
| 13 | Demo Operator (live walkthrough host) | Demo-only | ✅ `/admin/tests`, `/demo/dev/bezel` | ⚠️ |

---

## 2. Per-persona analysis

### 2.1 First-time Borrower

> *Maria owns a Submariner. She wants R$30 000 USDC for 90 days using the watch as collateral. She has never used Solana.*

**User goal**: get USDC liquidity against a luxury watch in <60 minutes from sign-in to disbursement.

**AS-IS routes** (in walk order):

```
/                                         marketing
  → /demo/borrow/onboard                  intro + "Continue to sign-in"
    → /demo/borrow/wallet                 Crossmint Auth (Google/email/Phantom)
      → /demo/borrow/register             asset form (brand/model/serial/photos)
        → /demo/borrow/appraisal/[reqId]  triangular appraisal screen
          → /demo/borrow/loan-offer/[reqId]  terms acceptance + CCB preview
            → /demo/borrow/custody        custodian booking
              → /demo/borrow/awaiting-custody/[trdc]  waiting state
                → /demo/borrow/disburse   disbursement → USDC arrives
                  → /demo/borrow/funds    spend hub (card / pix / wallet)
                    → /demo/borrow/dashboard  loan tracking
```

**AS-IS journey, step by step**:

1. Lands on `/demo/borrow/onboard` from marketing page. Reads the 4-step explainer. Clicks "Continue to sign-in".
2. On `/demo/borrow/wallet`, picks Crossmint (Google/email/Apple/SMS) → smart wallet provisioned in ~3s, OR connects existing Phantom/Solflare. **No KYC at sign-in** (lazy gate is the design).
3. On `/demo/borrow/register`, fills brand/model/serial/photos. Clicks Submit. **First KYC trigger**: `useKycGate("Submit asset for evaluation")` — if no SAS attestation on the connected wallet, `<KycRequiredModal>` opens, mounts `<SumsubVerify>` iframe, runs Sumsub Sandbox flow, mints `KycAttestation` PDA via webhook on GREEN, then resumes the asset submission. Routes to `/demo/borrow/appraisal/[reqId]`.
4. Appraisal page runs the "three sources, one number" UI: WatchCharts API, Chrono24 (via Apify actor or fallback HTML), and an offline specialist quote. Convergence within 5%. ~15s on demo.
5. `/demo/borrow/loan-offer/[reqId]` shows: appraised value, max LTV, rate, tenor, weekly amortization, prepay, late fees. CCB preview with `<CcbDocument>`. User clicks "Accept" → CCB hash signed.
6. `/demo/borrow/custody` shows custodian options (São Paulo, Rio) and time slots. User books. State transitions to `PENDING_CUSTODY`.
7. `/demo/borrow/awaiting-custody/[trdc]` waits for custodian confirmation. Polls `/api/onchain-events/custody-confirmed`.
8. `/demo/borrow/disburse` is the **second KYC trigger** if for some reason the user skipped the gate at register time. `useKycGate("Disburse")`. After custody confirms, the disburse instruction fires (server-side via operator key on demo). USDC lands in user's wallet.
9. `/demo/borrow/funds` lets them spend: Vaulx Card (mock), Pix off-ramp (mock), wallet send (real on-chain transfer).
10. `/demo/borrow/dashboard` shows the active loan, amortization schedule, days remaining.

**Real vs. mocked**:

| Step | Real on-chain / live integration | Mocked / hardcoded |
|---|---|---|
| Sign-in | Crossmint Auth (sandbox) ✅, Phantom/Solflare via wallet-adapter ✅ | — |
| Asset form | Form state in `useDemoSession` (localStorage) | No persistent backend storage |
| KYC gate | Sumsub WebSDK sandbox + webhook + on-chain `KycAttestation` PDA mint via operator key ✅ | Sumsub sandbox is GREEN-only; real reject paths untested |
| Appraisal | WatchCharts API ✅ (with fallback fixture); Apify Chrono24 ✅ when token set | Offline specialist quote is hardcoded |
| CCB | `<CcbDocument>` renders structured copy | Not signed by SCD; not stored as legal artifact |
| Custody booking | `useDemoSession` state | No real custodian calendar; slots are fixtures |
| Custody confirm | Operator presses button in `/admin/demo`; `confirmCustody` ix runs ✅ | Real custodian hardware/QR not integrated |
| Disburse | `useDeposit` → on-chain `Vault.deposit` ix on Devnet ✅ | Devnet USDC, not mainnet |
| Funds: card | UI shell only | No real card issuance |
| Funds: pix | UI shell only | No Dock/Celcoin/Swap integration |
| Funds: wallet | Real Solana transfer ✅ | — |
| Dashboard | Reads on-chain Vault + TRDC state ✅ | Amortization rendered from fixtures |

**IDEAL production journey** (post-mainnet):

1. Sign-in unchanged (Crossmint with Apple/Google/email/SMS or external wallet).
2. KYC at register-time: real Sumsub mainnet + Brazil Non-Doc (CPF + liveness vs Serpro, ~60s, no document upload). SAS attestation minted by SCD's operator key (not Vaulx's), or by Vaulx with SCD co-sign.
3. Asset form persists to backend (Postgres/Supabase). Photo uploads go to Box/S3.
4. Appraisal runs blinded across 1 online + 1 offline appraiser + 1 automated anchor. Divergence > 20% triggers manual audit. Outcome stored on-chain as a price feed and off-chain as the appraisal record.
5. CCB signed via ICP-Brasil / Clicksign. Stored by SCD as legal creditor of record. Borrower receives a copy.
6. Custody booking against a real custodian calendar (Prosegur/Brinks). Confirmation comes via webhook from the custodian's inventory system, not a Vaulx admin button.
7. Disbursement triggered automatically by custody-confirmation webhook. Fiat off-ramp (BRL via Pix) handled in same flow.
8. Funds flow with real Vaulx Card (BIN sponsor) + real Pix integration.
9. Dashboard shows real amortization, payment history, Day-60 renewal nudge.

**Gaps**

- **UX**: photo-upload component is a stub. Custodian time-slot picker uses fixtures.
- **Data/model**: no persistent backend for asset records. `useDemoSession` is localStorage; refresh in a different browser loses state. CCB has no storage.
- **On-chain**: `KycAttestation` is real but minted by Vaulx operator; SCD co-signing pattern not designed.
- **Off-chain integrations**: Sumsub mainnet not approved (sandbox only). Pix integration absent. Vaulx Card BIN sponsor absent. Real custodian webhook absent.
- **Compliance/legal**: no ICP-Brasil signature flow. CCB rendered but not a legally-binding artifact.
- **Security**: photo uploads have no virus-scan or PII redaction.

**Redundancy**

- `/borrow/new/asset` (legacy) is a full duplicate of `/demo/borrow/register`. Already redirects via `next.config.mjs`, but the source file still ships in the bundle.
- `/borrow/new/appraisal/[reqId]` and `/borrow/new/terms/[reqId]` and `/borrow/new/awaiting-custody/[trdc]` are legacy duplicates of their `/demo/borrow/*` counterparts.
- The "verify-id" quad-tree (`/demo/borrow/verify-id`, `/callback`, `/govbr-login`, `/redirecting`) is dead post-Sumsub migration.

**Decision**: KEEP_PROD all `/demo/borrow/{onboard,wallet,register,appraisal,loan-offer,custody,awaiting-custody,disburse,funds,funds/card,funds/pix,funds/wallet,dashboard}`. DELETE the four `/demo/borrow/verify-id*` routes. DELETE the four `/borrow/new/*` legacy duplicates. KEEP_DEMO `/admin/demo` for stepping the flow during pitch.

---

### 2.2 Returning Borrower

> *Maria's first 90-day loan ends in 3 days. She wants to renew at the same rate against the same Rolex without going to a vault again.*

**User goal**: renew or repay an existing loan with zero new appraisal/custody friction. Renewal is the highest-margin path (no acquisition cost, no new physical handling).

**AS-IS routes**:

```
/demo/borrow/dashboard      shows active loan(s)
  → /demo/borrow/renew      single page; pay accrued interest, signs amendment
  → /demo/borrow/repay      single page; full payoff, asset release flow
```

**AS-IS journey**:

1. Lands on `/demo/borrow/dashboard`. Sees the active loan card with days-remaining.
2. Clicks "Renew" or "Repay".
3. Renew: pays interest in USDC, signs an amendment hash, TRDC state cycles `ACTIVE → RENEWED → ACTIVE`, days-remaining resets.
4. Repay: pays full principal + interest, asset release event fires, custodian gets the release order, TRDC state goes `ACTIVE → REPAID`. Asset returns to Maria.

**Real vs. mocked**:

| Step | Real | Mocked |
|---|---|---|
| Loan listing | Reads on-chain Vault + Loan PDAs ✅ | — |
| Renew | UI shell + amendment hash | No on-chain `extend_loan` ix yet (uses `useDemoSession` toggle) |
| Repay | Has `repay` ix path | Asset-release leg goes through admin button, not custodian webhook |

**IDEAL production journey**:

1. Day-60: borrower receives a WhatsApp + email nudge to renew early ("renew now and save 10% origination fee on next cycle").
2. Tier-priced rate (Cycle 1 = 2.2%/mo, Cycle 3+ = 2.0%) is shown.
3. Renew bypasses KYC re-check (existing SAS attestation on wallet). Bypasses appraisal (asset hasn't moved). Bypasses custody (asset hasn't moved).
4. One-click renewal → on-chain `extend_loan` → updated amortization → CCB amendment signed off-chain.
5. Repay path: full payoff → custodian webhook fires release order → physical handover scheduled → asset returns.

**Gaps**

- **UX**: no Day-60 nudge UI. No tiered loyalty rate display. No "renew now save 10%" incentive UI.
- **Data/model**: no notification system (WhatsApp / email queue). No referral credit accounting.
- **On-chain**: no `extend_loan` instruction. Renewal currently flips client-side state, not chain state.
- **Off-chain integrations**: WhatsApp Business API absent. Email transactional service absent.
- **Compliance/legal**: CCB amendment template absent. SCD co-signing flow absent.
- **Security**: none material at this layer.

**Redundancy**

- `/borrow/loans/[trdc]/renew` (legacy) duplicates `/demo/borrow/renew`. DELETE.
- `/borrow/loans/[trdc]/repay` (legacy) duplicates `/demo/borrow/repay`. DELETE.
- `/borrow/loans/[trdc]/repaid` (legacy) is a success state — the demo handles the success state in-page on `/demo/borrow/repay`. DELETE.
- `/borrow/loans/[trdc]/disburse` (legacy) duplicates `/demo/borrow/disburse`. DELETE.
- `/borrow/loans/[trdc]/pay` (legacy) — per-installment payment. **No demo equivalent.** This is the only place this flow lives. DEFER decision: either migrate to `/demo/borrow/pay` (creating a new demo route) or accept that installment-payment is post-hackathon.

**Decision**: KEEP_PROD `/demo/borrow/{renew,repay,dashboard}`. DELETE all `/borrow/loans/[trdc]/{renew,repay,repaid,disburse}`. UNKNOWN_BLOCKED on `/borrow/loans/[trdc]/pay` — needs user verdict on whether per-installment is a Phase-0 prod requirement.

---

### 2.3 Institutional Lender / LP

> *A Brazilian asset manager wants to deploy R$5M USDC into a senior tranche backed by Brazilian luxury-watch CCBs. Needs ISDA-grade onboarding, accredited investor terms, and 8% net APY.*

**User goal**: deposit large USDC ticket into senior tranche; track yield; withdraw with notice; access auctions if defaults occur.

**AS-IS routes**:

```
/demo/lend                            vault index, 4 tranches listed
  → /demo/lend/vaults/[id]            detail page, deposit form
  → /demo/lend/onboard                accredited LP application (form)
  → /demo/lend/liquidity              liquidity strategy explainer
```

**AS-IS journey**:

1. Lands on `/demo/lend`. Sees 4 vault cards: Institutional USDC (senior, ~8% APY), Institutional BRL, Retail USDC (subordinate, ~9.5%), Retail BRL.
2. Clicks Institutional USDC. Lands on `/demo/lend/vaults/inst-usdc`.
3. Reads APY, TVL, 30-day flow, active loans, avg LTV, reserve %. Sparkline.
4. Types deposit amount. Clicks "Deposit USDC". **KYC trigger**: `useKycGate("Deposit USDC")`. Modal → Sumsub iframe → SAS attestation → resume.
5. On-chain `Vault.deposit` runs. LP receives vault share token (or in mock mode, session toast).
6. (Optionally) navigates to `/demo/lend/onboard` for the institutional LP application: entity name, jurisdiction, AUM, accredited certification.

**Real vs. mocked**:

| Step | Real | Mocked |
|---|---|---|
| Vault listing | Fixtures (`vault-tranches.ts`) | Should read from on-chain Vault config |
| Deposit | Vault detail page is fully MOCKED (the page I wired KYC gate into earlier today — the deposit itself uses `setTimeout` + toast); `<LendDepositPanel>` on `/demo/lend` does real on-chain deposit | Inconsistent; two parallel code paths |
| KYC | Real Sumsub + on-chain SAS ✅ | Sandbox only |
| LP application | Form-only, no submission | No backend |

**IDEAL production journey**:

1. Connects wallet (institutional probably has its own custody — Fireblocks, Anchorage). Whitelisted via off-chain master agreement signature, then `whitelist_lp` ix.
2. KYC bypass for whitelisted entities (or a B2B-grade Sumsub flow).
3. Deposits via on-chain `Vault.deposit`. Receives vault share token.
4. Yield accrues from disbursements + repayments; APY recomputes on-chain.
5. Withdrawal via `Vault.withdraw` subject to 80% utilization cap (queue if over). Real waterfall: senior tranche paid before subordinate.
6. Default events surface in dashboard with a link to the auction page.

**Gaps**

- **UX**: vault detail page is two pages (mocked deposit on `/demo/lend/vaults/[id]`, real deposit via `<LendDepositPanel>` on `/demo/lend` — see Redundancy below).
- **Data/model**: vault config + APY are fixtures, not on-chain reads.
- **On-chain**: no utilization cap enforcement on withdraw; no withdrawal queue; no waterfall logic across tranches.
- **Off-chain integrations**: institutional onboarding has no real backend.
- **Compliance/legal**: master lending agreement template absent. Whitelist gate absent.
- **Security**: no LP-side multisig support documented.

**Redundancy**

- **Two deposit code paths for the same intent**: `/demo/lend/page.tsx` (uses `<LendDepositPanel>`, real on-chain) vs `/demo/lend/vaults/[id]/page.tsx` (mocked `setTimeout`). Different UIs, different code. Either consolidate (one component, swap data source) or accept that vault-detail is "marketing/inspection" and `/demo/lend` is "transact".
- `/lend/vaults/[id]` (legacy) renders "INVALID VAULT — retail-usdc is not a valid asset mint" for canonical fixture slugs. **DELETE.**
- `/lend/vaults` and `/lend` already redirect to demo. KEEP redirects, DELETE source.

**Decision**: KEEP_PROD `/demo/lend`, `/demo/lend/vaults/[id]`, `/demo/lend/onboard`, `/demo/lend/liquidity`. MERGE the two deposit code paths (single canonical component reading from on-chain or fixture per env). DELETE `/lend/vaults/[id]` and `/lend/auctions/[id]` source files; keep redirects.

---

### 2.4 Retail Lender via FIDC

> *A São Paulo retail investor wants to put R$10K of stablecoin yield into Brazilian luxury-watch credit, but the regulatory wrapper has to be a FIDC quota (Brazilian SEC-compliant fund) — not a direct DeFi vault token.*

**User goal**: invest in a tokenized FIDC quota that wraps the on-chain Vaulx vault, get monthly yield, withdraw quarterly.

**AS-IS routes**: same as 2.3 — routed to retail vault rows on `/demo/lend/vaults/{retail-usdc,retail-brl}`. **No FIDC-specific UI.**

**AS-IS journey**: identical to institutional today. The "FIDC wrapper" is described in the marketing copy but is not implemented as a separate flow.

**Real vs. mocked**: 100% mocked at the FIDC layer.

**IDEAL production journey**:

1. Connects wallet. Retail Sumsub flow (full doc + selfie or Brazil Non-Doc).
2. Reads + accepts FIDC quota terms (regulamento, taxa de administração, public auditor).
3. Stablecoin routed to a FIDC intake address (managed by Vórtx / Oliveira Trust as fund administrator).
4. FIDC quota token issued to retail investor's wallet (Tokeny ERC-3643 if Polygon, or a Solana ERC-3643-like standard).
5. Yield distributed monthly. Withdrawal queued quarterly.

**Gaps**

- **UX**: FIDC-specific consent screen absent. Retail risk disclosure absent.
- **Data/model**: FIDC quota token contract absent on Solana.
- **On-chain**: no FIDC-quota mint logic; no monthly distribution cron.
- **Off-chain integrations**: Vórtx / Oliveira Trust fund admin onboarding absent.
- **Compliance/legal**: CVM-registered FIDC vehicle is a 3-6 month legal project, not in code.
- **Security**: redemption queue and auditor publication infrastructure absent.

**Redundancy**: shares the deposit-path duplication noted in 2.3.

**Decision**: KEEP_DEMO the retail vault rows on `/demo/lend` for narrative purposes. MARK FIDC integration as DEFER for prod. Document that retail flow is **not yet legally productionable** in any UI copy that promises retail access.

---

### 2.5 Custodian

> *Cofre Brasil's vault operator in São Paulo receives a TRDC-confirmed Rolex shipment. Needs to confirm intake on-chain so the borrower's loan disburses.*

**User goal**: physically receive the asset, verify identity & condition, confirm on-chain custody so the loan can disburse.

**AS-IS routes**:

```
/custodian/intake/[trdc]    legacy intake page
/custodian/done/[trdc]      legacy success page
/demo/borrow/custody        borrower-side custody booking (different persona)
/api/admin/demo/confirm-custody   admin shortcut to fire confirm_custody
/api/onchain-events/custody-confirmed   webhook receiver
```

**AS-IS journey** (today, demo): the **borrower** books a slot via `/demo/borrow/custody`, then the **operator admin** clicks "Confirm Custody" in `/admin/demo`, which calls `/api/admin/demo/confirm-custody`. The legacy `/custodian/intake/[trdc]` is not part of the demo flow.

**Real vs. mocked**:

| Step | Real | Mocked |
|---|---|---|
| Booking | `useDemoSession` localStorage | No real custodian calendar |
| Operator confirm | On-chain `confirm_custody` ix via operator key ✅ | Real custodian doesn't press a Vaulx button |
| Webhook receiver | `/api/onchain-events/custody-confirmed` exists ✅ | No real custodian system POSTs to it |

**IDEAL production journey**:

1. Asset arrives at Cofre Brasil vault. Operator scans QR code on packaging (links to TRDC mint address).
2. Operator does physical verification: serial number match, condition check, photos.
3. Operator's vault inventory system fires a webhook to Vaulx → `/api/onchain-events/custody-confirmed` → `confirm_custody` ix runs with the operator's signing key (NOT Vaulx's).
4. Borrower's loan auto-disburses.

**Gaps**

- **UX**: real custodians use their own inventory systems; the `/custodian/intake/[trdc]` UI is a placeholder we may never need.
- **Data/model**: no QR generation pipeline tying TRDC mint → physical packaging.
- **On-chain**: `confirm_custody` requires Vaulx operator key today; should accept a custodian-specific signer.
- **Off-chain integrations**: zero real custodian webhooks.
- **Compliance/legal**: SLA template with custodian absent.
- **Security**: physical possession proof has no cryptographic binding.

**Redundancy**

- `/custodian/intake/[trdc]` and `/custodian/done/[trdc]` are legacy. They were the original Vaulx custodian UI; now superseded conceptually by webhook-driven flow.

**Decision**: UNKNOWN_BLOCKED on the legacy `/custodian/*` routes — needs user verdict. My recommendation: **REMOVE from prod surface, KEEP_DEMO** as a fallback UI for partners who don't have inventory webhooks integrated. So: keep the source files, hide from public nav, gate behind basic-auth in prod.

---

### 2.6 Appraiser

> *A senior watch specialist in Geneva receives an appraisal request blinded to the borrower's identity. Submits a USD valuation with photo evidence. Gets paid per appraisal.*

**User goal**: receive blinded appraisal jobs, submit valuations, get paid.

**AS-IS routes**: **NONE.** The codebase has `api/appraisal` (backend service that does triangular convergence) and `/demo/borrow/appraisal/[reqId]` (borrower-facing screen showing the convergence result), but **no appraiser workspace**.

**Real vs. mocked**: the appraisal CONVERGENCE UI on the borrower side is real (calls the API). The appraiser-side workflow is 0% built.

**IDEAL production journey**:

1. Appraiser logs into `/appraiser` (does not exist).
2. Sees queue of blinded requests: brand, model, serial (last 4 redacted), photos, urgency.
3. Submits valuation in USD. Confidence range. Notes.
4. System aggregates 3 sources → convergence → triggers next loan step.
5. Appraiser invoiced monthly per submission.

**Gaps**

- **UX**: entire `/appraiser/*` workspace absent (queue, submission form, history).
- **Data/model**: no appraiser identity, no payout ledger.
- **On-chain**: appraisal results don't anchor on-chain today (not strictly required — just an off-chain trust signal).
- **Off-chain integrations**: payout rail (USD ACH) absent.
- **Compliance/legal**: appraiser NDA absent.
- **Security**: blinding scheme not designed.

**Redundancy**: none — there's nothing here to be redundant with.

**Decision**: DEFER. Mark as a Phase-1 (post-hackathon) build. Until then, the triangular appraisal uses 1 online API + 1 offline source (hardcoded fixture) + 1 anchor (Chrono24 via Apify), which is enough for the demo narrative.

---

### 2.7 Licensed Lending Partner / SCD

> *A Brazilian SCD (sociedade de crédito direto) is the legal creditor of record on each CCB. Vaulx originates, the SCD issues. The SCD needs full legal-trail access.*

**User goal**: receive each new loan request, sign CCB, hold legal counterparty role for borrower default workflows.

**AS-IS routes**: **NONE in UI**. `<CcbDocument>` component renders CCB copy on `/demo/borrow/loan-offer/[reqId]`.

**Real vs. mocked**: 0% built. Today Vaulx pretends to be the lender; in prod the SCD is.

**IDEAL production journey**:

1. SCD has a portal at `/scd/*` (does not exist) showing pending CCBs.
2. SCD signs each CCB digitally (ICP-Brasil).
3. CCB stored as legal artifact in SCD's system + Vaulx mirror.
4. On default, SCD initiates extrajudicial recovery under DL 911/69.
5. SCD has read access to repayment ledger.

**Gaps**

- **UX**: full SCD workspace absent.
- **Data/model**: SCD identity, CCB ID-to-loan mapping, signing-event audit trail — all absent.
- **On-chain**: CCB hash on-chain anchors it but doesn't bind SCD as creditor; needs an SCD-signed attestation PDA.
- **Off-chain integrations**: ICP-Brasil signature provider, SCD's own systems, default-trigger automation — all absent.
- **Compliance/legal**: this is the single largest legal gap before mainnet.
- **Security**: SCD-side key management and audit logging absent.

**Redundancy**: none.

**Decision**: DEFER, but document clearly. Add a `<DemoBadge partner="SCD" />` to `/demo/borrow/loan-offer/[reqId]` so demo viewers know the legal layer is mocked.

---

### 2.8 Auction Bidder / Recovery Buyer

> *A whitelisted luxury-watch reseller enters Vaulx auctions when borrowers default. Buys the watch at 15-20% below market, gets clean title.*

**User goal**: bid on defaulted collateral, win, receive asset + cleared title.

**AS-IS routes**:

```
/demo/auction              auction list
/demo/auction/[trdc]       per-auction page (bidding UI)
/api/auctions              backend
/api/auctions/[id]/bids    backend
/api/admin/demo/default-and-auction   admin trigger
/lend/auctions             redirects to /demo/auction
/lend/auctions/[id]        legacy (renders error)
```

**AS-IS journey**:

1. Operator clicks "Default & Auction" in `/admin/demo` → triggers `default-and-auction` endpoint → on-chain default + auction creation.
2. Bidder navigates to `/demo/auction`. Sees list with countdown timers.
3. Clicks into `/demo/auction/[trdc]`. Reads asset details, current high bid, time remaining.
4. Connects wallet, places bid, receives confirmation.
5. Auction settles → highest bidder gets the asset; protocol takes 5% fee.

**Real vs. mocked**:

| Step | Real | Mocked |
|---|---|---|
| Auction list | API + fixtures (`auction-bids.ts`, `auction-floor.ts`) | Mostly fixtures |
| Default trigger | Admin button → on-chain ✅ | Bypasses 7-day notice period |
| Bidding UI | API endpoint exists | Demo-only timer (60s instead of 7d) |
| Settlement | TBD on-chain | — |
| Whitelist | Not enforced | Should be enforced |

**IDEAL production journey**:

1. SCD initiates extrajudicial recovery under DL 911/69 (off-chain legal event).
2. Squads multisig calls `execute_default` (on-chain).
3. 7-day privileged auction window opens. Whitelisted bidders only: existing lenders of that vault + 20 pre-approved watch resellers.
4. Bids clear at 15-20% below M3 median.
5. Winning bidder receives asset; remaining proceeds (if any) return to borrower.
6. Unsold lots roll to public luxury auction houses (Sotheby's, Christie's, etc.).

**Gaps**

- **UX**: whitelist UI absent. 7-day timer is currently 60s for demo. No "M3 median" rendered in pricing context.
- **Data/model**: bidder whitelist not on-chain.
- **On-chain**: `execute_default` requires Squads multisig signature in prod; today uses single operator key.
- **Off-chain integrations**: DL 911/69 paperwork generation absent.
- **Compliance/legal**: legal validity of auction settlement absent.
- **Security**: no challenge period; no escrow guarantees.

**Redundancy**

- `/lend/auctions/[id]` (legacy) shows "INVALID AUCTION" for canonical IDs. DELETE.

**Decision**: KEEP_PROD `/demo/auction`, `/demo/auction/[trdc]`. DELETE `/lend/auctions/[id]` source. Migrate timer + whitelist + multisig to prod-grade post-hackathon.

---

### 2.9 Operations Admin (devnet ops)

> *Vaulx operator running the live demo for judges. Needs to step the borrower flow through any stage, reset state, mint test USDC, simulate custody confirm + default + auction.*

**User goal**: drive the demo on stage; respond to judge "what happens if X" questions.

**AS-IS routes**:

```
/admin/demo                cockpit (multi-button)
/api/admin/demo/disburse
/api/admin/demo/confirm-custody
/api/admin/demo/seed-pool
/api/admin/demo/mint-trdc
/api/admin/demo/repay
/api/admin/demo/default-and-auction
/api/admin/demo/reset
```

**AS-IS journey**:

1. Operator opens `/admin/demo`.
2. Clicks one of 7 buttons depending on demo phase. Each button hits its endpoint, signs with operator key, runs on-chain.
3. Watches result toast.

**Real vs. mocked**: 100% real on-chain on Devnet ✅. The page itself is a thin wrapper around 7 API calls.

**IDEAL production journey** (this persona is **devnet-only**):

In production, Operations Admin is replaced by:
- automated cron for `mark_overdue` (no human button)
- webhooks for custody-confirmed (no human button)
- Squads multisig for default/auction (separate persona — see 2.11)

So the entire `/admin/demo` cockpit is **demo-only infrastructure**. It must not ship to mainnet.

**Gaps**

- No basic-auth on `/admin/demo` today — anyone with the URL can fire ops endpoints. **Security gap.**
- No `NODE_ENV !== "production"` guard on the route + endpoints.

**Redundancy**: none — the cockpit is purpose-built.

**Decision**: KEEP_DEMO `/admin/demo`. Add `NEXT_PUBLIC_VAULX_ADMIN_PUBKEY` cookie-or-header guard before mainnet. Document as devnet-only.

---

### 2.10 Risk / Compliance Admin

> *A Vaulx compliance officer reviews flagged Sumsub applicants, tracks SCD audit events, monitors AML alerts.*

**User goal**: review high-risk applicants, freeze accounts, generate audit trails.

**AS-IS routes**: **NONE.**

**AS-IS journey**: doesn't exist in the codebase.

**Real vs. mocked**: 0% built. The on-chain `KycAttestation` PDA can be revoked via `close_kyc_attestation` admin ix, but there's no UI.

**IDEAL production journey**:

1. `/risk` (does not exist) shows queue of YELLOW Sumsub reviews.
2. Officer views applicant details, escalates or approves.
3. Freeze action calls `freeze_account` ix (does not exist).
4. AML alerts surface from on-chain transaction monitoring (does not exist).
5. Audit log exports to PDF for regulator.

**Gaps**: everything. UI, model, on-chain freeze ix, AML monitoring, audit export.

**Redundancy**: none.

**Decision**: DEFER to Phase 1. Document the missing surface so it's not forgotten.

---

### 2.11 Treasury / Governance / Squads Multisig

> *Vaulx founders + Marcelo + Edson form a 2-of-3 Squads multisig that owns program upgrade authority, vault parameters, and default execution.*

**User goal**: upgrade programs safely; tune parameters; execute defaults under multisig consent.

**AS-IS routes**: **NONE in Vaulx UI.** Uses Squads' own UI at app.squads.so.

**AS-IS journey**: today, operator key signs all admin actions. Program upgrade authority is **already** the Squads V4 PDA per commit `5e90d81`, but admin actions (`set_kyc_required`, vault config, etc.) use the operator key.

**Real vs. mocked**:

| Step | Real | Mocked |
|---|---|---|
| Program upgrade authority | Squads V4 vault PDA ✅ | — |
| Admin instructions | Operator key (single signer) | Should require Squads multisig |
| Default execution | Single signer | Should require Squads |

**IDEAL production journey**:

1. Founder proposes a program upgrade or parameter change in Squads UI.
2. 2-of-3 signatures collected.
3. Squads PDA executes the on-chain ix.
4. Vaulx UI shows current parameter values (read-only).

**Gaps**

- **UX**: no read-only parameter display in Vaulx UI.
- **On-chain**: admin ixs accept single-signer; need to verify Squads PDA can sign them.
- **Off-chain integrations**: Squads SDK not used in any client.
- **Compliance/legal**: multisig key-recovery procedures absent.
- **Security**: emergency pause + emergency-only admin paths absent.

**Redundancy**: none.

**Decision**: DEFER UI to post-hackathon. Add a small "Admin → Squads" link in `/admin/demo` for navigation continuity.

---

### 2.12 Visitor / Judge

> *A Colosseum judge or potential investor lands on the Vaulx homepage. Has 90 seconds. Wants to understand what it is and try the demo.*

**User goal**: understand Vaulx in <2 minutes; pick a path (lend or borrow); try it without commitment.

**AS-IS routes**:

```
/                          marketing landing
/demo                      demo entry hub
/demo/architecture         architecture pitch slide
```

**AS-IS journey**:

1. Lands on `/`. Reads hero ("Lend against the world's most resilient assets.").
2. Scrolls. Sees the 6-step explainer (`05 Sign — Download and sign the Brazilian CCB...`).
3. Clicks one of the demo CTAs → `/demo/lend` or `/demo/borrow/onboard`.
4. Optionally `/demo/architecture` for technical pitch.

**Real vs. mocked**: marketing pages are static + fixtures.

**IDEAL production journey**: same shape, with refreshed copy when prod is live.

**Gaps**

- Favicon 404 on every route (~known, cosmetic).
- "Demo" badging is implicit; some judges may not realise it's not live.

**Redundancy**: none.

**Decision**: KEEP_DEMO + KEEP_PROD. Marketing pages stay as the front door.

---

### 2.13 Demo Operator (live walkthrough host)

> *Vaulx founder or staff running the demo on stage at Colosseum. Needs to recover from broken states fast.*

**User goal**: reset / advance the demo without leaving the page.

**AS-IS routes**:

```
/admin/tests        live SSE Anchor test runner
/demo/dev/bezel     "Hello bezel" sandbox
```

**AS-IS journey**: ad-hoc — open `/admin/tests` to verify on-chain code is healthy; use `/admin/demo` (covered in 2.9) for state actions.

**Real vs. mocked**: `/admin/tests` is real (streams `anchor test` output via SSE). `/demo/dev/bezel` is a "Hello world" page that's not used.

**IDEAL production journey**: this persona ceases to exist post-hackathon.

**Decision**: KEEP_DEMO `/admin/tests` (useful for live debugging). DELETE `/demo/dev/bezel`.

---

## 3. Route coverage matrix

51 page routes in `apps/web/src/app/**/page.tsx` as of `8ecfae1`. Each gets a verdict.

Legend:
- **KEEP_PROD** — required for production user journey
- **KEEP_DEMO** — required for hackathon/demo only; gate behind env or remove for mainnet
- **MERGE** — valuable but duplicates another route; consolidate
- **DEFER** — real future need, build post-hackathon
- **DELETE** — no clear user, no journey, no legal need; safe to remove
- **UNKNOWN_BLOCKED** — needs user verdict before deletion

### 3.1 Marketing / entry (3)

| Route | Persona | Demo moment | Prod | Status | Verdict | Reason |
|---|---|---|---|---|---|---|
| `/` | Visitor | Cold open | yes | real | KEEP_PROD | Marketing front door |
| `/demo` | Visitor | Demo hub | no | real | KEEP_DEMO | Demo-only entry; not needed in prod |
| `/demo/architecture` | Visitor (technical) | Architecture pitch | no | real | KEEP_DEMO | Pitch slide for judges |

### 3.2 Borrower demo path (16)

| Route | Persona | Demo moment | Prod | Status | Verdict | Reason |
|---|---|---|---|---|---|---|
| `/demo/borrow/onboard` | First-time Borrower | Step 1 intro | yes | real | KEEP_PROD | Single-step explainer |
| `/demo/borrow/wallet` | First-time Borrower | Step 2 sign-in | yes | Crossmint sandbox | KEEP_PROD | Sign-in surface |
| `/demo/borrow/register` | First-time Borrower | Step 3 asset form + KYC gate | yes | mocked persistence | KEEP_PROD | Hero CTA |
| `/demo/borrow/appraisal/[reqId]` | First-time Borrower | Step 4 triangular appraisal | yes | partial real | KEEP_PROD | Convergence UI is the wow moment |
| `/demo/borrow/loan-offer/[reqId]` | First-time Borrower | Step 5 terms + CCB preview | yes | mocked SCD | KEEP_PROD | Conversion screen |
| `/demo/borrow/custody` | First-time Borrower | Step 6 booking | yes | fixtures | KEEP_PROD | Booking step |
| `/demo/borrow/awaiting-custody/[trdc]` | First-time Borrower | Step 7 wait state | yes | webhook poll real | KEEP_PROD | Bridges off-chain → on-chain |
| `/demo/borrow/disburse` | First-time Borrower | Step 8 KYC gate + disburse | yes | on-chain real | KEEP_PROD | Money-touching CTA |
| `/demo/borrow/funds` | First-time Borrower | Step 9 spend hub | yes | UI only | KEEP_PROD | Hub |
| `/demo/borrow/funds/card` | First-time Borrower | Step 9a card | partial | shell only | KEEP_DEMO | No real BIN sponsor |
| `/demo/borrow/funds/pix` | First-time Borrower | Step 9b Pix | partial | shell only | KEEP_DEMO | No Dock/Celcoin yet |
| `/demo/borrow/funds/wallet` | First-time Borrower | Step 9c wallet send | yes | real on-chain | KEEP_PROD | Real wallet send |
| `/demo/borrow/dashboard` | Returning Borrower | Loan tracking | yes | partial real | KEEP_PROD | Active-loan view |
| `/demo/borrow/renew` | Returning Borrower | Renewal flow | yes | mocked extend ix | KEEP_PROD | Highest-margin path |
| `/demo/borrow/repay` | Returning Borrower | Repayment + release | yes | mocked release | KEEP_PROD | Required path |
| `/demo/borrow/verify-id` | (none — dead) | (none) | no | dead post-Sumsub | DELETE | Civic/gov.br dropped today |
| `/demo/borrow/verify-id/callback` | (none — dead) | (none) | no | dead | DELETE | Civic/gov.br dropped |
| `/demo/borrow/verify-id/govbr-login` | (none — dead) | (none) | no | dead | DELETE | Civic/gov.br dropped |
| `/demo/borrow/verify-id/redirecting` | (none — dead) | (none) | no | dead | DELETE | Civic/gov.br dropped |

### 3.3 Lender demo path (4)

| Route | Persona | Demo moment | Prod | Status | Verdict | Reason |
|---|---|---|---|---|---|---|
| `/demo/lend` | LP | Lend index | yes | real deposit panel | KEEP_PROD | Lender front door |
| `/demo/lend/vaults/[id]` | LP | Vault detail + deposit | yes | mocked deposit | KEEP_PROD + MERGE | Detail page valuable; merge deposit code with `/demo/lend` |
| `/demo/lend/onboard` | Institutional LP | LP application | yes | form-only | KEEP_PROD | Onboarding intake |
| `/demo/lend/liquidity` | LP | Strategy explainer | yes | static | KEEP_PROD | Explainer |

### 3.4 Auction demo path (2)

| Route | Persona | Demo moment | Prod | Status | Verdict | Reason |
|---|---|---|---|---|---|---|
| `/demo/auction` | Auction Bidder | Default → auction | yes | partial real | KEEP_PROD | Auction list |
| `/demo/auction/[trdc]` | Auction Bidder | Bid UI | yes | partial real | KEEP_PROD | Bidding screen |

### 3.5 Demo internal / sandbox (1)

| Route | Persona | Demo moment | Prod | Status | Verdict | Reason |
|---|---|---|---|---|---|---|
| `/demo/dev/bezel` | Demo Operator | none | no | "Hello bezel" stub | DELETE | No load-bearing role |

### 3.6 Admin (2)

| Route | Persona | Demo moment | Prod | Status | Verdict | Reason |
|---|---|---|---|---|---|---|
| `/admin/demo` | Operations Admin | Cockpit, all 7 ops | demo only | real on-chain Devnet | KEEP_DEMO | Drives the demo; gate behind basic-auth |
| `/admin/tests` | Demo Operator | Live SSE test runner | demo only | real | KEEP_DEMO | Live debugging during pitch |

### 3.7 Custodian legacy (2)

| Route | Persona | Demo moment | Prod | Status | Verdict | Reason |
|---|---|---|---|---|---|---|
| `/custodian/intake/[trdc]` | Custodian | none in current demo | UNKNOWN | legacy | UNKNOWN_BLOCKED | Real custodians may want their own portal vs webhook |
| `/custodian/done/[trdc]` | Custodian | none | UNKNOWN | legacy | UNKNOWN_BLOCKED | Same question |

### 3.8 Legacy `/borrow/*` tree (10)

| Route | Demo moment | Prod | Status | Verdict | Reason |
|---|---|---|---|---|---|
| `/borrow/new/asset` | none | no | redirect | DELETE source | Already redirects to `/demo/borrow/onboard`; remove the source `page.tsx` |
| `/borrow/new/appraisal/[reqId]` | none | no | client-redirect | DELETE | Superseded by `/demo/borrow/appraisal/[reqId]` |
| `/borrow/new/terms/[reqId]` | none | no | client-redirect | DELETE | Superseded by `/demo/borrow/loan-offer/[reqId]` |
| `/borrow/new/awaiting-custody/[trdc]` | none | no | live legacy | DELETE | Renders legacy chrome; superseded by demo equivalent |
| `/borrow/loans/[trdc]/disburse` | none | no | live legacy | DELETE | Superseded by `/demo/borrow/disburse` |
| `/borrow/loans/[trdc]/pay` | none | UNKNOWN | live legacy | UNKNOWN_BLOCKED | Per-installment payment — no demo equivalent; needs verdict |
| `/borrow/loans/[trdc]/renew` | none | no | live legacy | DELETE | Superseded by `/demo/borrow/renew` |
| `/borrow/loans/[trdc]/repaid` | none | no | live legacy | DELETE | Superseded by demo's in-page success state |
| `/borrow/loans/[trdc]/repay` | none | no | live legacy | DELETE | Superseded by `/demo/borrow/repay` |
| `/borrow/verify-id` | none | no | redirect to dead | DELETE redirect + target | Civic/gov.br dropped |
| `/borrow/verify-id/callback` | none | no | redirect to dead | DELETE redirect | Civic/gov.br dropped |
| `/borrow/verify-id/govbr-login` | none | no | redirect to dead | DELETE redirect | Civic/gov.br dropped |
| `/borrow/verify-id/redirecting` | none | no | redirect to dead | DELETE redirect | Civic/gov.br dropped |

### 3.9 Legacy `/lend/*` tree (5)

| Route | Demo moment | Prod | Status | Verdict | Reason |
|---|---|---|---|---|---|
| `/lend` | none | no | redirect | KEEP redirect, DELETE source | Source is dead; redirect is cheap |
| `/lend/vaults` | none | no | redirect | KEEP redirect, DELETE source | Same |
| `/lend/vaults/[id]` | none | no | renders error | DELETE | "INVALID VAULT — retail-usdc is not a valid asset mint" |
| `/lend/auctions` | none | no | redirect | KEEP redirect, DELETE source | Same |
| `/lend/auctions/[id]` | none | no | renders error | DELETE | "INVALID AUCTION — t1 is not a valid pubkey" |

### Route count summary

| Verdict | Count |
|---|---|
| KEEP_PROD | 18 |
| KEEP_DEMO | 8 |
| KEEP redirect, DELETE source | 3 |
| DELETE | 16 |
| MERGE | 1 |
| DEFER | 0 (no current routes) |
| UNKNOWN_BLOCKED | 3 (`/custodian/*` × 2, `/borrow/loans/[trdc]/pay`) |
| **Total** | **49 page routes** (51 minus 2 already covered as KEEP redirect+source delete) |

Plus **8 future routes** explicitly DEFERRED:
- `/appraiser/*` workspace (persona 6)
- `/scd/*` portal (persona 7)
- `/risk/*` compliance review (persona 10)
- A treasury read-only view (persona 11)

---

## 4. Component / domain redundancy matrix

Cross-route redundancies in components, lib code, and concepts.

| Concept | Used in | Duplicates what | Canonical owner | Action |
|---|---|---|---|---|
| Deposit form | `<LendDepositPanel>` (real on-chain), `/demo/lend/vaults/[id]/page.tsx` (mocked setTimeout) | Each other | `<LendDepositPanel>` | MERGE: extract a single `<DepositForm>` component, parameterise with `mode: "real" | "mock"` |
| KYC gate copy | `useKycGate("Deposit USDC")`, `useKycGate("Disburse")`, `useKycGate("Submit asset for evaluation")` | Each other | `<KycRequiredModal>` | KEEP — small case-of-currency bug to fix (lowercase `usdc`) |
| `useDemoSession` shape | `_lib/use-demo-session.ts` | Carries `civic` and `govbr` fields that are now dead | `_lib/types.ts` | DELETE `civic` and `govbr` fields; migrate any tests |
| `<CivicAuthGate>` and `<CivicAuthRoot>` | (deleted today) | Sumsub via `useKycGate` | `useKycGate` | DONE (commit `adf3212`) |
| gov.br mock storage | `lib/govbr/mock-storage.ts`, `lib/govbr/...` | Sumsub | Sumsub | DELETE entire `lib/govbr/` |
| `<IdentityGates>` (legacy) | `apps/web/src/app/borrow/new/{asset,terms}/...` | `useKycGate` | `useKycGate` | DELETE with the legacy `/borrow/new/*` tree |
| Wallet connect button | `<WalletMultiButton>` (Phantom/Solflare) on `/demo/lend`, `/demo/lend/vaults/[id]` + `<CrossmintWallet>` only on `/demo/borrow/wallet` | Inconsistent surfaces | A single `<UnifiedConnectButton>` | DEFER until post-hackathon — combining Crossmint + wallet-adapter into one click is its own design task |
| `SiteHeader` (legacy) | All `/borrow/*`, `/lend/*`, `/custodian/*` legacy pages, `/`, `/admin/*` | `<DemoShell>` (demo) | `<DemoShell>` | KEEP `SiteHeader` for marketing + admin only; remove from any non-demo route after legacy tree deletion |
| Vault tranche fixtures | `_fixtures/vault-tranches.ts` | Should be on-chain `VaultConfig` reads | `VaultConfig` | DEFER — reading on-chain Vault config is a Phase-1 task |
| Auction floor + bids fixtures | `_fixtures/auction-{floor,bids}.ts` | Should be on-chain Auction PDAs | Auction program | DEFER |
| Custodian slots fixtures | `_fixtures/custodian-slots.ts` | Should be real custodian calendar | Custodian system | DEFER |

---

## 5. Cut list

The single artifact to act on. Everything below is approved-for-deletion contingent on user sign-off.

### 5.1 DELETE NOW (16 routes + 4 redirect targets + lib/govbr)

**Page routes** (delete the `page.tsx` and any sibling files in the same directory):

```
apps/web/src/app/demo/borrow/verify-id/page.tsx
apps/web/src/app/demo/borrow/verify-id/callback/page.tsx
apps/web/src/app/demo/borrow/verify-id/govbr-login/page.tsx
apps/web/src/app/demo/borrow/verify-id/redirecting/page.tsx
apps/web/src/app/demo/dev/bezel/page.tsx
apps/web/src/app/borrow/new/asset/page.tsx
apps/web/src/app/borrow/new/appraisal/[reqId]/page.tsx
apps/web/src/app/borrow/new/terms/[reqId]/page.tsx
apps/web/src/app/borrow/new/awaiting-custody/[trdc]/page.tsx
apps/web/src/app/borrow/loans/[trdc]/disburse/page.tsx
apps/web/src/app/borrow/loans/[trdc]/renew/page.tsx
apps/web/src/app/borrow/loans/[trdc]/repaid/page.tsx
apps/web/src/app/borrow/loans/[trdc]/repay/page.tsx
apps/web/src/app/lend/page.tsx
apps/web/src/app/lend/vaults/page.tsx
apps/web/src/app/lend/vaults/[id]/page.tsx
apps/web/src/app/lend/auctions/page.tsx
apps/web/src/app/lend/auctions/[id]/page.tsx
```

**Redirect rules in `next.config.mjs`** to drop (since targets are being deleted):

```
/borrow/verify-id          → /demo/borrow/verify-id      (drop)
/borrow/verify-id/callback → /demo/borrow/onboard        (drop, target dead)
/borrow/verify-id/govbr-login → /demo/borrow/verify-id   (drop, target dead)
/borrow/verify-id/redirecting → /demo/borrow/verify-id   (drop, target dead)
```

**Redirect rules in `next.config.mjs`** to ADD (catch-all so legacy share-links don't 404):

```
/lend/vaults/:id*           → /demo/lend/vaults/:id*
/lend/auctions/:id*         → /demo/auction/:id*
/borrow/loans/:trdc*/:rest* → /demo/borrow/dashboard
/borrow/new/:rest*          → /demo/borrow/onboard
```

**Lib code** to remove:

```
apps/web/src/lib/govbr/                  (entire directory)
apps/web/src/components/vaulx/govbr-gate.tsx   (entire file)
apps/web/src/components/vaulx/identity-gates.tsx   (entire file — only legacy callers used it)
```

**Type / state cleanup**:

```
apps/web/src/app/demo/_lib/types.ts:
  - Remove `civic: { jwtHash: string; verifiedAt: number | null }`
  - Remove `govbr: { name: string; cpf: string; verifiedAt: number | null }`

apps/web/src/app/demo/_lib/use-demo-session.ts:
  - Remove initial values for civic + govbr
  - Update tour-steps refs that mention these fields
```

### 5.2 DELETE pending user verdict (UNKNOWN_BLOCKED — 3)

```
apps/web/src/app/custodian/intake/[trdc]/page.tsx          (Persona 5 — real custodians: portal vs webhook?)
apps/web/src/app/custodian/done/[trdc]/page.tsx            (Persona 5 — same)
apps/web/src/app/borrow/loans/[trdc]/pay/page.tsx          (Persona 2 — per-installment pay: keep & migrate or accept post-hackathon?)
```

### 5.3 KEEP_DEMO with prod gating (gate, don't delete)

```
/admin/demo               — gate behind basic-auth (`NEXT_PUBLIC_VAULX_ADMIN_PUBKEY`)
/admin/tests              — gate behind basic-auth
/demo                     — keep for hackathon; remove from prod nav
/demo/architecture        — pitch slide; keep
```

### 5.4 MERGE (1)

```
/demo/lend/vaults/[id]/page.tsx (mocked deposit)  +  apps/web/src/app/demo/_components/lend-deposit-panel.tsx (real deposit)
  → single canonical <DepositForm> component, env-gated mode.
```

### 5.5 DEFER (post-hackathon Phase 1)

- `/appraiser/*` workspace
- `/scd/*` portal
- `/risk/*` compliance review
- `/treasury` read-only Squads view
- WhatsApp/email notification infrastructure for renewal nudges
- Real custodian webhook integration
- FIDC quota token + fund admin onboarding
- ICP-Brasil signature integration
- Pix off-ramp (Dock/Celcoin)
- Vaulx Card BIN sponsor

---

## 6. Deletion safety checklist

Before any file is deleted, verify:

1. **Route is not in the demo script.** Walk the demo top-to-bottom: lender flow + borrower flow + admin cockpit. Note every URL that loads. Cross-reference this list against the DELETE list. If a DELETE-tagged route appears in the walk, **STOP** and reclassify.
2. **Route is not referenced in marketing copy or pitch deck.** `grep -rn "{route}" docs/ *.md`.
3. **Route is not referenced from a non-deleted page.** `grep -rn "{route}" apps/web/src/`.
4. **Route is not in any test file.** `grep -rn "{route}" apps/web/e2e/ apps/web/src/**/__tests__/`.
5. **Route is not behind a paid feature flag.** (None today; future-proofing.)
6. **On-chain dependencies are removed.** If the route was the only caller of an on-chain ix, decide whether to remove the ix or keep it for future use.
7. **`next.config.mjs` redirects are updated.** Either drop dead redirects or repoint surviving ones.
8. **Build green** after deletion: `pnpm --filter @vaulx/web build`.
9. **Tests green**: `pnpm --filter @vaulx/web test` and the new Playwright `apps/web/e2e/` suite.
10. **Vercel preview deploys cleanly** before merging to main.

---

## 7. Open questions for the user

These need a yes/no/punt before I can produce a concrete deletion PR.

1. **`/custodian/intake/[trdc]` and `/custodian/done/[trdc]`** — real custodians: do they use a Vaulx UI in prod or only their own inventory + a webhook to us? If "only their own", DELETE both. If "Vaulx UI as a fallback for partners without their own system", KEEP_DEMO.
2. **`/borrow/loans/[trdc]/pay`** — per-installment payment flow has no demo equivalent. Keep & migrate to `/demo/borrow/pay`? Or accept that installment payment is a post-hackathon Phase-1 build and DELETE this legacy?
3. **`/admin/demo` + `/admin/tests`** — gate behind basic-auth before mainnet, or simply remove from public nav and rely on URL obscurity? Recommend: real basic-auth via existing `NEXT_PUBLIC_VAULX_ADMIN_PUBKEY` machinery.
4. **`/demo/dev/bezel`** — DELETE confirmed? It's a "Hello bezel" stub, no load-bearing.
5. **Appraiser workspace** — is this a Phase-1 build or out-of-scope entirely until Phase-2? Affects whether `<DemoBadge partner="Manual appraisal">` should appear on `/demo/borrow/appraisal/[reqId]`.
6. **SCD portal** — same question. Affects whether `<DemoBadge partner="SCD">` should appear on `/demo/borrow/loan-offer/[reqId]`.
7. **Crossmint sign-in surface beyond `/demo/borrow/wallet`** — should `<CrossmintWallet>` be wired into the lender top-bar so non-crypto LPs can sign in without leaving `/demo/lend`? Currently lender side uses only Phantom/Solflare via `<WalletMultiButton>`.

---

## 8. What this document is NOT

- It is **not** a build plan. After your verdicts on §7, I produce a separate cleanup plan via `superpowers:writing-plans`.
- It is **not** a marketing artefact. Internal consumption only.
- It is **not** a final design. It captures the gap between what's built and what production needs; the design for Phase 1 (post-hackathon prod path) is its own brainstorming session.

---

**End of journey analysis.** Awaiting verdicts on §7 to produce the cleanup plan.
