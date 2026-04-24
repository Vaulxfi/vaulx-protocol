"use client";

import { useMemo } from "react";
import { AnchorProvider, type Idl, type Program } from "@coral-xyz/anchor";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useQuery } from "@tanstack/react-query";
import {
  computeInterestAccrued,
  computePayoff,
  computeRenewalFee,
} from "@vaulx/terms";

const SECONDS_PER_DAY = 86_400;

export type LoanSummaryStatus =
  | "pendingCustody"
  | "activeInCustody"
  | "active"
  | "renewed"
  | "repaid"
  | "overdue"
  | "defaulted"
  | "liquidated"
  | "unknown";

export interface LoanSummary {
  trdcPda: PublicKey;
  loanId: PublicKey;
  assetId: PublicKey;
  status: LoanSummaryStatus;
  statusLabel: string;
  appraisalAtoms: bigint;
  /** Original `loan_amount` — does NOT decrement on installments. */
  principalAtoms: bigint;
  /** Outstanding principal (loan_amount minus installments). */
  principalRemainingAtoms: bigint;
  rateBps: number;
  createdAt: number;
  dueTs: number;
  docHashHex: string;
  // derived
  nowSec: number;
  daysElapsed: number;
  daysRemaining: number;
  accruedAtoms: bigint;
  payoffAtoms: bigint;
  renewalFeeAtoms: bigint;
  isOverdue: boolean;
  isTerminal: boolean;
}

function decodeStatus(
  raw: Record<string, unknown> | undefined,
): { key: LoanSummaryStatus; label: string } {
  if (!raw) return { key: "unknown", label: "—" };
  const k = Object.keys(raw)[0];
  if (!k) return { key: "unknown", label: "—" };
  const label = k.charAt(0).toUpperCase() + k.slice(1);
  const lowered = k as LoanSummaryStatus;
  return { key: lowered, label };
}

function bytesToHex(bytes: number[] | Uint8Array): string {
  const arr =
    bytes instanceof Uint8Array ? bytes : Uint8Array.from(bytes as number[]);
  let out = "";
  for (let i = 0; i < arr.length; i++) {
    const b = arr[i].toString(16).padStart(2, "0");
    out += b;
  }
  return out;
}

/**
 * Client-side TRDC summary + derived payoff math. Refetches every 10s so
 * accrued interest and days-to-due stay reasonably live.
 *
 * The math uses `Date.now() / 1000` as "now" — the on-chain program is the
 * source of truth at tx time, so a few seconds of drift is fine for display.
 */
export function useLoanSummary(trdc: string | null | undefined) {
  const { connection } = useConnection();

  const trdcPda = useMemo(() => {
    if (!trdc) return null;
    try {
      return new PublicKey(trdc);
    } catch {
      return null;
    }
  }, [trdc]);

  return useQuery<LoanSummary | null>({
    queryKey: ["loan-summary", trdcPda?.toBase58() ?? "none"],
    enabled: !!trdcPda,
    refetchInterval: 10_000,
    queryFn: async (): Promise<LoanSummary | null> => {
      if (!trdcPda) return null;
      const { trdc: trdcFacade } = await import("@vaulx/anchor-client");
      const readonlyWallet = {
        publicKey: PublicKey.default,
        signTransaction: async <T,>(tx: T) => tx,
        signAllTransactions: async <T,>(txs: T[]) => txs,
      };
      const provider = new AnchorProvider(connection, readonlyWallet, {
        commitment: "confirmed",
      });
      const program = trdcFacade.program(provider) as Program<Idl>;

      let raw: Record<string, unknown> | null = null;
      try {
        raw = (await (program.account as any).trdcState.fetch(trdcPda)) as
          | Record<string, unknown>
          | null;
      } catch (e) {
        if (
          e instanceof Error &&
          /Account does not exist|has no data|AccountNotFound/i.test(e.message)
        ) {
          return null;
        }
        throw e;
      }
      if (!raw) return null;

      // Anchor deserialises u64 as BN. Convert every BN-shaped field to bigint.
      const toBig = (v: unknown): bigint => {
        if (v == null) return 0n;
        if (typeof v === "bigint") return v;
        if (typeof v === "number") return BigInt(v);
        if (typeof v === "string") return BigInt(v);
        // BN → .toString()
        if (typeof (v as { toString?: () => string }).toString === "function") {
          return BigInt((v as { toString: () => string }).toString());
        }
        return 0n;
      };
      const toNum = (v: unknown): number => Number(toBig(v));

      const { key: statusKey, label: statusLabel } = decodeStatus(
        raw.status as Record<string, unknown> | undefined,
      );

      const appraisalAtoms = toBig(raw.appraisalValue);
      const principalAtoms = toBig(raw.loanAmount);
      const principalRemainingAtoms = toBig(raw.principalRemaining);
      const rateBps = toNum(raw.rateBps);
      const createdAt = toNum(raw.createdAt);
      const dueTs = toNum(raw.dueTs);
      const docHashHex = bytesToHex(raw.docHash as number[]);

      const nowSec = Math.floor(Date.now() / 1000);
      const secondsElapsed = Math.max(0, nowSec - createdAt);
      const daysElapsed = Math.floor(secondsElapsed / SECONDS_PER_DAY);
      const secondsRemaining = dueTs - nowSec;
      const daysRemaining = Math.ceil(secondsRemaining / SECONDS_PER_DAY);

      const accruedAtoms = computeInterestAccrued(
        principalRemainingAtoms,
        rateBps,
        daysElapsed,
      );
      const payoffAtoms = computePayoff(
        principalRemainingAtoms,
        rateBps,
        createdAt,
        nowSec,
      );
      const renewalFeeAtoms = computeRenewalFee(principalRemainingAtoms);

      const isOverdue = nowSec > dueTs && statusKey !== "repaid";
      const isTerminal =
        statusKey === "repaid" ||
        statusKey === "defaulted" ||
        statusKey === "liquidated";

      return {
        trdcPda,
        loanId: raw.loanId as PublicKey,
        assetId: (raw.assetId as PublicKey) ?? PublicKey.default,
        status: statusKey,
        statusLabel,
        appraisalAtoms,
        principalAtoms,
        principalRemainingAtoms,
        rateBps,
        createdAt,
        dueTs,
        docHashHex,
        nowSec,
        daysElapsed,
        daysRemaining,
        accruedAtoms,
        payoffAtoms,
        renewalFeeAtoms,
        isOverdue,
        isTerminal,
      };
    },
  });
}
