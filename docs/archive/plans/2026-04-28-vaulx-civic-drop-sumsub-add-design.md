# Vaulx — Drop Civic, Add Sumsub: KYC Architecture Redesign

**Date:** 2026-04-28
**Status:** Approved (brainstormed in session; ready for implementation plan)
**Replaces:** Item 1 of [`2026-04-28-vaulx-pre-hackathon-buildout-plan.md`](2026-04-28-vaulx-pre-hackathon-buildout-plan.md) (Civic Pass → Civic Auth migration). Item 1's on-chain artifacts (KycAttestation PDA + admin ixs + tests) are vendor-neutral and survive intact; only the Civic-specific FE pieces are replaced.

---

## Why this redesign

The previous Civic Auth integration was based on the assumption that Civic was the canonical Solana KYC provider with a meaningful pre-KYC'd user base we could tap. Independent research (linked in session) showed both assumptions are wrong:

1. **Civic Auth duplicates Crossmint Auth.** Crossmint already covers email magic link, Gmail SSO, Apple, SMS/phone OTP, social (X / Farcaster), and every Solana + EVM wallet. Civic Auth adds passkeys, Google, Apple, Discord — Google and Apple are already in Crossmint. Two competing auth systems = no user-facing benefit.
2. **The "1M Civic users" narrative is dead inventory.** Those are legacy Civic Pass holders; Civic Pass was sunset mid-2025. The new Civic Auth product has near-zero overlap with our target user (a property owner in Brazil seeking collateral-backed credit).
3. **Sumsub is the better KYC primitive on Solana.** Native SAS (Solana Attestation Service) integration co-built with the Solana Foundation, May 2025 launch. Brazil Non-Doc CPF flow (CPF + liveness against Serpro gov database, ~60s, no document upload). Cross-platform reusable KYC via ID Connect across 200+ partners.

**Result:** drop Civic entirely; consolidate to **Crossmint (auth + wallet) + Sumsub (KYC) + on-chain SAS attestation**.

---

## Architecture

### Stack

| Layer | Tool | Role |
|---|---|---|
| Auth / SSO | **Crossmint Auth** | Single sign-in surface for both non-crypto users (Google / Apple / email / SMS auto-provision a Solana smart wallet) and crypto-natives (Phantom / Solflare / Backpack via wallet-adapter) |
| Off-chain identity verification | **Sumsub WebSDK** | One iframe handling Brazil Non-Doc CPF, ID Connect (reusable KYC), and global doc-scan internally |
| On-chain attestation | **`KycAttestation` PDA** (existing) | Vendor-neutral Vaulx-issued credential. Admin signs `issue_kyc_attestation` after Sumsub webhook validates. Reads as the on-chain "user is KYC'd" signal. |
| KYC enforcement | **Frontend lazy gate** | Money-touching actions (asset submit / disburse / deposit) check on-chain attestation; if missing, surface `<KycRequiredModal>`. On-chain `kyc_required: false` for demo speed. |

### Single-button sign-in

```
[ Sign in to Vaulx ]
        ↓
Crossmint Auth modal opens. Branches internally:
   • Continue with Google         ┐
   • Continue with Apple          │
   • Continue with email (magic)  ├─ Crossmint smart wallet auto-provisioned
   • SMS / phone                  │  (~3s, invisible to user; email recovery)
   ─────────────────────────────  │
   • I have a Solana wallet       └─ Phantom / Solflare / Backpack connect
```

Both branches yield a Solana pubkey. The rest of the app reads it identically.

### Lazy KYC gate

KYC enforcement lives in the FE, not on-chain (`vault_config.kyc_required: false`, `loan_config.kyc_required: false`). This keeps the demo flow fast and lets users browse. The gate intercepts user intent at three actions:

| Action | Page | CTA that triggers gate |
|---|---|---|
| Submit asset for offline evaluation | `/demo/borrow/register` | "Submit asset" |
| Request loan disbursement | `/demo/borrow/disburse` | "Disburse" |
| Lend USDC into protocol | `/demo/lend` | "Deposit USDC" |

Click → `useKycGate()` checks `useTrdcState`/SAS for attestation on the connected wallet → if missing, mounts `<KycRequiredModal>` → user clicks "Verify with Sumsub" → Sumsub iframe → completion → backend mints SAS on the wallet → modal closes → original mutation resumes via deferred-callback pattern.

Mainnet: flip `kyc_required: true` via the existing `set_kyc_required` admin ix to add on-chain enforcement. The FE gate stays as the friendly UX layer.

### Webhook-driven attestation minting

Sumsub doesn't sign Solana txs. The flow:

1. User completes Sumsub flow in iframe → Sumsub queues `applicantReviewed` event
2. Sumsub POSTs to `/api/sumsub/webhook` with HMAC-signed payload
3. Server verifies HMAC against `SUMSUB_WEBHOOK_SECRET`, parses event
4. On `reviewAnswer === GREEN`: server fetches applicant data, derives JWT hash from Sumsub's signed payload, calls `vault.issue_kyc_attestation(wallet, jwtHash, attestor=operator)` signed by the operator keypair (loaded from `OPERATOR_KEYPAIR_JSON` env)
5. SAS attestation minted on-chain → user's wallet now has reusable KYC credential

The user-facing iframe polls `/api/sumsub/applicant-status?walletPubkey=...` every 2s for up to 30s, until the SAS attestation appears on-chain or timeout.

---

## Components

### Drop (Day 1 cleanup)

**FE**
- `apps/web/package.json` — uninstall `@civic/auth-web3`
- `apps/web/src/components/vaulx/civic-auth-gate.tsx` — delete
- `apps/web/src/components/providers/wallet-provider.tsx` — drop `<CivicAuthRoot>` wrapper
- `apps/web/src/app/demo/borrow/onboard/page.tsx` — drop Civic step (was step 1) and gov.br step (was step 2). Sumsub Brazil Non-Doc handles both in one widget.
- `apps/web/.env.example` — remove `NEXT_PUBLIC_CIVIC_AUTH_CLIENT_ID`
- Vercel env: remove `NEXT_PUBLIC_CIVIC_AUTH_CLIENT_ID` (was unset anyway)

**On-chain**
- `programs/vault/src/civic.rs` — delete (already deprecated since Task 1.2 commit `596f1e0`)
- `programs/loan/src/civic.rs` — delete
- `programs/{vault,loan}/src/lib.rs` — remove the commented-out civic call sites + the `pub mod civic;` re-exports

**Docs**
- `README.md` — Civic Auth section out, Sumsub + Crossmint section in
- `PARTNERSHIPS.md` — Civic row dropped, Sumsub row added
- `USER_TODO.md` — Civic Auth client-id action item dropped, Sumsub sandbox signup added
- `docs/plans/2026-04-27-vaulx-mock-app-demo-design.md` — §2 + §2.1 redrawn with Crossmint-only auth + Sumsub KYC
- `docs/plans/2026-04-28-vaulx-pre-hackathon-buildout-plan.md` — Item 1 marked superseded, link to this doc

### Build (Days 2-3)

**Backend**
- `apps/web/src/lib/sumsub/` — new helper module
  - `client.ts` — typed HTTP client to `api.sumsub.com` with HMAC signing
  - `webhook.ts` — HMAC verification + event parsing
  - `attestation.ts` — wraps `vault.issue_kyc_attestation` call (reuses `walletFromKeypair` + `loadOperatorKeypair` from `lib/admin/demo.ts`)
- `apps/web/src/app/api/sumsub/init-token/route.ts` — POST: `{walletPubkey} → {sdkAccessToken, applicantId}`. Generates per-user iframe token scoped to a Sumsub level.
- `apps/web/src/app/api/sumsub/webhook/route.ts` — POST: receives Sumsub events. Verifies HMAC. On GREEN: mints SAS attestation. Returns 200 always (Sumsub retries on non-200).
- `apps/web/src/app/api/sumsub/applicant-status/route.ts` — GET: `?walletPubkey=...` → checks on-chain `KycAttestation` PDA, returns `{kyc: "verified" | "pending" | "missing", attestedAt, jwtHashShort}`.

**Frontend**
- `apps/web/src/components/vaulx/sumsub-verify.tsx` — wraps `@sumsub/websdk`. Fetches token from `/api/sumsub/init-token`, opens iframe, listens for `idCheck.applicantStatus` event, then polls applicant-status until on-chain SAS appears.
- `apps/web/src/components/vaulx/kyc-required-modal.tsx` — shared modal. Props: `{actionLabel, onCancel, onVerified}`. Renders blocking overlay + `<SumsubVerify>` inside.
- `apps/web/src/lib/use-kyc-gate.ts` — `useKycGate(actionLabel: string)` hook. Returns `{guard: (action: () => Promise<unknown>) => Promise<unknown>, modalNode}`. Wraps any action: checks on-chain attestation; if missing, opens modal; on Sumsub success, runs the guarded action.
- Wire into `<LendDepositPanel>`, `<OnchainDisburseSection>`, `/demo/borrow/register/page.tsx`. Each uses `useKycGate` to wrap its primary CTA.

### Preserve (zero work — already shipped)

- `KycAttestation` PDA struct + `issue_kyc_attestation` ix + `set_kyc_required` + `close_kyc_attestation` admin ixs
- `tests/kyc-attestation.spec.ts` — 9 runtime tests
- `programs/{vault,loan}/src/lib.rs` `kyc_required` flag + accounts struct slots
- Crossmint Auth integration (commits `08c766c` + `70f6199`) — kept as-is
- Operator-keypair Vercel env (`OPERATOR_KEYPAIR_JSON`) — same key signs Sumsub-triggered attestations

---

## Data flow

### Sign-in (both paths converge)

```
[Sign in to Vaulx] click
        ↓
Crossmint modal:
   • non-crypto: Google/email/Apple/SMS → smart wallet provisioned
   • crypto-native: Phantom/Solflare/Backpack → existing wallet connects
        ↓
useUnifiedWallet().publicKey resolves
        ↓
Vaulx reads /api/sumsub/applicant-status?walletPubkey=<pk>
        ↓
   ├─ kyc=verified → user browses logged in
   └─ kyc=missing  → user browses logged in (no friction)
```

### Money-touching action (the gate)

```
User clicks Submit Asset / Disburse / Deposit
        ↓
useKycGate(...).guard(originalMutation) intercepts
        ↓
Check on-chain SAS via /api/sumsub/applicant-status
        ↓
   ├─ verified → originalMutation runs immediately
   └─ missing → mount <KycRequiredModal>
                       ↓
                User: [Verify with Sumsub] click
                       ↓
                Fetch /api/sumsub/init-token
                       ↓
                Sumsub WebSDK iframe opens:
                   • Email (ID Connect lookup) → 5s if found
                   • Brazil → CPF + liveness (~60s)
                   • Other → doc + selfie (~2 min)
                       ↓
                Sumsub posts to /api/sumsub/webhook
                       ↓
                Server: verify HMAC → call vault.issue_kyc_attestation
                       ↓
                On-chain SAS minted on user's wallet
                       ↓
                FE polls /api/sumsub/applicant-status (2s interval)
                       ↓
                Status flips to verified → modal closes → originalMutation runs
```

---

## Error handling

| Error | Detection | Recovery |
|---|---|---|
| Sumsub init-token fails (sandbox down) | 5xx from `api.sumsub.com` | Modal shows "Verification service unreachable, try again in a moment" |
| Webhook HMAC mismatch | `X-Payload-Digest` doesn't validate | Server returns 401, logs, drops event. Sumsub retries with backoff. |
| Webhook arrives but on-chain mint fails | `vault.issue_kyc_attestation` rpc throws | Server returns 500 to Sumsub (triggers retry). Idempotent: if attestation already exists, mint returns success without re-creating. |
| User closes Sumsub iframe without completing | iframe `onClose` event | Modal stays open with "Verification cancelled — try again" CTA |
| Polling times out (> 30s) | applicant-status stays `pending` | Modal shows "Still verifying, you'll get an email when complete" + dismisses. Original action queued in session storage; user can retry once SAS appears. |
| Webhook arrives for an unknown wallet | applicantId in payload doesn't map to any wallet | Server returns 200 + logs (we ignore unsolicited events; not an error path) |

---

## Testing

### Unit tests

- `apps/web/src/lib/sumsub/__tests__/webhook.test.ts` — HMAC verification edge cases (valid signature, wrong secret, tampered payload, replay window)
- `apps/web/src/lib/__tests__/use-kyc-gate.test.tsx` — verified-cached / missing / pending paths; mutation deferral + resume; modal cancel cancels the mutation

### Integration tests

- `apps/web/src/app/api/sumsub/__tests__/webhook.integration.test.ts` — full webhook → attestation mint flow against a local Anchor validator (existing pattern from `kamino-router.test.ts`)
- E2E (manual on Vercel): sign in with Crossmint → click Disburse → modal fires → Sumsub sandbox iframe → use sandbox test docs → webhook → SAS minted → second Disburse goes through silently

### Smoke checks

- `pnpm --filter @vaulx/web build` green
- `pnpm --filter @vaulx/web test` 37+ green (no regressions)
- `anchor test --skip-build` 69 green (all KYC tests still pass since on-chain shape is unchanged)

---

## Demo polish

Pre-configure a Sumsub sandbox applicant with email `demo@vaulx.app` (or whatever) marked as GREEN with a returned Brazilian CPF. Demo script:

1. **Returning customer (judge plays this)**: pick "Continue with Google", click Disburse → modal → enter `demo@vaulx.app` in Sumsub iframe → ID Connect hits → JWT in 5s → SAS minted → "5 seconds, no documents."
2. **Brazilian first-time customer (script this)**: fresh email → Sumsub asks country → Brazil → CPF + liveness with sandbox test data → ~60s on-screen → SAS minted → "60 seconds, no document upload, government database verified."

Both paths are real on Vercel; the only mock is the Sumsub sandbox having pre-seeded data (which is exactly how Sumsub sandbox is meant to be used).

---

## Risk assessment

| Risk | Mitigation |
|---|---|
| Sumsub sandbox approval gate (they review your sandbox before granting prod) | Demo runs entirely on sandbox + Devnet; no prod approval needed for May 10. Prod approval is a 1-week post-hackathon ask. |
| Sumsub webhook latency (multi-second async) | UX shows "Verifying…" with polling; documented as expected behavior |
| Crossmint smart-wallet `signTransaction` not exposed (per Phase B soft-bridge) | KYC gate's *server-side* SAS mint uses operator keypair, not user wallet — sidesteps the Crossmint signing limitation entirely. Money-touching actions (Disburse, Deposit) still need wallet-adapter signing — same constraint as today, no new problem. |
| User loses access to email-recovery on Crossmint smart wallet | Out of scope for hackathon. Crossmint's standard recovery flows (passkey, social) cover this for prod. |

---

## Out of scope

- **EU eIDAS / ID Austria login** — gated until 2027 for private apps. Sumsub doc-scan is the current path for EU users; documented in design but no code today.
- **Persona as second IDV provider** — research conclusion: US-fintech focused, no Solana/SAS, doesn't help BR/EU target. Skip.
- **Mainnet KYC enforcement** — Vaulx will flip `kyc_required = true` post-hackathon via the existing `set_kyc_required` admin ix. No code change for that switch.
- **Cross-protocol SAS reads** — once we mint a `KycAttestation` PDA, any other Solana dApp could in theory read it. We don't actively publish/index it for cross-protocol use; that's a v2 ecosystem play.

---

## Timeline

| Day | Deliverable |
|---|---|
| 1 | Civic cleanup: SDK uninstall, FE component delete, Rust civic.rs delete, docs sweep, wizard collapse |
| 2 | Sumsub backend: `lib/sumsub/`, `init-token` + `webhook` + `applicant-status` routes |
| 3 | Sumsub frontend: `<SumsubVerify>`, `<KycRequiredModal>`, `useKycGate`, wire into 3 pages |
| 4 | Vercel env config (4 Sumsub vars), pre-configured sandbox applicant, E2E smoke test on Vercel, demo script |

Total: 4 working days. Submission deadline May 10 → buffer of ~6 days for polish + the rest of the existing pre-hackathon plan items (Track B 4-7 already shipped).

---

## Out of this design's scope (handled elsewhere)

- All Item 4 (Bubblegum cNFT TRDC) — already shipped, unchanged
- All Item 5 (RedStone oracle) — already shipped, unchanged
- All Item 6 (Graph subgraph) — already shipped, unchanged
- All Item 7 (Kamino routing) — already shipped, unchanged
- Crossmint integration — already wired (Phases A+B), no changes
- Squads multisig governance — unchanged

---

**Next:** invoke `superpowers:writing-plans` to break this design into TDD-granular task list for `superpowers:subagent-driven-development` execution.
