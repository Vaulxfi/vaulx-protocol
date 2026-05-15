# Fix — ccb-storage.ts anon-key RLS denial

**Date:** 2026-05-14
**Branch:** `fix/ccb-storage-anon-rls`
**Spec owner:** senior architect (this session)
**Integrator:** subagent (general-purpose), briefed against this file
**Gates:** CI, QA review, **security review (file IO + wallet auth)**, operator ACK

---

## Goal

Replace the client-side anon-key upload in `apps/web/src/lib/chain/ccb-storage.ts` with a server-mediated, wallet-signature-authenticated upload route that uses the Supabase service-role key.

Reason: Wave 0 (PR #10) makes `ccb-pdfs` a private bucket with **no** anon-accessible RLS policies. The current client upload uses the anon key and will silently fail post-merge. Discovered during Wave 0 security review.

---

## Auth model (corrected from the original chip task)

The original chip task said "authenticate via session." That was wrong. The Vaulx Next.js app does **not** use Supabase Auth. Identity is wallet-based:

- Frontend connects a Solana wallet via `useUnifiedWallet()` (Crossmint + `@solana/wallet-adapter`)
- Money-touching actions are gated by an on-chain `kyc_attestation` PDA derived from the wallet pubkey (`apps/web/src/lib/sumsub/attestation.ts`, `apps/web/src/lib/use-kyc-gate.tsx`)
- Server-side ops use `loadOperatorKeypair` (protocol operator), not user sessions

The CCB upload route therefore authenticates the caller via a **signed canonical payload**, not a session cookie.

---

## Contract

### Client → Server request
`POST /api/ccb-pdfs/upload`

Body (multipart/form-data):
- `wallet` — base58 wallet pubkey (string)
- `loanId` — base58 loan PDA pubkey (string)
- `pdfBytes` — application/pdf file
- `signature` — base58 ed25519 signature over the canonical payload (string)
- `timestamp` — unix-seconds the client minted the request (string)

Canonical payload signed by the client (UTF-8, exact form):
```
vaulx:ccb-upload\n<wallet>\n<loanId>\n<sha256-hex-of-pdfBytes>\n<timestamp>
```

The `vaulx:ccb-upload` prefix is the namespace. SHA-256 hex is lowercase. Newline separator is `\n` (LF, not CRLF).

### Server verification (in order)
1. **Freshness:** `|now - timestamp| ≤ 300s`. Reject `408 stale_timestamp` otherwise. Mirrors the bridge's 5-min window (`site/app/Http/Controllers/Api/BridgeWebhookController.php`).
2. **PDF size:** ≤ 5 MB. Reject `413 file_too_large` otherwise.
3. **PDF content type:** must be `application/pdf` magic-byte sniff (`%PDF-`). Reject `415 invalid_pdf` otherwise.
4. **Recompute SHA-256** of the received bytes; reject `400 hash_mismatch` if it disagrees with what the client claimed in the canonical payload.
5. **Verify ed25519 signature** of the canonical payload (using `tweetnacl` — already a transitive dep of `@solana/web3.js` so no new dep needed) against the claimed `wallet` pubkey. Reject `401 bad_signature` otherwise.
6. **KYC gate (optional, see "Open question" below):** look up the wallet's `kyc_attestation` PDA on-chain via the existing helper at `apps/web/src/lib/sumsub/attestation.ts`. If absent or expired, reject `403 kyc_required`. **This step is gated by a feature flag** so it can be wired up but disabled during Devnet demo flows that haven't onboarded through Sumsub yet.

### Storage write
On success:
- Upload to `ccb-pdfs/<wallet>/<loanId>.pdf` using the **server-side** `createServerClient(url, SUPABASE_SERVICE_ROLE_KEY)` from `packages/supabase/src/server.ts` (existing — do not create a new client factory).
- `upsert: true` (preserves the current `ccb-storage.ts` behavior).
- Return `{ path: 'ccb-pdfs/<wallet>/<loanId>.pdf' }` with HTTP 200.

### Response shapes
- `200 OK` → `{ ok: true, path: string }`
- `4xx` → `{ ok: false, error: string }` where `error` matches one of the error codes above
- `5xx` → `{ ok: false, error: 'persist_failed' }` + log

---

## Files to change

### Add
- `apps/web/src/app/api/ccb-pdfs/upload/route.ts` — the new route handler. Follow the existing route handler style in `apps/web/src/app/api/auctions/route.ts` (Next App Router, `NextResponse.json`, `export const runtime = 'nodejs'` if needed for Buffer support).
- `apps/web/src/app/api/ccb-pdfs/upload/__tests__/route.test.ts` — vitest covering: happy path, stale timestamp, oversize, wrong content type, hash mismatch, bad signature. KYC-required path mocked behind the feature flag.

### Modify
- `apps/web/src/lib/chain/ccb-storage.ts` — rewrite. Stays `"use client"`. Now:
  1. Accept `wallet: PublicKey`, `signMessage: (msg: Uint8Array) => Promise<Uint8Array>` (the wallet-adapter signer), `loanId: string`, `pdfBytes: Uint8Array`
  2. Compute SHA-256 of pdfBytes via `crypto.subtle.digest('SHA-256', pdfBytes)`
  3. Build canonical payload, sign via `signMessage`
  4. POST multipart/form-data to `/api/ccb-pdfs/upload`
  5. Return `{ path }` from the response

- `apps/web/src/app/borrow/new/terms/[reqId]/page.tsx` — the only caller — update the call site to pass `wallet`, `signMessage`, `loanId`, `pdfBytes`. The wallet adapter exposes `signMessage` on the connected wallet.

### Do not touch
- `site/` — frozen.
- `apps/web/src/app/demo/*` — frozen.
- Programs, IDLs, anchor code.
- Other `/api/` routes.
- `packages/supabase` — use the existing `createServerClient` export. Do not modify the package.
- Wave 0 migration files — they're correct as-is; the bucket policy stays "no anon access."

---

## Open question for the operator (default to "off")

**Should the KYC attestation gate be enabled at this PR's launch?**

Pro: matches the CLAUDE.md/ROADMAP intent that "every money-touching instruction" is gated by Sumsub attestation. CCB issuance is part of the money flow.

Con: during Devnet demo and the judging window, real Sumsub onboarding is not yet wired. Forcing the gate would break the recorded demo's CCB upload step.

**Default for this PR:** the gate is implemented but **disabled by default** behind `NEXT_PUBLIC_CCB_KYC_GATE` env (unset / `"false"` → off; `"true"` → on). When the team is ready to enforce KYC for CCBs, flip the env in Vercel.

If the operator wants the gate on immediately, flip the env and re-run smoke tests. No code change needed.

---

## Acceptance criteria

1. New route `apps/web/src/app/api/ccb-pdfs/upload/route.ts` exists and handles the contract above.
2. All seven verification steps return the documented status codes for their respective failure modes (covered by vitest).
3. `apps/web/src/lib/chain/ccb-storage.ts` is rewritten to call the new route — no more anon-key direct uploads. Existing caller in `borrow/new/terms/[reqId]/page.tsx` still compiles and behaves consistently with today (path scheme changes to `<wallet>/<loanId>.pdf`; this is a visible change because the path is now nested, but no live frontend code currently *reads back* CCB PDFs — confirm by grepping for `from("ccb-pdfs").download` or similar).
4. Server uses `SUPABASE_SERVICE_ROLE_KEY` (server-only env). The anon-key dependency in this code path is eliminated.
5. Tests pass: `pnpm -w turbo run test lint typecheck build --filter=@vaulx/web` clean.
6. No new npm dependencies (use `tweetnacl` which is already transitive via `@solana/web3.js`).
7. Security review signs off on the auth contract + bucket policy.

---

## Test plan

Vitest specs to cover:
- Happy path: valid signature + valid PDF → 200, returns path.
- Stale timestamp → 408.
- Oversize PDF → 413.
- Wrong content type (not `%PDF-`) → 415.
- Wrong client-claimed hash → 400.
- Bad signature → 401.
- Missing wallet/loanId/pdfBytes → 400.
- KYC gate ON + no attestation → 403. (Mocked attestation lookup.)
- KYC gate OFF → KYC step skipped.

Mock the Supabase Storage client. Do not actually hit Supabase in tests.

---

## Integrator brief (paste this to the subagent)

> You are the integrator for the ccb-storage fix per `/Users/gogy/MyCODE/VAULX/docs/plans/2026-05-14-ccb-storage-fix-spec.md`. Read `/Users/gogy/MyCODE/VAULX/CLAUDE.md` and the spec in full before you write any code.
>
> Branch is `fix/ccb-storage-anon-rls` (already created off `main`). Implement the spec exactly. Use Context7 for any Next.js App Router, `tweetnacl`, `@solana/web3.js`, or vitest API question.
>
> End with the standard STATUS block.

---

## Security reviewer brief

> Review the PR for `fix/ccb-storage-anon-rls`. Focus on:
> 1. Wallet-signature auth: canonical payload format prevents replay (timestamp + freshness window) and cross-route reuse (`vaulx:ccb-upload` namespace prefix).
> 2. Server-side bytes ↔ claimed hash recompute: prevents the server from trusting a client-provided hash unilaterally.
> 3. PDF magic-byte sniff: prevents non-PDF uploads.
> 4. Size cap: 5 MB enforced before reading full body into memory.
> 5. Service-role key never reaches the client.
> 6. Path scheme `<wallet>/<loanId>.pdf` cannot escape the bucket (no path traversal via `loanId` content).
> 7. Error responses don't leak service-role state.
>
> Pass/fail with reasons. STATUS block per CLAUDE.md §3.3.
