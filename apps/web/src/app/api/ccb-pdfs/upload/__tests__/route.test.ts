// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createPrivateKey, sign as cryptoSign } from "node:crypto";
import { Keypair } from "@solana/web3.js";
import { utils } from "@coral-xyz/anchor";

const ED25519_PKCS8_PREFIX = Buffer.from(
  "302e020100300506032b657004220420",
  "hex",
);

function signEd25519(message: Uint8Array, kp: Keypair): Uint8Array {
  const seed = kp.secretKey.slice(0, 32);
  const pkcs8 = Buffer.concat([ED25519_PKCS8_PREFIX, Buffer.from(seed)]);
  const keyObject = createPrivateKey({
    key: pkcs8,
    format: "der",
    type: "pkcs8",
  });
  const sig = cryptoSign(null, Buffer.from(message), keyObject);
  return new Uint8Array(sig);
}

const uploadMock = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    storage: {
      from: () => ({ upload: uploadMock }),
    },
  }),
}));

vi.mock("@/lib/sumsub/attestation", () => ({
  derivePda: () => ({ toBase58: () => "FakeKycPda1111111111111111111111111111111" }),
}));

const getAccountInfoMock = vi.fn();
vi.mock("@solana/web3.js", async () => {
  const actual = await vi.importActual<typeof import("@solana/web3.js")>(
    "@solana/web3.js",
  );
  return {
    ...actual,
    Connection: class {
      constructor() {}
      getAccountInfo = getAccountInfoMock;
    },
  };
});

import { POST } from "../route";

const PDF_MAGIC = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]); // "%PDF-"

function buildPdf(extra = 16): Uint8Array {
  const tail = new Uint8Array(extra);
  for (let i = 0; i < extra; i++) tail[i] = (i * 7) & 0xff;
  const out = new Uint8Array(PDF_MAGIC.length + extra);
  out.set(PDF_MAGIC, 0);
  out.set(tail, PDF_MAGIC.length);
  return out;
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const ab = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(ab).set(bytes);
  const buf = await crypto.subtle.digest("SHA-256", ab);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

interface ReqOpts {
  walletPubB58?: string;
  loanId?: string;
  pdf?: Uint8Array;
  sha256?: string;
  signerKp?: Keypair; // who actually signs
  signerPubB58?: string; // wallet field override (defaults to signer's pub)
  timestamp?: number;
  signature?: string; // explicit override
  omit?: Array<"wallet" | "loanId" | "sha256" | "signature" | "timestamp" | "pdfBytes">;
}

async function buildRequest(opts: ReqOpts = {}): Promise<Request> {
  const signerKp = opts.signerKp ?? Keypair.generate();
  const walletField = opts.walletPubB58 ?? signerKp.publicKey.toBase58();
  const loanId = opts.loanId ?? Keypair.generate().publicKey.toBase58();
  const pdf = opts.pdf ?? buildPdf();
  const hash = opts.sha256 ?? (await sha256Hex(pdf));
  const ts = (opts.timestamp ?? Math.floor(Date.now() / 1000)).toString();

  const canonical = `vaulx:ccb-upload\n${walletField}\n${loanId}\n${hash}\n${ts}`;
  const msgBytes = new TextEncoder().encode(canonical);
  const sigBytes = signEd25519(msgBytes, signerKp);
  const signature =
    opts.signature ?? utils.bytes.bs58.encode(Buffer.from(sigBytes));

  const form = new FormData();
  const omit = new Set(opts.omit ?? []);
  if (!omit.has("wallet")) form.append("wallet", walletField);
  if (!omit.has("loanId")) form.append("loanId", loanId);
  if (!omit.has("sha256")) form.append("sha256", hash);
  if (!omit.has("signature")) form.append("signature", signature);
  if (!omit.has("timestamp")) form.append("timestamp", ts);
  if (!omit.has("pdfBytes")) {
    const pdfCopy = new Uint8Array(pdf.byteLength);
    pdfCopy.set(pdf);
    form.append(
      "pdfBytes",
      new Blob([pdfCopy.buffer], { type: "application/pdf" }),
      "ccb.pdf",
    );
  }

  return new Request("http://localhost/api/ccb-pdfs/upload", {
    method: "POST",
    body: form,
  });
}

beforeEach(() => {
  uploadMock.mockReset();
  uploadMock.mockResolvedValue({ data: { path: "x" }, error: null });
  getAccountInfoMock.mockReset();
  delete process.env.NEXT_PUBLIC_CCB_KYC_GATE;
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
});

afterEach(() => {
  vi.unstubAllEnvs?.();
});

describe("POST /api/ccb-pdfs/upload", () => {
  it("200 happy path — uploads to <wallet>/<loanId>.pdf and returns path", async () => {
    const signerKp = Keypair.generate();
    const loanId = Keypair.generate().publicKey.toBase58();
    const req = await buildRequest({ signerKp, loanId });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = (await res.json()) as { ok: boolean; path: string };
    expect(json.ok).toBe(true);
    expect(json.path).toBe(
      `ccb-pdfs/${signerKp.publicKey.toBase58()}/${loanId}.pdf`,
    );
    expect(uploadMock).toHaveBeenCalledTimes(1);
    const [calledPath, , opts] = uploadMock.mock.calls[0];
    expect(calledPath).toBe(`${signerKp.publicKey.toBase58()}/${loanId}.pdf`);
    expect(opts).toMatchObject({ contentType: "application/pdf", upsert: true });
  });

  it("408 stale_timestamp when |now - ts| > 300s", async () => {
    const stale = Math.floor(Date.now() / 1000) - 301;
    const req = await buildRequest({ timestamp: stale });
    const res = await POST(req);
    expect(res.status).toBe(408);
    expect((await res.json()).error).toBe("stale_timestamp");
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it("413 file_too_large for oversize pdf", async () => {
    const big = new Uint8Array(5 * 1024 * 1024 + 1);
    big.set(PDF_MAGIC, 0);
    const req = await buildRequest({ pdf: big });
    const res = await POST(req);
    expect(res.status).toBe(413);
    expect((await res.json()).error).toBe("file_too_large");
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it("415 invalid_pdf when magic bytes are wrong", async () => {
    const bogus = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00]); // ZIP header
    const req = await buildRequest({ pdf: bogus });
    const res = await POST(req);
    expect(res.status).toBe(415);
    expect((await res.json()).error).toBe("invalid_pdf");
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it("400 hash_mismatch when client-claimed sha256 disagrees", async () => {
    const req = await buildRequest({ sha256: "0".repeat(64) });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("hash_mismatch");
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it("401 bad_signature when signer != wallet field", async () => {
    const realSigner = Keypair.generate();
    const claimedWallet = Keypair.generate().publicKey.toBase58();
    const req = await buildRequest({
      signerKp: realSigner,
      walletPubB58: claimedWallet,
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe("bad_signature");
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it("401 bad_signature for malformed signature blob", async () => {
    const req = await buildRequest({ signature: "not-base58!" });
    const res = await POST(req);
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe("bad_signature");
  });

  it("400 missing_fields when wallet absent", async () => {
    const req = await buildRequest({ omit: ["wallet"] });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("missing_fields");
  });

  it("400 missing_fields when loanId absent", async () => {
    const req = await buildRequest({ omit: ["loanId"] });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("missing_fields");
  });

  it("400 missing_fields when pdfBytes absent", async () => {
    const req = await buildRequest({ omit: ["pdfBytes"] });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("missing_fields");
  });

  it("400 invalid_wallet for non-base58 wallet", async () => {
    const req = await buildRequest({ walletPubB58: "not-a-pubkey" });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("invalid_wallet");
  });

  it("KYC gate ON + missing attestation → 403", async () => {
    process.env.NEXT_PUBLIC_CCB_KYC_GATE = "true";
    getAccountInfoMock.mockResolvedValue(null);
    const req = await buildRequest();
    const res = await POST(req);
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe("kyc_required");
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it("KYC gate ON + attestation present → 200", async () => {
    process.env.NEXT_PUBLIC_CCB_KYC_GATE = "true";
    getAccountInfoMock.mockResolvedValue({ lamports: 1, data: new Uint8Array() });
    const req = await buildRequest();
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(uploadMock).toHaveBeenCalledTimes(1);
  });

  it("KYC gate OFF (flag unset) → KYC RPC not called", async () => {
    const req = await buildRequest();
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(getAccountInfoMock).not.toHaveBeenCalled();
  });

  it("500 persist_failed when Supabase upload errors", async () => {
    uploadMock.mockResolvedValue({
      data: null,
      error: { message: "boom service-role" },
    });
    const req = await buildRequest();
    const res = await POST(req);
    expect(res.status).toBe(500);
    const json = (await res.json()) as { error: string };
    expect(json.error).toBe("persist_failed");
    // Do not leak service-role error text.
    expect(JSON.stringify(json)).not.toMatch(/service-role/);
  });
});
