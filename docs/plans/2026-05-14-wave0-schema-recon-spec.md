# Wave 0 — Schema reconciliation spec

**Date:** 2026-05-14
**Branch:** `feat/schema-recon`
**Spec owner:** senior architect (this session)
**Integrator:** TBD (subagent, briefed against this file)
**Gates:** CI, QA review, **security review (data layer)**, operator ACK

---

## Goal

Reconcile the `onchain_events` table between Laravel and Supabase so both apps can parallel-run on the same Postgres without silent inconsistency. Add the missing `ccb-pdfs` Supabase Storage bucket migration. No app code changes.

This is a server-only, Postgres-only PR.

---

## Why this is Wave 0

Discovered during inventory: the Laravel migration for `onchain_events` and the Supabase migration disagree on five points, and Next.js route handlers query the Supabase shape while Laravel writes the Laravel shape. This works today only because both sides use service-role inserts and don't read each other's rows critically. Wave 3 (borrower portal) is the first time the Next app reads back rows that Laravel wrote — that's when drift becomes a bug. We fix it now.

---

## Concrete divergences to resolve

Source of truth: the **Laravel migration `2026_05_04_000001`** is the canonical shape (it explicitly fixes the unique-constraint issue, and Laravel is the authoritative writer today). Supabase's migration is the one that adapts.

| Field | Laravel (canonical) | Supabase (current) | Action |
|---|---|---|---|
| Primary key | `uuid` | `bigint` | Change Supabase migration to `uuid` PK |
| Unique constraint | `(signature, event_name)` composite | `signature` only | Drop single-column UNIQUE, add composite UNIQUE |
| Timestamp | `occurred_at timestamptz` | `created_at timestamptz` | Add `occurred_at`; keep `created_at` as audit (when row landed) |
| `payload` nullability | nullable | not-null | Make nullable |
| `slot` nullability | nullable | not-null | Make nullable |
| `signature` nullability | not-null | nullable | Make not-null |
| Indexes | (Laravel set) | (Supabase set) | Align to Laravel's index set; add anything Next queries by |

Spec author **must** open `docs/plans/inventory/02-schema-and-data.md` §C ("Supabase vs Laravel migration drift") and use that as the canonical diff. Do not invent column shapes from this doc.

---

## Files to change

1. `supabase/migrations/<new-timestamp>_reconcile_onchain_events.sql` — new migration. Idempotent. Safe to run against current Devnet data (which is small; if needed, allow row recreation).

2. `supabase/migrations/<new-timestamp>_create_ccb_pdfs_bucket.sql` — new migration. Creates the `ccb-pdfs` Storage bucket referenced by `apps/web/src/lib/chain/ccb-storage.ts:19`. Public read off. Server-only writes via service role.

3. `apps/web/src/lib/chain/onchain-events.ts` (if it exists) and any route handler that filters by `created_at` on the `onchain_events` table — switch query to `occurred_at` per the canonical shape. List from inventory:
   - `apps/web/src/app/api/auctions/route.ts:90`
   - `apps/web/src/app/api/auctions/[id]/bids/route.ts:38`
   - `apps/web/src/app/api/onchain-events/ticker/route.ts:86`
   - `apps/web/src/app/api/onchain-events/custody-confirmed/route.ts:44`

No Laravel changes. Laravel is already on the canonical shape.

---

## Acceptance criteria

1. New Supabase migrations run cleanly on the Devnet Supabase project (apply locally with `supabase db reset` against the migrations directory, then push).
2. After migration, `\d onchain_events` matches the Laravel canonical shape exactly (PK type, unique constraint, columns, nullability).
3. `ccb-pdfs` Storage bucket exists and is private (no public read).
4. The four Next.js route handlers above use `occurred_at` and return identical-shaped responses to before (verified via vitest fixture or by running the dev server against a seeded DB).
5. CI green on `feat/schema-recon`.
6. Security reviewer signs off (data-layer changes always require this gate).

---

## Test plan

- Vitest: update or add tests for each of the four route handlers above. Use a fixture row with both `occurred_at` and `created_at` to verify the handler selects by `occurred_at`.
- Manual: `supabase db reset` locally; insert a sample event via Laravel; query from Next; confirm match.
- Manual: confirm storage bucket exists and rejects anonymous downloads.

---

## Out of scope

- RLS policies — separate concern (Wave 5 area; Owner/Admin portals would need them first).
- Backfilling production data — Devnet is small enough to recreate.
- Any change to programs, anchor IDLs, or off-chain bridge logic.
- Any Laravel code change.

---

## Integrator brief (paste this to the subagent)

> You are the integrator for Wave 0 of the Laravel→Next port. Read `/Users/gogy/MyCODE/VAULX/CLAUDE.md`, then this spec at `/Users/gogy/MyCODE/VAULX/docs/plans/2026-05-14-wave0-schema-recon-spec.md`, then the canonical diff at `/Users/gogy/MyCODE/VAULX/docs/plans/inventory/02-schema-and-data.md` §C.
>
> Implement the spec exactly. Branch is `feat/schema-recon` off the latest `main` (after PR #7 and the port-plan PR merge). Do not change anything outside the files listed under "Files to change."
>
> End with the standard STATUS block.

---

## Security reviewer brief (paste to subagent)

> Review PR for Wave 0 schema reconciliation. Focus areas:
> 1. New Supabase migrations are idempotent and safe to re-run.
> 2. Storage bucket policy is private (no anonymous reads).
> 3. Query changes in the four route handlers do not introduce SQL injection paths or change auth scoping.
> 4. No secrets in migrations or env diffs.
>
> Pass/fail with reasons. End with a STATUS block.
