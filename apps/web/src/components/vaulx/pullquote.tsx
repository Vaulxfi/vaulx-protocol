interface PullquoteProps {
  quote: string;
  translation?: string;
  attribution: string;
}

export function Pullquote({ quote, translation, attribution }: PullquoteProps) {
  return (
    <figure className="relative my-16 border-y border-[var(--rule)] py-16 md:my-24 md:py-24">
      <blockquote className="mx-auto max-w-5xl px-6 text-center">
        <p className="font-display italic font-normal text-[clamp(1.75rem,3.6vw,3.25rem)] leading-[1.15] tracking-[-0.015em] text-[var(--ink)]">
          &ldquo;{quote}&rdquo;
        </p>
        {translation && (
          <p className="mt-6 font-sans text-base leading-relaxed text-[var(--ink-muted)] md:text-lg">
            {translation}
          </p>
        )}
      </blockquote>
      <figcaption className="mt-10 flex items-center justify-center gap-3 font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--ink-muted)]">
        <span aria-hidden className="h-px w-10 bg-[var(--rule-strong)]" />
        {attribution}
        <span aria-hidden className="h-px w-10 bg-[var(--rule-strong)]" />
      </figcaption>
    </figure>
  );
}
