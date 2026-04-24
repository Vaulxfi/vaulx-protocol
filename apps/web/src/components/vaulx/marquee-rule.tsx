export function MarqueeRule({ glyph = "◆" }: { glyph?: string }) {
  return (
    <div
      aria-hidden
      className="flex w-full items-center justify-center gap-6 py-10 text-[var(--brand)]"
    >
      <span className="h-px flex-1 bg-[var(--rule)]" />
      <span className="font-mono text-xs tracking-[0.4em]">{glyph}</span>
      <span className="h-px flex-1 bg-[var(--rule)]" />
    </div>
  );
}
