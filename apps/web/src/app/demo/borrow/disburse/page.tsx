"use client";
// /demo/borrow/disburse renders two distinct flows depending on how
// the loan was provisioned:
//
//  - **provisionedOnChain = true** (atomic confirm-and-disburse via the
//    FE-signing wizard from #31/#32). The disburse already landed on-
//    chain during the register-submit round-trip, so there is no
//    "release" action left for the user to perform. We show a
//    success screen that links the two transaction signatures
//    (createTx = create_ccb_trdc, custodyTx = atomic confirm_custody)
//    to Solscan and routes the user onward to /funds.
//
//  - **provisionedOnChain = false** (mock wizard path: no wallet
//    connected, register fell through to the synthetic UUID-loan
//    flow). We keep the original AHA moment narrative — the on-chain
//    contract "refuses" → custodian signs → "release funds" — because
//    that storytelling is what the demo was built around for users
//    walking through without a wallet.
//
// Previous iteration (PR #33) redirected provisionedOnChain users to
// /funds because the AHA storyline didn't match their state. This
// version removes that redirect — the page now self-adapts so /disburse
// stays a meaningful stop in the wizard for everyone.
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DemoShell } from "../../_components/demo-shell";
import { useDemoSession } from "../../_lib/use-demo-session";

const USD = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function fmtUsdcWhole(atoms: string): string {
  // atoms are 6-decimal USDC; this screen renders whole units only.
  try {
    const n = Number(BigInt(atoms) / 1_000_000n);
    return USD.format(n);
  } catch {
    return "0";
  }
}

function shortSig(sig: string | undefined): string {
  if (!sig) return "";
  return sig.length > 12 ? `${sig.slice(0, 6)}…${sig.slice(-4)}` : sig;
}

// ---------------------------------------------------------------------------
// On-chain success view
// ---------------------------------------------------------------------------

type OnChainSuccessProps = {
  amountLabel: string;
  loanId: string;
  trdcStatePda?: string;
  createTx?: string;
  custodyTx?: string;
};

function OnChainSuccess({
  amountLabel,
  loanId,
  trdcStatePda,
  createTx,
  custodyTx,
}: OnChainSuccessProps) {
  return (
    <DemoShell formFactor="phone">
      <div className="px-6 py-8">
        <p className="eyebrow" style={{ color: "var(--brand)" }}>
          Step 10 / 14 · The aha moment
        </p>
        <h1 className="display-md mt-3">Funds delivered.</h1>
        <p className="mt-3 text-sm text-[var(--ink-dim)]">
          Custody confirmation and principal disburse landed in a single
          atomic transaction. Vaulx never holds funds between the two —
          either both steps land or neither does.
        </p>

        {/* Amount card */}
        <div
          className="mt-6 rounded-md border border-emerald-500/40 bg-emerald-500/5 p-5"
          style={{ animation: "vxReveal 600ms cubic-bezier(.22,1,.36,1)" }}
        >
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-400">
            Principal disbursed
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className="font-display text-4xl text-[var(--ink)]"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {amountLabel}
            </span>
            <span className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--ink-muted)]">
              USDC
            </span>
          </div>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
            loan_id={loanId.slice(0, 8)}…
          </p>
        </div>

        {/* On-chain signature receipt */}
        <div className="mt-6 rounded-md border border-[var(--rule)] bg-[var(--bg-elev-1)] p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--brand)]">
            On-chain receipt · Devnet
          </p>

          {createTx && (
            <div className="mt-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                create_ccb_trdc
              </p>
              <a
                href={`https://solscan.io/tx/${createTx}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[11px] text-emerald-400 underline decoration-dotted hover:text-emerald-300"
              >
                {shortSig(createTx)} ↗
              </a>
            </div>
          )}

          {custodyTx && (
            <div className="mt-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                confirm_custody (atomic + disburse)
              </p>
              <a
                href={`https://solscan.io/tx/${custodyTx}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[11px] text-emerald-400 underline decoration-dotted hover:text-emerald-300"
              >
                {shortSig(custodyTx)} ↗
              </a>
            </div>
          )}

          {trdcStatePda && (
            <div className="mt-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                trdc_state
              </p>
              <a
                href={`https://solscan.io/account/${trdcStatePda}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[11px] text-[var(--brand)] underline decoration-dotted hover:opacity-90"
              >
                {trdcStatePda.slice(0, 6)}…{trdcStatePda.slice(-4)} ↗
              </a>
            </div>
          )}
        </div>

        <Link
          href="/demo/borrow/funds"
          className="mt-8 block w-full rounded-md border border-[var(--brand)] bg-[var(--brand)] px-4 py-4 text-center font-mono text-sm uppercase tracking-[0.16em] text-[var(--bg)]"
        >
          Continue to your funds →
        </Link>

        <style jsx>{`
          @keyframes vxReveal {
            from {
              opacity: 0;
              transform: translateY(4px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>
    </DemoShell>
  );
}

// ---------------------------------------------------------------------------
// Mock-flow AHA moment (unchanged from pre-atomic narrative)
// ---------------------------------------------------------------------------

type MockState =
  | "ready"
  | "refused"
  | "custodian-signing"
  | "custodian-signed"
  | "disbursing"
  | "done";

type MockAhaProps = {
  amountLabel: string;
  loanIdSlice: string;
  onSignedCustody: () => void;
  onDisburseDone: () => void;
  onContinue: () => void;
};

function MockAha({
  amountLabel,
  loanIdSlice,
  onSignedCustody,
  onDisburseDone,
  onContinue,
}: MockAhaProps) {
  const [state, setState] = useState<MockState>("ready");

  const handlePrimary = () => {
    if (state === "ready") {
      setState("refused");
      return;
    }
    if (state === "custodian-signed") {
      setState("disbursing");
      window.setTimeout(() => {
        onDisburseDone();
        setState("done");
      }, 1200);
      return;
    }
    if (state === "done") {
      onContinue();
    }
  };

  const handleWakeCustodian = () => setState("custodian-signing");
  const handleCustodianSign = () => {
    onSignedCustody();
    setState("custodian-signed");
  };

  const primaryLabel =
    state === "disbursing"
      ? "Disbursing…"
      : state === "done"
        ? "Open Vaulx wallet →"
        : "Release funds";

  const primaryDisabled =
    state === "disbursing" ||
    state === "refused" ||
    state === "custodian-signing";

  return (
    <DemoShell formFactor="phone">
      <div className="px-6 py-8">
        <p className="eyebrow" style={{ color: "var(--brand)" }}>
          Step 10 / 14 · The aha moment
        </p>
        <h1 className="display-md mt-3">Release funds.</h1>
        <p className="mt-3 text-sm text-[var(--ink-dim)]">
          Vaulx will refuse until custody is confirmed. Then it will let go.
        </p>

        <div className="mt-6 rounded-md border border-[var(--rule)] bg-[var(--bg-elev-1)] p-5">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
            Principal
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className="font-mono text-4xl text-[var(--ink)]"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {amountLabel}
            </span>
            <span className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--ink-muted)]">
              USDC
            </span>
          </div>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
            vault.disburse(loan_id={loanIdSlice})
          </p>
        </div>

        {state === "refused" && (
          <div
            key="refused"
            className="animate-shake mt-6 rounded-md border border-rose-500/50 bg-rose-500/10 p-4"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-rose-300">
              Contract refused
            </p>
            <p className="mt-2 font-mono text-sm text-rose-300">
              Error: CustodyNotConfirmed
            </p>
            <p className="mt-2 text-xs text-[var(--ink-dim)]">
              vault.disburse() reverted. Custody must be confirmed on-chain
              by the licensed custodian before funds release.
            </p>
            <button
              type="button"
              onClick={handleWakeCustodian}
              className="mt-4 w-full rounded-md border border-[var(--brand)]/50 bg-[var(--brand)]/10 px-3 py-2 font-mono text-xs uppercase tracking-wider text-[var(--brand)]"
            >
              Wake the custodian →
            </button>
          </div>
        )}

        {state === "custodian-signing" && (
          <div className="mt-6 rounded-md border border-[var(--brand)]/50 bg-[var(--brand-wash)] p-4">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--brand)]">
                Custodian terminal — Brinks SP
              </p>
              <span
                className="inline-block h-2 w-2 rounded-full bg-[var(--brand)]"
                style={{ animation: "pulse 1.4s ease-in-out infinite" }}
              />
            </div>
            <p className="mt-3 text-sm text-[var(--ink)]">
              Watch received and inspected. Vault A-32. Signing custody
              confirmation…
            </p>
            <button
              type="button"
              onClick={handleCustodianSign}
              className="mt-4 w-full rounded-md border border-[var(--brand)] bg-[var(--brand)] px-3 py-2 font-mono text-xs uppercase tracking-wider text-[var(--bg)]"
            >
              Sign with custodian wallet
            </button>
          </div>
        )}

        {state === "custodian-signed" && (
          <div className="mt-6 rounded-md border border-emerald-500/50 bg-emerald-500/10 p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-400">
              ✓ Custody confirmed on-chain
            </p>
            <p className="mt-2 text-xs text-[var(--ink-dim)]">
              Try again now.
            </p>
          </div>
        )}

        {state === "disbursing" && (
          <div className="mt-6 flex items-center gap-3 rounded-md border border-[var(--rule)] bg-[var(--bg-elev-1)] p-4">
            <span
              className="inline-block h-2 w-2 rounded-full bg-[var(--brand)]"
              style={{ animation: "pulse 1.4s ease-in-out infinite" }}
            />
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--ink-dim)]">
              Sending {amountLabel} USDC to your Vaulx wallet…
            </p>
          </div>
        )}

        {state === "done" && (
          <div
            key="done"
            className="mt-6 rounded-md border border-emerald-500/60 bg-emerald-500/10 p-5"
            style={{ animation: "vxReveal 600ms cubic-bezier(.22,1,.36,1)" }}
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-400">
              ✓ Funds released
            </p>
            <div className="mt-3 flex items-baseline gap-2">
              <span
                className="font-display text-3xl text-emerald-300"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {amountLabel}
              </span>
              <span className="font-mono text-xs uppercase tracking-[0.14em] text-emerald-300/80">
                USDC released
              </span>
            </div>
            <p className="mt-2 text-xs text-[var(--ink-dim)]">
              In your Vaulx wallet.
            </p>
          </div>
        )}

        <button
          type="button"
          disabled={primaryDisabled}
          onClick={handlePrimary}
          className="mt-8 w-full rounded-md border border-[var(--brand)] bg-[var(--brand)] px-4 py-4 font-mono text-sm uppercase tracking-[0.16em] text-[var(--bg)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {primaryLabel}
        </button>

        <style jsx>{`
          @keyframes pulse {
            0%,
            100% {
              opacity: 1;
            }
            50% {
              opacity: 0.35;
            }
          }
          @keyframes vxReveal {
            from {
              opacity: 0;
              transform: translateY(4px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>
    </DemoShell>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DisbursePage() {
  const router = useRouter();
  const { session, patch } = useDemoSession();

  useEffect(() => {
    if (session && !session.loan) {
      router.replace("/demo/borrow/onboard");
    }
  }, [session, router]);

  const principalAtoms = session?.loan?.principalAtoms ?? "0";
  const amountLabel = useMemo(() => fmtUsdcWhole(principalAtoms), [principalAtoms]);

  if (!session) {
    return (
      <DemoShell formFactor="phone">
        <div className="px-6 py-12 text-[var(--ink-muted)]">Loading…</div>
      </DemoShell>
    );
  }
  if (!session.loan) {
    return (
      <DemoShell formFactor="phone">
        <div className="px-6 py-12 text-[var(--ink-muted)]">Redirecting…</div>
      </DemoShell>
    );
  }

  if (session.loan.provisionedOnChain) {
    return (
      <OnChainSuccess
        amountLabel={amountLabel}
        loanId={session.loan.loanId}
        trdcStatePda={session.loan.trdcStatePda}
        createTx={session.loan.createTx}
        custodyTx={session.loan.custodyTx}
      />
    );
  }

  return (
    <MockAha
      amountLabel={amountLabel}
      loanIdSlice={session.loan.loanId.slice(0, 8)}
      onSignedCustody={() => {
        patch((s) => ({
          ...s,
          loan: s.loan
            ? {
                ...s.loan,
                custody: { ...s.loan.custody, confirmedAt: Date.now() },
              }
            : s.loan,
        }));
      }}
      onDisburseDone={() => {
        patch((s) => ({
          ...s,
          loan: s.loan
            ? {
                ...s.loan,
                disbursedAt: Date.now(),
                inAppBalanceAtoms: s.loan.principalAtoms,
              }
            : s.loan,
          tour: { ...s.tour, step: 10 },
        }));
      }}
      onContinue={() => router.push("/demo/borrow/funds")}
    />
  );
}
