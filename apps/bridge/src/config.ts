import os from "node:os";
import path from "node:path";

import "dotenv/config";

/**
 * Loaded once at boot; consumed by `main.ts` and the chain layer. HMAC
 * secret + webhook target arrive in subsequent commits as the corresponding
 * features come online.
 */
export interface BridgeConfig {
  port: number;
  solanaRpcUrl: string;
  solanaCluster: string;
  /**
   * Filesystem path to the operator's Solana keypair JSON (the same shape
   * `solana-keygen new` writes — a 64-element JSON array of bytes). Defaults
   * to the user's solana CLI keypair so a fresh dev clone Just Works on the
   * developer's machine without extra config.
   */
  operatorKeypairPath: string;
}

const DEFAULT_OPERATOR_KEYPAIR_PATH = path.join(
  os.homedir(),
  ".config",
  "solana",
  "id.json",
);

export function loadConfig(): BridgeConfig {
  return {
    port: Number.parseInt(process.env.BRIDGE_PORT ?? "8787", 10),
    solanaRpcUrl:
      process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com",
    solanaCluster: process.env.SOLANA_CLUSTER ?? "devnet",
    operatorKeypairPath:
      process.env.OPERATOR_KEYPAIR_PATH ?? DEFAULT_OPERATOR_KEYPAIR_PATH,
  };
}
