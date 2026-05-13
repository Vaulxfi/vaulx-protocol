# Vaulx — Backlog

Canonical list of active work. Mirrors selected items into GitHub Issues for cross-team visibility.

Status tags: `[planned]` `[in-progress]` `[in-review]` `[shipped]` `[blocked]`

Last updated: 2026-05-13

---

## Build phase — foundation

- `[in-review]` **Build-phase operating model** — `docs/build-phase-foundation` → PR #TBD
  Adds `CLAUDE.md`, this `BACKLOG.md`, design doc at `docs/plans/2026-05-13-build-phase-design.md`, CODEOWNERS site-freeze reinforcement.

- `[planned]` **`app.vaulx.fi` CNAME + Vercel custom domain**
  Owner: George. CNAME `app → cname.vercel-dns.com.`, attach to Vercel project `vaulx-web`. Verify TLS issuance and that the live-build banner renders on `/`.

---

## Integrations — sandbox → production

- `[planned]` **Crossmint production tier** — `feat/crossmint-prod`
  Promote `@crossmint/client-sdk-react-ui@4.1.5` from sandbox. Env shape already defined in `apps/web/.env.example` (`NEXT_PUBLIC_CROSSMINT_API_KEY`, `NEXT_PUBLIC_CROSSMINT_ENV`) with a prefix-guard in `apps/web/src/app/demo/_components/crossmint-wallet.tsx`. Tasks: request prod tier from Crossmint, lift the provider out of `/demo/_components/` into a shared `apps/web/src/lib/crossmint/` module so `/borrow` and `/lend` can use it, map BR Non-Doc CPF per Crossmint docs, add integration test, document in `docs/integrations/crossmint.md`. Prod keys go straight into Vercel env when approved.
  Gate: security review required (KYC + env).

- `[planned]` **Apify Chrono24 production token** — `feat/apify-prod`
  Promote `apify-client@2.23.0`. Env shape already defined (`APIFY_API_TOKEN`, `APIFY_CHRONO24_ACTOR_ID` defaults to `apify/chrono24-scraper`). `chrono24PriceViaApify()` at `apps/web/src/lib/appraisal/chrono24.ts` already drafted. Tasks: prod token in Vercel env, scheduled actor run, response cache layer, wire into `/borrow` appraisal step, add integration test with recorded fixture.
  Gate: standard QA review.

- `[blocked]` **Sumsub production tier** — `feat/sumsub-prod`
  Blocked on Sumsub prod-tier application (~1 week SLA). Env shape already defined (`sumsub_token`, `sumsub_secret`, `SUMSUB_WEBHOOK_SECRET`, `NEXT_PUBLIC_SUMSUB_LEVEL_NAME`); attestation/webhook/client modules in `apps/web/src/lib/sumsub/`. Once approved: prod token/secret in Vercel env, attestation issuance pipeline, wire SAS attestation as a precondition on every money-touching Anchor instruction.
  Gate: security review required (KYC + custody + money flow).

---

## Phase 2 — core feature completion (queued)

These follow the integration wave. Each gets its own design doc when picked up.

- `[planned]` **Live cNFT issuance per loan** — Metaplex Bubblegum compressed NFT carrying full asset record
- `[planned]` **Dutch-auction default flow** — auction program executes foreclosure
- `[planned]` **Full borrower lifecycle** — pay, partial repay, renewal, repayment-and-unlock
- `[planned]` **Oracle-driven LTV monitoring** — Pyth + RedStone wired into vault + loan logic
- `[planned]` **Production event indexing** — read-side hardening

---

## Shipped (recent)

- `[shipped]` Rust toolchain bump 1.85 → 1.88 (workflow + `rust-toolchain.toml`) — PR #6
- `[shipped]` ROADMAP rewrite — Phase 1 reframed as product capability, Phase 2 cleaned up, no personal names — merged commits `9c62be5`, `1268437`, follow-ups
- `[shipped]` Repo consolidation — `Vaulxfi/site` merged into `vaulx-protocol/site/`, internal docs moved to `Vaulxfi/vaulx-internal`
- `[shipped]` Branch protection on `main` — PR + 1 approval, no force push, no deletion, conversation resolution
- `[shipped]` CODEOWNERS team-based ownership
- `[shipped]` Colosseum Frontier submission — 2026-05-11

---

## Conventions

- One item per backlog row. If it's bigger than a PR, split it.
- A row carries: status, title, branch (if open), one-line scope, gate notes.
- When closing, replace the status tag with `[shipped]` and append `— PR #N, deployed <date>`.
- GitHub Issues are projections of this file. This file is canonical.
