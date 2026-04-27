"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { DemoShell } from "../../_components/demo-shell";
import { LiveBadge, MockBadge } from "../../_components/integration-badges";
import { useDemoSession } from "../../_lib/use-demo-session";
import { CivicAuthGate } from "@/components/vaulx/civic-auth-gate";
import { useUser } from "@civic/auth-web3/react";

const CIVIC_AUTH_ENABLED = !!process.env.NEXT_PUBLIC_CIVIC_AUTH_CLIENT_ID;

async function sha256Hex(s: string): Promise<string> {
  const buf = new TextEncoder().encode(s);
  const hashBuf = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Bridge between the live `<CivicAuthGate>` (when Civic Auth is enabled) and
 * the demo `useDemoSession` store. When `useUser()` reports a signed-in user,
 * SHA-256 the JWT and persist `session.civic.jwtHash` + `verifiedAt`.
 */
function CivicVerifiedBridge() {
  const { user, idToken } = useUser();
  const { session, patch } = useDemoSession();

  useEffect(() => {
    if (!user || !idToken) return;
    if (session?.civic.verifiedAt) return;
    let cancelled = false;
    void (async () => {
      const jwtHash = await sha256Hex(idToken);
      if (cancelled) return;
      patch((s) => ({
        ...s,
        civic: { jwtHash, verifiedAt: Date.now() },
      }));
    })();
    return () => {
      cancelled = true;
    };
  }, [user, idToken, session?.civic.verifiedAt, patch]);

  return (
    <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 font-mono text-sm uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
      Civic verified
    </div>
  );
}

export default function OnboardPage() {
  const { session, patch } = useDemoSession();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (session?.civic.verifiedAt) return;
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [session?.civic.verifiedAt]);

  if (!session)
    return (
      <DemoShell formFactor="phone">
        <div className="px-6 py-12 text-[var(--ink-muted)]">Loading…</div>
      </DemoShell>
    );

  const civicDone = !!session.civic.verifiedAt;
  const govbrDone = !!session.govbr.verifiedAt;

  // When Civic Auth is enabled, render the live gate. When not, fall back to
  // the demo's mock-token button so the rest of the flow is reachable.
  const civicNode = CIVIC_AUTH_ENABLED ? (
    <CivicAuthGate
      fallback={
        <button className="w-full rounded-md border border-[var(--brand)]/40 bg-[var(--brand)]/10 px-4 py-3 font-mono text-sm uppercase tracking-wider text-[var(--brand)]">
          Sign in with Civic
        </button>
      }
    >
      <CivicVerifiedBridge />
    </CivicAuthGate>
  ) : (
    <button
      disabled={civicDone}
      onClick={() =>
        patch((s) => ({
          ...s,
          civic: { jwtHash: "demo-token", verifiedAt: Date.now() },
        }))
      }
      className="w-full rounded-md border border-[var(--brand)]/40 bg-[var(--brand)]/10 px-4 py-3 font-mono text-sm uppercase tracking-wider text-[var(--brand)] disabled:opacity-50"
    >
      {civicDone ? "✓ Civic verified" : "Verify with Civic"}
    </button>
  );

  return (
    <DemoShell formFactor="phone">
      <div className="px-6 py-8">
        <p className="eyebrow">Step 1 / 14 · 60-sec onboarding</p>
        <h1 className="display-md mt-3">Verify in under a minute.</h1>
        <p className="mt-3 text-sm text-[var(--ink-dim)]">
          Civic Auth on Solana for Sybil resistance. gov.br for Brazilian PII.
        </p>

        <div className="mt-6 rounded-md border border-[var(--rule)] p-4">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs uppercase tracking-wider text-[var(--ink-muted)]">
              Elapsed: {elapsed}s
            </p>
            {civicDone && govbrDone && <LiveBadge partner="Civic" />}
          </div>
        </div>

        <div className="mt-6">{civicNode}</div>

        <Link
          href={`/demo/borrow/verify-id?return_to=/demo/borrow/onboard`}
          className="mt-3 block w-full rounded-md border border-[var(--rule)] px-4 py-3 text-center font-mono text-sm uppercase tracking-wider text-[var(--ink-dim)]"
        >
          {govbrDone ? "✓ gov.br verified" : "Continue with gov.br"}
        </Link>

        <Link
          href="/demo/borrow/wallet"
          className={`mt-8 block w-full rounded-md border px-4 py-3 text-center font-mono text-sm uppercase tracking-wider ${
            civicDone && govbrDone
              ? "border-[var(--brand)] bg-[var(--brand)] text-[var(--bg)]"
              : "border-[var(--rule)] text-[var(--ink-muted)] pointer-events-none"
          }`}
        >
          Next →
        </Link>
      </div>
      <MockBadge partner="gov.br" />
    </DemoShell>
  );
}
