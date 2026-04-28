"use client";
// Phase E (Wire 4): the funds page now exposes the demo USDC faucet so the
// borrower can top up their on-chain balance directly here. Surfaces the live
// on-chain USDC balance alongside the in-app balance.
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PublicKey } from "@solana/web3.js";
import { DemoShell } from "../../_components/demo-shell";
import { useDemoSession } from "../../_lib/use-demo-session";
import { useUnifiedWallet } from "@/components/providers/crossmint-wallet-adapter";
import { useUserUsdcBalance } from "@/lib/chain/vault";

const USDC_FMT = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function fmtUsdc(atoms: string): string {
  try {
    return USDC_FMT.format(Number(BigInt(atoms)) / 1_000_000);
  } catch {
    return "0.00";
  }
}

function fmtUsdcAtoms(atoms: bigint | undefined): string {
  if (atoms === undefined) return "—";
  return USDC_FMT.format(Number(atoms) / 1_000_000);
}

export default function FundsPage() {
  const router = useRouter();
  const { session, isLoading } = useDemoSession();
  const wallet = useUnifiedWallet();
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
  const [faucetPending, setFaucetPending] = useState(false);
  const [faucetMsg, setFaucetMsg] = useState<string | null>(null);

  useEffect(() => {
    if (session && !session.loan?.disbursedAt) {
      router.replace("/demo/borrow/disburse");
    }
  }, [session, router]);

  if (isLoading) {
    return (
      <DemoShell formFactor="phone">
        <div className="px-6 py-12 text-[var(--ink-muted)]">Loading…</div>
      </DemoShell>
    );
  }

  const balance = session?.loan?.inAppBalanceAtoms ?? "0";

  return (
    <DemoShell formFactor="phone">
      <div className="px-6 py-8">
        <p className="eyebrow">Step 11 / 14 · Funds</p>
        <h1 className="display-md mt-3">Your funds. Three ways out.</h1>
        <p className="mt-3 text-sm text-[var(--ink-dim)]">
          R$ in your bank in 2 seconds. Or to a Solana wallet. Or spend on a Vaulx card.
        </p>

        <div className="mt-6 rounded-md border border-[var(--rule)] bg-[var(--bg-elev-1)] p-5 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
            Vaulx in-app balance
          </p>
          <p
            className="mt-2 font-mono text-4xl text-[var(--brand)]"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {fmtUsdc(balance)}
          </p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
            USDC
          </p>
        </div>

        {/* On-chain USDC + faucet — Phase E Wire 4 */}
        <div className="mt-4 rounded-md border border-[var(--rule)] bg-[var(--bg)] p-4">
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
              On-chain USDC · Devnet
            </span>
            <span
              className="font-mono text-sm text-[var(--ink)]"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {wallet.canSign ? fmtUsdcAtoms(usdcBalance.data) : "—"}
            </span>
          </div>
          <button
            type="button"
            disabled={!wallet.canSign || faucetPending}
            onClick={async () => {
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
            className="mt-3 w-full rounded-md border border-[var(--brand)]/50 bg-[var(--brand)]/10 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--brand)] disabled:cursor-not-allowed disabled:opacity-40 hover:bg-[var(--brand)]/20"
          >
            {faucetPending
              ? "Minting…"
              : wallet.canSign
                ? "Get 1000 test USDC"
                : "Connect wallet to use faucet"}
          </button>
          {faucetMsg && (
            <p className="mt-2 break-words font-mono text-[10px] text-[var(--ink-dim)]">
              {faucetMsg}
            </p>
          )}
        </div>

        <div className="mt-6 space-y-3">
          <Link
            href="/demo/borrow/funds/pix"
            className="block rounded-md border border-[var(--rule)] p-4 transition-colors hover:border-[var(--brand)]/50"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
              Pix
            </p>
            <p className="mt-1 font-display text-lg text-[var(--ink)]">
              Send to your Brazilian bank →
            </p>
            <p className="mt-1 text-xs text-[var(--ink-dim)]">
              2-second instant transfer. Receive in BRL.
            </p>
          </Link>

          <Link
            href="/demo/borrow/funds/wallet"
            className="block rounded-md border border-[var(--rule)] p-4 transition-colors hover:border-[var(--brand)]/50"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
              Solana wallet
            </p>
            <p className="mt-1 font-display text-lg text-[var(--ink)]">
              Send to crypto wallet →
            </p>
            <p className="mt-1 text-xs text-[var(--ink-dim)]">
              USDC on Solana Devnet. Real on-chain transfer.
            </p>
          </Link>

          <Link
            href="/demo/borrow/funds/card"
            className="block rounded-md border border-[var(--rule)] p-4 transition-colors hover:border-[var(--brand)]/50"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
              Vaulx Card
            </p>
            <p className="mt-1 font-display text-lg text-[var(--ink)]">
              Spend on debit card →
            </p>
            <p className="mt-1 text-xs text-[var(--ink-dim)]">
              Apple Pay / Google Pay. Powered by Solflare card.
            </p>
          </Link>
        </div>
      </div>
    </DemoShell>
  );
}
