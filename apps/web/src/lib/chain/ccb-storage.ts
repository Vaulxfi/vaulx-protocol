"use client";

import type { PublicKey } from "@solana/web3.js";
import { utils } from "@coral-xyz/anchor";

/**
 * Server-mediated CCB PDF upload. The client signs a canonical payload with
 * the connected wallet; the server (`/api/ccb-pdfs/upload`) re-verifies the
 * signature + bytes and persists with the Supabase service-role key.
 *
 * Best-effort: callers must wrap in try/catch and treat failure as non-fatal
 * (task 2.8 demo flow).
 */
export interface UploadCcbPdfArgs {
  wallet: PublicKey;
  signMessage: (msg: Uint8Array) => Promise<Uint8Array>;
  loanId: string;
  pdfBytes: Uint8Array;
}

const NAMESPACE = "vaulx:ccb-upload";

function bytesToHex(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, "0");
  }
  return out;
}

export async function uploadCcbPdf(
  args: UploadCcbPdfArgs,
): Promise<{ path: string }> {
  const { wallet, signMessage, loanId, pdfBytes } = args;
  const walletStr = wallet.toBase58();

  // Copy into a fresh ArrayBuffer to satisfy `crypto.subtle.digest` typings
  // regardless of the underlying Uint8Array's offset/length view.
  const ab = new ArrayBuffer(pdfBytes.byteLength);
  const copy = new Uint8Array(ab);
  copy.set(pdfBytes);
  const digestBuf = await crypto.subtle.digest("SHA-256", ab);
  const sha256 = bytesToHex(new Uint8Array(digestBuf));

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const canonical = `${NAMESPACE}\n${walletStr}\n${loanId}\n${sha256}\n${timestamp}`;
  const msgBytes = new TextEncoder().encode(canonical);
  const sigBytes = await signMessage(msgBytes);
  const signature = utils.bytes.bs58.encode(Buffer.from(sigBytes));

  const form = new FormData();
  form.append("wallet", walletStr);
  form.append("loanId", loanId);
  form.append("sha256", sha256);
  form.append("signature", signature);
  form.append("timestamp", timestamp);
  form.append(
    "pdfBytes",
    new Blob([ab], { type: "application/pdf" }),
    `${loanId}.pdf`,
  );

  const res = await fetch("/api/ccb-pdfs/upload", {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const json = (await res.json()) as { error?: string };
      if (json?.error) detail = `${detail} ${json.error}`;
    } catch {
      /* ignore */
    }
    throw new Error(`CCB upload failed: ${detail}`);
  }

  const json = (await res.json()) as { ok: boolean; path: string };
  return { path: json.path };
}
