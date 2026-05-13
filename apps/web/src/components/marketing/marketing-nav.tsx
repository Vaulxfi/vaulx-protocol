"use client";

import Link from "next/link";
import { useState } from "react";

import { ThemeToggle } from "@/components/vaulx/theme-toggle";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/#how", label: "How it works" },
  { href: "/#collateral", label: "Collateral" },
  { href: "/simulator", label: "Simulator" },
  { href: "/team", label: "Team" },
  { href: "/faq", label: "Protocol" },
] as const;

export function MarketingNav() {
  const [open, setOpen] = useState(false);

  return (
    <nav
      className={cn(
        "sticky top-0 z-50 w-full",
        "bg-[var(--vx-bg)]/95 backdrop-blur-md",
        "border-b border-[var(--vx-border-soft)]",
      )}
    >
      <div className="mx-auto flex h-[64px] w-full max-w-[1320px] items-center justify-between px-4 md:px-6">
        <Link
          href="/"
          className="font-sans text-[1.5rem] font-extrabold tracking-[-0.04em] leading-none text-[var(--vx-text)]"
          aria-label="Vaulx home"
        >
          vaul
          <span className="text-[var(--vx-accent-mark)]">x</span>
        </Link>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="inline-flex h-9 w-9 items-center justify-center border border-[var(--vx-border-soft)] text-[var(--vx-text)] lg:hidden"
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="h-4 w-4"
          >
            {open ? (
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>

        <ul className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="px-3 py-2 font-mono text-[11px] uppercase tracking-[0.14em] font-medium text-[var(--vx-text)] hover:text-[var(--vx-teal)]"
              >
                {l.label}
              </Link>
            </li>
          ))}
          <li className="ms-2">
            <ThemeToggle />
          </li>
          <li>
            <Link
              href="/simulator"
              className="ms-2 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.14em] font-medium text-[var(--vx-text)] hover:text-[var(--vx-teal)]"
            >
              Sign In
            </Link>
          </li>
          <li className="ms-2">
            <Link
              href="/simulator"
              className="inline-flex items-center justify-center bg-[var(--vx-text)] px-4 py-2 text-[var(--vx-bg)] font-mono text-[11px] uppercase tracking-[0.14em] font-semibold border border-[var(--vx-text)] hover:bg-transparent hover:text-[var(--vx-text)] transition-colors duration-150 ease-glide"
            >
              Launch App
            </Link>
          </li>
        </ul>
      </div>

      {open && (
        <div className="border-t border-[var(--vx-border-soft)] bg-[var(--vx-bg)] lg:hidden">
          <ul className="mx-auto flex w-full max-w-[1320px] flex-col px-4 py-4">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block border-b border-[var(--vx-border-soft)] py-3 font-mono text-[12px] uppercase tracking-[0.14em] text-[var(--vx-text)]"
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li className="mt-4 flex items-center gap-3">
              <ThemeToggle />
              <Link
                href="/simulator"
                onClick={() => setOpen(false)}
                className="inline-flex items-center justify-center bg-[var(--vx-text)] px-4 py-2 text-[var(--vx-bg)] font-mono text-[11px] uppercase tracking-[0.14em] font-semibold"
              >
                Launch App
              </Link>
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
}
