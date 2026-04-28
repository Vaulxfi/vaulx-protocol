"use client";
/**
 * Sumsub WebSDK iframe wrapper. Fetches an init token from /api/sumsub/init-token
 * scoped to the user's wallet, mounts the iframe, listens for completion, then
 * polls /api/sumsub/applicant-status until the on-chain SAS appears (or timeout).
 *
 * Props:
 *   walletPubkey — the connected user's Solana pubkey
 *   onVerified — fires when on-chain SAS is confirmed (modal can close)
 *   onCancel — fires on user-initiated close
 */
import { useEffect, useRef, useState } from "react";
import snsWebSdk from "@sumsub/websdk";

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 30_000;

type SumsubVerifyProps = {
  walletPubkey: string;
  onVerified: () => void;
  onCancel?: () => void;
};

export function SumsubVerify({ walletPubkey, onVerified, onCancel }: SumsubVerifyProps) {
  const [status, setStatus] = useState<"loading" | "ready" | "verifying" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const containerId = "sumsub-websdk-container";
  const sdkInstance = useRef<unknown>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onVerifiedRef = useRef(onVerified);
  onVerifiedRef.current = onVerified;

  useEffect(() => {
    let cancelled = false;

    const startPolling = () => {
      if (pollTimerRef.current) return;
      const startTs = Date.now();
      pollTimerRef.current = setInterval(async () => {
        if (Date.now() - startTs > POLL_TIMEOUT_MS) {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          pollTimerRef.current = null;
          setError("Verification timed out — check email for follow-up.");
          setStatus("error");
          return;
        }
        try {
          const res = await fetch(
            `/api/sumsub/applicant-status?walletPubkey=${encodeURIComponent(walletPubkey)}`,
          );
          const data = (await res.json()) as { kyc?: string };
          if (data.kyc === "verified") {
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
            onVerifiedRef.current();
          }
        } catch {
          // continue polling on transient errors
        }
      }, POLL_INTERVAL_MS);
    };

    (async () => {
      try {
        const res = await fetch("/api/sumsub/init-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ walletPubkey }),
        });
        if (!res.ok) throw new Error(`init-token failed: ${res.status}`);
        const { token } = (await res.json()) as { token: string };
        if (cancelled) return;

        const sdk = snsWebSdk
          .init(token, () => Promise.resolve(token))
          .withConf({ lang: "en" })
          .on("idCheck.onApplicantSubmitted", () => {
            setStatus("verifying");
            startPolling();
          })
          .on("idCheck.onApplicantStatusChanged", (payload) => {
            if (payload.reviewStatus === "completed") {
              setStatus("verifying");
              startPolling();
            }
          })
          .build();

        sdkInstance.current = sdk;
        sdk.launch(`#${containerId}`);
        setStatus("ready");
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    };
  }, [walletPubkey]);

  if (status === "error") {
    return (
      <div className="rounded-md border border-rose-400/30 bg-rose-50/5 p-4 text-sm text-rose-300">
        <p>Verification error</p>
        <p className="mt-2 font-mono text-xs">{error}</p>
        <button
          onClick={onCancel}
          className="mt-3 rounded border border-[var(--rule)] px-3 py-1 text-xs text-[var(--ink-dim)]"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div>
      {status === "verifying" && (
        <p className="mb-3 text-center font-mono text-xs uppercase tracking-wider text-[var(--ink-muted)]">
          Verifying on-chain attestation…
        </p>
      )}
      <div id={containerId} style={{ minHeight: "560px" }} />
    </div>
  );
}
