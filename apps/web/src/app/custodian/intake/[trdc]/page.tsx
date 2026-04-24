"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { PublicKey } from "@solana/web3.js";
import {
  useConnection,
  useWallet,
} from "@solana/wallet-adapter-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { EditorialSection } from "@/components/vaulx/editorial-section";
import { SiteFooter } from "@/components/vaulx/site-footer";
import { SiteHeader } from "@/components/vaulx/site-header";
import {
  hexToBytes32,
  useConfirmCustody,
  useLoanConfig,
  useTrdcState,
} from "@/lib/chain/custody";

const USD = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});
function fmtUsdc(atoms: bigint | undefined): string {
  if (atoms === undefined) return "—";
  const whole = Number(atoms) / 1_000_000;
  return `$${USD.format(Math.round(whole))} USDC`;
}
function toIsoDate(unixSec: bigint | undefined): string {
  if (unixSec === undefined) return "—";
  return new Date(Number(unixSec) * 1000).toISOString().slice(0, 10);
}
function shorten(pda: string, head = 4, tail = 4): string {
  if (pda.length <= head + tail + 1) return pda;
  return `${pda.slice(0, head)}…${pda.slice(-tail)}`;
}

function statusName(status: Record<string, unknown> | undefined): string {
  if (!status) return "—";
  const key = Object.keys(status)[0];
  if (!key) return "—";
  return key.charAt(0).toUpperCase() + key.slice(1);
}

const CHECKLIST = [
  "Watch received and physically inspected",
  "Serial number matches submission",
  "Condition matches declared condition",
  "Photographed for archive",
  "Placed in vault",
] as const;

export default function CustodianIntakePage() {
  return (
    <>
      <SiteHeader />
      <Suspense fallback={null}>
        <CustodianIntakeContent />
      </Suspense>
      <SiteFooter />
    </>
  );
}

function CustodianIntakeContent() {
  const params = useParams<{ trdc: string }>();
  const searchParams = useSearchParams();
  const trdc = params?.trdc ?? "";
  const hashParam = searchParams?.get("hash") ?? "";

  const trdcPda = useMemo(() => {
    try {
      return new PublicKey(trdc);
    } catch {
      return undefined;
    }
  }, [trdc]);

  return (
    <main className="relative min-h-[calc(100vh-72px)]">
      <div className="mx-auto w-full max-w-[1440px] px-6 py-16 md:px-10 md:py-20">
        <EditorialSection
          eyebrow="Custody Journal"
          headline={`Intake · ${shorten(trdc, 6, 6)}`}
          lead="Verify the asset, match the CCB hash, sign the confirm-custody transaction. The TRDC transitions to ActiveInCustody and the vault disburses."
        />

        {!trdcPda ? (
          <div className="mt-10 border border-[var(--signal-bad)] bg-[var(--bg-elev-1)] p-8">
            <span
              className="eyebrow"
              style={{ color: "var(--signal-bad)" }}
            >
              Invalid TRDC
            </span>
            <p className="mt-3 font-sans text-sm text-[var(--ink-dim)]">
              The pubkey in the URL is malformed.
            </p>
          </div>
        ) : (
          <div className="mt-14">
            <CustodianInner trdc={trdc} trdcPda={trdcPda} hashParam={hashParam} />
          </div>
        )}
      </div>
    </main>
  );
}

function CustodianInner({
  trdc,
  trdcPda,
  hashParam,
}: {
  trdc: string;
  trdcPda: PublicKey;
  hashParam: string;
}) {
  const router = useRouter();
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();

  const loanConfigQuery = useLoanConfig();
  const trdcQuery = useTrdcState(trdcPda);

  const [balanceLamports, setBalanceLamports] = useState<number | null>(null);
  useEffect(() => {
    if (!publicKey) {
      setBalanceLamports(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const lamports = await connection.getBalance(publicKey, "confirmed");
        if (!cancelled) setBalanceLamports(lamports);
      } catch {
        if (!cancelled) setBalanceLamports(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [connection, publicKey]);

  const [checklist, setChecklist] = useState<boolean[]>(
    () => CHECKLIST.map(() => false),
  );
  const [docHashHex, setDocHashHex] = useState<string>(hashParam);
  useEffect(() => {
    if (hashParam && !docHashHex) setDocHashHex(hashParam);
  }, [hashParam, docHashHex]);

  const confirmMutation = useConfirmCustody();

  const loanConfig = loanConfigQuery.data;
  const trdcState = trdcQuery.data;

  // Gate: loan_config not initialised.
  if (loanConfigQuery.isLoading) {
    return (
      <GatePanel>
        <span className="eyebrow">Loading</span>
        <p className="mt-3 font-sans text-sm text-[var(--ink-dim)]">
          Reading loan config from chain…
        </p>
      </GatePanel>
    );
  }
  if (loanConfigQuery.isError) {
    return (
      <GatePanel tone="bad">
        <span className="eyebrow" style={{ color: "var(--signal-bad)" }}>
          Failed to load loan config
        </span>
        <p className="mt-3 font-sans text-sm text-[var(--ink-dim)]">
          {String((loanConfigQuery.error as Error)?.message ?? "unknown")}
        </p>
      </GatePanel>
    );
  }
  if (!loanConfig) {
    return (
      <GatePanel>
        <span className="eyebrow">LoanConfig not initialized</span>
        <p className="mt-3 max-w-[60ch] font-sans text-sm leading-[1.65] text-[var(--ink-dim)]">
          The on-chain loan_config singleton has not been initialised yet. Run{" "}
          <code className="bg-[var(--bg)] px-1.5 py-0.5 font-mono text-xs text-[var(--brand)]">
            initialize_loan_config(custodian, civic_network)
          </code>{" "}
          first.
        </p>
      </GatePanel>
    );
  }

  if (!connected || !publicKey) {
    return (
      <GatePanel>
        <span className="eyebrow">Connect the custodian wallet</span>
        <p className="mt-3 font-sans text-sm text-[var(--ink-dim)]">
          Expected custodian pubkey:
        </p>
        <div className="mt-3 break-all border border-[var(--rule-strong)] bg-[var(--bg)] px-4 py-3 font-mono text-xs text-[var(--brand)]">
          {loanConfig.custodian.toBase58()}
        </div>
      </GatePanel>
    );
  }

  const isCustodian = publicKey.equals(loanConfig.custodian);
  if (!isCustodian) {
    return (
      <GatePanel tone="bad">
        <span className="eyebrow" style={{ color: "var(--signal-bad)" }}>
          Not authorized as custodian
        </span>
        <div className="mt-4 flex flex-col gap-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
              Connected
            </div>
            <div className="mt-2 break-all font-mono text-xs text-[var(--ink)]">
              {publicKey.toBase58()}
            </div>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
              Expected
            </div>
            <div className="mt-2 break-all font-mono text-xs text-[var(--brand)]">
              {loanConfig.custodian.toBase58()}
            </div>
          </div>
        </div>
      </GatePanel>
    );
  }

  const trdcLoading = trdcQuery.isLoading;
  const trdcError = trdcQuery.isError;
  const missingTrdc = !trdcLoading && !trdcError && !trdcState;
  const status = statusName(trdcState?.status as Record<string, unknown> | undefined);
  const isPendingCustody = status === "PendingCustody";

  const lowBalance =
    balanceLamports !== null && balanceLamports < 1_000_000;

  const allChecked = checklist.every(Boolean);
  const hashValid = /^(0x)?[0-9a-fA-F]{64}$/.test(docHashHex.trim());
  const canConfirm =
    allChecked &&
    hashValid &&
    !trdcLoading &&
    !missingTrdc &&
    isPendingCustody &&
    !confirmMutation.isPending;

  async function onConfirm() {
    try {
      const bytes = hexToBytes32(docHashHex.trim());
      const result = await confirmMutation.mutateAsync({
        trdcPda,
        docHash: bytes,
      });
      toast.success(`Custody confirmed: ${result.txSig.slice(0, 8)}…`);
      router.push(`/custodian/done/${trdc}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div className="grid gap-8 md:grid-cols-12 md:gap-8">
      {/* LEFT: TRDC details + checklist — 7/12 */}
      <div className="flex flex-col gap-8 md:col-span-7">
        <div className="border border-[var(--rule)] bg-[var(--bg-elev-1)] p-6 md:p-8">
          <div className="flex items-center justify-between">
            <span className="eyebrow">TRDC · Ledger state</span>
            {trdcState && (
              <span
                className="font-mono text-[10px] uppercase tracking-[0.2em]"
                style={{
                  color: isPendingCustody ? "var(--signal-warn)" : "var(--signal-bad)",
                }}
              >
                · {status}
              </span>
            )}
          </div>

          {trdcLoading && (
            <p className="mt-5 font-sans text-sm text-[var(--ink-dim)]">Loading TRDC…</p>
          )}
          {trdcError && (
            <p className="mt-5 font-sans text-sm text-[var(--signal-bad)]">
              Failed to load TRDC: {String((trdcQuery.error as Error)?.message)}
            </p>
          )}
          {missingTrdc && (
            <p className="mt-5 font-sans text-sm text-[var(--signal-bad)]">
              TRDCState account not found at{" "}
              <span className="font-mono">{trdc}</span>.
            </p>
          )}
          {trdcState && (
            <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-6 gap-y-4 font-mono text-xs">
              <dt className="text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                Loan ID
              </dt>
              <dd className="break-all text-[var(--ink)] tabnums">
                {trdcState.loanId.toBase58()}
              </dd>
              <dt className="text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                Appraisal
              </dt>
              <dd className="text-[var(--ink)] tabnums">
                {fmtUsdc(trdcState.appraisalValue as unknown as bigint)}
              </dd>
              <dt className="text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                Loan amount
              </dt>
              <dd className="text-[var(--ink)] tabnums">
                {fmtUsdc(trdcState.loanAmount as unknown as bigint)}
              </dd>
              <dt className="text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                Due date
              </dt>
              <dd className="text-[var(--ink)] tabnums">
                {toIsoDate(trdcState.dueTs as unknown as bigint)}
              </dd>
            </dl>
          )}
          {trdcState && !isPendingCustody && (
            <div className="mt-6 border border-[var(--signal-bad)] bg-[var(--bg)] p-3 font-mono text-xs text-[var(--signal-bad)]">
              TRDC not in PendingCustody — cannot confirm.
            </div>
          )}
        </div>

        {lowBalance && (
          <div className="border border-[var(--signal-warn)] bg-[var(--bg-elev-1)] p-4 font-mono text-xs text-[var(--signal-warn)]">
            Custodian wallet balance is below 0.001 SOL — fund it on Devnet before signing (
            <code>solana airdrop 1 &lt;pubkey&gt; --url devnet</code>).
          </div>
        )}

        {/* Checklist — registrar style */}
        <div className="border border-[var(--rule)] bg-[var(--bg-elev-1)] p-6 md:p-8">
          <span className="eyebrow">Intake register</span>
          <p className="mt-3 font-sans text-sm text-[var(--ink-dim)]">
            All items must be checked before confirming. Each tick goes into the immutable custody journal.
          </p>

          <ol className="mt-8 flex flex-col">
            {CHECKLIST.map((item, idx) => {
              const checked = checklist[idx];
              return (
                <li
                  key={item}
                  className="flex items-center gap-5 border-b border-[var(--rule)] py-4 last:border-b-0"
                >
                  <span className="w-6 shrink-0 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)] tabnums">
                    {(idx + 1).toString().padStart(2, "0")}
                  </span>
                  <label className="flex flex-1 cursor-pointer items-center gap-4">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        setChecklist((prev) => {
                          const next = [...prev];
                          next[idx] = e.target.checked;
                          return next;
                        });
                      }}
                      className="h-4 w-4 accent-[var(--brand)]"
                    />
                    <span
                      className={`font-sans text-sm transition-colors ${
                        checked
                          ? "text-[var(--ink)] border-b border-[var(--brand)] pb-0.5"
                          : "text-[var(--ink-dim)]"
                      }`}
                    >
                      {item}
                    </span>
                  </label>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      {/* RIGHT: hash + confirm — 5/12 */}
      <aside className="md:col-span-5">
        <div className="sticky top-[96px] flex flex-col gap-6">
          <div className="border border-[var(--rule)] bg-[var(--bg-elev-1)] p-6 md:p-8">
            <span className="eyebrow">CCB hash · 32 bytes</span>
            <p className="mt-3 font-sans text-sm leading-[1.65] text-[var(--ink-dim)]">
              Pre-filled from the deeplink the borrower shared. Must match the PDF they signed.
            </p>
            <Input
              value={docHashHex}
              onChange={(e) => setDocHashHex(e.target.value)}
              placeholder="0x…   (64 hex characters)"
              className="mt-5 h-14 text-base"
              spellCheck={false}
            />
            {!hashValid && docHashHex.length > 0 && (
              <p className="mt-3 font-mono text-xs text-[var(--signal-bad)]">
                Expected 64 hex characters (with optional 0x prefix).
              </p>
            )}
          </div>

          <button
            onClick={onConfirm}
            disabled={!canConfirm}
            className="btn-gold w-full justify-center disabled:cursor-not-allowed disabled:opacity-40"
          >
            {confirmMutation.isPending ? "Confirming…" : "Confirm custody received"}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </button>
        </div>
      </aside>
    </div>
  );
}

function GatePanel({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "bad";
}) {
  return (
    <div
      className="mt-10 border border-[var(--rule)] bg-[var(--bg-elev-1)] p-8 md:p-10"
      style={tone === "bad" ? { borderColor: "var(--signal-bad)" } : undefined}
    >
      {children}
    </div>
  );
}
