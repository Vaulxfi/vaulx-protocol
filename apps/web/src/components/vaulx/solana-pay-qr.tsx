"use client";

import { useMemo } from "react";
import { QRCodeSVG } from "qrcode.react";

type Props = {
  kind: "pay" | "repay" | "renew";
  trdc: string;
  /** USDC atoms (×1_000_000) — required when `kind === "pay"`. */
  amountAtoms?: bigint;
  /** Required for `kind === "renew"`. */
  termDays?: number;
  /** Unix seconds — required for `kind === "renew"`. */
  newDueTs?: number;
  /** Basis points — required for `kind === "renew"`. */
  newRateBps?: number;
  label?: string;
  /**
   * If true, the Solana Pay link is shown with an empty QR (placeholder).
   * Useful when a prerequisite (e.g. a typed amount) hasn't been met yet.
   */
  disabled?: boolean;
};

/**
 * Renders a Solana Pay "transaction request" QR code. The link points at
 * our own `/api/solana-pay/[kind]/[trdc]` endpoint; mobile wallets (Phantom,
 * Solflare) fetch that URL, let the user preview, then request a signed tx.
 *
 * NOTE: the link must be HTTPS (or plain `localhost`) for wallets to accept
 * it. Set `NEXT_PUBLIC_APP_URL` to your public hostname when testing on a
 * real device over Wi-Fi.
 */
export function SolanaPayQr({
  kind,
  trdc,
  amountAtoms,
  termDays,
  newDueTs,
  newRateBps,
  label,
  disabled = false,
}: Props) {
  const url = useMemo(() => {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ??
      (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
    const u = new URL(`/api/solana-pay/${kind}/${trdc}`, baseUrl);
    if (kind === "pay" && amountAtoms != null) {
      u.searchParams.set("amount", amountAtoms.toString());
    }
    if (kind === "renew") {
      if (termDays != null) u.searchParams.set("termDays", String(termDays));
      if (newDueTs != null) u.searchParams.set("newDueTs", String(newDueTs));
      if (newRateBps != null) u.searchParams.set("newRateBps", String(newRateBps));
    }
    return `solana:${u.toString()}`;
  }, [kind, trdc, amountAtoms, termDays, newDueTs, newRateBps]);

  return (
    <div className="rounded-sm border border-[var(--rule)] bg-[var(--bg-elev-1)] p-6 text-center">
      <div className="eyebrow mb-4">{label ?? "Pay from mobile"}</div>
      <div
        className="inline-block rounded-sm bg-white p-4"
        style={{ opacity: disabled ? 0.3 : 1, transition: "opacity 120ms" }}
      >
        <QRCodeSVG
          value={disabled ? "solana:placeholder" : url}
          size={220}
          bgColor="#FFFFFF"
          fgColor="#0A0B0D"
          level="M"
        />
      </div>
      <p className="mt-4 font-mono text-[11px] text-[var(--ink-muted)]">
        Scan with a Solana Pay compatible wallet (mobile Phantom, Solflare).
      </p>
      {!disabled && (
        <p className="mx-auto mt-2 max-w-xs break-all font-mono text-[10px] text-[var(--ink-muted)]">
          {url}
        </p>
      )}
      {disabled && (
        <p className="mx-auto mt-2 max-w-xs font-mono text-[10px] text-[var(--ink-muted)]">
          {kind === "pay"
            ? "Enter an amount above to activate the QR."
            : "Select a term to activate the QR."}
        </p>
      )}
    </div>
  );
}
