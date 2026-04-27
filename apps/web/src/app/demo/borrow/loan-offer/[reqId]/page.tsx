"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { CcbInput } from "@vaulx/ccb";
import { rateForTermDays } from "@vaulx/terms";
import { DemoShell } from "../../../_components/demo-shell";
import { CcbDocument } from "../../../_components/ccb-document";
import { useDemoSession } from "../../../_lib/use-demo-session";

const USD = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const TERMS = [30, 60, 90] as const;
type TermDays = (typeof TERMS)[number];

function fmtUsdc(v: number): string {
  return `$${USD.format(Math.round(v))}`;
}

function fmtBpsPct(bps: number): string {
  const whole = Math.floor(bps / 100);
  const rem = bps % 100;
  return `${whole}.${rem.toString().padStart(2, "0")}%`;
}

function toIsoDate(unixSec: number): string {
  return new Date(unixSec * 1000).toISOString().slice(0, 10);
}

export default function LoanOfferPage() {
  const router = useRouter();
  const params = useParams<{ reqId: string }>();
  const reqId = params?.reqId ?? "";
  const { session, patch } = useDemoSession();

  const [ltvPct, setLtvPct] = useState(50);
  const [termDays, setTermDays] = useState<TermDays>(60);

  // Stable issuedAtTs for the lifetime of this page so the preview hash and
  // the final signed PDF agree.
  const [issuedAtTs] = useState(() => Math.floor(Date.now() / 1000));

  // Redirect if no appraisal yet.
  useEffect(() => {
    if (session && session.watch?.appraisal?.median === undefined) {
      router.replace("/demo/borrow/register");
    }
  }, [session, router]);

  const appraisal = session?.watch?.appraisal?.median ?? 0;
  const rateBps = rateForTermDays(termDays);

  const loanAmountAtoms = useMemo(() => {
    return Math.floor((appraisal * 1_000_000 * ltvPct) / 100);
  }, [appraisal, ltvPct]);

  const dueTs = useMemo(
    () => issuedAtTs + termDays * 86400,
    [issuedAtTs, termDays],
  );

  const ccbInput = useMemo<CcbInput | null>(() => {
    if (!session?.watch?.appraisal?.median) return null;
    const w = session.watch;
    const apprAtoms = Math.round(appraisal * 1_000_000);
    return {
      borrowerName: session.govbr.name ?? "(borrower)",
      borrowerCpf: session.govbr.cpf ?? "000.000.000-00",
      lenderName: "Vaulx Lender Pool",
      custodianName: "Vaulx Custody",
      watchMake: w.make,
      watchModel: w.model,
      watchRef: w.ref,
      watchYear: w.year,
      watchCondition: w.condition,
      appraisalValue: BigInt(apprAtoms),
      loanAmount: BigInt(loanAmountAtoms),
      interestRateBps: rateBps,
      termDays,
      dueTs,
      loanId: "preview",
      ccbSerial: reqId.slice(0, 8).toUpperCase() || "PREVIEW",
      issuedAtTs,
    };
  }, [session, appraisal, loanAmountAtoms, rateBps, termDays, dueTs, reqId, issuedAtTs]);

  if (!session) {
    return (
      <DemoShell formFactor="phone">
        <div className="px-6 py-12 text-[var(--ink-muted)]">Loading…</div>
      </DemoShell>
    );
  }

  if (!session.watch?.appraisal?.median || !ccbInput) {
    return (
      <DemoShell formFactor="phone">
        <div className="px-6 py-12 text-[var(--ink-muted)]">Redirecting…</div>
      </DemoShell>
    );
  }

  const handleSigned = async ({
    signatureDataUrl,
    ccbHashHex,
  }: {
    pdfBytes: Uint8Array;
    signatureDataUrl: string;
    ccbHashHex: string;
  }) => {
    patch((s) => ({
      ...s,
      loan: {
        loanId: crypto.randomUUID(),
        principalAtoms: loanAmountAtoms.toString(),
        rateBps,
        termDays,
        dueTs,
        ccbHashHex,
        signatureDataUrl,
        custody: { provider: "brinks" },
        inAppBalanceAtoms: "0",
      },
    }));
    router.push("/demo/borrow/custody");
  };

  const loanAmountWhole = loanAmountAtoms / 1_000_000;

  return (
    <DemoShell formFactor="phone">
      <div className="px-6 py-8">
        <p className="eyebrow">Step 7 / 14 · Terms</p>
        <h1 className="display-md mt-3">Pick LTV, term, rate. Sign the CCB.B3.</h1>
        <p className="mt-3 text-sm text-[var(--ink-dim)]">
          Appraisal locked at{" "}
          <span
            className="font-mono text-[var(--ink)]"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {fmtUsdc(appraisal)}
          </span>
          . Maximum LTV is 60%.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-12 md:gap-8">
          {/* LEFT: terms form — 5/12 */}
          <div className="md:col-span-5">
            <div className="rounded-md border border-[var(--rule)] bg-[var(--bg-elev-1)] p-5 md:p-6">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                Your terms
              </span>

              {/* LTV slider */}
              <div className="mt-6">
                <div className="mb-3 flex items-baseline justify-between">
                  <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                    Loan-to-value
                  </label>
                  <span
                    className="font-mono text-sm text-[var(--brand)]"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {ltvPct}%
                  </span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={60}
                  step={1}
                  value={ltvPct}
                  onChange={(e) => setLtvPct(Number(e.target.value))}
                  className="w-full accent-[var(--brand)]"
                  aria-label="Loan to value percentage"
                />
                <div className="mt-5">
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                    You receive
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span
                      className="font-mono text-3xl text-[var(--ink)] md:text-4xl"
                      style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                      {fmtUsdc(loanAmountWhole)}
                    </span>
                    <span className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                      USDC
                    </span>
                  </div>
                </div>
              </div>

              {/* Term radios */}
              <div className="mt-6">
                <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                  Term length
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {TERMS.map((d) => (
                    <label
                      key={d}
                      className={`flex cursor-pointer items-center justify-center rounded border px-3 py-3 font-mono text-xs uppercase tracking-[0.14em] transition-colors ${
                        termDays === d
                          ? "border-[var(--brand)] bg-[var(--brand)]/10 text-[var(--brand)]"
                          : "border-[var(--rule)] bg-[var(--bg)] text-[var(--ink-dim)]"
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
                      {d}d
                    </label>
                  ))}
                </div>
              </div>

              {/* Rate + due cells */}
              <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded border border-[var(--rule)] bg-[var(--rule)]">
                <div className="bg-[var(--bg)] p-4">
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                    Interest
                  </div>
                  <div
                    className="mt-2 font-mono text-sm text-[var(--ink)]"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {fmtBpsPct(rateBps)} APR
                  </div>
                </div>
                <div className="bg-[var(--bg)] p-4">
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                    Due date
                  </div>
                  <div
                    className="mt-2 font-mono text-sm text-[var(--ink)]"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {toIsoDate(dueTs)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: CCB preview — 7/12 */}
          <div className="md:col-span-7">
            <CcbDocument ccb={ccbInput} onSigned={handleSigned} />
          </div>
        </div>
      </div>
    </DemoShell>
  );
}
