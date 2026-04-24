# Vaulx — Build Status

**Last updated:** 2026-04-24 (Phase 2 in progress — 2.1–2.6 complete; new 2.6.5 Civic Pass real integration starting per user direction)
**Plan:** [docs/plans/2026-04-23-vaulx-build-plan.md](docs/plans/2026-04-23-vaulx-build-plan.md)
**Phase 1 plan:** [docs/plans/2026-04-25-vaulx-phase-1-core-programs.md](docs/plans/2026-04-25-vaulx-phase-1-core-programs.md)
**Phase 2 plan:** [docs/plans/2026-04-29-vaulx-phase-2-disburse-and-wizard.md](docs/plans/2026-04-29-vaulx-phase-2-disburse-and-wizard.md)
**Design:** [docs/plans/2026-04-23-vaulx-full-stack-build-design.md](docs/plans/2026-04-23-vaulx-full-stack-build-design.md)
**Submission deadline:** 2026-05-10 (Day 18 from kickoff)
**User action TODOs:** [USER_TODO.md](USER_TODO.md)

## Current phase
**Phase 2 — Disburse gate + borrower wizard + I1/I2** (starting — 2.1 in progress)

## Phase 2 tasks

| # | Task | Status | Notes |
|---|---|---|---|
| 2.1 | `ActiveInCustody` state + `confirm_custody` + `doc_hash` | completed | 19/19 anchor tests green. `LoanConfig` PDA (`[b"loan_config"]`, fields admin+custodian+bump); `initialize_loan_config` + `confirm_custody(doc_hash)` ixs; CPIs into `trdc::confirm_custody_transition`. State table updated: `PendingCustody→ActiveInCustody→Active`. `doc_hash: [u8;32]` added to TRDCState (reserved shrunk 64→32, net size unchanged). Commit `1cd3355`. |
| 2.2 | `vault.disburse` CPI-only gate + `loan.disburse_from_vault` wrapper | completed | 21/21 anchor tests green. Two-layer gate: (1) `loan_authority` PDA (`[b"loan_authority"]` in loan) must match expected + be signer; (2) instructions sysvar asserts top-level tx programId == loan. `DisburseRequested` (loan) + `Disbursed` (vault) events. Happy path + both named failing tests (`test_disburse_fails_when_custody_not_confirmed`, `test_disburse_fails_with_unauthorized_caller`) green. `loan_authority` signs disburse CPI via `invoke_signed`. `trdc.transition_to_active` ActiveInCustody→Active. Commit `097b3a8`. |
| 2.3 | Remaining 8 BRD §7 named tests | completed | 29/29 anchor tests green (up from 21). All 8 named `it()` blocks land as first-class coverage: exact-limit LTV, zero/oversize amount reverts, illegal transition revert, stable asset_id hash, full deposited event field match, deterministic vault PDA derivation. Commit `f113582`. |
| 2.4 | IDL freeze + client regeneration attempt | completed | `phase-2-idl-freeze` tag placed at commit `b4cd6cb`. Re-ran `anchor-client-gen@latest` — still fails with `Unreachable.` on the Anchor 0.30 IDL shape; hand-rolled façade at `packages/anchor-client/src/index.ts` remains the source of truth until upstream catches up. IDLs in `packages/idls/src/` are the frozen reference for Phase 2 consumers. |
| 2.5 | `@vaulx/ccb` real PDF generator + SHA-256 | completed | `generateCcbPdf` + `hashCcb`; deterministic A4 one-pager (pdf-lib + @noble/hashes); creation/mod dates pinned to `issuedAtTs`; 4/4 vitest green incl. byte-equal determinism + 1-atom sensitivity. Commit `1917680`. |
| 2.6 | I1 Chrono24 + WatchCharts appraisal aggregator | completed | `POST /api/appraisal` (zod-validated), 3-source parallel fetch w/ 10s per-source timeout, median over `ok` values, always-fallback-safe. 6/6 vitest green. 20-ref fixture (Rolex/Patek/AP/Omega/IWC). Deterministic internal model hits ±15% of fallback stubs. Commit `877977c`. |
| 2.6.5 | **I4 REAL: Civic Pass on-chain gate + SDK swap** | in_progress | Promotes I4 from Phase 1 hardcoded mock to real Civic Pass. On-chain gateway-token check on `vault.deposit` + `loan.create_ccb_trdc`. FE uses `@civic/solana-gateway-react` + `@identity.com/solana-gateway-ts`; replaces `kyc-mock-modal.tsx`. Needed before 2.8 borrower wizard lands. |
| 2.7 | I2 gov.br mocked ID flow | pending | CPF check-digit validated; wallet-keyed |
| 2.8 | Borrower wizard pages (Moment 2) | pending | /borrow/new/{asset, appraisal, terms} |
| 2.9 | Awaiting-custody + custodian intake UI (Moment 3) | pending | Polls onchain_events for custodyConfirmed |
| 2.10 | Moments 2+3+4 E2E test | pending | Mirror moment-1-e2e.ts; SKIPPED path same |
| 2.11 | STATUS/CHANGELOG close-out | pending | Tag `phase-2-done` |

Repo: [github.com/gogysss/vaulx](https://github.com/gogysss/vaulx) (private).
Supabase: `vaulx-devnet` (project id `ctiypfxtymnszposgaky`, region `us-east-1`).

## Phase 1 tasks

| # | Task | Status | Notes |
|---|---|---|---|
| 1.1 | TRDCState PDA + 7-state enum scaffolding (TRDC program) | pending | Phase-0 TS enum variants; no real Bubblegum CPI yet |
| 1.2 | 7-state transitions with `InvalidStateTransition` guards | pending | State machine enforced on-chain; unit + integration tests |
| 1.3 | Bubblegum cNFT mint stub | pending | `mint_trdc_cnft` returns stub asset_id; real CPI deferred to Phase 2 |
| 1.4 | `initialize_vault` + Vault PDA | pending | Vault PDA, USDC reserve ATA, share mint |
| 1.5 | `deposit` with share math (`test_vault_share_accounting` required) | completed | TDD green: first=1:1, second rounds down, multi-depositor invariant held |
| 1.6 | `withdraw` with share math | completed | TDD green: roundtrip ±1 lamport + over-withdraw reverts. Dust guard (`assets_out > 0`) added post code-review |
| 1.7 | `disburse` stub | completed | Signature + accounts published; body returns `DisburseNotYetImplemented`. 14/14 tests green. |
| 1.8 | `Loan.create_ccb_trdc` with LTV gate (CPI into TRDC) | completed | 16/16 tests green. `test_ltv_enforced_at_mint` (61% rejected) + happy-path (59% accepted, TRDCState in PendingCustody, non-default asset_id). CPI into `trdc::initialize_trdc_state` + `mint_trdc_cnft`. |
| 1.9 | Event emission + IDL copy to `packages/idls` | completed | 6 `#[event]`s across trdc/vault/loan; `scripts/dev/copy-idls.sh` + `packages/idls/src/index.ts`. 17/17 tests green (incl. listener-based Deposited test). ⚠️ Anchor 0.30.1 lowercases event names for `addEventListener` — use `"deposited"` not `"Deposited"` (indexer gotcha for 1.13). |
| 1.10 | Generate `@vaulx/anchor-client` via `anchor-client-gen` | completed | anchor-client-gen 0.28.1 doesn't handle Anchor 0.30 IDLs (upstream gap). Used plan-authorized fallback: hand-rolled façade at `packages/anchor-client/src/index.ts` exposing `{idl, programId, program(provider)}` per program via `@coral-xyz/anchor`'s `Program<Idl>`. `build:client` script stays wired for when upstream catches up. typecheck 6/6 green. |
| 1.11 | USDC mint on Devnet + demo-wallet seed script | completed | `scripts/dev/seed-usdc.ts` (idempotent) + root `pnpm seed:usdc`. Script runs; payer `2HYjytRc4oKY2ndmJfAq2XdGhPqYB7VdDPLzA18QEiAH` needs Devnet SOL before mint+seed fire (rate-limited on CLI airdrop — user must fund at faucet.solana.com). |
| 1.12 | `/lend`, `/lend/vaults`, `/lend/vaults/[id]` frontend + I4 mock modal | completed | 3 pages + RHF/Zod deposit form + Civic/Blockpass KYC modal (3s fake verify, localStorage-keyed per wallet). TanStack Query + Sonner toasts. `/lend` → 200 w/ "Browse vaults"; `/lend/vaults` → 200 w/ "USDC" (or empty state until mint seeded). Build + lint + typecheck green. |
| 1.13 | Indexer worker + `onchain_events` table | completed | `apps/indexer` (tsx/Node) subscribes to vault program logs, parses events via Anchor `EventParser`, inserts into `public.onchain_events` on Supabase (migration `20260425000000_onchain_events.sql` applied). Not yet run live — blocked on `SUPABASE_SERVICE_ROLE_KEY`. Event names arrive lowercased (Anchor 0.30.1) — documented in `main.ts`. typecheck 7/7 green. |
| 1.14 | Moment 1 E2E happy-path test (`test_happy_path_end_to_end` stub) | completed | `scripts/dev/moment-1-e2e.ts` + `tests/moment-1-e2e.spec.ts`: init vault → deposit 100 USDC from demo wallet 0 → poll Supabase `onchain_events` (30s) → assert `event_name='deposited'`, `amount=100000000`, `shares_minted=100000000` (1:1 on fresh vault). Exit codes 0/2/1 = pass/SKIPPED/fail; Mocha wrapper maps 2→`this.skip()`. typecheck 7/7 green. Live run blocked on `SUPABASE_SERVICE_ROLE_KEY` + funded payer — harness gracefully reports SKIPPED until both are set. Commit `a8d2a72`. |

<details>
<summary>Phase 0 tasks (completed — reference)</summary>

| # | Task | Status | Notes |
|---|---|---|---|
| P0.0 | Install toolchain (Rust, Solana CLI, Anchor) | completed | rustc 1.85.0, anchor-cli 0.30.1, solana-cli 1.18.26 |
| 0.1 | Initialize git + commit existing docs | completed | |
| 0.2 | pnpm workspace + Turborepo | completed | |
| 0.3 | Shared packages (types, terms, ccb, anchor-client, idls) | completed | LTV math tests green (4/4); TDD red-then-green |
| 0.4 | Anchor workspace with 4 empty programs | completed | `anchor build` + `anchor test` green; all 4 programs ping on localnet. IDL blocker resolved by vendoring anchor-syn 0.30.1 locally (via `[patch.crates-io]`) with the unused `source_file()` cross-file type alias path disabled. |
| 0.5 | Next.js 14 app + Tailwind + shadcn + wallet adapter | completed | Next.js 14 + App Router, Tailwind with Vaulx palette, shadcn/ui `new-york`, Phantom/Solflare wallet on Devnet |
| 0.6 | GitHub Actions CI | completed | `.github/workflows/ci.yml` with parallel `ts` and `anchor` jobs; concurrency cancels stale runs; Solana + Anchor CLI caches keyed on versions |
| 0.7 | Supabase project + env wiring | completed | Project `vaulx-devnet` created; URL + anon keys wired into `apps/web/.env.local`. `/api/health` → `supabase: configured`. Still TODO for Phase 2: `SUPABASE_SERVICE_ROLE_KEY` + `HELIUS_API_KEY` (public RPC OK until load grows). |
| 0.8 | GitHub repo + push | completed | Private repo `gogysss/vaulx`; `main` pushed. |
| 0.9 | Phase 0 exit verification | completed | All 16 checks green: pnpm/turbo/lint/typecheck/test/web build, `anchor build` produces 4 `.so` + 4 IDLs, `anchor test` pings all 4 programs, `/api/health` returns `{"ok":true,...}` |

</details>

## Phase status

| Phase | Days | Status |
|---|---|---|
| Phase 0 — Bootstrap | Days 2–3 (Apr 23–24) | completed |
| Phase 1 — Core programs + happy paths | Days 4–7 (Apr 25–28) | completed |
| Phase 2 — Disburse gate + borrower wizard + I1/I2 | Days 8–10 (Apr 29–May 1) | in_progress |
| Phase 3 — Repayment, renewal, auction, I3, SSE | Days 11–13 (May 2–4) | not_started |
| Phase 4 — Rehearsal, polish, deploy, record | Days 14–16 (May 5–7) | not_started |
| Phase 5 — Submission | Days 17–18 (May 8–9) | not_started |

## Blockers / open decisions

- **D1–D7 from design doc §9** — defaults applied per user ("proceed with defaults").
- **Helius Devnet API key** — still open; public `api.devnet.solana.com` RPC for now (sufficient for Phase 1).
- **`SUPABASE_SERVICE_ROLE_KEY`** — **actively blocking Task 1.14 live verification.** Indexer worker (Task 1.13) is wired up but cannot connect to Supabase until this key is populated. Fetch from [dashboard API settings](https://supabase.com/dashboard/project/ctiypfxtymnszposgaky/settings/api) and paste into `apps/web/.env.local` **and** `apps/indexer/.env.local`.

## Integration scope (confirmed)

- I1 Chrono24 + WatchCharts real pricing — Phase 2
- I2 gov.br mocked ID — Phase 2
- I3 Solana Pay QR — Phase 3
- ~~I4 Civic/Blockpass hardcoded UI mock — Phase 1~~ **Promoted to real Civic Pass (on-chain gate + SDK) in Phase 2 Task 2.6.5** per user direction.
