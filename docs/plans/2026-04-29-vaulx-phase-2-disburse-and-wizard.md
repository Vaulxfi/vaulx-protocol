# Vaulx Phase 2 — Disburse Gate + Borrower Wizard + I1/I2 Implementation Plan

> **For Claude:** Execute via `superpowers:subagent-driven-development`. Fresh subagent per task; spec-compliance review then code-quality review; update `STATUS.md` + `CHANGELOG.md` after each task.

**Goal:** Ship Moments 2, 3, 4 (borrower flow + custody confirmation + disburse) end-to-end on Devnet, with the two-layer CPI-only disburse gate, all 10 named tests from the Backend BRD §7 green (or failing-as-fail where explicit), I1 Chrono24+WatchCharts live pricing, I2 gov.br mocked ID, and CCB generation + signing.

**Architecture:**
- **On-chain:** `loan.confirm_custody` flips `TRDCState` to `ActiveInCustody` and signs a disburse CPI into the vault. `vault.disburse` enforces (1) signer PDA == loan-program authority, and (2) instruction sysvar shows the current tx is a CPI from the loan program (not a top-level call). Emits `CustodyConfirmed` + `Disbursed`.
- **Off-chain:** Next.js wizard pages drive borrower flow. Chrono24 scraping + WatchCharts API + internal model converge to one appraisal. Gov.br mock flow mirrors the real OAuth handshake visually. CCB PDF is generated with `pdf-lib`, hash stored on-chain via a `doc_hash` field on `TRDCState`.
- **Deferred:** Bubblegum CPI still stubbed (Phase 3 if time; otherwise post-hackathon). Auction program untouched.

**Tech Stack:**
- Anchor 0.30.1 / Rust 1.85.0 / Solana CLI 1.18.26
- Next.js 14 App Router / TanStack Query / RHF + Zod / shadcn-ui / sonner
- pdf-lib for CCB generation; @noble/hashes for SHA-256
- Supabase Postgres (already provisioned)
- Playwright for E2E (optional — add only if time)

---

## Task list (dependency-ordered, TDD-granular)

### On-chain core (Anchor)

**2.1 — `doc_hash` + `ActiveInCustody` state + `confirm_custody` instruction (loan program)**
- Add `doc_hash: [u8; 32]` field to `TRDCState` (new reserved-slot migration).
- Extend `Status` enum with `ActiveInCustody` between `PendingCustody` and `Active`.
- Allow transitions: `PendingCustody → ActiveInCustody → Active`.
- New `loan.confirm_custody(ctx, doc_hash)` instruction: requires custodian signer (hardcoded whitelist pubkey for demo), writes `doc_hash`, transitions state to `ActiveInCustody`, emits `CustodyConfirmed`.
- Test: `test_confirm_custody_only_by_custodian` (unauthorized signer → `UnauthorizedCustodian`).
- Test: `test_confirm_custody_writes_doc_hash`.

**2.2 — `vault.disburse` CPI-only gate + loan-side CPI wrapper**
- Replace the `DisburseNotYetImplemented` body with real logic.
- Validate: `ctx.accounts.loan_program_authority.key() == LOAN_PROGRAM_AUTHORITY_PDA` (derived from `[b"loan_authority"]` in loan program).
- Validate via `instructions` sysvar: top-level tx must originate from loan program ID (not the vault program itself). Use `solana_program::sysvar::instructions::load_current_index_checked` + `load_instruction_at_checked`.
- Transfer USDC from `vault_ata` → `borrower_ata` using vault PDA signer seeds.
- Emit `Disbursed { vault, trdc_state, borrower, amount, ts }`.
- New `loan.disburse_from_vault(ctx, amount)` wraps the CPI: asserts `TRDCState.status == ActiveInCustody`, transitions to `Active`, then CPIs into `vault::disburse` with the loan authority PDA as signer.
- **Two named failing tests (errors expected, passing-as-failures):**
  - `test_disburse_fails_when_custody_not_confirmed` → expects `InvalidStateTransition` (caller tries to disburse while status == `PendingCustody`).
  - `test_disburse_fails_with_unauthorized_caller` → expects `UnauthorizedDisbursar` (direct top-level `vault.disburse` call without going through the loan program).
- Happy-path test: `test_disburse_happy_path` (custody → disburse, asserts USDC transfer + state == `Active`).

**2.3 — Remaining 8 BRD §7 named tests**

Write and green:
- `test_ltv_exactly_at_limit_accepted` (60% LTV passes; 60.01% fails — already covered in 1.8, verify).
- `test_deposit_rejects_zero_amount`.
- `test_withdraw_rejects_over_balance`.
- `test_ccb_create_requires_nonzero_amount`.
- `test_trdc_state_transition_rejects_illegal`.
- `test_mint_trdc_cnft_writes_stable_asset_id` (same hash inputs → same `asset_id`).
- `test_deposited_event_fields_match` (log parser confirms every field).
- `test_vault_pda_derivation_is_deterministic`.

Each is a small spec-level additive test. Green in one batch, committed as `test(anchor): add remaining BRD §7 coverage`.

**2.4 — IDL freeze + client regeneration**
- Run `pnpm copy:idls`, commit the frozen IDLs.
- Try `anchor-client-gen` once more against frozen IDLs; if still broken, keep façade + document.
- Tag commit `phase-2-idl-freeze`.

### Off-chain (Next.js + backend)

**2.5 — CCB generator package (`@vaulx/ccb`)**
- Replace `export const TODO = true;` stub.
- `generateCcbPdf(params): Promise<Uint8Array>` — renders CCB.B3 (Cédula de Crédito Bancário) PDF with `pdf-lib` from a template at `packages/ccb/assets/ccb-template.pdf` (or layout-from-scratch — decide at task kickoff).
- `hashCcb(bytes): Uint8Array` — SHA-256 via `@noble/hashes`.
- Tests: fixture-driven snapshot of rendered PDF byte length + hash stability across runs.

**2.6 — I1: Chrono24 + WatchCharts appraisal aggregator**
- `apps/web/src/app/api/appraisal/route.ts` — POST `{ make, model, ref, year, condition }` → returns `{ chrono24: number, watchcharts: number, internal: number, median: number, source: "real" | "fallback" }`.
- Chrono24: server-side scrape via `firecrawl` MCP (or Playwright fallback) against watch listings; take median of top 10.
- WatchCharts: real API if public-keyed endpoint is available; otherwise mocked from a hardcoded JSON of ~20 popular refs.
- Internal model: deterministic function of `(year, condition, reference_popularity_score)` calibrated to rough Chrono24 medians.
- Rate-limit + 10s timeout per source; if any fail, return with `source: "fallback"` and a warning surfaced in the UI.
- Test: `pnpm --filter web test` with mocked fetches; golden snapshot for 2 reference watches (Rolex Submariner 116610LN, Patek Nautilus 5711).

**2.6.5 — I4 REAL: Civic Pass on-chain gate + SDK swap**

Promotes I4 from the Phase 1 hardcoded mock to a real Civic Pass integration.

- **On-chain gate** on instructions that must be KYC-gated:
  - `vault.deposit` — lender must hold a valid Civic Pass gateway token.
  - `loan.create_ccb_trdc` — borrower must hold a valid Civic Pass gateway token.
  - `loan.confirm_custody` — custodian is whitelist-gated (not Civic); no change.
  - Implementation: add a `gateway_token: UncheckedAccount<'info>` to the relevant accounts structs, validate via `solana_gateway::Gateway::verify_gateway_token_account_info(...)` or equivalent manual PDA derivation against the Civic gatekeeper network pubkey for Devnet. Document the network pubkey constant (e.g. `ignREusXmGrscGNUesoU9mxfds9AiYTezUKex2PsZV6` for Devnet uniqueness; use the CIVIC_PASS network — agent must verify via Context7/Civic docs).
  - New errors: `NoValidGatewayToken` (vault + loan).
  - New tests: `test_deposit_rejects_without_civic_pass`, `test_ccb_create_rejects_without_civic_pass`, happy-path variants of existing tests pass a real (or mock-program-derived) gateway token.
- **FE SDK swap:**
  - Install `@civic/solana-gateway-react` + `@identity.com/solana-gateway-ts`.
  - Wrap the wallet provider tree with `<GatewayProvider gatekeeperNetwork={...} cluster="devnet">`.
  - Delete (or deprecate) `apps/web/src/components/vaulx/kyc-mock-modal.tsx` — replace with a `<CivicPassGate>` wrapper that blocks the `Deposit` + `Borrow` actions until `gatewayStatus === "ACTIVE"`.
  - Lender `/lend/vaults/[id]` deposit form + borrower wizard entry both sit behind `<CivicPassGate>`.
  - When passing the on-chain deposit/create_ccb_trdc instruction, include the user's gateway token PDA: derived via `@identity.com/solana-gateway-ts`'s `findGatewayToken(owner, gatekeeperNetwork)`.
- **Update STATUS "Integration scope"** to reflect I4 is now real.

**2.7 — I2: Gov.br mocked ID flow**
- `apps/web/src/app/borrow/verify-id/page.tsx` — page that mimics gov.br's OAuth handshake.
- 3-step visual: "Redirecting to gov.br" → fake login screen with CPF field (validates Brazilian CPF check-digit) → success → returns to borrower wizard with `localStorage.vaulx_govbr_verified = { cpf, name, verified_at }`.
- Wallet-keyed: `vaulx_govbr_<wallet>`.
- No real auth. Skippable in dev via `?mock=auto` query param (auto-completes in 2s).

**2.8 — Borrower wizard pages (Moment 2)**
Three pages, each its own commit:
- `/borrow/new/asset` — form: make / model / ref / year / condition. Writes to Supabase `appraisal_requests` table. Redirects to next step with `reqId`.
- `/borrow/new/appraisal/[reqId]` — fetches I1 aggregate, shows triangular convergence (3 numbers + median), borrower confirms or rejects.
- `/borrow/new/terms/[reqId]` — LTV slider (0–60%, clamped), term length (30/60/90 days), interest rate (preview from `@vaulx/terms`), CCB generation preview. On confirm: calls `loan.create_ccb_trdc` + uploads CCB to Supabase storage, stores `doc_hash` alongside.

**2.9 — Awaiting-custody + custodian intake UI (Moment 3)**
- `/borrow/new/awaiting-custody/[trdc]` — borrower-side spinner + address for shipping.
- `/custodian/intake/[trdc]` — custodian reviews borrower info, clicks "Confirm custody", signs `loan.confirm_custody` with the custodian whitelisted wallet.
- Poll Supabase `onchain_events` for `custodyConfirmed` to auto-advance borrower view.

**2.10 — Moment 2+3+4 E2E test**
- `scripts/dev/moments-2-3-4-e2e.ts` mirrors `moment-1-e2e.ts` structure:
  - Load demo wallet 1 (borrower) + wallet 2 (custodian).
  - Call `create_ccb_trdc` → assert `ccbTrdcCreated` event → assert state `PendingCustody`.
  - Custodian calls `confirm_custody` → assert `custodyConfirmed` → assert state `ActiveInCustody`.
  - Loan program calls `disburse_from_vault` → assert `disbursed` + USDC balance change + state `Active`.
  - Total run ≤ 90s; SKIPPED path same as Moment 1.

**2.11 — STATUS/CHANGELOG close-out + commit `phase-2-done`**

---

## Execution order & checkpoints

1. Tasks 2.1 → 2.2 → 2.3 → 2.4 (on-chain first; gate IDLs at 2.4).
2. 2.5 (ccb) in parallel with 2.6 (I1) — independent packages.
3. 2.7 → 2.8 → 2.9 (frontend, depends on 2.4 frozen IDLs + 2.5 CCB pkg).
4. 2.10 E2E last.
5. 2.11 docs close-out.

**Time budget:** 2.1–2.4 ≈ 1 day; 2.5–2.7 ≈ 0.5 day; 2.8–2.9 ≈ 1 day; 2.10 + 2.11 ≈ 0.5 day.

## Anti-goals (YAGNI)

- Real Bubblegum cNFT mint — still deferred.
- Real gov.br OAuth — always mocked.
- WatchCharts paid tier — fall back to hardcoded JSON if no public key.
- Real custodian KYC — whitelisted pubkey is enough for demo.
- Production-grade CCB template — one-page layout is fine; judges will not read the Portuguese fine print.

## Known gotchas

- **Anchor 0.30.1 lowercases event names.** New events (`CustodyConfirmed`, `Disbursed`) will arrive as `custodyConfirmed` / `disbursed` in the indexer. Test matchers + UI subscribers must use lowercase.
- **`instructions` sysvar requires adding the sysvar address to the disburse accounts struct.** Anchor doesn't auto-wire it.
- **Cargo.lock v4↔v3** still needs manual flip if we touch Rust deps (`sed -i '' 's/^version = 4$/version = 3/' Cargo.lock`).
- **COPYFILE_DISABLE=1** + PATH export (`/Users/gogy/.local/share/solana/install/active_release/bin:/Users/gogy/.cargo/bin`) for `anchor test` on macOS.

## Exit criteria

- [ ] Moments 2, 3, 4 executable on Devnet (harness or manual).
- [ ] `anchor test` green: 17 prior + 2 confirm-custody + 3 disburse (2 fail-as-fail + 1 happy) + 8 BRD §7 = **30 tests**, all behave as specified.
- [ ] IDLs frozen + committed.
- [ ] `pnpm -w typecheck` clean.
- [ ] CI green.
- [ ] STATUS.md + CHANGELOG.md reflect Phase 2 closed.
