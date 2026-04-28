import { AnchorProvider, type Idl, type Program } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";

import { TRDC_PROGRAM_ID } from "./loan-accounts";

/**
 * Server-safe TRDCState reader — used by the Vaulx-hosted Metaplex metadata
 * route at `/api/trdc/[loanId]/metadata`. Lives outside the "use client" hook
 * file so it imports cleanly from a Node route handler.
 *
 * SR-6 invariant: every substantive metadata field MUST come from this
 * on-chain state, never from URL params. The route layer treats `loanId`
 * purely as a lookup key.
 */

/** TRDCState PDA on the trdc program: seeds = [b"trdc_state", loan_id]. */
export function deriveTrdcStateOnTrdcProgram(loanId: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("trdc_state"), loanId.toBuffer()],
    TRDC_PROGRAM_ID,
  );
  return pda;
}

export type TrdcStatusKey =
  | "pendingCustody"
  | "activeInCustody"
  | "active"
  | "renewed"
  | "repaid"
  | "overdue"
  | "defaulted"
  | "liquidated";

export interface TrdcState {
  loanId: PublicKey;
  loanIdBase58: string;
  /** Short prefix (first 8 chars) of loan-id base58 — for display + cNFT name. */
  loanIdShort: string;
  status: TrdcStatusKey | "unknown";
  statusName: string;
  appraisalValue: bigint;
  loanAmount: bigint;
  principalRemaining: bigint;
  rateBps: number;
  dueTs: number;
  createdAt: number;
  /** Raw 32-byte CCB hash (`doc_hash`). */
  docHash: Uint8Array;
  /** Hex-encoded `doc_hash`. */
  docHashHex: string;
  /** Short prefix (first 8 hex chars) of `doc_hash` — for display + cNFT name. */
  docHashShort: string;
  borrower: PublicKey;
  /** Bubblegum cNFT asset id; `PublicKey.default` until mint completes. */
  assetId: PublicKey;
  isMinted: boolean;
}

function bytesToHex(bytes: number[] | Uint8Array): string {
  const arr =
    bytes instanceof Uint8Array ? bytes : Uint8Array.from(bytes as number[]);
  let out = "";
  for (let i = 0; i < arr.length; i++) {
    out += arr[i].toString(16).padStart(2, "0");
  }
  return out;
}

function decodeStatus(raw: Record<string, unknown> | undefined): {
  key: TrdcStatusKey | "unknown";
  label: string;
} {
  if (!raw) return { key: "unknown", label: "Unknown" };
  const k = Object.keys(raw)[0];
  if (!k) return { key: "unknown", label: "Unknown" };
  return {
    key: k as TrdcStatusKey,
    label: k.charAt(0).toUpperCase() + k.slice(1),
  };
}

function toBig(v: unknown): bigint {
  if (v == null) return 0n;
  if (typeof v === "bigint") return v;
  if (typeof v === "number") return BigInt(v);
  if (typeof v === "string") return BigInt(v);
  if (typeof (v as { toString?: () => string }).toString === "function") {
    return BigInt((v as { toString: () => string }).toString());
  }
  return 0n;
}

/**
 * Fetch + deserialize a TRDCState account by `loanId` (base58 pubkey string).
 *
 * Returns `null` when:
 *   - `loanId` is not a valid base58 pubkey
 *   - the PDA does not exist on-chain
 *   - the account fetch fails for any other reason (rejected here so the
 *     route handler can return 404 without leaking RPC errors).
 *
 * NOTE: borrower is not stored on TRDCState directly today — fall back to
 * `PublicKey.default` and let callers attribute via the on-chain mint event
 * if they need the borrower. For metadata we surface `assetId` instead,
 * which is the durable identity of the cNFT.
 */
export async function loadTrdcState(
  connection: Connection,
  loanId: string,
): Promise<TrdcState | null> {
  let loanIdPk: PublicKey;
  try {
    loanIdPk = new PublicKey(loanId);
  } catch {
    return null;
  }

  const trdcStatePda = deriveTrdcStateOnTrdcProgram(loanIdPk);

  // Build a read-only Anchor provider — no signer needed for `.fetch`.
  const readonlyWallet = {
    publicKey: PublicKey.default,
    signTransaction: async <T,>(tx: T) => tx,
    signAllTransactions: async <T,>(txs: T[]) => txs,
  };
  const provider = new AnchorProvider(connection, readonlyWallet, {
    commitment: "confirmed",
  });

  // Lazy import keeps @vaulx/anchor-client out of the route's startup graph
  // when the URL-shape pre-check rejects malformed loan_ids.
  const { trdc: trdcFacade } = await import("@vaulx/anchor-client");
  const program = trdcFacade.program(provider) as Program<Idl>;

  let raw: Record<string, unknown> | null = null;
  try {
    raw = (await (program.account as any).trdcState.fetch(trdcStatePda)) as
      | Record<string, unknown>
      | null;
  } catch (e) {
    if (
      e instanceof Error &&
      /Account does not exist|has no data|AccountNotFound/i.test(e.message)
    ) {
      return null;
    }
    return null;
  }
  if (!raw) return null;

  const { key: statusKey, label: statusLabel } = decodeStatus(
    raw.status as Record<string, unknown> | undefined,
  );

  const docHashRaw = (raw.docHash ?? []) as number[] | Uint8Array;
  const docHash =
    docHashRaw instanceof Uint8Array
      ? docHashRaw
      : Uint8Array.from(docHashRaw);
  const docHashHex = bytesToHex(docHash);

  const assetId =
    (raw.assetId as PublicKey | undefined) ?? PublicKey.default;
  const isMinted = !assetId.equals(PublicKey.default);

  const loanIdBase58 = loanIdPk.toBase58();

  return {
    loanId: loanIdPk,
    loanIdBase58,
    loanIdShort: loanIdBase58.slice(0, 8),
    status: statusKey,
    statusName: statusLabel,
    appraisalValue: toBig(raw.appraisalValue),
    loanAmount: toBig(raw.loanAmount),
    principalRemaining: toBig(raw.principalRemaining),
    rateBps: Number(toBig(raw.rateBps)),
    dueTs: Number(toBig(raw.dueTs)),
    createdAt: Number(toBig(raw.createdAt)),
    docHash,
    docHashHex,
    docHashShort: docHashHex.slice(0, 8),
    borrower: PublicKey.default, // not stored on TRDCState; see fn doc
    assetId,
    isMinted,
  };
}
