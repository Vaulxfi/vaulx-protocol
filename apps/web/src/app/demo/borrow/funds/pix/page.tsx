"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DemoShell } from "../../../_components/demo-shell";
import { MockBadge } from "../../../_components/integration-badges";
import { useDemoSession } from "../../../_lib/use-demo-session";
import {
  PIX_RECIPIENTS,
  USDC_BRL_RATE,
  type PixRecipient,
} from "../../../_fixtures/pix-recipients";

type PixState = "idle" | "submitting" | "done";

const BRL = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const USDC = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function atomsToUsdc(atoms: string): number {
  try {
    return Number(BigInt(atoms)) / 1_000_000;
  } catch {
    return 0;
  }
}

export default function PixPage() {
  const router = useRouter();
  const { session, patch } = useDemoSession();

  useEffect(() => {
    if (session && !session.loan?.disbursedAt) {
      router.replace("/demo/borrow/disburse");
    }
  }, [session, router]);

  const balance = atomsToUsdc(session?.loan?.inAppBalanceAtoms ?? "0");

  const [recipient, setRecipient] = useState<PixRecipient>(PIX_RECIPIENTS[0]);
  const [amount, setAmount] = useState<string>("");
  const [state, setState] = useState<PixState>("idle");

  const usdcAmount = useMemo(() => {
    const n = parseFloat(amount);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [amount]);

  const brlAmount = useMemo(
    () => usdcAmount * USDC_BRL_RATE,
    [usdcAmount],
  );

  const valid =
    usdcAmount >= 1 && usdcAmount <= balance && state === "idle";

  const submit = () => {
    if (!valid) return;
    setState("submitting");
    window.setTimeout(() => {
      const sentAtoms = BigInt(Math.round(usdcAmount * 1_000_000));
      patch((s) => {
        if (!s.loan) return s;
        const next = (BigInt(s.loan.inAppBalanceAtoms) - sentAtoms).toString();
        return { ...s, loan: { ...s.loan, inAppBalanceAtoms: next } };
      });
      setState("done");
    }, 2000);
  };

  if (!session) {
    return (
      <DemoShell formFactor="phone">
        <div className="px-6 py-12 text-[var(--ink-muted)]">Loading…</div>
      </DemoShell>
    );
  }

  return (
    <DemoShell formFactor="phone">
      <div className="px-6 py-8">
        <p className="eyebrow">Step 12 / 14 · Pix off-ramp</p>
        <h1 className="display-md mt-3">Send R$ to your Brazilian bank.</h1>
        <p className="mt-3 text-sm text-[var(--ink-dim)]">
          Pix settles in ~2 seconds. USDC is sold to BRL at {USDC_BRL_RATE.toFixed(2)} per USDC.
        </p>

        {/* Balance ribbon */}
        <div className="mt-6 flex items-baseline justify-between rounded-md border border-[var(--rule)] px-4 py-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
            Available
          </span>
          <span
            className="font-mono text-sm text-[var(--ink)]"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {USDC.format(balance)} USDC
          </span>
        </div>

        {state === "idle" && (
          <>
            {/* Recipient picker */}
            <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
              Recipient
            </p>
            <div className="mt-2 space-y-2">
              {PIX_RECIPIENTS.map((r) => {
                const selected = r.id === recipient.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRecipient(r)}
                    className={`block w-full rounded-md border px-4 py-3 text-left transition-colors ${
                      selected
                        ? "border-[var(--brand)] bg-[var(--brand-wash)]"
                        : "border-[var(--rule)] hover:border-[var(--brand)]/50"
                    }`}
                  >
                    <p className="font-display text-sm text-[var(--ink)]">
                      {r.bank}
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                      {r.masked}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Amount input */}
            <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
              Amount (USDC)
            </p>
            <input
              type="number"
              inputMode="decimal"
              min={1}
              max={balance}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="mt-2 w-full rounded-md border border-[var(--rule)] bg-[var(--bg)] px-3 py-2 font-mono text-sm text-[var(--ink)]"
            />
            <p
              className="mt-2 font-mono text-xs text-[var(--ink-dim)]"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              = R$ {BRL.format(brlAmount)} BRL
            </p>
            {usdcAmount > balance && (
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-rose-400">
                Exceeds balance
              </p>
            )}

            <button
              type="button"
              onClick={submit}
              disabled={!valid}
              className="mt-6 w-full rounded-md border border-[var(--brand)] bg-[var(--brand)] px-4 py-3 font-mono text-sm uppercase tracking-[0.16em] text-[var(--bg)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Send R$ {BRL.format(brlAmount)} to {recipient.bank} {recipient.masked}
            </button>
          </>
        )}

        {state === "submitting" && (
          <div className="mt-8 flex items-center gap-3 rounded-md border border-[var(--rule)] bg-[var(--bg-elev-1)] p-4">
            <span
              className="inline-block h-2 w-2 rounded-full bg-[var(--brand)]"
              style={{ animation: "pulse 1.4s ease-in-out infinite" }}
            />
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--ink-dim)]">
              Sending R$ {BRL.format(brlAmount)} to {recipient.bank} {recipient.masked}…
            </p>
          </div>
        )}

        {state === "done" && (
          <div
            key="done"
            className="mt-8 rounded-md border border-emerald-500/60 bg-emerald-500/10 p-5"
            style={{ animation: "vxReveal 600ms cubic-bezier(.22,1,.36,1)" }}
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-400">
              ✓ R$ {BRL.format(brlAmount)} received at {recipient.bank} {recipient.masked}
            </p>
            <p className="mt-2 text-xs text-[var(--ink-dim)]">
              Settled via Pix in 1.8 seconds. Vaulx balance debited.
            </p>
            <Link
              href="/demo/borrow/funds"
              className="mt-4 inline-block font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--brand)] underline"
            >
              Open Vaulx wallet →
            </Link>
          </div>
        )}

        <Link
          href="/demo/borrow/funds"
          className="mt-8 block w-full rounded-md border border-[var(--rule)] px-4 py-3 text-center font-mono text-xs uppercase tracking-[0.16em] text-[var(--ink-dim)]"
        >
          ← Back to funds
        </Link>

        <style jsx>{`
          @keyframes pulse {
            0%,
            100% {
              opacity: 1;
            }
            50% {
              opacity: 0.35;
            }
          }
        `}</style>
      </div>
      <MockBadge partner="Pix Off-Ramp" />
    </DemoShell>
  );
}
