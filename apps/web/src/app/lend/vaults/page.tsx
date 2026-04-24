import Link from "next/link";

import { SiteFooter } from "@/components/vaulx/site-footer";
import { SiteHeader } from "@/components/vaulx/site-header";

export default function VaultsListPage() {
  const usdcMint = process.env.NEXT_PUBLIC_USDC_MINT;

  return (
    <>
      <SiteHeader />

      <main className="relative min-h-[calc(100vh-72px)]">
        <section className="border-b border-[var(--rule)]">
          <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-6 py-16 md:flex-row md:items-end md:justify-between md:px-10 md:py-20">
            <div>
              <span className="eyebrow">The Pool · Phase 1 Devnet</span>
              <h1
                className="mt-6 font-display font-extrabold leading-[1.02] tracking-[-0.025em] text-[var(--ink)]"
                style={{
                  fontSize: "clamp(2.25rem, 5vw, 4rem)",
                  fontVariationSettings: '"opsz" 144'
                }}
              >
                Vaults
              </h1>
              <p className="mt-4 max-w-[56ch] font-sans text-base leading-[1.65] text-[var(--ink-dim)]">
                A single USDC vault funds watch-backed loans. Additional asset classes are queued for Phase 2.
              </p>
            </div>
          </div>
        </section>

        <section className="py-14 md:py-20">
          <div className="mx-auto w-full max-w-[1440px] px-6 md:px-10">
            {!usdcMint ? (
              <div className="border border-dashed border-[var(--rule-strong)] bg-[var(--bg-elev-1)] p-10">
                <div className="eyebrow">No vaults yet</div>
                <p className="mt-4 max-w-[60ch] font-sans text-sm leading-[1.65] text-[var(--ink-dim)]">
                  Set{" "}
                  <code className="bg-[var(--bg)] px-1.5 py-0.5 font-mono text-xs text-[var(--brand)]">
                    NEXT_PUBLIC_USDC_MINT
                  </code>{" "}
                  in{" "}
                  <code className="bg-[var(--bg)] px-1.5 py-0.5 font-mono text-xs text-[var(--brand)]">
                    apps/web/.env.local
                  </code>{" "}
                  after running the devnet USDC seed script (
                  <code className="bg-[var(--bg)] px-1.5 py-0.5 font-mono text-xs text-[var(--brand)]">
                    scripts/dev/seed-usdc.ts
                  </code>
                  ).
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-[var(--rule)]">
                <table className="w-full font-mono text-xs">
                  <thead className="border-b border-[var(--rule)] bg-[var(--bg-elev-1)]">
                    <tr className="text-left uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                      <th className="px-6 py-4 font-medium">Vault</th>
                      <th className="px-6 py-4 font-medium text-right">APR</th>
                      <th className="px-6 py-4 font-medium text-right">Asset</th>
                      <th className="px-6 py-4 font-medium text-right">Status</th>
                      <th className="px-6 py-4 font-medium text-right"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="group border-b border-[var(--rule)] transition-colors hover:bg-[var(--bg-elev-1)]">
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-4">
                          <span
                            aria-hidden
                            className="h-10 w-px bg-transparent transition-colors group-hover:bg-[var(--brand)]"
                          />
                          <div>
                            <div className="text-base text-[var(--ink)]">USDC · Prime</div>
                            <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                              USD Coin · Devnet
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6 text-right text-[var(--ink)] tabnums">—</td>
                      <td className="px-6 py-6 text-right text-[var(--ink-dim)]">USDC</td>
                      <td className="px-6 py-6 text-right">
                        <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-[var(--signal-good)]">
                          <span
                            aria-hidden
                            className="h-1.5 w-1.5 rounded-full bg-[var(--signal-good)]"
                          />
                          Live
                        </span>
                      </td>
                      <td className="px-6 py-6 text-right">
                        <Link
                          href={`/lend/vaults/${usdcMint}`}
                          className="inline-flex items-center gap-2 border border-[var(--brand)] px-4 py-2 text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--brand)] transition-colors hover:bg-[var(--brand)] hover:text-[var(--bg)]"
                        >
                          Deposit
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3 w-3">
                            <path strokeLinecap="round" d="M5 12h14M13 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </td>
                    </tr>
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
