"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { DemoShell } from "../../../_components/demo-shell";
import { useDemoSession } from "../../../_lib/use-demo-session";
import { CUSTODIANS } from "../../../_fixtures/custodian-slots";

type Stage = "inspecting" | "signing" | "confirmed";

const STAGE_LABEL: Record<Stage, string> = {
  inspecting: "Custodian inspecting…",
  signing: "Custodian signing…",
  confirmed: "Custody confirmed",
};

export default function AwaitingCustodyPage() {
  const router = useRouter();
  const params = useParams<{ trdc: string }>();
  const trdc = params?.trdc ?? "";
  const { session, patch } = useDemoSession();

  const [stage, setStage] = useState<Stage>("inspecting");
  const [persisted, setPersisted] = useState(false);

  // Redirect if no loan.
  useEffect(() => {
    if (session && !session.loan) {
      router.replace("/demo/borrow/register");
    }
  }, [session, router]);

  // Auto-progression: 0 → inspecting, 1500ms → signing, 3000ms → confirmed.
  useEffect(() => {
    if (!session?.loan) return;
    const t1 = setTimeout(() => setStage("signing"), 1500);
    const t2 = setTimeout(() => setStage("confirmed"), 3000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [session?.loan]);

  // Persist confirmation when stage flips.
  useEffect(() => {
    if (stage !== "confirmed" || persisted || !session?.loan) return;
    patch((s) => ({
      ...s,
      loan: s.loan
        ? {
            ...s.loan,
            custody: { ...s.loan.custody, confirmedAt: Date.now() },
          }
        : s.loan,
      tour: { ...s.tour, step: 9 },
    }));
    setPersisted(true);
  }, [stage, persisted, session, patch]);

  const skip = () => setStage("confirmed");

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

  const loan = session.loan;
  const custodian = CUSTODIANS.find((c) => c.id === loan.custody.provider);
  const slot = loan.custody.bookedSlot ?? "—";

  return (
    <DemoShell formFactor="phone">
      <div className="px-6 py-8">
        <p className="eyebrow">Step 9 / 14 · Custody · Confirming</p>
        <h1 className="display-md mt-3">Watch in transit. IoT live.</h1>
        <p className="mt-3 text-sm text-[var(--ink-dim)]">
          Tracking ID{" "}
          <span
            className="font-mono text-[var(--ink)]"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {trdc.slice(0, 8).toUpperCase()}
          </span>
        </p>

        {/* IoT feed */}
        <div className="mt-6 overflow-hidden rounded-md border border-[var(--rule-strong)] bg-black">
          <div className="flex items-center justify-between border-b border-[var(--rule)] bg-[var(--bg-elev-1)] px-3 py-2">
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-2 w-2 rounded-full bg-[var(--brand)]"
                style={{ animation: "pulse 1.4s ease-in-out infinite" }}
              />
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--brand)]">
                Live
              </span>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
              VX-CCTV · MOCK
            </span>
          </div>
          <div className="relative aspect-video">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/demo/iot-feed-placeholder.svg"
              alt="Vault interior IoT feed (placeholder)"
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        {/* Booking summary */}
        <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded border border-[var(--rule)] bg-[var(--rule)]">
          <div className="bg-[var(--bg)] p-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
              Custodian
            </div>
            <div className="mt-1 font-mono text-sm text-[var(--ink)]">
              {custodian?.name ?? loan.custody.provider}
            </div>
          </div>
          <div className="bg-[var(--bg)] p-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
              Slot
            </div>
            <div
              className="mt-1 font-mono text-sm text-[var(--ink)]"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {slot}
            </div>
          </div>
        </div>

        {/* Status timeline */}
        <div className="mt-6 rounded-md border border-[var(--rule)] bg-[var(--bg-elev-1)] p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
            Status
          </p>
          <ol className="mt-3 flex flex-col gap-3">
            {(["inspecting", "signing", "confirmed"] as const).map((s) => {
              const order = { inspecting: 0, signing: 1, confirmed: 2 } as const;
              const isDone = order[stage] > order[s];
              const isActive = stage === s;
              return (
                <li key={s} className="flex items-center gap-3">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${
                      isDone || isActive ? "bg-[var(--brand)]" : "bg-[var(--rule)]"
                    }`}
                    style={isActive ? { animation: "pulse 1.4s ease-in-out infinite" } : undefined}
                  />
                  <span
                    className={`font-mono text-xs uppercase tracking-[0.14em] ${
                      isActive
                        ? "text-[var(--brand)]"
                        : isDone
                          ? "text-[var(--ink)]"
                          : "text-[var(--ink-muted)]"
                    }`}
                  >
                    {STAGE_LABEL[s]}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        {/* CTA */}
        <div className="mt-6 flex flex-col gap-3">
          {stage !== "confirmed" ? (
            <button
              type="button"
              onClick={skip}
              className="w-full rounded-md border border-[var(--rule)] px-4 py-3 font-mono text-xs uppercase tracking-wider text-[var(--ink-dim)]"
            >
              Skip wait
            </button>
          ) : (
            <Link
              href="/demo/borrow/disburse"
              className="block w-full rounded-md border border-[var(--brand)] bg-[var(--brand)] px-4 py-3 text-center font-mono text-sm uppercase tracking-wider text-[var(--bg)]"
            >
              Continue → Disburse
            </Link>
          )}
        </div>

        <style jsx>{`
          @keyframes pulse {
            0%,
            100% {
              opacity: 1;
            }
            50% {
              opacity: 0.35;
            }
          }
        `}</style>
      </div>
    </DemoShell>
  );
}
