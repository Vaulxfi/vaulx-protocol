# Vaulx — Build Status

**Last updated:** 2026-04-24 (Phase 1 tasks 1.1–1.9 complete, 1.10 starting)
**Plan:** [docs/plans/2026-04-23-vaulx-build-plan.md](docs/plans/2026-04-23-vaulx-build-plan.md)
**Phase 1 plan:** [docs/plans/2026-04-25-vaulx-phase-1-core-programs.md](docs/plans/2026-04-25-vaulx-phase-1-core-programs.md)
**Design:** [docs/plans/2026-04-23-vaulx-full-stack-build-design.md](docs/plans/2026-04-23-vaulx-full-stack-build-design.md)
**Submission deadline:** 2026-05-10 (Day 18 from kickoff)

## Current phase
**Phase 1 — Core programs + happy paths** (starting)

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
| 1.10 | Generate `@vaulx/anchor-client` via `anchor-client-gen` | in_progress | Typed clients for all 4 programs; build + typecheck green |
| 1.11 | USDC mint on Devnet + demo-wallet seed script | pending | Mock-USDC mint address pinned; seed script funds demo wallets |
| 1.12 | `/lend`, `/lend/vaults`, `/lend/vaults/[id]` frontend + I4 mock modal | pending | Moment 1 UI; Civic/Blockpass hardcoded-pass modal on first deposit |
| 1.13 | Indexer worker + `onchain_events` table | pending | Node worker subscribes to Vault logs via WS; Supabase upserts |
| 1.14 | Moment 1 E2E happy-path test (`test_happy_path_end_to_end` stub) | pending | Scripted Devnet E2E: connect → KYC mock → deposit → share + event visible |

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
| Phase 1 — Core programs + happy paths | Days 4–7 (Apr 25–28) | starting |
| Phase 2 — Disburse gate + borrower wizard + I1/I2 | Days 8–10 (Apr 29–May 1) | not_started |
| Phase 3 — Repayment, renewal, auction, I3, SSE | Days 11–13 (May 2–4) | not_started |
| Phase 4 — Rehearsal, polish, deploy, record | Days 14–16 (May 5–7) | not_started |
| Phase 5 — Submission | Days 17–18 (May 8–9) | not_started |

## Blockers / open decisions

- **D1–D7 from design doc §9** — defaults applied per user ("proceed with defaults").
- **Helius Devnet API key** — still open; public `api.devnet.solana.com` RPC for now (sufficient for Phase 1).
- **`SUPABASE_SERVICE_ROLE_KEY`** — still needed for any admin/server-only Supabase writes (Phase 2+). Fetch from [dashboard API settings](https://supabase.com/dashboard/project/ctiypfxtymnszposgaky/settings/api) and paste into `apps/web/.env.local`.

## Integration scope (confirmed)

- I1 Chrono24 + WatchCharts real pricing — Phase 2
- I2 gov.br mocked ID — Phase 2
- I3 Solana Pay QR — Phase 3
- I4 Civic/Blockpass hardcoded UI mock — Phase 1
