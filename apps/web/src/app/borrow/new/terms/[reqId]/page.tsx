"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "sonner";
import { generateCcbPdf, hashCcb, type CcbInput } from "@vaulx/ccb";
import { maxLoanAmount } from "@vaulx/terms";

import { EditorialSection } from "@/components/vaulx/editorial-section";
import { IdentityGates } from "@/components/vaulx/identity-gates";
import { SiteFooter } from "@/components/vaulx/site-footer";
import { SiteHeader } from "@/components/vaulx/site-header";
import { StepRail } from "@/components/vaulx/step-rail";
import { useGovbrVerification } from "@/lib/govbr/mock-storage";
import {
  deriveTrdcStatePda,
  generateLoanId,
  useCreateCcbTrdc,
} from "@/lib/chain/loan";
import type {
  AppraisalInput,
  AppraisalResponse,
} from "@/lib/appraisal/types";

interface Stashed {
  input: AppraisalInput;
  response: AppraisalResponse;
}

interface LockedMedian {
  median: number;
  lockedAt: number;
}

const USD = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function fmtUsdc(v: number): string {
  return `$${USD.format(Math.round(v))}`;
}

const TERMS = [30, 60, 90] as const;
type TermDays = (typeof TERMS)[number];

const RATE_BPS_BY_TERM: Record<TermDays, number> = {
  30: 800,
  60: 1000,
  90: 1200,
};

function formatBpsPct(bps: number): string {
  const whole = Math.floor(bps / 100);
  const rem = bps % 100;
  return `${whole}.${rem.toString().padStart(2, "0")}%`;
}

function relativeInDays(days: number): string {
  if (days === 1) return "in 1 day";
  return `in ${days} days`;
}

function toIsoDate(unixSec: number): string {
  const d = new Date(unixSec * 1000);
  return d.toISOString().slice(0, 10);
}

export default function TermsPage() {
  return (
    <>
      <SiteHeader />
      <StepRail />
      <Suspense fallback={null}>
        <TermsContent />
      </Suspense>
      <SiteFooter />
    </>
  );
}

function TermsContent() {
  const router = useRouter();
  const params = useParams<{ reqId: string }>();
  const reqId = params?.reqId;

  const [state, setState] = useState<Stashed | null>(null);
  const [locked, setLocked] = useState<LockedMedian | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!reqId) return;
    try {
      const raw = sessionStorage.getItem(`vaulx_appraisal_${reqId}`);
      const rawLocked = sessionStorage.getItem(
        `vaulx_appraisal_${reqId}_locked`,
      );
      if (!raw || !rawLocked) {
        router.replace("/borrow/new/asset");
        return;
      }
      setState(JSON.parse(raw) as Stashed);
      setLocked(JSON.parse(rawLocked) as LockedMedian);
    } catch {
      router.replace("/borrow/new/asset");
    } finally {
      setHydrated(true);
    }
  }, [reqId, router]);

  if (!hydrated) return null;
  if (!state || !locked) return null;

  return (
    <main className="relative min-h-[calc(100vh-72px-64px)]">
      <div className="mx-auto w-full max-w-[1440px] px-6 py-16 md:px-10 md:py-20">
        <EditorialSection
          eyebrow="Step 05 — Terms"
          headline="Lock your terms. Mint the note."
          lead="Set the loan-to-value, pick a term, review the Cédula. On confirmation Vaulx mints a TRDC on-chain and anchors your CCB's SHA-256."
        />

        <div className="mt-14">
          <IdentityGates>
            <TermsForm
              state={state}
              locked={locked}
              reqId={reqId ?? ""}
              onCancel={() => router.push(`/borrow/new/appraisal/${reqId}`)}
            />
          </IdentityGates>
        </div>
      </div>
    </main>
  );
}

function TermsForm({
  state,
  locked,
  reqId,
  onCancel,
}: {
  state: Stashed;
  locked: LockedMedian;
  reqId: string;
  onCancel: () => void;
}) {
  const router = useRouter();
  const { publicKey } = useWallet();
  const walletStr = publicKey?.toBase58();
  const { verification: govbr } = useGovbrVerification(walletStr);

  const [ltvBps, setLtvBps] = useState(4000);
  const [termDays, setTermDays] = useState<TermDays>(60);
  const [submitting, setSubmitting] = useState(false);

  const appraisal = locked.median;
  const ltvPct = ltvBps / 100;
  const loanAmount = useMemo(() => {
    return Math.floor((appraisal * ltvBps) / 10000);
  }, [appraisal, ltvBps]);

  const rateBps = RATE_BPS_BY_TERM[termDays];
  const dueTs = useMemo(
    () => Math.floor(Date.now() / 1000) + termDays * 86400,
    [termDays],
  );

  const previewInput = useMemo<CcbInput>(() => {
    const loanAtoms = BigInt(Math.round(loanAmount * 1_000_000));
    const apprAtoms = BigInt(Math.round(appraisal * 1_000_000));
    return {
      borrowerName: govbr?.name ?? "(borrower)",
      borrowerCpf: govbr?.cpf ?? "000.000.000-00",
      lenderName: "Vaulx Lender Pool",
      custodianName: "Vaulx Custody",
      watchMake: state.input.make,
      watchModel: state.input.model,
      watchRef: state.input.ref,
      watchYear: state.input.year,
      watchCondition: state.input.condition,
      appraisalValue: apprAtoms,
      loanAmount: loanAtoms,
      interestRateBps: rateBps,
      termDays,
      dueTs,
      loanId: "preview",
      ccbSerial: `VAULX-${reqId.slice(0, 8).toUpperCase()}`,
      issuedAtTs: Math.floor(Date.now() / 1000),
    };
  }, [appraisal, loanAmount, rateBps, termDays, dueTs, state.input, govbr, reqId]);

  const mutation = useCreateCcbTrdc();

  async function downloadCcb() {
    try {
      const { pdfBytes } = await generateCcbPdf(previewInput);
      const buf = pdfBytes.slice().buffer as ArrayBuffer;
      const blob = new Blob([buf], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `CCB-${previewInput.ccbSerial}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(`Could not render PDF: ${String(err)}`);
    }
  }

  const [previewHash, setPreviewHash] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { sha256Hex } = await generateCcbPdf(previewInput);
        if (!cancelled) setPreviewHash(sha256Hex);
      } catch {
        if (!cancelled) setPreviewHash(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [previewInput]);

  async function onConfirm() {
    if (!publicKey) {
      toast.error("Connect your wallet first");
      return;
    }
    setSubmitting(true);
    try {
      const loanId = generateLoanId();
      const trdcPda = deriveTrdcStatePda(loanId);

      const finalCcbInput: CcbInput = {
        ...previewInput,
        loanId: loanId.toBase58(),
        issuedAtTs: Math.floor(Date.now() / 1000),
      };
      const { pdfBytes, sha256: digest } = await generateCcbPdf(finalCcbInput);
      const hash = hashCcb(pdfBytes);

      try {
        const { uploadCcbPdf } = await import("@/lib/chain/ccb-storage");
        await uploadCcbPdf(loanId.toBase58(), pdfBytes);
      } catch (e) {
        console.warn("CCB storage upload skipped:", e);
      }

      const loanAtoms = BigInt(Math.round(loanAmount * 1_000_000));
      const apprAtoms = BigInt(Math.round(appraisal * 1_000_000));

      const assetHint = digest.slice(0, 32);
      const result = await mutation.mutateAsync({
        loanId,
        appraisalValue: apprAtoms,
        loanAmount: loanAtoms,
        dueTs,
        assetHint,
      });

      toast.success(
        `TRDC minted: ${result.trdcPda.toBase58().slice(0, 8)}… (ccb hash ${hash.hex.slice(0, 8)}…)`,
      );

      try {
        sessionStorage.setItem(
          `vaulx_loan_${result.trdcPda.toBase58()}`,
          JSON.stringify({
            loanId: loanId.toBase58(),
            ccbHash: hash.hex,
            txSig: result.txSig,
            appraisal,
            loanAmount,
            termDays,
            dueTs,
            rateBps,
          }),
        );
      } catch {
        /* non-fatal */
      }

      router.push(`/borrow/new/awaiting-custody/${result.trdcPda.toBase58()}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
      setSubmitting(false);
    }
  }

  const maxLoanWhole = Number(
    maxLoanAmount(BigInt(Math.round(appraisal)), 6000),
  );

  return (
    <div className="grid gap-8 md:grid-cols-12 md:gap-8">
      {/* LEFT: terms form — 5/12 */}
      <div className="md:col-span-5">
        <div className="border border-[var(--rule)] bg-[var(--bg-elev-1)] p-6 md:p-8">
          <span className="eyebrow">Your terms</span>
          <p className="mt-4 font-sans text-sm leading-[1.65] text-[var(--ink-dim)]">
            Appraisal locked at <span className="font-mono text-[var(--ink)] tabnums">{fmtUsdc(appraisal)}</span>.
            LTV capped at 60% (max <span className="font-mono text-[var(--ink)] tabnums">{fmtUsdc(maxLoanWhole)}</span>).
          </p>

          <div className="mt-10 flex flex-col gap-8">
            {/* LTV slider */}
            <div>
              <div className="mb-3 flex items-baseline justify-between">
                <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                  Loan-to-value
                </label>
                <span className="font-mono text-sm text-[var(--brand)] tabnums">
                  {ltvPct.toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={60}
                step={1}
                value={ltvPct}
                onChange={(e) => setLtvBps(Number(e.target.value) * 100)}
                className="w-full accent-[var(--brand)]"
              />
              <div className="mt-5">
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                  You receive
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-mono text-4xl text-[var(--ink)] tabnums">
                    {fmtUsdc(loanAmount)}
                  </span>
                  <span className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                    USDC
                  </span>
                </div>
              </div>
            </div>

            {/* Term */}
            <div>
              <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                Term length
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
                      name="termDays"
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
              <InfoCell label="Interest" value={`${formatBpsPct(rateBps)} APR`} />
              <InfoCell
                label="Due date"
                value={toIsoDate(dueTs)}
                sub={relativeInDays(termDays)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: CCB preview — 7/12 (asymmetric) */}
      <div className="md:col-span-7">
        <div className="border border-[var(--rule-strong)] bg-[var(--bg-elev-1)] p-8 md:p-10">
          <div className="flex items-start justify-between gap-4 border-b border-[var(--rule)] pb-6">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--ink-muted)]">
                Cédula de Crédito Bancário
              </div>
              <div className="mt-2 font-display text-2xl font-bold tracking-[-0.01em] text-[var(--ink)]">
                VAULX-{reqId.slice(0, 8).toUpperCase()}
              </div>
            </div>
            <button
              type="button"
              onClick={downloadCcb}
              className="btn-ghost text-[10px]"
            >
              Download PDF
            </button>
          </div>

          <dl className="mt-8 grid grid-cols-[auto_1fr] gap-x-8 gap-y-4 font-mono text-xs">
            <Cell k="Borrower" v={govbr?.name ?? "(pending gov.br)"} />
            <Cell k="CPF" v={govbr?.cpf ?? "—"} mono />
            <Cell k="Lender" v="Vaulx Lender Pool" />
            <Cell
              k="Asset"
              v={`${state.input.make} ${state.input.model} (${state.input.year})`}
            />
            <Cell k="Reference" v={state.input.ref} mono />
            <Cell k="Appraisal" v={`${fmtUsdc(appraisal)} USD`} mono />
            <Cell k="Principal" v={`${fmtUsdc(loanAmount)} USDC`} mono />
            <Cell k="Term" v={`${termDays} days · ${formatBpsPct(rateBps)} APR`} />
            <Cell k="Due" v={toIsoDate(dueTs)} mono />
          </dl>

          <div className="mt-8 border-t border-[var(--rule)] pt-6">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--brand)]">
              SHA-256 · anchored on Solana
            </div>
            <div className="mt-3 break-all font-mono text-xs leading-relaxed text-[var(--ink-dim)] tabnums">
              {previewHash ? `0x${previewHash}` : "computing…"}
            </div>
          </div>
        </div>
      </div>

      {/* Confirm bar */}
      <div className="md:col-span-12">
        <div className="flex flex-col gap-3 border-t border-[var(--rule)] pt-8 sm:flex-row">
          <button
            onClick={onConfirm}
            disabled={submitting || mutation.isPending || !publicKey}
            className="btn-gold flex-1 justify-center disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting || mutation.isPending ? "Minting TRDC…" : "Confirm and mint TRDC"}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-4 w-4">
              <path strokeLinecap="round" d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </button>
          <button onClick={onCancel} className="btn-ghost justify-center sm:w-60">
            Back to appraisal
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoCell({
  label,
  value,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
}) {
  return (
    <div className="bg-[var(--bg-elev-1)] p-4">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
        {label}
      </div>
      <div className="mt-2 font-mono text-sm text-[var(--ink)] tabnums">
        {value}
      </div>
      {sub && (
        <div className="mt-1 font-mono text-[10px] text-[var(--ink-muted)]">{sub}</div>
      )}
    </div>
  );
}

function Cell({ k, v, mono = false }: { k: string; v: React.ReactNode; mono?: boolean }) {
  return (
    <>
      <dt className="text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
        {k}
      </dt>
      <dd className={mono ? "text-[var(--ink)] tabnums" : "text-[var(--ink)]"}>{v}</dd>
    </>
  );
}
