# Wave 2 — Auth + SIWS via Supabase Auth (meta-spec)

**Date:** 2026-05-14
**Status:** Approved direction (architect call)
**Branches:** four, in order — `feat/auth-supabase-foundation`, `feat/auth-email-password`, `feat/auth-siws-wallet`, `feat/auth-role-middleware`
**Gates per PR:** CI, QA review, **security review (auth + sessions + RLS)**, operator ACK

---

## Goal

Establish wallet-and-email identity for the Next app in `apps/web/`. After Wave 2, the app can hold a logged-in session, distinguish between user roles, and gate routes accordingly. Every wave after this depends on it.

The auth/SIWS discovery doc at `docs/plans/inventory/03-auth-and-siws.md` recommended **Supabase Auth** as the foundation. This spec commits to that direction.

---

## Architecture decision: Vaulx user identity vs Supabase auth.users

The Vaulx Next app needs a **user row** the borrower / evaluator / owner / admin flows can join against (loans, evaluations, decisions, etc.). Supabase Auth manages an `auth.users` table internally — we cannot join against it directly from app tables.

**Decision (architect call):** add a `public.users` table in Supabase Postgres that mirrors the Vaulx-side user concept. Every `public.users` row maps 1:1 to an `auth.users` row by id (`public.users.id` is a FK to `auth.users.id`). RLS is enforced so a user can only read/write their own row plus a small public-readable subset.

This is the long-term-correct shape because:
- Future tables (loans, assets, evaluations) can FK directly to `public.users.id`
- It's what the rest of the port plan needs anyway (Laravel's MySQL `users` will eventually retire — we're starting that today)
- Supabase docs explicitly recommend this pattern (https://supabase.com/docs/guides/auth/managing-user-data)

Laravel users on the existing MySQL side stay where they are during the port window. **No data migration in Wave 2.** New signups via the Next app create rows in Supabase. Eventually (post-Wave 6) we backfill / cut over Laravel users; that's a separate migration project.

---

## Identity model

| Concept | Where it lives | Notes |
|---|---|---|
| Auth credentials (email/password, OAuth tokens, wallet links) | `auth.users` (Supabase-managed) | Never read or written directly by app code |
| Vaulx app user row | `public.users` | 1:1 FK to auth.users.id |
| Role | `public.users.role` enum: `borrower \| admin \| evaluator_online \| evaluator_offline` | Single column, matches Laravel's discovery |
| Linked wallet | `public.users.solana_address` (b58, nullable, unique when set) | Set via SIWS flow |
| Display name, profile fields | `public.users.{display_name, ...}` | Editable on `/profile` |
| Sessions | Supabase Auth (JWT cookies) | Handled by `@supabase/ssr` |

---

## Four sub-PRs

### Wave 2.1 — Supabase Auth foundation
**Branch:** `feat/auth-supabase-foundation`
**Spec:** `docs/plans/2026-05-14-wave2.1-auth-foundation-spec.md` (separate file, written in this same PR)

- Supabase migration: `public.users` table with FK to `auth.users`, role enum, RLS policies
- Trigger: when `auth.users` row created, insert matching `public.users` row with `role = 'borrower'`
- TS helpers in `apps/web/src/lib/auth/`: `getServerUser()`, `requireUser()`, `useUser()` hook
- No new routes yet — only the foundation

### Wave 2.2 — Email/password routes
**Branch:** `feat/auth-email-password`
**Spec:** `docs/plans/2026-05-14-wave2.2-email-password-spec.md` (drafted when 2.1 lands)

- `/login`, `/register`, `/logout` (POST), `/forgot-password`, `/reset-password/[token]`
- Server components + Server Actions (no client-side fetch for credential flow)
- Uses Supabase Auth's `signInWithPassword`, `signUp`, `resetPasswordForEmail`
- Port the Laravel forms 1:1 in visual identity (Deck Light)
- **Drops** Laravel's `/csrf-fresh` and `auth.nocache` — Next handles CSRF and caching correctly out of the box

### Wave 2.3 — SIWS + wallet linking
**Branch:** `feat/auth-siws-wallet`
**Spec:** `docs/plans/2026-05-14-wave2.3-siws-spec.md` (drafted when 2.2 lands)

- "Sign in with Solana" button on `/login` and `/register`
- Uses Supabase Auth `signInWithWeb3` (handles nonce + ed25519 verify natively)
- On success: link the wallet to `public.users.solana_address`. If no `auth.users` row exists for this wallet → auto-create one with a synthetic email matching Laravel's `<pubkey>@siws.vaulx.local` pattern
- `/profile` page gets a "Link wallet" section

### Wave 2.4 — Role middleware + magic-link demo
**Branch:** `feat/auth-role-middleware`
**Spec:** `docs/plans/2026-05-14-wave2.4-role-middleware-spec.md` (drafted when 2.3 lands)

- Next middleware at `apps/web/src/middleware.ts` (or extends existing) that reads Supabase session and:
  - Redirects unauth users from auth-required paths to `/login`
  - Enforces role: `/admin/*` → role=admin only, `/evaluator/*` → role in (evaluator_online, evaluator_offline)
- **Magic-link demo route** at `/demo` — accepts `?token=DEMO_MAGIC_TOKEN` and signs in as a designated demo user via `Auth.signInWithIdToken` or admin-API helper. Matches Laravel's stateless `?token=` behavior including the CSRF bypass.

---

## Shared constraints across all four PRs

- **NO Laravel changes.** Laravel's MySQL `users` table is untouched.
- **NO program/IDL changes.** Wave 2 is off-chain only.
- **NO new on-chain attestations.** Sumsub attestation gate is Wave 3 territory.
- **NO password storage by us.** Supabase Auth handles credentials.
- Honor CLAUDE.md §2.1 (frozen surfaces): no edits to `/demo/*` page tree (the `/demo` MAGIC-LINK route is a separate sibling; not under `apps/web/src/app/demo/`), no edits to `site/`.
- **Visual identity:** Deck Light tokens from PR #11. Forms styled to match Laravel's auth views.

---

## Security gates per PR

Every Wave 2 PR touches auth, sessions, or credentials → **security review mandatory** per CLAUDE.md §3.4. Each PR's security brief calls out:
- Session cookie scoping (HttpOnly, SameSite, Secure)
- CSRF (Server Actions vs route handlers — different defaults)
- Password reset token entropy + TTL (Supabase handles by default; verify)
- Magic-link token (constant-time compare; mirror Laravel's pattern)
- RLS coverage on `public.users` and any new table
- SIWS replay protection (Supabase handles via nonce)

---

## Non-goals (explicit)

- Migrating Laravel users to Supabase. Deferred to post-Wave 6.
- Two-factor auth. Not in Laravel either; deferred indefinitely.
- OAuth providers (Google/Apple). Crossmint provides those at Wave 3.
- Wallet-only signups without an email. SIWS in 2.3 auto-creates a synthetic email matching Laravel.
- Renaming/restructuring the `(marketing)` route group from Wave 1.

---

## Open questions for the operator (default answers in italics — flip if you disagree)

1. **Should new SIWS-only users see a "Set an email/password" nudge on /profile?** *Default: yes, but optional — they can keep using SIWS forever.*
2. **What `DEMO_MAGIC_TOKEN` value?** *Default: read from `DEMO_MAGIC_TOKEN` env in Vercel; if unset, magic-link is disabled.*
3. **Email provider for password reset?** *Default: Supabase Auth's built-in (uses their SMTP). Switch later to Resend/SES if needed.*
4. **Should the `borrower` role be default for new signups?** *Default: yes, matches Laravel's auto-provision.*

I'll proceed with the defaults unless you tell me otherwise.

---

## Order of execution (architect plan)

1. **Now:** Write Wave 2.1 detail spec (separate file), commit, dispatch 2.1 integrator
2. **When 2.1 returns:** QA + Security review, open PR
3. **In parallel with 2.1 review:** draft 2.2 spec
4. **When 2.1 merges:** dispatch 2.2 integrator
5. **Same pattern for 2.3 then 2.4**

All four PRs target `main` directly (not stacked on each other) so they can land independently if Wave 2.x sub-PRs hit blockers. Code-level dependencies are managed by branching off the latest main each time.
