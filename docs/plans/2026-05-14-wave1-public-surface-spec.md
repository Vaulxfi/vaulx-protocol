# Wave 1 — Public surface port spec (meta-spec)

**Date:** 2026-05-14
**Branches:** five, in order — `feat/design-tokens-deck-light`, `feat/home-port`, `feat/simulator-port`, `feat/static-pages-port`, `feat/team-port`
**Spec owner:** senior architect (this session)
**Gates per PR:** CI, QA review, operator ACK. Security review **not** required (no auth, no money, no PDA, no env).

---

## Goal

Port the 5 public marketing pages from Laravel `site/` to Next.js `apps/web/` with pixel-equivalent visual identity. Deploy to `app.vaulx.fi/`. Laravel `vaulx.fi/` stays untouched.

This wave does **not** add real product functionality. It establishes the visual foundation that every subsequent wave consumes.

---

## Why a meta-spec

Wave 1 produces 5 PRs because that's the size that lets each one merge cleanly, get a clean diff in review, and let the operator validate visual parity page-by-page without a 2000-line PR. Each PR gets its own focused integrator agent.

---

## PR sequence

### PR 1 — Design tokens reset (`feat/design-tokens-deck-light`)
**Files:** `apps/web/src/app/globals.css`, `apps/web/tailwind.config.ts`, `apps/web/src/app/layout.tsx` (fonts).
**Reference:** `docs/plans/inventory/04-design-system.md` §A (canonical Deck Light tokens) + §C (Tailwind config additions needed).
**Change:** replace the gold-scheme tokens with Deck Light values. Load Outfit + JetBrains Mono via `next/font/google`. Add the `ease-glide` token. Drop Fraunces and Instrument Sans.
**Acceptance:**
- A pure-token PR — no page-level visual changes yet, just the foundation.
- `globals.css` defines the full Deck Light palette (paper, ink, teal, etc.) per §A.1.
- `tailwind.config.ts` exposes the colors + fonts + easings used in §C.
- Existing pages still render (they'll look different — that's expected — but they don't crash).
- Tests pass.
**Integrator agent:** `general-purpose`, briefed against the design system inventory.
**QA agent:** code-reviewer.
**Notes:** This PR is intentionally small. Resist scope creep into page-level component changes — those land in PRs 2–5.

### PR 2 — Home page port (`feat/home-port`)
**Source:** `site/resources/views/home.blade.php` + `site/resources/views/layouts/app.blade.php` + `HomeController@index`.
**Files added:** `apps/web/src/app/(marketing)/page.tsx`, `apps/web/src/components/marketing/home/*` (hero, live-vault strip, CTAs, etc.).
**Files removed:** existing `apps/web/src/app/page.tsx` if it conflicts (move logic, don't lose work).
**Acceptance:**
- Pixel-equivalent to `vaulx.fi/` side-by-side in a desktop browser at 1440px width, with mobile-responsive parity at 375px.
- Live on-chain `LoanConfig` + `Vault` capacity read via the existing typed clients in `apps/web/src/lib/chain/` — Next reads, no Laravel API call.
- 60-second ISR or revalidation matching Laravel's cache window.
- All links work (the only outbound links from home are to `/simulator`, `/faq`, `/terms`, `/team`).
**QA agent:** code-reviewer with the inventory's §E.1 (home page parity checklist) attached.

### PR 3 — Simulator page port (`feat/simulator-port`)
**Source:** `site/resources/views/simulator.blade.php` + `HomeController@simulator`.
**Acceptance:**
- Interactive loan simulator with the same inputs (asset value, LTV slider, duration) and same on-chain capacity strip.
- Calculation logic matches Laravel's exactly (port `config/garantifi.php` constants into a typed TS module under `apps/web/src/lib/protocol/params.ts`).
- Pixel-equivalent layout.
**QA agent:** code-reviewer with §E.2 parity checklist.
**Risk:** simulator calculation drift between the two stacks would mean inconsistent loan-size estimates. Test plan must include numeric parity test (same inputs → same outputs to 6 decimal places).

### PR 4 — FAQ + Terms pages port (`feat/static-pages-port`)
**Source:** `site/resources/views/faq.blade.php`, `site/resources/views/terms.blade.php`.
**Acceptance:** static MDX or TSX with identical content. Pixel-equivalent. Both pages in one PR because they share a narrow-content layout pattern (`max-width: 860px`).
**QA agent:** code-reviewer with §E.3 + §E.4 parity checklists.

### PR 5 — Team page port (`feat/team-port`)
**Source:** `site/resources/views/team.blade.php` (already in context — 5-card layout with LinkedIn + email).
**Acceptance:**
- Pixel-equivalent at 5 viewports: 375 / 640 / 992 / 1280 / 1440. The 1280+ breakpoint uses CSS Grid 5-col per §E.5.
- LinkedIn + email links live and hover behaviour identical.
- This page is the **only** place personal names appear publicly per CLAUDE.md §2.4 — confirm CI's no-personal-names check excludes `/team` (it currently only scans `/demo` and `/components/vaulx/demo*`).
**QA agent:** code-reviewer with §E.5 parity checklist.

---

## Shared rules across all 5 PRs

- **Don't touch Laravel.** Read-only on `site/`.
- **Don't change the dual-route freeze.** `apps/web/src/app/demo/*` is untouched. We're adding `(marketing)/*` routes, not editing existing routes.
- **Single source of truth for design tokens:** PR 1's `globals.css` + `tailwind.config.ts`. PRs 2–5 only consume tokens; they don't re-declare colors.
- **Use Context7** for any shadcn / Tailwind / next/font question. Don't guess.
- **Side-by-side comparison** is the operator's primary review tool. Each PR description must include before/after screenshots at desktop + mobile widths, generated from the Vercel preview deploy.
- **No copy changes.** Word-for-word the same as Laravel. If a typo is found, flag it as a spawned chore task — do not fix inline.
- **Routing convention:** use a `(marketing)` route group so the marketing pages live separately from `/demo`, `/borrow`, `/lend`. Layout for `(marketing)` mirrors Laravel's `app.blade.php` (head metadata, navigation, footer).

---

## Acceptance for the wave as a whole

- All 5 PRs merged.
- `app.vaulx.fi/` shows the home page.
- `app.vaulx.fi/simulator`, `/faq`, `/terms`, `/team` all render and are pixel-equivalent to their Laravel counterparts.
- Operator has done a side-by-side at desktop + mobile and signed off on parity.
- Laravel `vaulx.fi/` is still serving these same pages, unchanged.

After Wave 1 closes we move to Wave 2 (auth + SIWS), which is when `app.vaulx.fi` starts being capable of holding a logged-in session.

---

## Anti-goals

- "Improve" the marketing copy.
- Add a "live build vs recorded demo" banner anywhere (the team didn't ask for it; the port is meant to be invisible).
- Refactor the existing `apps/web/src/app/page.tsx` beyond what's needed to install the new home page.
- Re-theme the `/demo` subtree (frozen per CLAUDE.md §2.1).

---

## Integrator briefing template (re-use per PR)

> You are the integrator for Wave 1 PR <N> of the Laravel→Next port. Read `/Users/gogy/MyCODE/VAULX/CLAUDE.md`, then this meta-spec at `/Users/gogy/MyCODE/VAULX/docs/plans/2026-05-14-wave1-public-surface-spec.md`, then the relevant inventory file(s): `docs/plans/inventory/04-design-system.md` for tokens and component mapping, `docs/plans/inventory/01-laravel-inventory.md` §3.1 for the Laravel view source.
>
> Implement only PR <N>. Branch: `feat/<branch-name>` off the latest `main` (after the foundation + port-plan PRs merge). Open a PR with before/after screenshots at 1440px and 375px.
>
> Use Context7 for any next/font, shadcn, or Tailwind v3 API lookup.
>
> End with the standard STATUS block.
