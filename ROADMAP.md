# Vaulx — Roadmap

Vaulx is a Solana-native credit rail that turns physical luxury collateral into on-chain USDC loans. Borrowers deposit assets with a licensed custodian; loan state, custody confirmation, and disbursement settle atomically across four Anchor programs.

**Where we are (May 2026):** the protocol is live on Solana Devnet under a Squads V4 multisig, with the atomic custody-to-disbursement invariant operational end-to-end and a working borrower demo at [vaulx.fi](https://vaulx.fi).

**Where we're going (Q3 2026):** audited mainnet release, first fifty Brazilian loans originated, anchor LP capital routed through Kamino V2 curated vaults and direct institutional counterparties.

Status legend: ✅ shipped · 🚧 in progress · ⏳ next · 🔒 partner-gated

---

## Phase 1 — Devnet validation
**Window:** May 2026

- ✅ Four Anchor programs (`trdc`, `vault`, `loan`, `auction`) deployed to Solana Devnet
- ✅ Atomic invariant operational on-chain: licensed-custodian confirmation, vault debit, USDC disbursement, and loan-state transition all settle in a single signed transaction
- ✅ Cédula de Crédito Bancário (CCB) creation anchored to the on-chain TRDC state
- ✅ Vault initialisation and LP-deposit flow operational
- ✅ Squads V4 2-of-3 multisig holds upgrade authority on all four programs
- ✅ Borrower demo UI live at [vaulx.fi](https://vaulx.fi)
- ✅ Solana Frontier Hackathon submission (Colosseum, May 11, 2026)

---

## Phase 2 — Core feature completion
**Window:** May 2026

Components implemented at the program level and to be wired into the live borrower path:

- ⏳ Live cNFT issuance per loan — Metaplex Bubblegum compressed NFT carrying the full asset record (model, valuation, custody location, insurance reference, settlement contract)
- ⏳ Default flow — permissionless on-chain Dutch auction with foreclosure executed by the auction program
- ⏳ Full borrower lifecycle — pay, partial repay, renewal, repayment-and-unlock
- ⏳ KYC enforcement activated — Sumsub attestation issuance gates every money-touching instruction
- ⏳ Oracle-driven LTV monitoring activated — Pyth and RedStone feeds wired into vault and loan logic
- ⏳ Production-grade event indexing for the read-side

---

## Phase 3 — Self-service integrations
**Window:** May → June 2026 (parallel to Phase 2 finish)

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
| ⏳ Grafeno.digital (or equivalent BR digital-bank white-label CCB issuer) | API integration for CCB issuance | Confirm self-serve API tier; otherwise commercial conversation |

---

## Phase 4 — Audit + mainnet readiness
**Window:** July 2026

- ⏳ External smart-contract audit on all four Anchor programs
- ⏳ Penetration test on the off-chain bridge and indexer
- ⏳ Mainnet redeploy with audited binaries
- ⏳ Squads V4 multisig migrated to mainnet, with timelock
- ⏳ Production-grade RPC, database, monitoring, and alerting
- ⏳ Incident response runbook published

---

## Phase 5 — Partner-gated integrations
**Window:** parallel to Phases 3–4; mainnet-launch blockers

These need commercial agreements before any production integration:

| Partner | What | Status |
|---|---|---|
| 🔒 Mercado Bitcoin | BRL on/off-ramp + asset tokenization rails | Conversation open. Commercial terms pending. |
| 🔒 Vaultik | Online watch-appraisal API | Need API access from Vaultik team |
| 🔒 Brink's / Loomis / Sekuro | Licensed physical custody for São Paulo vault + CFTV/IoT rights | MOU required; one custodian must close before mainnet |
| 🔒 Insurance partner | Master policy: theft + damage to trustee | Quote → bind → per-asset cert |
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

- ⏳ Geographic expansion across LatAm, with parallel evaluation of the US and other emerging markets — sequenced by partner readiness, not vanity
- ⏳ Asset-class expansion: jewellery → fine art → vehicles
- ⏳ Borrower tooling: partial repay, rollover automation, top-up
- ⏳ Lender tooling: programmatic senior/junior tranche split + POL first-loss buffer

---

_Living document. Updated as milestones close and dependencies surface._
