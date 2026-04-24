"use client";

import { Suspense, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { rateForTermDays } from "@vaulx/terms";

import { EditorialSection } from "@/components/vaulx/editorial-section";
import { LoanContextPanel } from "@/components/vaulx/loan-context-panel";
import { SiteFooter } from "@/components/vaulx/site-footer";
import { SiteHeader } from "@/components/vaulx/site-header";
import { useLoanRenew } from "@/lib/chain/loan";
import { useLoanSummary } from "@/lib/chain/loan-summary";
import { USDC_MINT } from "@/lib/usdc";

const USD = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
function fmtAtoms(atoms: bigint): string {
  return USD.format(Number(atoms) / 1_000_000);
}
function toIsoDate(unixSec: number): string {
  if (!unixSec) return "—";
  return new Date(unixSec * 1000).toISOString().slice(0, 10);
}
function formatBpsPct(bps: number): string {
  const whole = Math.floor(bps / 100);
  const rem = bps % 100;
  return `${whole}.${rem.toString().padStart(2, "0")}%`;
}

const TERMS = [30, 60, 90] as const;
type TermDays = (typeof TERMS)[number];

export default function LoanRenewPage() {
  return (
    <>
      <SiteHeader />
      <Suspense fallback={null}>
        <RenewContent />
      </Suspense>
      <SiteFooter />
    </>
  );
}

function RenewContent() {
  const params = useParams<{ trdc: string }>();
  const trdc = params?.trdc ?? "";
  const summaryQuery = useLoanSummary(trdc);
  const summary = summaryQuery.data ?? null;

  const trdcPda = useMemo(() => {
    try {
      return new PublicKey(trdc);
    } catch {
      return null;
    }
  }, [trdc]);

  return (
    <main className="relative min-h-[calc(100vh-72px-64px)]">
      <div className="mx-auto w-full max-w-[1440px] px-6 py-16 md:px-10 md:py-20">
        <EditorialSection
          eyebrow="Step · Renewal"
          headline="Renew your loan"
          lead="Pay today's accrued interest plus a flat 2% fee on remaining principal. Your term restarts and interest accrues from today."
        />

        <div className="mt-14 grid gap-8 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-5">
            {trdcPda ? (
              <RenewForm trdcPda={trdcPda} summary={summary} trdc={trdc} />
            ) : (
              <div className="border border-[var(--signal-bad)] bg-[var(--bg-elev-1)] p-6">
                <span className="eyebrow" style={{ color: "var(--signal-bad)" }}>
                  Invalid TRDC
                </span>
              </div>
            )}
          </div>
          <div className="md:col-span-7">
            <LoanContextPanel summary={summary} trdcBase58={trdc} />
          </div>
        </div>
      </div>
    </main>
  );
}

function RenewForm({
  trdcPda,
  summary,
  trdc,
}: {
  trdcPda: PublicKey;
  summary: ReturnType<typeof useLoanSummary>["data"] | null | undefined;
  trdc: string;
}) {
  const router = useRouter();
  const { publicKey } = useWallet();
  const mutation = useLoanRenew();

  const [termDays, setTermDays] = useState<TermDays>(60);

  const nowSec = Math.floor(Date.now() / 1000);
  const newDueTs = nowSec + termDays * 86_400;
  const newRateBps = rateForTermDays(termDays);

  const accrued = summary?.accruedAtoms ?? 0n;
  const fee = summary?.renewalFeeAtoms ?? 0n;
  const totalDue = accrued + fee;

  const isTerminal = summary?.isTerminal ?? false;
  const canRenew =
    !!summary &&
    !isTerminal &&
    summary.principalRemainingAtoms > 0n &&
    !!publicKey &&
    !mutation.isPending;

  async function onRenew() {
    if (!USDC_MINT) {
      toast.error("NEXT_PUBLIC_USDC_MINT is not set");
      return;
    }
    if (!publicKey) {
      toast.error("Connect your wallet first");
      return;
    }
    try {
      await mutation.mutateAsync({
        trdcPda,
        assetMint: USDC_MINT,
        newTermDays: termDays,
        newDueTs,
      });
      toast.success(
        `Loan renewed — new due ${toIsoDate(newDueTs)} · ${formatBpsPct(newRateBps)} APR`,
      );
      router.push(`/borrow/loans/${trdc}/pay`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div className="border border-[var(--rule)] bg-[var(--bg-elev-1)] p-6 md:p-8">
      <span className="eyebrow">New terms</span>

      <div className="mt-6 flex flex-col gap-6">
        <div>
          <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
            New term length
          </div>
          <div className="grid grid-cols-3 gap-2">
            {TERMS.map((d) => (
              <label
                key={d}
                className={`flex cursor-pointer items-center justify-center border px-3 py-3 font-mono text-xs uppercase tracking-[0.14em] transition-colors ${
                  termDays === d
                    ? "border-[var(--brand)] bg-[var(--brand-wash)] text-[var(--brand)]"
                    : "border-[var(--rule-strong)] bg-[var(--bg)] text-[var(--ink-dim)]"
                }`}
              >
                <input
                  type="radio"
                  name="newTermDays"
                  value={d}
                  checked={termDays === d}
                  onChange={() => setTermDays(d)}
                  className="sr-only"
                />
                {d} days
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-px border border-[var(--rule)] bg-[var(--rule)]">
          <Info label="New rate" value={`${formatBpsPct(newRateBps)} APR`} />
          <Info label="New due" value={toIsoDate(newDueTs)} />
        </div>

        <div className="border border-[var(--rule-strong)] bg-[var(--bg)] p-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
            Total due today
          </div>
          <dl className="mt-4 grid grid-cols-[1fr_auto] gap-y-2 font-mono text-xs">
            <dt className="text-[var(--ink-dim)]">Accrued interest</dt>
            <dd className="text-[var(--ink)] tabnums">{fmtAtoms(accrued)} USDC</dd>
            <dt className="text-[var(--ink-dim)]">
              Renewal fee · 2% of principal
            </dt>
            <dd className="text-[var(--ink)] tabnums">{fmtAtoms(fee)} USDC</dd>
            <dt className="mt-2 border-t border-[var(--rule)] pt-3 font-semibold uppercase tracking-[0.14em] text-[var(--ink)]">
              Total
            </dt>
            <dd className="mt-2 border-t border-[var(--rule)] pt-3 font-mono text-lg text-[var(--brand)] tabnums">
              {fmtAtoms(totalDue)} USDC
            </dd>
          </dl>
        </div>

        {isTerminal && (
          <div className="border border-[var(--signal-warn)] bg-[var(--bg)] p-3 font-mono text-xs text-[var(--signal-warn)]">
            Loan is {summary?.statusLabel} — cannot renew.
          </div>
        )}

        <button
          onClick={onRenew}
          disabled={!canRenew}
          className="btn-gold w-full justify-center disabled:cursor-not-allowed disabled:opacity-40"
        >
          {mutation.isPending
            ? "Signing…"
            : `Renew for ${termDays} days — pay ${fmtAtoms(totalDue)} USDC`}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-4 w-4">
            <path strokeLinecap="round" d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--bg-elev-1)] p-4">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
        {label}
      </div>
      <div className="mt-2 font-mono text-sm text-[var(--ink)] tabnums">{value}</div>
    </div>
  );
}
