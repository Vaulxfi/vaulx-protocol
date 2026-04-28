"use client";
// Phase E (Wire 2): when the borrower came in via the new register → provision
// path, the loan is already in `ActiveInCustody` on-chain (operator-signed
// confirm_custody happens inside /api/demo/provision-loan). In that case we
// short-circuit the booking form and surface the on-chain custody tx-sig as
// a Solscan link, then offer "Continue to disburse". The booking form remains
// for the legacy mock path where someone reached /custody from the loan-offer
// page without on-chain provisioning.
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DemoShell } from "../../_components/demo-shell";
import { useDemoSession } from "../../_lib/use-demo-session";
import {
  CUSTODIANS,
  SLOTS,
  type CustodianId,
} from "../../_fixtures/custodian-slots";

export default function CustodyPage() {
  const router = useRouter();
  const { session, patch } = useDemoSession();

  const [custodianId, setCustodianId] = useState<CustodianId | null>(null);
  const [slot, setSlot] = useState<string | null>(null);

  useEffect(() => {
    if (session && !session.loan) {
      router.replace("/demo/borrow/register");
    }
  }, [session, router]);

  if (!session) {
    return (
      <DemoShell formFactor="phone">
        <div className="px-6 py-12 text-[var(--ink-muted)]">Loading…</div>
      </DemoShell>
    );
  }

  if (!session.loan) {
    return (
      <DemoShell formFactor="phone">
        <div className="px-6 py-12 text-[var(--ink-muted)]">Redirecting…</div>
      </DemoShell>
    );
  }

  // Provisioned-on-chain branch — the operator already advanced the FSM to
  // ActiveInCustody. Skip the booking form and show the confirmation.
  const onchainCustody =
    session.loan.provisionedOnChain && session.loan.custodyTx;
  if (onchainCustody) {
    return (
      <DemoShell formFactor="phone">
        <div className="px-6 py-8">
          <p className="eyebrow" style={{ color: "var(--brand)" }}>
            Step 8 / 14 · Custody
          </p>
          <h1 className="display-md mt-3">Custody confirmed.</h1>
          <p className="mt-3 text-sm text-[var(--ink-dim)]">
            Operator-signed{" "}
            <code className="font-mono text-[var(--brand)]">
              loan.confirm_custody
            </code>{" "}
            advanced your TRDC to{" "}
            <span className="font-mono text-[var(--ink)]">ActiveInCustody</span>
            . Your watch is in the demo vault and the contract is ready to
            release funds.
          </p>

          <div className="mt-6 rounded-md border border-emerald-500/50 bg-emerald-500/10 p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-400">
              ✓ On-chain custody tx
            </p>
            <p className="mt-3 break-all font-mono text-[11px] text-emerald-300">
              <a
                href={`https://solscan.io/tx/${session.loan.custodyTx}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-dotted hover:text-emerald-200"
              >
                {session.loan.custodyTx} ↗
              </a>
            </p>
            {session.loan.trdcStatePda && (
              <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                TRDCState ·{" "}
                <span className="text-[var(--ink-dim)] normal-case">
                  {session.loan.trdcStatePda.slice(0, 6)}…
                  {session.loan.trdcStatePda.slice(-4)}
                </span>
              </p>
            )}
          </div>

          {session.loan.createTx && (
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
              create_ccb_trdc{" "}
              <a
                href={`https://solscan.io/tx/${session.loan.createTx}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-dotted text-[var(--ink-dim)] hover:text-[var(--brand)]"
              >
                {session.loan.createTx.slice(0, 8)}…
                {session.loan.createTx.slice(-4)} ↗
              </a>
            </p>
          )}

          <button
            type="button"
            onClick={() => router.push("/demo/borrow/disburse")}
            className="mt-8 w-full rounded-md border border-[var(--brand)] bg-[var(--brand)] px-4 py-3 font-mono text-sm uppercase tracking-wider text-[var(--bg)]"
          >
            Continue to disburse →
          </button>

          <Link
            href="/demo/borrow/register"
            className="mt-6 block text-center font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)] hover:text-[var(--brand)]"
          >
            ← Provision a different loan
          </Link>
        </div>
      </DemoShell>
    );
  }

  const canSubmit = custodianId !== null && slot !== null;

  const handleSubmit = () => {
    if (!canSubmit) return;
    patch((s) => ({
      ...s,
      loan: s.loan
        ? {
            ...s.loan,
            custody: {
              ...s.loan.custody,
              provider: custodianId!,
              bookedSlot: slot!,
            },
          }
        : s.loan,
      tour: { ...s.tour, step: 8 },
    }));
    const trdc = crypto.randomUUID();
    router.push("/demo/borrow/awaiting-custody/" + trdc);
  };

  return (
    <DemoShell formFactor="phone">
      <div className="px-6 py-8">
        <p className="eyebrow">Step 8 / 14 · Custody</p>
        <h1 className="display-md mt-3">Book your custody window.</h1>
        <p className="mt-3 text-sm text-[var(--ink-dim)]">
          Pick an insured custodian and a transit slot. They handle pickup, transit, and vault
          intake.
        </p>

        {/* Step 1: Custodian */}
        <div className="mt-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
            1 · Custodian
          </p>
          <div className="mt-3 flex flex-col gap-3">
            {CUSTODIANS.map((c) => {
              const selected = custodianId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCustodianId(c.id)}
                  className={`rounded-md border p-4 text-left transition-colors ${
                    selected
                      ? "border-[var(--brand)] bg-[var(--brand)]/10"
                      : "border-[var(--rule)] bg-[var(--bg-elev-1)] hover:border-[var(--rule-strong)]"
                  }`}
                >
                  <div className="flex items-baseline justify-between">
                    <span
                      className={`font-display text-lg ${
                        selected ? "text-[var(--brand)]" : "text-[var(--ink)]"
                      }`}
                    >
                      {c.name}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                      {c.city}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-[var(--ink-dim)]">{c.blurb}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Slot */}
        <div className={`mt-8 transition-opacity ${custodianId ? "opacity-100" : "opacity-40"}`}>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
            2 · Pickup window
          </p>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {SLOTS.map((s) => {
              const selected = slot === s;
              return (
                <button
                  key={s}
                  type="button"
                  disabled={!custodianId}
                  onClick={() => setSlot(s)}
                  className={`rounded border px-3 py-3 text-left font-mono text-xs uppercase tracking-[0.14em] transition-colors disabled:cursor-not-allowed ${
                    selected
                      ? "border-[var(--brand)] bg-[var(--brand)]/10 text-[var(--brand)]"
                      : "border-[var(--rule)] bg-[var(--bg)] text-[var(--ink-dim)]"
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="mt-8 w-full rounded-md border border-[var(--brand)] bg-[var(--brand)] px-4 py-3 font-mono text-sm uppercase tracking-wider text-[var(--bg)] disabled:opacity-50"
        >
          Confirm booking →
        </button>
      </div>
    </DemoShell>
  );
}
