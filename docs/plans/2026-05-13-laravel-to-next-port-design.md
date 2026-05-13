# Vaulx — Laravel → Next.js port design

**Date:** 2026-05-13
**Status:** Approved direction (B2 — full port, parallel-run, no cutover until proven better)
**Owner:** George Dimitrov
**Supersedes:** none. Extends `docs/plans/2026-05-13-build-phase-design.md` §2 (the original dual-surface design assumed Laravel stayed indefinitely; this design replaces it with a Next.js consolidation, on a longer timeline).

---

## 1. Decision

The team will not run two stacks long-term. We port the full Laravel app at `site/` — public marketing **and** the borrower / evaluator / owner / admin / SIWS auth surfaces — into Next.js inside `apps/web/`.

Three non-negotiable principles, set by the operator:

1. **No cutover until proven better.** `vaulx.fi` (Laravel) keeps serving real users and judges until the Next.js port is demonstrably at least as good and ideally better on every flow. The bar is set by the operator, not the architect.
2. **Parallel-run on the same data.** Laravel and Next.js read/write the same Supabase Postgres throughout the port. No fork in the data layer; no migration window.
3. **Nothing is decommissioned until the replacement is validated.** Every wave lands as an additive route under `app.vaulx.fi` or a sibling subdomain. We do not delete the Laravel equivalent until the operator says so.

---

## 2. Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                       Supabase (Postgres)                        │
│              single source of truth for both apps                │
└──────────────────────────────────────────────────────────────────┘
                ▲                                       ▲
                │                                       │
┌───────────────┴────────────────┐     ┌───────────────┴────────────────┐
│  Laravel  (site/)              │     │  Next.js  (apps/web/)          │
│  vaulx.fi                      │     │  app.vaulx.fi                  │
│  AWS EC2 sa-east-1             │     │  Vercel                        │
│                                │     │                                │
│  [stays running unchanged]     │     │  [grows wave by wave]          │
│  - public marketing            │     │  - /demo (frozen mock)          │
│  - auth + SIWS                 │     │  - public marketing (W1)       │
│  - borrower portal             │     │  - auth + SIWS         (W2)    │
│  - evaluator portal            │     │  - borrower portal     (W3)    │
│  - owner portal                │     │  - evaluator portal    (W4)    │
│  - admin portal                │     │  - owner portal        (W5)    │
│                                │     │  - admin portal        (W6)    │
└────────────────────────────────┘     └────────────────────────────────┘
```

Both apps hit the same Supabase project. Schema is owned by Laravel migrations until further notice; Next.js reads/writes via Supabase JS client + typed Postgres clients. Schema changes during the port go through Laravel migrations (or Supabase migrations) and are picked up by Next automatically.

Session compatibility between the two apps is not required — a user logged into Laravel does not need to be auto-logged-in on Next during the port. The two surfaces are different URLs.

---

## 3. Implementation waves

Each wave = one spec doc + one or more PRs + agents (integrator, QA, security) + operator ACK. Waves are sequential by default but Wave 2 can run in parallel with Wave 3 if helpful.

### Wave 1 — Public surface
Home, simulator, FAQ, terms, team. Pixel-equivalent in Next using the design tokens extracted by the design-system discovery agent. Wires into `app.vaulx.fi/`. No auth dependency.

### Wave 2 — Auth + SIWS
NextAuth.js or custom session, SIWS challenge/verify ported, password reset, role model, magic-link demo login. Establishes the auth foundation every subsequent wave depends on.

### Wave 3 — Borrower portal
Dashboard, onboarding, loans. **This is also where the off-chain integrations land** — Crossmint smart-wallet, Sumsub KYC, Apify Chrono24 appraisal. Wires into `app.vaulx.fi/borrow`.

### Wave 4 — Evaluator portal
Online + offline evaluation flows, dashboard.

### Wave 5 — Owner portal
Evaluation decisions.

### Wave 6 — Admin portal
Largest. Dashboard, evaluators, loans, market-config, users, vaults, multisig monitor, BRZ monitor, cron-bot, on-chain events viewer.

### Wave 7 — Parity validation + cutover (operator-gated)
Side-by-side runs. Operator validates each surface feels at least as good as Laravel. Only then do we repoint `vaulx.fi` DNS at Vercel and archive Laravel.

---

## 4. On-chain work (separate track)

Independent of the port. Sequencing remains:

1. **Wave 3 trigger (Sumsub prod)** unlocks on-chain Sumsub attestation gate — first program upgrade since Frontier submission. Requires Squads V4 multisig signing. `loan` and `vault` programs gain an attestation account verification.
2. **Oracle activation** — Pyth + RedStone wired into vault and loan logic for LTV monitoring.
3. **cNFT issuance** — Metaplex Bubblegum compressed NFT carrying the full asset record.
4. **Dutch auction default flow** — auction program executes foreclosure.
5. **Audit + mainnet redeploy** — Phase 4 of the public roadmap.

The UI port and the on-chain track meet at Wave 3: borrower flow needs both the Next UI and the new on-chain gates.

---

## 5. Operating model for this port

Sub-agents per wave:

| Agent | Role |
|---|---|
| Discovery agents (4) | One-shot, kicked off at planning time. Output to `docs/plans/inventory/*.md`. Done. |
| Integrator agents (per wave) | Implement the wave per spec. One per PR. |
| QA reviewer | Reviews each PR diff against its spec. |
| Security auditor | Reviews any PR touching auth, money, KYC, custody, or PDAs. |
| Frontend designer | Design polish on visual surfaces (frontend-design skill). |

All four gates per PR (CI / QA / security / operator ACK) per CLAUDE.md §3.4.

---

## 6. Anti-goals

- We do not rewrite the Laravel app *in Laravel*. No PRs against `site/` during the port window beyond critical bug fixes.
- We do not change the Supabase schema *just because we can*. Migrations remain rare and well-justified.
- We do not build "improvements" the operator hasn't asked for during port waves. Parity first, polish later.
- We do not flip `vaulx.fi` DNS unilaterally. Operator authorizes the cutover.

---

## 7. Success criteria

- Every Laravel surface listed in `docs/plans/inventory/01-laravel-inventory.md` has a working Next.js equivalent at `app.vaulx.fi`.
- Both apps run side-by-side on the same Supabase data for at least one full operator-defined validation period.
- Operator signs off on cutover (Wave 7).
- DNS for `vaulx.fi` repoints to Vercel; Laravel `site/` archived under `Vaulxfi/vaulx-internal` or similar.
- Single-stack engineering thereafter.

---

## 8. Risks (named, not hidden)

| Risk | Mitigation |
|---|---|
| SIWS session semantics differ between Laravel and Next | Spec from auth-discovery agent must enumerate every edge case before Wave 2 ships |
| Schema drift between Laravel migrations and Supabase | Wave 3+ require schema-discovery agent's drift findings to be resolved first |
| Admin portal scope creep | Wave 6 is large; consider splitting into 6a (read-only views) and 6b (mutations) |
| Off-chain integrations land in an unfinished portal shell | Wave 3 acceptance criteria explicitly require both UI parity AND Crossmint/Sumsub/Apify production-tier wiring |
| Operator becomes blocker on every wave ACK | Schedule a recurring 30-min weekly review with the operator and queue ACKs in batches |

---

## 9. Next concrete action

Once the four discovery agents return, the architect (this session) synthesizes their outputs into:
- A consolidated **Wave 1 spec** at `docs/plans/2026-05-14-wave1-public-surface-spec.md`
- An updated `BACKLOG.md` with all 7 waves as discrete items
- The first integrator agent brief for Wave 1
