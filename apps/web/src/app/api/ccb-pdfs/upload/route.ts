import { NextResponse } from "next/server";
import { createPublicKey, verify as cryptoVerify } from "node:crypto";
import { PublicKey, Connection } from "@solana/web3.js";
import { BorshAccountsCoder, utils, type Idl } from "@coral-xyz/anchor";
import { vaultIdl } from "@vaulx/idls";
import { createClient } from "@supabase/supabase-js";

import { derivePda as deriveKycAttestationPda } from "@/lib/sumsub/attestation";

const kycCoder = new BorshAccountsCoder(vaultIdl as unknown as Idl);

// SPKI DER prefix for a raw 32-byte ed25519 public key, per RFC 8410.
const ED25519_SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");

function verifyEd25519(
  message: Uint8Array,
  signature: Uint8Array,
  rawPubkey: Uint8Array,
): boolean {
  if (signature.length !== 64 || rawPubkey.length !== 32) return false;
  try {
    const spki = Buffer.concat([ED25519_SPKI_PREFIX, Buffer.from(rawPubkey)]);
    const keyObject = createPublicKey({ key: spki, format: "der", type: "spki" });
    return cryptoVerify(null, Buffer.from(message), keyObject, Buffer.from(signature));
  } catch {
    return false;
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/ccb-pdfs/upload
 *
 * Server-mediated, wallet-signature-authenticated CCB PDF upload. Replaces the
 * previous client-side anon-key upload which is denied by the `ccb-pdfs`
 * bucket's RLS policy (no anon access). See
 * `docs/plans/2026-05-14-ccb-storage-fix-spec.md`.
 *
 * Body (multipart/form-data):
 *   - wallet     — base58 wallet pubkey
 *   - loanId     — base58 loan PDA pubkey
 *   - pdfBytes   — application/pdf file
 *   - sha256     — lowercase hex of SHA-256(pdfBytes) claimed by the client
 *   - signature  — base58 ed25519 signature over the canonical payload
 *   - timestamp  — unix-seconds the client minted the request (string)
 *
 * Canonical payload (UTF-8, LF separators):
 *   vaulx:ccb-upload\n<wallet>\n<loanId>\n<sha256-hex>\n<timestamp>
 */

const MAX_BYTES = 5 * 1024 * 1024;
const FRESHNESS_WINDOW_SEC = 300;
const NAMESPACE = "vaulx:ccb-upload";
const BUCKET = "ccb-pdfs";

function bad(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

function bytesToHex(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, "0");
  }
  return out;
}

function decodeBase58(value: string): Uint8Array | null {
  try {
    const decoded = utils.bytes.bs58.decode(value);
    return new Uint8Array(decoded);
  } catch {
    return null;
  }
}

function parsePublicKey(value: string): PublicKey | null {
  try {
    return new PublicKey(value);
  } catch {
    return null;
  }
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const ab = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(ab).set(bytes);
  const buf = await crypto.subtle.digest("SHA-256", ab);
  return bytesToHex(new Uint8Array(buf));
}

function isKycGateEnabled(): boolean {
  const flag = process.env.NEXT_PUBLIC_CCB_KYC_GATE;
  return typeof flag === "string" && flag.toLowerCase() === "true";
}

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return bad(400, "invalid_form");
  }

  const wallet = form.get("wallet");
  const loanId = form.get("loanId");
  const signature = form.get("signature");
  const timestamp = form.get("timestamp");
  const claimedHash = form.get("sha256");
  const pdfField = form.get("pdfBytes");

  if (
    typeof wallet !== "string" ||
    typeof loanId !== "string" ||
    typeof signature !== "string" ||
    typeof timestamp !== "string" ||
    typeof claimedHash !== "string" ||
    !(pdfField instanceof Blob)
  ) {
    return bad(400, "missing_fields");
  }

  const walletPk = parsePublicKey(wallet);
  if (!walletPk) return bad(400, "invalid_wallet");

  const loanIdPk = parsePublicKey(loanId);
  if (!loanIdPk) return bad(400, "invalid_loan_id");

  // 1. Freshness
  const nowSec = Math.floor(Date.now() / 1000);
  const tsNum = Number(timestamp);
  if (!Number.isFinite(tsNum) || Math.abs(nowSec - tsNum) > FRESHNESS_WINDOW_SEC) {
    return bad(408, "stale_timestamp");
  }

  // 2. PDF size cap
  if (pdfField.size > MAX_BYTES) {
    return bad(413, "file_too_large");
  }

  const pdfBuf = new Uint8Array(await pdfField.arrayBuffer());
  if (pdfBuf.length > MAX_BYTES) {
    return bad(413, "file_too_large");
  }

  // 3. PDF magic-byte sniff: %PDF-
  if (
    pdfBuf.length < 5 ||
    pdfBuf[0] !== 0x25 ||
    pdfBuf[1] !== 0x50 ||
    pdfBuf[2] !== 0x44 ||
    pdfBuf[3] !== 0x46 ||
    pdfBuf[4] !== 0x2d
  ) {
    return bad(415, "invalid_pdf");
  }

  // 4. SHA-256 recompute vs client-claimed
  const recomputedHash = await sha256Hex(pdfBuf);
  if (recomputedHash !== claimedHash.toLowerCase()) {
    return bad(400, "hash_mismatch");
  }

  // 5. Ed25519 signature verification
  const sigBytes = decodeBase58(signature);
  if (!sigBytes || sigBytes.length !== 64) {
    return bad(401, "bad_signature");
  }
  const canonical =
    `${NAMESPACE}\n${wallet}\n${loanId}\n${recomputedHash}\n${timestamp}`;
  const msgBytes = new TextEncoder().encode(canonical);
  if (!verifyEd25519(msgBytes, sigBytes, walletPk.toBytes())) {
    return bad(401, "bad_signature");
  }

  // 6. Optional KYC gate (on-chain attestation PDA existence + freshness)
  if (isKycGateEnabled()) {
    let accountData: Buffer | null = null;
    try {
      const rpc =
        process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
      const conn = new Connection(rpc, "confirmed");
      const pda = deriveKycAttestationPda(walletPk);
      const info = await conn.getAccountInfo(pda);
      if (!info) {
        return bad(403, "kyc_required");
      }
      accountData = Buffer.from(info.data);
    } catch {
      return bad(403, "kyc_required");
    }

    const maxAgeDaysRaw = process.env.KYC_MAX_AGE_DAYS;
    if (maxAgeDaysRaw !== undefined) {
      const maxAgeDays = parseInt(maxAgeDaysRaw, 10);
      if (!Number.isFinite(maxAgeDays) || maxAgeDays <= 0) {
        return bad(403, "kyc_required");
      }
      let attestedAtSec: number;
      try {
        const decoded = kycCoder.decode<Record<string, unknown>>(
          "KycAttestation",
          accountData,
        );
        const raw = (decoded.attested_at ?? decoded.attestedAt) as
          | { toNumber?: () => number }
          | bigint
          | number
          | undefined;
        if (typeof raw === "number") {
          attestedAtSec = raw;
        } else if (typeof raw === "bigint") {
          attestedAtSec = Number(raw);
        } else if (raw && typeof raw.toNumber === "function") {
          attestedAtSec = raw.toNumber();
        } else {
          attestedAtSec = Number(raw);
        }
        if (!Number.isFinite(attestedAtSec)) {
          return bad(403, "kyc_required");
        }
      } catch {
        return bad(403, "kyc_required");
      }
      const nowSec = Math.floor(Date.now() / 1000);
      if (nowSec - attestedAtSec > maxAgeDays * 86_400) {
        return bad(403, "kyc_stale");
      }
    }
  }

  // 7. Persist via service-role Supabase client
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error("[ccb-pdfs/upload] missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
    return NextResponse.json(
      { ok: false, error: "persist_failed" },
      { status: 500 },
    );
  }
  const client = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const objectPath = `${wallet}/${loanId}.pdf`;
  const { error } = await client.storage
    .from(BUCKET)
    .upload(objectPath, pdfBuf, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (error) {
    console.error("[ccb-pdfs/upload] upload failed", {
      wallet: wallet.slice(0, 8),
      loanId: loanId.slice(0, 8),
      msg: error.message,
    });
    return NextResponse.json(
      { ok: false, error: "persist_failed" },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { ok: true, path: `${BUCKET}/${objectPath}` },
    { status: 200 },
  );
}
