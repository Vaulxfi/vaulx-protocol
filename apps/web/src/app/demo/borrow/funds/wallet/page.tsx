"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DemoShell } from "../../../_components/demo-shell";
import { LiveBadge } from "../../../_components/integration-badges";
import { useDemoSession } from "../../../_lib/use-demo-session";

type SendState = "idle" | "sending" | "done" | "error" | "unavailable";

type SendResponse =
  | { ok: true; signature: string; lamports: number; destination: string }
  | {
      ok: false;
      kind?: "payer-unavailable";
      onVercel?: boolean;
      error?: string;
      reason?: string;
    };

export default function WalletSendPage() {
  const router = useRouter();
  const { session } = useDemoSession();

  useEffect(() => {
    if (session && !session.loan?.disbursedAt) {
      router.replace("/demo/borrow/disburse");
    }
  }, [session, router]);

  const [dest, setDest] = useState("");
  const [state, setState] = useState<SendState>("idle");
  const [sig, setSig] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [reason, setReason] = useState<string | null>(null);

  const submit = async () => {
    setState("sending");
    setErr(null);
    setSig(null);
    setReason(null);
    try {
      const res = await fetch("/api/demo/devnet-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination: dest, lamports: 1_000_000 }),
      });
      const data: SendResponse = await res.json();
      if (data.ok) {
        setSig(data.signature);
        setState("done");
        return;
      }
      if (res.status === 503 && data.kind === "payer-unavailable") {
        setReason(data.reason ?? null);
        setState("unavailable");
        return;
      }
      setErr(data.error ?? `HTTP ${res.status}`);
      setState("error");
    } catch (e) {
      setErr(String(e));
      setState("error");
    }
  };

  return (
    <DemoShell formFactor="phone">
      <div className="px-6 py-8">
        <p className="eyebrow">Step 11 / 14 · Crypto wallet</p>
        <h1 className="display-md mt-3">Send to a Solana wallet.</h1>
        <p className="mt-3 text-sm text-[var(--ink-dim)]">
          Real Devnet transfer. The signature is verifiable on Solscan.
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
          className="mt-2 w-full rounded-md border border-[var(--rule)] bg-[var(--bg)] px-3 py-2 font-mono text-xs text-[var(--ink)]"
        />
        <p className="mt-1 font-mono text-[10px] text-[var(--ink-muted)]">
          Sending 0.001 SOL from the Vaulx demo payer.
        </p>

        <button
          type="button"
          onClick={submit}
          disabled={state === "sending" || dest.length < 32}
          className="mt-4 w-full rounded-md border border-[var(--brand)] bg-[var(--brand)] px-4 py-3 font-mono text-sm uppercase tracking-[0.16em] text-[var(--bg)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {state === "sending"
            ? "Sending…"
            : state === "done"
              ? "Sent ✓"
              : "Send 0.001 SOL"}
        </button>

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

        {state === "unavailable" && (
          <div className="mt-6 rounded-md border border-[var(--brand)]/30 bg-[var(--brand-wash)] p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--brand)]">
              Local demo only
            </p>
            <p className="mt-2 text-xs text-[var(--ink-dim)]">
              {reason ??
                "This route signs real Devnet transfers with a payer keypair stored on the local filesystem. The deployed environment doesn't ship with that keypair — clone the repo and run the demo locally to see a real on-chain transaction."}
            </p>
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
