# Vaulx — User TODOs

> Actions that require **you** (not Claude). Check off as you complete.

---

## Blocking live Devnet verification (Task 1.14 + Phase 2 onward)

### 1. Fund the Devnet payer wallet
- [ ] Open [faucet.solana.com](https://faucet.solana.com)
- [ ] Paste address: `2HYjytRc4oKY2ndmJfAq2XdGhPqYB7VdDPLzA18QEiAH`
- [ ] Request **≥ 5 SOL** on **Devnet**
- [ ] Verify with: `solana balance 2HYjytRc4oKY2ndmJfAq2XdGhPqYB7VdDPLzA18QEiAH --url devnet`

### 2. Seed the demo USDC mint + wallets
After (1) is done:
- [ ] `cd /Users/gogy/MyCODE/VAULX && pnpm seed:usdc`
- [ ] Confirm `scripts/dev/devnet-usdc.json` + `scripts/dev/demo-wallets.json` exist (gitignored)
- [ ] Each of the 6 demo wallets should now hold 2 SOL + 50,000 USDC

### 3. Add the Supabase service role key
- [ ] Open [Supabase dashboard → API settings](https://supabase.com/dashboard/project/ctiypfxtymnszposgaky/settings/api)
- [ ] Copy the `service_role` key (secret — never commit)
- [ ] Paste into **both** files as `SUPABASE_SERVICE_ROLE_KEY=...`:
  - `apps/web/.env.local`
  - `apps/indexer/.env.local`
- [ ] Also ensure `SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_URL`) is set in `apps/indexer/.env.local`:
  `SUPABASE_URL=https://ctiypfxtymnszposgaky.supabase.co`

### 4. Run the Moment 1 E2E test (proves Phase 1 wired end-to-end)
After (1)–(3):
- [ ] Terminal A: `pnpm --filter @vaulx/indexer dev` (leave running — subscribes to Devnet logs)
- [ ] Terminal B: `pnpm e2e:moment-1`
- [ ] Expect: `OK: deposited event observed; sig=... amount=100000000 shares_minted=100000000`

---

## Optional / can wait

### 5. Helius Devnet API key
- Not needed for Phase 1 or Phase 2. Public `api.devnet.solana.com` is fine until rate-limited.
- If/when needed: [helius.dev](https://www.helius.dev) → Devnet project → paste key into `apps/indexer/.env.local` as `HELIUS_API_KEY=...` and flip the RPC URL.

### 6. Phase 2 design decisions (if any come up)
- Flagged in `STATUS.md` → "Blockers / open decisions" as they arise. I'll ping you in-session if I hit a real ambiguity.

---

**Status file lives at:** [STATUS.md](STATUS.md)
**Changelog:** [CHANGELOG.md](CHANGELOG.md)
