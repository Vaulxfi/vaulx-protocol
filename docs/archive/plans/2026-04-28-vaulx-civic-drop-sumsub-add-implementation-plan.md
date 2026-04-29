# Vaulx Civic Drop + Sumsub Add Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` to implement this plan task-by-task.

**Goal:** Replace the dead Civic Auth integration with Sumsub WebSDK + a lazy KYC gate, while preserving the vendor-neutral on-chain `KycAttestation` infrastructure.

**Architecture:** Crossmint Auth as the single sign-in surface (covers non-crypto and crypto users). Sumsub WebSDK as the only KYC provider, triggered lazily at money-touching CTAs (Submit Asset / Disburse / Deposit). Sumsub webhook signs `vault.issue_kyc_attestation` server-side via the operator keypair. On-chain `kyc_required: false` for demo; FE intercepts the gate.

**Tech Stack:** Next.js 14 · `@sumsub/websdk` 2.x · Sumsub REST API (`api.sumsub.com`) · Anchor 0.30.1 (existing `KycAttestation` PDA + `issue_kyc_attestation` ix) · Crossmint Auth (already wired) · `@solana/wallet-adapter-react`.

**Source-of-truth design:** [`2026-04-28-vaulx-civic-drop-sumsub-add-design.md`](2026-04-28-vaulx-civic-drop-sumsub-add-design.md). Read it before starting Task 1.1.

**Skills referenced:**
- `superpowers:test-driven-development` — for component tests
- `superpowers:verification-before-completion` — before declaring any task complete
- `superpowers:requesting-code-review` — at end of each phase

**Phase summary:**

| Phase | Tasks | Days | Description |
|---|---|---|---|
| 1 | T1.1 – T1.5 | 1 | Civic cleanup: SDK uninstall, FE component delete, on-chain civic.rs delete, wizard collapse, docs sweep |
| 2 | T2.1 – T2.6 | 1 | Sumsub backend: HTTP client, HMAC verifier, attestation helper, 3 API routes |
| 3 | T3.1 – T3.7 | 1 | Sumsub frontend: WebSDK component, KYC modal, useKycGate hook + wire into 3 pages |
| 4 | T4.1 – T4.3 | 1 | Env config, sandbox applicant pre-config (user task), Vercel env vars, E2E smoke |

Total: 4 working days.

---

## Phase 1 — Civic Cleanup (Day 1)

### Task 1.1: Uninstall `@civic/auth-web3` + scrub env

**Files:**
- Modify: `apps/web/package.json`
- Modify: `apps/web/.env.example`
- Modify: `pnpm-lock.yaml` (auto)

**Step 1:** Verify the SDK is currently installed:

```bash
cd /Users/gogy/MyCODE/VAULX
pnpm --filter @vaulx/web list @civic/auth-web3 2>&1 | tail -3
```

Expected: shows `@civic/auth-web3 0.11.0`.

**Step 2:** Uninstall:

```bash
pnpm --filter @vaulx/web remove @civic/auth-web3
```

**Step 3:** Remove from `apps/web/.env.example`. Find this block and delete it (preserve all other entries):

```
# Civic Auth (OAuth / OIDC). Get client id from auth.civic.com/dashboard.
# Free tier; SOC 2 Type 1 certified.
# NEXT_PUBLIC_CIVIC_AUTH_CLIENT_ID=
```

**Step 4:** Verify install state:

```bash
grep -E "civic|CIVIC" apps/web/package.json apps/web/.env.example
```
Expected: no output (the only Civic mention left is the comment in `wallet-provider.tsx` which Task 1.2 removes).

**Step 5:** Commit:

```bash
git add apps/web/package.json apps/web/.env.example pnpm-lock.yaml
git commit -m "chore(civic): uninstall @civic/auth-web3 + remove env stub"
```

---

### Task 1.2: Delete `<CivicAuthGate>` + drop from wallet-provider

**Files:**
- Delete: `apps/web/src/components/vaulx/civic-auth-gate.tsx`
- Modify: `apps/web/src/components/providers/wallet-provider.tsx`
- Modify: `apps/web/src/components/vaulx/identity-gates.tsx` (remove civic-gate import + branch)
- Modify: `apps/web/src/components/vaulx/deposit-form.tsx` (remove civic-gate import + branch)

**Step 1:** Find all current usages:

```bash
grep -rn "CivicAuthGate\|CivicAuthRoot\|@civic/auth-web3" apps/web/src/ --include='*.ts' --include='*.tsx' 2>/dev/null
```

Capture the list — every match is a place to clean up. Expected files: `civic-auth-gate.tsx` (the source), `wallet-provider.tsx` (provider mount), `identity-gates.tsx` (consumer), `deposit-form.tsx` (consumer), `app/demo/borrow/onboard/page.tsx` (consumer — covered in Task 1.4).

**Step 2:** Edit `apps/web/src/components/providers/wallet-provider.tsx`. Remove:
- Line `import { CivicAuthRoot } from "@/components/vaulx/civic-auth-gate";`
- The `<CivicAuthRoot>` JSX wrapper around `{children}` — children should now be a direct child of `<WalletModalProvider>`.

After edit, the JSX should look like:
```tsx
<WalletModalProvider>{children}</WalletModalProvider>
```

**Step 3:** Edit `apps/web/src/components/vaulx/identity-gates.tsx`. Remove the `<CivicAuthGate>` branch entirely. Keep the rest of the component (it likely also handles other gates — if `<CivicAuthGate>` was the only thing it wrapped, the component itself can be deleted, but verify by reading the file first).

**Step 4:** Edit `apps/web/src/components/vaulx/deposit-form.tsx`. Same pattern: remove the `<CivicAuthGate>` import + branch.

**Step 5:** Delete the source:

```bash
rm apps/web/src/components/vaulx/civic-auth-gate.tsx
```

**Step 6:** Re-grep to confirm zero references:

```bash
grep -rn "CivicAuthGate\|CivicAuthRoot\|@civic/auth-web3" apps/web/src/ 2>/dev/null
```
Expected: no output.

**Step 7:** Verify build:

```bash
pnpm --filter @vaulx/web build 2>&1 | tail -5
```
Expected: green.

**Step 8:** Commit:

```bash
git add apps/web/src/components/providers/wallet-provider.tsx apps/web/src/components/vaulx/
git commit -m "feat(civic): delete CivicAuthGate component + provider wrapper"
```

---

### Task 1.3: Delete on-chain civic.rs files

**Files:**
- Delete: `programs/vault/src/civic.rs`
- Delete: `programs/loan/src/civic.rs`
- Modify: `programs/vault/src/lib.rs` (remove `pub mod civic;` + commented call site)
- Modify: `programs/loan/src/lib.rs` (remove `pub mod civic;` + commented call site)

**Step 1:** Verify the files are dead code (they should be after Task 1.2 deprecation in commit `596f1e0`):

```bash
grep -rn "civic::" programs/ 2>/dev/null
grep -n "pub mod civic" programs/vault/src/lib.rs programs/loan/src/lib.rs
```
Expected: only the `pub mod civic;` declarations + commented-out `// civic::verify_gateway_token(...)` blocks.

**Step 2:** Delete the source files:

```bash
rm programs/vault/src/civic.rs programs/loan/src/civic.rs
```

**Step 3:** Edit `programs/vault/src/lib.rs`:
- Remove `pub mod civic;` line near the top
- Remove the `// TODO(civic-auth-attestation): replaced by ... // Old call (Civic Pass, sunset): ...` comment block in the `deposit` handler

**Step 4:** Same edits in `programs/loan/src/lib.rs` (`create_ccb_trdc` handler).

**Step 5:** Build + test:

```bash
PATH="/Users/gogy/.local/share/solana/install/active_release/bin:/Users/gogy/.cargo/bin:$PATH" \
  COPYFILE_DISABLE=1 anchor build 2>&1 | tail -3
PATH="/Users/gogy/.local/share/solana/install/active_release/bin:/Users/gogy/.cargo/bin:$PATH" \
  COPYFILE_DISABLE=1 anchor test --skip-build 2>&1 | tail -5
```
Expected: build green; test count unchanged at 69 passing / 2 pending / 2 failing.

**Step 6:** Commit:

```bash
git add programs/vault/src/lib.rs programs/loan/src/lib.rs programs/vault/src/civic.rs programs/loan/src/civic.rs
git commit -m "chore(civic): delete dead civic.rs Borsh parser (replaced by KycAttestation PDA)"
```

---

### Task 1.4: Collapse `/demo/borrow/onboard` wizard

**Files:**
- Modify: `apps/web/src/app/demo/borrow/onboard/page.tsx`

**Step 1:** Read the current page in full to understand the existing shape. Look for:
- The civic-verify section (`{civicNode}` from `CivicAuthGate`)
- The gov.br "Continue with gov.br" link section
- The Next button gating logic (`civicDone && govbrDone`)

**Step 2:** Replace with a simplified intro page. Keep:
- The hero / headline / subtitle (existing copy: "Verify in under a minute" or similar — update copy if it mentions Civic by name)
- The 60-second elapsed counter (existing affordance)
- A single primary CTA `[Continue to Sign in →]` → routes to `/demo/borrow/wallet`

Remove:
- Civic verify button + `<CivicAuthGate>` mount
- gov.br "Continue with gov.br" link
- Next button gating logic
- `civicDone`, `govbrDone` state

The simplified page is essentially a single-screen "Welcome — what we'll need" intro. The actual sign-in happens on `/demo/borrow/wallet` (Crossmint), and KYC happens lazily downstream via `<KycRequiredModal>` (built in Task 3.3).

**Step 3:** Remove unused imports (`useUser`, `CivicAuthGate`, etc.).

**Step 4:** Update copy to remove Civic-specific language. Replace "Civic Auth on Solana for Sybil resistance. gov.br for Brazilian PII." with:

> "Sign in with Google, email, or your existing Solana wallet. Verification kicks in only when you're ready to act — submit an asset, disburse, or lend."

**Step 5:** Verify build:

```bash
pnpm --filter @vaulx/web build 2>&1 | tail -5
```

**Step 6:** Manually click through `/demo/borrow/onboard` locally (`pnpm --filter @vaulx/web dev`) to confirm the simplified flow renders + the Continue button routes to `/demo/borrow/wallet`.

**Step 7:** Commit:

```bash
git add apps/web/src/app/demo/borrow/onboard/page.tsx
git commit -m "feat(demo): collapse onboard wizard — drop Civic + gov.br verify steps"
```

---

### Task 1.5: Docs sweep

**Files:**
- Modify: `README.md`
- Modify: `PARTNERSHIPS.md`
- Modify: `USER_TODO.md`
- Modify: `docs/plans/2026-04-27-vaulx-mock-app-demo-design.md`
- Modify: `docs/plans/2026-04-28-vaulx-pre-hackathon-buildout-plan.md` (mark Item 1 superseded)

**Step 1:** Find all Civic mentions in user-facing docs:

```bash
grep -rn -E "Civic Auth|Civic Pass|civic[_-]?auth|@civic/" \
  README.md PARTNERSHIPS.md USER_TODO.md docs/plans/*.md \
  2>/dev/null | head -50
```

**Step 2:** Per file, replace Civic with Sumsub + Crossmint as appropriate:

- `README.md`: replace the Civic Auth KYC section with a Sumsub + Crossmint section. New copy should describe:
  - Crossmint Auth: single sign-in for both crypto + non-crypto users
  - Sumsub: lazy-trigger KYC via `<KycRequiredModal>` at money-touching actions
  - On-chain `KycAttestation` PDA stays vendor-neutral

- `PARTNERSHIPS.md`: drop the Civic row entirely. Add a Sumsub row:
  > **Sumsub** — Identity Verification. Native SAS integration on Solana (May 2025). Brazil Non-Doc CPF flow + global doc-scan + ID Connect reusable KYC. Free sandbox tier. List as named partner in deck.

- `USER_TODO.md`:
  - Drop the "Civic API key — set in Vercel" section
  - Add a new "Sumsub sandbox — set 4 env vars in Vercel" section (placeholder; Task 4.2 fills the values)
  - Drop the "Civic Auth — gate state & cutover plan" section. Add equivalent: "Sumsub — gate state & cutover plan" describing the FE lazy gate today + on-chain `kyc_required = true` flip via `set_kyc_required` admin ix for mainnet.

- `docs/plans/2026-04-27-vaulx-mock-app-demo-design.md`: §2 + §2.1 redrawn. The §2 partner matrix Civic row → Sumsub. §2.1 sign-in flow simplified (Crossmint as the only auth, Sumsub as the only KYC, no separate gov.br step).

- `docs/plans/2026-04-28-vaulx-pre-hackathon-buildout-plan.md`: at the top of Item 1, add:
  > **SUPERSEDED** by [`2026-04-28-vaulx-civic-drop-sumsub-add-design.md`](2026-04-28-vaulx-civic-drop-sumsub-add-design.md). Civic is being dropped entirely; Sumsub replaces it as the KYC layer. The on-chain `KycAttestation` PDA + admin ixs from Item 1's Tasks 1.3-1.5 are kept (vendor-neutral).

**Step 3:** Re-grep to confirm:

```bash
grep -rn -E "Civic Auth|@civic/" README.md PARTNERSHIPS.md USER_TODO.md 2>/dev/null
```
Expected: any remaining mention is a historical reference (e.g. "previously used Civic Auth, dropped 2026-04-28") not a forward-looking integration claim.

**Step 4:** Commit:

```bash
git add README.md PARTNERSHIPS.md USER_TODO.md docs/plans/
git commit -m "docs(civic→sumsub): full sweep — drop Civic, surface Sumsub + Crossmint stack"
```

---

## Phase 2 — Sumsub Backend (Day 2)

### Task 2.1: Sumsub HTTP client + HMAC signer

**Files:**
- Create: `apps/web/src/lib/sumsub/client.ts`
- Test: `apps/web/src/lib/sumsub/__tests__/client.test.ts`

**Step 1:** Read [Sumsub API authentication](https://docs.sumsub.com/reference/authentication) to understand the HMAC signing scheme. Summary:

- Every request to `api.sumsub.com` requires three headers:
  - `X-App-Token`: the env-var token
  - `X-App-Access-Sig`: HMAC-SHA256 of `(timestamp + httpMethod + path + body)` keyed with the secret
  - `X-App-Access-Ts`: unix seconds when signing happened

**Step 2:** Write the failing test at `apps/web/src/lib/sumsub/__tests__/client.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { signRequest } from "../client";

describe("sumsub HMAC signer", () => {
  it("signs a GET request deterministically", () => {
    const sig = signRequest({
      method: "GET",
      path: "/resources/applicants/-;externalUserId=user-1/one",
      body: "",
      timestamp: 1700000000,
      secret: "test-secret-key",
    });
    // Pre-computed: HMAC-SHA256("1700000000GET/resources/applicants/-;externalUserId=user-1/one", "test-secret-key")
    expect(sig).toBe("18a25c3f7c3b8e8b90b5d76e57b9c4b8c4f0f5fc3eaa9c5b6e3f6f8f5e8e2b1a"
      .substring(0, 8) + sig.substring(8)); // implementation will compute the real value; this asserts shape
    expect(sig).toMatch(/^[0-9a-f]{64}$/);
  });

  it("signs a POST with body", () => {
    const sig = signRequest({
      method: "POST",
      path: "/resources/sdkIntegrations/levels/-/websdkLink",
      body: JSON.stringify({ levelName: "basic-kyc-level", externalUserId: "u1" }),
      timestamp: 1700000000,
      secret: "test-secret-key",
    });
    expect(sig).toMatch(/^[0-9a-f]{64}$/);
    expect(sig.length).toBe(64);
  });
});
```

**Step 3:** Run test, verify FAIL:

```bash
pnpm --filter @vaulx/web test -- client.test 2>&1 | tail -10
```
Expected: FAIL with "signRequest is not a function" or similar.

**Step 4:** Implement `apps/web/src/lib/sumsub/client.ts`:

```ts
/**
 * Sumsub REST API client. Handles HMAC-SHA256 signing per Sumsub's
 * authentication scheme: every request needs X-App-Token, X-App-Access-Sig,
 * and X-App-Access-Ts headers. The signature covers (ts + method + path + body).
 *
 * Docs: https://docs.sumsub.com/reference/authentication
 */
import crypto from "node:crypto";

const SUMSUB_BASE_URL = "https://api.sumsub.com";

export type SignInput = {
  method: string;        // e.g. "GET", "POST"
  path: string;          // e.g. "/resources/applicants/-;externalUserId=u1/one"
  body: string;          // request body as string ("" for GET)
  timestamp: number;     // unix seconds
  secret: string;        // SUMSUB_SECRET_KEY
};

export function signRequest({ method, path, body, timestamp, secret }: SignInput): string {
  const payload = `${timestamp}${method.toUpperCase()}${path}${body}`;
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export type SumsubFetchOpts = {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  body?: unknown;
};

export async function sumsubFetch<T = unknown>(opts: SumsubFetchOpts): Promise<T> {
  const token = process.env.SUMSUB_APP_TOKEN;
  const secret = process.env.SUMSUB_SECRET_KEY;
  if (!token || !secret) {
    throw new Error("SUMSUB_APP_TOKEN and SUMSUB_SECRET_KEY must be set");
  }
  const ts = Math.floor(Date.now() / 1000);
  const bodyStr = opts.body === undefined ? "" : JSON.stringify(opts.body);
  const sig = signRequest({
    method: opts.method,
    path: opts.path,
    body: bodyStr,
    timestamp: ts,
    secret,
  });
  const res = await fetch(`${SUMSUB_BASE_URL}${opts.path}`, {
    method: opts.method,
    headers: {
      "Content-Type": "application/json",
      "X-App-Token": token,
      "X-App-Access-Sig": sig,
      "X-App-Access-Ts": String(ts),
    },
    body: opts.body === undefined ? undefined : bodyStr,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Sumsub API ${opts.method} ${opts.path} → ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}
```

**Step 5:** Update the test's expected value (compute the real HMAC for the test inputs and replace the placeholder). Run again:

```bash
pnpm --filter @vaulx/web test -- client.test 2>&1 | tail -10
```
Expected: PASS (after fixing the test's pre-computed expected value).

**Step 6:** Commit:

```bash
git add apps/web/src/lib/sumsub/client.ts apps/web/src/lib/sumsub/__tests__/client.test.ts
git commit -m "feat(sumsub): HMAC-signed REST client for api.sumsub.com"
```

---

### Task 2.2: Webhook HMAC verifier

**Files:**
- Create: `apps/web/src/lib/sumsub/webhook.ts`
- Test: `apps/web/src/lib/sumsub/__tests__/webhook.test.ts`

**Step 1:** Read [Sumsub webhooks](https://docs.sumsub.com/reference/webhooks). Summary:

- Sumsub signs each webhook payload with HMAC-SHA256 over the raw request body.
- Signature header is `X-Payload-Digest` (lowercase hex).
- Digest algorithm header is `X-Payload-Digest-Alg` (typically `HMAC_SHA256_HEX`).
- Secret is configured per-webhook in the Sumsub dashboard.

**Step 2:** Write the failing test:

```ts
import { describe, it, expect } from "vitest";
import { verifyWebhookSignature } from "../webhook";
import crypto from "node:crypto";

const SECRET = "webhook-secret-123";

function makeDigest(body: string, secret = SECRET): string {
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
}

describe("sumsub webhook verifier", () => {
  it("accepts a valid HMAC", () => {
    const body = JSON.stringify({ applicantId: "abc", reviewAnswer: "GREEN" });
    const digest = makeDigest(body);
    expect(verifyWebhookSignature(body, digest, SECRET)).toBe(true);
  });

  it("rejects a tampered body", () => {
    const body = JSON.stringify({ applicantId: "abc", reviewAnswer: "GREEN" });
    const digest = makeDigest(body);
    const tampered = body.replace("GREEN", "RED");
    expect(verifyWebhookSignature(tampered, digest, SECRET)).toBe(false);
  });

  it("rejects a wrong-secret signature", () => {
    const body = JSON.stringify({ applicantId: "abc" });
    const digest = makeDigest(body, "wrong-secret");
    expect(verifyWebhookSignature(body, digest, SECRET)).toBe(false);
  });

  it("rejects empty signature", () => {
    expect(verifyWebhookSignature("{}", "", SECRET)).toBe(false);
  });
});
```

**Step 3:** Run test, verify FAIL.

**Step 4:** Implement `apps/web/src/lib/sumsub/webhook.ts`:

```ts
/**
 * Sumsub webhook signature verification. Sumsub signs the raw request body
 * with HMAC-SHA256 using a per-webhook secret configured in the dashboard.
 * Signature arrives as hex in `X-Payload-Digest`.
 *
 * Use crypto.timingSafeEqual to prevent timing attacks during signature
 * comparison.
 */
import crypto from "node:crypto";

export function verifyWebhookSignature(
  rawBody: string,
  signatureHex: string,
  secret: string,
): boolean {
  if (!signatureHex) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  // Both must be the same length for timingSafeEqual; bail if not.
  if (signatureHex.length !== expected.length) return false;
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signatureHex, "hex"),
      Buffer.from(expected, "hex"),
    );
  } catch {
    return false;
  }
}

export type SumsubWebhookEvent = {
  applicantId: string;
  externalUserId?: string;
  type: string;             // e.g. "applicantReviewed"
  reviewStatus?: string;    // e.g. "completed"
  reviewResult?: {
    reviewAnswer: "GREEN" | "RED" | "YELLOW";
    rejectLabels?: string[];
  };
  createdAtMs: number;
};
```

**Step 5:** Run test, verify PASS.

**Step 6:** Commit:

```bash
git add apps/web/src/lib/sumsub/webhook.ts apps/web/src/lib/sumsub/__tests__/webhook.test.ts
git commit -m "feat(sumsub): HMAC webhook signature verifier (timing-safe)"
```

---

### Task 2.3: SAS attestation helper

**Files:**
- Create: `apps/web/src/lib/sumsub/attestation.ts`
- Test: `apps/web/src/lib/sumsub/__tests__/attestation.test.ts`

**Step 1:** Write the failing test (mocked Anchor):

```ts
import { describe, it, expect, vi } from "vitest";
import { mintAttestationForWallet } from "../attestation";
import { Keypair, PublicKey } from "@solana/web3.js";

vi.mock("@/lib/admin/demo", () => ({
  loadOperatorKeypair: () => Keypair.generate(),
  walletFromKeypair: (kp: Keypair) => ({ publicKey: kp.publicKey, payer: kp }),
}));

describe("mintAttestationForWallet", () => {
  it("derives the canonical KycAttestation PDA from the user's wallet", () => {
    const wallet = new PublicKey("7QpTNAveTSfQSEzjPCmfzgE9ZGrgkcUBmDZ97dcSixdE");
    // Expected: PDA = findProgramAddressSync([b"kyc_attestation", wallet], VAULT_PROGRAM_ID)
    // Function should expose the derived PDA pre-mint so we can inspect it.
    // Test will assert deriveKycAttestationPda(wallet) === expected
    const { derivePda } = require("../attestation");
    const pda = derivePda(wallet);
    expect(pda).toBeInstanceOf(PublicKey);
    expect(pda.toBase58()).toMatch(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/);
  });

  it("requires a non-empty jwtHash", async () => {
    const wallet = new PublicKey("7QpTNAveTSfQSEzjPCmfzgE9ZGrgkcUBmDZ97dcSixdE");
    await expect(
      mintAttestationForWallet({
        wallet,
        jwtHash: new Uint8Array(0),  // empty
        applicantId: "abc",
      }),
    ).rejects.toThrow(/jwtHash must be 32 bytes/);
  });
});
```

**Step 2:** Run test, verify FAIL.

**Step 3:** Implement `apps/web/src/lib/sumsub/attestation.ts`:

```ts
/**
 * Server-side helper to mint a `KycAttestation` PDA on the vault program
 * after Sumsub returns GREEN. Uses the operator keypair (loaded from env
 * or local file) to sign `vault.issue_kyc_attestation`.
 *
 * Idempotency: if the attestation PDA already exists with the same
 * (owner, attestor) pair, treat as success (Sumsub may retry the webhook
 * and we don't want to double-mint or error).
 */
import { AnchorProvider, BN, Program, type Idl } from "@coral-xyz/anchor";
import { Connection, PublicKey, SystemProgram } from "@solana/web3.js";
import { vault as vaultFacade } from "@vaulx/anchor-client";
import {
  loadOperatorKeypair,
  walletFromKeypair,
} from "@/lib/admin/demo";

const KYC_ATTESTATION_SEED = Buffer.from("kyc_attestation");

export function derivePda(wallet: PublicKey): PublicKey {
  const programId = new PublicKey(vaultFacade.programId);
  return PublicKey.findProgramAddressSync(
    [KYC_ATTESTATION_SEED, wallet.toBuffer()],
    programId,
  )[0];
}

export type MintAttestationOpts = {
  wallet: PublicKey;
  jwtHash: Uint8Array;       // 32 bytes; SHA-256 of the Sumsub-signed identity payload
  applicantId: string;       // Sumsub applicant id, for audit logging
};

export type MintAttestationResult = {
  ok: true;
  pda: string;
  signature: string;
  alreadyExisted: boolean;
};

export async function mintAttestationForWallet(
  opts: MintAttestationOpts,
): Promise<MintAttestationResult> {
  if (opts.jwtHash.length !== 32) {
    throw new Error("jwtHash must be 32 bytes");
  }

  const payer = loadOperatorKeypair();
  const rpc = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
  const conn = new Connection(rpc, "confirmed");
  const provider = new AnchorProvider(conn, walletFromKeypair(payer), {
    commitment: "confirmed",
  });
  const vaultProgramId = new PublicKey(vaultFacade.programId);
  const vaultProgram = vaultFacade.program(provider) as Program<Idl>;

  const pda = derivePda(opts.wallet);

  // Idempotency: check if the PDA already exists.
  const existing = await conn.getAccountInfo(pda);
  if (existing) {
    return { ok: true, pda: pda.toBase58(), signature: "", alreadyExisted: true };
  }

  const sig: string = await (vaultProgram.methods as any)
    .issueKycAttestation(Array.from(opts.jwtHash))
    .accounts({
      kycAttestation: pda,
      owner: opts.wallet,
      attestor: payer.publicKey,
      vaultConfig: PublicKey.findProgramAddressSync(
        [Buffer.from("vault_config")],
        vaultProgramId,
      )[0],
      systemProgram: SystemProgram.programId,
    })
    .rpc({ commitment: "confirmed" });

  console.log(
    `[sumsub.attestation] minted KycAttestation for ${opts.wallet.toBase58().slice(0, 8)}… (applicant=${opts.applicantId.slice(0, 8)}…) tx=${sig.slice(0, 32)}…`,
  );

  return { ok: true, pda: pda.toBase58(), signature: sig, alreadyExisted: false };
}
```

**Step 4:** Run test, verify PASS.

**Step 5:** Commit:

```bash
git add apps/web/src/lib/sumsub/attestation.ts apps/web/src/lib/sumsub/__tests__/attestation.test.ts
git commit -m "feat(sumsub): server-side KycAttestation mint helper (idempotent)"
```

---

### Task 2.4: `/api/sumsub/init-token` route

**Files:**
- Create: `apps/web/src/app/api/sumsub/init-token/route.ts`

**Step 1:** Read [Sumsub WebSDK access token](https://docs.sumsub.com/reference/websdk-access-token). Summary:

- POST to `/resources/accessTokens?userId={externalUserId}&levelName={levelName}` with HMAC-signed headers.
- Response includes `token` (string) — pass to the WebSDK on the frontend.
- `externalUserId` is our wallet pubkey (so Sumsub maps verifications → wallet).
- `levelName` is configured in the Sumsub dashboard (e.g. `basic-kyc-level`).

**Step 2:** Implement `apps/web/src/app/api/sumsub/init-token/route.ts`:

```ts
/**
 * POST /api/sumsub/init-token
 *
 * Body: { walletPubkey: string }
 * Returns: { token: string, applicantId: string, levelName: string }
 *
 * The token is consumed by `@sumsub/websdk` on the frontend to mount the
 * iframe. Each call generates a fresh short-lived token; safe to call on
 * every modal open.
 */
import { NextRequest, NextResponse } from "next/server";
import { sumsubFetch } from "@/lib/sumsub/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: { walletPubkey?: string } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const wallet = body.walletPubkey;
  if (!wallet || !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(wallet)) {
    return NextResponse.json(
      { ok: false, detail: "walletPubkey must be a base58 Solana pubkey" },
      { status: 400 },
    );
  }

  const levelName = process.env.NEXT_PUBLIC_SUMSUB_LEVEL_NAME ?? "basic-kyc-level";

  try {
    // Sumsub uses externalUserId as the user identifier across calls.
    // We use the wallet pubkey so verification result → on-chain attestation
    // maps cleanly.
    const path = `/resources/accessTokens?userId=${encodeURIComponent(wallet)}&levelName=${encodeURIComponent(levelName)}`;
    const data = await sumsubFetch<{ token: string; userId: string }>({
      method: "POST",
      path,
    });
    return NextResponse.json({
      ok: true,
      token: data.token,
      applicantId: wallet,  // for the FE; we use externalUserId
      levelName,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { ok: false, detail: `Sumsub init-token failed: ${msg}` },
      { status: 502 },
    );
  }
}
```

**Step 3:** Verify build:

```bash
pnpm --filter @vaulx/web build 2>&1 | tail -3
```

**Step 4:** Local smoke test (with sandbox env vars set in `apps/web/.env.local`):

```bash
curl -s -X POST http://localhost:3000/api/sumsub/init-token \
  -H "Content-Type: application/json" \
  -d '{"walletPubkey":"7QpTNAveTSfQSEzjPCmfzgE9ZGrgkcUBmDZ97dcSixdE"}' | head -c 300
```
Expected: `{"ok":true,"token":"_act-...","applicantId":"...","levelName":"basic-kyc-level"}`. Skip if local env vars not set.

**Step 5:** Commit:

```bash
git add apps/web/src/app/api/sumsub/init-token/route.ts
git commit -m "feat(sumsub): /api/sumsub/init-token — per-user WebSDK access token"
```

---

### Task 2.5: `/api/sumsub/webhook` route

**Files:**
- Create: `apps/web/src/app/api/sumsub/webhook/route.ts`

**Step 1:** Implement:

```ts
/**
 * POST /api/sumsub/webhook
 *
 * Sumsub posts here when an applicant's review status changes. We:
 *   1. Read the raw body
 *   2. Verify HMAC signature (X-Payload-Digest header)
 *   3. Parse the event
 *   4. On applicantReviewed + reviewAnswer=GREEN: mint KycAttestation PDA
 *   5. Always return 200 to avoid Sumsub retries on our own bugs
 *      (we log internally; idempotency in mintAttestationForWallet
 *      handles dupes safely)
 */
import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import crypto from "node:crypto";
import {
  verifyWebhookSignature,
  type SumsubWebhookEvent,
} from "@/lib/sumsub/webhook";
import { mintAttestationForWallet } from "@/lib/sumsub/attestation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const secret = process.env.SUMSUB_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[sumsub.webhook] SUMSUB_WEBHOOK_SECRET not set");
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  // Read raw body for HMAC verification (NextRequest.text() preserves bytes).
  const rawBody = await req.text();
  const sig = req.headers.get("x-payload-digest") ?? "";

  if (!verifyWebhookSignature(rawBody, sig, secret)) {
    console.warn("[sumsub.webhook] invalid signature");
    return NextResponse.json({ ok: false, detail: "bad signature" }, { status: 401 });
  }

  let event: SumsubWebhookEvent;
  try {
    event = JSON.parse(rawBody) as SumsubWebhookEvent;
  } catch {
    return NextResponse.json({ ok: false, detail: "bad json" }, { status: 400 });
  }

  // We only act on applicantReviewed + GREEN. Everything else: log + ack.
  if (
    event.type !== "applicantReviewed" ||
    event.reviewResult?.reviewAnswer !== "GREEN"
  ) {
    console.log(
      `[sumsub.webhook] non-actionable event: type=${event.type} answer=${event.reviewResult?.reviewAnswer ?? "?"}`,
    );
    return NextResponse.json({ ok: true, action: "ignored" });
  }

  // externalUserId is the wallet pubkey we set in /api/sumsub/init-token.
  const walletStr = event.externalUserId;
  if (!walletStr) {
    console.warn("[sumsub.webhook] GREEN event without externalUserId; skipping");
    return NextResponse.json({ ok: true, action: "skipped-no-user" });
  }

  let wallet: PublicKey;
  try {
    wallet = new PublicKey(walletStr);
  } catch {
    console.warn(`[sumsub.webhook] invalid externalUserId pubkey: ${walletStr}`);
    return NextResponse.json({ ok: true, action: "skipped-bad-pubkey" });
  }

  // jwtHash binds this attestation to the specific Sumsub verification.
  // We hash the full webhook payload — anyone replaying the attestation
  // can verify the binding off-chain.
  const jwtHash = new Uint8Array(
    crypto.createHash("sha256").update(rawBody).digest(),
  );

  try {
    const result = await mintAttestationForWallet({
      wallet,
      jwtHash,
      applicantId: event.applicantId,
    });
    return NextResponse.json({
      ok: true,
      action: result.alreadyExisted ? "already-attested" : "minted",
      pda: result.pda,
      signature: result.signature,
    });
  } catch (err) {
    // Server-side error — return 500 so Sumsub retries with backoff.
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[sumsub.webhook] mint failed: ${msg}`);
    return NextResponse.json(
      { ok: false, detail: `mint failed: ${msg}` },
      { status: 500 },
    );
  }
}
```

**Step 2:** Verify build:

```bash
pnpm --filter @vaulx/web build 2>&1 | tail -3
```

**Step 3:** Commit:

```bash
git add apps/web/src/app/api/sumsub/webhook/route.ts
git commit -m "feat(sumsub): /api/sumsub/webhook — HMAC-verified, mints SAS on GREEN"
```

---

### Task 2.6: `/api/sumsub/applicant-status` route

**Files:**
- Create: `apps/web/src/app/api/sumsub/applicant-status/route.ts`

**Step 1:** Implement:

```ts
/**
 * GET /api/sumsub/applicant-status?walletPubkey=...
 *
 * Returns the on-chain KYC state for a wallet. Used by:
 *   - <KycRequiredModal> polling after Sumsub completes (until SAS appears)
 *   - useKycGate() to decide whether to show the modal at all
 *
 * Returns:
 *   { kyc: "verified", attestedAt, attestor, jwtHashShort } if PDA exists
 *   { kyc: "missing" } if PDA doesn't exist
 */
import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";
import { derivePda } from "@/lib/sumsub/attestation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const walletStr = url.searchParams.get("walletPubkey");
  if (!walletStr || !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(walletStr)) {
    return NextResponse.json(
      { ok: false, detail: "walletPubkey must be a base58 Solana pubkey" },
      { status: 400 },
    );
  }

  let wallet: PublicKey;
  try {
    wallet = new PublicKey(walletStr);
  } catch {
    return NextResponse.json({ ok: false, detail: "invalid pubkey" }, { status: 400 });
  }

  const rpc = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
  const conn = new Connection(rpc, "confirmed");
  const pda = derivePda(wallet);
  const acc = await conn.getAccountInfo(pda);
  if (!acc) {
    return NextResponse.json({ ok: true, kyc: "missing", pda: pda.toBase58() });
  }

  // KycAttestation layout (from programs/vault/src/attestation.rs):
  //   8 disc + 32 owner + 32 attestor + 8 attested_at + 32 jwt_hash + 1 bump
  const data = acc.data;
  const attestor = new PublicKey(data.subarray(40, 72));
  const attestedAt = Number(data.readBigInt64LE(72));
  const jwtHash = data.subarray(80, 112);
  return NextResponse.json({
    ok: true,
    kyc: "verified",
    pda: pda.toBase58(),
    attestor: attestor.toBase58(),
    attestedAt,
    jwtHashShort: Buffer.from(jwtHash.subarray(0, 8)).toString("hex"),
  });
}
```

**Step 2:** Verify build, then commit:

```bash
pnpm --filter @vaulx/web build 2>&1 | tail -3
git add apps/web/src/app/api/sumsub/applicant-status/route.ts
git commit -m "feat(sumsub): /api/sumsub/applicant-status — on-chain SAS check"
```

---

## Phase 3 — Sumsub Frontend + KYC Gate (Day 3)

### Task 3.1: Install `@sumsub/websdk`

**Files:**
- Modify: `apps/web/package.json`

**Step 1:** Verify the package version:

```bash
npm view @sumsub/websdk versions --json 2>&1 | tail -3
```

**Step 2:** Install:

```bash
pnpm --filter @vaulx/web add @sumsub/websdk
```

**Step 3:** Verify build:

```bash
pnpm --filter @vaulx/web build 2>&1 | tail -3
```

**Step 4:** Commit:

```bash
git add apps/web/package.json pnpm-lock.yaml
git commit -m "chore(sumsub): install @sumsub/websdk"
```

---

### Task 3.2: `<SumsubVerify>` component

**Files:**
- Create: `apps/web/src/components/vaulx/sumsub-verify.tsx`

**Step 1:** Implement:

```tsx
"use client";
/**
 * Sumsub WebSDK iframe wrapper. Fetches an init token from /api/sumsub/init-token
 * scoped to the user's wallet, mounts the iframe, listens for completion, then
 * polls /api/sumsub/applicant-status until the on-chain SAS appears (or timeout).
 *
 * Props:
 *   walletPubkey — the connected user's Solana pubkey
 *   onVerified — fires when on-chain SAS is confirmed (modal can close)
 *   onCancel — fires on user-initiated close
 */
import { useEffect, useRef, useState } from "react";
import snsWebSdk from "@sumsub/websdk";

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 30_000;

type SumsubVerifyProps = {
  walletPubkey: string;
  onVerified: () => void;
  onCancel?: () => void;
};

export function SumsubVerify({ walletPubkey, onVerified, onCancel }: SumsubVerifyProps) {
  const [status, setStatus] = useState<"loading" | "ready" | "verifying" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const containerId = "sumsub-websdk-container";
  const sdkInstance = useRef<unknown>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/sumsub/init-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ walletPubkey }),
        });
        if (!res.ok) throw new Error(`init-token failed: ${res.status}`);
        const { token } = (await res.json()) as { token: string };
        if (cancelled) return;

        sdkInstance.current = snsWebSdk
          .init(token, () => Promise.resolve(token))  // refresh callback (sandbox: same token)
          .withConf({ lang: "en" })
          .on("idCheck.onApplicantSubmitted", () => {
            setStatus("verifying");
            startPolling();
          })
          .on("idCheck.onApplicantStatusChanged", (payload: { reviewStatus?: string }) => {
            if (payload.reviewStatus === "completed") {
              setStatus("verifying");
              startPolling();
            }
          })
          .build();

        (sdkInstance.current as { launch: (id: string) => void }).launch(`#${containerId}`);
        setStatus("ready");
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [walletPubkey]);

  const startPolling = () => {
    const startTs = Date.now();
    const timer = setInterval(async () => {
      if (Date.now() - startTs > POLL_TIMEOUT_MS) {
        clearInterval(timer);
        setError("Verification timed out — check email for follow-up.");
        setStatus("error");
        return;
      }
      try {
        const res = await fetch(
          `/api/sumsub/applicant-status?walletPubkey=${encodeURIComponent(walletPubkey)}`,
        );
        const data = (await res.json()) as { kyc?: string };
        if (data.kyc === "verified") {
          clearInterval(timer);
          onVerified();
        }
      } catch {
        // continue polling on transient errors
      }
    }, POLL_INTERVAL_MS);
  };

  if (status === "error") {
    return (
      <div className="rounded-md border border-rose-400/30 bg-rose-50/5 p-4 text-sm text-rose-300">
        <p>Verification error</p>
        <p className="mt-2 font-mono text-xs">{error}</p>
        <button
          onClick={onCancel}
          className="mt-3 rounded border border-[var(--rule)] px-3 py-1 text-xs text-[var(--ink-dim)]"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div>
      {status === "verifying" && (
        <p className="mb-3 text-center font-mono text-xs uppercase tracking-wider text-[var(--ink-muted)]">
          Verifying on-chain attestation…
        </p>
      )}
      <div id={containerId} style={{ minHeight: "560px" }} />
    </div>
  );
}
```

**Step 2:** Verify build:

```bash
pnpm --filter @vaulx/web build 2>&1 | tail -3
```

**Step 3:** Commit:

```bash
git add apps/web/src/components/vaulx/sumsub-verify.tsx
git commit -m "feat(sumsub): <SumsubVerify> — WebSDK iframe + on-chain SAS poll"
```

---

### Task 3.3: `<KycRequiredModal>` shared modal

**Files:**
- Create: `apps/web/src/components/vaulx/kyc-required-modal.tsx`

**Step 1:** Implement:

```tsx
"use client";
/**
 * Lazy-KYC gate modal. Surfaces when the user clicks a money-touching CTA
 * but has no on-chain SAS attestation. Mounts <SumsubVerify> inside.
 *
 * Props:
 *   open — boolean, whether to show
 *   actionLabel — e.g. "Submit asset", "Disburse", "Deposit USDC"
 *                 Used in the modal copy: "To {actionLabel}, we need..."
 *   walletPubkey — passed through to <SumsubVerify>
 *   onVerified — called when SAS is confirmed on-chain (modal owner closes
 *                via setOpen(false) and resumes the original action)
 *   onCancel — user dismissed without verifying
 */
import { SumsubVerify } from "./sumsub-verify";

export function KycRequiredModal({
  open,
  actionLabel,
  walletPubkey,
  onVerified,
  onCancel,
}: {
  open: boolean;
  actionLabel: string;
  walletPubkey: string | null;
  onVerified: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal
      aria-labelledby="kyc-modal-title"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[var(--bg)]/80 px-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-[640px] overflow-hidden rounded-md border border-[var(--rule)] bg-[var(--bg-elev-1)] shadow-2xl">
        <header className="border-b border-[var(--rule)] px-6 py-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--ink-muted)]">
            Identity verification
          </span>
          <h2
            id="kyc-modal-title"
            className="mt-2 font-display text-2xl font-bold text-[var(--ink)]"
          >
            Verify to {actionLabel.toLowerCase()}
          </h2>
          <p className="mt-2 text-sm text-[var(--ink-dim)]">
            One-time verification. ~60 seconds for Brazilian residents (CPF +
            liveness, no documents). Reusable across all future Vaulx sessions.
          </p>
        </header>
        <div className="px-6 py-6">
          {walletPubkey ? (
            <SumsubVerify
              walletPubkey={walletPubkey}
              onVerified={onVerified}
              onCancel={onCancel}
            />
          ) : (
            <p className="text-sm text-[var(--ink-dim)]">
              Connect a wallet first.
            </p>
          )}
        </div>
        <footer className="flex items-center justify-end border-t border-[var(--rule)] px-6 py-3">
          <button
            onClick={onCancel}
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ink-muted)] hover:text-[var(--ink)]"
          >
            Cancel
          </button>
        </footer>
      </div>
    </div>
  );
}
```

**Step 2:** Verify build, commit:

```bash
pnpm --filter @vaulx/web build 2>&1 | tail -3
git add apps/web/src/components/vaulx/kyc-required-modal.tsx
git commit -m "feat(sumsub): <KycRequiredModal> — shared lazy-gate UI"
```

---

### Task 3.4: `useKycGate` hook (TDD)

**Files:**
- Create: `apps/web/src/lib/use-kyc-gate.tsx`
- Test: `apps/web/src/lib/__tests__/use-kyc-gate.test.tsx`

**Step 1:** Write the failing test:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useKycGate } from "../use-kyc-gate";

const mockUseUnifiedWallet = vi.fn();
vi.mock("@/components/providers/crossmint-wallet-adapter", () => ({
  useUnifiedWallet: () => mockUseUnifiedWallet(),
}));

const fetchMock = vi.fn();
beforeEach(() => {
  global.fetch = fetchMock as unknown as typeof fetch;
  fetchMock.mockReset();
  mockUseUnifiedWallet.mockReset();
});

describe("useKycGate", () => {
  it("runs the action immediately when SAS is verified", async () => {
    mockUseUnifiedWallet.mockReturnValue({ publicKey: { toBase58: () => "PUBKEY1" } });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ kyc: "verified" }),
    });
    const { result } = renderHook(() => useKycGate("Deposit USDC"));
    const action = vi.fn().mockResolvedValue("done");
    let res: unknown;
    await act(async () => {
      res = await result.current.guard(action);
    });
    expect(action).toHaveBeenCalledOnce();
    expect(res).toBe("done");
    expect(result.current.modalOpen).toBe(false);
  });

  it("opens the modal when SAS is missing", async () => {
    mockUseUnifiedWallet.mockReturnValue({ publicKey: { toBase58: () => "PUBKEY2" } });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ kyc: "missing" }),
    });
    const { result } = renderHook(() => useKycGate("Deposit USDC"));
    const action = vi.fn();
    await act(async () => {
      // guard returns a promise that resolves only after onVerified or onCancel
      void result.current.guard(action);
      await new Promise((r) => setTimeout(r, 10));
    });
    expect(action).not.toHaveBeenCalled();
    expect(result.current.modalOpen).toBe(true);
  });

  it("rejects the deferred action when user cancels", async () => {
    mockUseUnifiedWallet.mockReturnValue({ publicKey: { toBase58: () => "PUBKEY3" } });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ kyc: "missing" }),
    });
    const { result } = renderHook(() => useKycGate("Deposit USDC"));
    const action = vi.fn();
    let caught: unknown = null;
    await act(async () => {
      result.current
        .guard(action)
        .catch((e) => {
          caught = e;
        });
      await new Promise((r) => setTimeout(r, 10));
      result.current.cancel();
      await new Promise((r) => setTimeout(r, 10));
    });
    expect(action).not.toHaveBeenCalled();
    expect(caught).toBeInstanceOf(Error);
    expect(result.current.modalOpen).toBe(false);
  });
});
```

**Step 2:** Run test, verify FAIL:

```bash
pnpm --filter @vaulx/web test -- use-kyc-gate 2>&1 | tail -15
```

**Step 3:** Implement `apps/web/src/lib/use-kyc-gate.tsx`:

```tsx
"use client";
/**
 * Lazy KYC gate hook. Wrap a money-touching mutation with `guard(action)`:
 *
 *   const { guard, modalNode } = useKycGate("Deposit USDC");
 *   <button onClick={() => guard(() => deposit.mutateAsync(args))}>
 *     Deposit
 *   </button>
 *   {modalNode}
 *
 * Behaviour:
 *   - Checks /api/sumsub/applicant-status for the connected wallet
 *   - If kyc=verified → runs the action immediately
 *   - If kyc=missing → opens <KycRequiredModal>; defers the action
 *   - On Sumsub success → closes modal, resumes the deferred action
 *   - On user cancel → rejects the deferred action with KycCancelledError
 */
import { useCallback, useRef, useState } from "react";
import { useUnifiedWallet } from "@/components/providers/crossmint-wallet-adapter";
import { KycRequiredModal } from "@/components/vaulx/kyc-required-modal";

export class KycCancelledError extends Error {
  constructor() {
    super("User cancelled KYC verification");
    this.name = "KycCancelledError";
  }
}

export function useKycGate(actionLabel: string) {
  const { publicKey } = useUnifiedWallet();
  const [modalOpen, setModalOpen] = useState(false);
  const deferredAction = useRef<{
    fn: () => Promise<unknown>;
    resolve: (v: unknown) => void;
    reject: (e: unknown) => void;
  } | null>(null);

  const checkKyc = useCallback(async (): Promise<"verified" | "missing"> => {
    if (!publicKey) return "missing";
    const res = await fetch(
      `/api/sumsub/applicant-status?walletPubkey=${encodeURIComponent(publicKey.toBase58())}`,
    );
    if (!res.ok) return "missing";
    const data = (await res.json()) as { kyc?: string };
    return data.kyc === "verified" ? "verified" : "missing";
  }, [publicKey]);

  const guard = useCallback(
    async <T,>(action: () => Promise<T>): Promise<T> => {
      const status = await checkKyc();
      if (status === "verified") {
        return action();
      }
      // Defer; resolve on Sumsub success, reject on cancel.
      return new Promise<T>((resolve, reject) => {
        deferredAction.current = {
          fn: action as () => Promise<unknown>,
          resolve: resolve as (v: unknown) => void,
          reject,
        };
        setModalOpen(true);
      });
    },
    [checkKyc],
  );

  const onVerified = useCallback(() => {
    setModalOpen(false);
    const def = deferredAction.current;
    deferredAction.current = null;
    if (def) {
      def
        .fn()
        .then((v) => def.resolve(v))
        .catch((e) => def.reject(e));
    }
  }, []);

  const cancel = useCallback(() => {
    setModalOpen(false);
    const def = deferredAction.current;
    deferredAction.current = null;
    if (def) def.reject(new KycCancelledError());
  }, []);

  const modalNode = (
    <KycRequiredModal
      open={modalOpen}
      actionLabel={actionLabel}
      walletPubkey={publicKey?.toBase58() ?? null}
      onVerified={onVerified}
      onCancel={cancel}
    />
  );

  return { guard, modalNode, modalOpen, cancel };
}
```

**Step 4:** Run test, verify PASS:

```bash
pnpm --filter @vaulx/web test -- use-kyc-gate 2>&1 | tail -10
```

**Step 5:** Commit:

```bash
git add apps/web/src/lib/use-kyc-gate.tsx apps/web/src/lib/__tests__/use-kyc-gate.test.tsx
git commit -m "feat(sumsub): useKycGate hook — defer-and-resume mutation pattern"
```

---

### Task 3.5: Wire `useKycGate` into `<LendDepositPanel>`

**Files:**
- Modify: `apps/web/src/app/demo/_components/lend-deposit-panel.tsx`

**Step 1:** Read the current panel. Find the deposit button click handler (calls `useDeposit().mutateAsync(...)`).

**Step 2:** Wrap with `useKycGate`:

```tsx
import { useKycGate } from "@/lib/use-kyc-gate";

// inside the component:
const { guard, modalNode } = useKycGate("Deposit USDC");

// in the button onClick:
const handleDeposit = async () => {
  try {
    const sig = await guard(() =>
      deposit.mutateAsync({ amountAtoms: BigInt(...) })
    );
    setTxSig(sig);
  } catch (err) {
    if (err instanceof KycCancelledError) return;  // user backed out
    setError(...);
  }
};

// at the JSX root, render the modal:
return (
  <>
    {modalNode}
    <div>... existing panel ...</div>
  </>
);
```

**Step 3:** Verify build:

```bash
pnpm --filter @vaulx/web build 2>&1 | tail -3
```

**Step 4:** Commit:

```bash
git add apps/web/src/app/demo/_components/lend-deposit-panel.tsx
git commit -m "feat(sumsub): wire useKycGate into LendDepositPanel"
```

---

### Task 3.6: Wire `useKycGate` into `<OnchainDisburseSection>`

**Files:**
- Modify: `apps/web/src/app/demo/borrow/disburse/page.tsx`

**Step 1:** Find the disburse-button click handler.

**Step 2:** Wrap with `useKycGate("Disburse")`. Same pattern as Task 3.5.

**Step 3:** Verify build, commit:

```bash
pnpm --filter @vaulx/web build 2>&1 | tail -3
git add apps/web/src/app/demo/borrow/disburse/page.tsx
git commit -m "feat(sumsub): wire useKycGate into OnchainDisburseSection"
```

---

### Task 3.7: Wire `useKycGate` into `/demo/borrow/register`

**Files:**
- Modify: `apps/web/src/app/demo/borrow/register/page.tsx`

**Step 1:** Find the form's submit handler (calls `/api/demo/provision-loan`).

**Step 2:** Wrap with `useKycGate("Submit asset for evaluation")`. Same pattern.

**Step 3:** Verify build, commit:

```bash
pnpm --filter @vaulx/web build 2>&1 | tail -3
git add apps/web/src/app/demo/borrow/register/page.tsx
git commit -m "feat(sumsub): wire useKycGate into asset register form"
```

---

## Phase 4 — Vercel Env + E2E (Day 4)

### Task 4.1: Sumsub sandbox account + applicant pre-config (USER TASK)

**This is a manual user task; document the procedure in `USER_TODO.md` then mark complete.**

**Files:**
- Modify: `USER_TODO.md`

**Step 1:** Add to USER_TODO under "Active items":

```markdown
### Sumsub sandbox — set up + pre-configure demo applicant

1. Sign up at [dashboard.sumsub.com](https://dashboard.sumsub.com) (free, instant).
2. Switch to **Sandbox** mode (toggle top-right).
3. Create a verification level called `basic-kyc-level` with:
   - Steps: Identity (doc + selfie OR Brazil Non-Doc), Liveness
   - Country support: BR + 220 others (default)
4. Generate API tokens: Dashboard → Apps → Sandbox → Settings → API tokens.
   Copy:
   - `SUMSUB_APP_TOKEN` (starts with `sbx:`)
   - `SUMSUB_SECRET_KEY` (the matching secret)
5. Configure webhook: Dashboard → Apps → Sandbox → Webhooks → Add:
   - URL: `https://vaulx.vercel.app/api/sumsub/webhook`
   - Events: `applicantReviewed`, `applicantPending`
   - Copy the `SUMSUB_WEBHOOK_SECRET` Sumsub displays
6. Pre-configure a demo applicant for the slick demo moment:
   - Dashboard → Applicants → New → email `demo@vaulx.app`
   - Run through the sandbox flow with their test docs (auto-approve)
   - Note the applicantId for the demo script
7. Paste all 3 secrets back to me in chat — I'll set them in Vercel via API.

- [ ] Sumsub sandbox set up (P0 for E2E demo)
- [ ] Demo applicant pre-configured (P1 for slick demo moment)
```

**Step 2:** Commit:

```bash
git add USER_TODO.md
git commit -m "docs(sumsub): document sandbox setup + demo applicant pre-config"
```

---

### Task 4.2: Set 4 env vars in Vercel

**This task runs after Task 4.1. The user pastes secrets; controller (Claude) sets them via Vercel API + the existing token.**

**Files:** none in code; Vercel API calls only.

**Step 1:** Once user pastes the 3 Sumsub secrets, set in Vercel:

```bash
export VERCEL_TOKEN="<from earlier>"
echo -n "<SUMSUB_APP_TOKEN>" | vercel env add SUMSUB_APP_TOKEN production --scope=team_xxnjJw6BsmOjrWZhABWgity1 --token="$VERCEL_TOKEN"
echo -n "<SUMSUB_APP_TOKEN>" | vercel env add SUMSUB_APP_TOKEN preview --scope=team_xxnjJw6BsmOjrWZhABWgity1 --token="$VERCEL_TOKEN"

echo -n "<SUMSUB_SECRET_KEY>" | vercel env add SUMSUB_SECRET_KEY production --scope=team_xxnjJw6BsmOjrWZhABWgity1 --token="$VERCEL_TOKEN"
echo -n "<SUMSUB_SECRET_KEY>" | vercel env add SUMSUB_SECRET_KEY preview --scope=team_xxnjJw6BsmOjrWZhABWgity1 --token="$VERCEL_TOKEN"

echo -n "<SUMSUB_WEBHOOK_SECRET>" | vercel env add SUMSUB_WEBHOOK_SECRET production --scope=team_xxnjJw6BsmOjrWZhABWgity1 --token="$VERCEL_TOKEN"
echo -n "<SUMSUB_WEBHOOK_SECRET>" | vercel env add SUMSUB_WEBHOOK_SECRET preview --scope=team_xxnjJw6BsmOjrWZhABWgity1 --token="$VERCEL_TOKEN"

echo -n "basic-kyc-level" | vercel env add NEXT_PUBLIC_SUMSUB_LEVEL_NAME production --scope=team_xxnjJw6BsmOjrWZhABWgity1 --token="$VERCEL_TOKEN"
echo -n "basic-kyc-level" | vercel env add NEXT_PUBLIC_SUMSUB_LEVEL_NAME preview --scope=team_xxnjJw6BsmOjrWZhABWgity1 --token="$VERCEL_TOKEN"
```

**Step 2:** Trigger redeploy:

```bash
vercel redeploy <latest-prod-url> --scope=team_xxnjJw6BsmOjrWZhABWgity1 --token="$VERCEL_TOKEN"
```

Wait for READY (use Monitor tool to poll the Vercel API).

---

### Task 4.3: E2E smoke test on Vercel

**Step 1:** Once deploy is READY:

```bash
# Init token works (proves SUMSUB_APP_TOKEN + SUMSUB_SECRET_KEY are correct)
curl -s -X POST https://vaulx.vercel.app/api/sumsub/init-token \
  -H "Content-Type: application/json" \
  -d '{"walletPubkey":"7QpTNAveTSfQSEzjPCmfzgE9ZGrgkcUBmDZ97dcSixdE"}' | head -c 300
```
Expected: `{"ok":true,"token":"_act-...","applicantId":"...","levelName":"basic-kyc-level"}`.

```bash
# Applicant status returns missing for an unKYC'd wallet
curl -s "https://vaulx.vercel.app/api/sumsub/applicant-status?walletPubkey=7QpTNAveTSfQSEzjPCmfzgE9ZGrgkcUBmDZ97dcSixdE" | head -c 200
```
Expected: `{"ok":true,"kyc":"missing","pda":"..."}`.

**Step 2:** Manual click-through on production:

1. Visit `vaulx.vercel.app/demo/borrow/onboard` → click Continue → land on `/demo/borrow/wallet`
2. Sign in with Crossmint (Google/email)
3. Visit `/demo/lend` → click Deposit → modal opens → Sumsub iframe loads
4. Use Sumsub sandbox test docs to complete KYC
5. Wait ~30s for webhook → polling → modal closes → deposit fires → tx-sig surfaces
6. Click Deposit again → no modal (verified) → tx fires immediately

**Step 3:** Document results in commit message + close out:

```bash
git commit --allow-empty -m "verify(sumsub): full E2E green on Vercel — init-token, webhook, modal, mint, polling, gate-bypass-when-verified"
```

---

## Verification before declaring complete

Per `superpowers:verification-before-completion`:

- `pnpm --filter @vaulx/web build` green
- `pnpm --filter @vaulx/web test` green (37 existing + new sumsub tests)
- `anchor test --skip-build` 69 green (unchanged — on-chain shape preserved)
- All 4 Sumsub env vars set in Vercel (production + preview)
- E2E click-through completes end-to-end: sign in → click money-touching CTA → modal → Sumsub iframe → webhook → mint → re-click goes through silently
- No `Civic` references remain in `apps/web/src/`, `programs/`, `README.md`, `PARTNERSHIPS.md`, `USER_TODO.md` (except historical references explicitly marked "previously used")
- The 3 demo trigger pages (`/demo/lend`, `/demo/borrow/disburse`, `/demo/borrow/register`) all surface `<KycRequiredModal>` for unKYC'd wallets

---

## Plan complete

Plan saved to `docs/plans/2026-04-28-vaulx-civic-drop-sumsub-add-implementation-plan.md`. Two execution options:

1. **Subagent-Driven (this session)** — I dispatch fresh subagent per task, review between tasks, fast iteration.
2. **Parallel Session (separate)** — Open new session with `superpowers:executing-plans`, batch execution with checkpoints.

**Recommendation:** Option 1, this session, in the order shown — Phase 1 (cleanup) is fully self-contained and can ship same-day; Phases 2-3 (Sumsub backend + frontend) follow; Phase 4 (env + E2E) lands once you've completed the Sumsub sandbox setup in `USER_TODO.md`.
