"use client";
// THE AHA MOMENT: Vaulx refuses to release funds until the on-chain custody
// confirmation lands. The page runs a local state machine — it ignores
// `session.loan.custody.confirmedAt` until the user explicitly walks through
// the refusal → custodian-sign → retry → release choreography. Session is
// patched in parallel for downstream pages (dashboard, funds).
//
// Wave-D wiring: when a wallet is connected we additionally render an
// "On-chain disburse" panel that calls the real `loan.disburse_from_vault`
// via `useDisburse`. Before the call we hit `/api/demo/publish-price` so
// the SR-2 oracle gate has a fresh PriceFeed for `trdc_state.ref_bytes`.
//
// Prereqs (the on-chain call will fail without them, by design):
//   - session.loan.loanId is set
//   - on-chain TRDCState exists at deriveTrdcStatePda(loanId)
//   - TRDCState.status == ActiveInCustody (custody already confirmed)
//   - the borrower wallet matches the TRDC borrower (it's the signer)
// When prereqs are missing the panel still renders but surfaces a useful
// error from the program (e.g. AccountNotFound, InvalidStateTransition).
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { DemoShell } from "../../_components/demo-shell";
import { useDemoSession } from "../../_lib/use-demo-session";
import { deriveTrdcStatePda } from "@/lib/chain/loan-accounts";
import { useTrdcState } from "@/lib/chain/custody";
import { useDisburse } from "@/lib/chain/loan";
import { requireUsdcMint } from "@/lib/usdc";
import { useKycGate, KycCancelledError } from "@/lib/use-kyc-gate";

type DisburseState =
  | "ready"
  | "refused"
  | "custodian-signing"
  | "custodian-signed"
  | "disbursing"
  | "done";

const USD = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function fmtUsdcWhole(atoms: string): string {
  // atoms are 6-decimal USDC; we display whole units only on this screen.
  try {
    const n = Number(BigInt(atoms) / 1_000_000n);
    return USD.format(n);
  } catch {
    return "0";
  }
}

export default function DisbursePage() {
  const router = useRouter();
  const { session, patch } = useDemoSession();
  const [state, setState] = useState<DisburseState>("ready");
  const { publicKey: connectedWallet } = useWallet();

  // Derive TRDCState PDA when session has a loanId; surface real on-chain
  // status so the disburse panel can show meaningful prereq errors before
  // the user clicks.
  const trdcPda = useMemo(() => {
    const lid = session?.loan?.loanId;
    if (!lid) return undefined;
    try {
      return deriveTrdcStatePda(new PublicKey(lid));
    } catch {
      return undefined;
    }
  }, [session?.loan?.loanId]);
  const onchainTrdc = useTrdcState(trdcPda);
  const disburse = useDisburse();
  const { guard, modalNode } = useKycGate("Disburse");
  const [chainSig, setChainSig] = useState<string | null>(null);
  const [chainErr, setChainErr] = useState<string | null>(null);
  const [chainPending, setChainPending] = useState(false);

  // Redirect if the user landed here without a loan.
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

  const handlePrimary = () => {
    if (state === "ready") {
      // First tap — internal state machine ignores the existing
      // session.loan.custody.confirmedAt to make the refusal land.
      setState("refused");
      return;
    }
    if (state === "custodian-signed") {
      setState("disbursing");
      window.setTimeout(() => {
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
        setState("done");
      }, 1200);
      return;
    }
    if (state === "done") {
      router.push("/demo/borrow/funds");
    }
  };

  const handleWakeCustodian = () => setState("custodian-signing");

  const handleCustodianSign = () => {
    patch((s) => ({
      ...s,
      loan: s.loan
        ? {
            ...s.loan,
            custody: { ...s.loan.custody, confirmedAt: Date.now() },
          }
        : s.loan,
    }));
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
      {modalNode}
      <div className="px-6 py-8">
        <p className="eyebrow" style={{ color: "var(--brand)" }}>
          Step 10 / 14 · The aha moment
        </p>
        <h1 className="display-md mt-3">Release funds.</h1>
        <p className="mt-3 text-sm text-[var(--ink-dim)]">
          Vaulx will refuse until custody is confirmed. Then it will let go.
        </p>

        {/* Amount card */}
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
            vault.disburse(loan_id={session.loan.loanId.slice(0, 8)})
          </p>
        </div>

        {/* Refused panel */}
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
              vault.disburse() reverted. Custody must be confirmed on-chain by
              the licensed custodian before funds release.
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

        {/* Custodian terminal panel */}
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

        {/* Custody confirmed panel */}
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

        {/* Disbursing panel */}
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

        {/* Done panel */}
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

        {/* On-chain disburse panel (real Anchor ix) */}
        <OnchainDisburseSection
          loanId={session.loan.loanId}
          principalAtoms={session.loan.principalAtoms}
          trdcPda={trdcPda}
          trdcStatus={
            onchainTrdc.data?.status as Record<string, unknown> | undefined
          }
          trdcRefBytes={
            (onchainTrdc.data as unknown as { refBytes?: number[] })?.refBytes
          }
          walletConnected={!!connectedWallet}
          isPending={chainPending || disburse.isPending}
          chainSig={chainSig}
          chainErr={chainErr}
          onClick={async () => {
            setChainErr(null);
            setChainSig(null);
            setChainPending(true);
            try {
              const txSig = await guard(async () => {
                if (!trdcPda) throw new Error("Loan id missing in session");
                const usdcMint = requireUsdcMint();
                const refBytes = (onchainTrdc.data as unknown as {
                  refBytes?: number[];
                })?.refBytes;
                // Best-effort: if we have ref_bytes, refresh the price feed
                // server-side. We don't fail the whole disburse on this — the
                // operator may have configured oracle_admin = default, in
                // which case publish-price returns an OracleNotInitialized
                // error and disburse skips the oracle gate anyway.
                if (Array.isArray(refBytes) && refBytes.length === 32) {
                  try {
                    await fetch("/api/demo/publish-price", {
                      method: "POST",
                      headers: { "content-type": "application/json" },
                      body: JSON.stringify({ refBytes }),
                    });
                  } catch {
                    // ignore — disburse will surface the real error
                  }
                }
                const principal = BigInt(session.loan!.principalAtoms);
                const refBytesU8 =
                  Array.isArray(refBytes) && refBytes.length === 32
                    ? Uint8Array.from(refBytes)
                    : undefined;
                const result = await disburse.mutateAsync({
                  trdcPda,
                  assetMint: usdcMint,
                  amount: principal,
                  refBytes: refBytesU8,
                });
                return result.txSig;
              });
              setChainSig(txSig);
            } catch (err) {
              if (err instanceof KycCancelledError) return;
              setChainErr(
                err instanceof Error ? err.message : String(err),
              );
            } finally {
              setChainPending(false);
            }
          }}
        />

        {/* Primary CTA */}
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
        `}</style>
      </div>
    </DemoShell>
  );
}

function OnchainDisburseSection({
  loanId,
  principalAtoms,
  trdcPda,
  trdcStatus,
  trdcRefBytes,
  walletConnected,
  isPending,
  chainSig,
  chainErr,
  onClick,
}: {
  loanId: string;
  principalAtoms: string;
  trdcPda: PublicKey | undefined;
  trdcStatus: Record<string, unknown> | undefined;
  trdcRefBytes: number[] | undefined;
  walletConnected: boolean;
  isPending: boolean;
  chainSig: string | null;
  chainErr: string | null;
  onClick: () => void | Promise<void>;
}) {
  const statusKey = trdcStatus ? Object.keys(trdcStatus)[0] : undefined;
  const inCustody = statusKey === "activeInCustody";
  const onchainExists = !!trdcPda && !!statusKey;

  return (
    <div className="mt-8 rounded-md border border-[var(--rule)] bg-[var(--bg-elev-1)] p-5">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--brand)]">
          On-chain disburse · Devnet
        </div>
        {trdcPda && (
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
            {trdcPda.toBase58().slice(0, 6)}…{trdcPda.toBase58().slice(-4)}
          </span>
        )}
      </div>

      <p className="mt-2 text-xs text-[var(--ink-dim)]">
        Calls{" "}
        <code className="font-mono text-[var(--brand)]">
          loan.disburse_from_vault({(BigInt(principalAtoms) / 1_000_000n).toString()} USDC)
        </code>{" "}
        from your wallet. Publishes a fresh price feed beforehand to satisfy
        the SR-2 oracle gate.
      </p>

      {/* Prereq summary */}
      <ul className="mt-3 flex flex-col gap-1 font-mono text-[10px] uppercase tracking-[0.14em]">
        <li
          className={
            walletConnected ? "text-emerald-400" : "text-[var(--ink-muted)]"
          }
        >
          {walletConnected ? "✓" : "·"} Wallet connected
        </li>
        <li
          className={
            !!loanId ? "text-emerald-400" : "text-[var(--ink-muted)]"
          }
        >
          {loanId ? "✓" : "·"} Loan id present
        </li>
        <li
          className={
            onchainExists ? "text-emerald-400" : "text-[var(--ink-muted)]"
          }
        >
          {onchainExists ? "✓" : "·"} On-chain TRDC found
          {statusKey && (
            <span className="ml-2 text-[var(--ink-muted)] normal-case">
              ({statusKey})
            </span>
          )}
        </li>
        <li
          className={
            inCustody ? "text-emerald-400" : "text-[var(--ink-muted)]"
          }
        >
          {inCustody ? "✓" : "·"} Status = ActiveInCustody
        </li>
        <li
          className={
            Array.isArray(trdcRefBytes) && trdcRefBytes.length === 32
              ? "text-emerald-400"
              : "text-[var(--ink-muted)]"
          }
        >
          {Array.isArray(trdcRefBytes) && trdcRefBytes.length === 32 ? "✓" : "·"} ref_bytes
          available
        </li>
      </ul>

      <button
        type="button"
        disabled={!walletConnected || isPending}
        onClick={onClick}
        className="mt-4 w-full rounded-md border border-[var(--brand)]/60 bg-[var(--brand)]/10 px-4 py-3 font-mono text-xs uppercase tracking-[0.16em] text-[var(--brand)] disabled:cursor-not-allowed disabled:opacity-40 hover:bg-[var(--brand)]/20"
      >
        {isPending
          ? "Submitting on-chain disburse…"
          : walletConnected
            ? "Run disburse on Devnet"
            : "Connect wallet to disburse"}
      </button>

      {chainErr && (
        <p className="mt-3 break-words font-mono text-[11px] text-rose-400">
          {chainErr}
        </p>
      )}
      {chainSig && (
        <p className="mt-3 font-mono text-[11px] text-emerald-400">
          ✓ Disbursed.{" "}
          <a
            href={`https://solscan.io/tx/${chainSig}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-dotted hover:text-emerald-300"
          >
            {chainSig.slice(0, 8)}…{chainSig.slice(-4)} ↗
          </a>
        </p>
      )}

      {!onchainExists && walletConnected && (
        <p className="mt-3 text-[11px] text-[var(--ink-muted)]">
          No active loan in CustodyConfirmed status. Create a loan first via{" "}
          <code className="font-mono text-[var(--brand)]">
            /demo/borrow/onboard
          </code>{" "}
          or use the admin cockpit at{" "}
          <code className="font-mono text-[var(--brand)]">/admin/demo</code>{" "}
          (local-only).
        </p>
      )}
    </div>
  );
}
