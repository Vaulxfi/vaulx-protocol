"use client";

import { useCallback, useEffect, useState } from "react";

export interface GovbrVerification {
  cpf: string;
  name: string;
  verified_at: number;
}

const keyFor = (wallet: string) => `vaulx_govbr_${wallet}`;

export function getGovbrVerification(
  wallet: string,
): GovbrVerification | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(keyFor(wallet));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as GovbrVerification;
  } catch {
    return null;
  }
}

export function setGovbrVerification(
  wallet: string,
  v: GovbrVerification,
): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(keyFor(wallet), JSON.stringify(v));
}

export function clearGovbrVerification(wallet: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(keyFor(wallet));
}

/**
 * React hook that returns the current gov.br mock verification state for a
 * wallet pubkey. Returns `{ verification, loading, clear, refresh }`.
 *
 * - `verification` is `null` when there's no stored entry or the wallet is
 *   missing.
 * - `loading` is `true` during the initial client-side hydration so callers
 *   don't flash "not verified" while we read localStorage.
 */
export function useGovbrVerification(wallet: string | null | undefined) {
  const [verification, setVerification] = useState<GovbrVerification | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    if (!wallet) {
      setVerification(null);
      setLoading(false);
      return;
    }
    setVerification(getGovbrVerification(wallet));
    setLoading(false);
  }, [wallet]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const clear = useCallback(() => {
    if (!wallet) return;
    clearGovbrVerification(wallet);
    setVerification(null);
  }, [wallet]);

  return { verification, loading, clear, refresh };
}
