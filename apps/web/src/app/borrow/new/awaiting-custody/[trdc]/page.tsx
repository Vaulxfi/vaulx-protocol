"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { EditorialSection } from "@/components/vaulx/editorial-section";
import { SiteFooter } from "@/components/vaulx/site-footer";
import { SiteHeader } from "@/components/vaulx/site-header";
import { StepRail } from "@/components/vaulx/step-rail";

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
    <>
      <SiteHeader />
      <StepRail />
      <Suspense fallback={null}>
        <AwaitingCustodyContent />
      </Suspense>
      <SiteFooter />
    </>
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
    <main className="relative min-h-[calc(100vh-72px-64px)]">
      <div className="mx-auto w-full max-w-[1440px] px-6 py-16 md:px-10 md:py-20">
        {confirmed ? (
          <CustodyConfirmedView trdc={trdc} />
        ) : (
          <AwaitingView
            trdc={trdc}
            crumb={crumb}
            pollReason={pollQuery.data?.reason}
          />
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
      <EditorialSection
        eyebrow="Step 06 — Awaiting Custody"
        headline="TRDC minted. Ship the asset."
        lead="Your credit note is live on-chain. Once our custodian confirms receipt of the watch, your USDC will auto-disburse."
      />

      <div className="mt-14 grid gap-8 md:grid-cols-12 md:gap-8">
        {/* LEFT: PDA + shipping + status */}
        <div className="flex flex-col gap-8 md:col-span-7">
          <div className="border border-[var(--rule)] bg-[var(--bg-elev-1)] p-6 md:p-8">
            <span className="eyebrow">TRDC · On-chain state</span>
            <div className="mt-5 break-all border border-[var(--rule-strong)] bg-[var(--bg)] px-4 py-3 font-mono text-xs text-[var(--brand)]">
              {trdc}
            </div>
          </div>

          <div className="border border-[var(--rule)] bg-[var(--bg-elev-1)] p-6 md:p-8">
            <span className="eyebrow">Ship your watch to</span>
            <address className="mt-5 not-italic leading-relaxed">
              <div className="font-display text-xl text-[var(--ink)]">Vaulx Custody</div>
              <div className="mt-2 font-sans text-sm text-[var(--ink-dim)]">
                42 Paulista Ave
                <br />
                São Paulo, SP 01310-100
                <br />
                Brazil
              </div>
            </address>
            <div className="mt-6 border-t border-[var(--rule)] pt-5">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                Package reference · place inside box
              </div>
              <div className="mt-3 font-mono text-lg text-[var(--brand)]">
                TRDC #{shorten(trdc, 8, 6)}
              </div>
            </div>
          </div>

          <div className="border border-[var(--rule)] bg-[var(--bg-elev-1)] p-6 md:p-8">
            <span className="eyebrow">Status</span>
            <div className="mt-5 flex items-center gap-3">
              <span
                className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-[var(--brand)] border-t-transparent"
                aria-hidden
              />
              <span className="font-mono text-sm text-[var(--ink)]">
                Waiting for custody confirmation…
              </span>
            </div>
          </div>

          {pollReason === "supabase_not_configured" && (
            <div className="border border-[var(--signal-warn)] bg-[var(--bg-elev-1)] p-4 font-mono text-xs text-[var(--signal-warn)]">
              Indexer/Supabase env not wired — polling is a no-op. The page will advance once{" "}
              <code>SUPABASE_SERVICE_ROLE_KEY</code> is set and the indexer is running.
            </div>
          )}

          {DEV_SHORTCUTS && crumb && (
            <div>
              <Link
                href={`/custodian/intake/${trdc}?hash=${crumb.ccbHash}`}
                className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)] underline underline-offset-4 transition-colors hover:text-[var(--brand)]"
              >
                Open custodian intake →
              </Link>
            </div>
          )}
        </div>

        {/* RIGHT: loan details */}
        <aside className="md:col-span-5">
          {crumb && (
            <div className="border border-[var(--rule)] bg-[var(--bg-elev-1)] p-6 md:p-8">
              <span className="eyebrow">Loan details</span>
              <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-6 gap-y-4 font-mono text-xs">
                <Row k="Appraisal" v={fmtUsdc(crumb.appraisal)} />
                <Row k="Principal" v={fmtUsdc(crumb.loanAmount)} />
                <Row k="Term" v={`${crumb.termDays} days`} />
                <Row k="Due" v={toIsoDate(crumb.dueTs)} />
                <dt className="text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                  CCB hash
                </dt>
                <dd className="break-all text-[var(--ink-dim)] tabnums">
                  0x{crumb.ccbHash}
                </dd>
              </dl>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <>
      <dt className="text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
        {k}
      </dt>
      <dd className="text-[var(--ink)] tabnums">{v}</dd>
    </>
  );
}

function CustodyConfirmedView({ trdc }: { trdc: string }) {
  const router = useRouter();
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center border border-[var(--signal-good)] text-[var(--signal-good)]">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="h-8 w-8"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div>
        <span className="eyebrow">Custody confirmed</span>
        <h1
          className="mt-5 font-display font-extrabold leading-[1.05] tracking-[-0.02em] text-[var(--ink)]"
          style={{
            fontSize: "clamp(2.25rem, 5vw, 4rem)",
            fontVariationSettings: '"opsz" 144'
          }}
        >
          Your asset is secured.
        </h1>
        <p className="mt-6 font-sans text-base leading-[1.65] text-[var(--ink-dim)]">
          Proceed to disbursement.
        </p>
      </div>

      <div className="w-full max-w-md border border-[var(--rule)] bg-[var(--bg-elev-1)] p-6">
        <span className="eyebrow">TRDC</span>
        <div className="mt-4 break-all font-mono text-xs text-[var(--brand)]">
          {trdc}
        </div>
      </div>

      <button
        onClick={() => router.push(`/borrow/loans/${trdc}/disburse`)}
        className="btn-gold"
      >
        Continue to disbursement
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-4 w-4">
          <path strokeLinecap="round" d="M5 12h14M13 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
