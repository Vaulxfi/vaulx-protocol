"use client";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { generateCcbPdf, hashCcb, type CcbInput } from "@vaulx/ccb";

type SignedResult = {
  pdfBytes: Uint8Array;
  signatureDataUrl: string;
  ccbHashHex: string;
};

type Props = {
  ccb: CcbInput;
  onSigned: (result: SignedResult) => void | Promise<void>;
};

const USD = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function fmtAtomsAsUsdc(atoms: bigint | number): string {
  const n = typeof atoms === "bigint" ? Number(atoms) : atoms;
  return `$${USD.format(Math.round(n / 1_000_000))}`;
}

function fmtBpsPct(bps: number): string {
  const whole = Math.floor(bps / 100);
  const rem = bps % 100;
  return `${whole}.${rem.toString().padStart(2, "0")}%`;
}

function fmtDate(unixSec: number): string {
  return new Date(unixSec * 1000).toISOString().slice(0, 10);
}

export function CcbDocument({ ccb, onSigned }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const lastPt = useRef<{ x: number; y: number } | null>(null);
  const [hasInk, setHasInk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [previewHash, setPreviewHash] = useState<string | null>(null);

  // Stroke style
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#e7c98a"; // brass
  }, []);

  // Compute preview hash whenever ccb changes (debounced via effect)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const out = await generateCcbPdf(ccb);
        if (!cancelled) setPreviewHash(out.sha256Hex);
      } catch {
        if (!cancelled) setPreviewHash(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ccb]);

  const ptFromEvent = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current!;
    const rect = c.getBoundingClientRect();
    const scaleX = c.width / rect.width;
    const scaleY = c.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const c = canvasRef.current;
    if (!c) return;
    c.setPointerCapture(e.pointerId);
    drawing.current = true;
    const p = ptFromEvent(e);
    lastPt.current = p;
    const ctx = c.getContext("2d")!;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    // Place a dot to register a tap
    ctx.lineTo(p.x + 0.1, p.y + 0.1);
    ctx.stroke();
    if (!hasInk) setHasInk(true);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const c = canvasRef.current;
    if (!c) return;
    const p = ptFromEvent(e);
    const ctx = c.getContext("2d")!;
    ctx.beginPath();
    if (lastPt.current) ctx.moveTo(lastPt.current.x, lastPt.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    lastPt.current = p;
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    drawing.current = false;
    lastPt.current = null;
    const c = canvasRef.current;
    if (c && c.hasPointerCapture(e.pointerId)) c.releasePointerCapture(e.pointerId);
  };

  const clearInk = () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, c.width, c.height);
    setHasInk(false);
  };

  const handleSign = async () => {
    if (!hasInk || busy) return;
    setBusy(true);
    try {
      const out = await generateCcbPdf(ccb);
      const sig = canvasRef.current!.toDataURL("image/png");
      const hash = hashCcb(out.pdfBytes);
      await onSigned({
        pdfBytes: out.pdfBytes,
        signatureDataUrl: sig,
        ccbHashHex: hash.hex,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-md border border-[var(--rule-strong)] bg-[var(--bg-elev-1)] p-5 md:p-6">
      <div className="flex items-start justify-between gap-3 border-b border-[var(--rule)] pb-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--ink-muted)]">
            Cédula de Crédito Bancário · CCB.B3
          </p>
          <h3 className="mt-2 font-display text-2xl tracking-[-0.01em] text-[var(--ink)]">
            VX-{ccb.ccbSerial}
          </h3>
        </div>
        <div className="text-right">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
            Issued
          </p>
          <p
            className="mt-1 font-mono text-xs text-[var(--ink-dim)]"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {fmtDate(ccb.issuedAtTs)}
          </p>
        </div>
      </div>

      <dl
        className="mt-5 grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 font-mono text-xs"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        <dt className="text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">Borrower</dt>
        <dd className="text-[var(--ink)]">{ccb.borrowerName}</dd>
        <dt className="text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">CPF</dt>
        <dd className="text-[var(--ink)]">{ccb.borrowerCpf}</dd>
        <dt className="text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">Lender</dt>
        <dd className="text-[var(--ink)]">{ccb.lenderName}</dd>
        <dt className="text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">Asset</dt>
        <dd className="text-[var(--ink)]">
          {ccb.watchMake} {ccb.watchModel} ({ccb.watchYear})
        </dd>
        <dt className="text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">Reference</dt>
        <dd className="text-[var(--ink)]">{ccb.watchRef}</dd>
        <dt className="text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">Appraisal</dt>
        <dd className="text-[var(--ink)]">{fmtAtomsAsUsdc(ccb.appraisalValue)} USDC</dd>
        <dt className="text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">Principal</dt>
        <dd className="text-[var(--ink)]">{fmtAtomsAsUsdc(ccb.loanAmount)} USDC</dd>
        <dt className="text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">Term</dt>
        <dd className="text-[var(--ink)]">
          {ccb.termDays} days · {fmtBpsPct(ccb.interestRateBps)} APR
        </dd>
        <dt className="text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">Due</dt>
        <dd className="text-[var(--ink)]">{fmtDate(ccb.dueTs)}</dd>
      </dl>

      <div className="mt-5 border-t border-[var(--rule)] pt-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--brand)]">
          SHA-256 · anchored on Solana
        </p>
        <p
          className="mt-2 break-all font-mono text-[11px] leading-relaxed text-[var(--ink-dim)]"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {previewHash ? `0x${previewHash}` : "computing…"}
        </p>
      </div>

      <div className="mt-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
          Signature
        </p>
        <canvas
          ref={canvasRef}
          width={300}
          height={120}
          aria-label="Signature pad"
          role="img"
          className="mt-2 w-full touch-none rounded border border-[var(--rule)] bg-[var(--bg)]"
          style={{ cursor: "crosshair" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onPointerLeave={onPointerUp}
        />
        <div className="mt-3 flex items-center justify-between">
          <button
            type="button"
            onClick={clearInk}
            className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)] hover:text-[var(--ink-dim)]"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={handleSign}
            disabled={!hasInk || busy}
            className="rounded-md border border-[var(--brand)] bg-[var(--brand)] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--bg)] transition-opacity disabled:opacity-50"
          >
            {busy ? "Generating CCB…" : "Sign and continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
