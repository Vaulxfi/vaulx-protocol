# Vaulx — User TODOs

> Actions that require **you** (not Claude). Check off as you complete.

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
- **Current payer balance:** 2.49 SOL → **need ≥ 8 SOL more**
- **Faucets available:**
  - [faucet.solana.com](https://faucet.solana.com) — 2 SOL per request, throttled
  - [solfaucet.com](https://solfaucet.com) — 1 SOL per IP per day
  - QuickNode Devnet faucet — 1 SOL daily
  - Reasonable plan: claim 2 SOL/day from `faucet.solana.com` for ~4 days, OR ~1 day if you can hit 2-3 different faucets in parallel

- [ ] Top up `2HYjytRc4oKY2ndmJfAq2XdGhPqYB7VdDPLzA18QEiAH` to **≥ 10 SOL** (gives a buffer for the deploy + future tx fees)
- [ ] Ping me when done. I'll deploy in priority order: trdc → vault → loan → auction with `solana program deploy --final`, then run `pnpm init:civic --custodian <demo-wallet-2-pubkey>`.

### 2. Civic gate enable (after #1)
- [ ] Once programs are deployed and configs initialized, set `NEXT_PUBLIC_CIVIC_PASS_NETWORK=ignREusXmGrscGNUesoU9mxfds9AiYTezUKex2PsZV6` in `apps/web/.env.local` to turn on the CAPTCHA Civic Pass gate in the UI.

---

## Optional / nice-to-have

### 4. Fallback demo video
- [ ] Record `apps/web/public/demo/test-run.mp4` (the SSE runner page falls back to it when `anchor test` can't run live).
  - QuickTime: New Screen Recording → terminal running `PATH=… COPYFILE_DISABLE=1 anchor test`. Trim to ~3 min. Export H.264.
- [ ] Record `apps/web/public/demo/vaulx-demo.mp4` (the 3-min hackathon submission video — full 9-moment walkthrough).

### 5. Vercel production deploy (Phase 4)
- [ ] Connect the GitHub repo to a Vercel project
- [ ] Set the env vars in the Vercel dashboard (mirror `apps/web/.env.local`)
- [ ] Deploy `main`. The site at `vaulx.vercel.app` (or your custom domain) becomes the submission URL.
- [ ] **Caveat:** `/admin/tests` (live `anchor test` SSE) and `/admin/demo` (cockpit) won't work on Vercel — they read local Solana CLI / demo wallets. They're local-only by design. Document this in the submission notes.

---

**Status file:** [STATUS.md](STATUS.md) · **Changelog:** [CHANGELOG.md](CHANGELOG.md)
