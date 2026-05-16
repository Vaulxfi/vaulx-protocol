"use client";
// Real USDC withdrawal — the user signs an SPL transfer from their
// USDC ATA to an arbitrary Solana destination. Replaces the previous
// "operator pays 0.001 SOL via server keypair" showcase that only
// worked in local dev and never moved the borrower's borrowed funds.
//
// Flow:
//   1. Resolve borrower ATA, destination ATA, USDC mint.
//   2. If destination ATA doesn't exist, prepend
//      createAssociatedTokenAccountIdempotentInstruction (sender pays
//      ~0.002 SOL rent for it, on-chain).
//   3. Append createTransferInstruction(amount, signer = borrower).
//   4. Wallet adapter signs → submit via RPC → confirm.
//
// Devnet only — when this lands on mainnet the mint will be real USDC.
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PublicKey, Transaction } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { DemoShell } from "../../../_components/demo-shell";
import { LiveBadge } from "../../../_components/integration-badges";
import { useDemoSession } from "../../../_lib/use-demo-session";
import { useUnifiedWallet } from "@/components/providers/crossmint-wallet-adapter";
import { requireUsdcMint } from "@/lib/usdc";

type SendState = "idle" | "running" | "done" | "error";

export default function WalletSendPage() {
  const router = useRouter();
  const { session } = useDemoSession();
  const wallet = useUnifiedWallet();
  const solanaWallet = useWallet();
  const { connection } = useConnection();

  useEffect(() => {
    if (session && !session.loan?.disbursedAt) {
      router.replace("/demo/borrow/disburse");
    }
  }, [session, router]);

  const [dest, setDest] = useState("");
  const [amount, setAmount] = useState("");
  const [state, setState] = useState<SendState>("idle");
  const [sig, setSig] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [progressMsg, setProgressMsg] = useState<string | null>(null);

  // Quick client-side input checks so the submit button can be
  // accurately enabled/disabled. The full PublicKey + amount parse
  // happens inside `submit()` so the error surfaces are unified.
  const destLooksLikePubkey = useMemo(
    () => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(dest),
    [dest],
  );
  const amountValid = useMemo(() => {
    const n = Number(amount);
    return Number.isFinite(n) && n > 0;
  }, [amount]);
  const canSubmit =
    state !== "running" &&
    wallet.canSign &&
    !!solanaWallet.signTransaction &&
    !!solanaWallet.publicKey &&
    destLooksLikePubkey &&
    amountValid;

  const submit = async () => {
    setErr(null);
    setSig(null);
    setProgressMsg(null);

    if (!solanaWallet.publicKey || !solanaWallet.signTransaction) {
      setErr("Connect a signing wallet (Phantom/Solflare) first.");
      setState("error");
      return;
    }

    let destPubkey: PublicKey;
    try {
      destPubkey = new PublicKey(dest);
    } catch {
      setErr("Invalid destination — must be a base58 Solana pubkey.");
      setState("error");
      return;
    }

    const amountFloat = Number(amount);
    if (!Number.isFinite(amountFloat) || amountFloat <= 0) {
      setErr("Amount must be a positive number.");
      setState("error");
      return;
    }
    // USDC has 6 decimals — convert to atoms with explicit rounding.
    const amountAtoms = BigInt(Math.round(amountFloat * 1_000_000));
    if (amountAtoms <= 0n) {
      setErr("Amount rounds to zero atoms — pick a larger amount.");
      setState("error");
      return;
    }

    try {
      setState("running");
      setProgressMsg("Preparing the transfer…");

      const mint = requireUsdcMint();
      const fromAta = getAssociatedTokenAddressSync(
        mint,
        solanaWallet.publicKey,
      );
      // allowOwnerOffCurve = true so off-curve owners (PDAs, etc.)
      // still derive a valid ATA — defensive default for SPL
      // transfers to arbitrary destinations.
      const toAta = getAssociatedTokenAddressSync(mint, destPubkey, true);

      const ixs = [];
      // Idempotent ATA creation for the destination — required if the
      // recipient has never held this token before. Sender pays the
      // ~0.002 SOL rent for the new account.
      const toAtaInfo = await connection.getAccountInfo(toAta);
      if (!toAtaInfo) {
        ixs.push(
          createAssociatedTokenAccountIdempotentInstruction(
            solanaWallet.publicKey,
            toAta,
            destPubkey,
            mint,
          ),
        );
      }
      ixs.push(
        createTransferInstruction(
          fromAta,
          toAta,
          solanaWallet.publicKey,
          amountAtoms,
        ),
      );

      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash("confirmed");
      const tx = new Transaction();
      tx.feePayer = solanaWallet.publicKey;
      tx.recentBlockhash = blockhash;
      tx.lastValidBlockHeight = lastValidBlockHeight;
      tx.add(...ixs);

      setProgressMsg("Sign the transfer in your wallet…");
      let signed: Transaction;
      try {
        signed = await solanaWallet.signTransaction(tx);
      } catch (sigErr) {
        const msg = sigErr instanceof Error ? sigErr.message : String(sigErr);
        if (
          msg.toLowerCase().includes("user rejected") ||
          msg.toLowerCase().includes("declined")
        ) {
          throw new Error("Signature cancelled in your wallet.");
        }
        throw sigErr;
      }

      setProgressMsg("Submitting on Devnet…");
      const signature = await connection.sendRawTransaction(signed.serialize(), {
        maxRetries: 5,
      });
      await connection.confirmTransaction(
        { signature, blockhash, lastValidBlockHeight },
        "confirmed",
      );

      setSig(signature);
      setProgressMsg(null);
      setState("done");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setErr(msg);
      setProgressMsg(null);
      setState("error");
    }
  };

  return (
    <DemoShell formFactor="phone">
      <div className="px-6 py-8">
        <p className="eyebrow">Step 11 / 14 · Crypto wallet</p>
        <h1 className="display-md mt-3">Send USDC to a Solana wallet.</h1>
        <p className="mt-3 text-sm text-[var(--ink-dim)]">
          Real on-chain SPL transfer signed by your wallet. The signature
          is verifiable on Solscan.
        </p>

        <div className="mt-6">
          <LiveBadge partner="Solana Devnet" />
        </div>

        <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
          Destination
        </p>
        <input
          type="text"
          value={dest}
          onChange={(e) => setDest(e.target.value.trim())}
          placeholder="Solana pubkey (base58)"
          className="mt-2 w-full rounded-md border border-[var(--rule)] bg-[var(--bg)] px-3 py-2 font-mono text-xs text-[var(--ink)] focus:border-[var(--brand)] focus:outline-none"
          disabled={state === "running"}
        />

        <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
          Amount (USDC)
        </p>
        <input
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="1.00"
          className="mt-2 w-full rounded-md border border-[var(--rule)] bg-[var(--bg)] px-3 py-2 font-mono text-sm text-[var(--ink)] focus:border-[var(--brand)] focus:outline-none"
          disabled={state === "running"}
        />
        <p className="mt-1 font-mono text-[10px] text-[var(--ink-muted)]">
          You sign the SPL transfer from your USDC ATA. Sender pays a
          ~0.002 SOL rent if the destination ATA doesn&apos;t exist yet.
        </p>

        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          className="mt-4 w-full rounded-md border border-[var(--brand)] bg-[var(--brand)] px-4 py-3 font-mono text-sm uppercase tracking-[0.16em] text-[var(--bg)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {state === "running"
            ? (progressMsg ?? "Working…")
            : state === "done"
              ? "Sent ✓"
              : amount && amountValid
                ? `Send ${Number(amount).toFixed(2)} USDC →`
                : "Send USDC →"}
        </button>

        {!wallet.canSign && (
          <p className="mt-3 font-mono text-[10px] text-rose-400">
            Connect Phantom / Solflare from the top-right chip to sign
            transfers.
          </p>
        )}

        {sig && (
          <div className="mt-6 rounded-md border border-emerald-500/40 bg-emerald-500/10 p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-400">
              ✓ Confirmed on Devnet
            </p>
            <p className="mt-2 break-all font-mono text-[10px] text-[var(--ink-dim)]">
              {sig}
            </p>
            <a
              href={`https://solscan.io/tx/${sig}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--brand)] underline"
            >
              View on Solscan →
            </a>
          </div>
        )}

        {state === "error" && err && (
          <div className="mt-6 rounded-md border border-rose-500/40 bg-rose-500/10 p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-rose-300">
              Error
            </p>
            <p className="mt-2 break-words font-mono text-[10px] text-rose-200">
              {err}
            </p>
          </div>
        )}

        <Link
          href="/demo/borrow/funds"
          className="mt-8 block w-full rounded-md border border-[var(--rule)] px-4 py-3 text-center font-mono text-xs uppercase tracking-[0.16em] text-[var(--ink-dim)]"
        >
          ← Back to funds
        </Link>
      </div>
    </DemoShell>
  );
}
