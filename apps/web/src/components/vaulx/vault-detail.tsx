"use client";

import { useMemo } from "react";
import Link from "next/link";
import { PublicKey } from "@solana/web3.js";

import {
  useUserShareBalance,
  useUserUsdcBalance,
  useVaultData,
} from "@/lib/chain/vault";
import { DepositForm } from "@/components/vaulx/deposit-form";
import { SiteFooter } from "@/components/vaulx/site-footer";
import { SiteHeader } from "@/components/vaulx/site-header";

const USDC_DECIMALS = 6;

function formatAtoms(amount: bigint | undefined, decimals = USDC_DECIMALS): string {
  if (amount === undefined) return "—";
  const base = 10n ** BigInt(decimals);
  const whole = amount / base;
  const frac = amount % base;
  const fracStr = frac.toString().padStart(decimals, "0").replace(/0+$/, "");
  return fracStr ? `${whole.toString()}.${fracStr}` : whole.toString();
}

export function VaultDetail({ assetMintBase58 }: { assetMintBase58: string }) {
  const assetMint = useMemo(() => new PublicKey(assetMintBase58), [assetMintBase58]);

  const vault = useVaultData(assetMint);
  const shareMint = vault.data?.shareMint;
  const usdc = useUserUsdcBalance(assetMint);
  const shares = useUserShareBalance(shareMint);

  const totalAssets = vault.data
    ? BigInt(vault.data.totalAssets.toString())
    : undefined;
  const totalShares = vault.data
    ? BigInt(vault.data.totalShares.toString())
    : undefined;

  return (
    <>
      <SiteHeader />

      <main className="relative">
        {/* Intro strip */}
        <section className="border-b border-[var(--rule)]">
          <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-4 px-6 py-12 md:px-10 md:py-16">
            <Link
              href="/lend/vaults"
              className="inline-flex w-fit items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ink-muted)] transition-colors hover:text-[var(--ink)]"
            >
              <span aria-hidden>←</span> Back to vaults
            </Link>
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <span className="eyebrow">Vault · USDC Prime</span>
                <h1
                  className="mt-5 font-display font-extrabold leading-[1.02] tracking-[-0.025em] text-[var(--ink)]"
                  style={{
                    fontSize: "clamp(2.25rem, 5vw, 4rem)",
                    fontVariationSettings: '"opsz" 144'
                  }}
                >
                  USDC Vault
                </h1>
                <p className="mt-3 break-all font-mono text-xs text-[var(--ink-muted)]">
                  {assetMintBase58}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-14 md:py-20">
          <div className="mx-auto w-full max-w-[1440px] px-6 md:px-10">
            {vault.isLoading ? (
              <Panel>
                <div className="eyebrow">Loading</div>
                <p className="mt-4 font-sans text-sm text-[var(--ink-dim)]">
                  Reading vault state from chain…
                </p>
              </Panel>
            ) : vault.data === null ? (
              <Panel>
                <div className="eyebrow">Vault not initialised</div>
                <p className="mt-4 max-w-[58ch] font-sans text-sm leading-[1.65] text-[var(--ink-dim)]">
                  No vault account exists for this asset mint on the current cluster yet. Run the on-chain initialiser before depositing.
                </p>
                <Link href="/lend/vaults" className="btn-ghost mt-6">
                  Back to vaults
                </Link>
              </Panel>
            ) : vault.isError ? (
              <Panel tone="bad">
                <div className="eyebrow" style={{ color: "var(--signal-bad)" }}>
                  Error
                </div>
                <p className="mt-4 font-sans text-sm text-[var(--ink-dim)]">
                  {vault.error instanceof Error ? vault.error.message : "Unknown error"}
                </p>
              </Panel>
            ) : (
              <div className="grid gap-10 md:grid-cols-12 md:gap-8">
                {/* LEFT: metric + event log */}
                <div className="flex flex-col gap-10 md:col-span-7">
                  {/* Big TVL headline */}
                  <div className="border border-[var(--rule)] bg-[var(--bg-elev-1)] p-8 md:p-10">
                    <span className="eyebrow">Total value locked</span>
                    <div className="mt-6 flex items-baseline gap-3">
                      <span
                        className="font-mono text-6xl font-medium leading-none tracking-[-0.02em] text-[var(--ink)] tabnums md:text-7xl"
                        style={{ fontVariantNumeric: "tabular-nums" }}
                      >
                        {formatAtoms(totalAssets)}
                      </span>
                      <span className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                        USDC
                      </span>
                    </div>

                    <div className="mt-12 grid grid-cols-2 gap-px border border-[var(--rule)] bg-[var(--rule)] sm:grid-cols-4">
                      <StatCell label="APR" value="—" />
                      <StatCell
                        label="Total shares"
                        value={formatAtoms(totalShares)}
                      />
                      <StatCell
                        label="Your shares"
                        value={formatAtoms(shares.data)}
                      />
                      <StatCell
                        label="Wallet USDC"
                        value={formatAtoms(usdc.data)}
                      />
                    </div>
                  </div>

                  {/* Event log */}
                  <div className="border border-[var(--rule)] bg-[var(--bg-elev-1)]">
                    <div className="flex items-center justify-between border-b border-[var(--rule)] px-6 py-4">
                      <span className="eyebrow">Event log · latest 10</span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--ink-muted)]">
                        This vault
                      </span>
                    </div>
                    <ul className="flex flex-col">
                      {[
                        { n: "deposited", d: "+100,000 USDC · 0xA3…F9", t: "-00:01:42" },
                        { n: "ccbTrdcCreated", d: "TRDC #7A2F · 14,200 appraisal", t: "-00:03:11" },
                        { n: "custodyConfirmed", d: "TRDC #7A2F · BR-SP", t: "-00:05:54" },
                        { n: "disbursed", d: "-42,000 USDC → 0xB2…1E", t: "-00:07:20" },
                        { n: "deposited", d: "+25,000 USDC · 0xCC…9A", t: "-00:12:03" }
                      ].map((it, i) => (
                        <li
                          key={i}
                          className="grid grid-cols-[auto_1fr_auto] items-baseline gap-4 border-b border-[var(--rule)] px-6 py-4 font-mono text-xs last:border-b-0"
                        >
                          <span className="uppercase tracking-[0.14em] text-[var(--brand)]">
                            {it.n}
                          </span>
                          <span className="text-[var(--ink-dim)]">{it.d}</span>
                          <span className="tabnums text-[var(--ink-muted)]">{it.t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* RIGHT: deposit form */}
                <aside className="md:col-span-5">
                  <div className="sticky top-[96px] border border-[var(--rule)] bg-[var(--bg-elev-1)] p-6 md:p-8">
                    <span className="eyebrow">Deposit</span>
                    <p className="mt-4 font-sans text-sm leading-[1.65] text-[var(--ink-dim)]">
                      Minimum 1 USDC. First deposit runs a one-time identity check.
                    </p>
                    <div className="mt-8">
                      <DepositForm assetMint={assetMint} />
                    </div>
                  </div>
                </aside>
              </div>
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}

function Panel({
  children,
  tone = "default"
}: {
  children: React.ReactNode;
  tone?: "default" | "bad";
}) {
  return (
    <div
      className="border border-[var(--rule)] bg-[var(--bg-elev-1)] p-8 md:p-12"
      style={tone === "bad" ? { borderColor: "var(--signal-bad)" } : undefined}
    >
      {children}
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--bg-elev-1)] p-5">
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--ink-muted)]">
        {label}
      </div>
      <div className="mt-3 font-mono text-xl text-[var(--ink)] tabnums">
        {value}
      </div>
    </div>
  );
}
