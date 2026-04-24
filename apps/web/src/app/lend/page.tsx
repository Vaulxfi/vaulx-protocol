import Link from "next/link";

import { MetricCard } from "@/components/vaulx/metric-card";
import { OnchainTicker } from "@/components/vaulx/onchain-ticker";
import { SiteFooter } from "@/components/vaulx/site-footer";
import { SiteHeader } from "@/components/vaulx/site-header";

const VAULT_ROWS = [
  {
    name: "USDC · Prime",
    asset: "USDC",
    tvl: "1,284,500",
    shares: "1,240,118",
    flow30d: "+184,500",
    entry: "1 USDC",
    status: "live" as const
  },
  {
    name: "USDC · Shadow",
    asset: "USDC",
    tvl: "—",
    shares: "—",
    flow30d: "—",
    entry: "Q3 2026",
    status: "soon" as const
  }
] as const;

export default function LendLandingPage() {
  const usdcMint = process.env.NEXT_PUBLIC_USDC_MINT;
  const primaryHref = usdcMint ? `/lend/vaults/${usdcMint}` : "/lend/vaults";

  return (
    <>
      <SiteHeader />

      <main className="relative">
        {/* ============================================================
         * INTRO STRIP
         * ============================================================ */}
        <section className="border-b border-[var(--rule)]">
          <div className="mx-auto grid w-full max-w-[1440px] gap-10 px-6 py-20 md:grid-cols-12 md:gap-8 md:px-10 md:py-28">
            <div className="md:col-span-8">
              <div className="flex items-center gap-3">
                <span className="h-px w-10 bg-[var(--brand)]" />
                <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--ink-muted)]">
                  The Operator Desk · Phase 1 Devnet
                </span>
              </div>
              <h1
                className="mt-8 font-display font-extrabold leading-[1.02] tracking-[-0.025em] text-[var(--ink)]"
                style={{
                  fontSize: "clamp(2.5rem, 6.5vw, 5.25rem)",
                  fontVariationSettings: '"opsz" 144'
                }}
              >
                Supply USDC. Earn
                <br />
                <em className="not-italic italic font-normal text-[var(--brand)]">watch-backed</em>{" "}
                yield.
              </h1>
              <p className="mt-8 max-w-[58ch] font-sans text-base leading-[1.65] text-[var(--ink-dim)] md:text-[17px]">
                A single overcollateralized USDC pool funds every TRDC Vaulx originates. Principal protected by physical collateral in regulated custody. Enforcement anchored in Brazilian law.
              </p>
            </div>

            <aside className="md:col-span-4">
              <div className="h-full border border-[var(--rule)] bg-[var(--bg-elev-1)] p-6">
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--ink-muted)]">
                  Your position
                </div>
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="font-mono text-4xl tracking-[-0.02em] text-[var(--ink)] tabnums">
                    0.00
                  </span>
                  <span className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                    USDC
                  </span>
                </div>
                <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                  Connect wallet to see shares
                </p>

                <div className="mt-8 flex flex-col gap-3">
                  <Link href={primaryHref} className="btn-gold">
                    <span>Deposit USDC</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
                      <path strokeLinecap="round" d="M5 12h14M13 5l7 7-7 7" />
                    </svg>
                  </Link>
                  <Link href="/lend/vaults" className="btn-ghost">
                    <span>Browse vaults</span>
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </section>

        {/* Ticker */}
        <OnchainTicker dense />

        {/* ============================================================
         * DASHBOARD GRID
         * ============================================================ */}
        <section className="py-20 md:py-28">
          <div className="mx-auto grid w-full max-w-[1440px] gap-10 px-6 md:grid-cols-12 md:gap-8 md:px-10">
            {/* LEFT — tables + portfolio metrics */}
            <div className="md:col-span-8">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <span className="eyebrow">Vaults · Live</span>
                  <h2 className="mt-3 font-display text-[clamp(1.5rem,2.8vw,2.5rem)] font-bold leading-[1.1] tracking-[-0.015em] text-[var(--ink)]">
                    The pool.
                  </h2>
                </div>
                <span className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--ink-muted)] md:inline-block">
                  Sort · TVL ↓
                </span>
              </div>

              <div className="mt-8 overflow-x-auto border border-[var(--rule)]">
                <table className="w-full font-mono text-xs">
                  <thead className="border-b border-[var(--rule)] bg-[var(--bg-elev-1)]">
                    <tr className="text-left uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                      <th className="px-5 py-4 font-medium">Asset</th>
                      <th className="px-5 py-4 font-medium text-right">TVL</th>
                      <th className="px-5 py-4 font-medium text-right">Shares</th>
                      <th className="hidden px-5 py-4 font-medium text-right md:table-cell">
                        30d flow
                      </th>
                      <th className="hidden px-5 py-4 font-medium text-right md:table-cell">
                        Entry
                      </th>
                      <th className="px-5 py-4 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-[var(--ink-dim)]">
                    {VAULT_ROWS.map((row) => (
                      <tr
                        key={row.name}
                        className="group relative border-b border-[var(--rule)] bg-[var(--bg)] transition-colors last:border-b-0 hover:bg-[var(--bg-elev-1)]"
                      >
                        <td className="px-5 py-5">
                          <div className="flex items-center gap-3">
                            <span
                              aria-hidden
                              className="h-6 w-px bg-transparent transition-colors group-hover:bg-[var(--brand)]"
                            />
                            <div>
                              <div className="text-sm text-[var(--ink)]">{row.name}</div>
                              <div className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                                {row.asset} ·{" "}
                                {row.status === "live" ? "Devnet" : "Not yet live"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-5 text-right text-[var(--ink)] tabnums">
                          {row.tvl}
                        </td>
                        <td className="px-5 py-5 text-right tabnums">{row.shares}</td>
                        <td className="hidden px-5 py-5 text-right tabnums md:table-cell">
                          <span
                            style={{
                              color:
                                row.flow30d.startsWith("+")
                                  ? "var(--signal-good)"
                                  : "var(--ink-muted)"
                            }}
                          >
                            {row.flow30d}
                          </span>
                        </td>
                        <td className="hidden px-5 py-5 text-right text-[var(--ink-muted)] md:table-cell">
                          {row.entry}
                        </td>
                        <td className="px-5 py-5 text-right">
                          {row.status === "live" && usdcMint ? (
                            <Link
                              href={`/lend/vaults/${usdcMint}`}
                              className="inline-flex items-center gap-2 border border-[var(--brand)] px-3 py-2 text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--brand)] transition-colors hover:bg-[var(--brand)] hover:text-[var(--bg)]"
                            >
                              Deposit
                            </Link>
                          ) : (
                            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                              Queued
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Below the table: dense portfolio metrics row */}
              <div className="mt-10 grid gap-px border border-[var(--rule)] bg-[var(--rule)] sm:grid-cols-3">
                <MetricCard eyebrow="Pool TVL" value="1.28M" unit="USDC" />
                <MetricCard eyebrow="Active TRDCs" value="37" />
                <MetricCard
                  eyebrow="Avg spread"
                  value="9.8"
                  unit="% APR"
                  variant="positive"
                />
              </div>
            </div>

            {/* RIGHT — context column */}
            <aside className="md:col-span-4">
              <div className="flex flex-col gap-10">
                <div>
                  <span className="eyebrow">Portfolio</span>
                  <div className="mt-6 border border-[var(--rule)] bg-[var(--bg-elev-1)] p-6">
                    <dl className="flex flex-col gap-4 font-mono text-xs">
                      <Row label="USDC supplied" value="—" />
                      <Row label="Vault shares" value="—" />
                      <Row label="Est. APR" value="—" />
                      <Row label="Accrued" value="—" />
                    </dl>
                    <div className="mt-6 h-px bg-[var(--rule)]" />
                    <Link
                      href={primaryHref}
                      className="btn-gold-outline mt-6 w-full justify-center"
                    >
                      Deposit
                    </Link>
                  </div>
                </div>

                <div>
                  <span className="eyebrow">Recent settlements</span>
                  <ul className="mt-6 flex flex-col gap-0 border border-[var(--rule)]">
                    {[
                      { k: "TRDC #7A2F", v: "42,000 USDC", t: "-00:05" },
                      { k: "TRDC #A13C", v: "67,000 USDC", t: "-00:14" },
                      { k: "TRDC #D4F8", v: "85,000 USDC", t: "-00:26" }
                    ].map((it) => (
                      <li
                        key={it.k}
                        className="flex items-baseline justify-between gap-4 border-b border-[var(--rule)] px-5 py-4 font-mono text-xs last:border-b-0"
                      >
                        <span className="text-[var(--ink-dim)]">{it.k}</span>
                        <span className="tabnums text-[var(--ink)]">{it.v}</span>
                        <span className="text-[var(--ink-muted)] tabnums">{it.t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className="uppercase tracking-[0.14em] text-[var(--ink-muted)]">{label}</dt>
      <dd className="tabnums text-[var(--ink)]">{value}</dd>
    </div>
  );
}
