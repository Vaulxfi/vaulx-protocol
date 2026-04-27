"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { DemoShell } from "../../_components/demo-shell";
import { LiveBadge, MockBadge } from "../../_components/integration-badges";
import { useDemoSession } from "../../_lib/use-demo-session";

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

  return (
    <DemoShell formFactor="phone">
      <div className="px-6 py-8">
        <p className="eyebrow">Step 1 / 14 · 60-sec onboarding</p>
        <h1 className="display-md mt-3">Verify in under a minute.</h1>
        <p className="mt-3 text-sm text-[var(--ink-dim)]">
          Civic Pass on Solana for Sybil resistance. gov.br for Brazilian PII.
        </p>

        <div className="mt-6 rounded-md border border-[var(--rule)] p-4">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs uppercase tracking-wider text-[var(--ink-muted)]">
              Elapsed: {elapsed}s
            </p>
            {civicDone && govbrDone && <LiveBadge partner="Civic" />}
          </div>
        </div>

        <button
          disabled={civicDone}
          onClick={() =>
            patch((s) => ({
              ...s,
              civic: { gatewayToken: "demo-token", verifiedAt: Date.now() },
            }))
          }
          className="mt-6 w-full rounded-md border border-[var(--brand)]/40 bg-[var(--brand)]/10 px-4 py-3 font-mono text-sm uppercase tracking-wider text-[var(--brand)] disabled:opacity-50"
        >
          {civicDone ? "✓ Civic Pass verified" : "Verify with Civic"}
        </button>

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
