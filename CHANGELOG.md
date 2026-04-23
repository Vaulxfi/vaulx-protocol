# Vaulx — Changelog

Chronological log of build progress. Newest at the top.

---

## 2026-04-23 — Phase 0 kickoff

- Wrote design doc: `docs/plans/2026-04-23-vaulx-full-stack-build-design.md`
- Wrote implementation plan: `docs/plans/2026-04-23-vaulx-build-plan.md`
- Started Phase 0 bootstrap execution (subagent-driven).
- Kicked off Rust 1.79 + Solana CLI 1.18.26 installation in background.
- **Task 0.1 completed:** initialized git repo on `main`, added `.gitignore` (incl. `.claude/`) and minimal `README.md`, committed design docs + STATUS + CHANGELOG. Legacy root-level `*.docx`/`*.pdf`/`*.png`/pre-Vaulx planning `.md` files left untracked pending triage.
- **Task 0.2 completed:** initialized pnpm workspace + Turborepo at repo root (`package.json`, `pnpm-workspace.yaml`, `turbo.json`, `pnpm-lock.yaml`); `packageManager` pinned to `pnpm@10.13.1` to match local install; `pnpm -w exec turbo --version` reports `2.9.6`.
- **Task 0.3 completed:** scaffolded shared packages `@vaulx/types`, `@vaulx/terms`, `@vaulx/ccb`, `@vaulx/anchor-client`, `@vaulx/idls`; added root `tsconfig.base.json`; TDD for LTV math in `@vaulx/terms` (test-first red, then impl green; `pnpm -r test` → 4/4 passing on vitest 1.6.x).
