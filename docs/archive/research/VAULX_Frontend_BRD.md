# Vaulx Frontend — Business Requirements Document (BRD)
**For: Claude Code Max · George · Marcelo · Edson**  
**Date: April 22, 2026 · Owner: George (CEO)**  
**Target deliverable: Colosseum Frontier Hackathon submission, May 10, 2026 (18 days)**  
**Source of truth for product scope: Canonical Spec v3 (§3, §4, §6).** Where this BRD and the canonical spec conflict, the spec governs on product scope; this BRD governs on implementation detail.

---

## 1. Purpose, scope, and success

**Purpose.** Specify every screen, component, integration, state, and acceptance criterion required to deliver the Vaulx frontend for the Colosseum submission. This is a build brief — not a design brief. It is intended to be parsed by a fast-executing AI engineering loop (Claude Code Max) with tight human review, not by a designer starting from a blank page.

**Scope.** End-to-end web application covering the borrower flow, the lender flow, the custodian confirmation step, the appraiser submission step, the admin/demo support layer, and the judge-walkthrough helpers. Devnet only. Desktop-first (tablet-readable, mobile-viewable but not mobile-optimized — judges watch the demo on desktop). English only for the demo.

**Success criteria (non-negotiable):**
1. Every one of the **six core demo moments** (§3.6 canonical spec) is visually executable on-screen, end-to-end, in under 30 seconds per moment.
2. **All nine demo moments** (6 core + 3 score-point) can be captured in a single 3-minute screen recording without edits or hidden manual steps.
3. Every on-chain transaction surfaces a **Solana Explorer link** inline after success — judges can independently verify.
4. The **custody-gate failing test** is viewable as a live-running test artifact (not a static screenshot).
5. Application is deployed to a **public URL** with a **demo wallet pre-funded on Devnet** that judges can use without self-onboarding.

**Explicit non-success criterion:** we are not shipping a production-grade product. Code beauty, i18n, full accessibility compliance, mobile polish, and edge-case error handling are deliberately descoped in favor of **demo-path correctness**. The BRD marks which items are demo-critical (🎬) vs. production-quality (🏗️) throughout.

---

## 2. Users and roles

Five distinct actor roles. Most flows are executed by two primary personas (Borrower, Lender); the remaining three are operational or demo-specific.

| Role | Description | Frontend scope for hackathon |
|---|---|---|
| **Borrower** | Retail user seeking a loan against a luxury asset | Full flow: discovery → asset submission → appraisal → terms → active loan → renewal / repayment |
| **Lender** | Institutional or retail user depositing stablecoin into a vault for yield | Full flow: vault selection → KYC → deposit → position tracking → withdraw → auction access |
| **Custodian** | Operator at partner vault (Brinks/Prosegur/Loomis) confirming physical intake | Minimal: intake queue + confirm-custody transaction |
| **Appraiser** | One of three independent appraisers (online, offline, market-anchor) | Minimal: assignment queue + valuation submission |
| **Admin / Demo** | Vaulx ops (hackathon: George/Marcelo) running state transitions and demo artifacts | State machine viewer, failing-test viewer, default execution, reset-to-demo-state |

**Authentication model.**
- Borrower, Lender, Custodian, Appraiser — wallet-connect (Phantom primary, Solflare secondary) + role claim via signed message. No passwords.
- Lender deposit gated by Civic Pass KYC (**mocked** for hackathon: a 3-second "KYC Pending → Verified" animation; real Civic SDK post-hackathon).
- Admin — hardcoded pubkey whitelist in env vars, no additional auth for demo.

---

## 3. Information architecture / sitemap

```
/                                   Landing (marketing + role selector)
/connect                            Wallet connect + role selection
/about · /how-it-works · /team      Static marketing (single page OK)

/borrow                             Borrower home (active loans overview)
  /new                              New loan wizard entry
    /new/asset                      Asset submission (Step 1)
    /new/appraisal/[reqId]          Appraisal progress (Step 2)
    /new/terms/[reqId]              Terms review & accept (Step 3)
    /new/awaiting-custody/[trdc]    TRDC minted, awaiting custody (Step 4)
  /loans/[trdc]                     Active loan detail
    /loans/[trdc]/pay               Monthly payment
    /loans/[trdc]/renew             Renewal flow
    /loans/[trdc]/repay             Full repayment (principal + interest)

/lend                               Lender home (portfolio overview)
  /vaults                           All four vaults (Inst-USDC, Inst-BRL, Retail-USDC, Retail-BRL)
  /vaults/[id]                      Vault detail + deposit
  /positions                        My active positions
  /positions/[id]                   Position detail + withdraw
  /auctions                         Privileged auction listings (for whitelisted lenders)
  /auctions/[id]                    Auction detail + bid interface
  /earnings                         Aggregated earnings dashboard

/custodian                          Custodian intake queue
  /custodian/intake/[trdc]          Intake detail + confirm-custody action

/appraiser                          Appraiser assignment queue
  /appraiser/appraise/[reqId]       Submit valuation

/admin                              Admin landing (pubkey-gated)
  /admin/state-machine              TRDC state viewer (all active TRDCs)
  /admin/tests                      Live-running failing-test artifact 🎬 CRITICAL
  /admin/vaults                     Vault health (balance reconciliation)
  /admin/default/[trdc]             Manual default execution (demo moment 9)
  /admin/demo                       Demo reset / time-skip / scenario launcher

/tx/[signature]                     Transaction viewer (wraps Explorer link)
/trdc/[mint]                        TRDC detail (public — viewable without wallet)
/ccb/[hash]                         CCB instrument viewer (IPFS/Arweave fetch)
```

**Routing tech:** Next.js 14 App Router. Dynamic segments use `[id]` convention. All loan/position routes use the TRDC mint address as the primary identifier (this keeps frontend identifiers identical to on-chain identifiers — critical for Explorer linking).

---

## 4. Screen-by-screen specs

Format for each screen: **Purpose · Entry · Inputs / state · Primary action(s) · Components · Integration · Success state · Error state · Demo relevance.**

Demo-critical screens are marked 🎬. Production-quality screens marked 🏗️.

---

### 4.1 Landing — `/` 🎬

**Purpose.** One-screen pitch for judges arriving at the deployed URL. Establishes "what Vaulx is" in <10 seconds, routes to wallet connect.

**Entry.** Direct URL (no auth required).

**Inputs / state.** None. Static content.

**Primary actions.**
- "Borrow against your watch" → `/connect?role=borrower`
- "Lend and earn 11% APY" → `/connect?role=lender`
- "I'm a judge" → `/admin/demo` (bypasses marketing)

**Components.**
- Hero section: tagline + custody-gate headline ("No loan disburses until physical custody is confirmed on-chain.")
- Three-column value prop (borrowers / lenders / TradFi rails)
- One-line team credibility strip (logos/names)
- Footer with GitHub, Colosseum submission link, canonical spec PDF link

**Integration.** None.

**Success.** User clicks a CTA and lands on connect.

**Error.** N/A (static).

**Demo relevance.** Opening shot of the demo video (3 seconds). Must load in <1.5s.

---

### 4.2 Connect + Role Selection — `/connect` 🎬

**Purpose.** Unified wallet-connect entry with role context. Both borrower and lender start here.

**Entry.** From landing CTAs. Query param `?role=borrower|lender|custodian|appraiser` pre-selects but is user-changeable.

**Inputs / state.** Wallet connection state (managed by `@solana/wallet-adapter-react`).

**Primary actions.**
- Connect Phantom / Solflare / Backpack
- After connect: role tile grid (Borrower / Lender / Custodian / Appraiser)
- "Continue" routes to `/borrow`, `/lend`, `/custodian`, `/appraiser` respectively

**Components.**
- `<WalletMultiButton>` from wallet-adapter-react-ui
- Custom `<RoleTileGrid>` — 4 tiles, icon + label + one-line description
- Network badge (top-right, always visible: "DEVNET")

**Integration.** Wallet adapter. Sign-in-with-Solana (SIWS) message signing to bind wallet → role in local session (not on-chain; this is a client-side role assertion only for routing UX).

**Success.** Wallet connected, role selected, user routed.

**Error.** Wallet not installed → inline install-Phantom CTA. Wallet rejected connection → inline retry.

**Demo relevance.** Moments 1 (lender) and 2 (borrower) begin here. Must work with pre-funded demo wallet without user-typed input.

---

### 4.3 Borrower Home — `/borrow` 🎬

**Purpose.** Borrower's dashboard. Shows active loans with quick-action entry points.

**Entry.** From `/connect` after role selection, or direct URL if wallet already connected.

**Inputs / state.**
- Connected wallet pubkey (required — redirects to `/connect` if absent).
- Fetches all TRDC cNFTs owned by or referencing this wallet.

**Primary actions.**
- "Request a new loan" → `/borrow/new/asset` (primary CTA, top-right)
- Click any active loan card → `/borrow/loans/[trdc]`

**Components.**
- Empty state (no loans): CTA card with illustration + "Request your first loan" button
- Loan list: grid of `<LoanCard>` components
- `<LoanCard>`: TRDC state badge, asset photo thumbnail, loan amount, days remaining, next payment due, quick-action button (Pay / Renew / View)

**Integration.**
- `getCompressedNftsByOwner()` via Bubblegum read client
- Off-chain supplementary fetch (Supabase): asset photo URLs, appraisal metadata not stored on-chain

**Success.** Loan cards render <1s after wallet connect.

**Error.** Fetch fails → retry button; no crash. Wallet disconnects mid-session → redirect to `/connect` with banner.

**Demo relevance.** Demo moment 5 (repayment) originates here.

---

### 4.4 New Loan Wizard — Step 1: Asset Submission `/borrow/new/asset` 🎬

**Purpose.** Borrower describes and photographs the asset. This triggers appraisal request creation.

**Entry.** Click "Request a new loan" from `/borrow`.

**Inputs / state.** Wizard state (persisted in URL search params + React Context):
- Asset category (enum: `watch` only for Phase 0 demo; jewelry/art/vehicle disabled with "Phase 0.5+" badge)
- Brand (Rolex, AP, Patek, IWC, Panerai, Vacheron — dropdown from §3.5 eligibility whitelist)
- Model / reference number (text)
- Year (number)
- Papers / box available (yes/no/partial)
- Condition (dropdown: Mint / Excellent / Good / Fair)
- Photo uploads (min 4: dial / caseback / side / papers) — stored to IPFS via web3.storage
- Desired loan amount (BRL or USDC — toggle)

**Primary actions.**
- "Continue to appraisal" — validates form, creates off-chain `AppraisalRequest` record, navigates to `/borrow/new/appraisal/[reqId]`

**Components.**
- `<WizardProgressBar>` (Steps 1 / 2 / 3 / 4 visible at top)
- React Hook Form + Zod schema for validation
- `<ImageUploadGrid>` — drag-drop, preview, IPFS upload with progress
- `<CurrencyToggleInput>` for loan amount
- Eligibility-filter helper panel (right sidebar): "We're accepting: Rolex Submariner, Daytona, GMT-Master; AP Royal Oak; Patek Nautilus / Aquanaut; …" (mirrors §3.5)

**Integration.**
- Supabase: create `AppraisalRequest` row
- web3.storage: IPFS upload for photos
- No on-chain call yet — appraisal request is off-chain until triangular convergence

**Success.** Navigates to Step 2 with `reqId` in URL.

**Error.** Validation errors surface inline. Upload failures → retry per-photo. Supabase error → toast with support contact.

**Demo relevance.** Moment 2 start. Demo script: submits a Rolex Submariner pre-photographed asset; submission takes ~15s.

---

### 4.5 New Loan Wizard — Step 2: Appraisal Progress `/borrow/new/appraisal/[reqId]` 🎬

**Purpose.** Shows triangular appraisal converging in real time. Three appraisals arrive asynchronously; frontend polls.

**Entry.** From Step 1 on submit.

**Inputs / state.**
- `AppraisalRequest` fetched by `reqId`
- Polls every 3s for appraisal updates
- Demo mode: polling accelerated to 1s and appraisals pre-scripted to return within 15s total (admin demo flag)

**Primary actions.**
- "Continue to terms" (enabled only after all three appraisals arrive AND converge within spread tolerance)
- If divergence >20% between appraisals → "Request manual review" (demo-only: skipped path; live message explains triangular-divergence protocol from §3.2)

**Components.**
- Three `<AppraisalCard>` tiles (Remote Expert / In-Person Specialist / Market Anchor)
  - Each has: status (Pending / In Progress / Submitted), value submitted, timestamp, redacted appraiser ID
- `<ConvergenceIndicator>` — shows spread between three values as colored bar (green: <10% spread, yellow: 10–20%, red: >20%)
- `<AppraisalSummary>` footer: median value, confidence band, proposed max LTV

**Integration.**
- Supabase: poll appraisal submissions for this `reqId`
- Market anchor: fetch from Chrono24/WatchCharts (hackathon: **mocked** — returns a pre-scripted value matched to the submitted asset). Production: real API with caching.

**Success.** All three appraisals arrive, convergence indicator green, Continue button enabled.

**Error.** Divergence detected → surface divergence message with explanation of audit path. Polling timeout (>5 min in demo mode) → retry.

**Demo relevance.** Moment 2 mid-sequence. The convergence animation is visually compelling — judges see the three-appraiser model work in real time.

---

### 4.6 New Loan Wizard — Step 3: Terms Review & Accept `/borrow/new/terms/[reqId]` 🎬

**Purpose.** Shows computed loan terms, CCB preview, and executes on-chain TRDC minting on accept.

**Entry.** From Step 2 on convergence.

**Inputs / state.**
- `AppraisalRequest` with median value
- Computed terms (client-computed from shared TypeScript library `@vaulx/terms`):
  - Appraised value
  - Max LTV 50% (Phase 0) / 60% (Phase 0 stretch with merchant-partner)
  - Loan amount (min of requested and max LTV)
  - Term: 120 days
  - Borrower APR: 2.2%/month (Base Case)
  - Monthly interest amount
  - Origination fee: 2.5%
  - Partner share: 20%
  - Net proceeds to borrower

**Primary actions.**
- "Accept terms & mint TRDC" — triggers wallet signature for `create_ccb_trdc` instruction
- "Modify loan amount" → editable slider (within LTV bounds)

**Components.**
- `<LoanTermsTable>` — all computed values, aligned right, with tooltips
- `<CCBPreview>` — scrollable inline view of CCB document (PDF render via react-pdf; document hash displayed prominently as this is what gets minted on-chain)
- `<FiduciaryAlienationNotice>` — plain-language explainer: "You retain ownership; the asset is held in custody; non-repayment triggers extrajudicial recovery under DL 911/69."
- `<AcceptButton>` — large primary, disabled until user scrolls to bottom of CCB preview

**Integration.**
- Client-side CCB PDF generation (pdf-lib or react-pdf), hash computed with `crypto.subtle.digest`
- On accept: `@coral-xyz/anchor` client calls `create_ccb_trdc(ccb_hash, ccb_external_id, custodian_id, loan_amount, due_ts, ...)` on the Loan Program
- Wallet signs transaction; frontend awaits confirmation
- On confirmation: TRDC mint address becomes the loan identifier

**Success.** Transaction confirmed, TRDC minted with state `PENDING_CUSTODY`, navigate to Step 4 with `[trdc]` mint.

**Error.** Wallet reject → inline retry. Transaction failure (insufficient SOL for fees) → airdrop helper link (Devnet faucet). Timeout → check Explorer for status.

**Demo relevance.** Moment 2 climax — the `create_ccb_trdc` call is the moment the loan enters the protocol. Explorer link surfaced immediately.

---

### 4.7 New Loan Wizard — Step 4: Awaiting Custody `/borrow/new/awaiting-custody/[trdc]` 🎬

**Purpose.** Shows TRDC in `PENDING_CUSTODY` state, explains next step to borrower, waits for custodian `confirm_custody`.

**Entry.** From Step 3 on successful mint.

**Inputs / state.**
- TRDC cNFT fetched by mint address
- Polls every 2s for state transition to `ACTIVE`
- Demo mode: polling accelerated; scripted custodian action fires within 10s when admin clicks "Advance demo" on `/admin/demo`

**Primary actions.**
- "Print custody dropoff instructions" → PDF with QR code containing TRDC mint + custodian ID
- Passive wait for state change

**Components.**
- Large status badge: `PENDING_CUSTODY` in amber
- Instructional checklist:
  1. ✓ TRDC minted on-chain (link to Explorer)
  2. ◯ Deliver asset to custody partner — address block
  3. ◯ Custodian confirms custody on-chain
  4. ◯ Stablecoin disbursed to your wallet
- `<TRDCCard>` with full metadata (ccb_hash, custodian_id, loan_amount, due_ts — all click-to-copy)
- Live-polling spinner on step 3

**Integration.**
- Anchor account read: fetch TRDC PDA
- Poll for `status` field change

**Success.** Status transitions `PENDING_CUSTODY → ACTIVE`. Auto-navigate to `/borrow/loans/[trdc]` with celebration toast.

**Error.** If status stays pending >48h (production) / >60s (demo) → surface custodian contact + escalation path.

**Demo relevance.** Moments 3 and 4 originate here — this screen transitions visibly when custodian confirms (Moment 3) and disburse completes (Moment 4). The screen is on-camera for 15–20 seconds of the demo.

---

### 4.8 Active Loan Detail — `/borrow/loans/[trdc]` 🎬

**Purpose.** Borrower's single source of truth for an active loan. Shows state, balance, upcoming payment, history.

**Entry.** From `/borrow` loan card, or from successful mint/disburse.

**Inputs / state.**
- TRDC fetched by mint
- Off-chain: CCB document link (IPFS), asset photos, appraisal record
- Payment schedule computed client-side from `due_ts` + monthly installment count (4 months)

**Primary actions.**
- "Pay monthly installment" (primary, shown only if payment due within 30 days) → `/borrow/loans/[trdc]/pay`
- "Renew loan" (shown only if within renewal window Day 90–120) → `/borrow/loans/[trdc]/renew`
- "Repay in full" (always available) → `/borrow/loans/[trdc]/repay`
- "Download CCB" (secondary) → IPFS fetch
- "View asset details" (secondary) → collapsible with photos + appraisal

**Components.**
- Status hero: state badge + loan amount + days remaining (countdown)
- Payment schedule table (4 rows: installments 1–4 with due dates, amounts, paid/pending status)
- Transaction history timeline (all on-chain events: mint, custody confirm, disburse, payments, renewal if any)
- `<RenewalPromptCard>` — appears Day 60+ per §3.7 retention mechanics
- `<EarlyRenewalIncentiveBanner>` — appears Day 90–120: "Renew now and save R$93 on origination fee"

**Integration.**
- TRDC state polling (low-frequency, 15s) for updates
- Explorer links on every transaction row
- Anchor reads for payment ledger (interest accrued, principal outstanding)

**Success.** Renders complete state; all actions reachable.

**Error.** TRDC not found → 404 with "Back to loans". State out of sync → force refetch.

**Demo relevance.** Moment 4 end state (disburse completed, user sees balance update). Moment 5 launches from "Pay monthly installment" or "Repay in full". Moment 7 (renewal) launches from `<RenewalPromptCard>`.

---

### 4.9 Monthly Payment `/borrow/loans/[trdc]/pay` 🎬

**Purpose.** Execute a monthly interest payment on an active loan.

**Entry.** From loan detail "Pay monthly installment" CTA.

**Inputs / state.**
- TRDC with current accrued interest
- Installment number (1, 2, 3, or 4)
- Computed amount: monthly interest = principal × 2.2%

**Primary actions.**
- "Confirm payment" — triggers wallet sign on `pay_installment` instruction
- "Cancel" — back to loan detail

**Components.**
- Payment summary card (installment #, amount due, wallet balance check)
- Warning banner if wallet balance insufficient (with Devnet faucet link in demo mode)
- Transaction preview (estimated fee in SOL)

**Integration.**
- Anchor: `pay_installment(trdc_mint, amount)`
- Wallet signature
- On success: TRDC `last_payment_ts` updates, installment #X marked paid

**Success.** Toast with Explorer link; navigate back to loan detail with updated schedule.

**Error.** Wallet reject, insufficient funds, network error — all handled with retry.

**Demo relevance.** Shortcut version of Moment 5 (single installment vs. full repayment).

---

### 4.10 Full Repayment `/borrow/loans/[trdc]/repay` 🎬

**Purpose.** Close the loan by repaying principal + remaining interest. Transitions TRDC to `REPAID`.

**Entry.** From loan detail "Repay in full" CTA.

**Primary actions.**
- "Confirm full repayment" — wallet signs `repay_ccb` on Loan Program; Loan Program CPIs to Vault Program returning principal+interest; TRDC transitions `ACTIVE → REPAID`
- "Cancel" → loan detail

**Components.**
- Final settlement breakdown: principal + accrued interest + any late fee
- Asset return instructions (redacted custodian handoff protocol)
- Confirm button

**Integration.**
- Anchor: `repay_ccb(trdc_mint)` with CPI to Vault Program
- Explorer link on success

**Success.** TRDC state = `REPAID`; redirect to `/borrow` with celebratory toast; asset release instructions email sent (mocked for demo).

**Error.** Amount mismatch (rare race condition with late interest accrual) → refresh and retry.

**Demo relevance.** **Moment 5** — the repayment event. Vault's ATA balance in lender view goes above initial deposit (yield earned).

---

### 4.11 Renewal Flow `/borrow/loans/[trdc]/renew` 🎬

**Purpose.** Extend the loan by one cycle. Borrower pays only accrued interest, signs amendment hash, TRDC state cycles `ACTIVE → RENEWED → ACTIVE` with new `due_ts`.

**Entry.** From `<RenewalPromptCard>` on loan detail, Day 60+ per §3.7.

**Primary actions.**
- "Renew for 120 more days" — triggers `renew_ccb`; amendment CCB PDF generated client-side, hash signed on-chain
- "Cancel renewal" → loan detail

**Components.**
- Renewal terms summary: new due date, interest-only payment due now, new accrued interest schedule
- `<EarlyRenewalBanner>` (if Day 90–120): "10% origination fee waived — saves R$93"
- Amendment CCB preview
- Cost comparison: Renew (current flow) vs. Pay off + re-originate (shows CAC cost of churn)

**Integration.**
- Client-side amendment CCB generation + hash
- Anchor: `renew_ccb(trdc_mint, amendment_hash, new_due_ts)` — state transitions `ACTIVE → RENEWED → ACTIVE` within a single instruction (atomic)

**Success.** TRDC `due_ts` updated; redirect to loan detail; timeline shows new renewal event.

**Error.** Hash mismatch, wallet reject, network — standard retry patterns.

**Demo relevance.** **Moment 7 score-point** — the margin-lever made visible. No new appraisal, no new custody intake. On-screen annotation: "Renewal saves ~R$670 per event. The business compounds through retention."

---

### 4.12 Lender Home / Vault Selector `/lend` + `/lend/vaults` 🎬

**Purpose.** Lender's entry to the protocol. Shows active positions (if any) and the four vaults at launch.

**Entry.** From `/connect` as lender role.

**Inputs / state.**
- Wallet pubkey
- On-chain reads: all vault states (4 vaults), lender's current positions

**Primary actions.**
- Click vault card → `/lend/vaults/[id]`
- "View my positions" → `/lend/positions`
- "Browse auctions" → `/lend/auctions`

**Components.**
- Portfolio summary strip (TVL deposited, accrued yield, positions count)
- Vault grid (4 cards):
  - **Institutional-USDC** (active, accepting deposits)
  - **Institutional-BRL** (active, BRZ-denominated)
  - **Retail-FIDC-USDC** (demo-only toggle: "Active via FIDC wrapper" — mocked for hackathon)
  - **Retail-FIDC-BRL** (same)
- Each `<VaultCard>`: TVL, current APY, borrower count, historical default rate, deposit CTA

**Integration.**
- Anchor: `getVaultAccounts()` batched read
- Compute APY from vault share appreciation over rolling 30d (demo: hardcoded 11%)

**Success.** Renders in <1s; all vaults visible.

**Error.** Chain RPC error → fallback to cached values with "Chain offline" banner (hackathon: unlikely on Devnet).

**Demo relevance.** **Moment 8 score-point** — the multi-currency architecture. Visually shows all four vaults deployed from identical code with different PDA seeds.

---

### 4.13 Vault Detail + Deposit `/lend/vaults/[id]` 🎬

**Purpose.** Execute a deposit into a specific vault.

**Entry.** From vault selector.

**Inputs / state.**
- Vault account fetched by PDA
- Lender's token balance in matching mint (USDC or BRZ)
- KYC status (from Civic Pass; **mocked in demo**)

**Primary actions.**
- "Deposit" — amount input, wallet signs `deposit` on Vault Program
- "Cancel" → vault selector

**Components.**
- Vault stats panel (TVL, APY, borrower count, deposit cap if any)
- `<KYCStatusBadge>` — shows Verified (mocked) or Start Verification
- `<DepositForm>` — amount input with max button, estimated position share, estimated yield @ current APY
- Terms checkbox: "I understand this is Devnet; no real capital is at risk."

**Integration.**
- Anchor: `deposit(vault_pda, amount)` — transfers tokens to vault ATA, mints share token to lender
- Civic Pass: **mocked** — 3-second loading animation then "Verified"; production wires real SDK

**Success.** Transaction confirmed, position created, redirect to `/lend/positions/[id]` with Explorer link.

**Error.** Standard wallet retry patterns.

**Demo relevance.** **Moment 1** — two lenders deposit USDC; vault balance goes from $0 to $30K. This screen is on-camera for this moment.

---

### 4.14 Lender Positions `/lend/positions` + `/lend/positions/[id]` 🏗️

**Purpose.** Lender's portfolio view. Individual position detail + withdraw.

**Entry.** From lender home or direct navigation.

**Inputs / state.** Lender's share-token balances across all 4 vaults.

**Primary actions.**
- Click position → detail
- On detail: "Withdraw" (with amount selector)

**Components.**
- Positions table: vault name, position value, current share, accrued yield (since deposit), deposit date
- Detail view: deposit history, yield accrual graph (simple recharts line), withdraw CTA

**Integration.**
- Anchor read: share-token balances; vault state for share-to-underlying conversion

**Success.** Position values compute correctly and match on-chain.

**Error.** Stale read → refetch button.

**Demo relevance.** End state of Moment 5 — lender sees their position value increase after borrower repayment.

---

### 4.15 Auction List + Detail `/lend/auctions` + `/lend/auctions/[id]` 🎬

**Purpose.** Whitelisted lenders (institutional deposits or lenders who've held positions for >X days) see privileged auctions on defaulted assets. Bid interface.

**Entry.** From lender home.

**Inputs / state.**
- Auction accounts (one per `DEFAULTED` TRDC)
- Lender whitelist status (fetched from auction account)

**Primary actions.**
- On list: click auction card → detail
- On detail: "Place bid" with amount input

**Components.**
- Auction list: asset photo, M3 market anchor value, current highest bid, time remaining
- Auction detail: full asset info, appraisal history, CCB link, bid history, bid form
- Whitelist status banner (Whitelisted: You can bid / Not whitelisted: public market opens in Xh)

**Integration.**
- Anchor: `place_bid(auction_pda, amount)` for whitelisted
- Read auction state for bid history

**Success.** Bid placed; auction state updates; user sees their bid in history.

**Error.** Not whitelisted → clear message. Bid below minimum → inline validation.

**Demo relevance.** **Moment 9 score-point** — default execution → auction → bid clears below M3 → proceeds return to vault → 5% liquidation fee accrues.

---

### 4.16 Custodian Queue + Intake `/custodian` + `/custodian/intake/[trdc]` 🎬

**Purpose.** Custodian sees pending intakes and signs `confirm_custody` for each.

**Entry.** Custodian wallet connects; role = custodian.

**Inputs / state.**
- TRDCs in state `PENDING_CUSTODY` where `custodian_id` matches connected wallet
- In demo mode: single-custodian wallet hardcoded; shows all Phase 0 pending TRDCs

**Primary actions.**
- On queue: click intake card → detail
- On detail: "Confirm physical intake" — triggers `confirm_custody` transaction

**Components.**
- Queue table: TRDC mint, borrower wallet (redacted), asset category, loan amount, appraisal value, submission timestamp
- Intake detail: photo grid (IPFS), appraisal record, CCB hash (click to verify), check-in timestamp (now), physical location dropdown (São Paulo vault options)
- Confirm button (primary, large)

**Integration.**
- Anchor read: `getTRDCsByStatus(PENDING_CUSTODY)` with `custodian_id` filter
- Anchor write: `confirm_custody(trdc_mint)` — state transitions `PENDING_CUSTODY → ACTIVE`

**Success.** TRDC flips to `ACTIVE`; auto-triggered CPI in Loan Program runs `disburse_ccb` (this is the atomic chain; frontend polls and shows the disburse tx shortly after).

**Error.** Wrong custodian → access denied. Transaction failure → standard retry.

**Demo relevance.** **Moment 3** — the critical state transition. On camera for ~10 seconds. Audio cue: "And here's the single line of code that every RWA protocol promises and only Vaulx enforces."

---

### 4.17 Appraiser Queue + Submission `/appraiser` + `/appraiser/appraise/[reqId]` 🏗️

**Purpose.** Appraiser submits a valuation for an assigned appraisal request.

**Entry.** Appraiser wallet connects; role = appraiser.

**Inputs / state.** Assigned `AppraisalRequest` records where `appraiser_id` matches.

**Primary actions.**
- On queue: click request → submission form
- On form: submit valuation (value + optional notes + confidence score)

**Components.**
- Queue table: request ID, asset description, deadline
- Submission form: asset preview (photos + metadata from Step 1), value input (BRL), confidence slider, notes
- Submit button

**Integration.**
- Supabase: write appraisal submission row (NOT on-chain; triangular convergence happens off-chain first, only the converged median is used for on-chain LTV computation)

**Success.** Submission recorded; appraiser redirected to next in queue.

**Error.** Validation (value out of expected range) → warning but allow submit.

**Demo relevance.** Low — demo uses scripted pre-submitted appraisals. This exists for completeness; judges can click through if curious.

---

### 4.18 Admin: State Machine Viewer `/admin/state-machine` 🎬

**Purpose.** Visual rendering of the TRDC seven-state machine with live counts of TRDCs in each state.

**Entry.** Admin wallet connect; pubkey-whitelisted.

**Inputs / state.** All TRDCs on Devnet, grouped by status.

**Primary actions.** Click any state node → list of TRDCs in that state (with click-through to individual TRDC detail at `/trdc/[mint]`).

**Components.**
- SVG-based state machine diagram (7 nodes: PENDING_CUSTODY, ACTIVE, RENEWED, REPAID, OVERDUE, DEFAULTED, LIQUIDATED + transitions)
- Each node shows live count
- Active transitions animate briefly when state changes occur in real-time

**Integration.** Anchor: batched TRDC reads grouped by status, polled every 10s.

**Success.** Diagram renders; counts update live.

**Error.** Polling failure → "Reconnecting" banner.

**Demo relevance.** Useful for judge walkthrough. Also serves as fallback if Moment 9 (default auction) is cut per cut-order in §3.6 — the state diagram can be shown statically while verbal explanation runs.

---

### 4.19 Admin: Failing Test Viewer `/admin/tests` 🎬 CRITICAL

**Purpose.** The single most important demo artifact. Shows the Anchor test suite running live with the custody-gate test failing as expected.

**Entry.** Admin route or direct URL shared with judges.

**Inputs / state.** Test runner output from the Anchor test suite, streamed to the frontend.

**Primary actions.**
- "Run test suite" — triggers a backend endpoint that runs `anchor test --skip-local-validator --skip-build` against Devnet and streams stdout/stderr to the browser via SSE
- "View test source" — collapsible code blocks showing the test TypeScript for each named test

**Components.**
- Test list with status (pass/fail) — each test expandable
- Critical tests called out visually:
  - `test_disburse_fails_when_custody_not_confirmed` — expected: fails with `CustodyNotConfirmed`
  - `test_disburse_fails_with_unauthorized_caller` — expected: fails with `UnauthorizedCaller`
  - `test_happy_path_end_to_end` — expected: passes
- Terminal-style output pane (monospace font, scrolling)
- On-screen annotation panel: "These two failing tests prove the custody gate and CPI caller validation are enforced in code, not in process."

**Integration.**
- Backend: Next.js API route that spawns `anchor test` child process and streams via SSE
- Frontend: `EventSource` subscription; renders ANSI color codes to CSS

**Success.** Test runs, expected-pass tests pass, expected-fail tests fail with exact error names visible in the terminal output.

**Error.** Test environment misconfiguration → fallback to pre-recorded test run video (static asset served from `/public/demo/test-run.mp4`).

**Demo relevance.** 🎬🎬🎬 **The mission-critical frame.** Moment 6. This closes the demo. The failing-test visualization IS the Vaulx differentiator on screen. Must work flawlessly; fallback video is mandatory backup.

---

### 4.20 Admin: Default Execution `/admin/default/[trdc]` 🎬

**Purpose.** Demo-only: manually advance a TRDC to `DEFAULTED` for Moment 9.

**Entry.** Admin route, specific TRDC from state-machine viewer.

**Primary actions.**
- "Mark overdue" — transitions `ACTIVE → OVERDUE` (normally cron-driven, here manual)
- "Execute default" — triggers Squads 2/3 multisig signature simulation, transitions `OVERDUE → DEFAULTED`, opens auction account

**Components.**
- Current TRDC state + forced transition controls
- Multisig signature visualization (2-of-3 signers with mock signatures in demo mode)
- Confirmation modal with warning: "This is an irreversible on-chain state change. In production this requires real multisig signatures."

**Integration.**
- Anchor: `mark_overdue(trdc_mint)`, `execute_af_default(trdc_mint)` (demo-mode admin can bypass multisig via a feature flag; production uses Squads)
- On default execution, Auction PDA created

**Success.** TRDC `DEFAULTED`; auction visible at `/lend/auctions/[id]`.

**Error.** State guards prevent invalid transitions — surfaced inline.

**Demo relevance.** **Moment 9 launcher.** Cuttable per §3.6 cut order.

---

### 4.21 Admin: Demo Control `/admin/demo` 🎬

**Purpose.** Operator cockpit for driving the demo video recording. Centralizes scripted actions so the demo runs deterministically.

**Entry.** Admin route.

**Primary actions.** Six "Advance Demo" buttons aligned to the six core moments:
1. "Run Moment 1: Two lenders deposit" — triggers backend script that uses two demo wallets to deposit USDC
2. "Run Moment 2: Borrower requests loan" — impersonates borrower wallet (demo mode only) to submit through the wizard end-to-end
3. "Run Moment 3: Custodian confirms" — executes `confirm_custody` on the pending TRDC
4. "Run Moment 4: Disburse auto-executes" (usually automatic on Moment 3 — this is a no-op safety button)
5. "Run Moment 5: Borrower repays" — impersonates borrower to repay
6. "Run Moment 6: Failing test" — navigates to `/admin/tests` and auto-runs suite

Additional:
- "Reset demo state" — rolls back all demo-scoped accounts to initial state (seeds vaults, clears TRDCs, refunds demo wallets on Devnet)
- "Accelerate time" — fast-forwards timestamp in demo-mode accounts (for maturity triggers)

**Components.**
- Six numbered buttons
- Current-state indicator for each (Ready / Running / Done / Error)
- Log pane showing last 20 actions with timestamps and transaction signatures

**Integration.**
- Backend: demo-control API routes that execute scripted flows using server-held keypairs (Devnet only; no real funds)
- `anchor` client + pre-funded demo wallets

**Success.** Operator clicks 1-2-3-4-5-6 in sequence; demo unfolds on the main browser window (which is being screen-recorded); transactions visible in real time.

**Error.** Any step fails → red status, retry option; operator can manually execute via admin UI as fallback.

**Demo relevance.** This is the operator's remote-control during the 3-minute video recording. Not on-screen itself (judges never see this), but mission-critical for the recording session.

---

### 4.22 Public: TRDC Detail `/trdc/[mint]` 🏗️

**Purpose.** Shareable public view of any TRDC. Judges can paste a mint address and see the credit instrument rendered.

**Entry.** Direct URL; no wallet required.

**Inputs / state.** TRDC account fetched by mint; CCB document fetched from IPFS by hash.

**Components.**
- TRDC metadata card (all on-chain fields)
- CCB document preview (PDF render)
- Transaction history
- Asset information (off-chain supplementary data)
- Explorer link to mint

**Integration.** Anchor read + IPFS fetch.

**Demo relevance.** Linkable from Explorer during judge review after the demo video.

---

### 4.23 Public: Transaction Viewer `/tx/[signature]` 🏗️

**Purpose.** Wraps Solana Explorer for a branded in-app transaction view. Shows the Vaulx-specific context around a transaction.

**Entry.** Every toast-link throughout the app → this route; "View on Explorer" button → external Explorer.

**Components.**
- Transaction summary (instruction name, accounts, result)
- Linked TRDC if relevant
- Explorer outbound link

**Demo relevance.** Reinforces on-chain verifiability throughout the demo.

---

## 5. Shared components library

Implemented once, reused across all screens. Directory suggestion: `components/ui/` (shadcn primitives) + `components/vaulx/` (domain components).

| Component | Purpose | Used in |
|---|---|---|
| `<AppShell>` | Navbar + footer + wallet status + network badge | All authenticated routes |
| `<WalletConnectButton>` | Wrapper around `WalletMultiButton` with role theming | AppShell |
| `<RoleSwitcher>` | Dropdown for users who hold multiple roles | AppShell (debug mode) |
| `<TRDCCard>` | Canonical TRDC display: state badge, metadata, actions | Borrower home, loan detail, admin |
| `<StateBadge>` | Colored pill for the 7 TRDC states (semantic colors: amber pending, green active, blue renewed, gray repaid, orange overdue, red defaulted, purple liquidated) | TRDCCard, tables, state machine |
| `<VaultCard>` | Vault summary: TVL, APY, deposit count | Lender home, vault selector |
| `<LoanCard>` | Borrower's loan summary with quick actions | Borrower home |
| `<AppraisalCard>` | Single-appraiser status tile | Appraisal progress screen |
| `<ConvergenceIndicator>` | Spread-between-appraisals visual | Appraisal progress |
| `<CCBPreview>` | PDF renderer for CCB documents | Terms screen, loan detail |
| `<CurrencyToggleInput>` | Amount input with USDC/BRL toggle and live FX convert | Loan request, deposit, auction bid |
| `<CurrencyDisplay>` | Read-only amount display with currency-aware formatting | Everywhere amounts appear |
| `<TransactionToast>` | Success toast with Explorer link | Every write action |
| `<CivicKYCModal>` | KYC gate (mocked in demo) | Vault deposit |
| `<WizardProgressBar>` | 4-step loan wizard indicator | New loan wizard |
| `<ImageUploadGrid>` | Multi-photo IPFS upload with previews | Asset submission |
| `<TimelineList>` | Vertical timeline for transaction history | Loan detail, auction detail |
| `<StateMachineDiagram>` | SVG state-machine with live counts | Admin state-machine viewer |
| `<TestRunner>` | Live-streaming Anchor test output | Admin tests |
| `<DemoControlPanel>` | Operator buttons for Moments 1-6 | Admin demo |
| `<EmptyState>` | Standard empty-state card with illustration + CTA | Borrower home, lender positions |
| `<ErrorBoundary>` | Catches render errors, shows fallback | Root layout |

**Design system.** shadcn/ui primitives customized with Vaulx palette. Primary color: a trust-signaling deep blue (`#0B2E4F`) with a contrast accent (warm gold `#C9A961`) for CTAs. Typography: Inter (body) + a slightly more distinctive sans for headings (Manrope or Plus Jakarta). No decorative elements; operator aesthetic over design-forward aesthetic.

---

## 6. Integration layer

### 6.1 On-chain integrations

| Integration | Library | Purpose |
|---|---|---|
| Solana wallet connect | `@solana/wallet-adapter-react`, `@solana/wallet-adapter-react-ui`, `@solana/wallet-adapter-wallets` | Borrower/lender/custodian/appraiser/admin wallet connections |
| Anchor program calls | `@coral-xyz/anchor` | All Loan Program, Vault Program, TRDC program interactions |
| Compressed NFT reads | `@metaplex-foundation/mpl-bubblegum` | TRDC cNFT fetch by owner / by mint |
| RPC provider | Helius (Devnet API key) | Reliable RPC + cNFT indexing (DAS API) |
| Explorer linking | Custom helper `getExplorerUrl(signature, 'devnet')` | Every transaction link |
| Squads multisig | `@sqds/multisig-sdk` (mocked in demo) | Default execution 2-of-3 signature — simulated in demo mode |
| Civic Pass | `@civic/solana-gateway-react` (mocked in demo) | KYC gate on deposits |

### 6.2 Off-chain integrations

| Integration | Service | Purpose |
|---|---|---|
| Appraisal record store | Supabase | `AppraisalRequest`, `AppraisalSubmission` rows; user profiles; asset metadata |
| Photo / document storage | IPFS via web3.storage | Asset photos, CCB document PDFs |
| Market anchor oracle | Chrono24 / WatchCharts (mocked in demo) | Third of three appraisals |
| Transaction analytics | PostHog or Plausible (optional) | Demo telemetry for judge session analysis |
| SSE transport | Next.js API routes with `ReadableStream` | Test runner output streaming |

### 6.3 Shared TypeScript libraries

Create a `packages/` workspace with:

- `@vaulx/anchor-client` — typed Anchor IDL client for Loan, Vault, TRDC programs
- `@vaulx/terms` — pure functions for computing loan terms (LTV, interest, origination fee, partner share) — same code used on Terms screen and in tests
- `@vaulx/ccb` — CCB document generation (pdf-lib) + hash computation
- `@vaulx/types` — shared types (TRDC state enum, currency enum, role enum)

Keeping business logic in shared libraries prevents drift between client-computed values and the authoritative Anchor program logic.

---

## 7. Demo choreography — the 3-minute recording

This section maps every demo moment from §3.6 of the canonical spec to specific screens and actions. This is the choreography sheet for the recording session.

### Pre-recording setup (not on camera)
- Admin opens `/admin/demo`, clicks "Reset demo state" — seeds vaults with $0, clears all TRDCs, refunds two demo lender wallets with USDC, one borrower wallet with SOL for fees.
- Recording starts on `/` landing.

### Moment-by-moment

| Time | Moment | Screen path | Action | On-screen annotation |
|---|---|---|---|---|
| 0:00–0:10 | Intro | `/` landing | Narrator: "Vaulx is…" | Tagline overlay |
| 0:10–0:30 | **Moment 1** Lender deposits | `/lend/vaults/institutional-usdc` → success | Two deposits of $15K each via Demo Control | "On-chain deposit. Explorer confirmed." |
| 0:30–1:00 | **Moment 2** Borrower requests loan | `/borrow/new/asset` → `/appraisal/[reqId]` → `/terms/[reqId]` → `/awaiting-custody/[trdc]` | Submit Rolex Submariner; scripted appraisal convergence in 15s; accept terms; TRDC mints | "Appraisal convergence: 3 independent sources." "TRDC minted. PENDING_CUSTODY." |
| 1:00–1:15 | **Moment 3** Custodian confirms | `/custodian/intake/[trdc]` → `confirm_custody` tx | Custodian wallet auth; click Confirm | "PENDING_CUSTODY → ACTIVE. The critical state transition." |
| 1:15–1:25 | **Moment 4** Disburse auto-executes | `/borrow/loans/[trdc]` (auto-navigated) | Visible USDC arrival in borrower wallet | "CPI: Loan Program → Vault Program. Disburse unlocks only when custody = ACTIVE." |
| 1:25–1:45 | **Moment 5** Borrower repays | `/borrow/loans/[trdc]/repay` → success | Confirm repayment; vault TVL ticks above initial $30K | "Lenders earned yield. Vault share value up." |
| 1:45–2:10 | **Moment 7** Renewal (score-point) | Second borrower, `/borrow/loans/[trdc2]/renew` | Amendment signed; state cycles ACTIVE → RENEWED → ACTIVE | "No new appraisal. No new custody. +R$670 contribution." |
| 2:10–2:25 | **Moment 8** Multi-currency (score-point) | `/lend/vaults` four-card grid | Camera pans across all 4 vaults | "Four vaults, one codebase. Same audit. Cross-currency native." |
| 2:25–2:45 | **Moment 9** Default (score-point) | `/admin/default/[trdc3]` → `/lend/auctions/[id]` | Forced default; auction opens; whitelisted lender bids below M3; bid clears | "Default turned into yield-plus-optionality for lenders." |
| 2:45–3:00 | **Moment 6** Failing test (closer) | `/admin/tests` | Test suite runs; custody-gate test fails as expected with `CustodyNotConfirmed` | "Every RWA protocol promises this. Vaulx enforces it in code." |

**Cut order if build time slips** (per §3.6): drop Moment 9 first (describe verbally), then Moment 8 (static slide), then Moment 7 (terminal log). Core six (1, 2, 3, 4, 5, 6) never cut.

---

## 8. Tech stack

**Framework.** Next.js 14 with App Router. Rationale: server components for fast initial loads, API routes for SSE and backend actions, Vercel deployment in one command.

**Styling.** Tailwind CSS + shadcn/ui. Rationale: component primitives are production-grade out of the box; shadcn gives us Dialog/Toast/Form/Table/Card/Badge without building from scratch; Tailwind lets us customize without fighting CSS-in-JS overhead.

**State / data.**
- TanStack Query (React Query) for all server/chain reads — caching, refetch, polling built in
- Zustand for client-only UI state (wizard progress, modal open/close)
- React Hook Form + Zod for all forms

**Solana.**
- `@solana/wallet-adapter-react` + `-react-ui` + `-wallets` (Phantom, Solflare, Backpack)
- `@coral-xyz/anchor` for program interaction
- `@metaplex-foundation/mpl-bubblegum` for cNFT reads
- Helius RPC (Devnet API key, DAS API for cNFT indexing)

**Backend-ish (all within Next.js API routes).**
- Supabase client for off-chain data
- web3.storage for IPFS
- SSE endpoint for test runner streaming
- Demo-control endpoints with server-held keypairs (Devnet only)

**Deployment.** Vercel (main frontend) + Supabase (managed DB) + web3.storage (managed IPFS). No custom infra; everything one command away.

**Dev tooling.** pnpm workspace, TypeScript strict, ESLint + Prettier, Playwright for one end-to-end test covering Moments 1-5 in a headless browser (failure of this test blocks the daily deploy).

---

## 9. Non-functional requirements

- **Performance.** Landing page Lighthouse performance ≥90 (desktop). Authenticated screens can be ≥75. Initial bundle <300KB. Largest Contentful Paint <2s on Fast 3G.
- **Accessibility.** WCAG AA for buttons and forms; not aggressive beyond that given hackathon scope.
- **Responsive.** Desktop-first (1440px design target). Tablet (768px) readable. Mobile (375px) viewable but not styled to production quality. Demo is recorded on 1440p.
- **Browser support.** Chrome, Brave, Firefox latest. Safari best-effort (Solana wallet ecosystem is Chrome-dominant).
- **Loading states.** Every async operation has a skeleton, a spinner, or a progress indicator — no blank white flashes.
- **Error handling.** Every write action wraps with try/catch; failures surface as toasts with retry. Read failures fallback to cached / "reconnecting" banner.
- **Telemetry.** Minimal: route changes + wallet-connect + major demo actions. PostHog or Plausible — nothing PII.
- **Security posture.** Zero private keys in frontend ever. Every state-changing action is signed by the user's wallet. Admin routes check pubkey whitelist client-side AND on every backend call. No localStorage of sensitive data.
- **i18n.** English only for demo. All user-visible strings wrapped in a `t()` helper so a PT-BR layer can be added post-hackathon without refactor.

---

## 10. Out of scope for hackathon

Explicitly deferred (not gaps; deliberate choices):
- White-labeled mobile app with PIX-alias banking UX (Phase 2)
- Full retail FIDC wrapper (Phase 1; for hackathon, the two Retail vaults are shown as "Active via FIDC wrapper" with a tooltip stub)
- Real Civic Pass KYC integration (mocked; real SDK post-hackathon)
- Production-grade admin panel (hackathon admin is operator-only, not self-service)
- Real Chrono24 / WatchCharts market anchor oracle (mocked)
- Real Squads multisig default execution (single-signer admin shortcut in demo)
- PT-BR language support (EN only)
- Full mobile optimization (desktop-first for demo)
- Real custodian partner integration (mock custodian wallet)
- Real payment rails / FX conversion (Devnet USDC only; BRL is display-only)
- SEO, marketing pages beyond landing
- Analytics dashboards for protocol-wide stats (minimal KPIs only in admin)

---

## 11. Build sequencing — 18 days

**Today is April 22. Submission is May 10. 18 days.** Working plan with daily checkpoints:

### Week 1 (Apr 22–28) — Foundation
- **Day 1–2 (Apr 22–23):** Repo scaffold, Next.js + Tailwind + shadcn setup. Wallet adapter integration. Landing + `/connect`. AppShell + StateBadge + shared primitives.
- **Day 3–4 (Apr 24–25):** Anchor client generation from Edson's IDLs. `@vaulx/anchor-client`, `@vaulx/terms`, `@vaulx/types` packages. Borrower home `/borrow` with mock TRDC data.
- **Day 5–7 (Apr 26–28):** New Loan Wizard Steps 1-4. IPFS upload. CCB PDF generation. Terms screen with live on-chain `create_ccb_trdc` call. **Milestone: Moment 2 executable on Devnet end-to-end.**

### Week 2 (Apr 29–May 5) — Demo path
- **Day 8–9 (Apr 29–30):** Active Loan Detail + Payment + Repayment. Custodian queue + `confirm_custody`. **Milestone: Moments 3, 4, 5 executable.**
- **Day 10–11 (May 1–2):** Lender flow — Vault Selector, Vault Detail, Deposit. **Milestone: Moment 1 executable.**
- **Day 12 (May 3):** Renewal flow. **Milestone: Moment 7 executable.**
- **Day 13–14 (May 4–5):** Admin: State Machine, Failing Test runner, Demo Control, Default execution + Auction. **Milestone: Moments 6, 8, 9 executable. All six core moments + three score-point moments working.**

### Week 3 (May 6–10) — Polish and ship
- **Day 15 (May 6):** End-to-end rehearsal. Run full demo choreography 3 times. Fix whatever breaks.
- **Day 16 (May 7):** Polish — copy, CTAs, error states, Explorer links. Deploy to Vercel production URL.
- **Day 17 (May 8):** Record demo video. Multiple takes. Final edit.
- **Day 18 (May 9):** Buffer day — final bug fixes, submission prep.
- **May 10 (submission day):** Submit early morning. One day of buffer before the hard May 11 deadline.

**Risk to this schedule.** Moment 6 (failing test runner) is the highest technical risk — streaming `anchor test` output to the browser is novel. Fallback is a pre-recorded test video served as a static asset; this fallback must be built on Day 13 even if the live runner works, so cut-over costs zero if the live version fails on demo day.

---

## 12. Acceptance criteria

### Per-screen (apply to every screen in §4)
- Loads in <2s on 3G
- No layout shift after initial render
- Every action has visible feedback (loading / success / error)
- Every transaction surfaces an Explorer link
- Wallet-disconnect mid-screen redirects cleanly to `/connect`
- No console errors in production build

### End-to-end demo-readiness
- From `/admin/demo`, operator clicks "Run Moment 1" through "Run Moment 6" in sequence, and each advances the demo visibly without operator typing any input on the main browser window.
- The 3-minute demo video can be recorded in a single take from `/` through Moment 6 closer.
- Every TRDC mint address shown on camera resolves to a real Devnet account viewable on Solana Explorer.
- The `/admin/tests` screen shows at least the custody-gate-failing test failing with the exact error name `CustodyNotConfirmed`, and at least one happy-path test passing, within 60 seconds of clicking "Run test suite".
- Public `/trdc/[mint]` and `/tx/[signature]` routes resolve without auth for any judge URL-pasting after the demo.

### Code quality (hackathon-grade)
- TypeScript strict mode, zero `any` in domain code (UI glue is flexible)
- All on-chain writes use `@vaulx/anchor-client` (no ad-hoc `anchor.Program` instantiation scattered through pages)
- All business math (terms, interest, fees) lives in `@vaulx/terms` with unit tests
- One Playwright end-to-end test covers Moments 1-5 in a headless browser (blocks daily deploy if fails)

---

## 13. Handoff notes for Claude Code Max

**Priority order:** build in the sequence in §11 (Week 1 foundation → Week 2 demo path → Week 3 polish). Do not optimize any individual screen beyond "acceptance criteria met" until the entire demo path works end-to-end. The temptation to over-polish early screens is real and will cost demo-readiness.

**Integration with Edson.** Edson owns the Anchor programs. Before Day 3, pull the latest IDL files from his repo and generate the TypeScript client with `anchor-client-gen` or equivalent. After Day 3, any program changes from Edson trigger a client regeneration and a smoke test of the demo path. Set up a daily sync with Edson at the end of each working day (3:30 PM Vienna / 10:30 AM SP) to surface IDL changes before they break the frontend overnight.

**When blocked.** If a screen specification is ambiguous, default to the minimum viable rendering that supports the demo moment it's tied to. Do not invent features not in this BRD. Surface ambiguity in a daily async summary (Linear or similar) — George reviews and resolves.

**What not to build.** Anything in §10 "out of scope." Anything that doesn't appear in §4 or §5. Anything that doesn't have a clear tie-back to one of the nine demo moments or to a production-quality path flagged 🏗️ in §4.

---

## 14. Open questions for George to resolve before Day 1

1. **Custodian wallet identity for demo** — is this a dedicated Vaulx-controlled wallet, or a test-custodian keypair we generate? (Determines whether Moment 3 uses a "real" custodian persona or an operator-controlled one.)
2. **Demo wallet funding strategy** — how much Devnet SOL + USDC does each demo wallet start with? (Deposits $15K × 2, borrower needs ~0.1 SOL for fees and USDC-equivalent for repayment; default 100 SOL + 50K USDC per demo wallet is safe.)
3. **Design direction** — default to the operator aesthetic in §5 ("deep blue + warm gold accent, Inter/Manrope type"), or is there a designer brief we should follow instead?
4. **Domain** — do we have `vaulx.finance` / `vaulx.xyz` / similar for the deployed URL, or deploying to `vaulx.vercel.app` for the submission?
5. **Admin wallet pubkeys** — George and Marcelo's Devnet pubkeys whitelisted for `/admin/*`. Drop these into `.env.local` on Day 1.
6. **Team access** — who has write access to the frontend repo besides George, Marcelo, and Claude Code Max? (Edson needs read for IDL sync; anyone else?)

---

*End of BRD. This document and the Canonical Spec v3 are the only two sources of truth for the hackathon frontend build. Changes to this BRD are logged inline with revision markers.*
