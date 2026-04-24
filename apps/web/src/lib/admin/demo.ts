/**
 * Shared server-side helpers for the /admin/demo cockpit routes.
 *
 * Each route under `/api/admin/demo/*` runs in the Node runtime and needs the
 * same bootstrapping sequence:
 *
 *   1. Load the devnet USDC mint (`scripts/dev/devnet-usdc.json`).
 *   2. Load the gitignored demo wallets (`scripts/dev/demo-wallets.json`)
 *      seeded by `pnpm seed:usdc`.
 *   3. Load the operator keypair from `~/.config/solana/id.json` as the fee
 *      payer + Anchor provider wallet.
 *   4. Build a single `AnchorProvider` + typed `Program` handles for the four
 *      programs we interact with (vault, loan, trdc, auction).
 *
 * The cockpit is a local-only surface — none of these files exist on Vercel.
 * We throw `DemoEnvError` with a helpful `detail` so the route can translate
 * it to a 503 response.
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
  const payerFile = path.join(os.homedir(), ".config", "solana", "id.json");

  if (!fs.existsSync(mintFile)) {
    throw new DemoEnvError(
      `Missing ${path.relative(root, mintFile)}. Run \`pnpm seed:usdc\` first.`,
    );
  }
  if (!fs.existsSync(walletsFile)) {
    throw new DemoEnvError(
      `Missing ${path.relative(root, walletsFile)}. Run \`pnpm seed:usdc\` first.`,
    );
  }
  if (!fs.existsSync(payerFile)) {
    throw new DemoEnvError(`Missing payer keypair at ${payerFile}`);
  }

  const usdcMint = new PublicKey(readJson<{ mint: string }>(mintFile).mint);
  const demoWalletsRaw = readJson<DemoWallet[]>(walletsFile);
  if (demoWalletsRaw.length < 4) {
    throw new DemoEnvError(
      `demo-wallets.json has ${demoWalletsRaw.length} entries; need >= 4 (lender, borrower, custodian, bidder). Re-run seed:usdc.`,
    );
  }
  const demoWallets = demoWalletsRaw.map((w) =>
    Keypair.fromSecretKey(new Uint8Array(w.secretKey)),
  );

  const payer = Keypair.fromSecretKey(
    new Uint8Array(readJson<number[]>(payerFile)),
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
