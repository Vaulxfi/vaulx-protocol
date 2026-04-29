# Vaulx γ-Scope Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` to implement this plan task-by-task. Each task is self-contained for fresh-subagent dispatch.

**Goal:** Build the full pre-hackathon γ scope from [`2026-04-29-vaulx-user-journeys-current-vs-ideal.md`](2026-04-29-vaulx-user-journeys-current-vs-ideal.md) v3 — 11 new routes, 1 unified component, 4 backend pieces, plus 16 legacy-route deletions. AI-agent parallel execution.

**Architectural canon:** [`../architecture/2026-04-29-vaulx-composable-blocks.md`](../architecture/2026-04-29-vaulx-composable-blocks.md) is the source of truth for the protocol's block model. This plan delivers the engineering work for GLOBAL blocks **M3** (lender deposit panel + dashboard simplification), **M4** (borrower per-loan + repay UI), **C4** (online appraiser workspace), **C5** (offline appraiser workspace), and **C6** (Risk Officer review screen). All other blocks (LOCAL + HYBRID) are partnerships / legal / operations and out of scope for this plan.

**Architecture:** Two-stage borrower flow (indicative pre-custody → final post-Risk-Officer). Two distinct blinded appraiser personas (online 24h SLA + offline 48h SLA, case-code-blinded). Risk Officer reviews trilateral with bounded override. Lender flow simplified to USDC + Local. Lazy-KYC pattern via `useKycGate` reused. On-chain `KycAttestation` PDA reused. Crossmint Auth + Sumsub WebSDK reused.

**Tech Stack:**
- Next.js 14.2.15 App Router · React 18.3.1 · TypeScript 5.x
- `@coral-xyz/anchor` 0.30.1 (existing programs at `programs/{vault,loan,auction,trdc}`)
- `@crossmint/client-sdk-react-ui` 4.1.5 + `@solana/wallet-adapter-react` 0.15.35
- `@sumsub/websdk` 2.6.2 (already integrated)
- Supabase (env wired; data layer for `appraisal_case`)
- `vitest` (unit) + Playwright 1.48.2 (e2e)
- Mermaid (in-doc diagrams)

**Source-of-truth design:** [`2026-04-29-vaulx-user-journeys-current-vs-ideal.md`](2026-04-29-vaulx-user-journeys-current-vs-ideal.md) v3. Read §0.2 (Spec Evolution from BRD), §0.3 (Non-Negotiables), and §8 (build dependency graph) before starting Task A.1.

**Phase summary:**

| Phase | Tasks | Parallelizable | Description |
|---|---|---|---|
| A | A.1 – A.5 | ✅ all 5 in parallel | Foundations: data model, case codes, EXIF, auth gate, unified connect |
| B | B.1 – B.4 | ✅ within phase | Appraiser workspaces (online + offline) |
| C | C.1 – C.2 | ⚠️ C.2 needs C.1 + B's data | Risk Officer workspace + bounded override |
| D | D.1 – D.5 | ✅ mostly parallel | Borrower flow rewrite (5 routes) |
| E | E.1 – E.2 | independent | Lender vault simplification 4→2 |
| F | F.1 – F.5 | serial gate | Cleanup (delete 16 legacy routes) |
| G | G.1 – G.2 | post-cleanup | Custodian webhook spec |

Total: **~25 tasks**. With AI-agent parallel execution: completable in **~5-7 sequential rounds**.

**Skills referenced:**
- `superpowers:test-driven-development` — for every task
- `superpowers:verification-before-completion` — before committing each task
- `superpowers:requesting-code-review` — at end of each phase
- `superpowers:subagent-driven-development` — orchestrator

---

## Cross-cutting prerequisites

Before any task starts, the executing engineer / subagent reads and respects:

### Non-negotiables (from journey doc §0.3)

For any task touching appraiser workspaces, Risk Officer workspace, or photo handling:

1. **EXIF / GPS / device-id stripping** on every photo served to appraisers.
2. **Case codes are the ONLY identifier** appraisers see. Server-side endpoints must NEVER return borrower wallet, email, name, location, or other appraiser identity.
3. **Online and offline appraisers cannot see each other's submissions.** Server-side enforcement.
4. **Risk Officer auth stronger than other admin** — admin pubkey check at minimum.
5. **Bounded override enforced server-side**, not just client-side (client + server both validate `prudent_value ∈ [min, max]` of 3 evals).
6. **Sumsub webhook HMAC verification** before any on-chain action (already implemented).
7. **Operator key never exposed to client** (already enforced; preserve invariant).

Each task that touches these areas has an explicit "Non-Negotiables Check" verification step.

### Repo conventions

- All new code in `apps/web/src/`. Backend lib code in `apps/web/src/lib/<area>/`. Page routes in `apps/web/src/app/<route>/page.tsx`.
- Tests adjacent: `apps/web/src/lib/<area>/__tests__/<file>.test.ts` for libs; co-located `__tests__/` for components.
- Database tables managed via Supabase migrations under `supabase/migrations/` (existing pattern).
- Env vars: lowercase per existing convention (e.g. `sumsub_token`); UPPERCASE only for `NEXT_PUBLIC_*` and existing infra vars.
- Commit messages: short imperative `feat(area): ...` / `chore(area): ...` / `test(area): ...`. No emojis.
- One commit per task. No squash. Push at end of each phase, not after each task (so Vercel builds aren't spammed).

### Verification gates

Each task ends with these checks before commit:
1. `pnpm --filter @vaulx/web build` green
2. `pnpm --filter @vaulx/web test -- <touched files>` green (new tests pass; no existing-test regression)
3. (For appraiser/Risk-Officer/photo tasks) Non-Negotiables Check passed
4. Stage only the files listed in the task; no opportunistic changes

---

## Phase A — Foundations (parallelizable)

All 5 tasks in this phase can run concurrently. They have no inter-dependencies. Goal: ship the data model, security utilities, auth gate, and unified connect button before any UI work begins.

### Task A.1: Supabase `appraisal_case` schema + types

**Files:**
- Create: `supabase/migrations/2026-04-29-001-appraisal-case.sql`
- Create: `packages/types/src/appraisal.ts`
- Modify: `packages/types/src/index.ts` (add export)
- Test: `packages/types/__tests__/appraisal.test.ts`

**Step 1: Write the SQL migration**

```sql
-- supabase/migrations/2026-04-29-001-appraisal-case.sql

create table appraisal_case (
  id              uuid primary key default gen_random_uuid(),
  case_code       text unique not null,        -- e.g. "VX-7A2F"
  borrower_pubkey text not null,                -- base58, indexed for borrower polling
  loan_request_id text not null,                -- maps to /demo/borrow/loan-offer/[reqId]

  -- redacted asset metadata (what appraisers see)
  asset_brand        text not null,             -- e.g. "Rolex"
  asset_model        text not null,             -- e.g. "Submariner 116610LN"
  asset_serial_4     text not null,             -- last 4 chars; e.g. "1234"

  -- evaluations
  api_anchor_value_atoms       bigint,
  api_anchor_source             text,           -- "watchcharts", "apify-chrono24"
  api_anchor_submitted_at       timestamptz,

  online_appraiser_id           uuid,           -- FK to a future appraisers table; nullable until assigned
  online_eval_value_atoms       bigint,
  online_eval_confidence_low    bigint,
  online_eval_confidence_high   bigint,
  online_eval_notes             text,
  online_eval_submitted_at      timestamptz,
  online_sla_due_at             timestamptz,    -- 24h after assignment

  offline_appraiser_id          uuid,
  offline_eval_value_atoms      bigint,
  offline_eval_confidence_low   bigint,
  offline_eval_confidence_high  bigint,
  offline_eval_notes            text,
  offline_eval_defect_flags     jsonb,          -- e.g. {"hidden_damage": true, "counterfeit_suspected": false}
  offline_eval_authenticity     text,           -- "authentic", "suspect_counterfeit", "stolen_flag"
  offline_eval_submitted_at     timestamptz,
  offline_sla_due_at            timestamptz,    -- 48h after custody confirm

  -- Risk Officer decision
  risk_officer_id               uuid,
  risk_officer_decision         text,           -- "accept", "audit", "decline"
  prudent_value_atoms           bigint,
  decision_reason               text,
  decided_at                    timestamptz,

  -- state machine
  state                         text not null default 'pending_assignment',
  -- valid: pending_assignment, online_in_progress, online_submitted,
  --        custody_pending, offline_in_progress, offline_submitted,
  --        risk_review, decided, expired

  created_at                    timestamptz not null default now(),
  updated_at                    timestamptz not null default now()
);

create index idx_appraisal_case_borrower on appraisal_case(borrower_pubkey);
create index idx_appraisal_case_state on appraisal_case(state);
create index idx_appraisal_case_online_appraiser on appraisal_case(online_appraiser_id) where online_appraiser_id is not null;
create index idx_appraisal_case_offline_appraiser on appraisal_case(offline_appraiser_id) where offline_appraiser_id is not null;

create table appraiser (
  id              uuid primary key default gen_random_uuid(),
  email           text unique not null,
  display_name    text not null,
  role            text not null,                -- "online", "offline", "both"
  invite_token    text unique,                  -- single-use auth token for first login
  active          boolean not null default true,
  created_at      timestamptz not null default now()
);

-- Photos served to appraisers must come through a server-side EXIF-stripped URL.
-- Store original photos by reqId and serve via /api/photos/[caseCode]/[idx].
create table appraisal_photo (
  id              uuid primary key default gen_random_uuid(),
  case_code       text not null references appraisal_case(case_code) on delete cascade,
  source          text not null,                -- "borrower_upload", "offline_appraiser_capture"
  original_url    text not null,                -- raw upload (with EXIF)
  stripped_url    text not null,                -- EXIF-stripped served URL
  uploaded_by     uuid,                          -- nullable for borrower uploads
  uploaded_at     timestamptz not null default now()
);

create index idx_appraisal_photo_case on appraisal_photo(case_code);
```

**Step 2: Write TypeScript types**

```ts
// packages/types/src/appraisal.ts

export type AppraisalState =
  | "pending_assignment"
  | "online_in_progress"
  | "online_submitted"
  | "custody_pending"
  | "offline_in_progress"
  | "offline_submitted"
  | "risk_review"
  | "decided"
  | "expired";

export type AppraisalDecision = "accept" | "audit" | "decline";

export type AppraiserRole = "online" | "offline" | "both";

export type DefectFlags = {
  hidden_damage: boolean;
  counterfeit_suspected: boolean;
  service_history_mismatch: boolean;
  stolen_flag: boolean;
};

export type AppraisalCase = {
  id: string;
  caseCode: string;
  borrowerPubkey: string;
  loanRequestId: string;
  assetBrand: string;
  assetModel: string;
  assetSerial4: string;
  apiAnchorValueAtoms: bigint | null;
  apiAnchorSource: string | null;
  apiAnchorSubmittedAt: Date | null;
  onlineAppraiserId: string | null;
  onlineEvalValueAtoms: bigint | null;
  onlineEvalConfidenceLow: bigint | null;
  onlineEvalConfidenceHigh: bigint | null;
  onlineEvalNotes: string | null;
  onlineEvalSubmittedAt: Date | null;
  onlineSlaDueAt: Date | null;
  offlineAppraiserId: string | null;
  offlineEvalValueAtoms: bigint | null;
  offlineEvalConfidenceLow: bigint | null;
  offlineEvalConfidenceHigh: bigint | null;
  offlineEvalNotes: string | null;
  offlineEvalDefectFlags: DefectFlags | null;
  offlineEvalAuthenticity: "authentic" | "suspect_counterfeit" | "stolen_flag" | null;
  offlineEvalSubmittedAt: Date | null;
  offlineSlaDueAt: Date | null;
  riskOfficerId: string | null;
  riskOfficerDecision: AppraisalDecision | null;
  prudentValueAtoms: bigint | null;
  decisionReason: string | null;
  decidedAt: Date | null;
  state: AppraisalState;
  createdAt: Date;
  updatedAt: Date;
};

// Blinded view returned to appraiser-side endpoints.
// CRITICAL: never include borrower_pubkey, appraiser identity, or other appraiser's submission.
export type AppraisalCaseBlinded = {
  caseCode: string;
  assetBrand: string;
  assetModel: string;
  assetSerial4: string;
  slaDeadline: string; // ISO timestamp
  photoUrls: string[]; // EXIF-stripped only
};
```

**Step 3: Write tests for the type module**

```ts
// packages/types/__tests__/appraisal.test.ts

import { describe, it, expect } from "vitest";
import type { AppraisalCase, AppraisalCaseBlinded } from "../src/appraisal";

describe("AppraisalCaseBlinded", () => {
  it("must not contain borrower or appraiser identifiers (compile-time check)", () => {
    // This test exists to lock the shape. If anyone adds borrowerPubkey to
    // AppraisalCaseBlinded, this test will need to be deleted explicitly,
    // forcing a security review.
    const blinded: AppraisalCaseBlinded = {
      caseCode: "VX-7A2F",
      assetBrand: "Rolex",
      assetModel: "Submariner 116610LN",
      assetSerial4: "1234",
      slaDeadline: "2026-04-30T14:00:00Z",
      photoUrls: ["/api/photos/VX-7A2F/0"],
    };
    expect(Object.keys(blinded)).not.toContain("borrowerPubkey");
    expect(Object.keys(blinded)).not.toContain("onlineAppraiserId");
    expect(Object.keys(blinded)).not.toContain("offlineAppraiserId");
  });
});
```

**Step 4: Run migration and tests**

```bash
# Migration (Supabase CLI; assumes local supabase running)
supabase db push

# Tests
pnpm --filter @vaulx/types test
```

Expected: migration runs, tables created. Tests pass.

**Step 5: Non-Negotiables Check**

Verify `AppraisalCaseBlinded` does NOT include any of: `borrowerPubkey`, `onlineAppraiserId`, `offlineAppraiserId`, raw photo URLs (only `stripped_url` reference paths).

**Step 6: Commit**

```bash
git add supabase/migrations/2026-04-29-001-appraisal-case.sql \
        packages/types/src/appraisal.ts \
        packages/types/src/index.ts \
        packages/types/__tests__/appraisal.test.ts
git commit -m "feat(types): appraisal_case schema + blinded view type"
```

---

### Task A.2: Case-code generator

**Files:**
- Create: `apps/web/src/lib/appraisal/case-code.ts`
- Test: `apps/web/src/lib/appraisal/__tests__/case-code.test.ts`

**Step 1: Write the failing test**

```ts
// apps/web/src/lib/appraisal/__tests__/case-code.test.ts

import { describe, it, expect } from "vitest";
import { generateCaseCode, isValidCaseCode } from "../case-code";

describe("generateCaseCode", () => {
  it("returns format VX-XXXX with uppercase alphanumerics", () => {
    const code = generateCaseCode();
    expect(code).toMatch(/^VX-[A-Z0-9]{4}$/);
  });

  it("generates unique codes across 1000 calls", () => {
    const codes = new Set<string>();
    for (let i = 0; i < 1000; i++) codes.add(generateCaseCode());
    expect(codes.size).toBe(1000);
  });
});

describe("isValidCaseCode", () => {
  it("accepts well-formed codes", () => {
    expect(isValidCaseCode("VX-7A2F")).toBe(true);
    expect(isValidCaseCode("VX-0000")).toBe(true);
  });

  it("rejects malformed codes", () => {
    expect(isValidCaseCode("vx-7A2F")).toBe(false);  // lowercase
    expect(isValidCaseCode("VX-7A2")).toBe(false);   // too short
    expect(isValidCaseCode("VX-7A2FF")).toBe(false); // too long
    expect(isValidCaseCode("VY-7A2F")).toBe(false);  // wrong prefix
    expect(isValidCaseCode("")).toBe(false);
  });
});
```

**Step 2: Run test, verify FAIL**

```bash
pnpm --filter @vaulx/web test -- case-code
```
Expected: FAIL with "generateCaseCode is not a function".

**Step 3: Implement**

```ts
// apps/web/src/lib/appraisal/case-code.ts

/**
 * Case-code generator for blinded appraisal cases. Format: VX-XXXX where
 * X is uppercase alphanumeric. The case code is the ONLY identifier
 * appraisers see; it never leaks borrower or other-appraiser identity.
 *
 * Uniqueness enforcement: this generator returns a candidate; the caller
 * must check DB uniqueness against `appraisal_case.case_code`. Collision
 * probability for 4 chars from 36-char alphabet = 1 / 1.7M; acceptable for
 * a few thousand cases. For higher volume, expand to 5 chars later.
 */
import crypto from "node:crypto";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export function generateCaseCode(): string {
  const bytes = crypto.randomBytes(4);
  let code = "VX-";
  for (let i = 0; i < 4; i++) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return code;
}

export function isValidCaseCode(s: string): boolean {
  return /^VX-[A-Z0-9]{4}$/.test(s);
}
```

**Step 4: Run test, verify PASS**

**Step 5: Commit**

```bash
git add apps/web/src/lib/appraisal/case-code.ts \
        apps/web/src/lib/appraisal/__tests__/case-code.test.ts
git commit -m "feat(appraisal): case-code generator + validator"
```

---

### Task A.3: Photo EXIF stripper

**Files:**
- Create: `apps/web/src/lib/photos/exif-strip.ts`
- Create: `apps/web/src/app/api/photos/[caseCode]/[idx]/route.ts`
- Test: `apps/web/src/lib/photos/__tests__/exif-strip.test.ts`
- Add dep: `sharp` (npm) for image processing

**Step 1: Add dependency**

```bash
pnpm --filter @vaulx/web add sharp
```

**Step 2: Write the failing test**

```ts
// apps/web/src/lib/photos/__tests__/exif-strip.test.ts

import { describe, it, expect } from "vitest";
import { stripExif } from "../exif-strip";
import fs from "node:fs/promises";
import path from "node:path";

describe("stripExif", () => {
  it("removes EXIF data from a JPEG", async () => {
    // Use a fixture JPEG with known EXIF (GPS, device id, etc.)
    const fixture = path.join(__dirname, "fixtures", "with-exif.jpg");
    const buf = await fs.readFile(fixture);
    expect(buf.length).toBeGreaterThan(0);

    const stripped = await stripExif(buf);

    // sharp output should not contain "GPS" marker that fixture had
    expect(stripped.includes(Buffer.from("GPS"))).toBe(false);
    // result is still a valid JPEG (starts with FFD8)
    expect(stripped[0]).toBe(0xff);
    expect(stripped[1]).toBe(0xd8);
  });

  it("rejects non-image input", async () => {
    await expect(stripExif(Buffer.from("not an image"))).rejects.toThrow();
  });
});
```

**Step 3: Add a tiny EXIF-laden fixture JPEG**

Use a known-public test fixture. The subagent can generate one or download from a known source. Reference: any test JPEG with embedded GPS works.

**Step 4: Implement**

```ts
// apps/web/src/lib/photos/exif-strip.ts

/**
 * Server-side EXIF / GPS / device-id stripping for photos served to
 * appraisers. Non-negotiable per journey-doc §0.3.
 *
 * Uses sharp's metadata-removal: `withMetadata({})` removes EXIF/IPTC/XMP.
 */
import sharp from "sharp";

export async function stripExif(buf: Buffer): Promise<Buffer> {
  return sharp(buf, { failOn: "error" })
    .rotate() // honor EXIF orientation BEFORE stripping
    .withMetadata({}) // empty metadata = strip all
    .toBuffer();
}
```

**Step 5: API route to serve EXIF-stripped photos**

```ts
// apps/web/src/app/api/photos/[caseCode]/[idx]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { isValidCaseCode } from "@/lib/appraisal/case-code";
import { stripExif } from "@/lib/photos/exif-strip";
// supabase server client (existing pattern in repo)

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { caseCode: string; idx: string } },
) {
  if (!isValidCaseCode(params.caseCode)) {
    return NextResponse.json({ ok: false, detail: "bad case code" }, { status: 400 });
  }
  const idx = parseInt(params.idx, 10);
  if (Number.isNaN(idx) || idx < 0) {
    return NextResponse.json({ ok: false, detail: "bad index" }, { status: 400 });
  }

  // Authentication: caller must be a known appraiser assigned to this case,
  // OR the Risk Officer. Implementation reads from supabase appraiser table
  // and validates session token. (Skeleton — real auth in Task A.4 + B/C tasks.)

  // 1. fetch original_url from appraisal_photo
  // 2. download bytes (s3/supabase storage)
  // 3. stripExif
  // 4. return image/jpeg

  // Skeleton:
  return new NextResponse("not yet wired", { status: 501 });
}
```

(The full route implementation lands in Task B.2 alongside the appraiser submission form. A.3 ships only the pure `stripExif` helper + a 501 placeholder route so Phase B can fill it in.)

**Step 6: Run tests + Non-Negotiables Check**

```bash
pnpm --filter @vaulx/web test -- exif-strip
```

Non-Negotiables Check: open the produced stripped image with `exiftool` (or sharp's metadata read) and confirm zero metadata.

**Step 7: Commit**

```bash
git add apps/web/src/lib/photos/exif-strip.ts \
        apps/web/src/lib/photos/__tests__/exif-strip.test.ts \
        apps/web/src/app/api/photos/[caseCode]/[idx]/route.ts \
        apps/web/package.json pnpm-lock.yaml
git commit -m "feat(photos): EXIF-stripped photo serving (skeleton)"
```

---

### Task A.4: Admin basic-auth gate (middleware)

**Files:**
- Create: `apps/web/src/middleware.ts` (or modify if exists)
- Create: `apps/web/src/lib/auth/admin.ts`
- Test: `apps/web/src/lib/auth/__tests__/admin.test.ts`

**Goal:** any request to `/admin/*`, `/custodian/*`, `/appraiser/*` (added in Phase B) is gated by an `x-vaulx-admin` header OR `vaulx-admin` cookie matching `NEXT_PUBLIC_VAULX_ADMIN_PUBKEY`. Public-by-default routes (`/demo/*`, `/`, etc.) are unaffected.

**Step 1: Check if middleware.ts exists and inspect**

```bash
ls apps/web/src/middleware.ts 2>/dev/null
```
If exists: extend it. If not: create it.

**Step 2: Write the failing test**

```ts
// apps/web/src/lib/auth/__tests__/admin.test.ts

import { describe, it, expect } from "vitest";
import { isAdminAuthorized } from "../admin";

describe("isAdminAuthorized", () => {
  it("returns true with matching cookie", () => {
    const req = new Request("http://localhost/admin/demo", {
      headers: { cookie: "vaulx-admin=PUBKEY1" },
    });
    expect(isAdminAuthorized(req, "PUBKEY1")).toBe(true);
  });

  it("returns true with matching header", () => {
    const req = new Request("http://localhost/admin/demo", {
      headers: { "x-vaulx-admin": "PUBKEY1" },
    });
    expect(isAdminAuthorized(req, "PUBKEY1")).toBe(true);
  });

  it("returns false on mismatch", () => {
    const req = new Request("http://localhost/admin/demo", {
      headers: { cookie: "vaulx-admin=WRONG" },
    });
    expect(isAdminAuthorized(req, "PUBKEY1")).toBe(false);
  });

  it("returns true when no expected pubkey set (devnet open mode)", () => {
    const req = new Request("http://localhost/admin/demo");
    expect(isAdminAuthorized(req, undefined)).toBe(true);
  });
});
```

**Step 3: Implement helper**

```ts
// apps/web/src/lib/auth/admin.ts

/**
 * Admin auth gate per journey-doc §0.3 non-negotiable #4.
 * Devnet-open when env unset; production must set NEXT_PUBLIC_VAULX_ADMIN_PUBKEY.
 */

export function isAdminAuthorized(
  req: Request,
  expectedPubkey: string | undefined,
): boolean {
  if (!expectedPubkey) return true; // open in dev when env unset
  const header = req.headers.get("x-vaulx-admin");
  if (header === expectedPubkey) return true;
  const cookie = req.headers.get("cookie") ?? "";
  const match = cookie.match(/(?:^|;\s*)vaulx-admin=([^;]+)/);
  if (match && match[1] === expectedPubkey) return true;
  return false;
}
```

**Step 4: Wire into middleware**

```ts
// apps/web/src/middleware.ts

import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/auth/admin";

const GATED_PATHS = [/^\/admin\//, /^\/custodian\//, /^\/appraiser\//];

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  if (GATED_PATHS.some((re) => re.test(pathname))) {
    const expected = process.env.NEXT_PUBLIC_VAULX_ADMIN_PUBKEY;
    if (!isAdminAuthorized(req, expected)) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/custodian/:path*", "/appraiser/:path*"],
};
```

**Step 5: Run tests + verify**

```bash
pnpm --filter @vaulx/web test -- admin
pnpm --filter @vaulx/web build
```

Manual test: `curl -i http://localhost:3000/admin/demo` returns 403 when env set.

**Step 6: Commit**

```bash
git add apps/web/src/middleware.ts \
        apps/web/src/lib/auth/admin.ts \
        apps/web/src/lib/auth/__tests__/admin.test.ts
git commit -m "feat(auth): admin/custodian/appraiser basic-auth gate"
```

---

### Task A.5: `<UnifiedConnectButton>` component

**Files:**
- Create: `apps/web/src/components/vaulx/unified-connect-button.tsx`
- Test: `apps/web/src/components/vaulx/__tests__/unified-connect-button.test.tsx`
- Modify (Phase D-E will): replace `<WalletMultiButton>` calls everywhere

**Goal:** single button that, when clicked, opens a modal showing both Crossmint Auth options (Google / Apple / email / SMS) AND Solana wallet-adapter options (Phantom / Solflare). Resolves to a Solana pubkey from either path.

**Step 1: Read existing patterns**

```bash
grep -rn "WalletMultiButton\|CrossmintWallet" apps/web/src/components/ apps/web/src/app/demo/ --include='*.tsx' | head -20
```

**Step 2: Write a behavior test**

```tsx
// apps/web/src/components/vaulx/__tests__/unified-connect-button.test.tsx

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { UnifiedConnectButton } from "../unified-connect-button";

vi.mock("@solana/wallet-adapter-react-ui", () => ({
  WalletMultiButton: () => <button data-testid="wallet-multi">Connect Wallet</button>,
}));

vi.mock("@/components/providers/crossmint-wallet-adapter", () => ({
  useUnifiedWallet: () => ({ publicKey: null, identityOnly: false, email: null }),
}));

describe("UnifiedConnectButton", () => {
  it("renders a single trigger button when no wallet connected", () => {
    render(<UnifiedConnectButton />);
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });
});
```

**Step 3: Implement**

```tsx
// apps/web/src/components/vaulx/unified-connect-button.tsx

"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useUnifiedWallet } from "@/components/providers/crossmint-wallet-adapter";

const WalletMultiButton = dynamic(
  async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false },
);

const CrossmintWallet = dynamic(
  async () => (await import("@/app/demo/_components/crossmint-wallet")).CrossmintWallet,
  { ssr: false },
);

/**
 * Single connect surface combining Crossmint Auth (non-crypto users via
 * Google/Apple/email/SMS) AND wallet-adapter (crypto-natives via Phantom/
 * Solflare/Backpack). Presented as one modal with both option groups.
 *
 * After resolution, useUnifiedWallet() returns the connected pubkey from
 * whichever path the user picked.
 */
export function UnifiedConnectButton() {
  const { publicKey, email } = useUnifiedWallet();
  const [open, setOpen] = useState(false);

  if (publicKey) {
    const short = publicKey.toBase58();
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md border border-[var(--rule)] px-3 py-2 font-mono text-xs uppercase tracking-wider text-[var(--ink-dim)]"
      >
        {email ?? `${short.slice(0, 4)}…${short.slice(-4)}`}
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-md border border-[var(--brand)] bg-[var(--brand)] px-4 py-2 font-mono text-xs uppercase tracking-wider text-[var(--bg)]"
      >
        Sign in
      </button>
      {open && (
        <div
          role="dialog"
          aria-modal
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[var(--bg)]/80 px-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-[480px] rounded-md border border-[var(--rule)] bg-[var(--bg-elev-1)] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display text-2xl font-bold text-[var(--ink)]">
              Sign in to Vaulx
            </h2>
            <p className="mt-2 text-sm text-[var(--ink-dim)]">
              Continue with Google, email, or your existing Solana wallet.
            </p>
            <div className="mt-6 space-y-3">
              {/* Crossmint options surface (Google / Apple / email / SMS) */}
              <CrossmintWallet />
              {/* Wallet-adapter options (Phantom / Solflare / Backpack) */}
              <WalletMultiButton />
            </div>
            <button
              onClick={() => setOpen(false)}
              className="mt-6 font-mono text-[11px] uppercase tracking-wider text-[var(--ink-muted)]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
```

**Step 4: Run test, verify build**

```bash
pnpm --filter @vaulx/web test -- unified-connect-button
pnpm --filter @vaulx/web build
```

**Step 5: Commit**

```bash
git add apps/web/src/components/vaulx/unified-connect-button.tsx \
        apps/web/src/components/vaulx/__tests__/unified-connect-button.test.tsx
git commit -m "feat(auth): <UnifiedConnectButton> — Crossmint + wallet-adapter combined"
```

---

**End of Phase A.** All 5 tasks landed. Run integration check:

```bash
pnpm --filter @vaulx/web build
pnpm --filter @vaulx/web test
```

Push to remote: `git push origin main`. Deploy to Vercel preview to verify middleware, types, and component render in prod-like env.

---

## Phase B — Appraiser Workspaces

After Phase A ships. Each task touches one of two appraiser personas. Both follow the same shape: queue page + submission form. Online and offline differ in: SLA, photo handling (offline can take own), and submission fields (offline has defect flags).

### Task B.1: `/appraiser/online` job queue

**Files:**
- Create: `apps/web/src/app/appraiser/online/page.tsx`
- Create: `apps/web/src/app/api/appraiser/online/cases/route.ts`

**Step 1: API route — list pending online cases for the authenticated appraiser**

```ts
// apps/web/src/app/api/appraiser/online/cases/route.ts

import { NextRequest, NextResponse } from "next/server";
import type { AppraisalCaseBlinded } from "@vaulx/types";
// supabase server client (existing pattern)

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/appraiser/online/cases
 *
 * Returns blinded cases assigned to the authenticated online appraiser.
 * NEVER returns borrower pubkey, other appraiser identity, or other-appraiser
 * submissions. (Non-Negotiable §0.3 #2 + #3.)
 *
 * Auth: middleware /appraiser/* gate (Task A.4) + appraiser session token.
 */
export async function GET(req: NextRequest) {
  // 1. resolve appraiser_id from session
  // 2. select * from appraisal_case
  //    where online_appraiser_id = appraiser_id
  //      and state in ('online_in_progress', 'online_submitted')
  // 3. project to AppraisalCaseBlinded — only blinded fields
  // 4. return JSON list

  // Skeleton implementation; wire to supabase in B.2 alongside submission
  const cases: AppraisalCaseBlinded[] = []; // TODO supabase fetch
  return NextResponse.json({ ok: true, cases });
}
```

**Step 2: Queue page UI**

```tsx
// apps/web/src/app/appraiser/online/page.tsx

import { headers } from "next/headers";
import type { AppraisalCaseBlinded } from "@vaulx/types";

async function getCases(): Promise<AppraisalCaseBlinded[]> {
  const host = headers().get("host") ?? "localhost:3000";
  const proto = host.startsWith("localhost") ? "http" : "https";
  const res = await fetch(`${proto}://${host}/api/appraiser/online/cases`, {
    cache: "no-store",
    headers: { cookie: headers().get("cookie") ?? "" },
  });
  const data = (await res.json()) as { cases: AppraisalCaseBlinded[] };
  return data.cases;
}

export default async function OnlineAppraiserQueue() {
  const cases = await getCases();
  return (
    <main className="mx-auto max-w-[960px] px-6 py-12">
      <h1 className="font-display text-3xl font-bold">Online appraisal queue</h1>
      <p className="mt-2 text-sm text-[var(--ink-dim)]">
        24h SLA. Submit a USD valuation with confidence range. You see only
        blinded case details — no borrower or other-appraiser identity.
      </p>
      {cases.length === 0 ? (
        <p className="mt-12 text-center font-mono text-xs text-[var(--ink-muted)]">
          No pending cases. Check back later.
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-[var(--rule)]">
          {cases.map((c) => (
            <li key={c.caseCode} className="py-4">
              <a href={`/appraiser/online/${c.caseCode}`} className="block">
                <span className="font-mono text-xs text-[var(--ink-muted)]">{c.caseCode}</span>
                <p className="mt-1 font-display text-lg">
                  {c.assetBrand} {c.assetModel}
                </p>
                <p className="mt-1 text-xs text-[var(--ink-dim)]">
                  Serial …{c.assetSerial4} · SLA {c.slaDeadline}
                </p>
              </a>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
```

**Step 3: Build + smoke**

```bash
pnpm --filter @vaulx/web build
```

**Step 4: Non-Negotiables Check**

- Verify `getCases()` returns ONLY `AppraisalCaseBlinded` fields. No `borrowerPubkey`, no other appraiser id.

**Step 5: Commit**

```bash
git add apps/web/src/app/appraiser/online/page.tsx \
        apps/web/src/app/api/appraiser/online/cases/route.ts
git commit -m "feat(appraiser): /appraiser/online job queue (blinded)"
```

---

### Task B.2: `/appraiser/online/[caseCode]` submission form

**Files:**
- Create: `apps/web/src/app/appraiser/online/[caseCode]/page.tsx`
- Create: `apps/web/src/app/api/appraiser/online/cases/[caseCode]/route.ts`
- Create: `apps/web/src/app/api/appraiser/online/cases/[caseCode]/submit/route.ts`
- Modify: `apps/web/src/app/api/photos/[caseCode]/[idx]/route.ts` (wire fetching)

**Goal:** appraiser fetches case detail (blinded), uploads valuation + confidence range + notes, submits. Server transitions case state to `online_submitted`.

**Step 1: Detail-fetch route**

```ts
// apps/web/src/app/api/appraiser/online/cases/[caseCode]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { isValidCaseCode } from "@/lib/appraisal/case-code";
import type { AppraisalCaseBlinded } from "@vaulx/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { caseCode: string } },
) {
  if (!isValidCaseCode(params.caseCode)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  // 1. supabase: select case row
  // 2. verify req's appraiser_id matches case.online_appraiser_id
  // 3. project to AppraisalCaseBlinded with photoUrls = [/api/photos/{caseCode}/0, ...]
  // (skeleton)
  const blinded: AppraisalCaseBlinded = {
    caseCode: params.caseCode,
    assetBrand: "Rolex",
    assetModel: "Submariner 116610LN",
    assetSerial4: "1234",
    slaDeadline: "2026-04-30T14:00:00Z",
    photoUrls: [],
  };
  return NextResponse.json({ ok: true, case: blinded });
}
```

**Step 2: Submission route**

```ts
// apps/web/src/app/api/appraiser/online/cases/[caseCode]/submit/route.ts

import { NextRequest, NextResponse } from "next/server";
import { isValidCaseCode } from "@/lib/appraisal/case-code";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { caseCode: string } },
) {
  if (!isValidCaseCode(params.caseCode)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const body = (await req.json()) as {
    valueAtoms: string;        // bigint as string
    confidenceLowAtoms: string;
    confidenceHighAtoms: string;
    notes: string;
  };

  // Validate: low ≤ value ≤ high
  // Validate: appraiser is assigned to this case (anti-spoofing)
  // Update appraisal_case: set online_eval_*, online_eval_submitted_at,
  //   transition state to 'online_submitted' (or 'risk_review' if both submitted)
  return NextResponse.json({ ok: true });
}
```

**Step 3: Submission page UI**

```tsx
// apps/web/src/app/appraiser/online/[caseCode]/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { AppraisalCaseBlinded } from "@vaulx/types";

export default function OnlineSubmission() {
  const { caseCode } = useParams<{ caseCode: string }>();
  const [c, setC] = useState<AppraisalCaseBlinded | null>(null);
  const [value, setValue] = useState("");
  const [low, setLow] = useState("");
  const [high, setHigh] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch(`/api/appraiser/online/cases/${caseCode}`)
      .then((r) => r.json())
      .then((d) => setC(d.case));
  }, [caseCode]);

  async function submit() {
    setSubmitting(true);
    const res = await fetch(`/api/appraiser/online/cases/${caseCode}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        valueAtoms: value,
        confidenceLowAtoms: low,
        confidenceHighAtoms: high,
        notes,
      }),
    });
    setSubmitting(false);
    if (res.ok) setDone(true);
  }

  if (done) return <p className="mx-auto max-w-[640px] px-6 py-12">Submitted. Thanks.</p>;
  if (!c) return <p className="mx-auto max-w-[640px] px-6 py-12">Loading…</p>;

  return (
    <main className="mx-auto max-w-[640px] px-6 py-12">
      <p className="font-mono text-xs text-[var(--ink-muted)]">{c.caseCode}</p>
      <h1 className="mt-2 font-display text-3xl">
        {c.assetBrand} {c.assetModel}
      </h1>
      <p className="mt-1 text-xs text-[var(--ink-dim)]">Serial …{c.assetSerial4}</p>

      <section className="mt-8">
        <h2 className="text-sm uppercase tracking-wider text-[var(--ink-muted)]">Photos (borrower-uploaded)</h2>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {c.photoUrls.map((url, i) => (
            <img key={i} src={url} alt="" className="aspect-square w-full object-cover" />
          ))}
        </div>
      </section>

      <section className="mt-12 space-y-4">
        <label className="block">
          <span className="text-xs uppercase tracking-wider">Valuation (USDC atoms)</span>
          <input
            inputMode="numeric"
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/[^\d]/g, ""))}
            className="mt-2 w-full border border-[var(--rule)] bg-[var(--bg)] px-3 py-2 font-mono"
          />
        </label>
        <label className="block">
          <span className="text-xs uppercase tracking-wider">Confidence low</span>
          <input
            inputMode="numeric"
            value={low}
            onChange={(e) => setLow(e.target.value.replace(/[^\d]/g, ""))}
            className="mt-2 w-full border border-[var(--rule)] bg-[var(--bg)] px-3 py-2 font-mono"
          />
        </label>
        <label className="block">
          <span className="text-xs uppercase tracking-wider">Confidence high</span>
          <input
            inputMode="numeric"
            value={high}
            onChange={(e) => setHigh(e.target.value.replace(/[^\d]/g, ""))}
            className="mt-2 w-full border border-[var(--rule)] bg-[var(--bg)] px-3 py-2 font-mono"
          />
        </label>
        <label className="block">
          <span className="text-xs uppercase tracking-wider">Notes</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={6}
            className="mt-2 w-full border border-[var(--rule)] bg-[var(--bg)] px-3 py-2 font-mono"
          />
        </label>
        <button
          onClick={submit}
          disabled={submitting || !value || !low || !high}
          className="mt-6 w-full border border-[var(--brand)] bg-[var(--brand)] px-5 py-3 font-mono text-xs uppercase tracking-wider text-[var(--bg)] disabled:opacity-30"
        >
          {submitting ? "Submitting…" : "Submit valuation"}
        </button>
      </section>
    </main>
  );
}
```

**Step 4: Wire `/api/photos/[caseCode]/[idx]` properly**

Replace the 501 placeholder from A.3 with actual fetch + EXIF strip:

```ts
// (replace the GET in apps/web/src/app/api/photos/[caseCode]/[idx]/route.ts)

import { stripExif } from "@/lib/photos/exif-strip";
// supabase client + fetch from appraisal_photo

export async function GET(req: NextRequest, { params }: { params: { caseCode: string; idx: string } }) {
  if (!isValidCaseCode(params.caseCode)) return NextResponse.json({ ok: false }, { status: 400 });
  const idx = parseInt(params.idx, 10);
  // 1. supabase: select original_url from appraisal_photo where case_code = params.caseCode order by uploaded_at limit 1 offset idx
  // 2. fetch original_url bytes
  // 3. stripExif
  // 4. return image/jpeg
  return new NextResponse("not yet wired with supabase", { status: 501 });
}
```

The supabase wiring is delegated to a small helper task in this same Phase B.2 (or split into B.2a if desired); the contract above is what the page expects.

**Step 5: Build + commit**

```bash
pnpm --filter @vaulx/web build
git add apps/web/src/app/appraiser/online/[caseCode]/page.tsx \
        apps/web/src/app/api/appraiser/online/cases/[caseCode]/route.ts \
        apps/web/src/app/api/appraiser/online/cases/[caseCode]/submit/route.ts \
        apps/web/src/app/api/photos/[caseCode]/[idx]/route.ts
git commit -m "feat(appraiser): online submission form + case detail + photo serving"
```

---

### Task B.3: `/appraiser/offline` job queue

**Files:**
- Create: `apps/web/src/app/appraiser/offline/page.tsx`
- Create: `apps/web/src/app/api/appraiser/offline/cases/route.ts`

Mirror of B.1 with: 48h SLA, only show cases where state == `offline_in_progress`, queue label "Offline appraisal — physical inspection".

**Implementation:** copy B.1 structure with `online` → `offline` substitutions. SLA copy: "48h SLA. Physical inspection at vault."

**Commit message:** `feat(appraiser): /appraiser/offline job queue (blinded)`

---

### Task B.4: `/appraiser/offline/[caseCode]` submission + own photos + defect flags

**Files:**
- Create: `apps/web/src/app/appraiser/offline/[caseCode]/page.tsx`
- Create: `apps/web/src/app/api/appraiser/offline/cases/[caseCode]/route.ts`
- Create: `apps/web/src/app/api/appraiser/offline/cases/[caseCode]/submit/route.ts`
- Create: `apps/web/src/app/api/appraiser/offline/cases/[caseCode]/upload-photo/route.ts`

**Goal:** like B.2 but with:
- Photo upload (offline can take own); each upload runs through `stripExif` server-side before storage
- Defect-flag checklist (boolean fields per `DefectFlags` type from Task A.1)
- Authenticity verdict (radio: `authentic` / `suspect_counterfeit` / `stolen_flag`)

**Photo upload route:**

```ts
// apps/web/src/app/api/appraiser/offline/cases/[caseCode]/upload-photo/route.ts

import { NextRequest, NextResponse } from "next/server";
import { isValidCaseCode } from "@/lib/appraisal/case-code";
import { stripExif } from "@/lib/photos/exif-strip";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { caseCode: string } },
) {
  if (!isValidCaseCode(params.caseCode)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const buf = Buffer.from(await req.arrayBuffer());
  const stripped = await stripExif(buf);
  // 1. upload `stripped` to supabase storage
  // 2. insert appraisal_photo row with source='offline_appraiser_capture'
  // 3. return new photo idx
  return NextResponse.json({ ok: true, idx: 0 });
}
```

**Submission UI extension:** form has the same fields as B.2 PLUS:
- Per-defect checkboxes mapped to `DefectFlags` from `@vaulx/types`
- Authenticity radio
- "Upload your photos" file input wired to `upload-photo` route

**Step: Non-Negotiables Check**

Confirm:
- Submission doesn't expose other-appraiser data
- Photos are EXIF-stripped before storage (sample upload + read with `exiftool`)

**Commit message:** `feat(appraiser): offline submission + own-photo upload + defect flags`

---

**End of Phase B.** Two appraiser personas with full blinded workspaces.

---

## Phase C — Risk Officer Workspace

After Phase A + at least B.2 + B.4 ship (so submissions exist to review).

### Task C.1: `/admin/evaluations` work queue

**Files:**
- Create: `apps/web/src/app/admin/evaluations/page.tsx`
- Create: `apps/web/src/app/api/admin/evaluations/route.ts`

**Step 1: API route — list cases ready for review**

```ts
// apps/web/src/app/api/admin/evaluations/route.ts

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/evaluations
 *
 * Risk Officer view. Returns FULL case rows (with appraiser identities,
 * borrower pubkey, all 3 evals side-by-side). UNLIKE the appraiser endpoints
 * which return only blinded data. Risk Officer is the ONLY persona that
 * sees this surface (Non-Negotiable §0.3 #3).
 *
 * Auth: middleware /admin/* gate (Task A.4).
 */
export async function GET(req: NextRequest) {
  // 1. select * from appraisal_case
  //    where state = 'risk_review'
  //    order by offline_eval_submitted_at asc (oldest first)
  // 2. join appraiser table for online_appraiser + offline_appraiser names
  // 3. return full rows (NOT blinded)
  return NextResponse.json({ ok: true, cases: [] });
}
```

**Step 2: Queue page**

Renders a table of pending cases. Each row shows: caseCode, asset, all 3 eval values + spread %, "open" link to `/admin/evaluations/[reqId]`.

```tsx
// apps/web/src/app/admin/evaluations/page.tsx
// (skeleton — full implementation per A-pattern)

import { headers } from "next/headers";

async function getCases() {
  const host = headers().get("host") ?? "localhost:3000";
  const res = await fetch(`http://${host}/api/admin/evaluations`, {
    cache: "no-store",
    headers: { cookie: headers().get("cookie") ?? "" },
  });
  return ((await res.json()) as { cases: any[] }).cases;
}

export default async function EvaluationsQueue() {
  const cases = await getCases();
  return (
    <main className="mx-auto max-w-[1200px] px-6 py-12">
      <h1 className="font-display text-3xl">Risk review queue</h1>
      <p className="mt-2 text-sm text-[var(--ink-dim)]">
        Review trilateral evaluations and assign prudent value. Bounded override:
        prudent value must be within [min, max] of the 3 evaluations.
      </p>
      <table className="mt-8 w-full text-sm">
        <thead>
          <tr className="text-left font-mono text-xs uppercase text-[var(--ink-muted)]">
            <th className="py-2">Case</th>
            <th>Asset</th>
            <th>API</th>
            <th>Online</th>
            <th>Offline</th>
            <th>Spread</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {cases.map((c) => (
            <tr key={c.caseCode} className="border-t border-[var(--rule)]">
              <td className="py-3 font-mono">{c.caseCode}</td>
              <td>
                {c.assetBrand} {c.assetModel}
              </td>
              <td className="font-mono">${(Number(c.apiAnchorValueAtoms) / 1e6).toFixed(0)}</td>
              <td className="font-mono">${(Number(c.onlineEvalValueAtoms) / 1e6).toFixed(0)}</td>
              <td className="font-mono">${(Number(c.offlineEvalValueAtoms) / 1e6).toFixed(0)}</td>
              <td className="font-mono">{computeSpread(c)}%</td>
              <td>
                <a href={`/admin/evaluations/${c.id}`} className="text-[var(--brand)]">
                  Open →
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

function computeSpread(c: any): string {
  const vals = [c.apiAnchorValueAtoms, c.onlineEvalValueAtoms, c.offlineEvalValueAtoms]
    .map(Number)
    .filter(Boolean);
  if (vals.length < 3) return "—";
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  return (((max - min) / min) * 100).toFixed(1);
}
```

**Step 3: Commit**

```bash
git add apps/web/src/app/admin/evaluations/page.tsx \
        apps/web/src/app/api/admin/evaluations/route.ts
git commit -m "feat(risk-officer): /admin/evaluations work queue"
```

---

### Task C.2: `/admin/evaluations/[reqId]` single review with bounded override

**Files:**
- Create: `apps/web/src/app/admin/evaluations/[reqId]/page.tsx`
- Create: `apps/web/src/app/api/admin/evaluations/[reqId]/route.ts`
- Create: `apps/web/src/app/api/admin/evaluations/[reqId]/decide/route.ts`
- Create: `apps/web/src/components/vaulx/bounded-override-slider.tsx`

**Goal:** show all 3 evals + photos + appraiser names + defect flags. Risk Officer enters prudent value; client AND server validate `prudent_value ∈ [min, max]` of 3 evals (strict α). Decision actions: accept / audit / decline.

**Step 1: Decide endpoint with SERVER-SIDE bound enforcement (CRITICAL)**

```ts
// apps/web/src/app/api/admin/evaluations/[reqId]/decide/route.ts

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DecideBody = {
  decision: "accept" | "audit" | "decline";
  prudentValueAtoms?: string;  // required iff decision === 'accept'
  reason: string;
};

export async function POST(
  req: NextRequest,
  { params }: { params: { reqId: string } },
) {
  const body = (await req.json()) as DecideBody;

  // 1. fetch case row by id
  // 2. verify state === 'risk_review'
  // 3. compute bounds: min/max of [api_anchor, online_eval, offline_eval] values
  // 4. if decision === 'accept': REQUIRE prudent ∈ [min, max] strict
  //    if outside → 422 Unprocessable Entity, "out of bounds; use audit/decline"
  // 5. update row: risk_officer_decision, prudent_value_atoms, decision_reason,
  //    decided_at, transition state to 'decided'
  // 6. trigger downstream: notify borrower (notification queue),
  //    on accept → mint final-terms record + (optionally) on-chain attestation

  // skeleton:
  return NextResponse.json({ ok: true });
}
```

**Step 2: `<BoundedOverrideSlider>` component**

```tsx
// apps/web/src/components/vaulx/bounded-override-slider.tsx

"use client";

import { useState } from "react";

export function BoundedOverrideSlider({
  minAtoms,
  maxAtoms,
  initialAtoms,
  onChange,
}: {
  minAtoms: bigint;
  maxAtoms: bigint;
  initialAtoms: bigint;
  onChange: (v: bigint) => void;
}) {
  const minNum = Number(minAtoms) / 1e6;
  const maxNum = Number(maxAtoms) / 1e6;
  const [val, setVal] = useState(Number(initialAtoms) / 1e6);

  function update(n: number) {
    const clamped = Math.max(minNum, Math.min(maxNum, n));
    setVal(clamped);
    onChange(BigInt(Math.round(clamped * 1e6)));
  }

  return (
    <div>
      <div className="flex items-center justify-between font-mono text-xs text-[var(--ink-muted)]">
        <span>${minNum.toFixed(0)} (min)</span>
        <span className="text-[var(--brand)] text-lg">${val.toFixed(0)}</span>
        <span>${maxNum.toFixed(0)} (max)</span>
      </div>
      <input
        type="range"
        min={minNum}
        max={maxNum}
        step={1}
        value={val}
        onChange={(e) => update(parseFloat(e.target.value))}
        className="mt-3 w-full"
      />
      <input
        type="number"
        value={val}
        onChange={(e) => update(parseFloat(e.target.value))}
        min={minNum}
        max={maxNum}
        className="mt-3 w-full border border-[var(--rule)] bg-[var(--bg)] px-3 py-2 font-mono"
      />
      <p className="mt-2 text-xs text-[var(--ink-dim)]">
        Strict bound: prudent value must be within [{minNum.toFixed(0)}, {maxNum.toFixed(0)}].
        Outside → use Audit or Decline.
      </p>
    </div>
  );
}
```

**Step 3: Review page wiring all 3 evals + slider**

Long page that renders: all 3 evaluation cards (API, online with name, offline with name + defects + own photos), `<BoundedOverrideSlider>`, three decision buttons (Accept / Audit / Decline) each with reason textarea.

**Step 4: Test the bound enforcement on the server**

```ts
// apps/web/src/app/api/admin/evaluations/[reqId]/__tests__/decide.test.ts

import { describe, it, expect, vi } from "vitest";
import { POST } from "../decide/route";

// Mock supabase to return a fixture case
vi.mock("@/lib/supabase/server", () => ({
  // returns a case with api=10000, online=8000, offline=12000
  // → bounds [8000, 12000]
}));

describe("decide endpoint bound enforcement", () => {
  it("rejects out-of-bounds prudent value", async () => {
    const req = new Request("http://localhost/...", {
      method: "POST",
      body: JSON.stringify({
        decision: "accept",
        prudentValueAtoms: "7000000000",  // below min of 8000 USDC
        reason: "manual override",
      }),
    });
    const res = await POST(req as any, { params: { reqId: "fixture-id" } });
    expect(res.status).toBe(422);
  });

  it("accepts in-bounds prudent value", async () => {
    const req = new Request("http://localhost/...", {
      method: "POST",
      body: JSON.stringify({
        decision: "accept",
        prudentValueAtoms: "9000000000", // 9000 USDC, within [8000, 12000]
        reason: "ok",
      }),
    });
    const res = await POST(req as any, { params: { reqId: "fixture-id" } });
    expect(res.status).toBe(200);
  });
});
```

**Step 5: Non-Negotiables Check**

Critical: confirm server returns 422 when prudent is out of bounds, regardless of client validation. Client must NOT be the only enforcer (Non-Negotiable §0.3 #5).

**Step 6: Commit**

```bash
git add apps/web/src/app/admin/evaluations/[reqId]/page.tsx \
        apps/web/src/app/api/admin/evaluations/[reqId]/route.ts \
        apps/web/src/app/api/admin/evaluations/[reqId]/decide/route.ts \
        apps/web/src/components/vaulx/bounded-override-slider.tsx \
        apps/web/src/app/api/admin/evaluations/[reqId]/__tests__/decide.test.ts
git commit -m "feat(risk-officer): single review + bounded override (server-enforced)"
```

---

**End of Phase C.** Risk Officer can review trilateral and assign prudent value with hard bound enforcement.

---

## Phase D — Borrower flow rewrite

Parallel with B+C. Each task touches one route.

### Task D.1: REWRITE `/demo/borrow/loan-offer/[reqId]` → `/demo/borrow/indicative-terms/[reqId]`

**Files:**
- Modify: `apps/web/src/app/demo/borrow/loan-offer/[reqId]/page.tsx` → semantics: indicative only; no CCB sign here
- Update redirect or rename file path (TBD: keep current file path or move?)

**Goal:** the page becomes "INDICATIVE terms based on online API anchor only — non-binding". Removes CCB acceptance from this screen. Adds a "Continue: ship to vault" CTA that triggers custody booking.

**Step 1: Read current page (already done in earlier session).** It's the file at `apps/web/src/app/demo/borrow/loan-offer/[reqId]/page.tsx`.

**Step 2: Rewrite the page with new semantics**

Key changes:
- Title: "Indicative terms" (not "Loan offer")
- Banner: "These are indicative only. Final terms confirmed after physical inspection at our vault."
- Remove CCB acceptance UI from this screen
- Single CTA: "Continue: ship to vault" → routes to `/demo/borrow/custody`
- Add a link/note: "Based on API anchor only — online and offline appraisals follow."

**Step 3: Build + commit**

```bash
git add apps/web/src/app/demo/borrow/loan-offer/[reqId]/page.tsx
git commit -m "feat(borrow): rewrite loan-offer as indicative-only (pre-custody)"
```

---

### Task D.2: BUILD `/demo/borrow/final-terms/[reqId]`

**Files:**
- Create: `apps/web/src/app/demo/borrow/final-terms/[reqId]/page.tsx`
- Create: `apps/web/src/app/api/borrow/final-terms/[reqId]/route.ts`

**Goal:** post-Risk-Officer-review. Show: indicative was $X, prudent eval is $Y, final terms reflect $Y. Two CTAs: "Accept and disburse" OR "Decline and request asset return".

**Step 1: API route to fetch case + final terms**

```ts
// apps/web/src/app/api/borrow/final-terms/[reqId]/route.ts

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { reqId: string } },
) {
  // 1. fetch appraisal_case where loan_request_id = reqId
  // 2. verify state === 'decided' && risk_officer_decision === 'accept'
  // 3. compute final terms from prudent_value_atoms (LTV, rate, term)
  // 4. return: { indicativeAtoms, prudentAtoms, ltvBps, rateBps, termDays, monthlyPaymentAtoms }
  return NextResponse.json({ ok: true /* ... */ });
}
```

**Step 2: Page UI**

```tsx
// apps/web/src/app/demo/borrow/final-terms/[reqId]/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function FinalTermsPage() {
  const { reqId } = useParams<{ reqId: string }>();
  const router = useRouter();
  const [terms, setTerms] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/borrow/final-terms/${reqId}`).then((r) => r.json()).then((d) => setTerms(d));
  }, [reqId]);

  async function accept() {
    await fetch(`/api/borrow/final-terms/${reqId}/accept`, { method: "POST" });
    router.push(`/demo/borrow/disburse?reqId=${reqId}`);
  }

  async function decline() {
    router.push(`/demo/borrow/return-asset/${reqId}`);
  }

  if (!terms) return <p>Loading…</p>;

  return (
    <main className="mx-auto max-w-[640px] px-6 py-12">
      <p className="font-mono text-xs uppercase tracking-wider text-[var(--ink-muted)]">
        Step 7 — Final terms
      </p>
      <h1 className="mt-3 font-display text-3xl font-bold">Final terms</h1>

      <section className="mt-8 rounded-md border border-[var(--rule)] p-6">
        <p className="text-sm text-[var(--ink-dim)]">Indicative valuation (online):</p>
        <p className="mt-1 font-mono text-2xl">${(terms.indicativeAtoms / 1e6).toFixed(0)}</p>

        <p className="mt-6 text-sm text-[var(--ink-dim)]">
          Prudent valuation after physical inspection:
        </p>
        <p className="mt-1 font-mono text-3xl text-[var(--brand)]">
          ${(terms.prudentAtoms / 1e6).toFixed(0)}
        </p>

        <hr className="my-6 border-[var(--rule)]" />

        <dl className="space-y-2 font-mono text-sm">
          <div className="flex justify-between">
            <dt>Loan amount:</dt>
            <dd>${((terms.prudentAtoms * terms.ltvBps) / 10000 / 1e6).toFixed(0)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Rate:</dt>
            <dd>{(terms.rateBps / 100).toFixed(2)}% / month</dd>
          </div>
          <div className="flex justify-between">
            <dt>Term:</dt>
            <dd>{terms.termDays} days</dd>
          </div>
          <div className="flex justify-between">
            <dt>Monthly payment:</dt>
            <dd>${(terms.monthlyPaymentAtoms / 1e6).toFixed(0)}</dd>
          </div>
        </dl>
      </section>

      <div className="mt-8 grid grid-cols-2 gap-3">
        <button
          onClick={decline}
          className="border border-[var(--rule)] px-5 py-3 font-mono text-xs uppercase tracking-wider"
        >
          Decline & return asset
        </button>
        <button
          onClick={accept}
          className="border border-[var(--brand)] bg-[var(--brand)] px-5 py-3 font-mono text-xs uppercase tracking-wider text-[var(--bg)]"
        >
          Accept & disburse
        </button>
      </div>
    </main>
  );
}
```

**Step 3: Commit**

```bash
git add apps/web/src/app/demo/borrow/final-terms/[reqId]/page.tsx \
        apps/web/src/app/api/borrow/final-terms/[reqId]/route.ts
git commit -m "feat(borrow): /demo/borrow/final-terms — accept/decline post-Risk-Officer"
```

---

### Task D.3: BUILD `/demo/borrow/return-asset/[reqId]`

**Files:**
- Create: `apps/web/src/app/demo/borrow/return-asset/[reqId]/page.tsx`
- Create: `apps/web/src/app/api/borrow/return-asset/[reqId]/route.ts`

**Goal:** decline path. Confirms decline; triggers custodian release order; shows return shipping ETA.

Page renders: "Asset return scheduled. Tracking: <courier-id>. Estimated delivery: <date>." Plus a link back to `/demo/borrow/onboard`.

API route: updates appraisal_case state to `declined`; triggers webhook to custodian (real or mock); returns tracking placeholder for demo.

**Commit:** `feat(borrow): /demo/borrow/return-asset — decline → custodian release flow`

---

### Task D.4: BUILD `/demo/borrow/loans/[trdc]` (per-loan detail)

**Files:**
- Create: `apps/web/src/app/demo/borrow/loans/[trdc]/page.tsx`

**Goal:** dashboard detail. Shows for the active loan: amount disbursed, accrued interest, remaining principal, LTV (live based on current oracle price), days to maturity, next payment date, full amortization schedule, payment history. Action buttons: Pay installment / Renew / Repay full.

This is the MOST DETAILED per-loan screen — design it carefully. Reads on-chain Loan PDA + amortization from `vaulx-terms` package.

**Commit:** `feat(borrow): /demo/borrow/loans/[trdc] per-loan detail dashboard`

---

### Task D.5: BUILD `/demo/borrow/pay/[trdc]` (installment pay)

**Files:**
- Create: `apps/web/src/app/demo/borrow/pay/[trdc]/page.tsx`
- Modify: `apps/web/src/lib/chain/loan.ts` (add `usePayInstallment` hook if not exists; on-chain ix already exists per `programs/loan/src/lib.rs::pay_installment`)

**Goal:** installment payment screen. Reads next-due amount; user signs USDC transfer to vault; on-chain `loan.pay_installment` ix runs; schedule updates. Per-loan dashboard refreshes after success.

The on-chain `pay_installment` ix already exists in the loan program (verified in earlier session). This task is wiring the FE.

**Commit:** `feat(borrow): /demo/borrow/pay — installment payment with on-chain settlement`

---

**End of Phase D.** Borrower flow now has the full two-stage commitment + per-loan management.

---

## Phase E — Lender vault simplification

Independent of A-D; can run in parallel.

### Task E.1: Collapse vault tranches 4→2

**Files:**
- Modify: `apps/web/src/app/demo/_fixtures/vault-tranches.ts`

**Goal:** reduce 4 fixture rows to 2: `usdc` (USDC vault) and `local` (Local/BRL vault). Drop institutional/retail split.

```ts
// apps/web/src/app/demo/_fixtures/vault-tranches.ts

export const TRANCHES: VaultTranche[] = [
  {
    id: "usdc",
    name: "USDC vault",
    audience: "Open to all eligible lenders",
    risk: "senior",  // simplified
    apy: 8.5,
    tvl: 2_400_000,
    currency: "USDC",
    // ...
  },
  {
    id: "local",
    name: "Local (BRL) vault",
    audience: "Brazilian residents — FIDC quota wrapper (post legal-readiness)",
    risk: "subordinate",
    apy: 11.0,
    tvl: 850_000,
    currency: "BRL",
    // ...
  },
];
```

**Step:** Update any references to old IDs (`retail-usdc`, `retail-brl`, `inst-usdc`, `inst-brl`) in components / tests.

```bash
grep -rn "retail-usdc\|retail-brl\|inst-usdc\|inst-brl" apps/web/src/
```

Update each reference to the new IDs.

**Commit:** `feat(lend): simplify vault tranches 4→2 (USDC + Local)`

---

### Task E.2: Merge two deposit code paths

**Files:**
- Refactor: extract a shared `<DepositForm>` from `apps/web/src/app/demo/_components/lend-deposit-panel.tsx` (real on-chain) and `apps/web/src/app/demo/lend/vaults/[id]/page.tsx` (mocked setTimeout)
- Both pages now call the same component, parameterized by `mode: "real" | "mock"` (or env-derived)

**Goal:** single source of truth for deposit. Removes the redundancy that allowed `/demo/lend/vaults/[id]` to skip the KYC gate originally.

**Commit:** `refactor(lend): unify two deposit code paths into <DepositForm>`

---

**End of Phase E.** Lender flow simplified.

---

## Phase F — Cleanup gate (after A-E green)

Strict gate. Runs only after all preceding phases pass `pnpm build` + `pnpm test` + Playwright e2e.

### Task F.1: Delete 16 legacy routes

**Files (delete entire directories):**

```
apps/web/src/app/demo/borrow/verify-id/
apps/web/src/app/demo/dev/bezel/
apps/web/src/app/borrow/new/
apps/web/src/app/borrow/loans/[trdc]/disburse/
apps/web/src/app/borrow/loans/[trdc]/renew/
apps/web/src/app/borrow/loans/[trdc]/repaid/
apps/web/src/app/borrow/loans/[trdc]/repay/
apps/web/src/app/lend/vaults/[id]/
apps/web/src/app/lend/auctions/[id]/
apps/web/src/app/lend/page.tsx
apps/web/src/app/lend/vaults/page.tsx
apps/web/src/app/lend/auctions/page.tsx
```

(Note: `/borrow/loans/[trdc]/pay` is MIGRATED in Phase D.5, not deleted.)

```bash
rm -rf apps/web/src/app/demo/borrow/verify-id
rm -rf apps/web/src/app/demo/dev/bezel
rm -rf apps/web/src/app/borrow/new
rm apps/web/src/app/borrow/loans/[trdc]/disburse/page.tsx
rm apps/web/src/app/borrow/loans/[trdc]/renew/page.tsx
rm apps/web/src/app/borrow/loans/[trdc]/repaid/page.tsx
rm apps/web/src/app/borrow/loans/[trdc]/repay/page.tsx
# (Note: keep /borrow/loans/[trdc]/pay until D.5 migration confirms working)
rm -rf apps/web/src/app/lend/vaults/[id]
rm -rf apps/web/src/app/lend/auctions/[id]
rm apps/web/src/app/lend/page.tsx
rm apps/web/src/app/lend/vaults/page.tsx
rm apps/web/src/app/lend/auctions/page.tsx
```

Verify build green: `pnpm --filter @vaulx/web build`. Fix any remaining references.

**Commit:** `chore(cleanup): delete 16 legacy routes per journey-doc cut list`

---

### Task F.2: Update `next.config.mjs` redirects

**Files:**
- Modify: `apps/web/next.config.mjs`

Drop:
- `/borrow/verify-id` → `/demo/borrow/verify-id`
- `/borrow/verify-id/callback` → `/demo/borrow/onboard`
- `/borrow/verify-id/govbr-login` → `/demo/borrow/verify-id`
- `/borrow/verify-id/redirecting` → `/demo/borrow/verify-id`

Add:
- `/lend/vaults/:id*` → `/demo/lend/vaults/:id*`
- `/lend/auctions/:id*` → `/demo/auction/:id*`
- `/borrow/loans/:trdc/:rest*` → `/demo/borrow/dashboard`
- `/borrow/new/:rest*` → `/demo/borrow/onboard`

**Commit:** `chore(cleanup): redirects updated for deleted legacy routes`

---

### Task F.3: Remove `lib/govbr/` + dead components

**Files (delete):**
```
apps/web/src/lib/govbr/   (entire directory)
apps/web/src/components/vaulx/govbr-gate.tsx
apps/web/src/components/vaulx/identity-gates.tsx
```

```bash
grep -rn "govbr-gate\|identity-gates\|@/lib/govbr" apps/web/src/  # verify no remaining refs
rm -rf apps/web/src/lib/govbr
rm apps/web/src/components/vaulx/govbr-gate.tsx
rm apps/web/src/components/vaulx/identity-gates.tsx
```

Build green: `pnpm --filter @vaulx/web build`.

**Commit:** `chore(cleanup): remove gov.br lib + dead identity-gates components`

---

### Task F.4: Strip `civic` + `govbr` from `DemoSession` types

**Files:**
- Modify: `apps/web/src/app/demo/_lib/types.ts`
- Modify: `apps/web/src/app/demo/_lib/use-demo-session.ts`
- Modify: any test referring to these fields

```ts
// apps/web/src/app/demo/_lib/types.ts (after edit)

export type DemoSession = {
  sessionId: string;
  startedAt: number;
  // civic + govbr fields REMOVED — see commit history for migration
  wallet: { provider?: "crossmint"; pubkey?: string; email?: string };
  watch?: { ... };
  loan?: { ... };
  tour: { ... };
  mocksDismissed: string[];
};
```

Update `use-demo-session.ts` initial state. Update any tour-step refs that mentioned the dead fields.

```bash
grep -rn "session.civic\|session.govbr\|civic.verifiedAt\|govbr.verifiedAt" apps/web/src/  # MUST return zero
```

Build + tests green.

**Commit:** `chore(types): strip civic + govbr fields from DemoSession`

---

### Task F.5: Run full verification

Final verification before declaring Phase F done:

```bash
pnpm --filter @vaulx/web build                    # green
pnpm --filter @vaulx/web test                      # all passing
pnpm --filter @vaulx/web exec playwright test      # 27+ passing on prod URL
PATH="$HOME/.local/share/solana/install/active_release/bin:$HOME/.cargo/bin:$PATH" \
  COPYFILE_DISABLE=1 anchor test --skip-build      # 69 passing
```

If everything green: push, deploy preview, smoke-test on preview URL.

**Commit:** `verify(phase-f): all suites green after cleanup` (empty commit `--allow-empty`)

---

## Phase G — Polish

After cleanup. Lower priority; can slip post-hackathon if time-pressed.

### Task G.1: Custodian webhook contract spec

**Files:**
- Create: `docs/architecture/2026-04-29-vaulx-custodian-webhook-spec.md`

Document the HMAC-signed webhook contract from journey-doc §2.5. Include: HTTP method, headers, body schema, idempotency rules, security model, per-custodian signing-key provisioning workflow, sample curl + sample server pseudocode.

**Commit:** `docs(custodian): webhook contract spec for partner integrations`

---

### Task G.2 (optional): Per-custodian signing-key whitelist on-chain

If time permits: extend `programs/vault/src/lib.rs::confirm_custody` to accept any whitelisted custodian signer (not just operator). Whitelist managed via an admin instruction. Not strictly required for hackathon demo (operator key can sign all custodian confirms during demo).

**Defer to post-hackathon if time-pressed.**

---

## Final verification

After Phase G (or whenever stopping point reached):

```bash
# Build matrix
pnpm --filter @vaulx/web build
pnpm --filter @vaulx/web test
pnpm --filter @vaulx/web exec playwright test
anchor test --skip-build

# Static checks
grep -rn "civic\|govbr\|@/lib/govbr" apps/web/src/  # zero matches
grep -rn "loan-offer/\[reqId\].*Accept\|loan-offer/\[reqId\].*CCB" apps/web/src/  # CCB acceptance moved to final-terms

# Manual smoke on Vercel preview
# - Borrower flow: register → indicative-terms → custody → final-terms → disburse OR return-asset
# - Online appraiser: queue → submission
# - Offline appraiser: queue → submission with photos + defects
# - Risk Officer: queue → review → bounded override → decision
# - Lender: 2 vaults visible, deposit triggers KYC gate, real on-chain
# - Admin: basic-auth required on /admin/*, /custodian/*, /appraiser/*
```

If all green: Phase G OPTIONAL items can roll over to post-hackathon. The demo is shippable.

---

## Plan complete

Plan saved to `docs/plans/2026-04-29-vaulx-gamma-scope-implementation-plan.md`.

**Two execution options:**

1. **Subagent-Driven (this session)** — I dispatch fresh subagent per task, review between tasks. Phases A run 5 in parallel; Phases B/C/D run multiple in parallel after A; Phase F serial cleanup. Estimated 5-7 sequential rounds.

2. **Parallel Session (separate)** — Open new session with `superpowers:executing-plans`, batch execution with checkpoints.

**Recommendation:** Option 1 (Subagent-Driven). Phase A's parallelism + B/C/D's parallelism + the dependency-graph in §8 of the journey doc are all designed for this orchestration model. The user explicitly chose γ scope expecting AI-agent parallel execution.

**Which approach?**
