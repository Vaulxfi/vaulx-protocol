"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { EditorialSection } from "@/components/vaulx/editorial-section";
import { SiteFooter } from "@/components/vaulx/site-footer";
import { SiteHeader } from "@/components/vaulx/site-header";
import { StepRail } from "@/components/vaulx/step-rail";
import type {
  AppraisalInput,
  AppraisalResponse,
  SourceResult,
} from "@/lib/appraisal/types";

interface Stashed {
  input: AppraisalInput;
  response: AppraisalResponse;
}

const USD = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function fmtUsdc(v: number | undefined): string {
  if (v === undefined || Number.isNaN(v)) return "—";
  return `$${USD.format(Math.round(v))}`;
}

export default function AppraisalPage() {
  return (
    <>
      <SiteHeader />
      <StepRail />
      <Suspense fallback={null}>
        <AppraisalContent />
      </Suspense>
      <SiteFooter />
    </>
  );
}

function AppraisalContent() {
  const router = useRouter();
  const params = useParams<{ reqId: string }>();
  const reqId = params?.reqId;
  const [state, setState] = useState<Stashed | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!reqId) return;
    try {
      const raw = sessionStorage.getItem(`vaulx_appraisal_${reqId}`);
      if (!raw) {
        router.replace("/borrow/new/asset");
        return;
      }
      setState(JSON.parse(raw) as Stashed);
    } catch {
      router.replace("/borrow/new/asset");
    } finally {
      setHydrated(true);
    }
  }, [reqId, router]);

  const sources = useMemo(() => {
    if (!state) return null;
    return [
      { name: "Chrono24", key: "chrono24" as const, res: state.response.chrono24 },
      { name: "WatchCharts", key: "watchcharts" as const, res: state.response.watchcharts },
      { name: "Vaulx Model", key: "internal" as const, res: state.response.internal },
    ];
  }, [state]);

  if (!hydrated) return null;
  if (!state || !sources) return null;

  const { response, input } = state;

  function onContinue() {
    if (!reqId) return;
    sessionStorage.setItem(
      `vaulx_appraisal_${reqId}_locked`,
      JSON.stringify({ median: response.median, lockedAt: Date.now() }),
    );
    router.push(`/borrow/new/terms/${reqId}`);
  }

  return (
    <main className="relative min-h-[calc(100vh-72px-64px)]">
      <div className="mx-auto w-full max-w-[1440px] px-6 py-16 md:px-10 md:py-20">
        <EditorialSection
          eyebrow="Step 04 — Appraisal"
          headline="Three sources. One number."
          lead={`Live read for ${input.make} ${input.model} (ref ${input.ref}, ${input.year}, ${input.condition.replace("_", " ")}).`}
        />

        <div className="mt-14 grid gap-10 md:grid-cols-12 md:gap-8">
          {/* LEFT: three sources */}
          <div className="md:col-span-7">
            <div className="grid gap-px border border-[var(--rule)] bg-[var(--rule)] sm:grid-cols-3">
              {sources.map((s) => (
                <SourceCell key={s.key} title={s.name} result={s.res} />
              ))}
            </div>

            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
              Sources fallback to Vaulx&apos;s internal model when scrapers fail — never blocking.
            </p>
          </div>

          {/* RIGHT: locked median + CTA */}
          <aside className="md:col-span-5">
            <div className="border border-[var(--brand)] bg-[var(--brand-wash)] p-8 md:p-10">
              <span className="eyebrow" style={{ color: "var(--brand)" }}>
                Your appraisal — median of three
              </span>
              <div className="mt-6 flex items-baseline gap-3">
                <span
                  className="font-mono text-6xl font-medium leading-none tracking-[-0.02em] text-[var(--ink)] tabnums"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {fmtUsdc(response.median)}
                </span>
                <span className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                  USDC
                </span>
              </div>
              <p className="mt-6 font-sans text-sm leading-[1.65] text-[var(--ink-dim)]">
                Locked on loan acceptance. Maximum 60% LTV against this number.
              </p>

              <div className="mt-10 flex flex-col gap-3">
                <button onClick={onContinue} className="btn-gold w-full justify-center">
                  Continue to terms
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-4 w-4">
                    <path strokeLinecap="round" d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => router.push("/borrow/new/asset")}
                  className="btn-ghost w-full justify-center"
                >
                  Start over
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function SourceCell({ title, result }: { title: string; result: SourceResult }) {
  const USD = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  const val =
    result.ok && typeof result.value === "number"
      ? `$${USD.format(Math.round(result.value))}`
      : "—";

  const statusLabel = result.fallback ? "FALLBACK" : result.ok ? "LIVE" : "ERROR";
  const statusColor = result.fallback
    ? "var(--signal-warn)"
    : result.ok
      ? "var(--signal-good)"
      : "var(--signal-bad)";

  return (
    <div className="bg-[var(--bg-elev-1)] p-6">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
          {title}
        </span>
        <span
          className="font-mono text-[10px] uppercase tracking-[0.18em]"
          style={{ color: statusColor }}
        >
          · {statusLabel}
        </span>
      </div>
      <div className="mt-6 font-mono text-3xl text-[var(--ink)] tabnums">
        {val}
      </div>
      {result.detail ? (
        <p className="mt-3 font-sans text-xs leading-relaxed text-[var(--ink-muted)]">
          {result.detail}
        </p>
      ) : null}
    </div>
  );
}
