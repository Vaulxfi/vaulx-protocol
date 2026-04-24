"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";

import { SiteFooter } from "@/components/vaulx/site-footer";
import { SiteHeader } from "@/components/vaulx/site-header";
import {
  shortPda,
  useAuction,
  useAuctionBids,
  useCloseAuction,
  usePlaceBid,
  useUsdcBalance,
  type AuctionAccount,
  type AuctionDerivedStatus,
  type BidEvent,
} from "@/lib/chain/auction";

const USD = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function fmtAtoms(atoms: bigint | string): string {
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

const STATUS_COLOR: Record<AuctionDerivedStatus, string> = {
  OPEN: "var(--brand)",
  ENDED: "var(--signal-bad)",
  CLOSED: "var(--ink-muted)",
};

export default function AuctionDetailPage() {
  const params = useParams<{ id: string }>();
  const auctionPdaStr = params?.id ?? "";

  let valid = true;
  try {
    new PublicKey(auctionPdaStr);
  } catch {
    valid = false;
  }

  if (!valid) {
    return (
      <>
        <SiteHeader />
        <main className="min-h-[calc(100vh-72px)]">
          <div className="mx-auto max-w-[1440px] px-6 py-24 md:px-10">
            <div className="border border-[var(--signal-bad)] bg-[var(--bg-elev-1)] p-10">
              <div className="eyebrow" style={{ color: "var(--signal-bad)" }}>
                Invalid auction
              </div>
              <p className="mt-4 font-sans text-sm text-[var(--ink-dim)]">
                <code className="bg-[var(--bg)] px-1.5 py-0.5 font-mono text-xs text-[var(--brand)]">
                  {auctionPdaStr}
                </code>{" "}
                is not a valid pubkey.
              </p>
              <Link href="/lend/auctions" className="btn-ghost mt-6">
                Back to auctions
              </Link>
            </div>
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <AuctionDetailContent auctionPdaStr={auctionPdaStr} />
      <SiteFooter />
    </>
  );
}

function AuctionDetailContent({ auctionPdaStr }: { auctionPdaStr: string }) {
  const auctionQuery = useAuction(auctionPdaStr);
  const bidsQuery = useAuctionBids(auctionPdaStr);
  const account = auctionQuery.data ?? null;

  const [nowSec, setNowSec] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const id = window.setInterval(
      () => setNowSec(Math.floor(Date.now() / 1000)),
      1000,
    );
    return () => window.clearInterval(id);
  }, []);

  return (
    <main className="relative min-h-[calc(100vh-72px-64px)]">
      <div className="mx-auto w-full max-w-[1440px] px-6 py-14 md:px-10 md:py-20">
        <div className="flex items-center gap-3">
          <Link
            href="/lend/auctions"
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ink-muted)] hover:text-[var(--ink)]"
          >
            ← All auctions
          </Link>
        </div>

        <header className="mt-8 flex flex-col gap-4">
          <span className="eyebrow">
            Auction · {shortPda(auctionPdaStr, 6)}
          </span>
          <h1
            className="font-display font-extrabold leading-[1.02] tracking-[-0.025em] text-[var(--ink)]"
            style={{
              fontSize: "clamp(2rem, 4.2vw, 3.5rem)",
              fontVariationSettings: '"opsz" 144',
            }}
          >
            TRDC {account ? shortPda(account.trdcState) : "—"}
          </h1>
          {account && (
            <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
              <span
                className="inline-flex items-center border px-2 py-0.5"
                style={{
                  color: STATUS_COLOR[account.derivedStatus],
                  borderColor: STATUS_COLOR[account.derivedStatus],
                }}
              >
                {account.derivedStatus}
              </span>
              <span>Asset mint · {shortPda(account.assetMint, 6)}</span>
              <span>
                Ends{" "}
                <span className="tabnums text-[var(--ink)]">
                  {countdown(account.endTs, nowSec)}
                </span>
              </span>
            </div>
          )}
        </header>

        {!account ? (
          <div className="mt-14 border border-[var(--rule)] bg-[var(--bg-elev-1)] p-10 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
            {auctionQuery.isLoading ? "Loading auction…" : "Auction not found"}
          </div>
        ) : (
          <div className="mt-14 grid gap-8 md:grid-cols-12 md:gap-8">
            {/* LEFT */}
            <div className="md:col-span-7">
              <StatusPanel account={account} nowSec={nowSec} />
              <div className="mt-10">
                <BidHistory bids={bidsQuery.data?.bids ?? []} loading={bidsQuery.isLoading} />
              </div>
              {account.derivedStatus === "ENDED" && account.status === "open" && (
                <div className="mt-10">
                  <CloseAuctionCard account={account} />
                </div>
              )}
            </div>

            {/* RIGHT */}
            <aside className="md:col-span-5">
              <BidForm account={account} />
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}

function StatusPanel({
  account,
  nowSec,
}: {
  account: AuctionAccount;
  nowSec: number;
}) {
  const hasBid = account.highBid > 0n;
  return (
    <div className="grid grid-cols-2 gap-px border border-[var(--rule)] bg-[var(--rule)]">
      <Cell label="Reserve price" value={fmtAtoms(account.reservePrice)} suffix="USDC" />
      <Cell
        label="High bid"
        value={hasBid ? fmtAtoms(account.highBid) : "—"}
        suffix={hasBid ? "USDC" : undefined}
        highlight={hasBid}
      />
      <Cell
        label="Min increment"
        value={fmtAtoms(account.minIncrement)}
        suffix="USDC"
      />
      <Cell
        label="Time remaining"
        value={
          account.derivedStatus === "CLOSED"
            ? "— Closed —"
            : countdown(account.endTs, nowSec)
        }
      />
    </div>
  );
}

function Cell({
  label,
  value,
  suffix,
  highlight = false,
}: {
  label: string;
  value: string;
  suffix?: string;
  highlight?: boolean;
}) {
  return (
    <div className="bg-[var(--bg-elev-1)] p-5">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
        {label}
      </div>
      <div
        className="mt-3 flex items-baseline gap-2 font-mono text-xl tabnums"
        style={{ color: highlight ? "var(--brand)" : "var(--ink)" }}
      >
        <span>{value}</span>
        {suffix && (
          <span className="text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function BidHistory({
  bids,
  loading,
}: {
  bids: BidEvent[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="border border-[var(--rule)] bg-[var(--bg-elev-1)] p-10 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
        Loading bids…
      </div>
    );
  }
  if (bids.length === 0) {
    return (
      <div className="border border-dashed border-[var(--rule-strong)] bg-[var(--bg-elev-1)] p-10">
        <div className="eyebrow">Be the first to bid</div>
        <p className="mt-4 max-w-[60ch] font-sans text-sm leading-[1.65] text-[var(--ink-dim)]">
          No bids have been placed yet. Place a bid at or above the reserve
          price — if unchallenged, the lock on the collateral passes to you at
          auction close.
        </p>
      </div>
    );
  }
  return (
    <>
      <span className="eyebrow">Bid history · latest 20</span>
      <div className="mt-4 overflow-x-auto border border-[var(--rule)]">
        <table className="w-full font-mono text-xs">
          <thead className="border-b border-[var(--rule)] bg-[var(--bg-elev-1)]">
            <tr className="text-left uppercase tracking-[0.14em] text-[var(--ink-muted)]">
              <th className="px-5 py-4 font-medium">Time</th>
              <th className="px-5 py-4 font-medium">Bidder</th>
              <th className="px-5 py-4 font-medium text-right">Amount</th>
              <th className="px-5 py-4 font-medium text-right">Delta</th>
            </tr>
          </thead>
          <tbody className="text-[var(--ink-dim)]">
            {bids.map((b) => {
              const prev = BigInt(b.high_bid_previous || "0");
              const cur = BigInt(b.amount || "0");
              const delta = prev > 0n ? cur - prev : 0n;
              const when = b.ts
                ? new Date(b.ts * 1000).toLocaleTimeString()
                : new Date(b.created_at).toLocaleTimeString();
              return (
                <tr
                  key={b.signature || `${b.slot}-${b.bidder}`}
                  className="border-b border-[var(--rule)] last:border-b-0"
                >
                  <td className="px-5 py-4 text-[var(--ink-dim)]">{when}</td>
                  <td className="px-5 py-4 text-[var(--ink-dim)]">
                    {shortPda(b.bidder)}
                  </td>
                  <td className="px-5 py-4 text-right tabnums text-[var(--ink)]">
                    {fmtAtoms(b.amount)}
                  </td>
                  <td className="px-5 py-4 text-right tabnums text-[var(--ink-muted)]">
                    {delta > 0n ? `+${fmtAtoms(delta.toString())}` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

const BidSchema = z.object({
  amount: z
    .string()
    .min(1, "Enter an amount")
    .refine(
      (v) => !Number.isNaN(Number(v)) && Number(v) > 0,
      "Must be > 0",
    ),
});
type BidFormValues = z.infer<typeof BidSchema>;

function BidForm({ account }: { account: AuctionAccount }) {
  const { publicKey } = useWallet();
  const balanceQuery = useUsdcBalance(account.assetMint);
  const mutation = usePlaceBid();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<BidFormValues>({
    resolver: zodResolver(BidSchema),
    defaultValues: { amount: "" },
  });

  const amountStr = watch("amount");
  const amountAtoms = useMemo(() => {
    const n = Number(amountStr);
    if (!Number.isFinite(n) || n <= 0) return 0n;
    return BigInt(Math.round(n * 1_000_000));
  }, [amountStr]);

  const minBidAtoms = useMemo(() => {
    if (account.highBid === 0n) return account.reservePrice;
    return account.highBid + account.minIncrement;
  }, [account.highBid, account.minIncrement, account.reservePrice]);

  const balanceAtoms = balanceQuery.data ?? 0n;

  const canBid = account.derivedStatus === "OPEN";

  const tooLow = amountAtoms > 0n && amountAtoms < minBidAtoms;
  const overBalance = amountAtoms > balanceAtoms;

  async function onSubmit(v: BidFormValues) {
    if (!publicKey) {
      toast.error("Connect your wallet first");
      return;
    }
    const atoms = BigInt(Math.round(Number(v.amount) * 1_000_000));
    if (atoms < minBidAtoms) {
      toast.error(`Minimum bid is ${fmtAtoms(minBidAtoms)} USDC`);
      return;
    }
    if (atoms > balanceAtoms) {
      toast.error("Insufficient USDC balance");
      return;
    }
    try {
      await mutation.mutateAsync({
        auctionPda: account.auctionPda,
        assetMint: account.assetMint,
        highBidder: account.highBidder,
        amount: atoms,
      });
      toast.success(`Bid placed · ${fmtAtoms(atoms)} USDC`);
      reset({ amount: "" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div className="border border-[var(--rule)] bg-[var(--bg-elev-1)] p-6 md:p-8">
      <span className="eyebrow">Place your bid</span>
      <h2 className="mt-4 font-display text-2xl font-semibold leading-[1.15] tracking-[-0.01em] text-[var(--ink)]">
        Bid on this asset
      </h2>
      <p className="mt-3 font-sans text-sm leading-[1.6] text-[var(--ink-dim)]">
        First bid must meet the reserve. Subsequent bids must exceed the
        current high by the minimum increment.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-6">
        <div>
          <label className="mb-3 block font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
            Amount · USDC
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            {...register("amount")}
            className="h-14 w-full border border-[var(--rule-strong)] bg-[var(--bg)] px-4 font-mono text-2xl text-[var(--ink)] tabnums focus:border-[var(--brand)] focus:outline-none"
            placeholder="0.00"
            disabled={!canBid}
          />
          {errors.amount && (
            <p className="mt-2 font-mono text-xs text-[var(--signal-bad)]">
              {errors.amount.message}
            </p>
          )}
          {tooLow && (
            <p className="mt-2 font-mono text-xs text-[var(--signal-bad)]">
              Below minimum bid of {fmtAtoms(minBidAtoms)} USDC.
            </p>
          )}
          {overBalance && (
            <p className="mt-2 font-mono text-xs text-[var(--signal-bad)]">
              Exceeds wallet balance ({fmtAtoms(balanceAtoms)} USDC).
            </p>
          )}
        </div>

        <dl className="flex flex-col gap-2 font-mono text-xs">
          <Row label="Minimum bid" value={`${fmtAtoms(minBidAtoms)} USDC`} />
          <Row
            label="Wallet balance"
            value={publicKey ? `${fmtAtoms(balanceAtoms)} USDC` : "—"}
          />
        </dl>

        {!canBid && (
          <div className="border border-[var(--signal-warn)] bg-[var(--bg)] p-3 font-mono text-xs text-[var(--signal-warn)]">
            {account.derivedStatus === "ENDED"
              ? "Auction has ended. Bidding is closed — anyone can call close_auction."
              : "Auction is closed. Bidding is no longer permitted."}
          </div>
        )}

        <button
          type="submit"
          disabled={
            !canBid ||
            !publicKey ||
            amountAtoms <= 0n ||
            tooLow ||
            overBalance ||
            mutation.isPending
          }
          className="btn-gold w-full justify-center disabled:cursor-not-allowed disabled:opacity-40"
        >
          {mutation.isPending
            ? "Signing…"
            : amountAtoms > 0n
              ? `Bid ${fmtAtoms(amountAtoms)} USDC`
              : "Enter bid"}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            className="h-4 w-4"
          >
            <path strokeLinecap="round" d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </button>
      </form>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className="uppercase tracking-[0.14em] text-[var(--ink-muted)]">
        {label}
      </dt>
      <dd className="tabnums text-[var(--ink)]">{value}</dd>
    </div>
  );
}

function CloseAuctionCard({ account }: { account: AuctionAccount }) {
  const mutation = useCloseAuction();
  const { publicKey } = useWallet();

  async function onClose() {
    if (!publicKey) {
      toast.error("Connect your wallet first");
      return;
    }
    try {
      await mutation.mutateAsync({
        auctionPda: account.auctionPda,
        trdcState: account.trdcState,
        assetMint: account.assetMint,
        vault: account.vault,
      });
      toast.success("Auction closed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div className="border border-[var(--rule)] bg-[var(--bg-elev-1)] p-6 md:p-8">
      <span className="eyebrow">Settlement</span>
      <h3 className="mt-3 font-display text-xl font-semibold leading-[1.2] tracking-[-0.01em] text-[var(--ink)]">
        Close this auction
      </h3>
      <p className="mt-3 font-sans text-sm leading-[1.6] text-[var(--ink-dim)]">
        The auction window has elapsed. Closing is permissionless — any wallet
        may trigger final settlement, returning the winning bid to the vault.
      </p>
      <button
        type="button"
        onClick={onClose}
        disabled={mutation.isPending || !publicKey}
        className="btn-gold mt-6 justify-center disabled:cursor-not-allowed disabled:opacity-40"
      >
        {mutation.isPending ? "Signing…" : "Close auction"}
      </button>
    </div>
  );
}
