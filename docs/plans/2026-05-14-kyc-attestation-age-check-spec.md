# Fix — KYC attestation freshness gate

**Date:** 2026-05-14
**Branch:** `fix/kyc-attestation-age-check`
**Spec owner:** senior architect (this session)
**Integrator:** subagent (general-purpose)
**Gates:** CI, QA review, **security review (auth gate)**, operator ACK

---

## Goal

Before flipping `NEXT_PUBLIC_CCB_KYC_GATE=true` in production, harden the KYC PDA check in `apps/web/src/app/api/ccb-pdfs/upload/route.ts` so that on-chain attestations can be rejected for staleness (not just absence).

---

## Background — and correction to the chip prompt

The chip task that originated this PR assumed the on-chain `KycAttestation` struct has an `expires_at` (or equivalent) field. **It does not.** Verified directly in `programs/vault/src/attestation.rs`:

```rust
pub struct KycAttestation {
    pub owner: Pubkey,
    pub attestor: Pubkey,
    pub attested_at: i64,   // unix-seconds when the attestation was minted
    pub jwt_hash: [u8; 32],
    pub bump: u8,
}
```

There is no on-chain expiry. Two consequences:

1. The current binary check (`getAccountInfo` returns non-null → pass) is **correct under the existing schema**. It is not a bug, just a limitation.
2. Production-grade KYC normally re-verifies users on a schedule (often annually). The Vaulx vault program does not enforce that on-chain. To bridge the gap without an IDL change, this PR adds an **off-chain max-age check** using `attested_at` as the freshness anchor.

---

## What this PR does

Replace the binary PDA-existence check at `apps/web/src/app/api/ccb-pdfs/upload/route.ts:179-188` with a parse-and-check flow:

1. `Connection.getAccountInfo(pda)` (unchanged)
2. If null → `403 kyc_required` (unchanged)
3. **New:** deserialize the account data (skip 8-byte Anchor discriminator, read `owner` 32 + `attestor` 32 + `attested_at` 8 bytes little-endian i64)
4. **New:** if `KYC_MAX_AGE_DAYS` env is set and `(now - attested_at) > KYC_MAX_AGE_DAYS * 86400` → `403 kyc_stale`
5. Otherwise → pass

If `KYC_MAX_AGE_DAYS` is unset, behavior is identical to today (existence-only). Default at ship: **unset**. Operator turns it on when ready.

---

## Why a TypeScript struct read (not Anchor coder)

The vault program's Anchor IDL is shipped via `packages/idls/`. Using the Anchor TypeScript coder would deserialize the full struct. That's fine but pulls in `@coral-xyz/anchor` in the route handler — already a dependency, so no new cost.

**Use the Anchor coder.** Build a one-time `Program` instance (or `BorshAccountsCoder`) and call `.coder.accounts.decode("KycAttestation", buffer)`. Wrap in try/catch — a corrupted account returns `403 kyc_required` (fail-closed).

The deserializer is the source of truth for layout; do not hand-roll byte offsets.

---

## Files to change

### Modify
- `apps/web/src/app/api/ccb-pdfs/upload/route.ts` — the KYC gate block (around lines 179-188). Replace with parse + age check.

### Modify
- `apps/web/src/app/api/ccb-pdfs/upload/__tests__/route.test.ts` — extend the existing KYC test cases:
  - Add: gate ON + attestation older than max-age → `403 kyc_stale`
  - Add: gate ON + attestation within max-age → `200`
  - Add: gate ON + max-age unset + ancient attestation → `200` (existence-only behavior preserved when env is unset)
  - Keep the existing: gate ON + no PDA → `403 kyc_required`, gate OFF → skipped

### Modify (env documentation only)
- `apps/web/.env.example` — add `KYC_MAX_AGE_DAYS` comment block, defaulting to unset
- `docs/plans/inventory/00-synthesis.md` — note the discovery that `KycAttestation` has no on-chain expiry (single sentence addendum)

### Do NOT change
- `programs/vault/src/attestation.rs` — out of scope. No IDL changes.
- `apps/web/src/lib/sumsub/attestation.ts` — out of scope. The minting path is correct as-is.
- `packages/idls/` — out of scope.

---

## Acceptance criteria

1. Route deserializes `KycAttestation` via the Anchor coder.
2. When `KYC_MAX_AGE_DAYS` is set, returns `403 kyc_stale` for attestations older than `(KYC_MAX_AGE_DAYS * 86400)` seconds.
3. When `KYC_MAX_AGE_DAYS` is unset, behavior is identical to today (existence-only).
4. When the account exists but fails to deserialize, returns `403 kyc_required` (fail-closed).
5. Vitest covers all four paths above.
6. `pnpm -w turbo run lint typecheck test build --filter=@vaulx/web` clean.
7. No new npm dependencies.

---

## Open question for the operator

**Should we ship with `KYC_MAX_AGE_DAYS` defaulting to `365`?**

Pro: production-grade KYC commonly enforces annual re-verification.
Con: would immediately reject any attestation older than a year the moment `NEXT_PUBLIC_CCB_KYC_GATE=true` is flipped — could be disruptive if there are long-tenured testers.

**Default in this PR:** unset (operator chooses when ready). Easy to flip later via Vercel env.

---

## Security reviewer brief

> Review `fix/kyc-attestation-age-check`. Focus:
> 1. Anchor coder deserialization is wrapped in try/catch (fail-closed to `403 kyc_required` on any parse error).
> 2. `KYC_MAX_AGE_DAYS` is parsed safely (`parseInt`, bounded to a sensible range — reject negative or non-numeric).
> 3. Time comparison uses `now_unix_seconds - attested_at_seconds` (NOT millis). Verify units match what the program writes.
> 4. `attested_at` from the chain is little-endian i64; verify the coder handles signed parsing correctly.
> 5. No new attack surface vs the existing existence-only gate (clock-skew tolerance, RPC failure handling — both still fail-closed).
> 6. No new env or secret reaches the client bundle (no `NEXT_PUBLIC_` prefix on `KYC_MAX_AGE_DAYS`).
>
> Pass/fail. STATUS block per CLAUDE.md §3.3.

---

## Integrator brief (paste to subagent)

> You are the integrator for the KYC attestation freshness gate per `/Users/gogy/MyCODE/VAULX/docs/plans/2026-05-14-kyc-attestation-age-check-spec.md`. Read `/Users/gogy/MyCODE/VAULX/CLAUDE.md` then the spec in full.
>
> Branch: `fix/kyc-attestation-age-check` (already created off `main`). Read the existing route at `apps/web/src/app/api/ccb-pdfs/upload/route.ts` and the existing test at `apps/web/src/app/api/ccb-pdfs/upload/__tests__/route.test.ts` BEFORE changing anything — that file is where most of your work lands.
>
> The vault program's `KycAttestation` struct definition is at `programs/vault/src/attestation.rs`. The Anchor IDL ships via `packages/idls/`. Use Context7 if you need the Anchor `BorshAccountsCoder` API.
>
> End with the standard STATUS block.

---

## Out of scope (explicitly)

- Adding `expires_at` to the vault program (would need multisig upgrade + re-mint of all attestations).
- Re-architecting the Sumsub mint flow.
- Wider KYC strategy or attestation revocation.
- Any change to `programs/`, `target/idl/`, or `packages/idls/`.
