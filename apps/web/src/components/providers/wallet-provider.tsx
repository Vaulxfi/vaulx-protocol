"use client";

import { useCallback, useEffect, useMemo, useRef, type ReactNode } from "react";
import {
  clusterApiUrl,
  type Cluster,
} from "@solana/web3.js";
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
  useWallet,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import type {
  WalletError,
  WalletName,
} from "@solana/wallet-adapter-base";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter
} from "@solana/wallet-adapter-wallets";

import "@solana/wallet-adapter-react-ui/styles.css";

// localStorage key that gates the guarded auto-reconnect below. The value
// is the adapter name (e.g. "Phantom") of the last wallet that
// successfully completed a `connect()` round-trip; cleared whenever the
// user disconnects or a connect attempt errors so a failed flow never
// loops. See <TrustedWalletAutoReconnect /> below.
const TRUST_KEY = "vaulx-wallet-trusted";

export function WalletProvider({ children }: { children: ReactNode }) {
  const cluster = (process.env.NEXT_PUBLIC_CLUSTER as Cluster) ?? "devnet";
  const endpoint = useMemo(
    () =>
      process.env.NEXT_PUBLIC_RPC_URL ??
      clusterApiUrl(cluster === "mainnet-beta" ? "mainnet-beta" : cluster),
    [cluster]
  );

  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    []
  );

  // Wallet-adapter onError sink. Also clears the trust flag so a failed
  // connect doesn't auto-retry on the next page load and trigger the
  // "stuck modal" bug we hit before. We don't auto-disconnect here (the
  // WalletProvider's own `disconnect` flow takes care of reset on the
  // next user gesture).
  const onError = useCallback((err: WalletError) => {
    if (typeof window !== "undefined") {
      // eslint-disable-next-line no-console
      console.warn("[wallet-adapter]", err.name, err.message);
      try {
        window.localStorage.removeItem(TRUST_KEY);
      } catch {
        // localStorage may be unavailable (e.g. privacy mode) — fine
      }
    }
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      {/*
        autoConnect=false: we DO want auto-reconnect on refresh, but the
        wallet-adapter's built-in autoConnect retries on every page load
        regardless of whether the previous connect succeeded — the well-
        known cause of the modal getting stuck after a user rejects the
        wallet popup. We layer a custom guard
        (<TrustedWalletAutoReconnect />) that only auto-connects when the
        last connect actually completed and wasn't followed by a
        disconnect or error.
      */}
      <SolanaWalletProvider wallets={wallets} onError={onError} autoConnect={false}>
        <WalletModalProvider>
          <TrustedWalletAutoReconnect />
          {children}
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}

/**
 * Guarded auto-reconnect to the last-trusted wallet.
 *
 * The wallet-adapter's built-in `autoConnect` prop has an old footgun:
 * it remembers the last-selected wallet via its own localStorage key
 * (`walletName`) and retries on every page load even if the user
 * dismissed the wallet popup last time. Net effect is a frozen modal
 * the next time they try to connect. Disabling autoConnect dodges the
 * bug but introduces a worse UX — every Cmd+Shift+R forces a manual
 * reconnect.
 *
 * This component reintroduces auto-reconnect with two guards:
 *
 *   1. We maintain our own `vaulx-wallet-trusted` flag that holds the
 *      adapter name only AFTER a connect resolved successfully. The
 *      flag is cleared on disconnect (`disconnecting` flip), on
 *      adapter-level disconnect events, and on `onError`. A user who
 *      rejects the popup leaves the flag empty → no auto-reconnect on
 *      next load.
 *   2. The auto-connect attempt fires at most once per page mount and
 *      only when the trusted adapter is actually installed (so an
 *      uninstalled-since-last-visit wallet doesn't try anything).
 */
function TrustedWalletAutoReconnect(): null {
  const { wallets, wallet, select, connect, connected, disconnecting } =
    useWallet();
  const attemptedRef = useRef(false);

  // 1) Mark wallet trusted on successful connect.
  useEffect(() => {
    if (!connected || !wallet?.adapter.name) return;
    try {
      window.localStorage.setItem(TRUST_KEY, wallet.adapter.name);
    } catch {
      // ignore
    }
  }, [connected, wallet?.adapter.name]);

  // 2) Clear trust on disconnect — useWallet flips `disconnecting` true
  //    while the disconnect is in progress.
  useEffect(() => {
    if (!disconnecting) return;
    try {
      window.localStorage.removeItem(TRUST_KEY);
    } catch {
      // ignore
    }
  }, [disconnecting]);

  // 3) Also listen to the adapter-level disconnect event for the case
  //    where the wallet extension drops the session out-of-band (e.g.
  //    user locked Phantom).
  useEffect(() => {
    const adapter = wallet?.adapter;
    if (!adapter) return;
    const onDisconnect = () => {
      try {
        window.localStorage.removeItem(TRUST_KEY);
      } catch {
        // ignore
      }
    };
    adapter.on("disconnect", onDisconnect);
    return () => {
      adapter.off("disconnect", onDisconnect);
    };
  }, [wallet?.adapter]);

  // 4) On mount, attempt one auto-connect if a wallet is trusted and
  //    installed. Selecting the adapter triggers the wallet to register
  //    via `wallet` on the next render cycle — effect (5) then completes
  //    the connect.
  useEffect(() => {
    if (attemptedRef.current || connected) return;
    if (typeof window === "undefined") return;
    let trustedName: string | null;
    try {
      trustedName = window.localStorage.getItem(TRUST_KEY);
    } catch {
      return;
    }
    if (!trustedName) return;
    const installed = wallets.find((w) => w.adapter.name === trustedName);
    if (!installed) {
      // Trusted wallet was uninstalled — drop the stale flag so we
      // don't keep checking on every mount.
      try {
        window.localStorage.removeItem(TRUST_KEY);
      } catch {
        // ignore
      }
      return;
    }
    attemptedRef.current = true;
    select(trustedName as WalletName);
  }, [wallets, connected, select]);

  // 5) Once the trusted adapter is selected (from effect 4), kick off
  //    connect. If it rejects we drop the trust flag so the user has to
  //    re-establish trust manually on the next attempt.
  useEffect(() => {
    if (!wallet || connected) return;
    if (typeof window === "undefined") return;
    let trustedName: string | null;
    try {
      trustedName = window.localStorage.getItem(TRUST_KEY);
    } catch {
      return;
    }
    if (!trustedName || wallet.adapter.name !== trustedName) return;
    connect().catch(() => {
      try {
        window.localStorage.removeItem(TRUST_KEY);
      } catch {
        // ignore
      }
    });
  }, [wallet, connected, connect]);

  return null;
}
