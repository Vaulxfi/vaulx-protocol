# Discovery synthesis — Laravel → Next.js port

**Date:** 2026-05-13
**Sources:** the four discovery agents' outputs in this directory (`01-laravel-inventory.md`, `02-schema-and-data.md`, `03-auth-and-siws.md`, `04-design-system.md`). Read those for detail; this file is the architect's consolidated view.

---

## 1. Scope reality check

The Laravel app at `site/` is bigger than first framed but not unmanageable:

| Surface | Routes | Controllers | Views |
|---|---|---|---|
| Public marketing | 5 | 1 (`HomeController`) | 5 (home, simulator, faq, terms, team) |
| Auth (email + SIWS + reset + magic-link) | 11 | 3 (`AuthController`, `PasswordResetController`, `Api\SiwsController`) | 4 |
| Profile (shared) | 3 | 1 | 1 |
| Borrower | 7 | 1 | 5 |
| Evaluator | 5 | 1 | ~4 (online + offline + dashboard + sidebar) |
| Owner decision | 2 | 1 | 1 |
| Admin | ~12 | 1 (`AdminController` is large) | ~12 |
| API + webhooks | 8 | 3 | — |
| **Totals** | **~53 routes** | **11 controllers** | **37 Blade views + 16 components** |

Plus: 12 models, 15 middleware, 10 notifications, 8 services, 6 scheduled commands, 6 providers.

Bottom line — the port is meaningful work, but it's a finite, well-bounded set. Each wave is a tractable PR-or-three.

---

## 2. The three findings that change the wave order

### 2.1 The Next.js design tokens are wrong
`apps/web/src/app/globals.css` ships a gold-based scheme (`--brand: #d4af37`, Fraunces serif, Instrument Sans) that does **not** match what `vaulx.fi` renders. The actual canonical surface is **Deck Light** — paper `#FAFAF7`, ink `#0A0A0B`, teal `#0E7C7B / #2BA09E`, Outfit + JetBrains Mono. Until tokens are aligned, no pixel-port can be faithful.

**Action:** Wave 1 starts with a token-reset PR (no page work, just `globals.css` + `tailwind.config.ts`). Every subsequent page port consumes the new tokens.

### 2.2 `onchain_events` schema is drifted between Laravel and Supabase
The only Laravel↔Next shared table today, and the two migrations disagree on five points: PK type (uuid vs bigint), composite vs single-column UNIQUE, timestamp column name (`occurred_at` vs `created_at`), nullability of `payload`/`slot`/`signature`, and indexes. Next route handlers query the Supabase shape; Laravel writes the Laravel shape. Today this works only because they bypass each other's expectations via service-role inserts.

**Action:** Wave 0 — schema reconciliation. A small server-only PR that aligns the Supabase migration to the Laravel canonical shape, plus a migration for the missing `ccb-pdfs` Supabase Storage bucket. Must land before any Wave 3 (borrower) parallel-run.

### 2.3 Auth model is simpler than feared
- Roles: a single `role` column on `users` with four values — `borrower | admin | evaluator_online | evaluator_offline`. No Spatie, no policies, no gates. "Owner" is not a role; it's the asset-owner concept inside `OwnerDecisionController`. "Super admin" is an alias.
- SIWS: nonce in Laravel cache (5-min TTL, single-use via `Cache::pull`), message = static format with `host`/`nonce`/`issued_at`, verify via `sodium_crypto_sign_verify_detached` (ed25519). Auto-provisions users as `role=borrower` with synthetic emails `<pubkey>@siws.vaulx.local`.
- Supabase Auth already supports `signInWithWeb3` — we **do not** need to re-implement signature verification in Next. The Next port for SIWS is a Supabase Auth call, not a crypto-engineering project.
- `/csrf-fresh` is a Laravel/nginx-cache workaround. **Dropped in the port.**

**Action:** Wave 2 (auth) becomes a Supabase-Auth wiring job rather than a from-scratch implementation. Much lower risk than initially feared.

---

## 3. Updated wave sequence

| # | Wave | Branches | Notes |
|---|---|---|---|
| **0** | Schema reconciliation | `feat/schema-recon` | Server-only. Aligns `onchain_events`, adds `ccb-pdfs` Storage migration. Pre-req for Wave 3. |
| **1** | Public surface port (5 pages + token reset) | `feat/design-tokens-deck-light`, then `feat/home-port`, `feat/simulator-port`, `feat/static-pages-port`, `feat/team-port` | Wave 1's first PR is the token reset. Then four page ports. |
| **2** | Auth + SIWS via Supabase Auth | `feat/auth-port` | Email/password, SIWS (`signInWithWeb3`), password reset, magic-link demo login, role middleware. Drops `/csrf-fresh` and `auth.nocache`. |
| **3** | Borrower portal + off-chain integrations | `feat/borrower-portal-port`, `feat/crossmint-prod`, `feat/apify-prod`, `feat/sumsub-prod` | Wave 3 is where the protocol stops being half-mocked. Crossmint/Apify wire here; Sumsub when SLA clears. **Triggers first on-chain program upgrade** (Sumsub attestation gate on `loan` + `vault`). |
| **4** | Evaluator portal | `feat/evaluator-portal-port` | Online + offline flows. |
| **5** | Owner portal | `feat/owner-portal-port` | Smallest portal. |
| **6** | Admin portal | `feat/admin-portal-port` (may split into 6a read-only and 6b mutations) | Largest. ~12 admin views. |
| **7** | Parity validation + cutover | `chore/dns-cutover` | Operator-gated. Side-by-side validation period, then DNS repoint and Laravel archive. |

---

## 4. Findings flagged for follow-up (out of scope for the port itself)

The discovery agents surfaced 28+ anomalies in Laravel that aren't port blockers but are worth a separate housekeeping pass:

- Broken route reference `borrower.assets.index` in `OfflineReportCompleted.php:34`
- Dead `welcome.blade.php`
- Unused `EvaluatorController` legacy methods
- `EvaluationAssigned` notification has no caller
- Hardcoded interest constants overriding config
- Public-disk file uploads with no cleanup
- `OnchainEvent::firstOrCreate({})` bug when a signatureless payload arrives
- No RLS policies in `supabase/migrations/` (service-role bypass works for server-only; needs policies before any client-side read)

These get spawned as separate small chores from the senior architect, not bundled into port waves.

---

## 5. Risks the port plan now mitigates

| Risk | Mitigation in this plan |
|---|---|
| "Port wrong palette" | Wave 1 leads with the design token PR before any page |
| "Parallel-run shows inconsistent data" | Wave 0 reconciles `onchain_events` before any portal port |
| "SIWS becomes a 3-month project" | Use Supabase Auth `signInWithWeb3`, not a from-scratch port |
| "Schema migrations during port break Laravel" | Migrations rare; when needed, run via Laravel side first so Laravel is the source of truth |
| "Admin port balloons" | Wave 6 may split 6a (read) / 6b (mutations) if scope expands |
| "Cutover is unilateral" | Wave 7 is operator-gated; no DNS flip without operator sign-off per wave |

---

## 6. What the architect is delivering next

- `docs/plans/2026-05-14-wave0-schema-recon-spec.md` — Wave 0 spec
- `docs/plans/2026-05-14-wave1-public-surface-spec.md` — Wave 1 meta-spec (token reset + 4 page-port PRs)
- Updated `BACKLOG.md` reflecting the renumbered 0–7 wave sequence
- Updated `docs/plans/2026-05-13-laravel-to-next-port-design.md` §3 reflecting the renumbering and the discovery-driven decisions
- Branch `docs/port-plan` pushed; PR opened (stacked on PR #7)

Once that PR is in flight, the first integrator agents get dispatched for Wave 0 + Wave 1 step 1 (token reset). Both are small and can run in parallel — they touch zero overlapping files.
