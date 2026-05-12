# Vaulx — Roadmap

**Where we are (May 2026):** 4 Anchor programs deployed to Solana Devnet under a Squads V4 2-of-3 multisig. Atomic `confirm_custody + disburse` working live. 223 tests across the stack. Live demo at [vaulx.fi](https://vaulx.fi).

**Where we're going (Q3 2026):** audited mainnet protocol, first 50 BR loans originated, anchor LP capital flowing via Kamino V2 curated vaults and direct counterparties.

Status legend: ✅ done · 🚧 in progress · ⏳ next · 🔒 partner-gated

---

## Phase 1 — Repo + process discipline
**Window:** May 2026

- ✅ Public repo consolidated to a single monorepo (`Vaulxfi/vaulx-protocol`)
- ✅ Internal docs moved to private archive (`Vaulxfi/vaulx-internal`)
- ✅ Honest README with verified Devnet transactions + multisig PDA
- ✅ Branch protection on `main` (PR + 1 approval required)
- ⏳ Fix CI (rustc 1.85 → 1.88 to clear the upstream `icu_*` / `time` dep break)
- ⏳ `CODEOWNERS` file — auto-assign reviewers (programs → Edson, site → Marcelo, etc.)
- ⏳ Tag `v0.1.0-frontier` for the Colosseum submission snapshot (rollback anchor)
- ⏳ `staging` branch + Edson's second EC2 vhost → `staging.vaulx.fi`

---

## Phase 2 — Close the existing flow end-to-end
**Window:** late May → mid June 2026

Components that are smoke-tested or placeholder, but not yet wired into the live demo path:

- ⏳ Wire `mint_trdc_cnft` into the live borrower flow (currently smoke-only)
- ⏳ Wire `auction` instructions for default scenarios (currently smoke-only)
- ⏳ Bridge: implement `pay` / `repay` / `renew` (currently placeholders — wallet-signed flow)
- ⏳ Tighten `confirm_custody_transition` → loan-program-only CPI gate (`programs/trdc/src/lib.rs:77`)
- ⏳ Activate KYC gate in staging (`vault_config.kyc_required = true`); verify Sumsub attestation end-to-end
- ⏳ Wire Pyth + RedStone feeds for LTV (currently `oracle_admin = system_program`)
- ⏳ Indexer hardening: rate limits, retries, backfill

---

## Phase 3 — Self-service integrations
**Window:** June → July 2026 (parallel to Phase 2 finish)

External services we can wire without commercial agreements:

| Service | What | Blocker |
|---|---|---|
| 🚧 Crossmint | Production tier smart-wallet + BR Non-Doc CPF mapping | Request prod tier; KYC field-mapping per their docs |
| 🚧 Sumsub | Production-tier KYC + native SAS attestation issuance | Sandbox → prod application form (~1 week SLA) |
| ⏳ Pyth | Live USD price feeds per collateral class | Self-serve registration; pick price-feed IDs |
| ⏳ RedStone | Asset-class index feeds for LTV | Self-serve API |
| ⏳ Chrono24 | Reference-price API ingestion for watches | Self-serve API key |
| ⏳ Kamino V2 | Vaulx-curated V2 market with a wrapped position-SPL as collateral | Permissionless deploy (Vik confirmed); reserve whitelist via Kamino multisig handshake |
| ⏳ Loopscale | Listing on Loopscale USDC pool | Permissionless |
| ⏳ Grafeno.digital | API integration for CCB issuance | Confirm self-serve API tier; otherwise commercial conversation |

---

## Phase 4 — Audit + mainnet readiness
**Window:** July → August 2026

- ⏳ External smart-contract audit on all 4 Anchor programs (this is the "Day 0" in the pitch)
- ⏳ Penetration test on bridge (`apps/bridge/`) and indexer
- ⏳ Mainnet redeploy with audited binaries
- ⏳ Squads V4 multisig migrated to mainnet (with timelock)
- ⏳ Production RPC (Helius or Triton, paid tier)
- ⏳ Production Postgres (Supabase Pro or similar)
- ⏳ Monitoring + alerting (Sentry, Better Stack, PagerDuty)
- ⏳ Incident runbook at `docs/runbooks/`

---

## Phase 5 — Partner-gated integrations
**Window:** parallel to Phases 3–4; mainnet-launch blockers

These need commercial agreements before any production integration:

| Partner | What | Status |
|---|---|---|
| 🔒 Mercado Bitcoin | BRL on/off-ramp + asset tokenization rails | Conversation open. Commercial terms pending. |
| 🔒 Vaultik | Online watch-appraisal API | Need API access from Vaultik team |
| 🔒 Brink's / Loomis / Prosegur | Licensed physical custody for São Paulo vault + CFTV/IoT rights | MOU required; one custodian must close before mainnet |
| 🔒 BACEN-licensed SCD | Regulatory rail for BR-side fiat operations | LOI required |
| 🔒 Lloyd's of London (or local broker) | Master policy: theft + damage to trustee | Quote → bind → per-asset cert |
| 🔒 Curator on Kamino (Re7 / Steakhouse / Allez / MEV Capital) | LP capital routed via curated vault | After Vaulx market is live on Kamino V2 (Phase 3) |
| 🔒 Brazilian fintech counsel | CCB + fiduciary alienation legal review | Retain before mainnet |

---

## Phase 6 — Production launch
**Window:** September 2026 (Q3 target, pitch commitment)

- ⏳ First mainnet loan originated end-to-end
- ⏳ First LP capital deployed via Kamino curator vault or direct anchor lender
- ⏳ **First 50 BR-side mainnet loans completed by end of Q3**
- ⏳ Public liquidity dashboard + on-chain transparency page
- ⏳ Public security page (multisig PDA, audit report, custody MOUs, insurance cert)

---

## Phase 7 — Geographic + asset expansion
**Window:** Q4 2026 onward

- ⏳ Second market: **Mexico** (same legal pawn-monopoly pattern, similar RWA pain)
- ⏳ Asset-class expansion: jewellery → fine art → vehicles
- ⏳ Borrower tooling: partial repay, rollover automation, top-up
- ⏳ Lender tooling: programmatic senior/junior tranche split + POL first-loss buffer
- ⏳ Third + fourth markets (Turkey, India, SEA, ZA, NG — pick by partner readiness, not vanity)

---

## Out of scope (intentional, for 2026)

- ❌ Vaulx protocol token / governance token launch
- ❌ DAO governance (Squads V4 multisig remains governance through 2026)
- ❌ Cross-chain (Solana-only through end of 2026)
- ❌ Non-USDC stablecoins as primary unit (BRZ observed, not integrated)
- ❌ Crypto-only collateral (we are explicitly the *physical* RWA rail)

---

## How this file evolves

Single source of truth for what's next. Edit via PR like any other code:
- ✅ → move done items but keep them visible for one phase (recent wins)
- ⏳ → 🚧 when work starts; 🚧 → ✅ when shipped
- Add new dependencies or partners as they surface
- Add a one-line note + date on status changes (`✅ Crossmint prod tier · 2026-06-15`)

PRs against this file follow the same `main` branch protection as the rest of the repo.
