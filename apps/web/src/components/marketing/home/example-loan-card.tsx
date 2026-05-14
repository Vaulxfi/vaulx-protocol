import { Watch } from "lucide-react";

/**
 * Right-hand side card from the "Live Example" section: watch icon header,
 * 3-column Value/LTV/Credit row, mono truncated wallet rows. Surface fill
 * + ink hairline; no shadow per Deck Light.
 */
export function ExampleLoanCard() {
  return (
    <div className="rounded-md border border-[var(--vx-border-soft)] bg-[var(--vx-surface)] p-6">
      <div className="mb-3 flex items-center">
        <Watch
          className="h-[1.8rem] w-[1.8rem] text-[var(--vx-teal)]"
          strokeWidth={1.5}
          aria-hidden
        />
        <div className="ms-3">
          <h5 className="font-sans font-bold text-[var(--vx-text)] text-[1.05rem] leading-tight">
            Rolex Submariner
          </h5>
          <small className="text-[0.78rem] text-[var(--vx-text-muted)]">
            Ref. 126610LN · 2022
          </small>
        </div>
      </div>

      <hr className="my-3 border-t border-[var(--vx-border-soft)]" />

      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <small className="block text-[0.7rem] tracking-[0.04em] text-[var(--vx-text-muted)]">
            VALUE
          </small>
          <strong className="font-sans text-[1.25rem] text-[var(--vx-text)]">
            $15,000
          </strong>
        </div>
        <div>
          <small className="block text-[0.7rem] tracking-[0.04em] text-[var(--vx-text-muted)]">
            LTV
          </small>
          <strong
            className="font-sans text-[1.25rem] text-[var(--vx-teal)]"
            style={{ fontStyle: "normal" }}
          >
            55%
          </strong>
        </div>
        <div>
          <small className="block text-[0.7rem] tracking-[0.04em] text-[var(--vx-text-muted)]">
            CREDIT
          </small>
          <strong className="font-sans text-[1.25rem] text-[var(--vx-teal)]">
            $8,250
          </strong>
        </div>
      </div>

      <hr className="my-3 border-t border-[var(--vx-border-soft)]" />

      <div className="flex items-center justify-between text-[0.82rem]">
        <span className="text-[var(--vx-text-muted)]">NFT Mint</span>
        <span className="font-mono text-[0.82rem] text-[var(--vx-text-muted)]">
          7xKXt…demo
        </span>
      </div>
      <div className="mt-1 flex items-center justify-between text-[0.82rem]">
        <span className="text-[var(--vx-text-muted)]">Escrow PDA</span>
        <span className="font-mono text-[0.82rem] text-[var(--vx-text-muted)]">
          9pQrL…demo
        </span>
      </div>
    </div>
  );
}
