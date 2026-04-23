# Vaulx — Build Status

**Last updated:** 2026-04-23 (Task 0.6 completed)
**Plan:** [docs/plans/2026-04-23-vaulx-build-plan.md](docs/plans/2026-04-23-vaulx-build-plan.md)
**Design:** [docs/plans/2026-04-23-vaulx-full-stack-build-design.md](docs/plans/2026-04-23-vaulx-full-stack-build-design.md)
**Submission deadline:** 2026-05-10 (Day 18 from kickoff)

## Current phase
**Phase 0 — Bootstrap** (in progress)

## Phase 0 tasks

| # | Task | Status | Notes |
|---|---|---|---|
| P0.0 | Install toolchain (Rust, Solana CLI, Anchor) | in_progress | Running in background |
| 0.1 | Initialize git + commit existing docs | completed | |
| 0.2 | pnpm workspace + Turborepo | completed | |
| 0.3 | Shared packages (types, terms, ccb, anchor-client, idls) | completed | LTV math tests green (4/4); TDD red-then-green |
| 0.4 | Anchor workspace with 4 empty programs | completed | `anchor build` + `anchor test` green; all 4 programs ping on localnet. rustc 1.85.0, anchor-cli 0.30.1, solana-cli 1.18.26. IDL blocker resolved by vendoring anchor-syn 0.30.1 locally (via `[patch.crates-io]`) with the unused `source_file()` cross-file type alias path disabled. |
| 0.5 | Next.js 14 app + Tailwind + shadcn + wallet adapter | completed | Next.js 14 + App Router, Tailwind with Vaulx palette, shadcn/ui `new-york`, Phantom/Solflare wallet on Devnet |
| 0.6 | GitHub Actions CI | completed | `.github/workflows/ci.yml` with parallel `ts` and `anchor` jobs; concurrency cancels stale runs; Solana + Anchor CLI caches keyed on versions |
| 0.7 | Supabase project + env wiring | pending | Requires user-provided keys |
| 0.8 | GitHub repo + push | pending | Requires user sign-off |
| 0.9 | Phase 0 exit verification | pending | |

## Phase status

| Phase | Days | Status |
|---|---|---|
| Phase 0 — Bootstrap | Days 2–3 (Apr 23–24) | in_progress |
| Phase 1 — Core programs + happy paths | Days 4–7 (Apr 25–28) | not_started |
| Phase 2 — Disburse gate + borrower wizard + I1/I2 | Days 8–10 (Apr 29–May 1) | not_started |
| Phase 3 — Repayment, renewal, auction, I3, SSE | Days 11–13 (May 2–4) | not_started |
| Phase 4 — Rehearsal, polish, deploy, record | Days 14–16 (May 5–7) | not_started |
| Phase 5 — Submission | Days 17–18 (May 8–9) | not_started |

## Blockers / open decisions

- **D1–D7 from design doc §9** — defaults applied until answered.
- **Helius Devnet API key** — needed for Task 0.7.
- **Supabase project** — needed for Task 0.7.
- **GitHub remote URL** — needed for Task 0.8.

## Integration scope (confirmed)

- I1 Chrono24 + WatchCharts real pricing — Phase 2
- I2 gov.br mocked ID — Phase 2
- I3 Solana Pay QR — Phase 3
- I4 Civic/Blockpass hardcoded UI mock — Phase 1
