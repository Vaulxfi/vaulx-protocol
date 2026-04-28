"use client";

import { useCallback, useMemo, type ReactNode } from "react";
import {
  clusterApiUrl,
  type Cluster,
} from "@solana/web3.js";
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import type { WalletError } from "@solana/wallet-adapter-base";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter
} from "@solana/wallet-adapter-wallets";

import "@solana/wallet-adapter-react-ui/styles.css";

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

  // Without an onError handler, a rejected/dismissed connect attempt leaves
  // the WalletProvider in a "selected but not connected" state. The next
  // click on <WalletMultiButton> opens the modal in a stale state and a
  // re-pick of the same wallet silently no-ops because the adapter still
  // thinks it's mid-connect. Logging + letting the modal re-render fully
  // resolves this — wallet-adapter clears its own internal state when
  // onError returns. We don't auto-disconnect here (the WalletProvider's
  // own `disconnect` flow takes care of reset on next user gesture).
  const onError = useCallback((err: WalletError) => {
    if (typeof window !== "undefined") {
      // eslint-disable-next-line no-console
      console.warn("[wallet-adapter]", err.name, err.message);
    }
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      {/*
        autoConnect=false: the previous `autoConnect` was the cause of the
        "modal stuck after failed connect" bug — the adapter remembered the
        last-selected wallet via localStorage and silently retried on every
        page load, locking the modal into a confused state. With it off,
        the user always picks deliberately and a failed connect is a clean
        retry.
      */}
      <SolanaWalletProvider wallets={wallets} onError={onError} autoConnect={false}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}
