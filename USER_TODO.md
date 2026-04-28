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

### Crossmint API key — set in Vercel to flip mock → live wallet

The `<CrossmintWallet>` component on `/demo/borrow/wallet` is fully wired against `@crossmint/client-sdk-react-ui@4.1.5` (real OAuth, real Solana smart-wallet provisioning with email recovery, passkey-ready). It just falls back to a clearly-labeled MOCK demo path when the API key is unset.

To flip to real Crossmint:

1. Sign up at [console.crossmint.com](https://console.crossmint.com) (free dev tier; no card required for testnet).
2. Create a Solana **Devnet** project; copy the **client-side** API key (starts with `ck_development_...` for staging, `ck_production_...` for prod).
3. In Vercel project settings → **Environment Variables** → add `NEXT_PUBLIC_CROSSMINT_API_KEY=<your-key>` for **Production + Preview**.
4. Redeploy (next push triggers automatically).

After this, `/demo/borrow/wallet` shows the real Crossmint sign-in (Google / Apple / email) and provisions a real Solana smart wallet bound to the user's email. The `wallet.pubkey` saved in the demo session becomes a real on-chain pubkey usable by downstream Anchor ixs.

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

### Civic Auth — gate state & cutover plan[^civic]

**For demo (now):** `vault_config.kyc_required = false` and `loan_config.kyc_required = false` (defaults). `NEXT_PUBLIC_CIVIC_AUTH_CLIENT_ID` is unset on the production demo. The borrower flow uses a mock token; `<CivicAuthGate>` self-disables when the env var is unset. No on-chain attestation issuance fires. Zero friction for judges.

**For mainnet (post-hackathon):**
- [ ] Sign up for a production Civic Auth client ID at [auth.civic.com](https://auth.civic.com) and paste into `apps/web/.env.local` as `NEXT_PUBLIC_CIVIC_AUTH_CLIENT_ID=...`
- [ ] Wire the FE attestation-issuance flow: post-OIDC callback → operator signs `issue_kyc_attestation` admin ix → `KycAttestation` PDA written for the user
- [ ] Flip `vault_config.kyc_required = true` (and `loan_config.kyc_required = true`) via admin ix to enforce the gate at the protocol layer. **No program redeploy** — config is read from on-chain.

### Crossmint solutions team — pre-prod call (Felipe / Marcelo)

- [ ] Confirm smart-wallet program audit + upgrade-authority governance (Squads V4 timelock minimum)
- [ ] Confirm Civic Auth + gov.br ouro acceptance as Full KYC liveness gate (no duplicate check)[^civic]
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
- [ ] **Trigger:** Track A completes, then ping me to run `solana program deploy` (upgradeable, real Vaulx name) for trdc → vault → loan → auction, then `pnpm init:civic --custodian <demo-wallet-2-pubkey>` (script name retained for legacy reasons; `kyc_required` defaults to `false`). <30 min execution time. Authority transfers to Squads V4 multisig (Item 2.3) immediately after.

### 2. Civic Auth gate enable — DEFERRED to mainnet[^civic]
- Demo intentionally runs gate-off. See "Civic Auth — gate state & cutover plan" above. No action required for the hackathon demo.

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

Tracked from the Civic Pass → Civic Auth migration reviews (commits `39131e1`, `596f1e0`, `b170c73`, `f3ef3dd`, `ec04a22`).

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

- [ ] Decide whether to bump after submission. **Currently on Next 14.2.15** — locked in during Phase 0 (Apr 23) for ecosystem-stability reasons; all Civic + Crossmint + wallet-adapter SDKs peer-resolve cleanly against it. No demo-relevant feature in 15/16 is needed.
- [ ] Migration cost when ready: ~1-2 hours
  - Update every dynamic-segment page in `/demo/borrow/loan-offer/[reqId]`, `/demo/borrow/awaiting-custody/[trdc]`, `/demo/borrow/appraisal/[reqId]`, `/demo/lend/vaults/[id]`, `/demo/auction/[trdc]` to use `params: Promise<Params>` + `React.use(params)` (Next 15 API; the inverse of the fix we shipped at commit `3c7e55e`).
  - Re-run peer-dep resolution for Civic + Crossmint + wallet-adapter; expect minor `pnpm.overrides` adjustments.
  - Rebuild + retest all 22 demo routes against Vercel.
- [ ] Trigger: pick once submission lands, when the team has time for non-demo-critical maintenance.

---

**Status file:** [STATUS.md](STATUS.md) · **Changelog:** [CHANGELOG.md](CHANGELOG.md)

[^civic]: Civic Pass was sunset mid-2025; current product is Civic Auth (OAuth/OIDC). Vaulx now uses operator-issued `KycAttestation` PDAs gated by Civic Auth OIDC sign-in.
