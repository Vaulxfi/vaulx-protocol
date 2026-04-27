"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DemoShell } from "../../../_components/demo-shell";
import { LiveBadge } from "../../../_components/integration-badges";
import { useDemoSession } from "../../../_lib/use-demo-session";
import type { AppraisalResponse, SourceResult } from "@/lib/appraisal/types";

const USD = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function fmtUsdc(v: number | undefined): string {
  if (v === undefined || Number.isNaN(v)) return "—";
  return `$${USD.format(Math.round(v))}`;
}

// Mulberry32 PRNG seeded from sessionId so refreshes produce stable history.
// 24-point random walk centered on `median`. ±2% per hour, clamped to ±8%.
function priceHistoryFrom(median: number, sessionId: string): number[] {
  let seed = 0;
  for (let i = 0; i < sessionId.length; i++) {
    seed = (seed * 31 + sessionId.charCodeAt(i)) >>> 0;
  }
  const rand = () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const points: number[] = [median];
  let lastFactor = 1;
  for (let i = 1; i < 24; i++) {
    const step = (rand() - 0.5) * 0.04; // ±2%
    let nextFactor = lastFactor + step;
    nextFactor = Math.max(0.92, Math.min(1.08, nextFactor)); // clamp ±8%
    points.push(Math.round(median * nextFactor));
    lastFactor = nextFactor;
  }
  return points;
}

export default function AppraisalRevealPage() {
  const router = useRouter();
  const params = useParams<{ reqId: string }>();
  const reqId = params?.reqId;
  const { session, patch } = useDemoSession();
  const [response, setResponse] = useState<AppraisalResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<number>(0); // 0..3 sources, 4 = median
  const [persisted, setPersisted] = useState(false);

  // Redirect if no watch info yet.
  useEffect(() => {
    if (session && !session.watch) {
      router.replace("/demo/borrow/register");
    }
  }, [session, router]);

  // Fire the appraisal request once watch info is available.
  useEffect(() => {
    if (!session?.watch || response) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/appraisal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            make: session.watch!.make,
            model: session.watch!.model,
            ref: session.watch!.ref,
            year: session.watch!.year,
            condition: session.watch!.condition,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(
            (err && typeof err.error === "string" && err.error) ||
              `Appraisal failed (${res.status})`,
          );
        }
        const data = (await res.json()) as AppraisalResponse;
        if (!cancelled) setResponse(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session?.watch, response]);

  // Stagger reveal: 0ms, 200ms, 400ms for source cards; 700ms for median.
  useEffect(() => {
    if (!response) return;
    const t1 = setTimeout(() => setRevealed(1), 0);
    const t2 = setTimeout(() => setRevealed(2), 200);
    const t3 = setTimeout(() => setRevealed(3), 400);
    const t4 = setTimeout(() => setRevealed(4), 700);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [response]);

  // Persist appraisal + price history once response lands.
  useEffect(() => {
    if (!response || !session || persisted) return;
    const median = response.median;
    const history = priceHistoryFrom(median, session.sessionId);
    patch((prev) => {
      if (!prev.watch) return prev;
      return {
        ...prev,
        watch: {
          ...prev.watch,
          appraisal: {
            chrono24: response.chrono24.value ?? median,
            watchcharts: response.watchcharts.value ?? median,
            internal: response.internal.value ?? median,
            median,
          },
          priceHistory: history,
        },
      };
    });
    setPersisted(true);
  }, [response, session, patch, persisted]);

  const sources = useMemo(() => {
    if (!response) return null;
    return [
      { name: "Chrono24", res: response.chrono24 },
      { name: "WatchCharts", res: response.watchcharts },
      { name: "Vaulx Model", res: response.internal },
    ];
  }, [response]);

  if (!session) {
    return (
      <DemoShell formFactor="phone">
        <div className="px-6 py-12 text-[var(--ink-muted)]">Loading…</div>
      </DemoShell>
    );
  }

  if (!session.watch) {
    return (
      <DemoShell formFactor="phone">
        <div className="px-6 py-12 text-[var(--ink-muted)]">Redirecting…</div>
      </DemoShell>
    );
  }

  return (
    <DemoShell formFactor="phone">
      <div className="px-6 py-8">
        <p className="eyebrow">Step 6 / 14 · Appraisal</p>
        <h1 className="display-md mt-3">Three sources. One number.</h1>
        <p className="mt-3 text-sm text-[var(--ink-dim)]">
          Live read for {session.watch.make} {session.watch.model} (ref {session.watch.ref},{" "}
          {session.watch.year}, {session.watch.condition.replace("_", " ")}).
        </p>

        {error ? (
          <div className="mt-6 rounded-md border border-red-500/40 bg-red-500/10 p-4">
            <p className="font-mono text-xs uppercase tracking-wider text-red-400">
              Appraisal failed
            </p>
            <p className="mt-2 text-sm text-[var(--ink-dim)]">{error}</p>
            <button
              onClick={() => router.push("/demo/borrow/register")}
              className="mt-4 w-full rounded-md border border-[var(--rule)] px-4 py-2 font-mono text-xs uppercase tracking-wider text-[var(--ink-dim)]"
            >
              Start over
            </button>
          </div>
        ) : !response || !sources ? (
          <div className="mt-8 flex flex-col gap-3">
            <SkeletonCard label="Chrono24" />
            <SkeletonCard label="WatchCharts" />
            <SkeletonCard label="Vaulx Model" />
            <p className="mt-2 font-mono text-[11px] uppercase tracking-wider text-[var(--ink-muted)]">
              Triangulating…
            </p>
          </div>
        ) : (
          <>
            <div className="mt-8 flex flex-col gap-3">
              {sources.map((s, i) => (
                <SourceCard
                  key={s.name}
                  title={s.name}
                  result={s.res}
                  shown={revealed > i}
                />
              ))}
            </div>

            <div
              className={`mt-6 relative overflow-hidden rounded-md border-l-4 border-l-[var(--brand)] border border-[var(--brand)]/40 bg-[var(--brand)]/10 p-5 transition-all duration-500 ${
                revealed >= 4 ? "opacity-100 scale-100" : "opacity-0 scale-95"
              }`}
            >
              <p className="eyebrow" style={{ color: "var(--brand)" }}>
                Median of three · your appraisal
              </p>
              <div className="mt-3 flex items-baseline gap-2">
                <span
                  className="font-mono text-4xl font-medium leading-none tracking-[-0.02em] text-[var(--ink)]"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {fmtUsdc(response.median)}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                  USDC
                </span>
              </div>
              <p className="mt-3 text-sm text-[var(--ink-dim)]">
                This is your appraisal value. Maximum 60% LTV against this number.
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={() => router.push("/demo/borrow/loan-offer/" + reqId)}
                disabled={!persisted}
                className="w-full rounded-md border border-[var(--brand)] bg-[var(--brand)] px-4 py-3 font-mono text-sm uppercase tracking-wider text-[var(--bg)] disabled:opacity-50"
              >
                Continue with this appraisal →
              </button>
              <button
                onClick={() => router.push("/demo/borrow/register")}
                className="w-full rounded-md border border-[var(--rule)] px-4 py-3 font-mono text-sm uppercase tracking-wider text-[var(--ink-dim)]"
              >
                Start over
              </button>
              <p className="mt-1 text-center font-mono text-[10px] uppercase tracking-wider text-[var(--ink-muted)]">
                {/* loan-offer/[reqId] is a Phase 3 placeholder until Task 3.2 ships */}
                Next page lands in Phase 3
              </p>
            </div>

            <div className="mt-6 flex justify-center">
              <LiveBadge partner="Chrono24 · WatchCharts" />
            </div>
          </>
        )}
      </div>
    </DemoShell>
  );
}

function SourceCard({
  title,
  result,
  shown,
}: {
  title: string;
  result: SourceResult;
  shown: boolean;
}) {
  const val =
    result.ok && typeof result.value === "number"
      ? `$${USD.format(Math.round(result.value))}`
      : "—";
  const statusLabel = result.fallback ? "FALLBACK" : result.ok ? "LIVE" : "ERROR";
  const statusColor = result.fallback
    ? "text-amber-400"
    : result.ok
      ? "text-emerald-400"
      : "text-red-400";

  return (
    <div
      className={`rounded-md border border-[var(--rule)] bg-[var(--bg)] p-4 transition-all duration-300 ${
        shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
          {title}
        </span>
        <span
          className={`font-mono text-[10px] uppercase tracking-[0.18em] ${statusColor}`}
        >
          · {statusLabel}
        </span>
      </div>
      <div
        className="mt-2 font-mono text-2xl text-[var(--ink)]"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {val}
      </div>
      {result.detail ? (
        <p className="mt-2 text-xs leading-relaxed text-[var(--ink-muted)]">{result.detail}</p>
      ) : null}
    </div>
  );
}

function SkeletonCard({ label }: { label: string }) {
  return (
    <div className="rounded-md border border-[var(--rule)] bg-[var(--bg)] p-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
          {label}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
          · …
        </span>
      </div>
      <div className="mt-3 h-7 w-32 animate-pulse rounded bg-[var(--rule)]/60" />
    </div>
  );
}
