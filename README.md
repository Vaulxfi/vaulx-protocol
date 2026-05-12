# Vaulx Protocol

**The on-chain credit rail for physical luxury collateral.** Borrowers deposit watches, jewellery, and fine objects into licensed custody; loans settle in USDC on Solana, with every state transition enforced by four Anchor programs.

Submitted to the **Solana Frontier Hackathon (Colosseum)**, May 2026.

[![Network](https://img.shields.io/badge/network-Solana%20Devnet-9333EA)]()
[![Anchor](https://img.shields.io/badge/anchor-0.30.1-22C55E)]()
[![Tests](https://img.shields.io/badge/tests-45%20programs%20%2B%2031%20vitest-22C55E)]()
[![License](https://img.shields.io/badge/license-MIT-0A0B0D)]()

- 🌐 Public site — **[vaulx.io](https://vaulx.io)**
- 📺 Demo UI repo — **[github.com/Vaulxfi/site](https://github.com/Vaulxfi/site)** (Laravel borrower + admin flows)
- 🔐 Upgrade authority — **Squads V4 multisig** PDA [`99o9WXdP3Gt1wwnYtEXheTh5x599f6SfmAdn9um3hejR`](https://explorer.solana.com/address/99o9WXdP3Gt1wwnYtEXheTh5x599f6SfmAdn9um3hejR?cluster=devnet)

---

## What this protocol does

Asset-rich borrowers in emerging markets are trapped behind broken credit infrastructure: pawn monopolies value luxury watches as scrap metal, while institutional USDC liquidity sits on-chain unable to reach off-chain collateral. Vaulx is the rail between the two.

The flow:

1. Borrower deposits a physical asset (watch, jewellery) with a **licensed custodian** (Brink's, Loomis, Prosegur).
2. A **Metaplex Bubblegum cNFT** is minted representing the asset, holding the full physical record (model, value, custody location, insurance, settlement contract).
3. The borrower locks the cNFT and borrows **USDC** against it.
4. **A single atomic instruction** transitions loan state, debits the vault, and disburses USDC to the borrower's ATA — gated by an on-chain custody confirmation from the licensed counterparty. **No USDC is released without that confirmation.**
5. Repayment in USDC unlocks the cNFT. On default, a permissionless **Dutch auction** triggers.

Vaulx orchestrates licensed counterparties — **it does not take custody and does not hold capital.** All settlement is on-chain.

---

## Architecture — four Anchor programs

All four programs are deployed to Solana **Devnet**. Upgrade authority is held by a **Squads V4 2-of-3 multisig** with timelock — no single key controls protocol funds or code.

| Program | Address | Purpose |
|---|---|---|
| **trdc** | [`FcDPvRaixjAz7LeC64h9xkXPzvHT7dusbNmg83eJfr7R`](https://explorer.solana.com/address/FcDPvRaixjAz7LeC64h9xkXPzvHT7dusbNmg83eJfr7R?cluster=devnet) | Loan state machine. The only program authorized to mint the compressed-NFT representation of a collateralized asset. |
| **vault** | [`4PPyUvazjDBvFndGUL2rgKTwZrFbsSP1tk4a2uMhE9MS`](https://explorer.solana.com/address/4PPyUvazjDBvFndGUL2rgKTwZrFbsSP1tk4a2uMhE9MS?cluster=devnet) | USDC reserve with share-based accounting and KYC gate. Only `loan` can move funds out via CPI. |
| **loan** | [`BHdxEKkfsyjERiz5XiUybDLquvoWRtF7r1zDgVCDZJow`](https://explorer.solana.com/address/BHdxEKkfsyjERiz5XiUybDLquvoWRtF7r1zDgVCDZJow?cluster=devnet) | Orchestrates origination, atomic custody confirmation, disbursement, repayment, and renewal. |
| **auction** | [`8FRBHN14CsA2y21hMeJJ2oxbEXNRXicVKMEDHRGyGefj`](https://explorer.solana.com/address/8FRBHN14CsA2y21hMeJJ2oxbEXNRXicVKMEDHRGyGefj?cluster=devnet) | Permissionless Dutch-auction foreclosure on default. |

Each program is in its own crate under `programs/`. Compromising any single program cannot drain the system — the vault enforces a two-layer authority gate (PDA + Instructions-sysvar verification) before releasing funds.

---

## The atomic invariant

The load-bearing technical decision is the `confirm_custody + disburse` instruction in `programs/loan/`. A single signed transaction does three things atomically:

1. Transitions loan state `Pending → ActiveInCustody`.
2. CPIs into the `vault` program to disburse USDC into the borrower's pre-pinned associated token account.
3. Transitions loan state `ActiveInCustody → Active`.

The borrower's USDC destination is **pinned to the borrower's public key in the accounts struct itself** — the licensed custodian, who is the only signer of the confirm, cannot redirect funds.

**No USDC moves until that confirmation lands on-chain.** Human trust on the physical-asset side; cryptographic guarantee on the money side.

---

## On-chain proof — verified devnet transactions

These instructions have been executed on Devnet against this deployment and can be inspected:

| Instruction | Signature | Program |
|---|---|---|
| `publish_price` | [`22CYgACX…X2zvz`](https://explorer.solana.com/tx/22CYgACXhy2jFofAoZphjLRnTfB6VCZGSvvHA7sQFq5y4jpXxWhkqDC5wZBU88ZNXD5UEHSYiWdUyALkrULy2zvz?cluster=devnet) | loan |
| `issue_kyc_attestation` | [`3rVRcPbV…6su`](https://explorer.solana.com/tx/3rVRcPbVHSzMqFYhQ4sz5Vjmgs8siQbX8aZBA5Hr34Vu4M1qDcsvEyFyqXC1iwbpvJwB71x2P87UhnkNQ4jzk6su?cluster=devnet) | vault |
| `mint_trdc_cnft` (Bubblegum) | [`5UwtTb3M…4sK`](https://explorer.solana.com/tx/5UwtTb3MsqLJfhwBpqi6bMK4hdPnZmiWHnCWqaE8gNhZxxift5yiKHLM8HPMQjVBPgD35GJJkeMeqq6vTJC5Y4sK?cluster=devnet) | trdc |

The full smoke-test record (with PDAs, asset IDs, and additional signatures) lives in [`scripts/dev/smoke-test-results.json`](scripts/dev/smoke-test-results.json). Original deploy record: [`scripts/dev/devnet-deploy.json`](scripts/dev/devnet-deploy.json). Multisig transfer history: [`scripts/dev/squads-upgrade-history.json`](scripts/dev/squads-upgrade-history.json).

---

## Stack

- **Programs:** Rust + Anchor 0.30.1
- **Off-chain bridge:** Node + Express + `@coral-xyz/anchor` (`apps/bridge/`)
- **Indexer:** TypeScript event tail → Supabase (`apps/indexer/`)
- **App:** Next.js 14 + Tailwind + shadcn/ui (`apps/web/`)
- **Identity:** Crossmint smart wallets + Sumsub WebSDK (KYC), with reusable on-chain attestation via Solana Attestation Service
- **Compressed NFT:** Metaplex Bubblegum + SPL account compression
- **Oracles:** Pyth (price) — wired, gated off in demo per hackathon scope
- **Governance:** Squads V4 multisig (2-of-3 timelock) holds upgrade authority on all four programs
- **Tests:** mocha + chai for Anchor (45 specs); vitest workspace-wide (31 specs)
- **Toolchain:** pnpm workspaces, Turborepo

---

## Quick start

Prerequisites: Node 18+, pnpm 10+, Rust + Anchor 0.30.1, Solana CLI 1.18+.

```bash
git clone https://github.com/Vaulxfi/vaulx-protocol.git
cd vaulx-protocol
pnpm install

# Run the workspace-wide test suite (vitest)
pnpm test

# Run the Anchor program tests (in-process validator)
anchor test
```

Each program can be built and deployed individually:

```bash
anchor build
anchor deploy --provider.cluster devnet
```

To re-run an end-to-end "moment" against your own keypair on Devnet:

```bash
pnpm exec tsx scripts/dev/moments-5-9-e2e.ts
```

---

## Repository layout

```
programs/
  trdc/       Loan state machine + cNFT minter
  vault/      USDC reserve, KYC gate, share accounting
  loan/       Origination, custody confirmation, repay/renew
  auction/    Permissionless Dutch-auction foreclosure

apps/
  bridge/     Node service: typed reads + loan-lifecycle writes (HMAC auth)
  indexer/    TS worker: tails on-chain events → Supabase
  web/        Next.js 14 borrower/lender product UI

packages/
  anchor-client/    Typed clients per program
  idls/             Generated IDLs + types (@vaulx/idls)
  ccb/              CCB (Cédula de Crédito Bancário) PDF + SHA-256
  supabase/         Schema + typed queries
  terms/            Loan terms types
  types/            Shared TS types

scripts/dev/    Devnet deploy + smoke-test artifacts
                Squads multisig setup + upgrade history
                End-to-end "moments" runners

tests/          mocha specs for the 4 programs + 3 e2e moments
supabase/       Postgres migrations for the indexer
```

---

## Security posture

- **No protocol-owned custody.** Vaulx orchestrates licensed counterparties; the team does not hold physical assets.
- **No protocol-owned capital.** USDC sits in on-chain vault PDAs; the team has no withdraw authority.
- **Upgrade authority:** Squads V4 multisig PDA [`99o9WXdP3G…hejR`](https://explorer.solana.com/address/99o9WXdP3Gt1wwnYtEXheTh5x599f6SfmAdn9um3hejR?cluster=devnet) with 2-of-3 threshold and timelock.
- **Two-layer authority gate on the vault:** disburse callers must (1) be the loan-program PDA signing via `invoke_signed`, and (2) the top-level instruction must be owned by the loan program (verified via the Instructions sysvar). Closes CPI-substitution.
- **First-loss buffer:** 5% protocol-owned liquidity reserve absorbs the first slice of any default before LP capital.
- **KYC gate + price oracle:** implemented on-chain, toggled `false` in this demo per hackathon scope.

---

## License

MIT — see [LICENSE](./LICENSE).

---

## Team

- **George Dimitrov** — CEO · 15+ years in banking operations
- **Marcelo Coelho** — Chief Operations · 38 years Brazilian physical-security infrastructure
- **Rodrigo Coelho** — Chief Growth · institutional network, market entry across LATAM
- **Edson Pohren** — Senior Engineer · Anchor · Bubblegum · oracle integration
- **Felipe Veloso** — DeFi Advisor & Community · founder of 4p.finance

Contact: **hello@vaulx.fi**
