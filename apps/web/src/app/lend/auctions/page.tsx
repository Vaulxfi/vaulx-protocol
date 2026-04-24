"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { SiteFooter } from "@/components/vaulx/site-footer";
import { SiteHeader } from "@/components/vaulx/site-header";
import {
  shortPda,
  useAuctionList,
  type AuctionDerivedStatus,
  type AuctionListItem,
} from "@/lib/chain/auction";

const USD = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function fmtAtoms(atoms: string): string {
  const n = Number(atoms);
  if (!Number.isFinite(n)) return "—";
  return USD.format(n / 1_000_000);
}

function countdown(endTs: number, nowSec: number): string {
  const delta = endTs - nowSec;
  if (delta <= 0) return "Ended";
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

export default function AuctionsPage() {
  const query = useAuctionList();

  const auctions = useMemo<AuctionListItem[]>(
    () => query.data?.auctions ?? [],
    [query.data],
  );
  const openAuctions = useMemo(
    () => auctions.filter((a) => a.status === "OPEN"),
    [auctions],
  );
  const totalReserve = useMemo(() => {
    let sum = 0n;
    for (const a of openAuctions) {
      try {
        sum += BigInt(a.reserve_price);
      } catch {
        /* ignore */
      }
    }
    return sum;
  }, [openAuctions]);

  const [nowSec, setNowSec] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const id = window.setInterval(
      () => setNowSec(Math.floor(Date.now() / 1000)),
      1000,
    );
    return () => window.clearInterval(id);
  }, []);

  return (
    <>
      <SiteHeader />
      <main className="relative min-h-[calc(100vh-72px-64px)]">
        <section className="border-b border-[var(--rule)]">
          <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-10 px-6 py-16 md:flex-row md:items-end md:justify-between md:px-10 md:py-20">
            <div className="max-w-[62ch]">
              <span className="eyebrow">The Foreclosure Floor · Phase 1 Devnet</span>
              <h1
                className="mt-6 font-display font-extrabold leading-[1.02] tracking-[-0.025em] text-[var(--ink)]"
                style={{
                  fontSize: "clamp(2.25rem, 5vw, 4rem)",
                  fontVariationSettings: '"opsz" 144',
                }}
              >
                Auctions
              </h1>
              <p className="mt-4 font-sans text-base leading-[1.65] text-[var(--ink-dim)]">
                When a borrower defaults, the underlying watch is surrendered to
                open auction. Reserve is set to the outstanding payoff; the
                winning bid returns principal to the pool.
              </p>
            </div>

            <div className="grid w-full grid-cols-2 gap-px border border-[var(--rule)] bg-[var(--rule)] md:w-auto md:min-w-[360px]">
              <StatTile label="Open auctions" value={String(openAuctions.length)} />
              <StatTile
                label="Reserve notional"
                value={fmtAtoms(totalReserve.toString())}
                suffix="USDC"
              />
            </div>
          </div>
        </section>

        <section className="py-14 md:py-20">
          <div className="mx-auto w-full max-w-[1440px] px-6 md:px-10">
            {query.isLoading ? (
              <LoadingBlock />
            ) : auctions.length === 0 ? (
              <EmptyBlock source={query.data?.source} />
            ) : (
              <div className="overflow-x-auto border border-[var(--rule)]">
                <table className="w-full font-mono text-xs">
                  <thead className="border-b border-[var(--rule)] bg-[var(--bg-elev-1)]">
                    <tr className="text-left uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                      <th className="px-5 py-4 font-medium">Auction</th>
                      <th className="px-5 py-4 font-medium">TRDC</th>
                      <th className="px-5 py-4 font-medium text-right">Reserve</th>
                      <th className="px-5 py-4 font-medium text-right">High bid</th>
                      <th className="px-5 py-4 font-medium text-right">Time left</th>
                      <th className="px-5 py-4 font-medium text-right">Status</th>
                      <th className="px-5 py-4 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-[var(--ink-dim)]">
                    {auctions.map((a) => {
                      const hasBid = BigInt(a.high_bid) > 0n;
                      const color = STATUS_COLOR[a.status];
                      return (
                        <tr
                          key={a.auction_pda}
                          className="group relative border-b border-[var(--rule)] bg-[var(--bg)] transition-colors last:border-b-0 hover:bg-[var(--bg-elev-1)]"
                        >
                          <td className="px-5 py-5">
                            <div className="flex items-center gap-3">
                              <span
                                aria-hidden
                                className="h-6 w-px bg-transparent transition-colors group-hover:bg-[var(--brand)]"
                              />
                              <span className="text-[var(--ink)]">
                                {shortPda(a.auction_pda)}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-5 text-[var(--ink-dim)]">
                            {shortPda(a.trdc_pda)}
                          </td>
                          <td className="px-5 py-5 text-right tabnums text-[var(--ink)]">
                            {fmtAtoms(a.reserve_price)}
                          </td>
                          <td className="px-5 py-5 text-right tabnums">
                            {hasBid ? (
                              <span className="text-[var(--ink)]">
                                {fmtAtoms(a.high_bid)}
                              </span>
                            ) : (
                              <span className="text-[var(--ink-muted)]">—</span>
                            )}
                          </td>
                          <td className="px-5 py-5 text-right tabnums text-[var(--ink)]">
                            {a.status === "CLOSED"
                              ? "—"
                              : countdown(a.end_ts, nowSec)}
                          </td>
                          <td className="px-5 py-5 text-right">
                            <span
                              className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em]"
                              style={{ color }}
                            >
                              <span
                                aria-hidden
                                className="h-1.5 w-1.5 rounded-full"
                                style={{ background: color }}
                              />
                              {a.status}
                            </span>
                          </td>
                          <td className="px-5 py-5 text-right">
                            <Link
                              href={`/lend/auctions/${a.auction_pda}`}
                              className="inline-flex items-center gap-2 border border-[var(--brand)] px-3 py-2 text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--brand)] transition-colors hover:bg-[var(--brand)] hover:text-[var(--bg)]"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function StatTile({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string;
  suffix?: string;
}) {
  return (
    <div className="bg-[var(--bg-elev-1)] p-5">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
        {label}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="font-mono text-3xl tracking-[-0.02em] tabnums text-[var(--ink)]">
          {value}
        </span>
        {suffix && (
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function LoadingBlock() {
  return (
    <div className="border border-[var(--rule)] bg-[var(--bg-elev-1)] p-10 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
      Loading auctions…
    </div>
  );
}

function EmptyBlock({ source }: { source: string | undefined }) {
  return (
    <div className="border border-dashed border-[var(--rule-strong)] bg-[var(--bg-elev-1)] p-10">
      <div className="eyebrow">No defaulted loans yet</div>
      <p className="mt-4 max-w-[60ch] font-sans text-sm leading-[1.65] text-[var(--ink-dim)]">
        The foreclosure floor is quiet. Every TRDC currently outstanding is
        either performing or inside its grace window. When a default matures,
        the collateral will surface here for open bidding.
      </p>
      {source === "supabase_not_configured" && (
        <p className="mt-4 max-w-[60ch] font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
          Indexer not configured · set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
        </p>
      )}
    </div>
  );
}
