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
- **Task 0.4 in progress:** Anchor workspace scaffolded (4 program crates `trdc`/`vault`/`loan`/`auction` with `ping`, workspace `Cargo.toml`, `Anchor.toml`, `rust-toolchain.toml`, `tests/bootstrap.ts`, `@coral-xyz/anchor@0.30.1`). `anchor keys sync` generated real pubkeys. `anchor build --no-idl` succeeds. Full `anchor build` blocked: anchor-syn 0.30.1 calls removed `proc_macro2::Span::source_file()` (API removed in pm2 1.0.106+). Unblock path: bump Rust toolchain to 1.85+, revert transitive-dep `cargo update --precise` downgrades, rerun `anchor build`.
- **Task 0.4 completed:** Anchor workspace green. rustc upgraded to 1.85.0 to unblock proc-macro2 API requirements. `anchor build` + `anchor test` pass; all 4 programs deploy and respond to `ping`. Real program IDs committed. Final blocker was resolved by vendoring `anchor-syn-0.30.1` at `vendor/anchor-syn` (via `[patch.crates-io]`) with the unused `source_file()`-dependent cross-file type alias path disabled — the API was removed from stdlib post-1.79, and the codepath it gated is not needed for our programs. Transitive crates that require `edition2024` (block-buffer 0.12, borsh 1.6, hashbrown 0.17, indexmap 2.14, proc-macro-crate 3.5, unicode-segmentation 1.13) remain pinned to pre-edition2024 releases because platform-tools 1.41 ships cargo 1.75. `solana-test-validator` on macOS required `COPYFILE_DISABLE=1` to avoid `._genesis.bin` resource-fork in the genesis tarball.
- **Task 0.3 completed:** scaffolded shared packages `@vaulx/types`, `@vaulx/terms`, `@vaulx/ccb`, `@vaulx/anchor-client`, `@vaulx/idls`; added root `tsconfig.base.json`; TDD for LTV math in `@vaulx/terms` (test-first red, then impl green; `pnpm -r test` → 4/4 passing on vitest 1.6.x).
