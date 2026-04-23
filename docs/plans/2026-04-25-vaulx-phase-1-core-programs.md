# Vaulx Phase 1: Core Programs + Lender Deposit Happy Path

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task in the current session.

> **Scope decisions resolved 2026-04-24:**
> - Q1 (7-state enum): use the Phase-0 TS enum already in `packages/types/src/index.ts` (`PendingCustody`, `Active`, `Renewed`, `Repaid`, `Overdue`, `Defaulted`, `Liquidated`). Do NOT rename to match `VAULX_Canonical_Spec_v1.md`'s 7 states this phase.
> - Q2 (Bubblegum): defer real cNFT mint to Phase 2. Phase 1 mints only the `TRDCState` PDA; `mint_trdc_cnft` instruction exists but returns a stub asset_id and is documented as stubbed.
> - Q3 (Civic on `deposit`): keep I4 as a frontend-only mock modal in Phase 1 (hardcoded pass). Do NOT add a Civic Pass account constraint to `deposit` in Phase 1 — that wiring lands in Phase 2+.

**Goal:** Ship Moment 1 end-to-end on Devnet — a lender connects their wallet, passes a Civic/Blockpass mock KYC modal, deposits USDC into a Vault, and sees their share balance on-chain plus an event row in Supabase. In parallel, land the on-chain foundation the rest of the build sits on: a `TRDCState` PDA with the full 7-state enum and an `InvalidStateTransition` guard, a Vault program with real share-token accounting (`initialize_vault` / `deposit` / `withdraw`), a `disburse` stub with the correct signature (body filled in Phase 2), and `Loan.create_ccb_trdc` with an LTV gate that rejects any loan above 60% LTV via CPI into the TRDC program.

**Architecture:** Four Anchor 0.30.1 programs (`trdc`, `vault`, `loan`, `auction`) share a Cargo workspace; their IDL JSONs are copied to `packages/idls/src/` after every build and consumed by `@vaulx/anchor-client` (generated via `anchor-client-gen`). The Next.js 14 App Router app (`apps/web`) calls those typed clients through `@coral-xyz/anchor` + `@solana/wallet-adapter-react`. A standalone Node worker at `apps/indexer` subscribes to Vault program logs over WebSocket and upserts parsed events into the Supabase `onchain_events` table — the FE reads that mirror via TanStack Query rather than polling the chain.

**Tech Stack:** Anchor 0.30.1 on rustc 1.85.0; Solana CLI 1.18.26 (Agave); SPL Token for USDC-like mint + share mint; Bubblegum stub in Phase 1 (real CPI deferred to Phase 2); Next.js 14 + Tailwind + shadcn `new-york` + TanStack Query + React Hook Form + Zod on the FE; `@vaulx/anchor-client` generated via `anchor-client-gen`; `@coral-xyz/anchor` + `@solana/wallet-adapter-{react,wallets}` for wallet + RPC; `@solana/spl-token` for mint + ATA ops; Supabase (pg) for off-chain mirror; pnpm@10.13.1 workspaces + Turborepo.

**Timeline:** Days 4–7 (2026-04-25 → 2026-04-28). Day 4 = Tasks 1.1–1.3 (TRDC). Day 5 = Tasks 1.4–1.7 (Vault + stub). Day 6 = Tasks 1.8–1.10 (Loan + client gen). Day 7 = Tasks 1.11–1.14 (FE + indexer + E2E).

**macOS note for every `anchor test`:** prefix with `COPYFILE_DISABLE=1` (e.g. `COPYFILE_DISABLE=1 anchor test`). Linux CI doesn't need it; the workflow already runs on `ubuntu-22.04`.

---

## Prerequisites (do once, before Task 1.1)

Run these in order from the repo root (`/Users/gogy/MyCODE/VAULX`). Each should succeed before starting Task 1.1 — if any fail, stop and fix the Phase 0 scaffold before proceeding.

```bash
pnpm install
COPYFILE_DISABLE=1 anchor build          # should emit 4 IDLs into target/idl/
pnpm -w run typecheck
pnpm -w run test
```

Expected: all four programs build, 4 LTV tests pass in `@vaulx/terms`, `apps/web` typechecks. If `anchor build` fails, verify the `vendor/anchor-syn` patch in `Cargo.toml` is intact — **do not modify it**.

---

## Task 1.1 — TRDCState PDA + 7-state enum scaffolding (TRDC program)

**Goal:** Introduce the `TRDCState` account + the `Status` enum in Rust, with an `initialize_trdc_state` instruction that creates the PDA in state `PendingCustody`. No transitions yet — those are Task 1.2.

**Files:**
- Create: `/Users/gogy/MyCODE/VAULX/programs/trdc/src/state.rs`
- Create: `/Users/gogy/MyCODE/VAULX/programs/trdc/src/errors.rs`
- Modify: `/Users/gogy/MyCODE/VAULX/programs/trdc/src/lib.rs` (replace `ping` with real module wiring)
- Test: `/Users/gogy/MyCODE/VAULX/tests/trdc.spec.ts`

**Step 1 — write the failing test first.** Create `tests/trdc.spec.ts`:

```ts
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { expect } from "chai";

describe("trdc / initialize_trdc_state", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.Trdc as Program<any>;
  const provider = anchor.getProvider();

  it("creates a TRDCState PDA in PendingCustody", async () => {
    const loanId = Keypair.generate().publicKey;
    const [trdcStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("trdc_state"), loanId.toBuffer()],
      program.programId,
    );
    const appraisalValue = new anchor.BN(50_000_000_000); // 50k @ 6dp
    const loanAmount     = new anchor.BN(25_000_000_000); // 25k @ 6dp (50% LTV)
    const dueTs          = new anchor.BN(Math.floor(Date.now() / 1000) + 120 * 86400);

    await program.methods
      .initializeTrdcState(loanId, appraisalValue, loanAmount, dueTs)
      .accounts({
        trdcState: trdcStatePda,
        payer: provider.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const state = await program.account.trdcState.fetch(trdcStatePda);
    expect(state.loanId.toBase58()).to.eq(loanId.toBase58());
    expect(state.status).to.deep.equal({ pendingCustody: {} });
    expect(state.loanAmount.toString()).to.eq("25000000000");
    expect(state.appraisalValue.toString()).to.eq("50000000000");
  });
});
```

Run: `COPYFILE_DISABLE=1 anchor test`. Expected output: `Error: method 'initializeTrdcState' not found` (or unresolved `workspace.Trdc`) — the `ping`-only program has no such method. **Good — red.**

**Step 2 — write `programs/trdc/src/state.rs`:**

```rust
use anchor_lang::prelude::*;

/// 7-state enum — mirrors `packages/types/src/index.ts` `TRDCStatus`.
/// Ordering must match: PendingCustody=0, Active=1, Renewed=2, Repaid=3,
/// Overdue=4, Defaulted=5, Liquidated=6.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum Status {
    PendingCustody,
    Active,
    Renewed,
    Repaid,
    Overdue,
    Defaulted,
    Liquidated,
}

#[account]
pub struct TRDCState {
    pub loan_id: Pubkey,          // 32 — opaque off-chain loan id
    pub status: Status,           //  1 + disc = 2 (Anchor enum)
    pub appraisal_value: u64,     //  8 — in loan_token native units (e.g. 6dp USDC)
    pub loan_amount: u64,         //  8 — principal owed
    pub due_ts: i64,              //  8 — unix seconds
    pub bump: u8,                 //  1
    pub created_at: i64,          //  8
    pub _reserved: [u8; 64],      // 64 — forward-compat padding
}

impl TRDCState {
    pub const SIZE: usize = 8 // anchor discriminator
        + 32 + 2 + 8 + 8 + 8 + 1 + 8 + 64;
    pub const SEED: &'static [u8] = b"trdc_state";
}
```

**Step 3 — write `programs/trdc/src/errors.rs`:**

```rust
use anchor_lang::prelude::*;

#[error_code]
pub enum TrdcError {
    #[msg("Invalid state transition")]
    InvalidStateTransition,
    #[msg("Math overflow")]
    MathOverflow,
}
```

**Step 4 — rewrite `programs/trdc/src/lib.rs`:**

```rust
use anchor_lang::prelude::*;

pub mod errors;
pub mod state;

use errors::TrdcError;
use state::{Status, TRDCState};

declare_id!("FcDPvRaixjAz7LeC64h9xkXPzvHT7dusbNmg83eJfr7R");

#[program]
pub mod trdc {
    use super::*;

    pub fn initialize_trdc_state(
        ctx: Context<InitializeTrdcState>,
        loan_id: Pubkey,
        appraisal_value: u64,
        loan_amount: u64,
        due_ts: i64,
    ) -> Result<()> {
        let clock = Clock::get()?;
        let s = &mut ctx.accounts.trdc_state;
        s.loan_id = loan_id;
        s.status = Status::PendingCustody;
        s.appraisal_value = appraisal_value;
        s.loan_amount = loan_amount;
        s.due_ts = due_ts;
        s.bump = ctx.bumps.trdc_state;
        s.created_at = clock.unix_timestamp;
        s._reserved = [0u8; 64];
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(loan_id: Pubkey)]
pub struct InitializeTrdcState<'info> {
    #[account(
        init,
        payer = payer,
        space = TRDCState::SIZE,
        seeds = [TRDCState::SEED, loan_id.as_ref()],
        bump,
    )]
    pub trdc_state: Account<'info, TRDCState>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

// re-export so other programs can depend on us via `cpi`
pub use errors::*;
pub use state::*;
```

**Step 5 — run the test again.** `COPYFILE_DISABLE=1 anchor test`. Expected: one test passes (`creates a TRDCState PDA in PendingCustody`). The bootstrap test in `tests/bootstrap.ts` will now fail because `program.methods.ping` no longer exists — **remove the TRDC ping call** from `tests/bootstrap.ts` (keep vault/loan/auction pings for now).

**Step 6 — also add a negative re-init test in the same describe block:**

```ts
it("rejects second initialize for same loan_id", async () => {
  const loanId = Keypair.generate().publicKey;
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("trdc_state"), loanId.toBuffer()], program.programId,
  );
  const args = [loanId, new anchor.BN(1), new anchor.BN(1), new anchor.BN(1)];
  await program.methods.initializeTrdcState(...args)
    .accounts({ trdcState: pda, payer: provider.publicKey, systemProgram: SystemProgram.programId })
    .rpc();
  let threw = false;
  try {
    await program.methods.initializeTrdcState(...args)
      .accounts({ trdcState: pda, payer: provider.publicKey, systemProgram: SystemProgram.programId })
      .rpc();
  } catch { threw = true; }
  expect(threw).to.eq(true);
});
```

Run: `COPYFILE_DISABLE=1 anchor test`. Both pass. **Green.**

**Commit:**
```
git add programs/trdc tests/trdc.spec.ts tests/bootstrap.ts
git commit -m "feat(trdc): add TRDCState PDA + Status enum + initialize_trdc_state"
```

**Notes / gotchas:**
- macOS requires `COPYFILE_DISABLE=1 anchor test` every time.
- Keep `Status` variants in the same order as `packages/types/src/index.ts` — the Anchor client lowercases + camelCases them to `{pendingCustody: {}}` etc.
- After this task, `target/idl/trdc.json` exists but isn't yet copied to `packages/idls` — that happens in Task 1.9.

---

## Task 1.2 — 7-state transitions with `InvalidStateTransition` guards

**Goal:** Add an internal `transition()` helper that enforces the exact transition table from the canonical spec + a public `test_transition` instruction (explicitly test-only, gated by a `cfg(feature = "testing")` hook or simply a permissive signer guard since this is pre-audit Phase 1). Every legal edge passes; every illegal edge returns `TrdcError::InvalidStateTransition`.

**Files:**
- Modify: `/Users/gogy/MyCODE/VAULX/programs/trdc/src/state.rs`
- Modify: `/Users/gogy/MyCODE/VAULX/programs/trdc/src/lib.rs`
- Test: `/Users/gogy/MyCODE/VAULX/tests/trdc.spec.ts` (append)

Legal transition table (implement exactly this — illegal otherwise):

| From              | To (allowed)                         |
|-------------------|--------------------------------------|
| PendingCustody    | Active                               |
| Active            | Renewed, Repaid, Overdue             |
| Renewed           | Active, Overdue, Repaid              |
| Overdue           | Repaid, Defaulted                    |
| Defaulted         | Liquidated                           |
| Repaid            | (terminal)                           |
| Liquidated        | (terminal)                           |

**Step 1 — add failing tests first** (append to `tests/trdc.spec.ts`):

```ts
describe("trdc / transitions", () => {
  // helper: init a PDA in any starting state via initialize (PendingCustody) then
  // walk through legal edges to arrive at the required starting state. For brevity
  // in this plan, iterate the full matrix pairwise.

  const legal: Array<[string, string]> = [
    ["pendingCustody","active"],
    ["active","renewed"], ["active","repaid"], ["active","overdue"],
    ["renewed","active"], ["renewed","overdue"], ["renewed","repaid"],
    ["overdue","repaid"], ["overdue","defaulted"],
    ["defaulted","liquidated"],
  ];
  // the full 7x7 minus legal minus self-loops = illegal set
  // (loop through all pairs; assert legal pairs succeed, others revert with
  // `InvalidStateTransition` — 0x1770 or name match depending on Anchor version)
});
```

Flesh out with `for (const [from, to] of legal)` + a second loop for illegal pairs that asserts `err.error.errorCode.code === "InvalidStateTransition"`.

Run: `COPYFILE_DISABLE=1 anchor test`. The illegal-pairs block fails because no transition instruction exists yet. **Red.**

**Step 2 — extend `state.rs`:**

```rust
impl Status {
    pub fn can_transition_to(self, next: Status) -> bool {
        use Status::*;
        matches!(
            (self, next),
            (PendingCustody, Active)
            | (Active, Renewed) | (Active, Repaid) | (Active, Overdue)
            | (Renewed, Active) | (Renewed, Overdue) | (Renewed, Repaid)
            | (Overdue, Repaid) | (Overdue, Defaulted)
            | (Defaulted, Liquidated)
        )
    }
}

impl TRDCState {
    pub fn transition(&mut self, next: Status) -> Result<()> {
        require!(
            self.status.can_transition_to(next),
            crate::errors::TrdcError::InvalidStateTransition
        );
        self.status = next;
        Ok(())
    }
}
```

**Step 3 — add a test-only instruction in `lib.rs`:**

```rust
pub fn test_transition(ctx: Context<TestTransition>, next: Status) -> Result<()> {
    ctx.accounts.trdc_state.transition(next)
}

#[derive(Accounts)]
pub struct TestTransition<'info> {
    #[account(mut)]
    pub trdc_state: Account<'info, TRDCState>,
    pub authority: Signer<'info>, // in Phase 1 any signer — Phase 3 adds role gating
}
```

Run: `COPYFILE_DISABLE=1 anchor test`. All transition tests pass. **Green.**

**Commit:**
```
git add programs/trdc tests/trdc.spec.ts
git commit -m "feat(trdc): enforce 7-state transitions with InvalidStateTransition guard"
```

**Notes:** Phase 3 will replace `test_transition` with role-gated `confirm_custody` / `mark_overdue` / `execute_af_default` instructions; for now the helper is the code path being tested.

---

## Task 1.3 — Bubblegum cNFT mint stub

**Goal:** Add `mint_trdc_cnft(asset_hint: [u8;32])` that stores a deterministic fake `asset_id` on the TRDCState (or emits an event) and returns `Ok(())` — **no real Bubblegum CPI in Phase 1.** Explicitly marked `// PHASE_2_TODO: real Bubblegum CPI here` with the rationale.

**Rationale (document in the code itself):** Moment 1 (lender deposit) doesn't touch TRDCs at all. Bubblegum requires a Merkle tree + collection setup that costs ~1 day to wire correctly on Devnet and blocks no exit criterion. `test_ltv_enforced_at_mint` only asserts the LTV gate fires *before* the mint call, so a stub body is indistinguishable from a real one for test purposes. This is a **deliberate YAGNI deferral** — Phase 2 replaces the body in a single task.

**Files:**
- Modify: `/Users/gogy/MyCODE/VAULX/programs/trdc/src/state.rs` (add `asset_id` field)
- Modify: `/Users/gogy/MyCODE/VAULX/programs/trdc/src/lib.rs`
- Test: `/Users/gogy/MyCODE/VAULX/tests/trdc.spec.ts` (append)

**Step 1 — add `pub asset_id: Pubkey` to `TRDCState` struct** (adjust `SIZE += 32`).

**Step 2 — add red test:**

```ts
it("mint_trdc_cnft writes a deterministic asset_id", async () => {
  // init PDA, then call mint_trdc_cnft, assert asset_id != default Pubkey
});
```

**Step 3 — add impl in `lib.rs`:**

```rust
pub fn mint_trdc_cnft(ctx: Context<MintTrdcCnft>, asset_hint: [u8; 32]) -> Result<()> {
    // PHASE_2_TODO: replace this stub with a real Bubblegum CPI (mpl-bubblegum
    // `mint_to_collection_v1`). Phase 1 does not need a real cNFT to ship
    // Moment 1 (lender deposit) — the LTV gate in loan.create_ccb_trdc is
    // tested against the initialize + stub-mint call path, which is logically
    // identical to the real path for the purposes of the LTV assertion.
    let s = &mut ctx.accounts.trdc_state;
    // derive a stable fake asset id from the hint + loan_id
    let combined = [s.loan_id.as_ref(), &asset_hint].concat();
    let hash = anchor_lang::solana_program::hash::hash(&combined);
    s.asset_id = Pubkey::new_from_array(hash.to_bytes());
    Ok(())
}

#[derive(Accounts)]
pub struct MintTrdcCnft<'info> {
    #[account(mut)]
    pub trdc_state: Account<'info, TRDCState>,
    pub authority: Signer<'info>,
}
```

Run test → green.

**Commit:**
```
git add programs/trdc tests/trdc.spec.ts
git commit -m "feat(trdc): stub mint_trdc_cnft (real Bubblegum CPI deferred to Phase 2)"
```

---

## Task 1.4 — `initialize_vault` + Vault PDA

**Goal:** Vault program owns an `asset_mint` (SPL mint, e.g. USDC) and a freshly-created `share_mint` with the Vault PDA as mint authority. Storing `total_assets` and `total_shares` (redundant with on-chain balances but useful for event emission and a cheap round-trip integrity check).

**Files:**
- Create: `/Users/gogy/MyCODE/VAULX/programs/vault/src/state.rs`
- Create: `/Users/gogy/MyCODE/VAULX/programs/vault/src/errors.rs`
- Modify: `/Users/gogy/MyCODE/VAULX/programs/vault/src/lib.rs`
- Modify: `/Users/gogy/MyCODE/VAULX/programs/vault/Cargo.toml` (add `anchor-spl`)
- Test: `/Users/gogy/MyCODE/VAULX/tests/vault.spec.ts`

**Step 1 — add `anchor-spl` dep:**

```toml
# programs/vault/Cargo.toml
[dependencies]
anchor-lang = { workspace = true }
anchor-spl  = { workspace = true, features = ["token"] }
```

**Step 2 — red test** (`tests/vault.spec.ts`):

```ts
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID, createMint, getAccount, createAssociatedTokenAccount,
  mintTo, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { expect } from "chai";

describe("vault / initialize_vault", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.Vault as Program<any>;
  const provider = anchor.getProvider() as anchor.AnchorProvider;
  let assetMint: PublicKey;

  before(async () => {
    assetMint = await createMint(
      provider.connection,
      (provider.wallet as any).payer,
      provider.publicKey, null, 6,
    );
  });

  it("initializes vault with share_mint owned by the vault PDA", async () => {
    const [vaultPda, bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), assetMint.toBuffer()], program.programId,
    );
    const shareMint = Keypair.generate();
    await program.methods.initializeVault().accounts({
      vault: vaultPda,
      assetMint,
      shareMint: shareMint.publicKey,
      payer: provider.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    }).signers([shareMint]).rpc();

    const v = await program.account.vault.fetch(vaultPda);
    expect(v.assetMint.toBase58()).to.eq(assetMint.toBase58());
    expect(v.shareMint.toBase58()).to.eq(shareMint.publicKey.toBase58());
    expect(v.totalAssets.toString()).to.eq("0");
    expect(v.totalShares.toString()).to.eq("0");
    expect(v.bump).to.eq(bump);
  });

  it("cannot initialize twice", async () => {
    // call initializeVault again with same seeds → expect revert
  });
});
```

Run: red (method not found).

**Step 3 — `state.rs`:**

```rust
use anchor_lang::prelude::*;

#[account]
pub struct Vault {
    pub asset_mint: Pubkey,   // 32
    pub share_mint: Pubkey,   // 32
    pub total_assets: u64,    //  8
    pub total_shares: u64,    //  8
    pub bump: u8,             //  1
    pub _reserved: [u8; 64],
}
impl Vault {
    pub const SIZE: usize = 8 + 32 + 32 + 8 + 8 + 1 + 64;
    pub const SEED: &'static [u8] = b"vault";
}
```

**Step 4 — `errors.rs`:**

```rust
use anchor_lang::prelude::*;

#[error_code]
pub enum VaultError {
    #[msg("Math overflow")] MathOverflow,
    #[msg("Zero amount")]   ZeroAmount,
    #[msg("Insufficient vault liquidity")] InsufficientVaultLiquidity,
    #[msg("Disburse not yet implemented")] DisburseNotYetImplemented,
}
```

**Step 5 — `lib.rs` skeleton:**

```rust
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, MintTo, Transfer, Burn};

pub mod errors;
pub mod state;
use errors::VaultError;
use state::Vault;

declare_id!("4PPyUvazjDBvFndGUL2rgKTwZrFbsSP1tk4a2uMhE9MS");

#[program]
pub mod vault {
    use super::*;

    pub fn initialize_vault(ctx: Context<InitializeVault>) -> Result<()> {
        let v = &mut ctx.accounts.vault;
        v.asset_mint = ctx.accounts.asset_mint.key();
        v.share_mint = ctx.accounts.share_mint.key();
        v.total_assets = 0;
        v.total_shares = 0;
        v.bump = ctx.bumps.vault;
        v._reserved = [0u8; 64];
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeVault<'info> {
    #[account(
        init, payer = payer, space = Vault::SIZE,
        seeds = [Vault::SEED, asset_mint.key().as_ref()], bump,
    )]
    pub vault: Account<'info, Vault>,
    pub asset_mint: Account<'info, Mint>,
    #[account(
        init, payer = payer,
        mint::decimals = 6, mint::authority = vault, mint::freeze_authority = vault,
    )]
    pub share_mint: Account<'info, Mint>,
    #[account(mut)] pub payer: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}
```

Run: green.

**Commit:**
```
git add programs/vault tests/vault.spec.ts
git commit -m "feat(vault): add Vault PDA + initialize_vault with share_mint"
```

**Notes:** `share_mint` is a normal Keypair-signed init, not a PDA — this is intentional (Phase 3 will audit whether share_mint should be a PDA too). Decimals locked at 6 to match USDC.

---

## Task 1.5 — `deposit` with share math (`test_vault_share_accounting` required)

**Goal:** Implement `deposit(amount: u64)` with correct share accounting. First deposit is 1:1. Subsequent: `shares_out = floor(amount * total_shares / total_assets)`. This is the core piece of Moment 1.

**Files:**
- Modify: `/Users/gogy/MyCODE/VAULX/programs/vault/src/lib.rs`
- Test: `/Users/gogy/MyCODE/VAULX/tests/vault.spec.ts` (append)

**Step 1 — red tests (three of them):**

```ts
describe("vault / deposit", () => {
  // setup: initialize vault, create two lender keypairs, airdrop SOL, mint 10k USDC each

  it("test_first_deposit_is_one_to_one", async () => {
    // alice deposits 1000 USDC into empty vault → receives exactly 1000 shares
  });

  it("test_second_deposit_rounds_down", async () => {
    // after state: total_assets=1000, total_shares=1000
    // simulate yield accrual by airdropping 100 USDC directly into vault_ata (total_assets becomes effectively 1100 via rebalance or update call)
    // -- OR: since Phase 1 has no yield, construct the rounding case with two real deposits + an artificial imbalance
    // bob deposits 333 USDC → expected shares = floor(333 * 1000 / 1100) = 302
  });

  it("test_vault_share_accounting", async () => {
    // 3 lenders each deposit random amounts in random order
    // at the end: sum of every lender's share balance === vault.total_shares
    // and vault_ata.amount === vault.total_assets
  });
});
```

Run: red.

**Step 2 — add deposit instruction:**

```rust
pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
    require!(amount > 0, VaultError::ZeroAmount);

    let total_assets = ctx.accounts.vault.total_assets;
    let total_shares = ctx.accounts.vault.total_shares;

    let shares_to_mint: u64 = if total_shares == 0 || total_assets == 0 {
        amount
    } else {
        (amount as u128)
            .checked_mul(total_shares as u128).ok_or(VaultError::MathOverflow)?
            .checked_div(total_assets as u128).ok_or(VaultError::MathOverflow)?
            .try_into().map_err(|_| VaultError::MathOverflow)?
    };
    require!(shares_to_mint > 0, VaultError::ZeroAmount);

    // 1) transfer USDC from depositor_ata → vault_ata
    token::transfer(
        CpiContext::new(ctx.accounts.token_program.to_account_info(), Transfer {
            from: ctx.accounts.depositor_ata.to_account_info(),
            to:   ctx.accounts.vault_ata.to_account_info(),
            authority: ctx.accounts.depositor.to_account_info(),
        }),
        amount,
    )?;

    // 2) mint shares → depositor_share_ata
    let asset_mint_key = ctx.accounts.asset_mint.key();
    let seeds: &[&[u8]] = &[Vault::SEED, asset_mint_key.as_ref(), &[ctx.accounts.vault.bump]];
    token::mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.share_mint.to_account_info(),
                to:   ctx.accounts.depositor_share_ata.to_account_info(),
                authority: ctx.accounts.vault.to_account_info(),
            },
            &[seeds],
        ),
        shares_to_mint,
    )?;

    // 3) accounting
    let v = &mut ctx.accounts.vault;
    v.total_assets = v.total_assets.checked_add(amount).ok_or(VaultError::MathOverflow)?;
    v.total_shares = v.total_shares.checked_add(shares_to_mint).ok_or(VaultError::MathOverflow)?;

    Ok(())
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut, seeds = [Vault::SEED, asset_mint.key().as_ref()], bump = vault.bump)]
    pub vault: Account<'info, Vault>,
    pub asset_mint: Account<'info, Mint>,
    #[account(mut, address = vault.share_mint)] pub share_mint: Account<'info, Mint>,

    #[account(mut, token::mint = asset_mint, token::authority = vault)]
    pub vault_ata: Account<'info, TokenAccount>,

    #[account(mut, token::mint = asset_mint, token::authority = depositor)]
    pub depositor_ata: Account<'info, TokenAccount>,

    #[account(mut, token::mint = share_mint, token::authority = depositor)]
    pub depositor_share_ata: Account<'info, TokenAccount>,

    #[account(mut)] pub depositor: Signer<'info>,
    pub token_program: Program<'info, Token>,
}
```

**Step 3 — TS helper** in the test: write a small `setupVault()` util that (a) creates the asset mint, (b) calls `initializeVault`, (c) creates the vault ATA (associated account with vault PDA as owner — use `getAssociatedTokenAddressSync(assetMint, vaultPda, true)` with `allowOwnerOffCurve=true`), (d) mints 10k USDC to each of 3 lender keypairs.

Run: green on all three.

**Commit:**
```
git add programs/vault tests/vault.spec.ts
git commit -m "feat(vault): implement deposit with share math + multi-lender accounting tests"
```

**Notes:** `token::transfer` is deprecated in newer spl-token crates in favor of `transfer_checked` — Anchor 0.30.1 + anchor-spl 0.30.1 still exports the plain form, use it.

---

## Task 1.6 — `withdraw` with share math

**Goal:** `withdraw(shares: u64)`: burn shares from depositor, transfer `assets_out = floor(shares * total_assets / total_shares)` from vault_ata → depositor_ata, decrement both totals. Roundtrip test: deposit X, withdraw all shares, recover X ± 1 lamport.

**Files:**
- Modify: `/Users/gogy/MyCODE/VAULX/programs/vault/src/lib.rs`
- Test: `/Users/gogy/MyCODE/VAULX/tests/vault.spec.ts` (append)

**Step 1 — red test:**

```ts
it("roundtrips deposit + withdraw within 1 lamport", async () => {
  // alice deposits 1000 USDC → receives 1000 shares
  // alice withdraws 1000 shares → receives 1000 USDC (± 1)
});

it("withdraw more shares than owned reverts", async () => { ... });
```

**Step 2 — impl:**

```rust
pub fn withdraw(ctx: Context<Withdraw>, shares: u64) -> Result<()> {
    require!(shares > 0, VaultError::ZeroAmount);
    let v = &ctx.accounts.vault;
    let assets_out: u64 = (shares as u128)
        .checked_mul(v.total_assets as u128).ok_or(VaultError::MathOverflow)?
        .checked_div(v.total_shares as u128).ok_or(VaultError::MathOverflow)?
        .try_into().map_err(|_| VaultError::MathOverflow)?;
    require!(assets_out <= v.total_assets, VaultError::InsufficientVaultLiquidity);

    // burn shares
    token::burn(
        CpiContext::new(ctx.accounts.token_program.to_account_info(), Burn {
            mint: ctx.accounts.share_mint.to_account_info(),
            from: ctx.accounts.depositor_share_ata.to_account_info(),
            authority: ctx.accounts.depositor.to_account_info(),
        }),
        shares,
    )?;

    // transfer assets out (vault signs)
    let asset_mint_key = ctx.accounts.asset_mint.key();
    let seeds: &[&[u8]] = &[Vault::SEED, asset_mint_key.as_ref(), &[v.bump]];
    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault_ata.to_account_info(),
                to:   ctx.accounts.depositor_ata.to_account_info(),
                authority: ctx.accounts.vault.to_account_info(),
            }, &[seeds],
        ),
        assets_out,
    )?;

    let v = &mut ctx.accounts.vault;
    v.total_assets = v.total_assets.checked_sub(assets_out).ok_or(VaultError::MathOverflow)?;
    v.total_shares = v.total_shares.checked_sub(shares).ok_or(VaultError::MathOverflow)?;
    Ok(())
}
```

Accounts struct is mirror-symmetric to `Deposit` — copy + rename; no new accounts.

Run: green.

**Commit:**
```
git add programs/vault tests/vault.spec.ts
git commit -m "feat(vault): implement withdraw with burn + checked-sub accounting"
```

---

## Task 1.7 — `disburse` stub

**Goal:** Publish the instruction signature so the FE + anchor-client can type against it, but fail-fast on invocation with `DisburseNotYetImplemented`. Phase 2 replaces the body with the real custody-gated CPI from Loan.

**Files:**
- Modify: `/Users/gogy/MyCODE/VAULX/programs/vault/src/lib.rs`
- Test: `/Users/gogy/MyCODE/VAULX/tests/vault.spec.ts` (append)

**Step 1 — red test:**
```ts
it("disburse returns DisburseNotYetImplemented", async () => {
  // build a disburse ix and expect error code name match
});
```

**Step 2 — impl:**
```rust
pub fn disburse(_ctx: Context<Disburse>, _amount: u64) -> Result<()> {
    // PHASE_2_TODO: implement the custody-gated CPI path per canonical spec §4.2.
    // Contract is defined here so anchor-client-gen can emit the typed builder
    // and the FE can display a "coming in Phase 2" disabled button without
    // being blocked on backend work.
    err!(VaultError::DisburseNotYetImplemented)
}

#[derive(Accounts)]
pub struct Disburse<'info> {
    #[account(mut, seeds = [Vault::SEED, asset_mint.key().as_ref()], bump = vault.bump)]
    pub vault: Account<'info, Vault>,
    pub asset_mint: Account<'info, Mint>,
    #[account(mut, token::mint = asset_mint, token::authority = vault)]
    pub vault_ata: Account<'info, TokenAccount>,
    #[account(mut, token::mint = asset_mint)] pub borrower_ata: Account<'info, TokenAccount>,
    /// CHECK: validated in Phase 2 CPI authority check
    pub loan_program_authority: UncheckedAccount<'info>,
    pub token_program: Program<'info, Token>,
}
```

Green.

**Commit:**
```
git add programs/vault tests/vault.spec.ts
git commit -m "feat(vault): stub disburse signature (body deferred to Phase 2)"
```

---

## Task 1.8 — `Loan.create_ccb_trdc` with LTV gate (CPI into TRDC)

**Goal:** New instruction in `loan` program. Takes `(loan_id, appraisal_value, loan_amount, due_ts)`. Enforces `loan_amount * 10_000 <= appraisal_value * 6_000` (i.e. ≤60% LTV, matching `MAX_LTV_BPS` from `@vaulx/terms`). CPIs into `trdc.initialize_trdc_state` + `trdc.mint_trdc_cnft`.

**Files:**
- Modify: `/Users/gogy/MyCODE/VAULX/programs/loan/Cargo.toml` — add dep on `trdc` as `cpi`:
  ```toml
  [dependencies]
  anchor-lang = { workspace = true }
  trdc = { path = "../trdc", features = ["cpi"] }
  ```
- Modify: `/Users/gogy/MyCODE/VAULX/programs/loan/src/lib.rs`
- Create: `/Users/gogy/MyCODE/VAULX/programs/loan/src/errors.rs`
- Test: `/Users/gogy/MyCODE/VAULX/tests/loan.spec.ts`

**Step 1 — red tests:**

```ts
describe("loan / create_ccb_trdc", () => {
  it("test_ltv_enforced_at_mint — 61% LTV is rejected with LtvTooHigh", async () => {
    // appraisal=100, loan=61 → reverts with errorCode.code === "LtvTooHigh"
  });

  it("test_create_ccb_trdc_happy_path — 59% accepted, TRDCState in PendingCustody", async () => {
    // appraisal=100, loan=59 → succeeds
    // fetch TRDCState PDA from trdc program → status === {pendingCustody: {}}
    // fetch asset_id is non-zero (mint_trdc_cnft fired)
  });
});
```

Run: red (method not found).

**Step 2 — `programs/loan/src/errors.rs`:**

```rust
use anchor_lang::prelude::*;

pub const MAX_LTV_BPS: u64 = 6_000; // 60% — mirrors packages/terms/src/ltv.ts

#[error_code]
pub enum LoanError {
    #[msg("Loan amount exceeds maximum LTV (60%)")] LtvTooHigh,
    #[msg("Zero amount")] ZeroAmount,
    #[msg("Math overflow")] MathOverflow,
}
```

**Step 3 — `programs/loan/src/lib.rs`:**

```rust
use anchor_lang::prelude::*;
use trdc::cpi::accounts::{InitializeTrdcState, MintTrdcCnft};
use trdc::program::Trdc;
use trdc::TRDCState;

pub mod errors;
use errors::{LoanError, MAX_LTV_BPS};

declare_id!("BHdxEKkfsyjERiz5XiUybDLquvoWRtF7r1zDgVCDZJow");

#[program]
pub mod loan {
    use super::*;

    pub fn create_ccb_trdc(
        ctx: Context<CreateCcbTrdc>,
        loan_id: Pubkey,
        appraisal_value: u64,
        loan_amount: u64,
        due_ts: i64,
        asset_hint: [u8; 32],
    ) -> Result<()> {
        require!(loan_amount > 0 && appraisal_value > 0, LoanError::ZeroAmount);

        // LTV check: loan * 10_000 <= appraisal * MAX_LTV_BPS
        let lhs = (loan_amount as u128)
            .checked_mul(10_000u128).ok_or(LoanError::MathOverflow)?;
        let rhs = (appraisal_value as u128)
            .checked_mul(MAX_LTV_BPS as u128).ok_or(LoanError::MathOverflow)?;
        require!(lhs <= rhs, LoanError::LtvTooHigh);

        // CPI 1: initialize TRDCState
        trdc::cpi::initialize_trdc_state(
            CpiContext::new(ctx.accounts.trdc_program.to_account_info(), InitializeTrdcState {
                trdc_state: ctx.accounts.trdc_state.to_account_info(),
                payer: ctx.accounts.payer.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
            }),
            loan_id, appraisal_value, loan_amount, due_ts,
        )?;

        // CPI 2: stub mint the cNFT
        trdc::cpi::mint_trdc_cnft(
            CpiContext::new(ctx.accounts.trdc_program.to_account_info(), MintTrdcCnft {
                trdc_state: ctx.accounts.trdc_state.to_account_info(),
                authority: ctx.accounts.payer.to_account_info(),
            }),
            asset_hint,
        )?;
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(loan_id: Pubkey)]
pub struct CreateCcbTrdc<'info> {
    /// CHECK: created via CPI; trdc program asserts seeds/owner
    #[account(mut)] pub trdc_state: UncheckedAccount<'info>,
    pub trdc_program: Program<'info, Trdc>,
    #[account(mut)] pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}
```

Run: green on both.

**Commit:**
```
git add programs/loan tests/loan.spec.ts
git commit -m "feat(loan): create_ccb_trdc with LTV gate + CPI into trdc"
```

**Notes:** `MAX_LTV_BPS` is duplicated across `packages/terms/src/ltv.ts` and `programs/loan/src/errors.rs`. Phase 2 will add a CI check that diffs them. Phase 1 accepts manual sync — the constant is unlikely to move.

---

## Task 1.9 — Event emission + IDL copy to `packages/idls`

**Goal:** Add `emit!` events on every state-changing instruction (vault: `VaultInitialized`, `Deposited`, `Withdrawn`; loan: `CcbTrdcCreated`; trdc: `TrdcStateInitialized`, `TrdcTransitioned`). After `anchor build`, copy the 4 IDL JSONs to `packages/idls/src/*.json` and re-export from `packages/idls/src/index.ts`.

**Files:**
- Modify: all three `programs/*/src/lib.rs` (add `#[event]` structs + `emit!` calls)
- Create: `/Users/gogy/MyCODE/VAULX/packages/idls/src/trdc.json` (copied from `target/idl/trdc.json`)
- Create: `/Users/gogy/MyCODE/VAULX/packages/idls/src/vault.json`
- Create: `/Users/gogy/MyCODE/VAULX/packages/idls/src/loan.json`
- Create: `/Users/gogy/MyCODE/VAULX/packages/idls/src/auction.json`
- Create: `/Users/gogy/MyCODE/VAULX/packages/idls/src/index.ts`
- Create: `/Users/gogy/MyCODE/VAULX/scripts/dev/copy-idls.sh`

**Step 1 — define events (example in vault):**

```rust
#[event]
pub struct Deposited {
    pub vault: Pubkey,
    pub depositor: Pubkey,
    pub amount: u64,
    pub shares_minted: u64,
    pub total_assets: u64,
    pub total_shares: u64,
    pub ts: i64,
}
// at end of deposit():
emit!(Deposited {
    vault: ctx.accounts.vault.key(),
    depositor: ctx.accounts.depositor.key(),
    amount, shares_minted: shares_to_mint,
    total_assets: ctx.accounts.vault.total_assets,
    total_shares: ctx.accounts.vault.total_shares,
    ts: Clock::get()?.unix_timestamp,
});
```

Mirror for `Withdrawn`, `VaultInitialized`, `CcbTrdcCreated`, `TrdcStateInitialized`, `TrdcTransitioned`.

**Step 2 — IDL copy script** (`scripts/dev/copy-idls.sh`):

```bash
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
for p in trdc vault loan auction; do
  cp "target/idl/${p}.json" "packages/idls/src/${p}.json"
done
echo "copied 4 IDLs → packages/idls/src/"
```

`chmod +x scripts/dev/copy-idls.sh`.

**Step 3 — `packages/idls/src/index.ts`:**

```ts
import trdcIdl from "./trdc.json";
import vaultIdl from "./vault.json";
import loanIdl from "./loan.json";
import auctionIdl from "./auction.json";
export { trdcIdl, vaultIdl, loanIdl, auctionIdl };
```

**Step 4 — run:** `COPYFILE_DISABLE=1 anchor build && ./scripts/dev/copy-idls.sh && pnpm -w run typecheck`. Expected: clean.

Also add a test that confirms events fire (uses `program.addEventListener("Deposited", ...)`).

**Commit:**
```
git add programs packages/idls scripts/dev/copy-idls.sh tests
git commit -m "feat(programs): emit events + copy IDLs into packages/idls"
```

---

## Task 1.10 — Generate `@vaulx/anchor-client` via `anchor-client-gen`

**Goal:** After IDLs are committed, run `anchor-client-gen` to emit typed TS clients + re-export a small FE-friendly façade.

**Files:**
- Modify: `/Users/gogy/MyCODE/VAULX/packages/anchor-client/package.json` (add dep + script)
- Create: `/Users/gogy/MyCODE/VAULX/packages/anchor-client/src/generated/` (output)
- Modify: `/Users/gogy/MyCODE/VAULX/packages/anchor-client/src/index.ts`
- Modify: `/Users/gogy/MyCODE/VAULX/turbo.json` (ensure `build:client` is wired)

**Step 1 — add dep + script:**

```jsonc
// packages/anchor-client/package.json
{
  "name": "@vaulx/anchor-client",
  "scripts": {
    "build:client": "rm -rf src/generated && for p in trdc vault loan auction; do anchor-client-gen ../idls/src/$p.json src/generated/$p --program-id $(jq -r .address ../idls/src/$p.json); done"
  },
  "devDependencies": {
    "anchor-client-gen": "^0.28.1",
    "jq-node-bin": "^1.0.0"
  }
}
```

Simpler alternative: commit a small Node script `scripts/dev/gen-clients.mjs` that reads `Anchor.toml` for program IDs and shells out. Implementer's call — the critical contract is the output path `packages/anchor-client/src/generated/{trdc,vault,loan,auction}/` each with `instructions/`, `accounts/`, `errors/`, `types/`, `index.ts`.

**Step 2 — wrapper `packages/anchor-client/src/index.ts`:**

```ts
// Phase 1: re-export the generated clients + a small factory for wallet-adapter callers.
export * as trdc from "./generated/trdc";
export * as vault from "./generated/vault";
export * as loan from "./generated/loan";
export * as auction from "./generated/auction";

export { trdcIdl, vaultIdl, loanIdl, auctionIdl } from "@vaulx/idls";
```

**Step 3 — run:** `pnpm --filter @vaulx/anchor-client run build:client && pnpm -w run typecheck`.

**Commit:**
```
git add packages/anchor-client
git commit -m "chore(anchor-client): generate typed clients from IDLs"
```

**Notes:** `anchor-client-gen` fails if the IDL's `metadata.address` doesn't match the `declare_id!` — Anchor 0.30.1 writes it automatically, so this should just work. If it doesn't, pass `--program-id` explicitly from `Anchor.toml`.

---

## Task 1.11 — USDC mint on Devnet + demo-wallet seed script

**Goal:** Idempotent script that creates a Devnet "USDC-like" SPL mint if one isn't already at `scripts/dev/devnet-usdc.json`, generates 6 demo wallets, airdrops 2 SOL + mints 50k USDC to each, and writes pubkeys to `scripts/dev/demo-wallets.json`.

**Files:**
- Create: `/Users/gogy/MyCODE/VAULX/scripts/dev/seed-usdc.ts`
- Create: `/Users/gogy/MyCODE/VAULX/scripts/dev/.gitignore` (ignore `demo-wallets.json` + `devnet-usdc.json`)
- Modify: `/Users/gogy/MyCODE/VAULX/package.json` — add `"seed:usdc": "pnpm exec tsx scripts/dev/seed-usdc.ts"`

**Step 1 — write `scripts/dev/seed-usdc.ts`:**

```ts
// Creates (idempotently) a Devnet SPL mint + 6 funded demo wallets.
// Re-run is safe: reads existing json files first, only airdrops/mints the delta.
import fs from "node:fs";
import path from "node:path";
import { Connection, Keypair, LAMPORTS_PER_SOL, clusterApiUrl, PublicKey } from "@solana/web3.js";
import { createMint, mintTo, getOrCreateAssociatedTokenAccount } from "@solana/spl-token";

const DIR = path.resolve(__dirname);
const MINT_FILE = path.join(DIR, "devnet-usdc.json");
const WALLETS_FILE = path.join(DIR, "demo-wallets.json");
const TARGET_SOL = 2 * LAMPORTS_PER_SOL;
const TARGET_USDC = 50_000 * 1_000_000; // 6dp
const N_WALLETS = 6;

async function main() {
  const conn = new Connection(clusterApiUrl("devnet"), "confirmed");
  // 1. load or create funding wallet (~/.config/solana/id.json)
  const payer = Keypair.fromSecretKey(new Uint8Array(JSON.parse(
    fs.readFileSync(`${process.env.HOME}/.config/solana/id.json`, "utf8"),
  )));
  // ensure payer has ≥ 10 SOL (airdrop if not)
  // 2. load or create USDC-like mint
  let mintPk: PublicKey;
  if (fs.existsSync(MINT_FILE)) {
    mintPk = new PublicKey(JSON.parse(fs.readFileSync(MINT_FILE, "utf8")).mint);
  } else {
    mintPk = await createMint(conn, payer, payer.publicKey, null, 6);
    fs.writeFileSync(MINT_FILE, JSON.stringify({ mint: mintPk.toBase58() }, null, 2));
  }
  // 3. load or create 6 demo wallets
  const wallets: { name: string; secretKey: number[]; pubkey: string }[] =
    fs.existsSync(WALLETS_FILE) ? JSON.parse(fs.readFileSync(WALLETS_FILE, "utf8")) : [];
  while (wallets.length < N_WALLETS) {
    const kp = Keypair.generate();
    wallets.push({ name: `demo-${wallets.length}`, secretKey: Array.from(kp.secretKey), pubkey: kp.publicKey.toBase58() });
  }
  fs.writeFileSync(WALLETS_FILE, JSON.stringify(wallets, null, 2));
  // 4. top up each wallet to target SOL + USDC
  for (const w of wallets) {
    const pk = new PublicKey(w.pubkey);
    const bal = await conn.getBalance(pk);
    if (bal < TARGET_SOL) await conn.requestAirdrop(pk, TARGET_SOL - bal);
    const ata = await getOrCreateAssociatedTokenAccount(conn, payer, mintPk, pk);
    if (Number(ata.amount) < TARGET_USDC) {
      await mintTo(conn, payer, mintPk, ata.address, payer, TARGET_USDC - Number(ata.amount));
    }
  }
  console.log(`Seeded ${wallets.length} wallets with ${TARGET_USDC / 1e6} USDC + ${TARGET_SOL / LAMPORTS_PER_SOL} SOL each. Mint: ${mintPk.toBase58()}`);
}
main().catch(e => { console.error(e); process.exit(1); });
```

**Step 2 — add `scripts/dev/.gitignore`:**
```
demo-wallets.json
devnet-usdc.json
```

**Step 3 — run:** `pnpm exec tsx scripts/dev/seed-usdc.ts`. Expected output: `Seeded 6 wallets with 50000 USDC + 2 SOL each. Mint: <address>`.

**Commit:**
```
git add scripts/dev/seed-usdc.ts scripts/dev/.gitignore package.json
git commit -m "chore(dev): idempotent Devnet USDC mint + 6-wallet seed script"
```

**Notes:** Devnet airdrop rate-limits are aggressive. If airdrop fails, print a prompt: "Pre-fund the payer at https://faucet.solana.com and re-run." Don't block on automation. Add `tsx` to root `devDependencies` if not present.

---

## Task 1.12 — `/lend`, `/lend/vaults`, `/lend/vaults/[id]` frontend + I4 mock modal

**Goal:** Three pages wired to real on-chain calls. `/lend` is a brand splash with a "Browse vaults" CTA. `/lend/vaults` lists the single Phase 1 vault (USDC). `/lend/vaults/[id]` shows total assets, user's share balance, user's USDC balance, APR placeholder "— %", a deposit form (RHF + Zod), and a "Civic / Blockpass KYC" modal that gates first-time deposits. On successful deposit, optimistically invalidate the TanStack cache.

**Files:**
- Create: `/Users/gogy/MyCODE/VAULX/apps/web/src/app/lend/page.tsx`
- Create: `/Users/gogy/MyCODE/VAULX/apps/web/src/app/lend/vaults/page.tsx`
- Create: `/Users/gogy/MyCODE/VAULX/apps/web/src/app/lend/vaults/[id]/page.tsx`
- Create: `/Users/gogy/MyCODE/VAULX/apps/web/src/components/vaulx/kyc-mock-modal.tsx`
- Create: `/Users/gogy/MyCODE/VAULX/apps/web/src/components/vaulx/deposit-form.tsx`
- Create: `/Users/gogy/MyCODE/VAULX/apps/web/src/lib/chain/vault.ts` (thin wrapper around `@vaulx/anchor-client`)
- Create: `/Users/gogy/MyCODE/VAULX/apps/web/src/lib/query-provider.tsx`
- Modify: `/Users/gogy/MyCODE/VAULX/apps/web/src/app/layout.tsx` (wrap in `QueryProvider`)
- Modify: `/Users/gogy/MyCODE/VAULX/apps/web/package.json` — add `@tanstack/react-query`, `react-hook-form`, `zod`, `@hookform/resolvers`

**Step 1 — deps:**
```
cd apps/web && pnpm add @tanstack/react-query react-hook-form zod @hookform/resolvers
```

**Step 2 — `lib/chain/vault.ts`** exposes `useVault(assetMint: PublicKey)`, `useVaultDeposit()`, `useUserShareBalance()` React-Query + wallet-adapter hooks.

Minimal sketch:
```ts
"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { vault as vaultClient, vaultIdl } from "@vaulx/anchor-client";
import { PublicKey } from "@solana/web3.js";
// ... build ixs via the generated instruction builders; sign with the wallet adapter
```

**Step 3 — KYC mock** (`kyc-mock-modal.tsx`): uses shadcn `Dialog` (add via `pnpm dlx shadcn@latest add dialog`); shows Civic + Blockpass logos, 3-second fake "verifying" animation (`setTimeout` + spinner), then a green check and "Proceed". Stores `{wallet: pubkey, passedAt: ts}` in `localStorage` keyed by pubkey — re-show only if not present.

**Step 4 — deposit form:**
```ts
const schema = z.object({ amount: z.coerce.number().positive().min(1, "≥ 1 USDC") });
```
RHF + zodResolver; on submit, fire the deposit mutation → toast success → invalidate `['vault', assetMint]`.

**Step 5 — quick smoke test in browser:** `pnpm --filter @vaulx/web dev`, connect Phantom (Devnet), import a demo-wallet secret key into Phantom, deposit 100 USDC. Expected: tx signature toast, share balance shows 100, total_assets on the page shows 100.

**Commit:**
```
git add apps/web/src apps/web/package.json
git commit -m "feat(web): /lend flow + deposit form + Civic/Blockpass mock (I4)"
```

**Notes:**
- The `[id]` in `/lend/vaults/[id]` is the **asset mint pubkey** (base58), not an opaque numeric id — the vault PDA derives from it.
- Keep the APR placeholder literal `—` — Phase 3 computes real yield.
- Don't use `@solana/wallet-adapter-react-ui` default `WalletMultiButton` CSS (clashes with brand palette). Use the existing `WalletConnectButton` at `apps/web/src/components/wallet-connect-button.tsx`.

---

## Task 1.13 — Indexer worker + `onchain_events` table

**Goal:** New app `apps/indexer` (`@vaulx/indexer`) that subscribes to Vault program logs via `connection.onLogs(programId)`, parses each log line with the Vault IDL's event coder, and upserts into Supabase. Migration at `supabase/migrations/20260425000000_onchain_events.sql`.

**Files:**
- Create: `/Users/gogy/MyCODE/VAULX/apps/indexer/package.json`
- Create: `/Users/gogy/MyCODE/VAULX/apps/indexer/src/main.ts`
- Create: `/Users/gogy/MyCODE/VAULX/apps/indexer/src/supabase.ts`
- Create: `/Users/gogy/MyCODE/VAULX/apps/indexer/tsconfig.json`
- Create: `/Users/gogy/MyCODE/VAULX/supabase/migrations/20260425000000_onchain_events.sql`

**Step 1 — migration:**
```sql
-- supabase/migrations/20260425000000_onchain_events.sql
create table if not exists public.onchain_events (
  id uuid primary key default gen_random_uuid(),
  program_id text not null,
  event_name text not null,
  payload jsonb not null,
  slot bigint not null,
  signature text not null unique,
  created_at timestamptz not null default now()
);
create index if not exists onchain_events_event_name_idx on public.onchain_events (event_name);
create index if not exists onchain_events_created_at_idx on public.onchain_events (created_at desc);
```

Apply via Supabase MCP `apply_migration` or `supabase db push`.

**Step 2 — `apps/indexer/package.json`:**
```json
{
  "name": "@vaulx/indexer",
  "private": true,
  "scripts": { "dev": "tsx watch src/main.ts", "start": "tsx src/main.ts" },
  "dependencies": {
    "@coral-xyz/anchor": "0.30.1",
    "@solana/web3.js": "^1.95.3",
    "@supabase/supabase-js": "^2.45.0",
    "@vaulx/idls": "workspace:*",
    "tsx": "^4.19.1"
  }
}
```

**Step 3 — `src/main.ts` sketch:**

```ts
import { Connection, PublicKey } from "@solana/web3.js";
import { BorshCoder, EventParser, Idl } from "@coral-xyz/anchor";
import { vaultIdl } from "@vaulx/idls";
import { createClient } from "@supabase/supabase-js";

const RPC = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
const SUPA = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const VAULT_PROGRAM = new PublicKey((vaultIdl as any).address);

async function main() {
  const conn = new Connection(RPC, "confirmed");
  const parser = new EventParser(VAULT_PROGRAM, new BorshCoder(vaultIdl as Idl));
  conn.onLogs(VAULT_PROGRAM, async ({ signature, logs, err }, ctx) => {
    if (err) return;
    for (const ev of parser.parseLogs(logs)) {
      const { error } = await SUPA.from("onchain_events").insert({
        program_id: VAULT_PROGRAM.toBase58(),
        event_name: ev.name,
        payload: JSON.parse(JSON.stringify(ev.data, (_k, v) =>
          typeof v === "bigint" ? v.toString() : v?.toBase58?.() ?? v)),
        slot: ctx.slot, signature,
      });
      if (error && error.code !== "23505") console.error(error); // ignore unique dup
    }
  });
  console.log(`indexer: subscribed to vault ${VAULT_PROGRAM.toBase58()} on ${RPC}`);
}
main().catch(e => { console.error(e); process.exit(1); });
```

**Step 4 — run locally:** Paste `SUPABASE_SERVICE_ROLE_KEY` into `apps/indexer/.env.local`, then `pnpm --filter @vaulx/indexer run dev`. In another terminal, run the FE and make a real deposit. Expected: `indexer` logs `Deposited` event; Supabase SQL editor `select * from onchain_events` shows the row with parsed `payload`.

**Commit:**
```
git add apps/indexer supabase/migrations/20260425000000_onchain_events.sql
git commit -m "feat(indexer): subscribe to vault logs + upsert onchain_events to Supabase"
```

**Notes:**
- Use the **service_role** key server-side only. Never in `apps/web`.
- `ctx.slot` on `onLogs` gives slot; use `signature` as the idempotency key (unique constraint dedupes reconnects).
- Phase 2 will add a reconnect-with-backfill loop via `getSignaturesForAddress` — Phase 1's single `onLogs` is fine for a demo.

---

## Task 1.14 — Moment 1 E2E happy-path test (`test_happy_path_end_to_end` stub)

**Goal:** A scripted integration test that exercises the full path: `anchor deploy` to Devnet (or `solana-test-validator`) → init vault → FE-equivalent deposit (via `@vaulx/anchor-client` called directly from the test runner) → poll Supabase `onchain_events` → assert a `Deposited` row appears within 30s.

**Decision:** keep it as an Anchor-harness scripted test in Node, not Playwright. Playwright would require wallet-mocking infrastructure (~0.5d) that the scope explicitly allows us to skip ("stub — expanded in Phase 2"). Phase 2 upgrades this to a real Playwright + wallet-adapter-mock flow.

**Files:**
- Create: `/Users/gogy/MyCODE/VAULX/scripts/dev/moment-1-e2e.ts`
- Create: `/Users/gogy/MyCODE/VAULX/tests/moment-1-e2e.spec.ts` (thin wrapper that shells out)

**Step 1 — `scripts/dev/moment-1-e2e.ts`:**
- load demo wallet 0 + demo wallet 1 from `scripts/dev/demo-wallets.json`
- load USDC mint from `scripts/dev/devnet-usdc.json`
- derive vault PDA for that asset mint; if vault account doesn't exist, call `initializeVault`
- ensure indexer is running (print a `curl localhost:...` health check, or just assume user started it)
- call `deposit(100_000_000)` (100 USDC, 6dp) from wallet 0
- poll Supabase `onchain_events` with `.eq("signature", <tx sig>)` up to 30s, 1s interval
- assert: row exists, `event_name === "Deposited"`, `payload.amount === "100000000"`, `payload.shares_minted === "100000000"`
- exit 0 on success, non-zero on failure

**Step 2 — mocha wrapper** at `tests/moment-1-e2e.spec.ts` simply `execSync("pnpm exec tsx scripts/dev/moment-1-e2e.ts", {stdio:"inherit"})`. This lets the test run under `anchor test` + in CI with a single `pnpm -w run test` entrypoint.

**Step 3 — verification:**
```
COPYFILE_DISABLE=1 anchor test   # must include the e2e spec
```
Expected output: `Moment 1 E2E: Deposited row observed in Supabase at slot <N>, signature <sig>. PASS`

**Commit:**
```
git add scripts/dev/moment-1-e2e.ts tests/moment-1-e2e.spec.ts
git commit -m "test(e2e): Moment 1 happy-path stub (indexer + deposit round-trip)"
```

**Notes:**
- This test needs the indexer running **in the same test run**. Simplest: have the test script `spawn` the indexer as a child process, wait for its ready log line, then proceed; kill on teardown.
- Running against Devnet is flaky — run against `solana-test-validator` in CI (already the default via `Anchor.toml` `cluster = "localnet"`).

---

## Phase 1 exit checklist

Implementer runs through this before handing back to controller. Every item must be green.

- [ ] `COPYFILE_DISABLE=1 anchor build` succeeds; 4 IDLs emitted.
- [ ] `./scripts/dev/copy-idls.sh` runs cleanly; `packages/idls/src/{trdc,vault,loan,auction}.json` present and committed.
- [ ] `pnpm --filter @vaulx/anchor-client run build:client` emits `packages/anchor-client/src/generated/{trdc,vault,loan,auction}/` without errors.
- [ ] `pnpm -w run typecheck` clean across all workspaces.
- [ ] `pnpm -w run test` green (includes `@vaulx/terms` tests + Anchor tests run indirectly via the moment-1 spec).
- [ ] `COPYFILE_DISABLE=1 anchor test` green with these named tests present and passing: `test_vault_share_accounting`, `test_ltv_enforced_at_mint`, `test_create_ccb_trdc_happy_path`, `test_happy_path_end_to_end`, `test_first_deposit_is_one_to_one`, `test_second_deposit_rounds_down`.
- [ ] `test_ltv_enforced_at_mint` asserts the 61% case reverts with `errorCode.code === "LtvTooHigh"` — verified by reading test output.
- [ ] `disburse` instruction is present in `packages/idls/src/vault.json`, returns `DisburseNotYetImplemented` on invocation (confirmed by test).
- [ ] TRDC state machine: every legal transition in the Task 1.2 table passes; every illegal one returns `InvalidStateTransition`.
- [ ] Live Devnet check: `/lend/vaults/[id]` deposit of 100 USDC from a demo wallet (a) produces a transaction on Devnet, (b) increments the user's share balance displayed on the page, (c) writes exactly one new row to `onchain_events` with `event_name='Deposited'`.
- [ ] GitHub Actions CI run on the commit that closes Phase 1 is green (both `ts` and `anchor` jobs).
- [ ] `scripts/dev/seed-usdc.ts` is idempotent (re-running produces 0 airdrops / 0 mints, prints unchanged totals).

---

## Known deferrals (by design, to be unblocked in Phase 2+)

| Deferral | Rationale | Lands in |
|---|---|---|
| Real Bubblegum cNFT mint | Heavy Devnet setup (Merkle tree + collection), blocks no Phase 1 exit criterion. Stubbed deterministically so the state machine + CPI shape are already correct. | Phase 2 (Task 2.x — replace `mint_trdc_cnft` body) |
| `disburse` body | Requires the CPI caller-authority check spec (Vaulx Canonical §4.2) which itself depends on the `confirm_custody` flow — both land together. | Phase 2 (custody-gate task pair) |
| `confirm_custody`, `mark_overdue`, `execute_af_default`, `repay_ccb`, `renew_ccb` | Not needed for Moment 1; each is a Phase 2–3 task. | Phase 2 (repay + confirm_custody), Phase 3 (default + renewal) |
| Civic Pass on-chain account constraint | Phase 1 scope explicitly mocks this at the FE layer (I4). On-chain gate re-introduced alongside vault pause + multisig whitelist. | Phase 3 |
| Indexer reconnect-with-backfill | Single `onLogs` is adequate for demo reliability; backfill matters only under sustained load / intentional disconnect. | Phase 2 |
| Playwright E2E | Scope allows scripted Anchor harness as stub; FE-under-browser testing arrives when the Moment 2 borrower wizard is in place. | Phase 2 |
| `packages/terms` ↔ Rust constants CI check | `MAX_LTV_BPS=6000` is unlikely to move in Phase 1; manual sync is fine for a week. | Phase 2 (CI hardening task) |
| Auction program work | Moment 9 is Phase 5; `auction` program stays at its Phase 0 ping skeleton through Phase 1–4. | Phase 5 |

---

## Daily cadence

| Day | Date | Tasks | End-of-day artifact |
|---|---|---|---|
| Day 4 | 2026-04-25 | 1.1, 1.2, 1.3 | `programs/trdc` complete with state machine + stub mint; `tests/trdc.spec.ts` green |
| Day 5 | 2026-04-26 | 1.4, 1.5, 1.6, 1.7 | `programs/vault` complete with deposit/withdraw/stubbed-disburse; `test_vault_share_accounting` green |
| Day 6 | 2026-04-27 | 1.8, 1.9, 1.10 | `programs/loan` complete; 4 IDLs copied into `packages/idls`; `@vaulx/anchor-client` generated and typechecking |
| Day 7 | 2026-04-28 | 1.11, 1.12, 1.13, 1.14 | Demo wallets seeded; `/lend/vaults/[id]` deposit works live on Devnet; indexer writes `Deposited` rows; Moment 1 E2E passes |

Buffer: if a day slips, absorb from the Day 7 FE polish (keep deposit flow bare-minimum — no custom skeleton loaders, no empty states beyond the literal one we need). If Day 6 slips, defer `auction.json` copy to Phase 2 (it's a ping-only IDL — safe to leave out of Phase 1's `packages/idls`).
