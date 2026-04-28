import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Keypair, PublicKey } from "@solana/web3.js";
import {
  KaminoRouter,
  canonicalKaminoVault,
} from "../kamino-router.js";

// We exercise the router as a unit — RPC and SDK calls are mocked through
// method overrides on the instance. The constructor still reads a real
// keypair from disk, so we materialise a throwaway one in tmp.

let signerPath: string;

beforeAll(() => {
  const kp = Keypair.generate();
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "kamino-router-test-"));
  signerPath = path.join(tmp, "signer.json");
  fs.writeFileSync(signerPath, JSON.stringify(Array.from(kp.secretKey)));
});

afterAll(() => {
  try {
    fs.rmSync(path.dirname(signerPath), { recursive: true, force: true });
  } catch {
    // best-effort cleanup
  }
});

const VAULT_PDA = Keypair.generate().publicKey.toBase58();
const VAULT_USDC = Keypair.generate().publicKey.toBase58();
const MAINNET_VAULT = canonicalKaminoVault("mainnet").toBase58();

function makeRouter(opts: {
  dryRun?: boolean;
  outstanding?: bigint;
  pollIntervalMs?: number;
} = {}): KaminoRouter {
  return new KaminoRouter({
    rpcUrl: "http://localhost:8899",
    signerKeypairPath: signerPath,
    vaultPda: VAULT_PDA,
    vaultUsdcAccount: VAULT_USDC,
    kaminoVault: MAINNET_VAULT,
    cluster: "mainnet",
    dryRun: opts.dryRun ?? true,
    outstandingLoansProvider: async () => opts.outstanding ?? 0n,
    pollIntervalMs: opts.pollIntervalMs ?? 60_000,
  });
}

describe("KaminoRouter", () => {
  it("dry-run mode logs but does not execute on-chain", async () => {
    const router = makeRouter({ dryRun: true });
    // 5_000 USDC float, no outstanding loans
    vi.spyOn(router, "readVaultUsdcBalance").mockResolvedValue(
      5_000_000_000n,
    );
    const log = vi.spyOn(console, "log").mockImplementation(() => {});

    await router.deposit(5_000_000_000n);

    const messages = log.mock.calls.map((c) => String(c[0]));
    expect(
      messages.some((m) => m.includes("[dry-run] would deposit")),
    ).toBe(true);
    log.mockRestore();
  });

  it("idle below MIN_ROUTE_AMOUNT skips routing", async () => {
    const router = makeRouter({ dryRun: true });
    // 50 USDC, below the 100 USDC minimum
    vi.spyOn(router, "readVaultUsdcBalance").mockResolvedValue(
      50_000_000n,
    );
    const depositSpy = vi.spyOn(router, "deposit");
    const log = vi.spyOn(console, "log").mockImplementation(() => {});

    // Drive one tick directly via the public surface: start() then stop().
    // We don't want the interval, just the prompt tick.
    await (router as unknown as { tick: () => Promise<void> }).tick();

    expect(depositSpy).not.toHaveBeenCalled();
    log.mockRestore();
  });

  it("rejects a kaminoVault that does not match the canonical pubkey (SR-1)", () => {
    const attackerVault = Keypair.generate().publicKey.toBase58();
    expect(
      () =>
        new KaminoRouter({
          rpcUrl: "http://localhost:8899",
          signerKeypairPath: signerPath,
          vaultPda: VAULT_PDA,
          vaultUsdcAccount: VAULT_USDC,
          kaminoVault: attackerVault,
          cluster: "mainnet",
          dryRun: true,
          outstandingLoansProvider: async () => 0n,
        }),
    ).toThrowError(/SR-1/);
  });

  it("computeIdle returns null when outstanding * 1.1 exceeds balance", async () => {
    // balance = 1_000 USDC, outstanding = 1_000 USDC → reserve = 1_100,
    // balance < reserve → null (no idle to route).
    const router = makeRouter({ outstanding: 1_000_000_000n });
    vi.spyOn(router, "readVaultUsdcBalance").mockResolvedValue(
      1_000_000_000n,
    );
    const idle = await router.computeIdle();
    expect(idle).toBeNull();
  });
});
