"use client";

import { Suspense, useMemo } from "react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";

import { EditorialSection } from "@/components/vaulx/editorial-section";
import { LoanContextPanel } from "@/components/vaulx/loan-context-panel";
import { SiteFooter } from "@/components/vaulx/site-footer";
import { SiteHeader } from "@/components/vaulx/site-header";
import { SolanaPayQr } from "@/components/vaulx/solana-pay-qr";
import { useLoanInstallment } from "@/lib/chain/loan";
import { useLoanSummary } from "@/lib/chain/loan-summary";
import { USDC_MINT } from "@/lib/usdc";

const USD = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
function fmtAtoms(atoms: bigint): string {
  return USD.format(Number(atoms) / 1_000_000);
}

export default function LoanPayPage() {
  return (
    <>
      <SiteHeader />
      <Suspense fallback={null}>
        <PayContent />
      </Suspense>
      <SiteFooter />
    </>
  );
}

function PayContent() {
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
          eyebrow="Step · Installment"
          headline="Pay an installment"
          lead="Partial payments reduce your outstanding principal and the daily interest accrued against it. Pay as often as you like — the loan remains active until a full payoff."
        />

        <div className="mt-14 grid gap-8 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-5">
            {trdcPda ? (
              <PayForm
                trdcPda={trdcPda}
                trdcBase58={trdc}
                principalRemainingAtoms={summary?.principalRemainingAtoms ?? 0n}
                canPay={!!summary && summary.principalRemainingAtoms > 0n && !summary.isTerminal}
                terminalReason={terminalReason(summary)}
              />
            ) : (
              <InvalidPanel />
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

function terminalReason(s: ReturnType<typeof useLoanSummary>["data"] | null | undefined): string | null {
  if (!s) return null;
  if (s.status === "repaid") return "Loan already repaid.";
  if (s.status === "defaulted") return "Loan has defaulted — payment path is closed.";
  if (s.status === "liquidated") return "Collateral has been liquidated.";
  if (s.principalRemainingAtoms === 0n) return "Principal already at zero.";
  return null;
}

const PaySchema = z.object({
  amount: z
    .string()
    .min(1, "Enter an amount")
    .refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, "Must be > 0"),
});
type PayFormValues = z.infer<typeof PaySchema>;

function PayForm({
  trdcPda,
  trdcBase58,
  principalRemainingAtoms,
  canPay,
  terminalReason,
}: {
  trdcPda: PublicKey;
  trdcBase58: string;
  principalRemainingAtoms: bigint;
  canPay: boolean;
  terminalReason: string | null;
}) {
  const { publicKey } = useWallet();
  const mutation = useLoanInstallment();
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<PayFormValues>({
    resolver: zodResolver(PaySchema),
    defaultValues: { amount: "" },
  });

  const amountStr = watch("amount");
  const amountAtoms = useMemo(() => {
    const n = Number(amountStr);
    if (!Number.isFinite(n) || n <= 0) return 0n;
    return BigInt(Math.round(n * 1_000_000));
  }, [amountStr]);

  const overpay = amountAtoms > principalRemainingAtoms;
  const afterAtoms = overpay ? 0n : principalRemainingAtoms - amountAtoms;

  async function onSubmit(v: PayFormValues) {
    if (!USDC_MINT) {
      toast.error("NEXT_PUBLIC_USDC_MINT is not set");
      return;
    }
    if (!publicKey) {
      toast.error("Connect your wallet first");
      return;
    }
    const atoms = BigInt(Math.round(Number(v.amount) * 1_000_000));
    if (atoms <= 0n) {
      toast.error("Amount must be > 0");
      return;
    }
    if (atoms > principalRemainingAtoms) {
      toast.error("Amount exceeds outstanding principal");
      return;
    }
    try {
      await mutation.mutateAsync({
        trdcPda,
        assetMint: USDC_MINT,
        amount: atoms,
      });
      toast.success(`Paid ${fmtAtoms(atoms)} USDC`);
      reset({ amount: "" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div className="flex flex-col gap-6">
    <div className="border border-[var(--rule)] bg-[var(--bg-elev-1)] p-6 md:p-8">
      <span className="eyebrow">Payment · Desktop wallet</span>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-6">
        <div>
          <label className="mb-3 block font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
            Amount · USDC
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            autoFocus
            {...register("amount")}
            className="h-14 w-full border border-[var(--rule-strong)] bg-[var(--bg)] px-4 font-mono text-2xl text-[var(--ink)] tabnums focus:border-[var(--brand)] focus:outline-none"
            placeholder="0.00"
            disabled={!canPay}
          />
          {errors.amount && (
            <p className="mt-2 font-mono text-xs text-[var(--signal-bad)]">
              {errors.amount.message}
            </p>
          )}
          {overpay && amountAtoms > 0n && (
            <p className="mt-2 font-mono text-xs text-[var(--signal-bad)]">
              Exceeds outstanding principal ({fmtAtoms(principalRemainingAtoms)} USDC).
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-px border border-[var(--rule)] bg-[var(--rule)]">
          <StatCell
            label="Principal remaining"
            value={`${fmtAtoms(principalRemainingAtoms)}`}
            suffix="USDC"
          />
          <StatCell
            label="After this payment"
            value={`${fmtAtoms(afterAtoms)}`}
            suffix="USDC"
            highlight={amountAtoms > 0n && !overpay}
          />
        </div>

        {terminalReason && (
          <div className="border border-[var(--signal-warn)] bg-[var(--bg)] p-3 font-mono text-xs text-[var(--signal-warn)]">
            {terminalReason}
          </div>
        )}

        <button
          type="submit"
          disabled={!canPay || overpay || amountAtoms <= 0n || mutation.isPending || !publicKey}
          className="btn-gold w-full justify-center disabled:cursor-not-allowed disabled:opacity-40"
        >
          {mutation.isPending
            ? "Signing…"
            : amountAtoms > 0n
              ? `Pay ${fmtAtoms(amountAtoms)} USDC`
              : "Enter amount"}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-4 w-4">
            <path strokeLinecap="round" d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </button>
      </form>
    </div>

    <SolanaPayQr
      kind="pay"
      trdc={trdcBase58}
      amountAtoms={amountAtoms > 0n && !overpay ? amountAtoms : undefined}
      disabled={!canPay || amountAtoms <= 0n || overpay}
      label="Pay from mobile · Solana Pay"
    />
    </div>
  );
}

function StatCell({
  label,
  value,
  suffix,
  highlight = false,
}: {
  label: string;
  value: string;
  suffix?: string;
  highlight?: boolean;
}) {
  return (
    <div className="bg-[var(--bg-elev-1)] p-4">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
        {label}
      </div>
      <div
        className="mt-2 flex items-baseline gap-2 font-mono text-sm tabnums"
        style={{ color: highlight ? "var(--brand)" : "var(--ink)" }}
      >
        <span>{value}</span>
        {suffix && (
          <span className="text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function InvalidPanel() {
  return (
    <div className="border border-[var(--signal-bad)] bg-[var(--bg-elev-1)] p-6">
      <span className="eyebrow" style={{ color: "var(--signal-bad)" }}>
        Invalid TRDC
      </span>
      <p className="mt-3 font-sans text-sm text-[var(--ink-dim)]">
        The pubkey in the URL is malformed.
      </p>
    </div>
  );
}
