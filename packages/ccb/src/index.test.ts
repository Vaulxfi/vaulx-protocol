import { describe, it, expect } from "vitest";
import { generateCcbPdf, hashCcb, type CcbInput } from "./index";

const FIXTURE: CcbInput = {
  borrowerName: "Joao da Silva",
  borrowerCpf: "123.456.789-00",
  lenderName: "Vaulx Lending - Demo Vault",
  custodianName: "Vaulx Custody SA",

  watchMake: "Rolex",
  watchModel: "Submariner Date",
  watchRef: "116610LN",
  watchYear: 2020,
  watchCondition: "excellent",

  appraisalValue: 10_000_000_000n, // 10,000 USDC
  loanAmount: 6_000_000_000n, //  6,000 USDC
  interestRateBps: 1200, // 12%
  termDays: 60,
  dueTs: 1_776_000_000, // deterministic fixed unix seconds

  loanId: "TRDC_PDA_demo_base58_placeholder",
  ccbSerial: "CCB-2026-000042",
  issuedAtTs: 1_770_000_000,
};

describe("generateCcbPdf", () => {
  it("produces a non-empty Uint8Array starting with %PDF-", async () => {
    const out = await generateCcbPdf(FIXTURE);
    expect(out.pdfBytes).toBeInstanceOf(Uint8Array);
    expect(out.pdfBytes.length).toBeGreaterThan(500);
    const header = Buffer.from(out.pdfBytes.slice(0, 5)).toString("ascii");
    expect(header).toBe("%PDF-");
  });
});

describe("hashCcb", () => {
  it("returns a 32-byte digest and 64-char lowercase hex", () => {
    const bytes = new Uint8Array([1, 2, 3, 4, 5]);
    const h = hashCcb(bytes);
    expect(h.digest).toBeInstanceOf(Uint8Array);
    expect(h.digest.length).toBe(32);
    expect(h.hex).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("determinism", () => {
  it("two calls with identical inputs yield byte-equal PDFs and identical hashes", async () => {
    const a = await generateCcbPdf(FIXTURE);
    const b = await generateCcbPdf(FIXTURE);
    expect(a.pdfBytes.length).toBe(b.pdfBytes.length);
    expect(Buffer.from(a.pdfBytes).equals(Buffer.from(b.pdfBytes))).toBe(true);
    expect(a.sha256Hex).toBe(b.sha256Hex);
    // Cross-check: hashCcb on raw bytes matches the digest returned by generateCcbPdf
    const rehash = hashCcb(a.pdfBytes);
    expect(rehash.hex).toBe(a.sha256Hex);
  });
});

describe("hash sensitivity", () => {
  it("a 1-atom change in loanAmount changes the hash", async () => {
    const a = await generateCcbPdf(FIXTURE);
    const b = await generateCcbPdf({
      ...FIXTURE,
      loanAmount: (FIXTURE.loanAmount as bigint) + 1n,
    });
    // Even if the rendered cent-rounded display is identical, the raw atoms
    // must factor into the hash so the PDF is cryptographically bound to the
    // exact on-chain loan amount. We embed the atoms value in the PDF
    // metadata (Keywords) to achieve this.
    expect(a.sha256Hex).not.toBe(b.sha256Hex);
  });
});
