# Vaulx Full-Stack Build — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship a Devnet-deployed Solana protocol (TRDC + Vault + Loan + Auction Anchor programs) with a Next.js 14 frontend that executes all 9 demo moments, submitted to the Colosseum Frontier Hackathon by May 10, 2026, as a complete parallel alternative to Edson's track.

**Architecture:** pnpm monorepo containing (a) a Rust/Anchor 0.30 workspace with four programs, (b) a Next.js 14 App Router frontend co-located with the off-chain indexer + SSE test runner as API routes, (c) shared TS packages (`anchor-client`, `terms`, `ccb`, `types`, `idls`) consumed by both the frontend and Anchor tests. Supabase for off-chain DB, web3.storage for IPFS, Helius for Devnet RPC, Vercel for frontend hosting.

**Tech Stack:** Rust 1.79 + Anchor 0.30, Next.js 14 (App Router, RSC), TypeScript 5.4, pnpm 9 workspaces, Turborepo, Tailwind 3 + shadcn/ui, TanStack Query, Zustand, React Hook Form + Zod, `@coral-xyz/anchor`, `@solana/wallet-adapter-*`, `@metaplex-foundation/mpl-bubblegum`, Supabase JS, web3.storage, Helius Devnet RPC, Vitest (TS unit tests), Playwright (E2E).

**Companion design doc:** [`2026-04-23-vaulx-full-stack-build-design.md`](./2026-04-23-vaulx-full-stack-build-design.md) — scope, stack decisions, timeline, risks. Read that before executing.

**Plan structure:**
- **Phase 0 — Bootstrap (Days 2–3, Apr 23–24)** — full TDD-granularity tasks below. Start here.
- **Phases 1–5** — summarized as task-groups with exit criteria. Each phase gets its own detailed plan (`docs/plans/2026-MM-DD-vaulx-phase-N-*.md`) written when we begin that phase, because downstream phases depend on upstream decisions (e.g. emitted event shapes define the indexer schema).

---

## Phase 0 — Bootstrap (Days 2–3, Apr 23–24)

**Goal:** A green `anchor test`, a green `pnpm dev` landing page at `http://localhost:3000`, a green GitHub Actions CI run, a green `vitest` suite over `packages/terms`, and a committed design doc. No business logic yet.

**Exit criteria:**
- [ ] Git repo initialized, design docs committed
- [ ] pnpm workspace + Turborepo configured; `pnpm install` clean
- [ ] Anchor workspace with 4 empty programs; `anchor build` + `anchor test` green
- [ ] Next.js 14 app boots, landing page renders, Tailwind + shadcn/ui wired, wallet adapter connects to Phantom on Devnet
- [ ] `packages/terms` has one passing Vitest unit test (LTV calculator)
- [ ] GitHub Actions CI: `anchor test` + `pnpm -r test` + `pnpm -r build` all green on push
- [ ] Supabase project created; `.env.example` committed; `.env.local` populated locally (not committed)
- [ ] Helius Devnet RPC endpoint active

---

### Task 0.1: Initialize git and commit existing docs

**Files:**
- Create: `.gitignore`
- Create: `README.md`

**Step 1: Initialize repo**

```bash
cd /Users/gogy/MyCODE/VAULX
git init -b main
```

**Step 2: Write `.gitignore`**

```
# Node
node_modules/
.pnpm-store/
.next/
out/
dist/
.turbo/

# Rust / Anchor
target/
.anchor/
test-ledger/
*.log

# Env
.env
.env.local
.env.*.local
!.env.example

# Editor
.DS_Store
.vscode/
.idea/

# Secrets / wallets
*.json.keypair
**/id.json
wallet-*.json

# Build artifacts
*.so
```

**Step 3: Write minimal `README.md`**

```markdown
# Vaulx

Custody-gated RWA lending protocol on Solana. Colosseum Frontier Hackathon submission, May 2026.

See `docs/plans/` for the build plan.
```

**Step 4: Stage + commit**

```bash
git add .gitignore README.md docs/
git commit -m "chore: initialize repo with design docs"
```

Expected: commit succeeds, `git log` shows one commit.

---

### Task 0.2: Initialize pnpm workspace + Turborepo

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`

**Step 1: Write `package.json`**

```json
{
  "name": "vaulx",
  "version": "0.0.1",
  "private": true,
  "packageManager": "pnpm@9.1.0",
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck"
  },
  "devDependencies": {
    "turbo": "^2.0.4",
    "typescript": "^5.4.5"
  },
  "engines": {
    "node": ">=20"
  }
}
```

**Step 2: Write `pnpm-workspace.yaml`**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

**Step 3: Write `turbo.json`**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": { "cache": false, "persistent": true },
    "test": { "dependsOn": ["^build"] },
    "lint": {},
    "typecheck": { "dependsOn": ["^build"] }
  }
}
```

**Step 4: Install + verify**

```bash
pnpm install
```

Expected: `pnpm-lock.yaml` created, no workspace errors.

**Step 5: Commit**

```bash
git add package.json pnpm-workspace.yaml turbo.json pnpm-lock.yaml
git commit -m "chore: init pnpm workspace + turborepo"
```

---

### Task 0.3: Scaffold shared packages (stubs)

**Files:**
- Create: `packages/types/package.json`
- Create: `packages/types/src/index.ts`
- Create: `packages/types/tsconfig.json`
- Create: `packages/terms/package.json`
- Create: `packages/terms/src/index.ts`
- Create: `packages/terms/tsconfig.json`
- Create: `packages/terms/vitest.config.ts`
- Create: `packages/terms/src/ltv.test.ts`
- Create: `packages/terms/src/ltv.ts`
- Create: `packages/ccb/package.json` (stub)
- Create: `packages/anchor-client/package.json` (stub)
- Create: `packages/idls/package.json` (stub, placeholder IDLs)

**Step 1: `packages/types/package.json`**

```json
{
  "name": "@vaulx/types",
  "version": "0.0.1",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": { "typecheck": "tsc --noEmit" },
  "devDependencies": { "typescript": "^5.4.5" }
}
```

**Step 2: `packages/types/src/index.ts`**

```typescript
export enum TRDCStatus {
  PendingCustody = "PENDING_CUSTODY",
  Active = "ACTIVE",
  Renewed = "RENEWED",
  Repaid = "REPAID",
  Overdue = "OVERDUE",
  Defaulted = "DEFAULTED",
  Liquidated = "LIQUIDATED",
}

export enum VaulxError {
  CustodyNotConfirmed = "CustodyNotConfirmed",
  UnauthorizedCaller = "UnauthorizedCaller",
  UnauthorizedCustodian = "UnauthorizedCustodian",
  InvalidStateTransition = "InvalidStateTransition",
  LTVExceeded = "LTVExceeded",
  InsufficientVaultLiquidity = "InsufficientVaultLiquidity",
  MathOverflow = "MathOverflow",
  PaymentAmountMismatch = "PaymentAmountMismatch",
  RenewalWindowClosed = "RenewalWindowClosed",
  AuctionClosed = "AuctionClosed",
  NotWhitelisted = "NotWhitelisted",
  BidBelowMinimum = "BidBelowMinimum",
  KYCRequired = "KYCRequired",
}

export type Bps = number & { __brand: "bps" };
export const bps = (n: number): Bps => n as Bps;
```

**Step 3: Write failing LTV test — `packages/terms/src/ltv.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { calculateLTV, isLTVAllowed, maxLoanAmount } from "./ltv";

describe("LTV math", () => {
  it("computes LTV as basis points", () => {
    expect(calculateLTV(5000n, 10000n)).toBe(5000);
  });

  it("returns 0 when appraisal is 0 (guard against div-by-zero)", () => {
    expect(calculateLTV(100n, 0n)).toBe(0);
  });

  it("rejects LTV above 6000 bps (60%)", () => {
    expect(isLTVAllowed(6000)).toBe(true);
    expect(isLTVAllowed(6001)).toBe(false);
  });

  it("computes max loan at 50% LTV", () => {
    expect(maxLoanAmount(10000n, 5000)).toBe(5000n);
  });
});
```

**Step 4: Run test and watch it fail**

```bash
cd packages/terms
pnpm install
pnpm test
```

Expected: FAIL — `./ltv` module not found.

**Step 5: Write minimal implementation — `packages/terms/src/ltv.ts`**

```typescript
export const MAX_LTV_BPS = 6000;

export function calculateLTV(loanAmount: bigint, appraisalValue: bigint): number {
  if (appraisalValue === 0n) return 0;
  return Number((loanAmount * 10_000n) / appraisalValue);
}

export function isLTVAllowed(ltvBps: number): boolean {
  return ltvBps <= MAX_LTV_BPS;
}

export function maxLoanAmount(appraisalValue: bigint, ltvBps: number): bigint {
  return (appraisalValue * BigInt(ltvBps)) / 10_000n;
}
```

**Step 6: Re-run tests**

```bash
pnpm test
```

Expected: PASS — 4 assertions green.

**Step 7: Add remaining package stubs**

`packages/terms/package.json`:

```json
{
  "name": "@vaulx/terms",
  "version": "0.0.1",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.4.5",
    "vitest": "^1.6.0"
  }
}
```

`packages/terms/vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";
export default defineConfig({ test: { globals: true } });
```

`packages/terms/src/index.ts`:

```typescript
export * from "./ltv";
```

`packages/ccb/package.json`:

```json
{
  "name": "@vaulx/ccb",
  "version": "0.0.1",
  "main": "./src/index.ts",
  "types": "./src/index.ts"
}
```

`packages/ccb/src/index.ts`:

```typescript
// Phase 2: CCB PDF generator + SHA-256 hasher
export const TODO = true;
```

`packages/anchor-client/package.json`:

```json
{
  "name": "@vaulx/anchor-client",
  "version": "0.0.1",
  "main": "./src/index.ts",
  "types": "./src/index.ts"
}
```

`packages/anchor-client/src/index.ts`:

```typescript
// Phase 1: generated from IDLs via anchor-client-gen
export const TODO = true;
```

`packages/idls/package.json`:

```json
{
  "name": "@vaulx/idls",
  "version": "0.0.1",
  "main": "./src/index.ts",
  "types": "./src/index.ts"
}
```

`packages/idls/src/index.ts`:

```typescript
// Phase 0 placeholder. Real IDL JSONs committed in Phase 1.
export const IDLS_PLACEHOLDER = true;
```

Add a root `tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve"
  }
}
```

And a `tsconfig.json` in each package extending it:

```json
{ "extends": "../../tsconfig.base.json", "include": ["src"] }
```

**Step 8: Install + test everything**

```bash
cd ../..
pnpm install
pnpm -r test
```

Expected: `@vaulx/terms` test suite green; other packages have no tests yet, no errors.

**Step 9: Commit**

```bash
git add packages/ tsconfig.base.json pnpm-lock.yaml
git commit -m "feat(packages): scaffold shared packages; terms has LTV math + tests"
```

---

### Task 0.4: Scaffold Anchor workspace with 4 empty programs

**Files:**
- Create: `Anchor.toml`
- Create: `Cargo.toml` (workspace)
- Create: `programs/trdc/Cargo.toml`
- Create: `programs/trdc/src/lib.rs`
- Create: `programs/vault/Cargo.toml`
- Create: `programs/vault/src/lib.rs`
- Create: `programs/loan/Cargo.toml`
- Create: `programs/loan/src/lib.rs`
- Create: `programs/auction/Cargo.toml`
- Create: `programs/auction/src/lib.rs`
- Create: `rust-toolchain.toml`
- Create: `tests/bootstrap.ts`
- Create: `tsconfig.anchor.json`

**Step 1: Verify toolchain**

```bash
anchor --version     # expect 0.30.x
solana --version     # expect 1.18.x or later
rustc --version
```

If Anchor is not installed:

```bash
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install 0.30.1
avm use 0.30.1
```

**Step 2: `rust-toolchain.toml`**

```toml
[toolchain]
channel = "1.79.0"
components = ["rustfmt", "clippy"]
```

**Step 3: `Cargo.toml` (workspace)**

```toml
[workspace]
members = [
  "programs/trdc",
  "programs/vault",
  "programs/loan",
  "programs/auction",
]
resolver = "2"

[profile.release]
overflow-checks = true
lto = "fat"
codegen-units = 1

[workspace.dependencies]
anchor-lang = "0.30.1"
anchor-spl = "0.30.1"
```

**Step 4: `Anchor.toml`**

```toml
[toolchain]
anchor_version = "0.30.1"

[features]
resolution = true
skip-lint = false

[programs.localnet]
trdc    = "TRDC1111111111111111111111111111111111111111"
vault   = "VAULT111111111111111111111111111111111111111"
loan    = "LOAN1111111111111111111111111111111111111111"
auction = "AUCTN111111111111111111111111111111111111111"

[registry]
url = "https://api.apr.dev"

[provider]
cluster = "localnet"
wallet  = "~/.config/solana/id.json"

[scripts]
test = "yarn run ts-mocha -p ./tsconfig.anchor.json -t 1000000 tests/**/*.ts"
```

(Program IDs are placeholders; replaced on first `anchor build` via `anchor keys list && anchor keys sync`.)

**Step 5: Each program — minimal `lib.rs`**

`programs/trdc/src/lib.rs`:

```rust
use anchor_lang::prelude::*;

declare_id!("TRDC1111111111111111111111111111111111111111");

#[program]
pub mod trdc {
    use super::*;

    pub fn ping(_ctx: Context<Ping>) -> Result<()> {
        msg!("trdc ping");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Ping<'info> {
    pub signer: Signer<'info>,
}
```

`programs/trdc/Cargo.toml`:

```toml
[package]
name = "trdc"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib", "lib"]
name = "trdc"

[features]
no-entrypoint = []
no-idl = []
no-log-ix-name = []
cpi = ["no-entrypoint"]
default = []
idl-build = ["anchor-lang/idl-build"]

[dependencies]
anchor-lang = { workspace = true }
```

Repeat the same pattern for `vault`, `loan`, `auction` — each with its own `declare_id!`, `#[program]` module, and a `ping` instruction. (Replace every `trdc` with `vault`/`loan`/`auction`.)

**Step 6: `tests/bootstrap.ts`**

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";

describe("bootstrap", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  it("pings all four programs", async () => {
    const provider = anchor.getProvider();
    const programs = [
      anchor.workspace.Trdc as Program<any>,
      anchor.workspace.Vault as Program<any>,
      anchor.workspace.Loan as Program<any>,
      anchor.workspace.Auction as Program<any>,
    ];
    for (const program of programs) {
      const tx = await program.methods
        .ping()
        .accounts({ signer: provider.publicKey })
        .rpc();
      console.log(`${program.idl.metadata?.name ?? "program"} ping tx: ${tx}`);
    }
  });
});
```

**Step 7: `tsconfig.anchor.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "strict": false,
    "resolveJsonModule": true
  },
  "include": ["tests/**/*.ts"]
}
```

**Step 8: Add root dev deps for Anchor tests**

```bash
pnpm add -D -w @coral-xyz/anchor @types/node @types/mocha ts-mocha typescript mocha chai @types/chai
```

Also at repo root, create a `yarn.lock`-stub-free `package.json` script for `anchor test`:

```bash
# (already scripted in Anchor.toml above)
```

If `yarn` is not installed, edit `Anchor.toml` test script to use `pnpm exec`:

```toml
test = "pnpm exec ts-mocha -p ./tsconfig.anchor.json -t 1000000 tests/**/*.ts"
```

**Step 9: Build**

```bash
anchor build
```

Expected: four `.so` files in `target/deploy/`; four IDL JSONs in `target/idl/`.

**Step 10: Sync program keys + rebuild**

```bash
anchor keys sync
anchor build
```

Expected: `declare_id!` macros and `Anchor.toml` entries both updated to real keypair pubkeys.

**Step 11: Run test**

```bash
anchor test
```

Expected: PASS — all four `ping` instructions succeed against `solana-test-validator`.

**Step 12: Commit**

```bash
git add Anchor.toml Cargo.toml rust-toolchain.toml programs/ tests/bootstrap.ts tsconfig.anchor.json package.json pnpm-lock.yaml target/idl/
git commit -m "feat(anchor): scaffold 4 programs with ping; bootstrap test green"
```

---

### Task 0.5: Scaffold Next.js 14 app with Tailwind + shadcn/ui + wallet adapter

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/next.config.mjs`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/tailwind.config.ts`
- Create: `apps/web/postcss.config.mjs`
- Create: `apps/web/app/layout.tsx`
- Create: `apps/web/app/page.tsx`
- Create: `apps/web/app/globals.css`
- Create: `apps/web/components/providers.tsx`
- Create: `apps/web/components/wallet-button.tsx`
- Create: `apps/web/lib/cn.ts`

**Step 1: Create Next.js app**

```bash
cd apps
pnpm dlx create-next-app@14 web \
  --ts --app --tailwind --eslint --src-dir false \
  --import-alias "@/*" --use-pnpm --no-git
cd web
```

**Step 2: Install Solana + shadcn deps**

```bash
pnpm add @coral-xyz/anchor \
  @solana/web3.js @solana/wallet-adapter-base \
  @solana/wallet-adapter-react @solana/wallet-adapter-react-ui \
  @solana/wallet-adapter-wallets \
  @tanstack/react-query zustand react-hook-form zod \
  class-variance-authority clsx tailwind-merge lucide-react
pnpm add @vaulx/types @vaulx/terms @vaulx/anchor-client @vaulx/idls --workspace
```

**Step 3: Initialize shadcn/ui**

```bash
pnpm dlx shadcn@latest init -d
```

Accept defaults. Then add core components:

```bash
pnpm dlx shadcn@latest add button card dialog input label toast
```

**Step 4: `apps/web/components/providers.tsx`**

```tsx
"use client";
import { ReactNode, useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter, SolflareWalletAdapter, BackpackWalletAdapter } from "@solana/wallet-adapter-wallets";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@solana/wallet-adapter-react-ui/styles.css";

export function Providers({ children }: { children: ReactNode }) {
  const endpoint = process.env.NEXT_PUBLIC_RPC_URL ?? "https://api.devnet.solana.com";
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter(), new BackpackWalletAdapter()],
    []
  );
  const queryClient = useMemo(() => new QueryClient(), []);

  return (
    <QueryClientProvider client={queryClient}>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>{children}</WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </QueryClientProvider>
  );
}
```

**Step 5: `apps/web/components/wallet-button.tsx`**

```tsx
"use client";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
export function WalletButton() {
  return <WalletMultiButton />;
}
```

**Step 6: `apps/web/app/layout.tsx`**

```tsx
import "./globals.css";
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata = { title: "Vaulx", description: "Custody-gated RWA lending on Solana" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

**Step 7: `apps/web/app/page.tsx`**

```tsx
import { WalletButton } from "@/components/wallet-button";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 gap-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Vaulx</h1>
        <p className="text-muted-foreground">Custody-gated RWA lending on Solana — Devnet</p>
      </div>
      <WalletButton />
    </main>
  );
}
```

**Step 8: Env config**

`apps/web/.env.example`:

```
NEXT_PUBLIC_RPC_URL=https://devnet.helius-rpc.com/?api-key=REPLACE_ME
NEXT_PUBLIC_CLUSTER=devnet
NEXT_PUBLIC_ADMIN_PUBKEYS=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
WEB3_STORAGE_TOKEN=
```

Copy to `.env.local` locally (not committed).

**Step 9: Run dev server**

```bash
cd ../..  # back to repo root
pnpm --filter web dev
```

Expected: server starts on `http://localhost:3000`; landing page shows "Vaulx" + a "Select Wallet" button.

Open browser, click the button, verify Phantom is listed. Connect. Verify pubkey displays.

**Step 10: Commit**

```bash
git add apps/ pnpm-lock.yaml
git commit -m "feat(web): scaffold Next.js 14 app with wallet adapter + shadcn"
```

---

### Task 0.6: GitHub Actions CI

**Files:**
- Create: `.github/workflows/ci.yml`

**Step 1: Write CI workflow**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  ts:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm -r test
      - run: pnpm -r build
        env:
          NEXT_PUBLIC_RPC_URL: https://api.devnet.solana.com
          NEXT_PUBLIC_CLUSTER: devnet

  anchor:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - name: Install Solana
        run: |
          sh -c "$(curl -sSfL https://release.solana.com/v1.18.17/install)"
          echo "$HOME/.local/share/solana/install/active_release/bin" >> $GITHUB_PATH
      - name: Install Anchor
        run: |
          cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
          avm install 0.30.1
          avm use 0.30.1
      - name: Generate keypair
        run: solana-keygen new --no-bip39-passphrase --force
      - run: pnpm install --frozen-lockfile
      - run: anchor build
      - run: anchor test
```

**Step 2: Commit and push (when remote exists)**

```bash
git add .github/
git commit -m "ci: anchor test + pnpm test on every push"
```

(Actual push deferred until repo has a remote. See Task 0.8.)

---

### Task 0.7: Supabase project + env wiring

**Files:**
- Create: `docs/DEPLOY.md` (starter)
- Create: `apps/web/lib/supabase.ts`

**Step 1: Create Supabase project (manual, via dashboard)**

Go to https://supabase.com/dashboard → new project → name `vaulx-devnet`. Copy URL + anon key + service role key into `apps/web/.env.local`.

**Step 2: Initial schema (SQL editor, paste and run)**

```sql
create table appraisal_requests (
  id uuid primary key default gen_random_uuid(),
  asset_category text not null check (asset_category in ('watch','jewelry','art','vehicle','nft')),
  brand text,
  model text,
  reference text,
  photos_cid text,
  borrower_pubkey text not null,
  submitted_values numeric[] default '{}',
  median_value numeric,
  convergence_status text check (convergence_status in ('pending','converged','diverged')) default 'pending',
  created_at timestamptz not null default now()
);

create table appraisal_submissions (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references appraisal_requests(id) on delete cascade,
  appraiser_pubkey text not null,
  value numeric not null,
  confidence smallint not null check (confidence between 0 and 100),
  notes text,
  created_at timestamptz not null default now()
);

create index on appraisal_submissions(request_id);

create table onchain_events (
  signature text primary key,
  slot bigint not null,
  program_id text not null,
  event_name text not null,
  payload jsonb not null,
  observed_at timestamptz not null default now()
);

create index on onchain_events(event_name);
create index on onchain_events(observed_at desc);
```

**Step 3: `apps/web/lib/supabase.ts`**

```typescript
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const supabaseAdmin = () =>
  createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
```

Add deps:

```bash
pnpm --filter web add @supabase/supabase-js
```

**Step 4: `docs/DEPLOY.md` (starter)**

```markdown
# Vaulx Deployment

## Environment
- Solana: Devnet
- RPC: Helius Devnet (paid tier)
- DB: Supabase (`vaulx-devnet` project)
- IPFS: web3.storage
- Frontend host: Vercel
- CI: GitHub Actions

## Env vars
See `apps/web/.env.example`.

## Program IDs
Committed to `programs.json` at repo root after first Devnet deploy.
```

**Step 5: Commit**

```bash
git add apps/web/lib/supabase.ts docs/DEPLOY.md apps/web/package.json pnpm-lock.yaml
git commit -m "feat(offchain): supabase client + initial schema + deploy doc"
```

---

### Task 0.8: Create GitHub repo + push

**Step 1: Create remote** (via `gh` CLI if installed, else manually in the GitHub UI)

```bash
gh repo create vaulx --private --source=. --push
```

or manually:

```bash
# Create `vaulx` repo in GitHub UI (private)
git remote add origin git@github.com:<owner>/vaulx.git
git push -u origin main
```

**Step 2: Verify CI runs green**

Watch the Actions tab. Both `ts` and `anchor` jobs should pass.

If either fails: fix, commit, push, repeat. **Do not proceed to Phase 1 with red CI.**

**Step 3: Collaborators**

Per Decision D6 in the design doc: add George, Marcelo (write), Edson (read). Defer until gogy answers.

---

### Task 0.9: Phase 0 exit verification

Before moving to Phase 1, verify every item below is green. Check them off:

- [ ] `git log --oneline` shows 7+ commits
- [ ] `pnpm install` clean, no warnings about missing workspace packages
- [ ] `pnpm -r test` all green (at minimum, `@vaulx/terms` passes)
- [ ] `anchor build` produces 4 `.so` and 4 IDL JSONs
- [ ] `anchor test` green (4 pings succeed)
- [ ] `pnpm --filter web dev` boots localhost:3000 without errors
- [ ] Phantom connects on Devnet and displays pubkey
- [ ] GitHub Actions CI green on latest push
- [ ] Supabase project alive; `onchain_events` + `appraisal_*` tables exist
- [ ] Helius RPC key in `.env.local`, not in `.env.example`

When all boxes are checked, Phase 0 is done.

---

## Phase 1 — Core programs + happy paths (Days 4–7, Apr 25–28)

**Detailed plan to be written in `docs/plans/2026-04-25-vaulx-phase-1-core-programs.md` on Day 4.**

**Scope:**
- **TRDC program:** cNFT mint via Bubblegum CPI, TRDCState PDA, full 7-state enum with `#[error_code]` transitions enforced. Happy-path test.
- **Vault program:** `initialize_vault`, `deposit`, `withdraw` with share-token accounting. `disburse` stubbed (CPI auth added in Phase 2). Share-accounting test.
- **Loan program:** `create_ccb_trdc` instruction that mints TRDC + creates TRDCState via CPI to TRDC program. LTV check enforced at mint. Test: mint rejects LTV > 60%.
- **Frontend lender flow:** `/lend`, `/lend/vaults`, `/lend/vaults/[id]` with real deposit into Vault (Moment 1). Civic/Blockpass mock modal (I4).
- **`@vaulx/anchor-client`:** generated via `anchor-client-gen` against real IDLs; re-exported typed from `@vaulx/types`.
- **Indexer worker stub:** Node subscriber subscribes to Vault program logs and writes `Deposited` events to `onchain_events` table.

**Exit criteria:**
- Moment 1 executes end-to-end on Devnet: lender connects wallet → sees Civic mock → deposits USDC → vault balance + position visible on UI, event row in Supabase.
- Tests green: `test_vault_share_accounting`, `test_ltv_enforced_at_mint`, `test_happy_path_end_to_end` (stub — expanded in Phase 2).
- CI green.

---

## Phase 2 — Disburse gate + borrower wizard + demo integrations part 1 (Days 8–10, Apr 29–May 1)

**Detailed plan to be written in `docs/plans/2026-04-29-vaulx-phase-2-disburse-and-wizard.md` on Day 8.**

**Scope:**
- **Loan.confirm_custody + Vault.disburse with CPI-only gate:** two-layer enforcement (signer PDA check + instruction sysvar inspection). Emits `CustodyConfirmed` + `Disbursed`.
- **The 2 named failing tests, passing-as-failures:** `test_disburse_fails_when_custody_not_confirmed`, `test_disburse_fails_with_unauthorized_caller`. Exact error names matched.
- **Remaining 8 named tests written + green:** per Backend BRD §7.
- **Event emission complete:** every instruction emits an `emit!` event with stable serialization.
- **IDL freeze** end of Day 10 (May 1). `packages/idls/*.json` committed as source of truth; `@vaulx/anchor-client` regenerated once, then immutable until post-hackathon.
- **Borrower wizard (Moment 2):** `/borrow/new/asset` → `/borrow/new/appraisal/[reqId]` → `/borrow/new/terms/[reqId]` with Chrono24 + WatchCharts live pricing (I1) + gov.br mocked ID flow (I2) + CCB generation/signing.
- **Awaiting-custody screen + custodian confirm UI (Moment 3):** `/borrow/new/awaiting-custody/[trdc]`, `/custodian/intake/[trdc]`.

**Exit criteria:**
- Moments 2, 3, 4 execute end-to-end on Devnet.
- `anchor test` full suite green (8 pass + 2 fail-as-fail with exact error names).
- IDLs committed; frontend client typed and stable.
- Triangular convergence shows 3 real appraisal values live from Chrono24 scrape + WatchCharts API + internal model.

---

## Phase 3 — Repayment, renewal, auction, Solana Pay, SSE runner (Days 11–13, May 2–4)

**Detailed plan in `docs/plans/2026-05-02-vaulx-phase-3-closing-loops.md` on Day 11.**

**Scope:**
- **Loan.pay_installment + repay_ccb + renew_ccb:** full math matching `@vaulx/terms`.
- **Solana Pay QR code (I3):** Next.js route generates transfer request URL + QR; mobile Phantom signs.
- **Auction program:** `create_auction` (CPI from `execute_af_default`), `place_bid`, `close_auction`. Whitelist window = 60s demo vs 72h production behind feature flag.
- **Frontend:** `/borrow/loans/[trdc]/pay`, `/borrow/loans/[trdc]/renew`, `/borrow/loans/[trdc]/repay`, `/lend/auctions`, `/lend/auctions/[id]`.
- **`/admin/tests` SSE runner:** Next.js route spawns `anchor test` as a child process, pipes stdout/stderr as `text/event-stream`; React component renders ANSI → CSS using `ansi-to-html`.
- **Fallback video:** screen-record the test run to `/public/demo/test-run.mp4`. Non-negotiable, done by EOD Day 13.
- **Demo seed script + `/admin/demo` cockpit:** 6 numbered buttons, reset, accelerate-time.

**Exit criteria:**
- Moments 5, 6, 7, 8, 9 executable.
- Fallback video plays if SSE fails.
- Demo cockpit runs all 6 core moments back-to-back with a "Reset" between runs.

---

## Phase 4 — Rehearsal, polish, deploy, record (Days 14–16, May 5–7)

**Detailed plan in `docs/plans/2026-05-05-vaulx-phase-4-polish.md` on Day 14.**

**Scope:**
- Full rehearsal across all 9 moments on Devnet.
- Fix every bug that surfaces in rehearsal.
- Type, spacing, copy, empty states, loading states, error toasts everywhere.
- Production Devnet deploy of all four programs; commit final program IDs to `programs.json`.
- Deploy frontend to Vercel prod.
- Record 3-minute demo video.

**Exit criteria:**
- All 9 moments executable against prod Devnet deployment.
- Submission URL live and functional.
- Demo video recorded, rendered, uploaded.

---

## Phase 5 — Submission (Days 17–18, May 8–9)

**Detailed plan in `docs/plans/2026-05-08-vaulx-phase-5-submission.md` on Day 17.**

**Scope:**
- Fill out Colosseum submission form.
- Paste submission URL, demo video link, GitHub repo URL, program IDs, team info.
- README polish — judges read it.
- Dry-run submission a day early.

**Exit criteria:**
- Submitted by May 10.

---

## Working practices across all phases

- **Commit early and often.** At the end of every task above. Never more than 30 minutes of uncommitted work.
- **TDD for Anchor.** Write the failing Anchor test first, watch it fail, write minimal Rust, watch it pass, commit.
- **TDD for `@vaulx/terms`.** Same pattern, Vitest.
- **TDD for frontend:** Playwright E2E as acceptance tests for each moment; unit tests via Vitest only for pure-logic modules.
- **Cut aggressively when time slips.** Cut order is in the design doc §5: Moment 9 first, then 8, then 7. Moments 1–6 never cut.
- **Daily Edson sync** 3:30 PM Vienna. Share our IDLs; compare to his. Day 10 is binding: we demo whichever track is ready.
- **Fallback video is mandatory.** No exceptions. Record by Day 13.
- **No mainnet keys in the repo. Ever.**

---

## Open decisions from the design doc (D1–D7)

These block full Phase 1 kickoff:

| # | Decision | Default applied if not answered |
|---|---|---|
| D1 | Custodian demo wallet | Fresh Devnet keypair generated in Task 0.3 extension |
| D2 | Demo wallet funding | 10 SOL + $50K Devnet USDC × 6 wallets |
| D3 | Design direction | BRD operator aesthetic + shadcn defaults |
| D4 | Deployed domain | `vaulx.vercel.app` |
| D5 | Admin pubkey whitelist | Your connected Phantom pubkey only, until you provide more |
| D6 | Repo write access | gogy only, until you provide more |
| D7 | Edson disclosure | Open: tell him on next sync |

---

## Next step

**When Phase 0 (Tasks 0.1–0.9) completes green, write Phase 1's detailed plan.**

Do not proceed to Phase 1 coding until Phase 0 exit verification passes.
