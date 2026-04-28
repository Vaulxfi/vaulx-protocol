"use client";
// Final tour step. Borrower pays principal + accrued interest in full.
// Math goes through `@vaulx/terms.computePayoff` so this surface stays in
// lockstep with what the on-chain Rust mirror would compute on settlement.
//
// Phase E (Wire 3): when a wallet is connected and the session loan was
// provisioned on-chain, render an <OnchainRepaySection> that calls the real
// `loan.repay_ccb` ix via `useLoanRepay`. Includes a faucet shortcut for the
// demo USDC mint so the borrower can always pay off without leaving the
// surface.
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PublicKey } from "@solana/web3.js";
import { computeInterestAccrued, computePayoff } from "@vaulx/terms";
import { DemoShell } from "../../_components/demo-shell";
import { useDemoSession } from "../../_lib/use-demo-session";
import { useUnifiedWallet } from "@/components/providers/crossmint-wallet-adapter";
import { useTrdcState } from "@/lib/chain/custody";
import { useLoanRepay, deriveTrdcStatePda } from "@/lib/chain/loan";
import { useUserUsdcBalance } from "@/lib/chain/vault";
import { requireUsdcMint } from "@/lib/usdc";

const SECONDS_PER_DAY = 86_400;

const USDC_FMT = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function fmtUsdc(atoms: bigint): string {
  return USDC_FMT.format(Number(atoms) / 1_000_000);
}

function fmtBpsPct(bps: number): string {
  const whole = Math.floor(bps / 100);
  const rem = bps % 100;
  return `${whole}.${rem.toString().padStart(2, "0")}%`;
}

type RepayState = "ready" | "paying" | "done";

export default function RepayPage() {
  const router = useRouter();
  const { session, patch } = useDemoSession();
  const [state, setState] = useState<RepayState>("ready");
  const wallet = useUnifiedWallet();

  // On-chain repay plumbing. Re-derives the TRDCState PDA from the saved
  // loanId so the panel works even if the user reloads after disburse.
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
  const repayMutation = useLoanRepay();
  const usdcMintRaw = process.env.NEXT_PUBLIC_USDC_MINT;
  const usdcMint = useMemo(() => {
    if (!usdcMintRaw) return undefined;
    try {
      return new PublicKey(usdcMintRaw);
    } catch {
      return undefined;
    }
  }, [usdcMintRaw]);
  const usdcBalance = useUserUsdcBalance(usdcMint);
  const [chainSig, setChainSig] = useState<string | null>(null);
  const [chainErr, setChainErr] = useState<string | null>(null);
  const [faucetPending, setFaucetPending] = useState(false);
  const [faucetMsg, setFaucetMsg] = useState<string | null>(null);

  useEffect(() => {
    if (session && !session.loan?.disbursedAt) {
      router.replace("/demo/borrow/disburse");
    }
  }, [session, router]);

  const principalAtoms = useMemo(() => {
    if (!session?.loan) return 0n;
    try {
      return BigInt(session.loan.principalAtoms);
    } catch {
      return 0n;
    }
  }, [session?.loan]);

  const createdAtSec = useMemo(() => {
    if (!session?.loan) return 0;
    return session.loan.dueTs - session.loan.termDays * SECONDS_PER_DAY;
  }, [session?.loan]);

  const nowSec = useMemo(() => Math.floor(Date.now() / 1000), []);

  const daysElapsed = useMemo(() => {
    if (!createdAtSec) return 0;
    return Math.max(0, Math.floor((nowSec - createdAtSec) / SECONDS_PER_DAY));
  }, [createdAtSec, nowSec]);

  const accruedAtoms = useMemo(() => {
    if (!session?.loan) return 0n;
    return computeInterestAccrued(principalAtoms, session.loan.rateBps, daysElapsed);
  }, [session?.loan, principalAtoms, daysElapsed]);

  const payoffAtoms = useMemo(() => {
    if (!session?.loan) return 0n;
    return computePayoff(principalAtoms, session.loan.rateBps, createdAtSec, nowSec);
  }, [session?.loan, principalAtoms, createdAtSec, nowSec]);

  if (!session) {
    return (
      <DemoShell formFactor="phone">
        <div className="px-6 py-12 text-[var(--ink-muted)]">Loading…</div>
      </DemoShell>
    );
  }

  if (!session.loan?.disbursedAt) {
    return (
      <DemoShell formFactor="phone">
        <div className="px-6 py-12 text-[var(--ink-muted)]">Redirecting…</div>
      </DemoShell>
    );
  }

  const loan = session.loan;

  const handlePay = () => {
    if (state !== "ready") return;
    setState("paying");
    window.setTimeout(() => {
      patch((s) => {
        if (!s.loan) return s;
        let balance = 0n;
        try {
          const cur = BigInt(s.loan.inAppBalanceAtoms);
          balance = cur > payoffAtoms ? cur - payoffAtoms : 0n;
        } catch {
          balance = 0n;
        }
        return {
          ...s,
          loan: { ...s.loan, inAppBalanceAtoms: balance.toString() },
          tour: { ...s.tour, step: 14 },
        };
      });
      setState("done");
    }, 1500);
  };

  const ctaLabel =
    state === "paying" ? "Paying…" : state === "done" ? "Loan repaid" : "Pay full payoff";

  return (
    <DemoShell formFactor="phone">
      <div className="px-6 py-8">
        <p className="eyebrow" style={{ color: "var(--brand)" }}>
          Step 14 / 14 · Repay
        </p>
        <h1 className="display-md mt-3">Pay it off. Get your watch back.</h1>
        <p className="mt-3 text-sm text-[var(--ink-dim)]">
          Principal plus accrued interest. Single payment, single transaction.
        </p>

        {/* Breakdown */}
        <div className="mt-6 rounded-md border border-[var(--rule)] bg-[var(--bg-elev-1)] p-5">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
            Payoff breakdown
          </div>
          <div className="mt-4 divide-y divide-[var(--rule)]">
            <div className="flex items-baseline justify-between py-2">
              <span className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                Principal
              </span>
              <span
                className="font-mono text-sm text-[var(--ink)]"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {fmtUsdc(principalAtoms)} USDC
              </span>
            </div>
            <div className="flex items-baseline justify-between py-2">
              <span className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                Interest · {daysElapsed}d at {fmtBpsPct(loan.rateBps)} APR
              </span>
              <span
                className="font-mono text-sm text-[var(--ink)]"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {fmtUsdc(accruedAtoms)} USDC
              </span>
            </div>
            <div className="flex items-baseline justify-between py-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--brand)]">
                Total payoff
              </span>
              <span
                className="font-mono text-2xl text-[var(--brand)]"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {fmtUsdc(payoffAtoms)} USDC
              </span>
            </div>
          </div>
        </div>

        {state === "paying" && (
          <div className="mt-6 flex items-center gap-3 rounded-md border border-[var(--rule)] bg-[var(--bg-elev-1)] p-4">
            <span
              className="inline-block h-2 w-2 rounded-full bg-[var(--brand)]"
              style={{ animation: "vxRepayPulse 1.4s ease-in-out infinite" }}
            />
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--ink-dim)]">
              Settling on-chain…
            </p>
          </div>
        )}

        {state === "done" && (
          <div
            className="mt-6 rounded-md border border-emerald-500/60 bg-emerald-500/10 p-5"
            style={{ animation: "vxReveal 600ms cubic-bezier(.22,1,.36,1)" }}
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-400">
              ✓ Loan repaid
            </p>
            <p className="mt-2 text-sm text-[var(--ink)]">
              Custody release pending — your watch is on its way home from Vault A-32.
            </p>
          </div>
        )}

        {/* On-chain repay panel — real loan.repay_ccb when wallet connected */}
        <OnchainRepaySection
          loanId={loan.loanId}
          trdcPda={trdcPda}
          trdcStatus={
            onchainTrdc.data?.status as Record<string, unknown> | undefined
          }
          principalRemainingAtoms={
            (onchainTrdc.data as unknown as { principalRemaining?: unknown })
              ?.principalRemaining
          }
          onchainRateBps={
            (onchainTrdc.data as unknown as { rateBps?: unknown })?.rateBps
          }
          onchainDueTs={
            (onchainTrdc.data as unknown as { dueTs?: unknown })?.dueTs
          }
          walletConnected={wallet.canSign}
          payoffAtoms={payoffAtoms}
          usdcBalanceAtoms={usdcBalance.data}
          isPending={repayMutation.isPending}
          chainSig={chainSig}
          chainErr={chainErr}
          faucetPending={faucetPending}
          faucetMsg={faucetMsg}
          onRepay={async () => {
            setChainErr(null);
            setChainSig(null);
            try {
              if (!trdcPda) throw new Error("Loan id missing in session");
              const mint = requireUsdcMint();
              const { txSig } = await repayMutation.mutateAsync({
                trdcPda,
                assetMint: mint,
              });
              setChainSig(txSig);
              usdcBalance.refetch();
            } catch (err) {
              setChainErr(err instanceof Error ? err.message : String(err));
            }
          }}
          onFaucet={async () => {
            setFaucetMsg(null);
            setFaucetPending(true);
            try {
              const recipientPubkey = wallet.publicKey?.toBase58();
              if (!recipientPubkey) throw new Error("Connect a wallet first");
              const res = await fetch("/api/demo/faucet-usdc", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ recipientPubkey, amount: 1000 }),
              });
              const json = (await res.json().catch(() => ({}))) as {
                ok?: boolean;
                detail?: string;
                error?: string;
              };
              if (!res.ok || !json.ok) {
                throw new Error(
                  json.error ?? json.detail ?? `faucet failed (${res.status})`,
                );
              }
              setFaucetMsg(json.detail ?? "Minted 1000 demo USDC");
              usdcBalance.refetch();
            } catch (err) {
              setFaucetMsg(
                err instanceof Error ? `Error: ${err.message}` : String(err),
              );
            } finally {
              setFaucetPending(false);
            }
          }}
        />

        <button
          type="button"
          onClick={handlePay}
          disabled={state !== "ready"}
          className="mt-8 w-full rounded-md border border-[var(--brand)] bg-[var(--brand)] px-4 py-4 font-mono text-sm uppercase tracking-[0.16em] text-[var(--bg)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {ctaLabel}
        </button>

        <Link
          href="/demo/borrow/dashboard"
          className="mt-6 block text-center font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)] hover:text-[var(--brand)]"
        >
          ← Back to dashboard
        </Link>

        <style jsx>{`
          @keyframes vxRepayPulse {
            0%,
            100% {
              opacity: 1;
            }
            50% {
              opacity: 0.3;
            }
          }
        `}</style>
      </div>
    </DemoShell>
  );
}

function bigishToBigInt(v: unknown): bigint {
  if (v == null) return 0n;
  if (typeof v === "bigint") return v;
  if (typeof v === "number") return BigInt(v);
  if (typeof v === "string") {
    try {
      return BigInt(v);
    } catch {
      return 0n;
    }
  }
  if (typeof (v as { toString?: () => string }).toString === "function") {
    try {
      return BigInt((v as { toString: () => string }).toString());
    } catch {
      return 0n;
    }
  }
  return 0n;
}

function bigishToNumber(v: unknown): number {
  return Number(bigishToBigInt(v));
}

function OnchainRepaySection({
  loanId,
  trdcPda,
  trdcStatus,
  principalRemainingAtoms,
  onchainRateBps,
  onchainDueTs,
  walletConnected,
  payoffAtoms,
  usdcBalanceAtoms,
  isPending,
  chainSig,
  chainErr,
  faucetPending,
  faucetMsg,
  onRepay,
  onFaucet,
}: {
  loanId: string;
  trdcPda: PublicKey | undefined;
  trdcStatus: Record<string, unknown> | undefined;
  principalRemainingAtoms: unknown;
  onchainRateBps: unknown;
  onchainDueTs: unknown;
  walletConnected: boolean;
  payoffAtoms: bigint;
  usdcBalanceAtoms: bigint | undefined;
  isPending: boolean;
  chainSig: string | null;
  chainErr: string | null;
  faucetPending: boolean;
  faucetMsg: string | null;
  onRepay: () => void | Promise<void>;
  onFaucet: () => void | Promise<void>;
}) {
  const statusKey = trdcStatus ? Object.keys(trdcStatus)[0] : undefined;
  const inActive = statusKey === "activeInCustody" || statusKey === "active";
  const onchainExists = !!trdcPda && !!statusKey;
  const principalRem = bigishToBigInt(principalRemainingAtoms);
  const rateBps = bigishToNumber(onchainRateBps);
  const dueTs = bigishToNumber(onchainDueTs);
  const dueDate = dueTs > 0 ? new Date(dueTs * 1000).toISOString().slice(0, 10) : "—";
  const hasEnoughUsdc =
    usdcBalanceAtoms !== undefined && usdcBalanceAtoms >= payoffAtoms;

  return (
    <div className="mt-8 rounded-md border border-[var(--rule)] bg-[var(--bg-elev-1)] p-5">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--brand)]">
          On-chain repay · Devnet
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
          loan.repay_ccb()
        </code>{" "}
        from your wallet — pays the full principal + accrued interest in one
        transaction and flips the TRDC to{" "}
        <span className="font-mono text-[var(--ink)]">Repaid</span>.
      </p>

      {/* Live on-chain readout */}
      {onchainExists && (
        <div className="mt-3 grid grid-cols-3 gap-px overflow-hidden border border-[var(--rule)] bg-[var(--rule)]">
          <div className="bg-[var(--bg)] p-3">
            <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
              Principal rem.
            </div>
            <div
              className="mt-1 font-mono text-xs text-[var(--ink)]"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {(Number(principalRem) / 1_000_000).toFixed(2)}
            </div>
          </div>
          <div className="bg-[var(--bg)] p-3">
            <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
              Rate bps
            </div>
            <div
              className="mt-1 font-mono text-xs text-[var(--ink)]"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {rateBps}
            </div>
          </div>
          <div className="bg-[var(--bg)] p-3">
            <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
              Due
            </div>
            <div
              className="mt-1 font-mono text-xs text-[var(--ink)]"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {dueDate}
            </div>
          </div>
        </div>
      )}

      {/* Prereq checklist */}
      <ul className="mt-3 flex flex-col gap-1 font-mono text-[10px] uppercase tracking-[0.14em]">
        <li
          className={
            walletConnected ? "text-emerald-400" : "text-[var(--ink-muted)]"
          }
        >
          {walletConnected ? "✓" : "·"} Wallet connected
        </li>
        <li className={loanId ? "text-emerald-400" : "text-[var(--ink-muted)]"}>
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
          className={inActive ? "text-emerald-400" : "text-[var(--ink-muted)]"}
        >
          {inActive ? "✓" : "·"} Status repayable
        </li>
        <li
          className={
            hasEnoughUsdc ? "text-emerald-400" : "text-[var(--ink-muted)]"
          }
        >
          {hasEnoughUsdc ? "✓" : "·"} Borrower has enough USDC
          {usdcBalanceAtoms !== undefined && (
            <span className="ml-2 text-[var(--ink-muted)] normal-case">
              ({(Number(usdcBalanceAtoms) / 1_000_000).toFixed(2)} /{" "}
              {(Number(payoffAtoms) / 1_000_000).toFixed(2)})
            </span>
          )}
        </li>
      </ul>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          disabled={!walletConnected || isPending || !trdcPda}
          onClick={onRepay}
          className="flex-1 rounded-md border border-[var(--brand)]/60 bg-[var(--brand)]/10 px-4 py-3 font-mono text-xs uppercase tracking-[0.16em] text-[var(--brand)] disabled:cursor-not-allowed disabled:opacity-40 hover:bg-[var(--brand)]/20"
        >
          {isPending
            ? "Submitting on-chain repay…"
            : walletConnected
              ? "Repay on Devnet"
              : "Connect wallet to repay"}
        </button>
        <button
          type="button"
          disabled={!walletConnected || faucetPending}
          onClick={onFaucet}
          className="rounded-md border border-[var(--rule)] bg-[var(--bg)] px-4 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-dim)] disabled:cursor-not-allowed disabled:opacity-40 hover:border-[var(--brand)]/40 hover:text-[var(--ink)]"
          title="Mint 1000 demo USDC to your wallet"
        >
          {faucetPending ? "Minting…" : "Need test USDC?"}
        </button>
      </div>

      {faucetMsg && (
        <p className="mt-3 break-words font-mono text-[11px] text-[var(--ink-dim)]">
          {faucetMsg}
        </p>
      )}
      {chainErr && (
        <p className="mt-3 break-words font-mono text-[11px] text-rose-400">
          {chainErr}
        </p>
      )}
      {chainSig && (
        <p className="mt-3 font-mono text-[11px] text-emerald-400">
          ✓ Repaid.{" "}
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
    </div>
  );
}
