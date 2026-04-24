"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface LoanBreadcrumb {
  loanId: string;
  ccbHash: string;
  txSig: string;
  appraisal: number;
  loanAmount: number;
  termDays: number;
  dueTs: number;
  rateBps: number;
}

interface CustodyPollResponse {
  confirmed: boolean;
  confirmedAt?: number;
  doc_hash?: string;
  reason?: string;
}

const USD = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});
function fmtUsdc(v: number): string {
  return `$${USD.format(Math.round(v))} USDC`;
}
function toIsoDate(unixSec: number): string {
  return new Date(unixSec * 1000).toISOString().slice(0, 10);
}
function shorten(pda: string, head = 4, tail = 4): string {
  if (pda.length <= head + tail + 1) return pda;
  return `${pda.slice(0, head)}…${pda.slice(-tail)}`;
}

const DEV_SHORTCUTS = process.env.NEXT_PUBLIC_VAULX_DEV_SHORTCUTS === "1";

export default function AwaitingCustodyPage() {
  return (
    <Suspense fallback={null}>
      <AwaitingCustodyContent />
    </Suspense>
  );
}

function AwaitingCustodyContent() {
  const params = useParams<{ trdc: string }>();
  const trdc = params?.trdc ?? "";

  const [crumb, setCrumb] = useState<LoanBreadcrumb | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!trdc) return;
    try {
      const raw = sessionStorage.getItem(`vaulx_loan_${trdc}`);
      if (raw) setCrumb(JSON.parse(raw) as LoanBreadcrumb);
    } catch {
      /* ignore */
    } finally {
      setHydrated(true);
    }
  }, [trdc]);

  const pollQuery = useQuery<CustodyPollResponse>({
    queryKey: ["custody-confirmed", trdc],
    enabled: !!trdc,
    refetchInterval: (q) =>
      (q.state.data as CustodyPollResponse | undefined)?.confirmed
        ? false
        : 3000,
    queryFn: async () => {
      const res = await fetch(
        `/api/onchain-events/custody-confirmed?trdc=${encodeURIComponent(trdc)}`,
        { cache: "no-store" },
      );
      if (!res.ok) throw new Error(`poll failed ${res.status}`);
      return (await res.json()) as CustodyPollResponse;
    },
  });

  if (!hydrated) return null;

  const confirmed = pollQuery.data?.confirmed === true;

  return (
    <main className="min-h-screen bg-background px-6 py-12">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        {confirmed ? (
          <CustodyConfirmedView trdc={trdc} />
        ) : (
          <AwaitingView trdc={trdc} crumb={crumb} pollReason={pollQuery.data?.reason} />
        )}
      </div>
    </main>
  );
}

function AwaitingView({
  trdc,
  crumb,
  pollReason,
}: {
  trdc: string;
  crumb: LoanBreadcrumb | null;
  pollReason?: string;
}) {
  return (
    <>
      <header>
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
          Your TRDC is minted — awaiting custody
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ship your watch to our custodian. Once they confirm receipt, your
          loan will auto-advance to disbursement.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>TRDC</CardTitle>
          <CardDescription>On-chain state account (PDA)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="inline-flex rounded-full border border-border bg-muted/40 px-3 py-1 font-mono text-xs">
            {trdc}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ship your watch to</CardTitle>
          <CardDescription>
            Include the reference below inside the package.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <address className="not-italic leading-relaxed">
            <div className="font-medium">Vaulx Custody</div>
            <div className="text-muted-foreground">
              42 Paulista Ave
              <br />
              São Paulo, SP 01310-100
              <br />
              Brazil
            </div>
          </address>
          <div className="rounded-md border border-border bg-muted/30 p-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Package reference
            </div>
            <div className="mt-1 font-mono text-sm">TRDC #{shorten(trdc, 8, 6)}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <span
            className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent"
            aria-hidden
          />
          <span className="text-sm">Waiting for custody confirmation…</span>
        </CardContent>
      </Card>

      {crumb && (
        <Card>
          <CardHeader>
            <CardTitle>Loan details</CardTitle>
            <CardDescription>From your minted TRDC</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-1.5 text-sm">
              <dt className="text-muted-foreground">Appraisal</dt>
              <dd className="tabular-nums">{fmtUsdc(crumb.appraisal)}</dd>
              <dt className="text-muted-foreground">Loan amount</dt>
              <dd className="tabular-nums">{fmtUsdc(crumb.loanAmount)}</dd>
              <dt className="text-muted-foreground">Term</dt>
              <dd>{crumb.termDays} days</dd>
              <dt className="text-muted-foreground">Due date</dt>
              <dd className="tabular-nums">{toIsoDate(crumb.dueTs)}</dd>
              <dt className="text-muted-foreground">Asset hint (CCB hash)</dt>
              <dd className="break-all font-mono text-xs">0x{crumb.ccbHash}</dd>
            </dl>
          </CardContent>
        </Card>
      )}

      {pollReason === "supabase_not_configured" && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
          Indexer/Supabase env not wired — polling is a no-op. The page will
          advance once <code>SUPABASE_SERVICE_ROLE_KEY</code> is set and the
          indexer is running.
        </div>
      )}

      {DEV_SHORTCUTS && crumb && (
        <div className="text-xs">
          <Link
            href={`/custodian/intake/${trdc}?hash=${crumb.ccbHash}`}
            className="text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Open custodian intake →
          </Link>
        </div>
      )}
    </>
  );
}

function CustodyConfirmedView({ trdc }: { trdc: string }) {
  const router = useRouter();
  return (
    <>
      <header className="flex flex-col items-center text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            className="h-6 w-6"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="mt-4 font-heading text-3xl font-semibold tracking-tight text-foreground">
          Custody confirmed
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your watch is secured. Proceed to disbursement.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>TRDC</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="inline-flex rounded-full border border-border bg-muted/40 px-3 py-1 font-mono text-xs">
            {trdc}
          </div>
        </CardContent>
      </Card>

      <Button
        className="bg-brand-gold text-brand-blue hover:bg-brand-gold/90"
        onClick={() => router.push(`/borrow/loans/${trdc}/disburse`)}
      >
        Continue to disbursement
      </Button>
    </>
  );
}
