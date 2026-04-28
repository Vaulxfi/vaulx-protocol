"use client";
// On-chain TRDC state card. Used on /demo/borrow/dashboard alongside the
// existing mock loan summary — when the demo session has a `loan.loanId`
// we derive the TRDCState PDA via `deriveTrdcStatePda` (loan-accounts.ts,
// commit 4ccd869 fixed it to use TRDC_PROGRAM_ID) and fetch it through
// `useTrdcState`. If the on-chain account is missing (mock-only flow)
// we render an explanatory placeholder.

import { useMemo } from "react";
import { PublicKey } from "@solana/web3.js";

import { deriveTrdcStatePda } from "@/lib/chain/loan-accounts";
import { useTrdcState } from "@/lib/chain/custody";

const USDC_FMT = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function fmtUsdcAtoms(atoms: bigint | number | string | undefined): string {
  if (atoms === undefined || atoms === null) return "—";
  try {
    const big = typeof atoms === "bigint" ? atoms : BigInt(atoms.toString());
    return USDC_FMT.format(Number(big) / 1_000_000);
  } catch {
    return "—";
  }
}

function fmtStatus(status: Record<string, unknown> | undefined): string {
  if (!status || typeof status !== "object") return "Unknown";
  const key = Object.keys(status)[0];
  if (!key) return "Unknown";
  // Anchor enum keys are camelCase ("activeInCustody"); pretty-print.
  return key.charAt(0).toUpperCase() + key.slice(1);
}

function fmtAssetId(assetId: PublicKey | undefined): string | null {
  if (!assetId) return null;
  const b58 = assetId.toBase58();
  if (b58 === PublicKey.default.toBase58()) return null;
  return b58;
}

export function OnchainTrdcCard({ loanId }: { loanId: string | undefined }) {
  const trdcPda = useMemo(() => {
    if (!loanId) return undefined;
    try {
      return deriveTrdcStatePda(new PublicKey(loanId));
    } catch {
      return undefined;
    }
  }, [loanId]);

  const { data: trdc, isLoading } = useTrdcState(trdcPda);

  if (!loanId || !trdcPda) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="rounded-md border border-[var(--rule)] bg-[var(--bg-elev-1)] p-5">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
          On-chain state
        </div>
        <p className="mt-3 font-mono text-xs text-[var(--ink-muted)]">
          Reading TRDCState…
        </p>
      </div>
    );
  }

  if (!trdc) {
    return (
      <div className="rounded-md border border-[var(--rule)] bg-[var(--bg-elev-1)] p-5">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
          On-chain state
        </div>
        <p className="mt-3 text-xs text-[var(--ink-dim)]">
          No on-chain TRDC found for this loan_id. The demo session above
          reflects the mock state only.
        </p>
        <p className="mt-2 font-mono text-[10px] text-[var(--ink-muted)]">
          {trdcPda.toBase58()}
        </p>
      </div>
    );
  }

  const principal = fmtUsdcAtoms(trdc.loanAmount as unknown as bigint);
  const ltvBps = (trdc as unknown as { ltvBps?: number }).ltvBps;
  const dueTs = trdc.dueTs ? Number(trdc.dueTs) : 0;
  const dueDate =
    dueTs > 0 ? new Date(dueTs * 1000).toISOString().slice(0, 10) : "—";
  const assetId = fmtAssetId(trdc.assetId);

  return (
    <div className="rounded-md border border-[var(--brand)]/40 bg-[var(--brand)]/5 p-5">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--brand)]">
          On-chain state
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--brand)]/40 bg-[var(--brand)]/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--brand)]">
          Devnet
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
        <Cell label="Status" value={fmtStatus(trdc.status)} />
        <Cell label="Principal" value={`${principal} USDC`} />
        <Cell
          label="LTV"
          value={ltvBps !== undefined ? `${(ltvBps / 100).toFixed(2)}%` : "—"}
        />
        <Cell label="Due" value={dueDate} />
      </div>

      <div className="mt-4 border-t border-[var(--rule)] pt-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
          TRDCState PDA
        </div>
        <a
          href={`https://solscan.io/account/${trdcPda.toBase58()}?cluster=devnet`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 block font-mono text-[10px] text-[var(--brand)] hover:underline"
        >
          {trdcPda.toBase58()} ↗
        </a>
      </div>

      {assetId && (
        <div className="mt-3 border-t border-[var(--rule)] pt-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
            cNFT asset
          </div>
          <a
            href={`https://solscan.io/token/${assetId}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 block font-mono text-[10px] text-[var(--brand)] hover:underline"
          >
            {assetId} ↗
          </a>
        </div>
      )}
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
        {label}
      </div>
      <div
        className="mt-1 font-mono text-[var(--ink)]"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {value}
      </div>
    </div>
  );
}
