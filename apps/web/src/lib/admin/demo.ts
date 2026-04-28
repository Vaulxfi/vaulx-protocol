/**
 * Shared server-side helpers for the /admin/demo cockpit routes.
 *
 * Each route under `/api/admin/demo/*` runs in the Node runtime and needs the
 * same bootstrapping sequence:
 *
 *   1. Load the devnet USDC mint (`scripts/dev/devnet-usdc.json`).
 *   2. Load the gitignored demo wallets (`scripts/dev/demo-wallets.json`)
 *      seeded by `pnpm seed:usdc`.
 *   3. Load the operator keypair via `loadOperatorKeypair()` — first from the
 *      `OPERATOR_KEYPAIR_JSON` env var (Vercel-friendly), then falling back
 *      to `~/.config/solana/id.json` for local dev.
 *   4. Build a single `AnchorProvider` + typed `Program` handles for the four
 *      programs we interact with (vault, loan, trdc, auction).
 *
 * The cockpit is a local-only surface unless `OPERATOR_KEYPAIR_JSON` is set
 * (and `NEXT_PUBLIC_USDC_MINT` is populated for the public demo routes that
 * skip the demo-wallets file). On 503 we surface the missing piece via
 * `demoErrorResponse`.
 *
 * Auth pattern matches `/api/admin/tests/stream`: if
 * `NEXT_PUBLIC_VAULX_ADMIN_PUBKEY` is set we require a matching cookie or
 * header, otherwise the route is open (demo mode).
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  AnchorProvider,
  Program,
  Wallet,
  type Idl,
} from "@coral-xyz/anchor";
import {
  Connection,
  Keypair,
  PublicKey,
  type Commitment,
} from "@solana/web3.js";
import {
  auction as auctionFacade,
  loan as loanFacade,
  trdc as trdcFacade,
  vault as vaultFacade,
} from "@vaulx/anchor-client";

export type DemoWallet = { name: string; secretKey: number[]; pubkey: string };

const COMMITMENT: Commitment = "confirmed";

export class DemoEnvError extends Error {
  status: number;
  detail: string;
  constructor(message: string, status = 503) {
    super(message);
    this.status = status;
    this.detail = message;
  }
}

export type DemoEnv = {
  conn: Connection;
  payer: Keypair;
  /** Demo wallet keypairs, indexed: 0=lender, 1=borrower, 2=custodian, 3=bidder. */
  demoWallets: Keypair[];
  demoWalletsRaw: DemoWallet[];
  usdcMint: PublicKey;
  provider: AnchorProvider;
  vaultProgram: Program<Idl>;
  loanProgram: Program<Idl>;
  trdcProgram: Program<Idl>;
  auctionProgram: Program<Idl>;
  vaultProgramId: PublicKey;
  loanProgramId: PublicKey;
  trdcProgramId: PublicKey;
  auctionProgramId: PublicKey;
};

function repoRoot(): string {
  // Server CWD when Next.js runs dev/build is `apps/web/`. Walk up two levels.
  return path.resolve(process.cwd(), "..", "..");
}

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(file, "utf8")) as T;
}

/**
 * Resolve the operator keypair (loan admin + USDC mint authority on Devnet).
 *
 * Resolution order:
 *   1. `OPERATOR_KEYPAIR_JSON` env var — JSON-array form (e.g. "[12,34,...]").
 *      This is what we set in Vercel; lets server routes that need the admin
 *      key (`/api/demo/provision-loan`, `/api/demo/faucet-usdc`, the
 *      `/api/admin/demo/*` cockpit) work without filesystem access.
 *   2. `~/.config/solana/id.json` — Solana CLI default; preserves existing
 *      local-dev behavior.
 *
 * Throws `DemoEnvError` if neither source is available. Devnet-only — the
 * upgrade authority for all 4 programs lives on the Squads V4 vault PDA per
 * commit `5e90d81`, so this key only carries program-admin + mint-authority
 * permissions, not upgrade authority.
 */
let _operatorKeypairCache: Keypair | null = null;
let _operatorKeypairCacheKey: string | null = null;

export function loadOperatorKeypair(): Keypair {
  const envSecret = process.env.OPERATOR_KEYPAIR_JSON?.trim();
  if (envSecret) {
    if (_operatorKeypairCache && _operatorKeypairCacheKey === envSecret) {
      return _operatorKeypairCache;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(envSecret);
    } catch (e) {
      throw new DemoEnvError(
        `OPERATOR_KEYPAIR_JSON is not valid JSON: ${(e as Error).message}`,
      );
    }
    if (!Array.isArray(parsed) || parsed.some((n) => typeof n !== "number")) {
      throw new DemoEnvError(
        "OPERATOR_KEYPAIR_JSON must be a JSON array of bytes (e.g. [12,34,...]).",
      );
    }
    try {
      const kp = Keypair.fromSecretKey(new Uint8Array(parsed as number[]));
      _operatorKeypairCache = kp;
      _operatorKeypairCacheKey = envSecret;
      return kp;
    } catch (e) {
      throw new DemoEnvError(
        `OPERATOR_KEYPAIR_JSON could not be parsed as a Solana keypair: ${(e as Error).message}`,
      );
    }
  }

  const payerFile = path.join(os.homedir(), ".config", "solana", "id.json");
  if (!fs.existsSync(payerFile)) {
    throw new DemoEnvError(
      `Operator keypair not found. Set OPERATOR_KEYPAIR_JSON env var (recommended for Vercel) or place a Solana CLI keypair at ${payerFile}.`,
    );
  }
  const cacheKey = `file:${payerFile}`;
  if (_operatorKeypairCache && _operatorKeypairCacheKey === cacheKey) {
    return _operatorKeypairCache;
  }
  const kp = Keypair.fromSecretKey(
    new Uint8Array(readJson<number[]>(payerFile)),
  );
  _operatorKeypairCache = kp;
  _operatorKeypairCacheKey = cacheKey;
  return kp;
}

/** Express `{ ok: false, detail, ... }` on expected env failures. */
export function demoErrorResponse(err: unknown): Response {
  if (err instanceof DemoEnvError) {
    return Response.json(
      { ok: false, detail: err.detail },
      { status: err.status },
    );
  }
  const detail =
    err instanceof Error
      ? `${err.name}: ${err.message}`
      : typeof err === "string"
        ? err
        : "Unexpected error";
  return Response.json({ ok: false, detail }, { status: 500 });
}

/** Enforce the same cookie/header gate used by /api/admin/tests/stream. */
export function checkAdminAuth(req: Request): Response | null {
  const adminPubkey = process.env.NEXT_PUBLIC_VAULX_ADMIN_PUBKEY?.trim();
  if (!adminPubkey) return null; // open demo mode
  const cookieHeader = req.headers.get("cookie") ?? "";
  const headerToken = req.headers.get("x-vaulx-admin")?.trim() ?? "";
  const cookieMatch = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("vaulx-admin="));
  const cookieToken = cookieMatch
    ? decodeURIComponent(cookieMatch.slice("vaulx-admin=".length))
    : "";
  const provided = headerToken || cookieToken;
  if (provided !== adminPubkey) {
    return Response.json({ ok: false, detail: "unauthorized" }, { status: 401 });
  }
  return null;
}

export async function loadDemoEnv(): Promise<DemoEnv> {
  const root = repoRoot();
  const mintFile = path.join(root, "scripts", "dev", "devnet-usdc.json");
  const walletsFile = path.join(root, "scripts", "dev", "demo-wallets.json");

  // Operator keypair: prefer env var (Vercel), fall back to ~/.config/solana/id.json.
  const payer = loadOperatorKeypair();

  // USDC mint: prefer the file (local dev with seeded wallets), fall back to
  // NEXT_PUBLIC_USDC_MINT (Vercel where the file isn't present).
  let usdcMint: PublicKey;
  if (fs.existsSync(mintFile)) {
    usdcMint = new PublicKey(readJson<{ mint: string }>(mintFile).mint);
  } else if (process.env.NEXT_PUBLIC_USDC_MINT?.trim()) {
    usdcMint = new PublicKey(process.env.NEXT_PUBLIC_USDC_MINT.trim());
  } else {
    throw new DemoEnvError(
      `Missing ${path.relative(root, mintFile)} and NEXT_PUBLIC_USDC_MINT is unset. Run \`pnpm seed:usdc\` locally or set the env var on Vercel.`,
    );
  }

  // demo-wallets.json is local-only — the cockpit needs it; the public
  // /api/demo/* routes don't, so they should call the lower-level helpers
  // (loadOperatorKeypair) directly instead of loadDemoEnv.
  if (!fs.existsSync(walletsFile)) {
    throw new DemoEnvError(
      `Missing ${path.relative(root, walletsFile)}. Run \`pnpm seed:usdc\` first.`,
    );
  }
  const demoWalletsRaw = readJson<DemoWallet[]>(walletsFile);
  if (demoWalletsRaw.length < 4) {
    throw new DemoEnvError(
      `demo-wallets.json has ${demoWalletsRaw.length} entries; need >= 4 (lender, borrower, custodian, bidder). Re-run seed:usdc.`,
    );
  }
  const demoWallets = demoWalletsRaw.map((w) =>
    Keypair.fromSecretKey(new Uint8Array(w.secretKey)),
  );

  const rpc = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
  const conn = new Connection(rpc, COMMITMENT);

  const provider = new AnchorProvider(conn, new Wallet(payer), {
    commitment: COMMITMENT,
  });

  const vaultProgramId = new PublicKey(vaultFacade.programId);
  const loanProgramId = new PublicKey(loanFacade.programId);
  const trdcProgramId = new PublicKey(trdcFacade.programId);
  const auctionProgramId = new PublicKey(auctionFacade.programId);

  return {
    conn,
    payer,
    demoWallets,
    demoWalletsRaw,
    usdcMint,
    provider,
    vaultProgram: vaultFacade.program(provider) as Program<Idl>,
    loanProgram: loanFacade.program(provider) as Program<Idl>,
    trdcProgram: trdcFacade.program(provider) as Program<Idl>,
    auctionProgram: auctionFacade.program(provider) as Program<Idl>,
    vaultProgramId,
    loanProgramId,
    trdcProgramId,
    auctionProgramId,
  };
}

// ---------------------------------------------------------------------------
// PDA helpers (server-side copies — we don't want to import from `./chain/*`
// because those files are marked "use client").
// ---------------------------------------------------------------------------

export function deriveVaultPda(
  assetMint: PublicKey,
  programId: PublicKey,
): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), assetMint.toBuffer()],
    programId,
  )[0];
}

export function deriveVaultConfigPda(programId: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vault_config")],
    programId,
  )[0];
}

export function deriveLoanConfigPda(programId: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("loan_config")],
    programId,
  )[0];
}

export function deriveLoanAuthorityPda(programId: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("loan_authority")],
    programId,
  )[0];
}

export function deriveTrdcStatePda(
  loanId: PublicKey,
  programId: PublicKey,
): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("trdc_state"), loanId.toBuffer()],
    programId,
  )[0];
}

export function deriveAuctionPda(
  trdcState: PublicKey,
  programId: PublicKey,
): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("auction"), trdcState.toBuffer()],
    programId,
  )[0];
}

export function deriveAuctionAuthorityPda(programId: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("auction_authority")],
    programId,
  )[0];
}
