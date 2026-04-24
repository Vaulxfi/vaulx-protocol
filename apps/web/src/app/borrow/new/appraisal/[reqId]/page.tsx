"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  return `$${USD.format(Math.round(v))} USDC`;
}

export default function AppraisalPage() {
  return (
    <Suspense fallback={null}>
      <AppraisalContent />
    </Suspense>
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
    <main className="min-h-screen bg-background px-6 py-12">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <header>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
            Appraisal results
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Step 2 of 3 — {input.make} {input.model} (ref {input.ref},{" "}
            {input.year}, {input.condition.replace("_", " ")})
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-3">
          {sources.map((s) => (
            <SourceCard key={s.key} title={s.name} result={s.res} />
          ))}
        </div>

        <Card className="border-brand-gold/40 bg-brand-gold/5">
          <CardHeader>
            <CardDescription>This is your appraisal value</CardDescription>
            <CardTitle className="text-4xl">
              {fmtUsdc(response.median)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Median of real + model appraisals. Final value locked on loan
              acceptance.
            </p>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            onClick={onContinue}
            className="bg-brand-gold text-brand-blue hover:bg-brand-gold/90 sm:flex-1"
          >
            Continue with this appraisal
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/borrow/new/asset")}
            className="sm:w-40"
          >
            Start over
          </Button>
        </div>
      </div>
    </main>
  );
}

function SourceCard({
  title,
  result,
}: {
  title: string;
  result: SourceResult;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">{title}</CardTitle>
          {result.fallback ? (
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-700 dark:text-amber-400">
              fallback
            </span>
          ) : result.ok ? (
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
              live
            </span>
          ) : (
            <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-destructive">
              error
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <div className="text-2xl font-semibold">
          {result.ok ? fmtUsdc(result.value) : "—"}
        </div>
        {result.detail ? (
          <div className="text-xs text-muted-foreground">{result.detail}</div>
        ) : null}
      </CardContent>
    </Card>
  );
}
