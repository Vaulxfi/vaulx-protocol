import "dotenv/config";

/**
 * Loaded once at boot; consumed by `main.ts` and (eventually) by the chain /
 * route modules. Skeleton-stage fields only — HMAC secret, operator keypair
 * path, and webhook target land in subsequent commits as the corresponding
 * features come online.
 */
export interface BridgeConfig {
  port: number;
  solanaRpcUrl: string;
  solanaCluster: string;
}

export function loadConfig(): BridgeConfig {
  return {
    port: Number.parseInt(process.env.BRIDGE_PORT ?? "8787", 10),
    solanaRpcUrl:
      process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com",
    solanaCluster: process.env.SOLANA_CLUSTER ?? "devnet",
  };
}
