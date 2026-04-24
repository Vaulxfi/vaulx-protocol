"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { shortPda, type AuctionDerivedStatus } from "@/lib/chain/auction";

const USD = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function fmtAtoms(atoms: string | bigint): string {
  const big = typeof atoms === "bigint" ? atoms : BigInt(atoms);
  return USD.format(Number(big) / 1_000_000);
}

function countdown(endTs: number, nowSec: number): string {
  const delta = endTs - nowSec;
  if (delta <= 0) return "— Ended —";
  const h = Math.floor(delta / 3600)
    .toString()
    .padStart(2, "0");
  const m = Math.floor((delta % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const s = (delta % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

const STATUS_STYLES: Record<
  AuctionDerivedStatus,
  { label: string; color: string; border: string }
> = {
  OPEN: {
    label: "OPEN",
    color: "var(--brand)",
    border: "var(--brand)",
  },
  ENDED: {
    label: "ENDED",
    color: "var(--signal-bad)",
    border: "var(--signal-bad)",
  },
  CLOSED: {
    label: "CLOSED",
    color: "var(--ink-muted)",
    border: "var(--rule-strong)",
  },
};

export interface AuctionCardProps {
  auctionPda: string;
  trdcPda: string;
  reservePrice: string | bigint;
  highBid: string | bigint;
  endTs: number;
  status: AuctionDerivedStatus;
}

export function AuctionCard({
  auctionPda,
  trdcPda,
  reservePrice,
  highBid,
  endTs,
  status,
}: AuctionCardProps) {
  const [nowSec, setNowSec] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const id = window.setInterval(
      () => setNowSec(Math.floor(Date.now() / 1000)),
      1000,
    );
    return () => window.clearInterval(id);
  }, []);

  const hasBid = (typeof highBid === "bigint" ? highBid : BigInt(highBid)) > 0n;
  const styles = STATUS_STYLES[status];

  return (
    <article className="group relative flex flex-col gap-5 border border-[var(--rule)] bg-[var(--bg-elev-1)] p-6 transition-colors duration-300 ease-decisive hover:border-[var(--rule-strong)]">
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-[var(--brand)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />
      <header className="flex items-baseline justify-between gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--ink-muted)]">
          Auction · {shortPda(auctionPda)}
        </span>
        <span
          className="inline-flex items-center border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em]"
          style={{ color: styles.color, borderColor: styles.border }}
        >
          {styles.label}
        </span>
      </header>

      <h3 className="font-display text-xl font-semibold leading-tight tracking-[-0.01em] text-[var(--ink)]">
        TRDC {shortPda(trdcPda)}
      </h3>

      <dl className="grid grid-cols-2 gap-5 font-mono text-xs">
        <div>
          <dt className="text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
            Reserve
          </dt>
          <dd className="mt-1 tabnums text-[var(--ink)]">
            {fmtAtoms(reservePrice)}{" "}
            <span className="text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
              USDC
            </span>
          </dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
            High bid
          </dt>
          <dd className="mt-1 tabnums text-[var(--ink)]">
            {hasBid ? (
              <>
                {fmtAtoms(highBid)}{" "}
                <span className="text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                  USDC
                </span>
              </>
            ) : (
              <span className="text-[var(--ink-muted)]">— No bids yet —</span>
            )}
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
            Time remaining
          </dt>
          <dd className="mt-1 tabnums text-[var(--ink)]">
            {status === "CLOSED" ? "— Closed —" : countdown(endTs, nowSec)}
          </dd>
        </div>
      </dl>

      <div className="mt-2 flex items-center justify-end">
        <Link
          href={`/lend/auctions/${auctionPda}`}
          className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--brand)] hover:underline"
        >
          View
          <span aria-hidden>→</span>
        </Link>
      </div>
    </article>
  );
}
