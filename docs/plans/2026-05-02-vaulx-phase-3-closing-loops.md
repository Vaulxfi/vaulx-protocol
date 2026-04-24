# Vaulx Phase 3 — Closing Loops Implementation Plan

> **For Claude:** Execute via `superpowers:subagent-driven-development`. Fresh subagent per task; spec-compliance review then code-quality review; update `STATUS.md` + `CHANGELOG.md` after each task.

**Goal:** Close all remaining demo loops — repayment, renewal, default → auction, Solana Pay QR, live SSE test runner. Complete Civic Pass operationally (CAPTCHA network). Ship Moments 5–9 end-to-end.

**Architecture:**
- **On-chain:** `loan.pay_installment`, `loan.repay_ccb`, `loan.renew_ccb` implement the full rate math from `@vaulx/terms`. New `auction` program drives `execute_af_default` → `create_auction` → `place_bid` → `close_auction`. All gated by TRDC state transitions.
- **Off-chain:** Borrower routes `/borrow/loans/[trdc]/{pay,renew,repay}` + lender routes `/lend/auctions*`. Solana Pay QR via `@solana/pay`. Admin SSE runner streams `anchor test` via Next.js route.
- **Demo ops:** Seed script + `/admin/demo` cockpit for rehearsal; fallback video checkpoint.

**Tech Stack:** Anchor 0.30.1, Next.js 14, `@solana/pay`, `@civic/solana-gateway-react`, `eventsource-polyfill`.

**Decision applied:** Civic gatekeeper network = **CAPTCHA / uniqueness** (`ignREusXmGrscGNUesoU9mxfds9AiYTezUKex2PsZV6`). Full Civic Pass KYC documented as upgrade path in README.

---

## Task list (dependency-ordered, TDD-granular)

### 3.0 — Civic Pass KYC operational close-out
1. Verify the 6 `TODO(civic-sdk-verify)` markers against installed `@civic/solana-gateway-react` + `@identity.com/solana-gateway-ts` — fix program id byte-padding, PDA seed nonce, state-byte offset, hook/enum/prop shapes. Remove stale TODO comments after fixing.
2. Runtime happy-path test `tests/civic-happy-path.spec.ts` — gen throwaway gatekeeper keypair → init vault_config + loan_config against it → mint a gateway token for the depositor via `@identity.com/solana-gateway-ts` → call `vault.deposit` → expect success. Revocation test: revoke token → expect `NoValidGatewayToken`.
3. `scripts/dev/init-civic-configs.ts` — one-shot Devnet helper that runs `initialize_vault_config(CAPTCHA)` + `initialize_loan_config(custodian, CAPTCHA)` idempotently. Root `pnpm init:civic`.
4. README section "Civic Pass KYC — demo model + upgrade path."

### 3.1 — Repayment + renewal + pay_installment math (loan program)
1. Extend `@vaulx/terms` with `computeInterestAccrued(principal, rateBps, daysElapsed)`, `computePayoff(principal, rateBps, termDays, paidAtSec, createdAtSec)`, `computeRenewalFee(...)`. TDD.
2. `loan.pay_installment(amount)` — reduces `loan_amount_remaining`; emits `InstallmentPaid`. State stays `Active`.
3. `loan.repay_ccb()` — full payoff; transitions TRDC `Active → Repaid`; emits `CcbRepaid`. Custodian then releases asset (off-chain).
4. `loan.renew_ccb(new_term_days, new_due_ts)` — extends loan with a renewal fee transfer + state `Active → Renewed → Active` (two-step via existing transition table).
5. USDC settlement: borrower → vault_ata via SPL transfer (not vault PDA signed — borrower signs their own transfer).
6. Tests: `test_pay_installment_reduces_principal`, `test_repay_ccb_transitions_to_repaid`, `test_renew_ccb_extends_due_ts`, `test_payoff_math_matches_terms_package`.

### 3.2 — Auction program (new `auction` crate)
1. `auction.create_auction(trdc_pda, reserve_price, duration_secs)` — CPI'd from `loan.execute_af_default` when TRDC is in `Overdue → Defaulted` flow. Creates `Auction` PDA at `[b"auction", trdc_pda]`.
2. `auction.place_bid(amount)` — must be ≥ previous high + min-increment, records bidder + timestamp.
3. `auction.close_auction()` — clock-gated (after `end_ts`); transfers winning bid USDC to vault reserve (recoups lender capital); transitions TRDC `Defaulted → Liquidated`.
4. `loan.execute_af_default` — called by anyone after `due_ts + grace_period`; transitions TRDC `Active → Overdue → Defaulted` and CPIs into `auction.create_auction`.
5. Whitelist window: 60s demo vs 72h production — feature flag via `#[cfg(feature = "demo-timing")]` or const swap.
6. Tests: `test_default_kicks_off_auction`, `test_bid_monotonic`, `test_close_auction_liquidates_trdc`, `test_winning_bid_recovers_vault_capital`.

### 3.3 — Borrower loan routes
- `/borrow/loans/[trdc]/pay` — installment form; TanStack mutation; Solana Pay QR preview (optional).
- `/borrow/loans/[trdc]/renew` — renewal terms preview + confirm.
- `/borrow/loans/[trdc]/repay` — full payoff form with interest breakdown.
- Shared `useLoanSummary(trdc)` hook reading TRDCState + computing current payoff via `@vaulx/terms`.

### 3.4 — I3 Solana Pay QR
1. `GET /api/solana-pay/[kind]/[trdc]?amount=...` — returns a transfer-request URL per [Solana Pay spec](https://docs.solanapay.com/spec).
2. Renders as QR in the repay/pay screens via `qrcode` npm package + a `<SolanaPayQr>` component.
3. Mobile phones scan → Phantom opens → signs transfer → backend polls for confirmation (Supabase event or RPC `getSignatureStatuses`).

### 3.5 — Lender auction routes
- `/lend/auctions` — list of open auctions with live reserve/high-bid/time-remaining.
- `/lend/auctions/[id]` — detail + bid form + bid history (from indexer).
- Indexer extended to subscribe to auction program events.

### 3.6 — `/admin/tests` live SSE runner
1. `GET /api/admin/tests/stream` — Next.js route spawns `anchor test` as child process; pipes stdout/stderr as `text/event-stream` (one event per line).
2. React component renders via `EventSource`; ANSI → HTML via `ansi-to-html`.
3. Start button + live scrolling log + status pill.

### 3.7 — Fallback demo video scaffold
- `public/demo/` directory with placeholder `README.md` noting video must exist at `public/demo/test-run.mp4` before submission.
- Helper script `scripts/dev/record-test-run.md` with `asciinema` + `agg` instructions.
- Task marks complete when Claude has set up the dir + docs; user records the actual video.

### 3.8 — Demo cockpit `/admin/demo`
1. Page with 6 big buttons: `01 Seed Pool`, `02 Mint TRDC`, `03 Confirm Custody`, `04 Disburse`, `05 Simulate Repay`, `06 Simulate Default → Auction`.
2. "Reset" button that calls a new `/api/admin/reset` route (archives current state, generates fresh demo wallets, re-seeds).
3. "Accelerate time" toggle — when on, instructions run with truncated clocks (30d → 30s) via feature flags the programs already support.
4. Wallet-whitelisted: only admin pubkey from env can access.

### 3.9 — Phase 3 E2E harness (Moments 5–9)
`scripts/dev/moments-5-9-e2e.ts` + Mocha wrapper, mirroring the moment-1 / moments-2-3-4 pattern. Exercises pay → renew → repay → default → auction → close in sequence. SKIPPED when env missing.

### 3.10 — STATUS/CHANGELOG close-out + tag `phase-3-done`

---

## Execution order & checkpoints

1. **3.0 first** — it unblocks every other on-chain task by closing Civic TODOs
2. 3.1 → 3.2 (on-chain math + auction in parallel if capacity allows)
3. 3.3 + 3.4 (borrower FE + Solana Pay) can start once 3.1 IDL is frozen
4. 3.5 once 3.2 is done
5. 3.6 can happen anytime (independent)
6. 3.7, 3.8, 3.9 after the above
7. 3.10 final

**Time budget:** 3.0 = 0.5d; 3.1+3.2 = 1d; 3.3+3.4 = 0.75d; 3.5 = 0.5d; 3.6 = 0.25d; 3.8+3.9 = 0.5d; 3.7+3.10 = 0.25d → ~3.75 days total (on budget for Days 11–13 + slack).

## Anti-goals (YAGNI)

- Real-time auction bidding UI updates via WebSocket — polling is fine.
- Full SPL-governance voting on auction outcomes — out of scope.
- Multi-asset class vaults — single-asset per vault for demo.
- Fiat on-ramps — USDC only.

## Known gotchas

- **Anchor 0.30.1 event lowercase** — ongoing rule.
- **Solana Pay** — `transfer-request` URLs must match the exact spec including memo/reference fields.
- **Auction timing** — `Clock::get()` returns slot-based time; may drift vs wall clock. Use `unix_timestamp`.
- **Default trigger authority** — `execute_af_default` should be callable by anyone (permissionless), but create_auction CPI signer must be the loan program PDA.
- **Indexer replay resilience** — new auction events need the same 23505 unique-violation handling.

## Exit criteria

- [ ] All 9 demo moments executable end-to-end on Devnet.
- [ ] Civic Pass gate ACTIVE in Devnet configs (not disabled via `Pubkey::default()`).
- [ ] `anchor test` green: 33 prior + 4 repayment + 4 auction + 1 civic-happy-path + 1 civic-revoke = **43+ tests**.
- [ ] `/admin/tests` SSE runner streams live test output.
- [ ] `/admin/demo` cockpit runs all 6 core moments back-to-back.
- [ ] Fallback video placeholder in `public/demo/`.
- [ ] `pnpm -w typecheck` + web build green.
- [ ] CI green.
- [ ] STATUS + CHANGELOG reflect Phase 3 closed; `phase-3-done` tag placed.
