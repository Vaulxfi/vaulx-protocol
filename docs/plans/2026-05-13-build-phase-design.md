# Vaulx — Build Phase Operating Design

**Date:** 2026-05-13
**Status:** Approved (working design)
**Owner:** George Dimitrov
**Scope:** Post-Colosseum Frontier submission build phase. Defines how we evolve the protocol toward mainnet without breaking the demoed surface, how Claude-as-senior-architect operates, and the first wave of integration PRs.

---

## 1. Context

We submitted to Colosseum Frontier on 2026-05-11. The judging window is open. The repository may continue to receive commits — Colosseum captures a submission snapshot, so post-submission work is allowed.

Two facts shape this phase:

1. **The demo surface is judge-recognizable.** Judges will revisit the demo video, then load the live site. The mocked flow shown in the video lives at `vaulx.fi` (Laravel) and `apps/web/src/app/demo/*` (Next.js). These surfaces must stay byte-stable until judging closes.
2. **The product must keep moving.** Crossmint, Sumsub, and Apify-Chrono24 are already wired at sandbox tier inside `apps/web/`. The next step is production credentials, real KYC, real appraisal, real custody and on-chain disbursement. We do not stall a Q3-2026 mainnet roadmap on a judging window.

---

## 2. Dual-surface architecture

One monorepo (`Vaulxfi/vaulx-protocol`), two deployable surfaces, both built from `main`:

| Surface | Source | Hosting | Domain | State |
|---|---|---|---|---|
| Marketing + frozen demo | `site/` (Laravel) | AWS EC2 `sa-east-1` (52.67.20.230) | `vaulx.fi` | **Frozen** until judging closes. Diff-locked via CODEOWNERS. |
| Live product (evolves) | `apps/web/` (Next.js) | Vercel | `app.vaulx.fi` (new CNAME) | Active development. Crossmint/Sumsub/Apify promoted to production. |

### Routing inside `apps/web/`

| Path | Behavior | Mutable? |
|---|---|---|
| `/demo/*` | Mocked flow shown in submission video | **Frozen** |
| `/borrow/*` | Real borrower journey | Active build |
| `/lend/*` | Real LP journey | Active build |
| `/` | Marketing landing, with banner: *"You're viewing the live build. The /demo route is the recorded submission flow."* | Active build |

The `/demo` subtree already exists in the repo and is protected by an existing CI rule (`.github/workflows/ci.yml` lines 33-41: no personal names in `apps/web/src/app/demo/`).

### Why this split is correct

- Judges loading `vaulx.fi` see exactly what the video showed.
- A judge curious enough to find `app.vaulx.fi` sees the protocol evolving — which is the message we want to send anyway.
- No branch divergence, no cherry-pick burden, no "frozen branch vs main" drift.
- Vercel and EC2 build from the same `main`. Different roots, different domains.

---

## 3. Integration roadmap (this phase)

Three integrations already exist at sandbox tier inside `apps/web/`. The build phase promotes each to production, in this order:

| # | Integration | Current state | Action | Branch |
|---|---|---|---|---|
| 1 | Crossmint smart-wallet + BR Non-Doc CPF | `@crossmint/client-sdk-react-ui@4.1.5` wired sandbox | Request prod tier, swap env keys, KYC field-mapping | `feat/crossmint-prod` |
| 2 | Apify Chrono24 reference prices | `apify-client@2.23.0` wired sandbox, `chrono24PriceViaApify()` in `apps/web/src/lib/appraisal/chrono24.ts` | Production token, scheduled actor runs, cache layer | `feat/apify-prod` |
| 3 | Sumsub KYC + SAS attestation | `@sumsub/websdk@2.6.2` wired sandbox, attestation/webhook/client modules under `apps/web/src/lib/sumsub/` | Submit prod-tier application (~1 week SLA), swap env, wire attestation issuance to gate money-touching instructions | `feat/sumsub-prod` |

Phase 2 of the public roadmap (cNFT issuance, Dutch-auction default flow, oracle-driven LTV) follows after these three are green.

---

## 4. Operating model

### Roles (Claude sub-agents)

| Agent | Type | Responsibility |
|---|---|---|
| `senior-architect` | (this session) | Plans, decomposes, delegates, integrates. Approves every PR. |
| `integrator` | `general-purpose` | Writes integration code per spec. One agent per integration PR. |
| `qa-reviewer` | `superpowers:code-reviewer` | Reviews against spec + coding standards before human ACK. **Blocking.** |
| `security-auditor` | `general-purpose` (scoped) | Reviews any PR that touches money paths, KYC, custody, or env-secrets handling. **Blocking on money/KYC/custody.** |
| `frontend-designer` | (frontend-design skill) | UI work on `/borrow`, `/lend`, marketing surfaces. |

### Mandatory gates (every PR)

1. **CI green** — TS lint/typecheck/test/build + Anchor build/test
2. **QA review** — code-reviewer agent signs off against the PR's design spec
3. **Security review** — security-auditor signs off if PR touches: env vars, money flow, KYC data, custody confirmation, oracle reads, multisig PDAs
4. **Human ACK** — George approves and merges

No PR merges without all four. Admin merge is permitted only for the foundation PR (this one) because it cannot be self-reviewed.

### Backlog mechanism

- Source of truth: `BACKLOG.md` at repo root. One section per active integration; status tags `[planned] [in-progress] [in-review] [shipped] [blocked]`.
- GitHub Issues mirror BACKLOG entries that need cross-team visibility. BACKLOG.md is the canonical list; Issues are projection.
- Per-task status report convention: every sub-agent ends its run with a `STATUS:` block — what shipped, what's blocked, what's next. The senior-architect aggregates these into a single update per PR.

### House rules (codified in CLAUDE.md)

CLAUDE.md at the repo root captures the rules every agent must follow. Highlights:

- Site freeze (`site/`, `apps/web/src/app/demo/*`) — diff-locked.
- Branch model: feature branches off `main`, PRs require 1 approval, conversation resolution required, no force push.
- Never commit secrets. `.env.example` only.
- Test discipline: every PR adds or updates tests covering new behavior.
- Brand voice: no personal names on public surfaces; "honest" / "transparent" / similar tics avoided in user-facing copy.
- Agent invocation: sub-agents are briefed with a spec file path, not a free-form task. Specs live in `docs/plans/`.

---

## 5. First wave of PRs

| Order | PR | Branch | Adds |
|---|---|---|---|
| 1 | Build-phase foundation (this) | `docs/build-phase-foundation` | `CLAUDE.md`, `BACKLOG.md`, design doc, `.github/CODEOWNERS` site-freeze reinforcement |
| 2 | Crossmint prod | `feat/crossmint-prod` | Env promotion, CPF mapping, smoke test on `app.vaulx.fi` |
| 3 | Apify Chrono24 prod | `feat/apify-prod` | Prod token, scheduled actor, cache, /borrow appraisal hook |
| 4 | Sumsub prod | `feat/sumsub-prod` (after SLA) | Prod tier, attestation issuance, gate wiring |

Each follow-on PR gets its own spec under `docs/plans/YYYY-MM-DD-<feat>-spec.md` written by the senior-architect before the integrator agent is invoked.

---

## 6. Deployment plumbing

### `vaulx.fi` (frozen)
- AWS EC2 `sa-east-1` 52.67.20.230, nginx in front of Laravel.
- Deploy: SSH + `git pull` from `main`, restart php-fpm if changed.
- Touch only if `site/` changes (and during freeze, it does not).

### `app.vaulx.fi` (new)
- Vercel project: `vaulx-web` (existing, currently serving `vaulx.vercel.app`).
- Root directory: `apps/web`.
- Build command: `pnpm -w turbo run build --filter=@vaulx/web`.
- Add custom domain `app.vaulx.fi`. Vercel issues SSL.
- CNAME record at DNS provider: `app  CNAME  cname.vercel-dns.com.`
- Set production env vars: Crossmint prod keys, Sumsub prod keys, Apify prod token. Never in repo.

---

## 7. Success criteria for this phase

- `CLAUDE.md`, `BACKLOG.md`, this design doc landed on `main` via PR.
- `app.vaulx.fi` resolves, serves the Next.js build, shows the live-build banner with a /demo link.
- Crossmint, Apify, Sumsub all promoted to prod with green CI and a smoke test demonstrating real-tier behavior.
- No `site/` or `/demo/*` byte changes between now and end of judging window.
- Phase 2 of `ROADMAP.md` (cNFT, Dutch auction, oracles) becomes the next planning target after the three integrations land.

---

## 8. Out of scope this phase

- cNFT issuance (Phase 2)
- Dutch-auction default flow (Phase 2)
- Pyth / RedStone oracle activation (Phase 2)
- Kamino V2 curated market (Phase 3)
- Grafeno CCB API (Phase 3)
- Mainnet redeploy (Phase 4)

These get their own design docs when the integrations above are green.
