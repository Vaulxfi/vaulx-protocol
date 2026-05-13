# Architect handoff — Vaulx port phase

**To:** the new chief-architect session
**From:** the previous one (drift-aware)
**Date:** 2026-05-14
**Status:** in-flight; Wave 1 complete, Wave 2.1 PR open, Wave 2.2+ pending

If you're a fresh Claude session reading this, treat it as your full briefing. You don't need any prior conversation state — everything that matters is in this repo. Read the file list in §1 first, then come back here.

---

## 0. Who you are

You are the **chief architect** for the Vaulx Laravel→Next.js port. You operate from `CLAUDE.md` at the repo root. Your job is to **plan, decompose, delegate, integrate** — not to write production code yourself unless it's a mechanical 5-line fix.

You orchestrate sub-agents (integrator, QA reviewer, security auditor) and aggregate their `STATUS:` blocks into PR descriptions for the operator (George). The operator makes the merge call.

**Sub-agent invocation pattern (every time):**
1. Write a spec under `docs/plans/YYYY-MM-DD-<topic>-spec.md` first
2. Dispatch the integrator with the spec file path (not free-form tasks)
3. When integrator returns, dispatch QA + security reviewers (parallel) with the same spec path
4. Aggregate all `STATUS:` blocks into the PR body
5. Open the PR; operator merges

---

## 1. Read these files first (in order)

```
1. CLAUDE.md                                              # house rules, hard rules, gate model
2. BACKLOG.md                                             # canonical work list, 7+ waves queued
3. docs/plans/inventory/00-synthesis.md                   # discovery synthesis (post-Wave-0 corrections)
4. docs/plans/inventory/01-laravel-inventory.md           # full Laravel surface inventory
5. docs/plans/inventory/02-schema-and-data.md             # Postgres/MySQL schema findings
6. docs/plans/inventory/03-auth-and-siws.md               # auth model — CRITICAL for Wave 2
7. docs/plans/inventory/04-design-system.md               # Deck Light tokens, parity checklists
8. docs/plans/2026-05-13-laravel-to-next-port-design.md   # master design doc, B2 direction
9. docs/plans/2026-05-14-wave2-auth-spec.md               # Wave 2 meta-spec (wallet-native)
10. docs/plans/2026-05-14-wave2.2-wallet-auth-spec.md     # next dispatch target
```

After reading those, run:
```
gh pr list --limit 20
gh pr view 18  # the most recently opened — Wave 2.1
```

That gives you the full state.

---

## 2. Hard rules — non-negotiable

These come from `CLAUDE.md`. The previous session occasionally drifted on these — don't:

| Rule | Status |
|---|---|
| `site/` is FROZEN | Read-only. Don't edit anything under `site/` except true blocking emergency. |
| `apps/web/src/app/demo/*` is FROZEN | Read-only. CI grep rule already enforces no-personal-names. |
| `.github/workflows/ci.yml` — never touch the personal-names grep | Block (lines 33-41). Modifying it breaks demo-surface protection. |
| No force push, no `--no-verify`, no `--no-gpg-sign` | Sandbox blocks force-push to feature branches anyway. Don't try to work around. |
| No commits unless explicitly asked | The operator pulls the trigger. You open PRs, they merge. |
| No secrets in diff, ever | Even test placeholders should be obviously fake. |
| Never write production code > ~5 lines yourself | Dispatch an integrator. The exception is mechanical fixups after QA. |
| Every PR needs 4 gates | CI / QA / Security (when applicable) / Operator ACK. Cannot self-skip. |

---

## 3. Operating model (CLAUDE.md §3)

### Sub-agents you have
| Agent | When | Tool |
|---|---|---|
| Integrator | Writing integration code against a spec | `Agent(subagent_type: "general-purpose", isolation: "worktree", run_in_background: true)` |
| QA reviewer | Reviewing a branch against its spec | `Agent(subagent_type: "superpowers:code-reviewer", isolation: "worktree", run_in_background: true)` |
| Security auditor | Any PR touching env/money/KYC/custody/PDAs/auth | `Agent(subagent_type: "general-purpose")` with security-scoped brief |

**Always use `isolation: "worktree"` and `run_in_background: true`** so agents work in isolated worktrees and don't block your session.

### STATUS block contract
Every sub-agent must end with:
```
STATUS: shipped | partial | blocked
What landed: <bullets>
What's blocked: <bullets or "none">
What's next: <one line>
```
Include branch name, head SHA, deviations from spec with reasons.

### After agent returns
- **Don't trust the agent's analysis blindly.** Especially for crypto, RLS, signature verification, time-math claims. The previous session shipped a Wave 2.1 spec with an RLS recursion bug that the integrator reproduced because the spec said to. Reviewers caught it. Caught it. So read the diff yourself for anything security-sensitive.
- **Free the worktree** after pushing: `git worktree remove -f -f .claude/worktrees/agent-<id>`. They're 1-2GB each and accumulate.

---

## 4. Architectural decisions already locked — DO NOT re-litigate

### 4.1 The port direction: B2, full Laravel → Next port
Not B1 (port public surface only). Not Path A/C from Wave 2 deliberation. The operator wants the **whole Laravel app** ported into Next.js at `apps/web/`. Laravel stays running at `vaulx.fi`; Next deploys to `app.vaulx.fi`. Cutover happens when Edson signs off — not before.

### 4.2 Vaulx has NO real users on Laravel yet
This is critical. Laravel has been tested with synthetic accounts. **There is no user data to preserve or migrate.** Build the Next app as if you were building from scratch for new users. Don't design "parallel user pools," don't design cross-stack SSO bridges, don't fret about how Laravel users will move over — that's a non-problem.

The previous session wasted a full message exchange treating "don't decommission Laravel yet" as a complex architectural constraint when it's just "Laravel keeps running, build the real thing in Next."

### 4.3 Identity is wallet-native — NO email/password forms
Vaulx is wallet-first. The product uses Crossmint for non-crypto-natives (email/Google/Apple → smart wallet) and a direct wallet-adapter for crypto-natives. Both paths funnel through Supabase Auth's `signInWithWeb3`.

**No `/login`, no `/register`, no `/forgot-password`, no `/reset-password` routes.** A single "Sign in" modal with two paths replaces all four.

The previous session drafted email/password routes anyway. Don't repeat that. Read `docs/plans/2026-05-14-wave2.2-wallet-auth-spec.md` to see the wallet-native plan.

### 4.4 Laravel and Supabase are NOT a shared database
Discovery in Wave 0 revealed Laravel uses MySQL (`site/.env.example` has `DB_CONNECTION=mysql`). Supabase is Postgres. They are physically separate. There is no "shared `onchain_events` table" that the original synthesis claimed. See `docs/plans/inventory/00-synthesis.md` §2.2 for the corrected version.

### 4.5 Public users data lives in `public.users` (Supabase)
1:1 FK to `auth.users.id`. Single `role` enum column with 4 values: `borrower / admin / evaluator_online / evaluator_offline`. Wave 2.1 establishes this — see `feat/auth-supabase-foundation` branch / PR #18.

### 4.6 The on-chain `KycAttestation` has NO `expires_at` field
Just `attested_at`. Freshness is enforced off-chain via `KYC_MAX_AGE_DAYS` env (see PR #15 / `worktree-kyc-age` branch). Do not propose modifying the vault program to add expiry.

### 4.7 `packages/supabase/src/server.ts` has a broken `./env.js` import
Webpack from `apps/web` can't resolve it. Every Next route currently works around it by importing `createClient` from `@supabase/supabase-js` directly. Don't try to use `createServerClient` from `@vaulx/supabase` — write the cookie adapter inline (Wave 2.1 has the reference pattern in `apps/web/src/lib/auth/server.ts`). Fixing the package import is a separate housekeeping task that hasn't been spec'd.

### 4.8 Anchor 0.30.1 BorshAccountsCoder requires snake_case field names
`decoded.attested_at`, not `decoded.attestedAt`. Wave 2.1 PR description has a footnote about this. Tests should mock accordingly.

---

## 5. Current state (as of 2026-05-14)

### 12 PRs open
| PR | Title | Gates |
|---|---|---|
| #7 | Foundation (CLAUDE.md, BACKLOG, design doc) | docs |
| #8 | Port plan + 1,870 lines of discovery + Wave 2 specs | docs (extending) |
| #9 | vaulx.io → vaulx.fi comment cleanup | trivial |
| #10 | Wave 0 — Supabase schema + ccb-pdfs bucket | QA + Sec ✓ |
| #11 | Wave 1.1 — design tokens (Deck Light) | QA ✓ |
| #12 | ccb-storage server-mediated upload (wallet-sig auth) | QA + Sec ✓ |
| #13 | Wave 1.2 — home page | QA ✓ |
| #14 | Wave 1.4 — FAQ + Terms | QA ✓ |
| #15 | KYC age-check (worktree-kyc-age branch, stacked on #12) | QA + Sec ✓ |
| #16 | Wave 1.3 — simulator (numeric parity hand-verified) | QA ✓ |
| #17 | Wave 1.5 — team page | QA ✓ |
| #18 | Wave 2.1 — Supabase Auth foundation | QA + Sec ✓ after fix |

All PRs are docs-or-low-risk OR have full gate reports baked into their bodies. The operator (George) can merge whenever — order matters only for stacked PRs (see PR descriptions).

### Stacked PRs (merge order)
- #7 → #8 are stacked (port-plan stacks on foundation)
- #11 → #13 → (#14 + #16 + #17 all leaf-merge on #13)
- #12 → #15 (KYC age-check stacks on ccb-storage)
- #18 stacks on main directly

### Branches with pushed work
All on `origin/`:
- `docs/build-phase-foundation` (PR #7)
- `docs/port-plan` (PR #8)
- `fix/vaulx-io-comment-references` (PR #9)
- `feat/schema-recon` (PR #10)
- `feat/design-tokens-deck-light` (PR #11)
- `fix/ccb-storage-anon-rls` (PR #12)
- `feat/home-port` (PR #13)
- `feat/static-pages-port` (PR #14)
- `worktree-kyc-age` (PR #15 — should rename to `fix/kyc-attestation-age-check` after force-push authorization)
- `feat/simulator-port` (PR #16)
- `feat/team-port` (PR #17)
- `feat/auth-supabase-foundation` (PR #18)

### Chip tasks spawned (background, separate sessions)
- "Fix ccb-storage.ts anon-key upload" — became PR #12, can be dismissed
- "Parse KYC attestation expiry before flipping the gate" — became PR #15 (re-scoped to age-check; the on-chain struct has no expires_at, so we did off-chain max-age via env), can be dismissed

---

## 6. Wave plan — where we are

| # | Wave | Status |
|---|---|---|
| 0 | Schema reconciliation | PR #10 — open |
| 1 | Public surface port (5 sub-PRs) | **Complete** — #11/#13/#14/#16/#17 |
| **2.1** | **Supabase Auth foundation** | **PR #18 open, gates passed, fixes baked in** |
| **2.2** | **Wallet auth (Crossmint + SIWS unified)** | **Spec ready at `docs/plans/2026-05-14-wave2.2-wallet-auth-spec.md`. Awaiting operator nod on 4 defaults before dispatch.** |
| 2.3 | Account / wallet management (`/profile`) | Spec drafted when 2.2 lands |
| 2.4 | Role middleware + magic-link demo `/demo?token=` | Spec drafted when 2.3 lands |
| 3 | Borrower portal + Crossmint/Sumsub/Apify prod + first on-chain upgrade | Queued; needs Wave 2 first |
| 4 | Evaluator portal | After 3 |
| 5 | Owner portal | After 4 |
| 6 | Admin portal | After 5 |
| 7 | Parity validation + cutover (operator-gated) | After everything else |

---

## 7. Mistakes the previous session made — don't repeat

### 7.1 RLS recursion in Wave 2.1 spec
Wrote the `users_admin_read` policy as `using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'))`. This triggers Postgres `42P17 infinite recursion detected` because the inner SELECT is itself RLS-checked. Both reviewers caught it; the fix (PR #18 commit `62943ed`) extracts the check into a `SECURITY DEFINER` function.

**Lesson:** Any RLS policy that SELECTs from the same table it's gating needs a `SECURITY DEFINER` helper. Standard Supabase footgun. Spec admin/role checks via a function from now on.

### 7.2 Wave 2.2 email/password drift
Drafted login/register/reset routes despite knowing Vaulx is wallet-native. Operator caught it. Spec was discarded and rewritten as `docs/plans/2026-05-14-wave2.2-wallet-auth-spec.md`.

**Lesson:** When you draft a wave spec, re-read `docs/plans/inventory/03-auth-and-siws.md` first. The product is wallet-native. Period.

### 7.3 Overcomplicated "decommission Laravel" worry
Spent a full exchange analyzing Path A/B/C cross-stack SSO patterns when the actual situation (no real users on Laravel yet) makes it a non-problem.

**Lesson:** Before architecting around a perceived constraint, confirm the constraint exists. The operator told us upfront: "we don't have real users yet."

### 7.4 Worktree CWD slippage
Frequently lost track of which worktree was current. Recoverable via `cd` and `git worktree list`, but it slowed work. The flamboyant-euclid worktree at `/Users/gogy/MyCODE/VAULX/.claude/worktrees/flamboyant-euclid-8c570e` is the session worktree. The main worktree at `/Users/gogy/MyCODE/VAULX` can drift to different branches when agents run.

**Lesson:** Use absolute paths for Read/Edit/Write. After every `git checkout` confirm with `pwd && git branch --show-current`.

### 7.5 Trusting integrators' sequential-thinking on adversarial logic
The Wave 2.1 integrator's sequential-thinking analysis of RLS recursion was confidently wrong. Don't take agent reasoning at face value for security-sensitive logic — read the diff yourself.

---

## 8. Open questions awaiting operator decision

Before dispatching Wave 2.2 integrator, confirm or flip these 4 defaults from the spec:

1. "Continue with email or social" as the Crossmint CTA copy on the sign-in modal
2. Modal default shows the chooser (not auto-open Crossmint)
3. Synthetic email for direct-SIWS users uses `<pubkey>@siws.vaulx.local` (matches Laravel's pattern)
4. Auto-redirect to `/borrower` after sign-in (placeholder = `/` until Wave 3 lands the route)

Plus the standing question — **does the operator want to merge any of PRs #7–#18 before Wave 2.2 dispatches?** None block Wave 2.2 strictly, but landing the foundation gives Wave 2.2 a cleaner base.

---

## 9. Your next action

When you're done reading this doc and the files in §1, **summarize back to the operator** what you understand about the current state and what you intend to do first. Wait for their green light before any agent dispatch.

The most likely first action:
- If operator says "go," dispatch the Wave 2.2 integrator per `docs/plans/2026-05-14-wave2.2-wallet-auth-spec.md`
- If operator wants you to wait for PR merges first, sit tight and don't dispatch anything

**Do NOT auto-dispatch.** The previous session's strongest signal of drift was making strategic moves the operator had to reverse. Confirm direction before each agent dispatch from here forward, at least until the operator explicitly grants autonomy again.

---

## 10. Operating reminders (one more time)

- **Spec → integrator → QA → security → operator ACK.** Every PR. No skips.
- **isolation: "worktree", run_in_background: true** on every agent dispatch.
- **Free worktrees after push** with `git worktree remove -f -f`.
- **Read CLAUDE.md every time you're about to do something you haven't done in this session.**
- **No emoji in code. No drive-by comments. No filler ("honest", "robust", "world-class").**
- **Tell the operator when you don't know.** They prefer "I'm unsure, here's a clarifying question" over "I think I know what you meant."

Good luck. The repo is clean, the docs are dense, the gates work. Most of the heavy lifting is documented; you mostly need to keep the cadence going without shipping the next critical-RLS-bug-style mistake.

— previous architect
