# Vaulx Protocol

**The on-chain credit rail for physical luxury collateral.** Borrowers deposit watches, jewellery, and fine objects into licensed custody; loans settle in USDC on Solana, with every state transition enforced by four Anchor programs.

Submitted to the **Solana Frontier Hackathon (Colosseum)**, May 2026.

[![Network](https://img.shields.io/badge/network-Solana%20Devnet-9333EA)]()
[![Anchor](https://img.shields.io/badge/anchor-0.30.1-22C55E)]()
[![Tests](https://img.shields.io/badge/tests-45%20programs%20%2B%2031%20vitest-22C55E)]()
[![License](https://img.shields.io/badge/license-MIT-0A0B0D)]()

- 🌐 Live demo — **[vaulx.fi](https://vaulx.fi)**
- 📺 Demo UI code — **[`site/`](./site)** (Laravel borrower + admin flows that power the live demo)
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
| **trdc** | [`26rb68SPyjKmFNwSUmfZA7WRFtsKFheXf5xN8eHeeRWk`](https://explorer.solana.com/address/26rb68SPyjKmFNwSUmfZA7WRFtsKFheXf5xN8eHeeRWk?cluster=devnet) | Loan state machine. The only program authorized to mint the compressed-NFT representation of a collateralized asset. |
| **vault** | [`GQU6pGwdUAWdhzNDGUU8toVCqxo22mHpFrJeFRE4hpDL`](https://explorer.solana.com/address/GQU6pGwdUAWdhzNDGUU8toVCqxo22mHpFrJeFRE4hpDL?cluster=devnet) | USDC reserve with share-based accounting and KYC gate. Only `loan` can move funds out via CPI. |
| **loan** | [`BCzcP4soWYSVWAt8gWPZmcNxcCiw8LdU8sT5VS3TPuW8`](https://explorer.solana.com/address/BCzcP4soWYSVWAt8gWPZmcNxcCiw8LdU8sT5VS3TPuW8?cluster=devnet) | Orchestrates origination, atomic custody confirmation, disbursement, repayment, and renewal. |
| **auction** | [`Fth5WyopNBi6JatJtTnxb7eHs2GSFhJU7AqskRBZGU8m`](https://explorer.solana.com/address/Fth5WyopNBi6JatJtTnxb7eHs2GSFhJU7AqskRBZGU8m?cluster=devnet) | Permissionless Dutch-auction foreclosure on default. |

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

These instructions have been executed against the deployed programs above and can be inspected on Solana Explorer:

| Instruction | Signature | What it proves |
|---|---|---|
| **Atomic `confirm_custody + disburse`** | [`5Vny6HYe…AGgP`](https://explorer.solana.com/tx/5Vny6HYevykUyHujFS5zmb7FBYUbn5ZXB5CmiYrWTQiwakXvZX1BhF3gSr7NAVmLnqBiipqFqXTCYcunsTuzAGgP?cluster=devnet) | One signed tx: `ConfirmCustody → ConfirmCustodyTransition → Disburse → TransitionToActive`. The load-bearing tech: no USDC moves until the licensed custodian confirms on-chain. |
| `create_ccb_trdc` | [`52SUbPcE…MtGL`](https://explorer.solana.com/tx/52SUbPcEhDwqbdvoWM5TYQYGxoakTe4ND4b7qBiABZC36NjhKRXMxjpYUZtewvRT5wkxxxCd7vHvRgXEr2oDMtGL?cluster=devnet) | CCB (Cédula de Crédito Bancário) creation + TRDC state initialisation — the legally-binding loan instrument anchored to the on-chain state. |
| `init_vault` | [`c8NccpWz…aDoxP7`](https://explorer.solana.com/tx/c8NccpWzuBtnPRW6ojp5vqKD5dbpWdZBT4UqgGTQfXEVFLQ438AytQpeJn9bXS4enM5rUsUx8DSFgEMPxaDoxP7?cluster=devnet) | USDC reserve initialised for this asset mint. |
| `deposit` (LP capital) | [`5ynYJcgf…TPqDc`](https://explorer.solana.com/tx/5ynYJcgfmPpBPbxQfr8fRFoiLH493YeGshwSguP1MMgqMtCZciQiAV6hDhT7QrNe7ATNYDYewLmmCd7Wuo4TPqDc?cluster=devnet) | LP capital deposited; vault shares minted. |

Click the **`5Vny6HYe…`** signature first — it's the single transaction where loan state transitions atomically, the borrower's USDC ATA is debited from the vault PDA, and the loan ends in the `Active` state. All four state changes in one signed instruction.

Supporting records committed to this repo:

- [`scripts/dev/edson-devnet.json`](scripts/dev/edson-devnet.json) — current deployment PDAs + init signatures
- [`scripts/dev/edson-usdc.json`](scripts/dev/edson-usdc.json) — Devnet USDC mint metadata
- [`scripts/dev/devnet-deploy.json`](scripts/dev/devnet-deploy.json) — program-deploy record
- [`scripts/dev/squads-upgrade-history.json`](scripts/dev/squads-upgrade-history.json) — multisig authority-transfer history

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

site/           Laravel demo UI — borrower + admin flows that power
                the live demo at vaulx.fi (Blade templates, Vite, SQLite,
                Caddy-fronted on Hetzner). Self-contained PHP app.

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
- **Marcelo Coelho** — Chief Operations · Brazilian physical-security infrastructure
- **Rodrigo Coelho** — Chief Growth · institutional network, market entry across LATAM
- **Edson Pohren** — Senior Engineer · Anchor · Bubblegum · oracle integration
- **Felipe Veloso** — DeFi Advisor & Community · founder of 4p.finance

Contact: **hello@vaulx.fi**
