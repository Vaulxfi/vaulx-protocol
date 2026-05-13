import Link from "next/link";
import { Github, Mail } from "lucide-react";

const FOOTER_LINKS = [
  { href: "/terms", label: "Terms" },
  { href: "/faq", label: "Protocol" },
  { href: "/team", label: "Team" },
  { href: "/simulator", label: "Simulator" },
] as const;

function TwitterX({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-.86 13.028h1.36L4.323 2.145H2.865l8.875 11.633Z" />
    </svg>
  );
}

function Telegram({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0Zm-7.842 2.954c.722-.302 4.135-1.766 4.135-1.766.197-.05.395.05.395.245 0 .242-.395.347-.395.347s-3.59 1.193-4.084 1.36c-.247.084-.66.144-.66.144-.74 0-.74-.65-.74-.65V8.79l5.526-3.43c.066-.04.15-.034.207.014a.16.16 0 0 1 .032.208l-3.972 4.5c-.272.31-.272.31.026.527.297.218 1.36 1.005 1.572 1.137.213.132.41.105.41.105z" />
    </svg>
  );
}

export function MarketingFooter() {
  const year = new Date().getUTCFullYear();
  return (
    <footer className="border-t border-[var(--vx-border)] bg-[var(--vx-bg)] py-12 text-center">
      <div className="mx-auto w-full max-w-[1320px] px-4 md:px-6">
        <div
          className="mb-3 font-sans text-[1.4rem] font-extrabold tracking-[-0.04em] text-[var(--vx-text)]"
        >
          vaul
          <span className="text-[var(--vx-accent-mark)]">x</span>
        </div>

        <div className="mb-3 font-sans text-[0.8rem] tracking-[0.06em] text-[var(--vx-text-muted)]">
          Luxury Asset Collateral Protocol — Solana · RWA · DeFi
        </div>

        <div className="font-mono text-[0.78rem] uppercase tracking-[0.06em]">
          {FOOTER_LINKS.map((l, i) => (
            <span key={l.href}>
              <Link
                href={l.href}
                className="text-[var(--vx-text-muted)] no-underline hover:text-[var(--vx-text)]"
              >
                {l.label}
              </Link>
              {i < FOOTER_LINKS.length - 1 ? (
                <span aria-hidden className="mx-3 text-[var(--vx-text-muted)]">
                  ·
                </span>
              ) : null}
            </span>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-center gap-3 text-[1.1rem]">
          <a
            href="https://github.com/Vaulxfi"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--vx-text-muted)] hover:text-[var(--vx-text)]"
            aria-label="Vaulx on GitHub"
          >
            <Github className="h-[1.1rem] w-[1.1rem]" />
          </a>
          <a
            href="https://x.com/vaulx_rwa"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--vx-text-muted)] hover:text-[var(--vx-text)]"
            aria-label="Vaulx on X"
          >
            <TwitterX className="h-[1.05rem] w-[1.05rem]" />
          </a>
          <a
            href="https://t.me/vaulx_rwa"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--vx-text-muted)] hover:text-[var(--vx-text)]"
            aria-label="Vaulx on Telegram"
          >
            <Telegram className="h-[1.1rem] w-[1.1rem]" />
          </a>
          <a
            href="mailto:hello@vaulx.fi"
            className="text-[var(--vx-text-muted)] hover:text-[var(--vx-text)]"
            aria-label="Email Vaulx"
          >
            <Mail className="h-[1.1rem] w-[1.1rem]" />
          </a>
        </div>

        <div className="mt-3 font-sans text-[0.7rem] tracking-[0.04em] text-[var(--vx-text-subtle)]">
          © {year} Vaulx. Built for private wealth.
        </div>
      </div>
    </footer>
  );
}
