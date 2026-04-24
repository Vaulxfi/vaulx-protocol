"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "sonner";
import { generateCcbPdf, hashCcb, type CcbInput } from "@vaulx/ccb";
import { maxLoanAmount } from "@vaulx/terms";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { IdentityGates } from "@/components/vaulx/identity-gates";
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
  return `$${USD.format(Math.round(v))} USDC`;
}

const TERMS = [30, 60, 90] as const;
type TermDays = (typeof TERMS)[number];

/** Rate schedule — task 2.8 fallback; matches the values in the spec. */
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
    <Suspense fallback={null}>
      <TermsContent />
    </Suspense>
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
    <main className="min-h-screen bg-background px-6 py-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
            Loan terms &amp; CCB
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Step 3 of 3 — set your loan size and term, review the CCB, then
            confirm to mint the TRDC.
          </p>
        </header>

        <IdentityGates>
          <TermsForm
            state={state}
            locked={locked}
            reqId={reqId ?? ""}
            onCancel={() => router.push(`/borrow/new/appraisal/${reqId}`)}
          />
        </IdentityGates>
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

  const [ltvBps, setLtvBps] = useState(4000); // 40% default
  const [termDays, setTermDays] = useState<TermDays>(60);
  const [submitting, setSubmitting] = useState(false);

  const appraisal = locked.median; // whole USDC
  const ltvPct = ltvBps / 100;
  const loanAmount = useMemo(() => {
    // maxLoanAmount expects atoms-or-bigint for appraisal — we track whole
    // USDC locally, so use JS math here and convert to atoms only at submit.
    return Math.floor((appraisal * ltvBps) / 10000);
  }, [appraisal, ltvBps]);

  const rateBps = RATE_BPS_BY_TERM[termDays];
  const dueTs = useMemo(
    () => Math.floor(Date.now() / 1000) + termDays * 86400,
    [termDays],
  );

  // CCB preview object
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
      // 1. Derive loan_id client-side; use as both seed for TRDCState PDA
      //    and as the `loanId` string stamped into the final CCB.
      const loanId = generateLoanId();
      const trdcPda = deriveTrdcStatePda(loanId);

      // 2. Regenerate CCB with the final loan_id — deterministic hash.
      const finalCcbInput: CcbInput = {
        ...previewInput,
        loanId: loanId.toBase58(),
        issuedAtTs: Math.floor(Date.now() / 1000),
      };
      const { pdfBytes, sha256: digest } = await generateCcbPdf(finalCcbInput);
      const hash = hashCcb(pdfBytes);

      // 3. Try to upload to Supabase (best-effort).
      try {
        const { uploadCcbPdf } = await import("@/lib/chain/ccb-storage");
        await uploadCcbPdf(loanId.toBase58(), pdfBytes);
      } catch (e) {
        console.warn("CCB storage upload skipped:", e);
      }

      // 4. On-chain mint.
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

      // Stash a breadcrumb for the awaiting-custody page (Task 2.9).
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
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Left: terms form */}
      <Card>
        <CardHeader>
          <CardTitle>Your terms</CardTitle>
          <CardDescription>
            Appraisal locked at {fmtUsdc(appraisal)}. LTV capped at 60%
            (max {fmtUsdc(maxLoanWhole)}).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-sm font-medium">
                Loan-to-value (LTV)
              </label>
              <span className="text-sm tabular-nums text-muted-foreground">
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
              className="w-full accent-brand-gold"
            />
            <div className="mt-2 text-xl font-semibold tabular-nums">
              {fmtUsdc(loanAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              You&apos;ll receive this amount in USDC on disbursement.
            </p>
          </div>

          <div>
            <div className="mb-2 text-sm font-medium">Term length</div>
            <div className="flex flex-wrap gap-2">
              {TERMS.map((d) => (
                <label
                  key={d}
                  className={`cursor-pointer rounded-md border px-3 py-2 text-sm ${
                    termDays === d
                      ? "border-brand-gold bg-brand-gold/10"
                      : "border-input bg-background"
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

          <div className="grid grid-cols-2 gap-3">
            <InfoRow label="Interest rate">{formatBpsPct(rateBps)} APR</InfoRow>
            <InfoRow label="Due date">
              <div className="tabular-nums">{toIsoDate(dueTs)}</div>
              <div className="text-xs text-muted-foreground">
                {relativeInDays(termDays)}
              </div>
            </InfoRow>
          </div>
        </CardContent>
      </Card>

      {/* Right: CCB preview */}
      <Card>
        <CardHeader>
          <CardTitle>CCB preview</CardTitle>
          <CardDescription>
            Cédula de Crédito Bancário — what the lender signs against.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-1.5 text-sm">
            <dt className="text-muted-foreground">Borrower</dt>
            <dd>{govbr?.name ?? "(pending gov.br)"}</dd>
            <dt className="text-muted-foreground">CPF</dt>
            <dd className="tabular-nums">{govbr?.cpf ?? "—"}</dd>
            <dt className="text-muted-foreground">Lender</dt>
            <dd>Vaulx Lender Pool</dd>
            <dt className="text-muted-foreground">Asset</dt>
            <dd>
              {state.input.make} {state.input.model} ({state.input.year})
            </dd>
            <dt className="text-muted-foreground">Reference</dt>
            <dd className="tabular-nums">{state.input.ref}</dd>
            <dt className="text-muted-foreground">Appraisal</dt>
            <dd className="tabular-nums">{fmtUsdc(appraisal)}</dd>
            <dt className="text-muted-foreground">Loan amount</dt>
            <dd className="tabular-nums">{fmtUsdc(loanAmount)}</dd>
            <dt className="text-muted-foreground">Term</dt>
            <dd>
              {termDays} days · {formatBpsPct(rateBps)} APR
            </dd>
            <dt className="text-muted-foreground">Due</dt>
            <dd className="tabular-nums">{toIsoDate(dueTs)}</dd>
          </dl>

          <div className="rounded-md border border-border bg-muted/30 p-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              SHA-256 of CCB.pdf
            </div>
            <div className="mt-1 break-all font-mono text-xs">
              {previewHash ? `0x${previewHash}` : "computing…"}
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={downloadCcb}
            className="w-full"
          >
            Download CCB.pdf
          </Button>
        </CardContent>
      </Card>

      {/* Bottom row: confirm */}
      <div className="lg:col-span-2 flex flex-col gap-3 sm:flex-row">
        <Button
          onClick={onConfirm}
          disabled={submitting || mutation.isPending || !publicKey}
          className="bg-brand-gold text-brand-blue hover:bg-brand-gold/90 sm:flex-1"
        >
          {submitting || mutation.isPending
            ? "Minting TRDC…"
            : "Confirm and mint TRDC"}
        </Button>
        <Button variant="outline" onClick={onCancel} className="sm:w-48">
          Back to appraisal
        </Button>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-border bg-muted/30 p-3">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-sm font-medium">{children}</div>
    </div>
  );
}
