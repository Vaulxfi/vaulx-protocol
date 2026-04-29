# Vaulx — Full-Stack Build Design

**Date:** 2026-04-23 (Day 2 of 18)
**Owner of this plan:** gogy + Claude Code (this session)
**Submission deadline:** 2026-05-10
**Relationship to Edson:** Parallel hedge. Edson continues his track (Rust Anchor + integrations, 14h/week). We build the same scope independently. By Day 13 we pick whichever is demo-ready. If both work, we merge or demo ours and keep his as a post-hackathon base.

---

## 1. Scope confirmation

We own, end-to-end, a working alternative to everything Edson committed to:

| Layer | What we build | BRD reference |
|---|---|---|
| On-chain | TRDC, Vault, Loan, Auction Anchor programs (Rust) | Backend BRD §3–6 |
| Tests | 10 named Anchor tests, including 2 failing tests for Moment 6 | Backend BRD §7 |
| Off-chain | Log indexer, Supabase APIs, IPFS proxy, SSE test-runner | Backend BRD §8 |
| Frontend | Next.js 14 app — all roles, 9 demo moments, admin cockpit | Frontend BRD |
| Demo | Seed scripts, demo wallet orchestration, fallback video | Both BRDs |

**Demo integrations (in scope, to maximise judge impact):**

| # | Integration | Treatment | Moment | Budget |
|---|---|---|---|---|
| I1 | **Chrono24 + WatchCharts pricing** | **Real** — server-side scraper for Chrono24 + WatchCharts public API, blended into the triangular convergence display | Moment 2 | ~2 days |
| I2 | **gov.br digital ID** | **High-fidelity mock** — real logo/brand, CPF field, SERPRO-style confirmation redirect; no real OAuth | Moment 2 (borrower onboarding) | ~1 day |
| I3 | **Solana Pay QR code** | **Real** — Moment 5 repayment initiated by scanning QR with Phantom mobile | Moment 5 | ~1 day |
| I4 | **Civic / Blockpass KYC** | **Hardcoded UI mock** — branded modal with logos, 3-second "verifying" animation, fake green check | Lender onboarding | ~0.5 day |

**Not in scope for hackathon (deferred / skipped entirely):**
- Real Civic Pass / Blockpass OAuth — UI mock only (I4 above)
- Real BRL liquidity / FX rails — display-only
- Real Squads 2-of-3 multisig — dev feature flag bypass (Moment 9 is cut-first anyway)
- Real FIDC wrapper for retail vaults — "Active via FIDC wrapper" label only
- Formal audit, fuzz testing, mainnet deployment, PT-BR i18n, SMS/email, ZK provenance

---

## 2. Stack decisions (locked)

| Concern | Choice | Rationale |
|---|---|---|
| Frontend framework | Next.js 14 App Router | Matches BRD; Solana JS SDK ecosystem is native; Vercel deploy is zero-config |
| Styling | Tailwind + shadcn/ui | BRD-specified; operator aesthetic |
| State / data | TanStack Query + Zustand + RHF + Zod | BRD-specified |
| Solana client | `@coral-xyz/anchor` + `@solana/wallet-adapter-*` + `@metaplex-foundation/mpl-bubblegum` | Standard stack |
| RPC | Helius Devnet (paid tier) | Public Devnet is too slow/flaky for demo |
| Off-chain runtime | Node/TS, co-located in Next.js (API routes + a background worker for log subscription) | No extra deploy surface; shared types with frontend |
| Database | Supabase (Postgres + auth + storage) | BRD-specified |
| IPFS | web3.storage | BRD-specified |
| On-chain | Rust + Anchor 0.30 | No choice |
| Monorepo tool | pnpm workspaces + Turborepo | Shared IDL types across packages |
| Hosting | Vercel (web) + Supabase (db) | One-click deploys; submission URL = `vaulx.vercel.app` unless you buy a domain |
| CI | GitHub Actions — `anchor test` on every push to `programs/**`; Playwright E2E on every push to `apps/web/**` | BRD §7; blocks daily deploy on red |

---

## 3. Repo structure

Single pnpm monorepo at `/Users/gogy/MyCODE/VAULX`:

```
vaulx/
├── apps/
│   └── web/                      # Next.js 14 app (frontend + API routes + SSE)
│       ├── app/                  # App Router routes
│       ├── components/vaulx/     # All BRD components
│       ├── lib/chain/            # Anchor client wiring, wallet, explorer helpers
│       └── lib/offchain/         # Supabase client, IPFS client, indexer worker
├── programs/                     # Anchor workspace
│   ├── trdc/
│   ├── vault/
│   ├── loan/
│   └── auction/
├── packages/
│   ├── anchor-client/            # Generated TS client from IDLs (anchor-client-gen)
│   ├── idls/                     # Committed IDL JSONs (source of truth for FE)
│   ├── terms/                    # LTV/interest/fee math — shared by FE and Anchor tests
│   ├── ccb/                      # CCB PDF generator + hasher (client-side)
│   └── types/                    # Shared TS types (state enum, errors, etc.)
├── scripts/
│   ├── deploy-devnet.sh
│   ├── seed-demo.ts
│   └── record-test-video.sh
├── docs/
│   ├── plans/                    # This doc + implementation plan
│   └── DEPLOY.md
├── Anchor.toml
├── Cargo.toml
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

**Why monorepo:** IDL + types + math helpers cross the FE/chain boundary constantly. Separate repos cost a day of setup and another half-day every time an IDL changes. Monorepo collapses all of that to `pnpm build` + import.

**`packages/terms` is load-bearing.** LTV, interest, and fee math live here in pure TS with unit tests. The Anchor programs reference the same numerical constants (copied into Rust constants file, with a CI check that both sources agree). This is how we prevent FE/chain drift on money math.

---

## 4. Critical path + sequencing

There are three parallel tracks. Days are labeled by calendar date (today = Day 2, Apr 23).

### Track A — On-chain (Rust/Anchor)
| Day range | Deliverable |
|---|---|
| Day 2–3 (Apr 23–24) | Monorepo init, Anchor workspace, program skeletons, VaulxError enum, stub IDLs committed |
| Day 4–5 (Apr 25–26) | TRDC program state machine + metadata; Vault deposit/withdraw + share accounting |
| Day 6–7 (Apr 27–28) | Loan program: `create_ccb_trdc`, `confirm_custody`, CPI-gated `disburse`; happy-path test green |
| Day 8 (Apr 29) | The 2 named failing tests pass-as-fail with exact error names |
| Day 9 (Apr 30) | `pay_installment`, `repay_ccb`, `renew_ccb`; events emitted on all state transitions |
| Day 10 (May 1) | **IDL FREEZE.** Auction program skeleton + `mark_overdue` + `execute_af_default` |
| Day 11–12 (May 2–3) | Auction `place_bid` / `close_auction`; remaining 8 tests green |
| Day 13 (May 4) | Final Devnet deploy; program IDs committed to `programs.json` |

### Track B — Off-chain (Node/TS in Next.js)
| Day range | Deliverable |
|---|---|
| Day 3 (Apr 24) | Supabase schema, IPFS helpers, Next.js scaffold with TanStack + wallet adapter |
| Day 5 (Apr 26) | `POST /api/appraisal-requests`, appraisal submission, IPFS photo proxy |
| Day 7 (Apr 28) | Log listener worker (subscribes to all 4 programs' logs, writes to Supabase) |
| Day 9 (Apr 30) | `GET /api/tests/stream` SSE endpoint spawning `anchor test` |
| Day 11 (May 2) | `/api/demo/seed` + `/api/demo/advance/:moment` admin-gated endpoints |
| Day 13 (May 4) | **Fallback test-run video recorded** and committed to `/public/demo/test-run.mp4` |

### Track C — Frontend (Next.js)
| Day range | Deliverable |
|---|---|
| Day 3 (Apr 24) | `AppShell`, wallet connect, role switcher, shadcn theme wired, landing page |
| Day 4–5 (Apr 25–26) | Lender flow: `/lend/vaults`, `/lend/vaults/[id]`, deposit (Moment 1) + **Civic/Blockpass mock modal (I4)** |
| Day 6–8 (Apr 27–29) | Borrower wizard: asset → appraisal → terms → CCB sign (Moment 2) + **gov.br mocked ID flow (I2)** + **Chrono24/WatchCharts live pricing wired into triangular convergence (I1)** |
| Day 9 (Apr 30) | Awaiting-custody screen, custodian confirm UI (Moment 3) |
| Day 10 (May 1) | Disbursement display, loan detail, pay/repay flows (Moments 4–5); **Solana Pay QR for repayment (I3)**; IDL lock means client regenerated once and stable |
| Day 11 (May 2) | `/admin/tests` with SSE runner + ANSI rendering (Moment 6) |
| Day 12 (May 3) | Renewal (Moment 7), multi-currency display (Moment 8), auction UI (Moment 9) |
| Day 13 (May 4) | `/admin/demo` cockpit with 6 numbered moment buttons |
| Day 14 (May 5) | Full rehearsal across all 9 moments |
| Day 15 (May 6) | Fix rehearsal bugs; polish type + spacing + copy |
| Day 16 (May 7) | Prod Devnet deploy; record 3-minute demo video |
| Day 17 (May 8) | Buffer; submission prep |
| Day 18 (May 9) | Submission dry-run |
| **May 10** | **Submit** |

**Critical-path constraints (slipping these cascades):**
1. IDL freeze **Day 10 (May 1)**. Miss this → frontend Week 2 rebuilds.
2. Two failing tests green-as-fail by **Day 8 (Apr 29)**. Miss this → Moment 6 at risk.
3. Event emission complete by **Day 9 (Apr 30)**. Miss this → FE polls everywhere and feels slow.
4. Fallback video recorded **Day 13 (May 4)**. Non-negotiable. If SSE breaks on camera, video plays.

---

## 5. Cut order if time slips

Honor the BRD's cut order:

1. **First cut: Moment 9** (default → auction). Removes `auction` program complexity entirely if needed — frontend hides `/lend/auctions/*` routes.
2. **Second cut: Moment 8** (multi-currency). Show 1 vault instead of 4 on `/lend/vaults`. BRL vault + retail FIDC vaults hidden.
3. **Third cut: Moment 7** (renewal). `renew_ccb` instruction can stay as stub; frontend hides the renew button.
4. **Never cut: Moments 1–6.** These are the whole thesis.

**Additional cut order for polish:**
- `/about`, `/how-it-works`, `/team` pages → single landing page with anchor links
- Mobile responsiveness → desktop-only (1440p target matches recording)
- Safari support → Chrome-only
- i18n → English hardcoded, no `t()` wrapper

---

## 6. How we coordinate with Edson

Our build is a hedge, not a replacement.

| Edson ships by | We do |
|---|---|
| Day 10 IDL freeze, his Rust works | Compare. Pick whichever passes more tests. Likely his — he's the lead dev. Swap our IDLs for his; our FE + off-chain keeps running unchanged. |
| Day 10 IDL freeze, his Rust is flaky | Use ours. Keep his branch as reference. |
| Day 10 slipped, still trying | Use ours. Tell him we're demoing against our programs. He can continue or join the frontend track. |
| Day 13 he delivers but post-freeze | Do NOT swap. Risk of late-stage bugs exceeds benefit. Use ours; merge post-hackathon. |

**IDL contract:** both tracks produce IDL JSONs with identical instruction shapes (names, account orders, arg types, error enum variants). This is what makes swap-in-place possible. Managed in `packages/idls/` — whichever source is canonical, the frontend sees identical types.

**Daily 3:30 PM Vienna sync** with Edson as per BRD. We share our branch/IDLs with him so he can crib or cross-check.

---

## 7. Demo-moment dependency matrix

| Moment | Requires (our side) | Fallback |
|---|---|---|
| 1 — Lender deposit | Vault.deposit + `/lend/vaults/[id]` UI | Hand-sign via Solana CLI on camera |
| 2 — Borrower requests loan | Loan.create_ccb_trdc + wizard + triangular appraisal UI | Skip triangular; show 1 oracle value |
| 3 — Custodian confirms | Loan.confirm_custody + `/custodian/intake/[trdc]` | Admin UI calls instruction directly |
| 4 — Disburse | CPI from confirm_custody to Vault.disburse | Inline with Moment 3 |
| 5 — Repay | Loan.repay_ccb + `/borrow/loans/[trdc]/repay` | Solana CLI |
| **6 — Failing test** | SSE runner + `anchor test` + 2 failing tests green-as-fail | **Pre-recorded video at `/public/demo/test-run.mp4`** |
| 7 — Renewal | Loan.renew_ccb + renew UI | Cut |
| 8 — Multi-currency | 4 vault PDAs seeded + `/lend/vaults` grid | Show 1 vault |
| 9 — Default + auction | Loan.execute_af_default → Auction.* + bid UI | Cut |

---

## 8. Risks (ordered by severity)

| # | Risk | Mitigation |
|---|------|------------|
| 1 | **One operator owning all three tracks is too much.** Anchor suite + indexer + frontend + demo in 16 days is at the top of what's feasible even with AI assist. | Cut Moments 7–9 early and without guilt. Track A (Rust) is the real risk concentration — Track C (frontend) parallelizes cheaply. |
| 2 | **Rust learning curve / AI-generated Anchor code has subtle bugs.** Custody-gate invariant and CPI auth are security-critical. | Write the 2 failing tests BEFORE the `disburse` logic. TDD the invariant. Pair read every unsafe-shaped change. |
| 3 | **SSE test runner fails on demo day.** | Pre-recorded video by Day 13, zero-cost cutover on demo day, mandatory. |
| 4 | **Merge conflict with Edson's work.** Both shipping Rust programs in parallel → which IDL/programs.json wins? | Daily IDL diff. Decision owner: gogy. Decision point: Day 10 EOD, binding. |
| 5 | **Devnet RPC rate limits / flakiness.** | Helius paid tier from Day 1. Fall back to ephemeral `solana-test-validator` for test suite if Devnet slow. |
| 6 | **Wallet funding burned overnight.** | Airdrop automation script; pre-fund demo wallets Day 13 with 30× headroom. |
| 7 | **Demo wallet keypairs exposed.** | All demo wallets Devnet-only. Never put a mainnet key in the repo. Admin endpoints check server-side whitelist on every call. |

---

## 9. Decisions still needed from gogy

These block Day 1 kickoff. Please answer inline (a reply with `D1: X / D2: Y / …` is fine):

| # | Decision | Default if you don't answer |
|---|---|---|
| D1 | Demo custodian wallet — Vaulx-owned keypair or test keypair? | Fresh Devnet keypair, stored encrypted in 1Password, pubkey committed |
| D2 | Demo wallet funding — SOL + USDC amounts per wallet; who generates keypairs | 10 SOL + $50K USDC each; script generates 6 keypairs Day 3 |
| D3 | Design direction — accept BRD "operator aesthetic" or bring in a designer | Accept BRD defaults; polish with shadcn themes |
| D4 | Deployed domain | `vaulx.vercel.app` unless you buy one |
| D5 | Admin pubkey whitelist — your + Marcelo's Devnet wallets | Ask via follow-up |
| D6 | Repo write access — who beyond gogy (George/Marcelo/Edson read)? | Ask via follow-up |
| D7 | How we merge with Edson — do we tell him we're building a parallel track, or keep our work private until Day 10? | Tell him openly; framed as de-risking, not distrust |

---

## 10. Success criteria

We are done and shippable when:

- [ ] All 6 core demo moments execute end-to-end on Devnet against our programs (or Edson's, swapped in)
- [ ] `anchor test` green, with the 2 named failing tests failing with exact error names
- [ ] `/admin/tests` streams live test output in the browser (or the fallback video plays)
- [ ] 3-minute demo video recorded, showing Moments 1–6 minimum, 7–9 if time permitted
- [ ] Submission form filled, live URL working, program IDs documented in README
- [ ] Submitted by May 10

---

## 11. Next step

This document is the design. Once gogy reviews and approves, next step is to invoke the `superpowers:writing-plans` skill to produce the detailed implementation plan (file-by-file, task-by-task) that an implementing agent can execute against.

**Do not implement anything until this document is approved.**
