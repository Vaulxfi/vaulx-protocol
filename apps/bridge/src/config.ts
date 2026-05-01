import os from "node:os";
import path from "node:path";

import "dotenv/config";

/**
 * Loaded once at boot; consumed by `main.ts` and the chain layer. Webhook
 * target arrives in a subsequent commit when the listener comes online.
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
  /**
   * Shared secret used to HMAC-sign every Laravel → bridge request. Required
   * — boot fails fast if absent because a bridge with no secret accepts
   * any caller. Generate with `openssl rand -hex 32`.
   */
  bridgeSharedSecret: string;
  /**
   * Maximum |now - timestamp| (in seconds) the HMAC middleware will accept.
   * Defends against replay; must be loose enough to tolerate clock drift
   * between Laravel and bridge hosts. Defaults to 300s (±5min).
   */
  hmacFreshnessSeconds: number;
  /**
   * Base URL where Laravel exposes `POST /api/onchain-events/<event>`. When
   * unset, the webhook listener is disabled (handy for local dev or
   * read-only deploys). Validated as a parseable URL at boot.
   */
  laravelWebhookBaseUrl: string | null;
}

const DEFAULT_OPERATOR_KEYPAIR_PATH = path.join(
  os.homedir(),
  ".config",
  "solana",
  "id.json",
);

function requireEnv(name: string): string {
  const v = process.env[name];
  if (v === undefined || v === "") {
    throw new Error(
      `Missing required env: ${name}. Set it before starting the bridge ` +
        `(see apps/bridge/.env.example).`,
    );
  }
  return v;
}

function parseOptionalUrl(name: string, raw: string | undefined): string | null {
  if (!raw) return null;
  try {
    new URL(raw);
  } catch {
    throw new Error(`${name} is not a valid URL: ${raw}`);
  }
  return raw;
}

export function loadConfig(): BridgeConfig {
  return {
    port: Number.parseInt(process.env.BRIDGE_PORT ?? "8787", 10),
    solanaRpcUrl:
      process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com",
    solanaCluster: process.env.SOLANA_CLUSTER ?? "devnet",
    operatorKeypairPath:
      process.env.OPERATOR_KEYPAIR_PATH ?? DEFAULT_OPERATOR_KEYPAIR_PATH,
    bridgeSharedSecret: requireEnv("BRIDGE_SHARED_SECRET"),
    hmacFreshnessSeconds: Number.parseInt(
      process.env.BRIDGE_HMAC_FRESHNESS_SECONDS ?? "300",
      10,
    ),
    laravelWebhookBaseUrl: parseOptionalUrl(
      "LARAVEL_WEBHOOK_BASE_URL",
      process.env.LARAVEL_WEBHOOK_BASE_URL,
    ),
  };
}
