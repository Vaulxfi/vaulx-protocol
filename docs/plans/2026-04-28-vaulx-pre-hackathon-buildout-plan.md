# Vaulx Pre-Hackathon Buildout (Items 1–7) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` to implement this plan task-by-task.

**Goal:** Ship 7 production-grade upgrades to the Vaulx protocol before the May 10 hackathon submission — Civic Pass→Civic Auth migration, Squads multisig, Apify Chrono24 swap, Bubblegum cNFT TRDC, RedStone oracle wrap, The Graph subgraph, and Kamino USDC float yield routing — without requiring any new commercial partnerships.

**Architecture:** Each item is independently scoped with explicit dependency markers. Items 1, 2, 3 can run pre-Devnet-deploy (FE/SDK only or off-chain ops). Items 4, 5, 6, 7 require Devnet program deploy first (gated on user-authorized code review). Compatible with the existing 4-program Anchor split (`trdc`, `vault`, `loan`, `auction`) and the current Crossmint-as-primary wallet model.

**Tech Stack:** Anchor 0.30.1 · Rust 1.85 · Solana CLI 1.18.26 · Next.js 14.2.15 · `@civic/auth-web3` · `@sqds/multisig` · `apify-client` · `@metaplex-foundation/mpl-bubblegum` · `@redstone-finance/sdk` · The Graph CLI · `@kamino-finance/klend-sdk`.

**Source-of-truth design:** [`docs/plans/2026-04-27-vaulx-mock-app-demo-design.md`](2026-04-27-vaulx-mock-app-demo-design.md). Tracks against [`PARTNERSHIPS.md`](../../PARTNERSHIPS.md) and [`USER_TODO.md`](../../USER_TODO.md).

**Skills referenced:**
- `superpowers:test-driven-development` — for component + Anchor tests
- `superpowers:verification-before-completion` — before declaring any task complete
- `superpowers:requesting-code-review` — at end of each item

**Timeline (May 10 deadline; 13 working days from Apr 28):**

| Item | Days | Track | Dependency |
|---|---|---|---|
| 1 — Civic Pass → Civic Auth | 3 | A (independent) | — |
| 2 — Squads V4 2/3 multisig | 1 | A (ops) | — |
| 3 — Apify Chrono24 swap | 1 | A (independent) | Apify env key |
| 4 — Bubblegum cNFT TRDC | 4 | B (Anchor) | Devnet deploy |
| 5 — RedStone oracle wrap | 3 | B (Anchor) | Devnet deploy |
| 6 — The Graph subgraph | 2 | B (post-deploy) | Devnet deploy |
| 7 — Kamino USDC float yield | 2 | B (post-deploy) | Devnet deploy + lender vault live |

Track A = 5 days; Track B = 11 days. Run Track A first while user reviews+authorizes Devnet deploy. Track B starts the hour deploy lands.

---

## Item 1 — Civic Pass → Civic Auth migration (3 days)

**Why first:** the current `programs/{vault,loan}/src/civic.rs` Borsh parser reads a Civic Pass gateway-token format that **no longer exists** (sunset mid-2025). Active integration of dead infrastructure is a correctness defect.

**Architectural shift:**
- **Old (Civic Pass):** on-chain gateway-token PDA owned by `gatem74...` Solana program; Anchor reads token + checks state byte
- **New (Civic Auth):** OAuth/OIDC provider; identity lives in JWTs; pairs with Crossmint via custom-JWT BYOA mode; on-chain attestation pattern requires a Vaulx-issued PDA

**Migration scope:**
- **FE:** Replace `<CivicPassGate>` with `<CivicAuthGate>` (`@civic/auth-web3` SDK). On login, JWT passes to Crossmint as the auth source.
- **On-chain:** Mark the existing `civic.rs` parser DEAD (delete or `#[cfg(feature = "civic-pass-legacy")]`). Add new `KycAttestation` PDA, owned by Vaulx admin, containing `{owner: Pubkey, attestedAt: i64, jwtHash: [u8;32]}`. Anchor checks for `KycAttestation` PDA before custody-touching ix. Feature-flagged off in demo (the existing `civic_network = Pubkey::default()` pattern carries over).
- **Tests:** rewrite the 4 civic-gate smoke tests + civic-happy-path runtime test against the new attestation model.
- **Docs:** PARTNERSHIPS.md row updates Civic Pass → Civic Auth. Design doc §2 + §2.1 reflect the new flow. USER_TODO.md notes the Civic Auth tier (medium / hackathon / developer integration).

### Task 1.1 — Install `@civic/auth-web3` + remove `@civic/solana-gateway-react`

**Files:**
- Modify: `apps/web/package.json`
- Modify: `apps/web/.env.example`
- Modify: `pnpm-lock.yaml`

**Step 1:** Verify Civic Auth SDK exists + correct package name:
```bash
npm view @civic/auth-web3 versions --json 2>&1 | tail -3
```
Expected: a recent version (1.x or higher).

**Step 2:** Remove old + install new:
```bash
pnpm --filter @vaulx/web remove @civic/solana-gateway-react @identity.com/solana-gateway-ts
pnpm --filter @vaulx/web add @civic/auth-web3
```

**Step 3:** Update `apps/web/.env.example` — replace the `NEXT_PUBLIC_CIVIC_PASS_NETWORK=...` block with:
```
# Civic Auth (OAuth / OIDC). Get client id from auth.civic.com/dashboard.
# Free tier; SOC 2 Type 1 certified.
# NEXT_PUBLIC_CIVIC_AUTH_CLIENT_ID=
```

**Step 4:** Verify build still green:
```bash
pnpm --filter @vaulx/web build 2>&1 | tail -3
```
Expected: green. Some Civic Pass imports will now fail TypeScript — that's tasks 1.2-1.4's job.

**Step 5:** Commit:
```bash
git add apps/web/package.json apps/web/.env.example pnpm-lock.yaml
git commit -m "chore(civic): swap @civic/solana-gateway-react for @civic/auth-web3"
```

### Task 1.2 — Mark on-chain Civic Pass parser as deprecated

**Files:**
- Modify: `programs/vault/src/civic.rs` (full file)
- Modify: `programs/loan/src/civic.rs` (full file)
- Modify: `programs/vault/src/lib.rs` (gate-callsite)
- Modify: `programs/loan/src/lib.rs` (gate-callsite)

**Step 1:** Add a top-of-file deprecation banner to both `civic.rs`:

```rust
// DEPRECATED — Civic Pass was sunset mid-2025. The gateway-token format this
// file parses is no longer issued by Civic. Retained as historical reference;
// not called by any live instruction. The replacement is a Vaulx-issued
// KycAttestation PDA (see programs/{vault,loan}/src/attestation.rs from Task 1.3).
//
// To temporarily restore the legacy gate for testing, gate this module behind
// the `civic-pass-legacy` feature in Cargo.toml.
#![allow(dead_code)]
```

**Step 2:** In `programs/vault/src/lib.rs` `deposit` handler, comment out (do NOT delete) the `civic::verify_gateway_token` call. Replace with a TODO that points at Task 1.4:

```rust
// TODO(civic-auth-attestation): replaced by KycAttestation PDA check (Task 1.4).
// Old call (Civic Pass, sunset):
// if ctx.accounts.vault_config.civic_network != Pubkey::default() {
//     civic::verify_gateway_token(&ctx.accounts.gateway_token, &ctx.accounts.depositor.key(), &ctx.accounts.vault_config.civic_network)?;
// }
```

**Step 3:** Same edit in `programs/loan/src/lib.rs` `create_ccb_trdc` handler.

**Step 4:** Verify build + existing tests still green:
```bash
PATH="/Users/gogy/.local/share/solana/install/active_release/bin:/Users/gogy/.cargo/bin:$PATH" COPYFILE_DISABLE=1 anchor build 2>&1 | tail -5
PATH="/Users/gogy/.local/share/solana/install/active_release/bin:/Users/gogy/.cargo/bin:$PATH" COPYFILE_DISABLE=1 anchor test --skip-build 2>&1 | tail -10
```
Expected: build green; tests still green (the gate was off by default — `civic_network = Pubkey::default()` — so commenting the call out has no behavioral effect on the tested paths).

**Step 5:** Commit:
```bash
git add programs/vault/src/civic.rs programs/loan/src/civic.rs programs/vault/src/lib.rs programs/loan/src/lib.rs
git commit -m "chore(civic): deprecate on-chain Civic Pass gate (sunset upstream)"
```

### Task 1.3 — Add `KycAttestation` PDA + admin issuance ix

**Files:**
- Create: `programs/vault/src/attestation.rs`
- Create: `programs/loan/src/attestation.rs`
- Modify: `programs/vault/src/lib.rs` (new `issue_kyc_attestation` ix + state)
- Modify: `programs/loan/src/lib.rs` (mirror)
- Test: `tests/kyc-attestation.spec.ts`

**Step 1:** Write the failing test at `tests/kyc-attestation.spec.ts`:

```ts
import * as anchor from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { expect } from "chai";

describe("kyc attestation", () => {
  it("test_admin_issues_attestation_owner_can_deposit", async () => {
    // Initialize vault_config with admin
    // Issue KycAttestation PDA for a user
    // Assert PDA exists with the right owner + jwtHash
    // Call vault.deposit; assert success
  });

  it("test_no_attestation_blocks_deposit", async () => {
    // Skip issuing the attestation
    // Call vault.deposit; assert revert with NoKycAttestation
  });

  it("test_only_admin_can_issue_attestation", async () => {
    // Non-admin signer tries to issue attestation; assert revert with UnauthorizedAttestor
  });
});
```

**Step 2:** Run test to verify FAIL:
```bash
PATH="/Users/gogy/.local/share/solana/install/active_release/bin:/Users/gogy/.cargo/bin:$PATH" COPYFILE_DISABLE=1 anchor test --skip-build 2>&1 | grep "kyc attestation" | head -10
```
Expected: 3 tests fail with "issue_kyc_attestation is not defined" or similar.

**Step 3:** Create `programs/vault/src/attestation.rs`:

```rust
use anchor_lang::prelude::*;

#[account]
pub struct KycAttestation {
    pub owner: Pubkey,
    pub attestor: Pubkey,           // admin who attested
    pub attested_at: i64,
    pub jwt_hash: [u8; 32],          // SHA-256 of the Civic Auth JWT (binds attestation to a specific verification)
    pub bump: u8,
}

impl KycAttestation {
    pub const SIZE: usize = 8 + 32 + 32 + 8 + 32 + 1;
    pub const SEED: &'static [u8] = b"kyc_attestation";

    pub fn pda(owner: &Pubkey, program_id: &Pubkey) -> (Pubkey, u8) {
        Pubkey::find_program_address(&[Self::SEED, owner.as_ref()], program_id)
    }
}
```

**Step 4:** Add the `issue_kyc_attestation` ix to `programs/vault/src/lib.rs`. Body validates `signer == vault_config.admin`, creates the PDA, writes the fields. Replace the commented-out civic gate in `deposit` with a real `KycAttestation` PDA check (require!() that `kyc_attestation.owner == depositor` AND `kyc_attestation.attestor == vault_config.admin`). Feature-flag the check via `vault_config.kyc_required: bool`.

**Step 5:** Mirror in `programs/loan/src/lib.rs` for `create_ccb_trdc`.

**Step 6:** Implement the test cases from Step 1 against the real ix.

**Step 7:** Run tests, verify pass:
```bash
PATH="/Users/gogy/.local/share/solana/install/active_release/bin:/Users/gogy/.cargo/bin:$PATH" COPYFILE_DISABLE=1 anchor test --skip-build 2>&1 | tail -10
```
Expected: 48 tests passing (45 + 3 new).

**Step 8:** Commit:
```bash
git add programs/vault programs/loan tests/kyc-attestation.spec.ts
git commit -m "feat(civic): KycAttestation PDA + admin issuance ix (replaces Civic Pass gate)"
```

### Task 1.4 — `<CivicAuthGate>` FE component

**Files:**
- Create: `apps/web/src/components/vaulx/civic-auth-gate.tsx`
- Modify: `apps/web/src/app/demo/borrow/onboard/page.tsx` (use new gate)
- Delete: `apps/web/src/components/vaulx/civic-pass-gate.tsx` (after refs cleared)
- Modify: `apps/web/src/app/providers.tsx` (replace `<GatewayProvider>` with `<CivicAuthProvider>`)

**Step 1:** Implement `<CivicAuthGate>`:

```tsx
"use client";
import { CivicAuthProvider, useUser } from "@civic/auth-web3/react";
import type { ReactNode } from "react";

const CIVIC_CLIENT_ID = process.env.NEXT_PUBLIC_CIVIC_AUTH_CLIENT_ID;

export function CivicAuthRoot({ children }: { children: ReactNode }) {
  if (!CIVIC_CLIENT_ID) {
    return <>{children}</>;
  }
  return <CivicAuthProvider clientId={CIVIC_CLIENT_ID}>{children}</CivicAuthProvider>;
}

export function CivicAuthGate({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  const { user, signIn } = useUser();
  if (!user) return fallback ?? <button onClick={() => signIn()}>Sign in with Civic</button>;
  return <>{children}</>;
}
```

**Step 2:** Update `apps/web/src/app/demo/borrow/onboard/page.tsx` — replace the Civic Pass button with the new `<CivicAuthGate>`. On successful login, the JWT is in `user.idToken`; SHA-256 hash it and store in `session.civic.gatewayToken` (rename to `session.civic.jwtHash` in a follow-up rename).

**Step 3:** Update `apps/web/src/app/providers.tsx` — replace the conditional `<GatewayProvider>` block with `<CivicAuthRoot>`.

**Step 4:** Delete `apps/web/src/components/vaulx/civic-pass-gate.tsx` (after grepping for any remaining imports — should be 0).

**Step 5:** Build + verify:
```bash
pnpm --filter @vaulx/web build 2>&1 | tail -5
grep -rE "@civic/solana-gateway-react|<CivicPassGate>" apps/web/src/ 2>/dev/null && echo "FAIL" || echo "PASS"
```

**Step 6:** Commit:
```bash
git add apps/web/src/
git commit -m "feat(civic): <CivicAuthGate> with @civic/auth-web3 (replaces <CivicPassGate>)"
```

### Task 1.5 — Docs sweep + PARTNERSHIPS.md update

**Files:**
- Modify: `docs/plans/2026-04-27-vaulx-mock-app-demo-design.md` (Civic Pass → Civic Auth in §2 + §2.1)
- Modify: `PARTNERSHIPS.md` (Civic row update)
- Modify: `USER_TODO.md` (Civic Auth client-id env)
- Modify: `README.md` (Civic Pass section → Civic Auth section)

**Step 1:** Sweep all instances of "Civic Pass" → "Civic Auth" in design doc, plan, PARTNERSHIPS, USER_TODO, README. Footnote each affected section: "Civic Pass was sunset mid-2025; current product is Civic Auth (OAuth/OIDC)."

**Step 2:** Add to PARTNERSHIPS.md P1: "**Civic Auth** — OAuth/OIDC + identity attestations. SOC 2 Type 1. Free tier for hackathon. Active sponsor; list as named partner in deck."

**Step 3:** Commit:
```bash
git add docs/ PARTNERSHIPS.md USER_TODO.md README.md
git commit -m "docs(civic): full sweep — Civic Pass → Civic Auth across all artifacts"
```

---

## Item 2 — Squads V4 2/3 multisig admin (1 day)

**Why:** institutional-grade security posture. Move program upgrade authority + treasury under Squads multisig instead of single keypair. One of the strongest credibility signals for a regulated-RWA product.

### Task 2.1 — Generate ops + team keypairs

**Files:**
- Create: `~/.config/vaulx/ops-keypair.json` (gitignored)
- Create: `~/.config/vaulx/team-keypair.json` (gitignored)
- Modify: `USER_TODO.md` (add note that user backs up these keypairs)

**Step 1:** Generate two fresh keypairs:
```bash
solana-keygen new --no-bip39-passphrase --outfile ~/.config/vaulx/ops-keypair.json
solana-keygen new --no-bip39-passphrase --outfile ~/.config/vaulx/team-keypair.json
```

**Step 2:** Print pubkeys + record in USER_TODO so user can back them up:
```bash
solana-keygen pubkey ~/.config/vaulx/ops-keypair.json
solana-keygen pubkey ~/.config/vaulx/team-keypair.json
```

**Step 3:** Document in USER_TODO that these keypairs need user backup before they're useful.

**Step 4:** Commit USER_TODO update only (keypair files are gitignored):
```bash
git add USER_TODO.md
git commit -m "docs(squads): note ops + team keypair generation"
```

### Task 2.2 — Squads multisig setup script

**Files:**
- Create: `scripts/dev/setup-squads-multisig.ts`
- Add to root `package.json` scripts: `"setup:squads": "tsx scripts/dev/setup-squads-multisig.ts"`

**Step 1:** Implement script using `@sqds/multisig` SDK. The script:
- Loads payer + ops + team keypairs
- Creates a Squads V4 multisig with the 3 keys, threshold 2
- Prints the multisig address
- Saves the multisig address to `scripts/dev/squads-multisig.json` (gitignored)

**Step 2:** Add doc comment explaining: this is a one-shot setup; do not re-run unless intentionally rotating.

**Step 3:** Run on devnet:
```bash
pnpm setup:squads
```
Expected: prints `Squads multisig: <address>` and writes the JSON.

**Step 4:** Commit:
```bash
git add scripts/dev/setup-squads-multisig.ts package.json
git commit -m "ops(squads): one-shot Squads V4 2/3 multisig setup"
```

### Task 2.3 — Transfer program upgrade authority + treasury to Squads

**Files:**
- Create: `scripts/dev/transfer-authorities-to-squads.ts`
- Modify: `Anchor.toml` (note that admin is now Squads multisig)

**Step 1:** Implement script that:
- For each of the 4 programs (`trdc`, `vault`, `loan`, `auction`), runs `solana program set-upgrade-authority <PROGRAM_ID> <SQUADS_PUBKEY>`
- For the treasury keypair, transfers all SOL to the Squads PDA

**Step 2:** Run AFTER Devnet program deploy has completed (Track B precondition). Document this in the script header.

**Step 3:** Commit:
```bash
git add scripts/dev/transfer-authorities-to-squads.ts Anchor.toml
git commit -m "ops(squads): transfer upgrade authority + treasury to Squads V4 multisig"
```

---

## Item 3 — Apify Chrono24 production scraping (1 day)

**Why:** user authorized env keys. Replace the fragile fallback-safe scraper at `apps/web/src/lib/appraisal/chrono24.ts` with the maintained Apify Chrono24 actor.

### Task 3.1 — Install `apify-client` + add env var

**Files:**
- Modify: `apps/web/package.json`
- Modify: `apps/web/.env.example`

**Step 1:** Install:
```bash
pnpm --filter @vaulx/web add apify-client
```

**Step 2:** Document env in `.env.example`:
```
# Apify Chrono24 actor — production-grade Chrono24 scrape.
# Get from console.apify.com → API tokens.
# When set, replaces the fallback HTML scraper at lib/appraisal/chrono24.ts.
# APIFY_API_TOKEN=
```

**Step 3:** Commit:
```bash
git add apps/web/package.json apps/web/.env.example pnpm-lock.yaml
git commit -m "chore(apify): add apify-client SDK + env documentation"
```

### Task 3.2 — Apify-backed Chrono24 fetcher with fallback

**Files:**
- Modify: `apps/web/src/lib/appraisal/chrono24.ts`
- Test: `apps/web/src/lib/appraisal/__tests__/chrono24-apify.test.ts`

**Step 1:** Write failing test that mocks `apify-client` + asserts Apify path returns valid data when token set, falls through to existing scraper otherwise.

**Step 2:** Run test, verify FAIL:
```bash
pnpm --filter @vaulx/web test -- chrono24-apify
```

**Step 3:** Implement:

```ts
import { ApifyClient } from "apify-client";

const APIFY_TOKEN = process.env.APIFY_API_TOKEN;
const CHRONO24_ACTOR_ID = "apify/chrono24-scraper"; // verify exact actor id from Apify Store

export async function chrono24PriceViaApify(input: AppraisalInput): Promise<SourceResult | null> {
  if (!APIFY_TOKEN) return null;
  try {
    const client = new ApifyClient({ token: APIFY_TOKEN });
    const run = await client.actor(CHRONO24_ACTOR_ID).call({
      searchQuery: `${input.make} ${input.ref}`,
      maxResults: 10,
    }, { timeoutSecs: 30 });
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    const prices = items.map((i) => Number(i.price)).filter((p) => Number.isFinite(p)).sort((a, b) => a - b);
    if (prices.length < 3) return null;
    const median = prices[Math.floor(prices.length / 2)];
    return { ok: true, value: median, source: "chrono24", fallback: false, detail: `Apify (${prices.length} listings)` };
  } catch {
    return null;
  }
}
```

**Step 4:** In existing `chrono24Price()`, call `chrono24PriceViaApify` first; fall back to current HTML scrape if it returns `null`.

**Step 5:** Run tests, verify pass:
```bash
pnpm --filter @vaulx/web test -- chrono24
```

**Step 6:** Commit:
```bash
git add apps/web/src/lib/appraisal/
git commit -m "feat(apify): Chrono24 actor with HTML-scraper fallback"
```

---

## Item 4 — Real Bubblegum cNFT mint for TRDC (4 days)

**Why:** TRDC currently is a PDA flag with a fake `asset_id`. Replacing with a real Metaplex Bubblegum compressed NFT makes each loan a Solscan-verifiable asset with appraisal hash + custody status + LTV in URI metadata. Single biggest on-chain credibility upgrade.

**Note:** depends on Devnet deploy (Track B). Bubblegum CPI requires deployed `trdc` program with the new ix.

### Task 4.1 — Add Bubblegum SDK + create merkle tree on Devnet

**Files:**
- Modify: `programs/trdc/Cargo.toml`
- Create: `scripts/dev/create-trdc-merkle-tree.ts`

**Step 1:** Add Anchor-compatible Bubblegum dep:
```toml
mpl-bubblegum = { version = "1.4", features = ["no-entrypoint"] }
spl-account-compression = { version = "0.4", features = ["cpi"] }
spl-noop = { version = "0.2", features = ["cpi"] }
```

**Step 2:** Write `create-trdc-merkle-tree.ts`. Uses `@metaplex-foundation/mpl-bubblegum` to allocate a tree (depth 14, buffer 64 = 16M leaves, ~$5 in rent on Devnet). Saves tree pubkey to `scripts/dev/trdc-merkle-tree.json`.

**Step 3:** Run on Devnet:
```bash
pnpm tsx scripts/dev/create-trdc-merkle-tree.ts
```

**Step 4:** Commit script + tree JSON.

### Task 4.2 — Replace `mint_trdc_cnft` stub with real Bubblegum CPI

**Files:**
- Modify: `programs/trdc/src/lib.rs` (replace stub body)
- Modify: `programs/trdc/src/state.rs` (TRDCState gains `cnft_asset_id: Pubkey` instead of just `asset_id: [u8;32]` hash)
- Test: `tests/cnft-mint.spec.ts`

**Step 1:** Write failing test asserting `mint_trdc_cnft` returns a valid asset_id that can be fetched via Helius DAS API.

**Step 2:** Replace stub with real CPI:

```rust
use mpl_bubblegum::{
    instructions::{MintToCollectionV1CpiBuilder, MintV1CpiBuilder},
    types::MetadataArgs,
};

pub fn mint_trdc_cnft(ctx: Context<MintTrdcCnft>, asset_hint: [u8; 32]) -> Result<()> {
    let metadata = MetadataArgs {
        name: format!("Vaulx TRDC {}", ctx.accounts.trdc_state.loan_id.to_string().chars().take(8).collect::<String>()),
        symbol: "TRDC".to_string(),
        uri: format!("https://vaulx.app/api/trdc/{}/metadata", ctx.accounts.trdc_state.loan_id),
        // ... rest of metadata
    };
    MintV1CpiBuilder::new(&ctx.accounts.bubblegum_program.to_account_info())
        .leaf_owner(&ctx.accounts.borrower.to_account_info())
        // ... required accounts ...
        .metadata(metadata)
        .invoke()?;
    // Save the resulting asset_id to TRDCState
    Ok(())
}
```

**Step 3:** Run test, verify pass.

**Step 4:** Commit.

### Task 4.3 — Vaulx-hosted metadata route at `/api/trdc/[loanId]/metadata`

**Files:**
- Create: `apps/web/src/app/api/trdc/[loanId]/metadata/route.ts`

**Step 1:** Implement route. Returns standard Metaplex JSON metadata pointing at appraisal hash + custody status + LTV.

**Step 2:** Verify deployed metadata is fetchable via Helius DAS:
```bash
curl "https://api.mainnet-beta.solana.com" -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":"a","method":"getAsset","params":{"id":"<ASSET_ID>"}}'
```

**Step 3:** Commit.

### Task 4.4 — UI: TRDC viewer card + Solscan link

**Files:**
- Create: `apps/web/src/app/demo/_components/trdc-viewer.tsx`
- Modify: `apps/web/src/app/demo/borrow/dashboard/page.tsx` (mount viewer)

**Step 1:** Implement viewer that displays cNFT metadata + a "View on Solscan" link.

**Step 2:** Mount on dashboard.

**Step 3:** Commit.

---

## Item 5 — RedStone Oracle real wrap on-chain (3 days)

**Why:** Replace synthetic random walk with a real attested price feed. Anchor LTV check reads the RedStone feed by reference. Production credibility for the "RedStone-wrapped Chrono24" claim.

### Task 5.1 — RedStone Solana SDK + price-feed publisher

**Files:**
- Create: `apps/indexer/src/redstone-publisher.ts`
- Modify: `apps/indexer/package.json`

**Step 1:** Install `@redstone-finance/sdk`. Build a service that fetches price from `/api/appraisal` (or directly from Apify Chrono24) once per minute and publishes it to RedStone.

**Step 2:** Verify feed published, readable on-chain.

**Step 3:** Commit.

### Task 5.2 — Anchor program reads RedStone feed for LTV

**Files:**
- Modify: `programs/loan/src/lib.rs` (LTV check uses RedStone feed)
- Test: `tests/redstone-ltv.spec.ts`

**Step 1:** Write failing test asserting LTV check uses RedStone feed.

**Step 2:** Implement read of RedStone price account in `create_ccb_trdc` + `disburse_from_vault`.

**Step 3:** Run test, verify pass. Commit.

---

## Item 6 — The Graph subgraph (2 days)

**Why:** Free dev tier. Loan lifecycle indexed via subgraph. Standard Solana DeFi data layer. Signals technical completeness to judges.

### Task 6.1 — Install Graph CLI + scaffold subgraph

**Files:**
- Create: `subgraph/subgraph.yaml`
- Create: `subgraph/schema.graphql`
- Create: `subgraph/src/mappings/`

**Step 1:** `npm install -g @graphprotocol/graph-cli`. Run `graph init --product subgraph-studio --from-contract <VAULX_LOAN_PROGRAM>`.

**Step 2:** Define schema for `CcbOpened`, `CustodyConfirmed`, `Disbursed`, `Repaid`, `Renewed`, `Liquidated`.

**Step 3:** Implement mapping handlers.

**Step 4:** `graph build` + `graph deploy --product hosted-service vaulx/loan-lifecycle`. Verify on Graph Studio dashboard.

**Step 5:** Commit subgraph + add link to README's "Live demo" section.

---

## Item 7 — Kamino USDC float yield routing (2 days)

**Why:** Lender vault idle USDC auto-routes to Kamino USDC vault for ~4-6% APY. Boosts lender attractiveness without taking principal risk. SDK-only.

### Task 7.1 — Kamino client library + idle-USDC detector

**Files:**
- Modify: `apps/indexer/src/main.ts` (add idle-USDC monitor)
- Create: `apps/indexer/src/kamino-router.ts`

**Step 1:** Install `@kamino-finance/klend-sdk`. Build a service that monitors `vault.total_assets - sum(loan.principal_remaining)` and routes excess to Kamino USDC vault.

**Step 2:** Verify deposit lands in Kamino vault.

**Step 3:** Commit.

### Task 7.2 — UI surface: yield-routing badge on `/demo/lend`

**Files:**
- Modify: `apps/web/src/app/demo/lend/page.tsx`
- Modify: `apps/web/src/app/demo/_fixtures/vault-tranches.ts` (add `kaminoFloat` boolean)

**Step 1:** Show a `+4.2% Kamino float APY` annotation on each tranche tile when the yield routing is active.

**Step 2:** Commit.

---

## Verification before any item is "done"

Before marking any item complete, run:

1. `pnpm --filter @vaulx/web build` — green
2. `pnpm -w typecheck` — green (8/8 packages)
3. `pnpm --filter @vaulx/web test` — green (current 25 tests + any new ones)
4. `PATH="..." COPYFILE_DISABLE=1 anchor test --skip-build` — green (current 45 + any new Anchor tests)
5. CI grep: 0 personal names + 0 stale brand names in `apps/web/src/app/demo/`
6. Vercel auto-deploy live URL serves all routes 200
7. `superpowers:requesting-code-review` review for the increment

## Plan complete

Plan saved to `docs/plans/2026-04-28-vaulx-pre-hackathon-buildout-plan.md`. Two execution options:

1. **Subagent-Driven (this session)** — I dispatch fresh subagent per task, review between tasks, fast iteration
2. **Parallel Session (separate)** — Open new session with `superpowers:executing-plans`, batch execution with checkpoints

**Recommendation:** Option 1, this session, in the order shown — Track A (items 1, 2, 3) first while user reviews Anchor code, then Track B (items 4, 5, 6, 7) once Devnet deploy is authorized.
