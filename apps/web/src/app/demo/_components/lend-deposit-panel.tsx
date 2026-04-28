"use client";
// Functional deposit panel for /demo/lend. Wires the existing `useDeposit`,
// `useUserUsdcBalance`, `useUserShareBalance`, and `useVaultData` hooks
// against the devnet USDC mint (`NEXT_PUBLIC_USDC_MINT`).
//
// Renders alongside the read-only tranche tiles. When no wallet is
// connected, falls back to a "Connect wallet" CTA — the demo flow keeps
// working without on-chain mutations.
//
// Tx-sig surfaced as a Solscan deep-link on success. After confirmation we
// invalidate the user's USDC + share balances and the vault TVL via the
// existing react-query keys (already wired inside `useDeposit`).

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";

import {
  useDeposit,
  useUserShareBalance,
  useUserUsdcBalance,
  useVaultData,
} from "@/lib/chain/vault";
import {
  useUnifiedWallet,
  formatWalletLabel,
} from "@/components/providers/crossmint-wallet-adapter";
import { useKycGate, KycCancelledError } from "@/lib/use-kyc-gate";

const WalletMultiButton = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false },
);

const USDC_DECIMALS = 6;

function fmtAtoms(amount: bigint | undefined): string {
  if (amount === undefined) return "—";
  const base = 10n ** BigInt(USDC_DECIMALS);
  const whole = amount / base;
  const frac = amount % base;
  const fracStr = frac
    .toString()
    .padStart(USDC_DECIMALS, "0")
    .replace(/0+$/, "");
  return fracStr ? `${whole.toString()}.${fracStr}` : whole.toString();
}

function parseUsdcInput(s: string): bigint | null {
  const trimmed = s.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n <= 0) return null;
  return BigInt(Math.round(n * 1_000_000));
}

export function LendDepositPanel() {
  const rawMint = process.env.NEXT_PUBLIC_USDC_MINT;
  const assetMint = useMemo(() => {
    if (!rawMint) return undefined;
    try {
      return new PublicKey(rawMint);
    } catch {
      return undefined;
    }
  }, [rawMint]);

  const { publicKey } = useWallet();
  const unified = useUnifiedWallet();
  const { guard, modalNode } = useKycGate("Deposit USDC");

  const vault = useVaultData(assetMint);
  const shareMint = vault.data?.shareMint;
  const usdc = useUserUsdcBalance(assetMint);
  const shares = useUserShareBalance(shareMint);
  const deposit = useDeposit(assetMint);

  const [amountStr, setAmountStr] = useState("");
  const [lastSig, setLastSig] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  // Phase E Wire 4: faucet button — same /api/demo/faucet-usdc as the
  // borrower flow. Useful for lender testing on Devnet.
  const [faucetPending, setFaucetPending] = useState(false);
  const [faucetMsg, setFaucetMsg] = useState<string | null>(null);

  const amountAtoms = useMemo(() => parseUsdcInput(amountStr), [amountStr]);
  const insufficient =
    amountAtoms !== null && usdc.data !== undefined && amountAtoms > usdc.data;

  const tvlAtoms = vault.data
    ? BigInt(vault.data.totalAssets.toString())
    : undefined;

  const disabled =
    !publicKey ||
    !assetMint ||
    deposit.isPending ||
    amountAtoms === null ||
    insufficient;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrMsg(null);
    setLastSig(null);
    if (!amountAtoms) return;
    try {
      const sig = await guard(() => deposit.mutateAsync(amountAtoms));
      setLastSig(sig);
      setAmountStr("");
    } catch (err) {
      if (err instanceof KycCancelledError) return; // user backed out of KYC
      setErrMsg(err instanceof Error ? err.message : String(err));
    }
  }

  if (!assetMint) {
    return (
      <>
        {modalNode}
        <div className="border border-[var(--rule)] bg-[var(--bg-elev-1)] p-6">
          <span className="eyebrow">Live Devnet deposit</span>
          <p className="mt-3 font-mono text-xs text-[var(--ink-muted)]">
            NEXT_PUBLIC_USDC_MINT is not set. Populate it from{" "}
            <code className="text-[var(--brand)]">
              scripts/dev/devnet-usdc.json
            </code>{" "}
            to enable the on-chain deposit.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
    {modalNode}
    <div className="border border-[var(--rule)] bg-[var(--bg-elev-1)] p-6 md:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="eyebrow">Live Devnet · USDC vault</span>
          <h3 className="mt-3 font-display text-xl font-semibold tracking-[-0.01em] text-[var(--ink)] md:text-2xl">
            Deposit USDC.
          </h3>
          <p className="mt-2 max-w-[42ch] font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
            vault.deposit · {assetMint.toBase58().slice(0, 8)}…
            {assetMint.toBase58().slice(-4)}
          </p>
        </div>
        <div className="hidden md:block">
          <WalletMultiButton />
        </div>
      </div>

      {/* Stats row */}
      <div className="mt-6 grid grid-cols-3 gap-px border border-[var(--rule)] bg-[var(--rule)]">
        <Stat
          label="Vault TVL"
          value={fmtAtoms(tvlAtoms)}
          unit="USDC"
        />
        <Stat
          label="Wallet"
          value={publicKey ? fmtAtoms(usdc.data) : "—"}
          unit="USDC"
        />
        <Stat
          label="Your shares"
          value={publicKey ? fmtAtoms(shares.data) : "—"}
        />
      </div>

      {/* Unified wallet status — surfaces Crossmint identity vs Phantom signing */}
      <div className="mt-6 flex flex-wrap items-center gap-2 border border-[var(--rule)] bg-[var(--bg)] px-3 py-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
          Wallet
        </span>
        <span className="font-mono text-[11px] tabnums text-[var(--ink)]">
          {formatWalletLabel(unified)}
        </span>
        {unified.canSign && (
          <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-emerald-400">
            ready to sign
          </span>
        )}
        {unified.identityOnly && (
          <span className="rounded-full bg-amber-400/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-amber-400">
            identity only
          </span>
        )}
      </div>

      {/* Identity-only callout: Crossmint signed-in but wallet-adapter blank.
          Crossmint's SDK doesn't expose detached signTransaction yet, so the
          chain hooks need a wallet-adapter wallet to actually submit txns. */}
      {unified.identityOnly && (
        <p className="mt-3 max-w-[60ch] font-mono text-[11px] leading-relaxed text-amber-200/80">
          Signed in with Crossmint ({unified.email ?? "email"}). To submit a
          deposit on Devnet, also connect Phantom or Solflare below — Crossmint
          smart-wallet signing through wallet-adapter is pending an SDK
          capability.
        </p>
      )}

      {/* Faucet — mints 1000 demo USDC to the connected wallet */}
      {publicKey && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={faucetPending}
            onClick={async () => {
              setFaucetMsg(null);
              setFaucetPending(true);
              try {
                const res = await fetch("/api/demo/faucet-usdc", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({
                    recipientPubkey: publicKey.toBase58(),
                    amount: 1000,
                  }),
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
                usdc.refetch();
              } catch (err) {
                setFaucetMsg(
                  err instanceof Error ? `Error: ${err.message}` : String(err),
                );
              } finally {
                setFaucetPending(false);
              }
            }}
            className="rounded-md border border-[var(--rule)] bg-[var(--bg)] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-dim)] disabled:cursor-not-allowed disabled:opacity-40 hover:border-[var(--brand)]/50 hover:text-[var(--brand)]"
          >
            {faucetPending ? "Minting…" : "Get 1000 test USDC"}
          </button>
          {faucetMsg && (
            <span className="font-mono text-[10px] text-[var(--ink-muted)]">
              {faucetMsg}
            </span>
          )}
        </div>
      )}

      {/* Form */}
      {!publicKey ? (
        <div className="mt-6 flex flex-col items-start gap-3">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--ink-muted)]">
            Connect a wallet to deposit
          </p>
          <WalletMultiButton />
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3">
          <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
            Amount (USDC)
          </label>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="number"
              step="0.000001"
              min="0"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              placeholder="100.00"
              disabled={deposit.isPending}
              className="w-full rounded-md border border-[var(--rule)] bg-[var(--bg)] px-4 py-3 font-mono text-sm tabnums text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:border-[var(--brand)] focus:outline-none disabled:opacity-50"
              style={{ fontVariantNumeric: "tabular-nums" }}
            />
            <button
              type="submit"
              disabled={disabled}
              className="rounded-md border border-[var(--brand)] bg-[var(--brand)] px-5 py-3 font-mono text-xs uppercase tracking-[0.16em] text-[var(--bg)] disabled:cursor-not-allowed disabled:opacity-40 sm:w-48"
            >
              {deposit.isPending ? "Depositing…" : "Deposit USDC"}
            </button>
          </div>
          {insufficient && (
            <p className="font-mono text-[11px] text-rose-400">
              Insufficient USDC balance.
            </p>
          )}
          {errMsg && (
            <p className="font-mono text-[11px] text-rose-400">{errMsg}</p>
          )}
          {lastSig && (
            <p className="font-mono text-[11px] text-emerald-400">
              ✓ Deposit confirmed.{" "}
              <a
                href={`https://solscan.io/tx/${lastSig}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-dotted hover:text-emerald-300"
              >
                {lastSig.slice(0, 8)}…{lastSig.slice(-4)} ↗
              </a>
            </p>
          )}
        </form>
      )}
    </div>
    </>
  );
}

function Stat({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div className="bg-[var(--bg)] p-4">
      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span
          className="font-mono text-lg tabnums text-[var(--ink)]"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {value}
        </span>
        {unit && (
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}
