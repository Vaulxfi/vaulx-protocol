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

### 5. Civic Pass SDK verification — RESOLVED in Task 3.0

All 6 `TODO(civic-sdk-verify)` markers were closed out in Task 3.0:

- Correct gateway program id (`gatem74V238djXdzWnJf94Wo1DcnuGkfijbf3AuBhfs`) verified against the installed `@identity.com/solana-gateway-ts` SDK + mainnet-beta account lookup. The earlier `...1GJU9` pad-to-32 was wrong; a typo in the prompt.
- Borsh layout in `programs/{vault,loan}/src/civic.rs` reworked to include the previously-skipped `owner_identity: Option<Pubkey>` field and verified against `dist/lib/GatewayTokenData.js` schema.
- FE imports (`useGateway`, `GatewayStatus.ACTIVE`, `GatewayProvider`, `findGatewayToken`) all verified against installed types.
- Runtime happy-path test at `tests/civic-happy-path.spec.ts` mints a real gateway token, asserts the byte layout, revokes it, asserts the state byte flip (0 → 2). `anchor test` stays green at 35/35.
- Devnet init helper: `pnpm init:civic --custodian <pubkey>` — see `scripts/dev/init-civic-configs.ts`. Idempotent; exits 2 (SKIPPED) when prerequisites are missing.

**Remaining user action to enable the gate live:**
- [ ] Once you're ready to turn the gate ON in the UI, set `NEXT_PUBLIC_CIVIC_PASS_NETWORK=ignREusXmGrscGNUesoU9mxfds9AiYTezUKex2PsZV6` in `apps/web/.env.local` and run `pnpm init:civic --custodian <your-custodian-pubkey>` on Devnet.

### 6. Helius Devnet API key
- Not needed for Phase 1 or Phase 2. Public `api.devnet.solana.com` is fine until rate-limited.
- If/when needed: [helius.dev](https://www.helius.dev) → Devnet project → paste key into `apps/indexer/.env.local` as `HELIUS_API_KEY=...` and flip the RPC URL.

### 7. Phase 2 design decisions (if any come up)
- Flagged in `STATUS.md` → "Blockers / open decisions" as they arise. I'll ping you in-session if I hit a real ambiguity.

---

**Status file lives at:** [STATUS.md](STATUS.md)
**Changelog:** [CHANGELOG.md](CHANGELOG.md)
