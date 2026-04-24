"use client";

import { useMemo, type ReactNode } from "react";
import {
  clusterApiUrl,
  PublicKey,
  type Cluster,
} from "@solana/web3.js";
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
  useAnchorWallet,
  useConnection,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter
} from "@solana/wallet-adapter-wallets";

// SDK: `@civic/solana-gateway-react@1.2.x` exports `SolanaGatewayProvider` as
// `GatewayProvider`. Required props (per
// `node_modules/.../SolanaGatewayProviderProps`): `connection`, `wallet`
// (SolanaWalletAdapter — the anchor-wallet from `useAnchorWallet()` shape is
// compatible), `gatekeeperNetwork`, optional `cluster`.
import { GatewayProvider } from "@civic/solana-gateway-react";

import "@solana/wallet-adapter-react-ui/styles.css";

const CIVIC_PASS_NETWORK_ENV = process.env.NEXT_PUBLIC_CIVIC_PASS_NETWORK;
const civicNetwork =
  CIVIC_PASS_NETWORK_ENV && CIVIC_PASS_NETWORK_ENV.length > 0
    ? new PublicKey(CIVIC_PASS_NETWORK_ENV)
    : null;

/**
 * Internal: wraps children in the Civic `GatewayProvider` when a gatekeeper
 * network env var is configured. Uses the adapter's anchor-wallet + read
 * connection from the surrounding wallet provider stack.
 */
function MaybeGatewayProvider({ children }: { children: ReactNode }) {
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();
  if (!civicNetwork) return <>{children}</>;
  // Civic's provider expects a connected wallet; until the user connects,
  // degrade to passthrough. Real SDK handles this gracefully post-install.
  if (!anchorWallet) return <>{children}</>;
  return (
    <GatewayProvider
      connection={connection}
      wallet={anchorWallet}
      gatekeeperNetwork={civicNetwork}
      cluster={(process.env.NEXT_PUBLIC_CLUSTER as Cluster) ?? "devnet"}
    >
      {children}
    </GatewayProvider>
  );
}

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

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <MaybeGatewayProvider>{children}</MaybeGatewayProvider>
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}
