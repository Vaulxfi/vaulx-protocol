import fs from "node:fs";
import os from "node:os";

import { AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { Connection, Keypair } from "@solana/web3.js";

import type { BridgeConfig } from "../config";

export interface BridgeProvider {
  connection: Connection;
  operator: Keypair;
  anchor: AnchorProvider;
}

function expandHome(p: string): string {
  return p.startsWith("~/") ? p.replace(/^~/, os.homedir()) : p;
}

function loadOperatorKeypair(keypairPath: string): Keypair {
  const expanded = expandHome(keypairPath);
  const raw = fs.readFileSync(expanded, "utf8");
  const bytes = JSON.parse(raw) as unknown;
  if (
    !Array.isArray(bytes) ||
    bytes.length !== 64 ||
    !bytes.every((b): b is number => typeof b === "number")
  ) {
    throw new Error(
      `operator keypair at ${expanded} is not a 64-byte JSON array`,
    );
  }
  return Keypair.fromSecretKey(new Uint8Array(bytes));
}

/**
 * Boot-time factory. Loads the operator keypair from disk, builds the
 * Connection + AnchorProvider used by every protocol-side ix. Read-only
 * endpoints reuse the same `connection` so commitment/RPC settings stay
 * consistent across the service.
 *
 * Throws synchronously if the keypair file is missing or malformed —
 * fail-fast at boot is the point: there's no useful read-only mode for the
 * bridge without an operator.
 */
export function createBridgeProvider(config: BridgeConfig): BridgeProvider {
  const connection = new Connection(config.solanaRpcUrl, "confirmed");
  const operator = loadOperatorKeypair(config.operatorKeypairPath);
  const anchor = new AnchorProvider(connection, new Wallet(operator), {
    commitment: "confirmed",
  });
  return { connection, operator, anchor };
}
