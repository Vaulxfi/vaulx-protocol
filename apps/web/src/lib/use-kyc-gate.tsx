"use client";
/**
 * Lazy KYC gate hook. Wrap a money-touching mutation with `guard(action)`:
 *
 *   const { guard, modalNode } = useKycGate("Deposit USDC");
 *   <button onClick={() => guard(() => deposit.mutateAsync(args))}>
 *     Deposit
 *   </button>
 *   {modalNode}
 *
 * Behaviour:
 *   - Checks /api/sumsub/applicant-status for the connected wallet
 *   - If kyc=verified → runs the action immediately
 *   - If kyc=missing → opens <KycRequiredModal>; defers the action
 *   - On Sumsub success → closes modal, resumes the deferred action
 *   - On user cancel → rejects the deferred action with KycCancelledError
 */
import { useCallback, useRef, useState } from "react";
import { useUnifiedWallet } from "@/components/providers/crossmint-wallet-adapter";
import { KycRequiredModal } from "@/components/vaulx/kyc-required-modal";

export class KycCancelledError extends Error {
  constructor() {
    super("User cancelled KYC verification");
    this.name = "KycCancelledError";
  }
}

export function useKycGate(actionLabel: string) {
  const { publicKey } = useUnifiedWallet();
  const [modalOpen, setModalOpen] = useState(false);
  const deferredAction = useRef<{
    fn: () => Promise<unknown>;
    resolve: (v: unknown) => void;
    reject: (e: unknown) => void;
  } | null>(null);

  const checkKyc = useCallback(async (): Promise<"verified" | "missing"> => {
    // Explicit dev/CI bypass — used when Sumsub credentials aren't
    // configured locally (the init-token route 502s without them, which
    // would block every money-touching flow even in development).
    // Production Vercel must leave this unset.
    if (process.env.NEXT_PUBLIC_KYC_BYPASS === "true") return "verified";
    if (!publicKey) return "missing";
    const res = await fetch(
      `/api/sumsub/applicant-status?walletPubkey=${encodeURIComponent(publicKey.toBase58())}`,
    );
    if (!res.ok) return "missing";
    const data = (await res.json()) as { kyc?: string };
    return data.kyc === "verified" ? "verified" : "missing";
  }, [publicKey]);

  const guard = useCallback(
    async <T,>(action: () => Promise<T>): Promise<T> => {
      const status = await checkKyc();
      if (status === "verified") {
        return action();
      }
      // Defer; resolve on Sumsub success, reject on cancel.
      return new Promise<T>((resolve, reject) => {
        deferredAction.current = {
          fn: action as () => Promise<unknown>,
          resolve: resolve as (v: unknown) => void,
          reject,
        };
        setModalOpen(true);
      });
    },
    [checkKyc],
  );

  const onVerified = useCallback(() => {
    setModalOpen(false);
    const def = deferredAction.current;
    deferredAction.current = null;
    if (def) {
      def
        .fn()
        .then((v) => def.resolve(v))
        .catch((e) => def.reject(e));
    }
  }, []);

  const cancel = useCallback(() => {
    setModalOpen(false);
    const def = deferredAction.current;
    deferredAction.current = null;
    if (def) def.reject(new KycCancelledError());
  }, []);

  const modalNode = (
    <KycRequiredModal
      open={modalOpen}
      actionLabel={actionLabel}
      walletPubkey={publicKey?.toBase58() ?? null}
      onVerified={onVerified}
      onCancel={cancel}
    />
  );

  return { guard, modalNode, modalOpen, cancel };
}
