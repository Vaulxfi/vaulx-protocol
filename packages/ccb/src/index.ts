import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from "pdf-lib";
import { sha256 } from "@noble/hashes/sha256";

export interface CcbInput {
  borrowerName: string;
  borrowerCpf: string;
  lenderName: string;
  custodianName: string;

  watchMake: string;
  watchModel: string;
  watchRef: string;
  watchYear: number;
  watchCondition: "mint" | "excellent" | "very_good" | "good";

  appraisalValue: bigint | number;
  loanAmount: bigint | number;
  interestRateBps: number;
  termDays: number;
  dueTs: number;

  loanId: string;
  ccbSerial: string;
  issuedAtTs: number;
}

export interface CcbOutput {
  pdfBytes: Uint8Array;
  sha256: Uint8Array;
  sha256Hex: string;
}

const USDC_DECIMALS = 1_000_000n;

function toAtoms(v: bigint | number): bigint {
  return typeof v === "bigint" ? v : BigInt(v);
}

function formatUsdc(atomsIn: bigint | number): string {
  const atoms = toAtoms(atomsIn);
  const whole = atoms / USDC_DECIMALS;
  const frac = atoms % USDC_DECIMALS;
  // Round to 2 decimals
  const cents = (frac * 100n + USDC_DECIMALS / 2n) / USDC_DECIMALS;
  let wholePart = whole;
  let centsPart = cents;
  if (centsPart === 100n) {
    wholePart += 1n;
    centsPart = 0n;
  }
  const centsStr = centsPart.toString().padStart(2, "0");
  return `${wholePart.toString()}.${centsStr} USDC`;
}

function formatLtvPct(loan: bigint, appraisal: bigint): string {
  if (appraisal === 0n) return "0.00%";
  // ltv in bps = loan * 10000 / appraisal
  const bps = (loan * 10000n) / appraisal;
  const whole = bps / 100n;
  const rem = bps % 100n;
  return `${whole.toString()}.${rem.toString().padStart(2, "0")}%`;
}

function formatBps(bps: number): string {
  const whole = Math.floor(bps / 100);
  const rem = bps % 100;
  return `${whole}.${rem.toString().padStart(2, "0")}%`;
}

function formatDateUtc(ts: number): string {
  const d = new Date(ts * 1000);
  const y = d.getUTCFullYear();
  const m = (d.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = d.getUTCDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDateTimeUtc(ts: number): string {
  const d = new Date(ts * 1000);
  const y = d.getUTCFullYear();
  const m = (d.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = d.getUTCDate().toString().padStart(2, "0");
  const hh = d.getUTCHours().toString().padStart(2, "0");
  const mm = d.getUTCMinutes().toString().padStart(2, "0");
  const ss = d.getUTCSeconds().toString().padStart(2, "0");
  return `${y}-${m}-${day} ${hh}:${mm}:${ss}Z`;
}

function stripAccents(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x00-\x7F]/g, "?");
}

function conditionLabel(c: CcbInput["watchCondition"]): string {
  switch (c) {
    case "mint":
      return "Mint";
    case "excellent":
      return "Excellent";
    case "very_good":
      return "Very Good";
    case "good":
      return "Good";
  }
}

function drawText(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  size: number,
  font: PDFFont,
  color = rgb(0, 0, 0),
) {
  page.drawText(stripAccents(text), { x, y, size, font, color });
}

function drawTextRight(
  page: PDFPage,
  text: string,
  xRight: number,
  y: number,
  size: number,
  font: PDFFont,
  color = rgb(0, 0, 0),
) {
  const safe = stripAccents(text);
  const w = font.widthOfTextAtSize(safe, size);
  page.drawText(safe, { x: xRight - w, y, size, font, color });
}

function drawTextCenter(
  page: PDFPage,
  text: string,
  xCenter: number,
  y: number,
  size: number,
  font: PDFFont,
  color = rgb(0, 0, 0),
) {
  const safe = stripAccents(text);
  const w = font.widthOfTextAtSize(safe, size);
  page.drawText(safe, { x: xCenter - w / 2, y, size, font, color });
}

export async function generateCcbPdf(input: CcbInput): Promise<CcbOutput> {
  const doc = await PDFDocument.create();

  // Deterministic metadata
  const issuedAt = new Date(input.issuedAtTs * 1000);
  doc.setCreationDate(issuedAt);
  doc.setModificationDate(issuedAt);
  doc.setProducer("vaulx-ccb");
  doc.setCreator("vaulx-ccb");
  doc.setTitle(`CCB ${input.ccbSerial}`);
  doc.setAuthor("Vaulx");
  doc.setSubject("Cedula de Credito Bancario");
  // Embed raw atoms + identifiers in Keywords so the SHA-256 is sensitive to
  // sub-cent changes in financial values (display rounds to 2 decimals).
  doc.setKeywords([
    `loanId:${input.loanId}`,
    `serial:${input.ccbSerial}`,
    `loanAtoms:${toAtoms(input.loanAmount).toString()}`,
    `apprAtoms:${toAtoms(input.appraisalValue).toString()}`,
    `rateBps:${input.interestRateBps}`,
    `termDays:${input.termDays}`,
    `dueTs:${input.dueTs}`,
    `issuedAtTs:${input.issuedAtTs}`,
  ]);

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  // A4 portrait
  const W = 595;
  const H = 842;
  const page = doc.addPage([W, H]);

  const margin = 48;
  const gray = rgb(0.45, 0.45, 0.45);
  const black = rgb(0, 0, 0);

  let y = H - margin;

  // 1. Header
  drawTextCenter(page, "CEDULA DE CREDITO BANCARIO - CCB.B3", W / 2, y, 16, bold, black);
  y -= 18;
  drawTextRight(page, `Serial: ${input.ccbSerial}`, W - margin, y, 9, font, gray);
  y -= 11;
  drawTextRight(page, `Emitida em: ${formatDateUtc(input.issuedAtTs)}`, W - margin, y, 9, font, gray);
  y -= 20;

  // separator
  page.drawLine({
    start: { x: margin, y },
    end: { x: W - margin, y },
    thickness: 0.5,
    color: gray,
  });
  y -= 18;

  // 2. Parties
  drawText(page, "PARTES", margin, y, 11, bold, black);
  y -= 14;

  drawText(page, "EMITENTE (Borrower):", margin, y, 10, bold, black);
  drawText(page, input.borrowerName, margin + 140, y, 10, font, black);
  y -= 12;
  drawText(page, "CPF:", margin, y, 10, bold, black);
  drawText(page, input.borrowerCpf, margin + 140, y, 10, font, black);
  y -= 14;

  drawText(page, "CREDOR (Lender):", margin, y, 10, bold, black);
  drawText(page, input.lenderName, margin + 140, y, 10, font, black);
  y -= 14;

  drawText(page, "FIEL DEPOSITARIO (Custodian):", margin, y, 10, bold, black);
  drawText(page, input.custodianName, margin + 175, y, 10, font, black);
  y -= 18;

  // 3. Objeto da garantia
  drawText(page, "OBJETO DA GARANTIA", margin, y, 11, bold, black);
  y -= 14;

  const watchRows: [string, string][] = [
    ["Marca", input.watchMake],
    ["Modelo", input.watchModel],
    ["Referencia", input.watchRef],
    ["Ano", input.watchYear.toString()],
    ["Condicao", conditionLabel(input.watchCondition)],
  ];
  for (const [label, value] of watchRows) {
    drawText(page, label, margin, y, 10, bold, black);
    drawText(page, value, margin + 140, y, 10, font, black);
    y -= 12;
  }
  y -= 8;

  // 4. Condicoes financeiras
  drawText(page, "CONDICOES FINANCEIRAS", margin, y, 11, bold, black);
  y -= 14;

  const loanAtoms = toAtoms(input.loanAmount);
  const apprAtoms = toAtoms(input.appraisalValue);

  const finRows: [string, string][] = [
    ["Valor de avaliacao", formatUsdc(apprAtoms)],
    ["Valor do emprestimo", formatUsdc(loanAtoms)],
    ["LTV", formatLtvPct(loanAtoms, apprAtoms)],
    ["Taxa de juros", `${formatBps(input.interestRateBps)} (${input.interestRateBps} bps)`],
    ["Prazo", `${input.termDays} dias`],
    ["Vencimento", formatDateUtc(input.dueTs)],
  ];
  for (const [label, value] of finRows) {
    drawText(page, label, margin, y, 10, bold, black);
    drawText(page, value, margin + 180, y, 10, font, black);
    y -= 12;
  }
  y -= 8;

  // 5. Clausulas essenciais (accents stripped automatically)
  drawText(page, "CLAUSULAS ESSENCIAIS", margin, y, 11, bold, black);
  y -= 14;

  const clauses = [
    "1. A presente CCB e emitida nos termos da Lei no 10.931/2004, constituindo titulo executivo extrajudicial.",
    "2. O Emitente confere ao Credor garantia fiduciaria sobre o bem descrito em 'Objeto da Garantia', depositado junto ao Fiel Depositario.",
    "3. O Fiel Depositario declara-se ciente de suas obrigacoes legais e compromete-se a manter a guarda do bem ate a quitacao integral da divida.",
    "4. O inadimplemento no vencimento faculta ao Credor a execucao da garantia mediante leilao, nos termos pactuados em contrato acessorio.",
  ];
  for (const c of clauses) {
    const wrapped = wrapText(c, font, 9, W - 2 * margin);
    for (const line of wrapped) {
      drawText(page, line, margin, y, 9, font, black);
      y -= 11;
    }
    y -= 3;
  }
  y -= 8;

  // 6. Assinaturas
  drawText(page, "ASSINATURAS", margin, y, 11, bold, black);
  y -= 28;

  const sigWidth = (W - 2 * margin - 40) / 3;
  const sigY = y;
  const sigLabels: [string, string][] = [
    ["Emitente", input.borrowerName],
    ["Credor", input.lenderName],
    ["Fiel Depositario", input.custodianName],
  ];
  for (let i = 0; i < 3; i++) {
    const x0 = margin + i * (sigWidth + 20);
    page.drawLine({
      start: { x: x0, y: sigY },
      end: { x: x0 + sigWidth, y: sigY },
      thickness: 0.5,
      color: black,
    });
    drawText(page, sigLabels[i][0], x0, sigY - 12, 9, bold, black);
    drawText(page, sigLabels[i][1], x0, sigY - 23, 8, font, gray);
  }

  // 7. Footer
  const footerY = margin - 8;
  drawText(page, `Loan ID: ${input.loanId}`, margin, footerY + 18, 8, font, gray);
  drawText(page, "Generated by Vaulx Devnet", margin, footerY + 8, 8, font, gray);
  drawTextRight(page, formatDateTimeUtc(input.issuedAtTs), W - margin, footerY + 8, 8, font, gray);

  const pdfBytes = await doc.save({ useObjectStreams: false });

  const digest = sha256(pdfBytes);
  const hex = bytesToHex(digest);
  return { pdfBytes, sha256: digest, sha256Hex: hex };
}

export function hashCcb(bytes: Uint8Array): { digest: Uint8Array; hex: string } {
  const digest = sha256(bytes);
  return { digest, hex: bytesToHex(digest) };
}

function bytesToHex(b: Uint8Array): string {
  let out = "";
  for (let i = 0; i < b.length; i++) {
    const h = b[i].toString(16);
    out += h.length === 1 ? "0" + h : h;
  }
  return out;
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const safe = stripAccents(text);
  const words = safe.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const candidate = cur.length === 0 ? w : cur + " " + w;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && cur.length > 0) {
      lines.push(cur);
      cur = w;
    } else {
      cur = candidate;
    }
  }
  if (cur.length > 0) lines.push(cur);
  return lines;
}
