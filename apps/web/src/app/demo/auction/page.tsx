// Foreclosure floor — desktop-only operator view of currently-defaulted TRDCs.
// Always at least 3 mock auctions running so the page never reads as empty.
import Link from "next/link";
import { DemoShell } from "../_components/demo-shell";
import { AUCTION_FLOOR } from "../_fixtures/auction-floor";

const USD_FMT = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const fmt = (n: number) => USD_FMT.format(n);

function timeLeftLabel(endTs: number): string {
  const remaining = endTs - Date.now();
  if (remaining <= 0) return "Closed";
  const h = Math.floor(remaining / (3600 * 1000));
  if (h >= 24) {
    const d = Math.floor(h / 24);
    return `${d}d ${h % 24}h`;
  }
  return `${h}h`;
}

function reserveNotional(): number {
  return AUCTION_FLOOR.reduce((sum, a) => sum + a.reserve, 0);
}

function avgTier(): string {
  const sum = AUCTION_FLOOR.reduce((s, a) => s + a.tier, 0);
  return (sum / AUCTION_FLOOR.length).toFixed(1);
}

export default function AuctionFloorPage() {
  return (
    <DemoShell formFactor="desktop">
      <header className="border-b border-[var(--rule)] pb-12">
        <div className="flex items-center gap-3">
          <span className="h-px w-10 bg-[var(--brand)]" />
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--ink-muted)]">
            VAULX · FORECLOSURE FLOOR
          </span>
        </div>
        <h1
          className="mt-8 font-display font-extrabold leading-[1.04] tracking-[-0.02em] text-[var(--ink)]"
          style={{
            fontSize: "clamp(2.25rem, 5.5vw, 4.25rem)",
            fontVariationSettings: '"opsz" 144',
          }}
        >
          The auction is the{" "}
          <em className="not-italic italic font-normal text-[var(--brand)]">
            moat.
          </em>
        </h1>
        <p className="mt-8 max-w-[68ch] font-sans text-base leading-[1.65] text-[var(--ink-dim)] md:text-[17px]">
          Every defaulted TRDC walks the same waterfall — Vaulx lenders get a
          72-hour privileged window, then a curated reseller network bids for
          48, then the public auction runs for 168. Three sealed gates with
          falling reserves, written into the Anchor program. The platform
          recovers principal at par before retail panic ever touches the
          asset, which is what makes lender APY underwriteable in the first
          place. Replicating this requires custody licensing, a dealer
          network, and an audited program — an 18-to-24-month moat.
        </p>
      </header>

      {/* Stat strip */}
      <section className="mt-12 grid grid-cols-1 gap-px border border-[var(--rule)] bg-[var(--rule)] md:grid-cols-3">
        <Stat
          eyebrow="Open auctions"
          value={String(AUCTION_FLOOR.length)}
          unit="LIVE"
        />
        <Stat
          eyebrow="Reserve notional"
          value={`$${fmt(reserveNotional())}`}
        />
        <Stat eyebrow="Avg tier" value={avgTier()} />
      </section>

      {/* Auction table */}
      <section className="mt-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <span className="eyebrow">Active foreclosures</span>
            <h2 className="mt-3 font-display text-[clamp(1.5rem,2.6vw,2.25rem)] font-bold leading-[1.1] tracking-[-0.015em] text-[var(--ink)]">
              Walk a TRDC.
            </h2>
          </div>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--ink-muted)] md:inline-block">
            Sort · Tier → Time left
          </span>
        </div>

        <div className="mt-8 overflow-x-auto border border-[var(--rule)]">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[var(--rule)] bg-[var(--bg-elev-1)]">
                <Th>TRDC</Th>
                <Th>Asset</Th>
                <Th align="right">Appraisal</Th>
                <Th align="right">Outstanding</Th>
                <Th align="center">Tier</Th>
                <Th align="right">High bid</Th>
                <Th align="right">Time left</Th>
                <Th align="right">Action</Th>
              </tr>
            </thead>
            <tbody>
              {AUCTION_FLOOR.map((a) => (
                <tr
                  key={a.trdc}
                  className="group border-b border-[var(--rule)] transition-colors last:border-b-0 hover:bg-[var(--bg-elev-1)]"
                >
                  <Td>
                    <span
                      aria-hidden
                      className="absolute left-0 top-1/2 hidden h-6 w-px -translate-y-1/2 bg-transparent group-hover:bg-[var(--brand)] md:block"
                    />
                    <Link
                      href={`/demo/auction/${a.trdc}`}
                      className="font-mono text-sm tracking-wider text-[var(--ink)] hover:text-[var(--brand)]"
                    >
                      {a.trdc}
                    </Link>
                  </Td>
                  <Td>
                    <Link
                      href={`/demo/auction/${a.trdc}`}
                      className="text-sm text-[var(--ink-dim)] hover:text-[var(--ink)]"
                    >
                      {a.watch}
                    </Link>
                  </Td>
                  <TdNum>{`$${fmt(a.appraisal)}`}</TdNum>
                  <TdNum>{`$${fmt(a.outstanding)}`}</TdNum>
                  <Td align="center">
                    <span className="inline-flex items-center justify-center rounded-full border border-[var(--brand)]/40 bg-[var(--brand)]/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--brand)]">
                      Tier {a.tier}
                    </span>
                  </Td>
                  <TdNum>
                    {a.highBid > 0 ? `$${fmt(a.highBid)}` : "—"}
                  </TdNum>
                  <TdNum>{timeLeftLabel(a.endTs)}</TdNum>
                  <Td align="right">
                    <Link
                      href={`/demo/auction/${a.trdc}`}
                      className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--brand)]"
                    >
                      Open
                      <span aria-hidden>→</span>
                    </Link>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </DemoShell>
  );
}

function Stat({
  eyebrow,
  value,
  unit,
}: {
  eyebrow: string;
  value: string;
  unit?: string;
}) {
  return (
    <div className="bg-[var(--bg)] p-6">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
        {eyebrow}
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <span
          className="font-mono text-3xl tracking-[-0.02em] text-[var(--ink)]"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {value}
        </span>
        {unit && (
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

function Th({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right" | "center";
}) {
  return (
    <th
      className={`px-4 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)] text-${align}`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right" | "center";
}) {
  return (
    <td className={`relative px-4 py-3 align-middle text-${align}`}>
      {children}
    </td>
  );
}

function TdNum({ children }: { children: React.ReactNode }) {
  return (
    <td
      className="px-4 py-3 text-right align-middle font-mono text-sm text-[var(--ink-dim)]"
      style={{ fontVariantNumeric: "tabular-nums" }}
    >
      {children}
    </td>
  );
}
