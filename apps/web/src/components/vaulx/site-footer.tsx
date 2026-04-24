import Link from "next/link";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/lend", label: "Lend" },
      { href: "/borrow/new/asset", label: "Borrow" },
      { href: "/lend/vaults", label: "Vaults" }
    ]
  },
  {
    title: "Ecosystem",
    links: [
      { href: "#", label: "Solana" },
      { href: "#", label: "Civic" },
      { href: "#", label: "gov.br" },
      { href: "#", label: "Supabase" }
    ]
  },
  {
    title: "Ops",
    links: [
      { href: "/admin/tests", label: "Live tests" },
      { href: "/admin/demo", label: "Demo cockpit" }
    ]
  },
  {
    title: "Legal",
    links: [
      { href: "#", label: "White paper" },
      { href: "#", label: "Terms of service" },
      { href: "#", label: "Privacy" },
      { href: "#", label: "Disclosures" }
    ]
  }
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--rule)] bg-[var(--bg)] text-[var(--ink-dim)]">
      <div className="mx-auto w-full max-w-[1440px] px-6 py-16 md:px-10 md:py-24">
        <div className="grid gap-14 md:grid-cols-[1.4fr,1fr,1fr,1fr,1fr]">
          {/* Wordmark column */}
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-2.5">
              <span aria-hidden className="inline-block h-[9px] w-[9px] rounded-full bg-[var(--brand)]" />
              <span className="font-display text-[2.5rem] font-extrabold tracking-[-0.03em] leading-none text-[var(--ink)]">
                Vaulx
              </span>
            </div>
            <p className="font-sans text-sm leading-relaxed text-[var(--ink-dim)] max-w-[36ch]">
              A private credit protocol for assets that appreciate. Built for the world&apos;s most resilient collateral.
            </p>
            <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
              VX-01 · Solana Devnet · 2026
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title} className="flex flex-col gap-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--ink-muted)]">
                {col.title}
              </div>
              <ul className="flex flex-col gap-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="font-sans text-sm text-[var(--ink-dim)] transition-colors hover:text-[var(--ink)]"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 border-t border-[var(--rule)] pt-6">
          <div className="flex flex-col gap-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)] md:flex-row md:items-center md:justify-between">
            <span>
              VX-01 · Solana Devnet · Built for Colosseum Frontier · 2026
            </span>
            <span>
              Cédula de Crédito Bancário — executable, transferrable, resistant.
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
