// Kamino USDC float yield routing — observation/dry-run service.
//
// Track A→B status: the lender vault's USDC PDA is owned by the vault Anchor
// program. Routing tokens out requires PDA-signed CPI, which means a new
// `vault.route_idle_to_kamino` ix on the vault program. Until that lands the
// service runs in DRY-RUN mode by default — it polls vault USDC balance,
// computes idle headroom, and logs the routing action it would have taken.
// No tokens move on-chain.
//
// Security map (mirrors the Item 7 plan SR table):
//   SR-1 wrong-vault routing:   kaminoVault is constructor-injected from a
//                               canonical hardcoded constant (or admin env);
//                               never accepted from runtime input.
//   SR-2 slippage / front-run:  deposit path is gated by DRY-RUN; when the
//                               vault ix lands, deposit must use Kamino's
//                               min_shares_out slippage guard.
//   SR-3 withdrawal liveness:   ordering invariant — the indexer must
//                               WITHDRAW from Kamino BEFORE the vault
//                               disburses a loan. Documented here; enforced
//                               at the vault-program level once the route ix
//                               lands.
//   SR-4 yield misattribution:  recovered USDC + accrued yield must return
//                               to the lender vault PDA. The Kamino vault
//                               share account is owned by the vault PDA, not
//                               by a Vaulx-controlled wallet.

import {
  Connection,
  Keypair,
  PublicKey,
  type AccountInfo,
} from "@solana/web3.js";
import fs from "node:fs";

const POLL_INTERVAL_MS = 60_000;
const IDLE_HEADROOM_FACTOR = 1.1; // 10% buffer for upcoming disbursements (SR-3)
const MIN_ROUTE_AMOUNT_USDC = 100_000_000n; // 100 USDC at 6 decimals

// Canonical Kamino USDC main vaults. Hardcoded to satisfy SR-1 — operators
// pick mainnet vs devnet via `KAMINO_CLUSTER`, never via a free-form pubkey
// from env. To swap to a different Kamino vault, edit this constant in a
// reviewed PR.
//
// Mainnet: Kamino USDC main reserve (kamino.finance/lend). Update on each
// reserve migration.
const KAMINO_USDC_VAULT_MAINNET = new PublicKey(
  "D6q6wuQSrifJKZYpR1M8R4YawnLDtDsMmWM1NbBmgJ59",
);
// Devnet: Kamino does not maintain a stable USDC reserve on devnet at the
// time of writing. Set to PublicKey.default to force dry-run on devnet
// regardless of KAMINO_DRY_RUN flag.
const KAMINO_USDC_VAULT_DEVNET = PublicKey.default;

export type KaminoCluster = "mainnet" | "devnet";

export function canonicalKaminoVault(cluster: KaminoCluster): PublicKey {
  return cluster === "mainnet"
    ? KAMINO_USDC_VAULT_MAINNET
    : KAMINO_USDC_VAULT_DEVNET;
}

export interface KaminoRouterOpts {
  rpcUrl: string;
  /** Absolute path to the routing-authority Solana JSON keypair. */
  signerKeypairPath: string;
  /** Vaulx lender vault PDA (USDC owner). */
  vaultPda: string;
  /** Vaulx vault USDC token account (the source of the float). */
  vaultUsdcAccount: string;
  /** Kamino target vault pubkey. Must match canonicalKaminoVault(cluster). */
  kaminoVault: string;
  cluster: KaminoCluster;
  /** Default true. Set false ONLY after vault.route_idle_to_kamino ix lands. */
  dryRun?: boolean;
  /** Sum of outstanding loan principal in USDC base units (6 decimals). */
  outstandingLoansProvider: () => Promise<bigint>;
  /** Optional override for testing. */
  pollIntervalMs?: number;
}

export class KaminoRouter {
  private connection: Connection;
  private signer: Keypair;
  private vaultPda: PublicKey;
  private vaultUsdcAccount: PublicKey;
  private kaminoVault: PublicKey;
  private cluster: KaminoCluster;
  private dryRun: boolean;
  private outstandingLoansProvider: () => Promise<bigint>;
  private timer: NodeJS.Timeout | null = null;
  private inFlight = false;
  private pollIntervalMs: number;

  constructor(opts: KaminoRouterOpts) {
    // SR-1 — fail fast if the configured Kamino vault doesn't match the
    // hardcoded canonical pubkey for this cluster. Prevents an attacker who
    // can edit the indexer's env file from redirecting deposits.
    const canonical = canonicalKaminoVault(opts.cluster);
    const provided = new PublicKey(opts.kaminoVault);
    if (!provided.equals(canonical)) {
      throw new Error(
        `[kamino-router] SR-1 violation: kaminoVault=${provided.toBase58()} ` +
          `does not match canonical ${opts.cluster} vault ${canonical.toBase58()}`,
      );
    }
    if (provided.equals(PublicKey.default)) {
      throw new Error(
        `[kamino-router] no canonical Kamino USDC vault on ${opts.cluster}; ` +
          `disable the router or run on mainnet`,
      );
    }

    this.connection = new Connection(opts.rpcUrl, "confirmed");
    const secret = JSON.parse(
      fs.readFileSync(opts.signerKeypairPath, "utf-8"),
    ) as number[];
    this.signer = Keypair.fromSecretKey(Uint8Array.from(secret));
    this.vaultPda = new PublicKey(opts.vaultPda);
    this.vaultUsdcAccount = new PublicKey(opts.vaultUsdcAccount);
    this.kaminoVault = provided;
    this.cluster = opts.cluster;
    this.dryRun = opts.dryRun ?? true;
    this.outstandingLoansProvider = opts.outstandingLoansProvider;
    this.pollIntervalMs = opts.pollIntervalMs ?? POLL_INTERVAL_MS;
  }

  start(): void {
    void this.tick();
    this.timer = setInterval(() => void this.tick(), this.pollIntervalMs);
    console.log(
      `[kamino-router] started; cluster=${this.cluster} dryRun=${this.dryRun} ` +
        `vault=${this.vaultPda.toBase58()} kamino=${this.kaminoVault.toBase58()}`,
    );
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private async tick(): Promise<void> {
    if (this.inFlight) {
      console.warn("[kamino-router] previous tick still running, skipping");
      return;
    }
    this.inFlight = true;
    try {
      const idle = await this.computeIdle();
      if (idle === null) return;
      if (idle < MIN_ROUTE_AMOUNT_USDC) {
        console.log(
          `[kamino-router] idle=${idle} < MIN_ROUTE_AMOUNT — skip`,
        );
        return;
      }
      await this.deposit(idle);
    } catch (err) {
      console.error("[kamino-router] tick error:", (err as Error).message);
    } finally {
      this.inFlight = false;
    }
  }

  /**
   * Returns idle USDC available for routing, or null if balance is below the
   * outstanding-loans + headroom floor (i.e. nothing to route). Never returns
   * a negative value — under-collateralised float is impossible by design,
   * but if the math goes negative we treat it as "no idle" rather than
   * routing a partial amount.
   */
  async computeIdle(): Promise<bigint | null> {
    const balance = await this.readVaultUsdcBalance();
    if (balance === null) return null;
    const outstanding = await this.outstandingLoansProvider();
    // SR-3 — keep `outstanding * 1.1` USDC on-hand for upcoming disbursements
    // and small re-borrows. Convert through bigint to avoid float drift.
    const reserve = (outstanding * 11n) / 10n;
    if (balance <= reserve) return null;
    return balance - reserve;
  }

  /**
   * Reads the SPL token balance from the vault's USDC ATA. Returns null on
   * RPC errors — the next tick will retry.
   */
  async readVaultUsdcBalance(): Promise<bigint | null> {
    let info: AccountInfo<Buffer> | null;
    try {
      info = await this.connection.getAccountInfo(this.vaultUsdcAccount);
    } catch (err) {
      console.error(
        "[kamino-router] failed to read vault USDC account:",
        (err as Error).message,
      );
      return null;
    }
    if (!info) return null;
    // SPL token account layout: amount is at offset 64, little-endian u64.
    if (info.data.length < 72) return null;
    return info.data.readBigUInt64LE(64);
  }

  /**
   * In dry-run mode (default) this only logs the action. In live mode it
   * would build a CPI through the vault program's `route_idle_to_kamino` ix
   * — that ix does NOT exist yet, so live mode currently throws.
   */
  async deposit(amount: bigint): Promise<void> {
    if (this.dryRun) {
      console.log(
        `[kamino-router] [dry-run] would deposit ${amount} USDC to Kamino ${this.kaminoVault.toBase58()}`,
      );
      return;
    }
    // SR-2: when the live path is wired up, the deposit ix must enforce
    // min_shares_out (Kamino's slippage guard) and be PDA-signed via the
    // vault program. We refuse to mint a half-baked deposit path that
    // signs with an admin keypair; that would be a security regression.
    throw new Error(
      "[kamino-router] live mode requires vault.route_idle_to_kamino ix; not implemented",
    );
  }

  /**
   * Withdraw up to `amount` USDC from Kamino back to the lender vault PDA.
   * SR-3 ordering: the disburse path MUST call this BEFORE moving USDC out
   * of the vault. SR-4: the destination is the vault PDA, not a Vaulx
   * admin wallet.
   */
  async withdraw(amount: bigint): Promise<void> {
    if (this.dryRun) {
      console.log(
        `[kamino-router] [dry-run] would withdraw ${amount} USDC from Kamino`,
      );
      return;
    }
    throw new Error(
      "[kamino-router] live withdraw requires vault.unroute_from_kamino ix; not implemented",
    );
  }
}
