"use client";
/**
 * Lazy-KYC gate modal. Surfaces when the user clicks a money-touching CTA
 * but has no on-chain SAS attestation. Mounts <SumsubVerify> inside.
 *
 * Conditionally rendered (`if (!open) return null`) — the underlying
 * SumsubVerify only fetches its init-token when the user actually triggers
 * the gate, never at page-load time.
 */
import { SumsubVerify } from "./sumsub-verify";

export function KycRequiredModal({
  open,
  actionLabel,
  walletPubkey,
  onVerified,
  onCancel,
}: {
  open: boolean;
  actionLabel: string;
  walletPubkey: string | null;
  onVerified: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal
      aria-labelledby="kyc-modal-title"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[var(--bg)]/80 px-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-[640px] overflow-hidden rounded-md border border-[var(--rule)] bg-[var(--bg-elev-1)] shadow-2xl">
        <header className="border-b border-[var(--rule)] px-6 py-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--ink-muted)]">
            Identity verification
          </span>
          <h2
            id="kyc-modal-title"
            className="mt-2 font-display text-2xl font-bold text-[var(--ink)]"
          >
            Verify to {actionLabel.toLowerCase()}
          </h2>
          <p className="mt-2 text-sm text-[var(--ink-dim)]">
            One-time verification. ~60 seconds for Brazilian residents (CPF +
            liveness, no documents). Reusable across all future Vaulx sessions.
          </p>
        </header>
        <div className="px-6 py-6">
          {walletPubkey ? (
            <SumsubVerify
              walletPubkey={walletPubkey}
              onVerified={onVerified}
              onCancel={onCancel}
            />
          ) : (
            <p className="text-sm text-[var(--ink-dim)]">
              Connect a wallet first.
            </p>
          )}
        </div>
        <footer className="flex items-center justify-end border-t border-[var(--rule)] px-6 py-3">
          <button
            onClick={onCancel}
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ink-muted)] hover:text-[var(--ink)]"
          >
            Cancel
          </button>
        </footer>
      </div>
    </div>
  );
}
