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

## Currently blocking a live demo

### 1. Supabase `SUPABASE_SERVICE_ROLE_KEY`
Supabase intentionally does not expose service-role keys via API or MCP — only via the dashboard.

- [ ] Open [Supabase API settings](https://supabase.com/dashboard/project/ctiypfxtymnszposgaky/settings/api)
- [ ] Copy the `service_role` key (under "Project API keys")
- [ ] Paste into `apps/web/.env.local` (line 21) AND `apps/indexer/.env.local` (line 13) as `SUPABASE_SERVICE_ROLE_KEY=...`
- [ ] Verify by running `pnpm --filter @vaulx/web dev` and hitting `http://localhost:3000/api/onchain-events/ticker` → should switch from `source: "seeded"` to `source: "live"`

### 2. Devnet program deployment
The 4 Anchor programs only exist on localnet; no live cluster deployment yet.

- **Estimated cost:** ~19 SOL (1.37 MB total `.so` × 2 for upgradeable × ~6.96 lamports/byte)
- **Current payer balance:** 2.49 SOL → **need ~17 more SOL on the Devnet payer**
- [ ] Top up `2HYjytRc4oKY2ndmJfAq2XdGhPqYB7VdDPLzA18QEiAH` to ≥ 20 SOL via [faucet.solana.com](https://faucet.solana.com)
  - The faucet caps at 5 SOL per request; you may need to request 4× over a few hours, OR find a generous Devnet faucet (e.g. solfaucet.com, public RPC has 2 SOL cap, Helius doesn't airdrop on free tier)
- [ ] After topping up, ping me and I'll run:
  ```bash
  PATH=/Users/gogy/.local/share/solana/install/active_release/bin:$PATH \
    anchor deploy --provider.cluster devnet
  ```
  followed by `pnpm init:civic --custodian <demo-wallet-2-pubkey>` to wire the on-chain configs.

### 3. Civic gate enable (after #2)
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
