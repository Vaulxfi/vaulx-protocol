# Vaulx — User TODOs

> Actions that require **you** (not Claude). Check off as you complete.

---

## Squads V4 multisig keypairs — BACK UP BEFORE PRODUCTION

Two fresh signer keypairs were generated for the Vaulx Squads V4 2/3 multisig (upgrade authority + treasury). Together with the existing payer (`2HYjytRc4oKY2ndmJfAq2XdGhPqYB7VdDPLzA18QEiAH`), they form the 3 signers; threshold is 2.

**Pubkeys (safe to share):**
- ops:  `7QpTNAveTSfQSEzjPCmfzgE9ZGrgkcUBmDZ97dcSixdE`
- team: `9MBdm6fbFTMCzvesKDDBYD58JdTsqWNGiefjdaS83LzS`

**Local file paths (private — DO NOT commit, gitignored as a safety net):**
- `~/.config/vaulx/ops-keypair.json`
- `~/.config/vaulx/team-keypair.json`

**Backup instructions (do this BEFORE mainnet — Devnet is fine without):**
1. Copy both JSON files into a password manager (1Password / Bitwarden) or an encrypted backup (e.g. age-encrypted blob in cloud storage).
2. Optionally re-derive each keypair from a seed phrase you record on paper — `solana-keygen recover` can rebuild the JSON from the seed if you ever delete the local copy.
3. Keep at least one offline copy (paper / hardware) of each.

These keypairs sign program upgrades and treasury actions via the Squads multisig. **Losing 2 of 3 = total program lockout** (no upgrade path, frozen treasury). Devnet loss is recoverable (redeploy); mainnet loss is not.

- [ ] Backed up ops + team keypairs (required before mainnet — Devnet is fine without)

---

## Active items as of 2026-04-28

### Operator keypair on Vercel — set `OPERATOR_KEYPAIR_JSON` to flip server-side demo routes from local-only to Vercel-ready

The full E2E demo needs a few server-side routes to sign txs on behalf of the borrower (mint demo USDC for repayments, create + confirm-custody a TRDC, publish a PriceFeed). All of those use the **operator keypair** — the Devnet `2HYjytRc4oKY2ndmJfAq2XdGhPqYB7VdDPLzA18QEiAH` you've been using as the deploy payer + USDC mint authority + `loan_config.admin` / `oracle_admin`.

Locally those routes read `~/.config/solana/id.json`. On Vercel that file doesn't exist, so the routes 503. The fix: paste the keypair file contents into a single Vercel env var.

To enable on Vercel:

1. Open the local keypair: `cat ~/.config/solana/id.json` — output is a JSON array of 64 numbers, e.g. `[12,34,56,...,255]`.
2. Vercel project settings → **Environment Variables** → add for **Production + Preview**:
   - Name: `OPERATOR_KEYPAIR_JSON`
   - Value: paste the *exact* JSON-array string from step 1 (no quotes, no whitespace)
   - Sensitive: yes (Vercel encrypts at rest)
3. Redeploy.

After this, `/api/demo/provision-loan`, `/api/demo/faucet-usdc`, `/api/demo/publish-price`, and the entire `/api/admin/demo/*` cockpit work on Vercel.

**Why this is acceptable risk for Devnet:**
- Program **upgrade authority** for all 4 programs is the Squads V4 vault PDA (commit `5e90d81`). The operator key cannot redeploy programs even if leaked.
- The operator key only carries: USDC mint authority (Devnet demo mint, no value), `loan_config.admin` (config writes), `oracle_admin` (price publishing), and on Vercel deploys also `loan_config.custodian` so the provision-loan route can confirm-custody on behalf of the demo flow.
- Mainnet rotates this to a hardened deploy with separate admin / custodian / oracle / mint keys per role; this concentration is intentional only for the hackathon Devnet demo.

**Caveat — `loan_config.custodian` must equal the operator pubkey on Vercel.** Locally the bootstrap (`pnpm init:civic`) sets `custodian = demo-wallets[2]`; on Vercel that wallet doesn't exist, so re-run the init with `--custodian <operator-pubkey>` against the live cluster (or use the upcoming `set_loan_custodian` admin ix when shipped).

- [ ] `OPERATOR_KEYPAIR_JSON` set in Vercel (P1 for live demo; existing Vercel deploy works without it for the read-only flows).
- [ ] `loan_config.custodian` set to operator pubkey on the cluster Vercel points at (otherwise `/api/demo/provision-loan` errors at the confirm-custody step).

### Crossmint API key — set in Vercel to flip mock → live wallet

The `<CrossmintWallet>` component on `/demo/borrow/wallet` is fully wired against `@crossmint/client-sdk-react-ui@4.1.5` (real OAuth, real Solana smart-wallet provisioning with email recovery, passkey-ready). It falls back to a clearly-labeled MOCK demo path when the API key OR `NEXT_PUBLIC_CROSSMINT_ENV` is unset / set to `"mock"`.

**Use staging — it's free, no KYC, and supports Solana Devnet out of the box.** Production (mainnet) requires a Crossmint solutions-team call + KYC and is gated behind `ck_production_*` keys.

To flip to real Crossmint (staging):

1. Sign up at **[staging.crossmint.com](https://staging.crossmint.com)** (NOT crossmint.com — staging is the free dev tier, instant, no KYC).
2. Create a Solana **Devnet** project; copy the **client-side** API key (starts with `ck_staging_...`).
3. In Vercel project settings → **Environment Variables** → add for **Production + Preview**:
   - `NEXT_PUBLIC_CROSSMINT_API_KEY=ck_staging_...`
   - `NEXT_PUBLIC_CROSSMINT_ENV=staging`
4. Redeploy (next push triggers automatically).

After this, `/demo/borrow/wallet` shows real Crossmint sign-in (Google / Apple / email) and provisions a real Solana **Devnet** smart wallet bound to the user's email. The `wallet.pubkey` saved in the demo session becomes a real on-chain pubkey. Test USDXM is mintable via `wallet.stagingFund(amount)` — see Crossmint docs.

The Crossmint SDK has **no explicit `environment` prop** — routing is by API-key prefix (`ck_staging_*` → `staging.crossmint.com`, `ck_production_*` → `www.crossmint.com`). Our wrapper still validates the prefix matches `NEXT_PUBLIC_CROSSMINT_ENV` and falls back to mock with an inline warning on mismatch.

- [ ] Crossmint API key set in Vercel (P1 for live demo; demo flow works in mock mode without it).

### Devnet contracts deploy — AUTHORIZED (upgradeable, real Vaulx name)

- [x] Payer wallet has 35 SOL on devnet (sufficient for upgradeable deploy ≈ 19.09 SOL with ~16 SOL buffer).
- [x] Subagent-driven-development reviews completed across Item 1; no audit-pass gate remaining.
- [ ] **Status: AUTHORIZED — proceed after Track A completes.** Mode: upgradeable (not `--final`). Cost ~19.09 SOL. Authority transfers to Squads V4 multisig (Item 2.3) immediately after deploy.
- [ ] Trigger: ping me when Track A wraps; takes <30 min once authorized.

### Apify (Chrono24 production scraping) — DEFER until needed

- [ ] **Decision needed before production launch:** demo currently uses fallback-safe scraper at `apps/web/src/lib/appraisal/chrono24.ts` + deterministic random walk for the dashboard tick. For production, Apify's maintained Chrono24 actor is more reliable.
- [ ] If/when ready: get an Apify API token + paste into `.env` as `APIFY_API_TOKEN=...`. Swap takes ~1 day.
- [ ] Currently P2 — not blocking demo or first-customer flows.

### Sumsub sandbox setup

The Sumsub sandbox credentials are already in the root `.env` (you saved `SUMSUB_TOKEN`, `SUMSUB_SECRET`, `SUMSUB_WEBHOOK_SECRET`). The remaining setup is a one-time dashboard task:

- [ ] In the Sumsub dashboard, create a verification level named exactly `basic-kyc-level` — this is the level the FE references when calling `/api/sumsub/init-token`. Brazil Non-Doc CPF flow + global doc-scan fallback are the recommended steps for that level.
- [ ] Pre-configure a sandbox applicant (`demo@vaulx.app`) marked GREEN with a returned Brazilian CPF. The judge demo path uses ID Connect to hit this applicant in ~5s.
- [ ] (Optional) Submit the sandbox for production approval after the hackathon — this is a 1-week ask, not blocking for May 10.

### Sumsub — gate state & cutover plan

**For demo (now):** `vault_config.kyc_required = false` and `loan_config.kyc_required = false` (defaults). The on-chain attestation constraint is short-circuited; the FE `<KycRequiredModal>` is the friendly UX gate. Money-touching CTAs (Submit Asset / Disburse / Deposit USDC) lazy-trigger Sumsub via `useKycGate()`. After Sumsub webhook GREEN the operator mints the on-chain `KycAttestation` PDA, so the second click sails through. Zero friction for judges who skip KYC; full real attestation flow for judges who exercise it.

**For mainnet (post-hackathon):**
- [ ] Flip `vault_config.kyc_required = true` (and `loan_config.kyc_required = true`) via the existing `set_kyc_required` admin ix to enforce the gate at the protocol layer. **No program redeploy** — config is read from on-chain. The FE gate stays as the friendly UX layer on top.
- [ ] Confirm operator keypair (`OPERATOR_KEYPAIR_JSON` on Vercel) is the signer used by `/api/sumsub/webhook` to mint attestations.

### Crossmint solutions team — pre-prod call

- [ ] Confirm smart-wallet program audit + upgrade-authority governance (Squads V4 timelock minimum)
- [ ] Confirm Sumsub acceptance as Full KYC liveness gate (no duplicate check)
- [ ] Confirm BR-resident Create User field schema (CPF? RG? CNH? employment? source of funds?)
- [ ] Confirm per-region custom-token JWT bridge (Sumsub for BR/global; eIDAS for EU)
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
- [ ] **Trigger:** Track A completes, then ping me to run `solana program deploy` (upgradeable, real Vaulx name) for trdc → vault → loan → auction, then `pnpm init:civic --custodian <demo-wallet-2-pubkey>` (script name retained for legacy reasons; `kyc_required` defaults to `false`). <30 min execution time. Authority transfers to Squads V4 multisig (Item 2.3) immediately after.

### 2. KYC gate enable — DEFERRED to mainnet
- Demo intentionally runs gate-off on-chain. The FE `<KycRequiredModal>` lazy-triggers Sumsub at money-touching CTAs and is fully wired against the sandbox. See "Sumsub — gate state & cutover plan" above. No action required for the hackathon demo.

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

## Item 1 follow-ups (post-hackathon)

Tracked from the original Civic Pass → Civic Auth migration reviews (commits `39131e1`, `596f1e0`, `b170c73`, `f3ef3dd`, `ec04a22`). **Civic was dropped 2026-04-28 in favor of Sumsub** — the on-chain artifacts below are vendor-neutral and survive the swap; see [`docs/plans/2026-04-28-vaulx-civic-drop-sumsub-add-design.md`](docs/plans/2026-04-28-vaulx-civic-drop-sumsub-add-design.md).

- [ ] **Add `set_kyc_required(bool)` admin ix** to vault + loan programs. Enables runtime revert test for `NoKycAttestation` (currently the test is IDL-presence-only because `vault_config` is a singleton init-once PDA). ~30 min on-chain edit; test rewrite ~2h.
- [ ] **Add `close_kyc_attestation` admin ix** for revocation/re-issuance. Currently `KycAttestation` PDA is `init`-only — no path to close stale/expired attestations. Required before mainnet. ~30 min.
- [ ] **Document load-bearing program-owner check** at `programs/{vault,loan}/src/lib.rs:106-110` — the `require_keys_eq!(*att_info.owner, crate::ID, NoKycAttestation)` is the *only* thing preventing cross-program discriminator collision (vault and loan both have `account:KycAttestation` with the same Anchor-derived 8-byte discriminator). Add a `// LOAD-BEARING: do not remove or relax — see docs/...` comment in the code. ~5 min.

---

## Item 5 (RedStone oracle) — operator actions

Status: **RedStone pattern, Vaulx-signed (proper RedStone SDK pending Solana support).** As of writing there is no first-party `@redstone-finance/sdk-solana` package on npm; we ship the *pattern* (push model, signed-payload, Anchor-verified) with a single Vaulx-controlled signer. When RedStone ships a Solana SDK, the publisher's signer-set check replaces the `published_by == oracle_admin` check; the rest of the on-chain shape is forward-compatible.

- [ ] **Generate a dedicated oracle-admin keypair** (separate from program upgrade authority and from the deploy payer) and store its JSON file at `~/.config/vaulx/oracle-admin-keypair.json` with `chmod 600`. Path goes into `apps/indexer/.env.local` as `REDSTONE_SIGNER_KEYPAIR_PATH`. Never commit this file. SR-4.
- [ ] **Bind the oracle on-chain** by calling `loan::set_oracle_admin(oracle_admin_pubkey)` once the keypair is provisioned (admin-signed; admin = `loan_config.admin`). Until this is called the program runs in legacy-appraisal mode (every existing test's path).
- [ ] **Set `REDSTONE_WATCHED_REFS`** in `apps/indexer/.env.local` to the watch refs you want refreshed every 60s (pipe-delimited 5-tuples, comma-separated — see `.env.example`). The publisher POSTs to `/api/appraisal` and writes `PriceFeed` PDAs accordingly.
- [ ] **Back up the oracle-admin keypair** the same way as the Squads keypairs (1Password / age-encrypted / paper). Loss of this key disables the oracle until admin calls `set_oracle_admin` again with a fresh keypair.
- [ ] **(Future)** When RedStone ships a Solana SDK, replace the publisher's `publish_price` ix builder with the RedStone signer-network payload, and replace the on-chain `published_by == oracle_admin` check with an M-of-N RedStone signer-set verification.

---

## Item 6 (GraphQL endpoint) — deploy + future Substreams

Status: **GraphQL-on-Supabase pattern shipped.** The indexer now serves a read-only GraphQL endpoint at `/graphql` (default port 4000) covering the loan lifecycle entities (`Loan`, `Custody`, `Disbursement`, `Repayment`, `Renewal`, `Liquidation`). Resolvers query the same `onchain_events` table the WebSocket subscriber writes to. The **proper** Graph-protocol path on Solana is a Substreams-powered subgraph (Rust+WASM module reading from a Pinax/Streamingfast provider) — deferred until full Graph-Solana GA, since it adds ~1 day of plumbing for zero hackathon-demo benefit.

- [ ] **Deploy the indexer + GraphQL server** to a hosted provider so the live demo can hit a real endpoint. Options:
  - **Railway / Fly.io** — long-running Node service, $5–10/mo, stateless (Supabase is the only stateful dep). Deploy `apps/indexer` with `pnpm start`; expose port 4000.
  - **Vercel Edge Functions** — split: keep the WS subscriber on Railway/Fly (Vercel has no long-running compute), put the GraphQL `createYoga` handler in `/api/graphql.ts` on the existing Vercel project. Cleanest UX (single domain) but requires factoring the schema out of the indexer worker.
- [ ] Once deployed, link `https://<host>/graphql` from the README "Quick links" section and from the [`/admin/demo`](https://vaulx.vercel.app/admin/demo) cockpit.
- [ ] **(Future)** Migrate to a **Substreams-powered subgraph** when The Graph's Solana support exits beta. Provider account at [pinax.network](https://pinax.network) or [streamingfast.io](https://streamingfast.io); Rust module that filters Vaulx program logs and emits the same six entities into a Graph subgraph; deploy via `graph-cli` to Graph Studio. Replaces the Supabase event log as the source of truth.

---

## Post-hackathon (after May 10)

### Bump Next.js 14 → 15 (or 16)

- [ ] Decide whether to bump after submission. **Currently on Next 14.2.15** — locked in during Phase 0 (Apr 23) for ecosystem-stability reasons; all Sumsub + Crossmint + wallet-adapter SDKs peer-resolve cleanly against it. No demo-relevant feature in 15/16 is needed.
- [ ] Migration cost when ready: ~1-2 hours
  - Update every dynamic-segment page in `/demo/borrow/loan-offer/[reqId]`, `/demo/borrow/awaiting-custody/[trdc]`, `/demo/borrow/appraisal/[reqId]`, `/demo/lend/vaults/[id]`, `/demo/auction/[trdc]` to use `params: Promise<Params>` + `React.use(params)` (Next 15 API; the inverse of the fix we shipped at commit `3c7e55e`).
  - Re-run peer-dep resolution for Sumsub + Crossmint + wallet-adapter; expect minor `pnpm.overrides` adjustments.
  - Rebuild + retest all 22 demo routes against Vercel.
- [ ] Trigger: pick once submission lands, when the team has time for non-demo-critical maintenance.

---

**Status file:** [STATUS.md](STATUS.md) · **Changelog:** [CHANGELOG.md](CHANGELOG.md)
