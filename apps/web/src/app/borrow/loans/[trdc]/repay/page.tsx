"use client";

import { Suspense, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";

import { EditorialSection } from "@/components/vaulx/editorial-section";
import { LoanContextPanel } from "@/components/vaulx/loan-context-panel";
import { SiteFooter } from "@/components/vaulx/site-footer";
import { SiteHeader } from "@/components/vaulx/site-header";
import { SolanaPayQr } from "@/components/vaulx/solana-pay-qr";
import { useLoanRepay } from "@/lib/chain/loan";
import { useLoanSummary } from "@/lib/chain/loan-summary";
import { USDC_MINT } from "@/lib/usdc";

const USD = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
function fmtAtoms(atoms: bigint): string {
  return USD.format(Number(atoms) / 1_000_000);
}

export default function LoanRepayPage() {
  return (
    <>
      <SiteHeader />
      <Suspense fallback={null}>
        <RepayContent />
      </Suspense>
      <SiteFooter />
    </>
  );
}

function RepayContent() {
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
          eyebrow="Step · Full payoff"
          headline="Pay off your CCB"
          lead="Settle the loan in one transaction. Your TRDC transitions to Repaid and the custodian releases your watch from the vault."
        />

        <div className="mt-14 grid gap-8 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-5">
            {trdcPda ? (
              <RepayPanel trdcPda={trdcPda} summary={summary} trdc={trdc} />
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

function RepayPanel({
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
  const mutation = useLoanRepay();

  const principal = summary?.principalRemainingAtoms ?? 0n;
  const accrued = summary?.accruedAtoms ?? 0n;
  const payoff = summary?.payoffAtoms ?? 0n;
  const isTerminal = summary?.isTerminal ?? false;

  const canRepay =
    !!summary &&
    !isTerminal &&
    principal > 0n &&
    !!publicKey &&
    !mutation.isPending;

  async function onRepay() {
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
      });
      toast.success("Loan repaid");
      router.push(`/borrow/loans/${trdc}/repaid`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div className="flex flex-col gap-6">
    <div className="border border-[var(--rule)] bg-[var(--bg-elev-1)] p-6 md:p-8">
      <span className="eyebrow">Payoff · Desktop wallet</span>

      <dl className="mt-6 flex flex-col">
        <Line k="Principal remaining" v={`${fmtAtoms(principal)} USDC`} />
        <Line k="Accrued interest to today" v={`${fmtAtoms(accrued)} USDC`} />
        <Line
          k="Total payoff"
          v={`${fmtAtoms(payoff)} USDC`}
          accent
        />
      </dl>

      <div className="mt-6 border border-[var(--signal-warn)] bg-[var(--bg)] p-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--signal-warn)]">
          After this transaction
        </div>
        <p className="mt-2 font-sans text-sm leading-[1.55] text-[var(--ink-dim)]">
          Your TRDC transitions to <span className="font-mono text-[var(--ink)]">Repaid</span> and the custodian will release your watch.
        </p>
      </div>

      {isTerminal && (
        <div className="mt-4 border border-[var(--signal-warn)] bg-[var(--bg)] p-3 font-mono text-xs text-[var(--signal-warn)]">
          Loan is {summary?.statusLabel} — cannot repay.
        </div>
      )}

      <button
        onClick={onRepay}
        disabled={!canRepay}
        className="btn-gold mt-6 w-full justify-center disabled:cursor-not-allowed disabled:opacity-40"
      >
        {mutation.isPending ? "Signing…" : `Pay off ${fmtAtoms(payoff)} USDC`}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-4 w-4">
          <path strokeLinecap="round" d="M5 12h14M13 5l7 7-7 7" />
        </svg>
      </button>
    </div>

    <SolanaPayQr
      kind="repay"
      trdc={trdc}
      disabled={isTerminal || principal === 0n}
      label="Pay off from mobile · Solana Pay"
    />
    </div>
  );
}

function Line({
  k,
  v,
  accent = false,
}: {
  k: string;
  v: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline justify-between border-b border-[var(--rule)] py-3 last:border-b-0 ${
        accent ? "border-t border-[var(--rule-strong)] pt-4" : ""
      }`}
    >
      <dt
        className={`font-mono text-[10px] uppercase tracking-[0.18em] ${
          accent ? "text-[var(--ink)]" : "text-[var(--ink-muted)]"
        }`}
      >
        {k}
      </dt>
      <dd
        className={`font-mono tabnums ${
          accent ? "text-xl text-[var(--brand)]" : "text-sm text-[var(--ink)]"
        }`}
      >
        {v}
      </dd>
    </div>
  );
}
