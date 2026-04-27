"use client";
import { useEffect, useState } from "react";
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
