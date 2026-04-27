# Vaulx — User TODOs

> Actions that require **you** (not Claude). Check off as you complete.

---

## Active items as of 2026-04-27

### Devnet contracts deploy — DEFERRED until code review

- [ ] Payer wallet has 35 SOL on devnet (sufficient for `--final` deploy of all 4 programs ≈ 9.55 SOL).
- [ ] When ready: code review + audit pass before deploying to devnet. Programs are immutable in `--final` mode — review costs zero, redeploy costs ~9 SOL.
- [ ] Trigger: ping me when you want the deploy step to run; takes <30 min once authorized.

### Apify (Chrono24 production scraping) — DEFER until needed

- [ ] **Decision needed before production launch:** demo currently uses fallback-safe scraper at `apps/web/src/lib/appraisal/chrono24.ts` + deterministic random walk for the dashboard tick. For production, Apify's maintained Chrono24 actor is more reliable.
- [ ] If/when ready: get an Apify API token + paste into `.env` as `APIFY_API_TOKEN=...`. Swap takes ~1 day.
- [ ] Currently P2 — not blocking demo or first-customer flows.

### Crossmint solutions team — pre-prod call (Felipe / Marcelo)

- [ ] Confirm smart-wallet program audit + upgrade-authority governance (Squads V4 timelock minimum)
- [ ] Confirm Civic Pass + gov.br ouro acceptance as Full KYC liveness gate (no duplicate check)
- [ ] Confirm BR-resident Create User field schema (CPF? RG? CNH? employment? source of funds?)
- [ ] Confirm per-region custom-token JWT bridge (gov.br for BR; Aadhaar for IN; eIDAS for EU)
- [ ] Confirm MiCA CASP umbrella for Vaulx (BR entity, EU users)

---

## ✅ Done as of 2026-04-25

- [x] Devnet payer wallet funded (`2HYjytRc4oKY2ndmJfAq2XdGhPqYB7VdDPLzA18QEiAH`, ~5.49 SOL)
- [x] Helius API key wired into `apps/web/.env.local` + `apps/indexer/.env.local`
- [x] Demo USDC mint created on Devnet: `Er8wmBzC1X3m7BwDF5fUcwnJPe5UEWzeFUJXXjzvNiGy`
- [x] 6 demo wallets generated + each holds 50,000 USDC + 0.5 SOL
- [x] `NEXT_PUBLIC_USDC_MINT` set in `apps/web/.env.local`
- [x] Web app smoke-tested at `http://localhost:3000` — responds 200, mint visible on `/lend/vaults`

---

## ✅ Done as of 2026-04-25 (continued)

- [x] Supabase `SUPABASE_SERVICE_ROLE_KEY` wired into both `.env.local` files
- [x] Indexer (`pnpm --filter @vaulx/indexer dev`) verified live on Helius — subscribed to vault + loan + auction
- [x] README upgraded for submission (commit `f0ca8d4`)
- [x] Repo pushed to [github.com/gogysss/vaulx](https://github.com/gogysss/vaulx) (75 commits + 3 phase tags)
- [x] Pre-captured `anchor test` 45-passing log committed at `apps/web/public/demo/test-run.log` — `/admin/tests` "Replay last run" button streams it on Vercel
- [x] **Vercel production deploy LIVE → [vaulx.vercel.app](https://vaulx.vercel.app)** (commit `39e4c58`)
  - All 9 env vars set in Vercel (production + preview)
  - Project rootDir = `apps/web` with cd-up install/build for the pnpm monorepo
  - Auto-deploys on every `git push origin main` going forward

---

## Currently blocking a live demo

### 1. Devnet program deployment
The 4 Anchor programs only exist on localnet; no live cluster deployment yet.

- **Cost (verified via `solana rent`):**
  - Upgradeable: **19.09 SOL** (4 programs × buffer-doubled rent)
  - **Final** (`--final`, non-upgradeable, recommended for hackathon): **9.55 SOL**
  - Per-program (final): trdc 1.75 / vault 2.61 / loan 3.00 / auction 2.19
- **Current payer balance:** 35 SOL ✅ (sufficient for `--final` deploy with 25 SOL buffer)

- [x] Top up `2HYjytRc4oKY2ndmJfAq2XdGhPqYB7VdDPLzA18QEiAH` to ≥ 10 SOL (you have 35)
- [ ] **Trigger:** code-review/audit pass on the 4 Anchor programs first, then ping me to run `solana program deploy --final` for trdc → vault → loan → auction, then `pnpm init:civic --custodian <demo-wallet-2-pubkey>`. <30 min execution time.

### 2. Civic gate enable (after #1)
- [ ] Once programs are deployed and configs initialized, set `NEXT_PUBLIC_CIVIC_PASS_NETWORK=ignREusXmGrscGNUesoU9mxfds9AiYTezUKex2PsZV6` in `apps/web/.env.local` to turn on the CAPTCHA Civic Pass gate in the UI.

---

## Optional / nice-to-have

### Fallback demo videos
- [ ] Record `apps/web/public/demo/test-run.mp4` (the SSE runner page falls back to it when `anchor test` can't run live).
  - QuickTime: New Screen Recording → terminal running `PATH=… COPYFILE_DISABLE=1 anchor test`. Trim to ~3 min. Export H.264.
- [ ] Record `apps/web/public/demo/vaulx-demo.mp4` (the 3-min hackathon submission video — full borrower + lender + auction walkthrough using the `/demo` mock app).

### Demo media — IoT feed loop
- [ ] Provide a 4-second royalty-free vault-interior video at `apps/web/public/demo/iot-feed.mp4` (≤ 2MB H.264). Demo currently uses an SVG placeholder at `apps/web/public/demo/iot-feed-placeholder.svg`.

### Vercel production deploy — DONE ✅
- [x] Connected GitHub repo `gogysss/vaulx` to Vercel project
- [x] All env vars set in production + preview
- [x] Live at [vaulx.vercel.app](https://vaulx.vercel.app) and [vaulx.vercel.app/demo](https://vaulx.vercel.app/demo) — auto-deploys on every `git push origin main`
- [x] Caveat documented: `/admin/tests` (live `anchor test` SSE) and `/admin/demo` (cockpit) are local-only by design (read local Solana CLI / demo wallets)

---

## Post-hackathon (after May 10)

### Bump Next.js 14 → 15 (or 16)

- [ ] Decide whether to bump after submission. **Currently on Next 14.2.15** — locked in during Phase 0 (Apr 23) for ecosystem-stability reasons; all Civic + Crossmint + wallet-adapter SDKs peer-resolve cleanly against it. No demo-relevant feature in 15/16 is needed.
- [ ] Migration cost when ready: ~1-2 hours
  - Update every dynamic-segment page in `/demo/borrow/loan-offer/[reqId]`, `/demo/borrow/awaiting-custody/[trdc]`, `/demo/borrow/appraisal/[reqId]`, `/demo/lend/vaults/[id]`, `/demo/auction/[trdc]` to use `params: Promise<Params>` + `React.use(params)` (Next 15 API; the inverse of the fix we shipped at commit `3c7e55e`).
  - Re-run peer-dep resolution for Civic + Crossmint + wallet-adapter; expect minor `pnpm.overrides` adjustments.
  - Rebuild + retest all 22 demo routes against Vercel.
- [ ] Trigger: pick once submission lands, when the team has time for non-demo-critical maintenance.

---

**Status file:** [STATUS.md](STATUS.md) · **Changelog:** [CHANGELOG.md](CHANGELOG.md)
