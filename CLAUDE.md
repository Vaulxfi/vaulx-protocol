# CLAUDE.md — Vaulx Protocol house rules

Read this file before doing any work in this repo. It binds all agents (Claude and sub-agents) operating against this codebase.

---

## 1. What this repo is

Vaulx is a Solana-native credit rail that turns physical luxury collateral into on-chain USDC loans. Four Anchor programs (`trdc`, `vault`, `loan`, `auction`) settle the atomic custody-to-disbursement invariant. Monorepo: pnpm workspaces + Turborepo.

Submitted to Colosseum Frontier on 2026-05-11. Mainnet target Q3 2026.

| Surface | Source | Domain | State |
|---|---|---|---|
| Frozen marketing + demo | `site/` (Laravel) | `vaulx.fi` | Freeze until judging closes |
| Live product | `apps/web/` (Next.js) | `app.vaulx.fi` | Active build |

Internal docs and notes live in the private `Vaulxfi/vaulx-internal` repo, not here.

---

## 2. Hard rules

### 2.1 Site freeze (judging window)
- Do **not** modify `site/` in any way until further notice.
- Do **not** modify `apps/web/src/app/demo/*`. The CI rule at `.github/workflows/ci.yml:33-41` enforces no personal names; this rule extends it: no semantic changes either.
- Marketing copy on `vaulx.fi` mirrors the submission video. Treat it as a release artefact.

### 2.2 Secrets
- Never commit secrets. Use `.env.example` for shape, real values live in Vercel/EC2/1Password.
- Never log secrets, even in transient debugging.
- If you spot a leaked secret in history, stop and tell George.

### 2.3 Branch + PR discipline
- Work on feature branches off `main`. Never push to `main`.
- PRs require 1 approval, CI green, conversation resolution.
- No `--force` push. No `--no-verify`. No `--no-gpg-sign`.
- Squash merge unless the PR is a coordinated multi-commit change (rare).
- Branch naming: `feat/<slug>`, `fix/<slug>`, `docs/<slug>`, `chore/<slug>`.

### 2.4 Public surfaces
- No personal names on public-facing surfaces (`apps/web/src/app/demo/*`, ROADMAP.md, README.md, marketing copy). Team page at `site/resources/views/team.blade.php` is the only exception.
- No emojis in code, commits, or PR bodies unless George asks.
- Avoid filler adjectives ("honest", "transparent", "robust", "world-class"). State what the thing does.

---

## 3. Operating model

### 3.1 Senior architect (this top-level Claude session)
- Plans every change before delegating.
- Writes a spec under `docs/plans/YYYY-MM-DD-<topic>-spec.md` before invoking an integrator.
- Aggregates sub-agent `STATUS:` blocks into the PR description.
- Never merges without all four gates green (CI, QA, security if applicable, human ACK).

### 3.2 Sub-agents

| Agent | When | Tool |
|---|---|---|
| Integrator | Writing integration code against a spec | `Agent(subagent_type: "general-purpose")` |
| QA reviewer | Reviewing a finished branch against its spec | `Agent(subagent_type: "superpowers:code-reviewer")` |
| Security auditor | Any PR touching env, money flow, KYC, custody, oracles, multisig PDAs | `Agent(subagent_type: "general-purpose")` with scoped security brief |
| Frontend designer | UI work on `/borrow`, `/lend`, marketing | `frontend-design` skill |

Every sub-agent receives a spec file path, not a free-form task. The spec defines: goal, file scope, acceptance criteria, test plan, out-of-scope.

### 3.3 STATUS block (every sub-agent run)
Every sub-agent ends its run with:
```
STATUS: <shipped|blocked|partial>
What landed: <bullet list of files/behavior>
What's blocked: <bullet list or "none">
What's next: <one-line handoff>
```

### 3.4 Mandatory gates per PR
1. CI green (TS + Anchor jobs)
2. QA reviewer sign-off against the PR's spec
3. Security auditor sign-off if money/KYC/custody/oracles/PDAs touched
4. George ACKs and merges

A PR cannot self-skip a gate. If a gate is not applicable, the architect states why in the PR body.

---

## 4. Backlog mechanism

- `BACKLOG.md` at repo root is the canonical list. Status tags: `[planned] [in-progress] [in-review] [shipped] [blocked]`.
- GitHub Issues mirror BACKLOG entries that need external visibility.
- When closing a backlog item, link the merged PR and the deploy URL.

---

## 5. Coding standards

- **Read before write.** Read any file before editing it.
- **Edit before create.** Prefer editing existing files over creating new ones.
- **No drive-by comments.** Don't add comments, docstrings, or type annotations to code you didn't change.
- **YAGNI.** Minimum complexity for current requirements.
- **Tests.** Every behavior-changing PR adds or updates tests. New TS modules ship with vitest coverage. New Anchor instructions ship with integration tests.
- **Context7 first.** For any third-party library API (Crossmint, Sumsub, Apify, Anchor, Solana web3, Pyth, Kamino), fetch current docs via Context7 before writing code. Do not guess APIs from training data.
- **Sequential thinking.** Use it for architecture decisions and tradeoff analysis.

---

## 6. Testing + CI

- `pnpm -w turbo run lint typecheck test build` must pass locally before pushing.
- `anchor build && anchor test` must pass for any program change.
- CI is the source of truth, but a broken local run is a broken PR.
- Rust toolchain: pinned to `1.88.0` in `rust-toolchain.toml`. Do not change without coordinating.

---

## 7. Reporting style

When the senior-architect reports back to George:
- Lead with the result, then the evidence.
- File paths as `file:line` where relevant.
- No status theatre. No "Now let me…", "I'll proceed to…". Do the work, then report.
- One short paragraph max per PR. Bullets for multi-PR rollups.

---

## 8. Brand voice (for any user-facing copy)

- Direct, technical, no marketing fluff.
- Concrete numbers over adjectives.
- Active voice, present tense.
- No emojis. No "honest" / "transparent" / "world-class" / "robust".
- Reference Vaulx as "Vaulx" or "Vaulx Protocol", never "we" in third-person docs unless contextually clear.

---

## 9. When in doubt

Ask George. The cost of a clarifying question is one minute. The cost of a wrong assumption is a revert, a re-review, and a credibility hit.
