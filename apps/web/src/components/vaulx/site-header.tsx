"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { ThemeToggle } from "@/components/vaulx/theme-toggle";
import { WalletConnectButton } from "@/components/wallet-connect-button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/lend", label: "Lend" },
  { href: "/borrow/new/asset", label: "Borrow" },
  { href: "/custodian/intake", label: "Custodian" }
] as const;

export function SiteHeader({ variant = "default" }: { variant?: "default" | "inverted" }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-[var(--rule)] backdrop-blur-xl",
        variant === "inverted"
          ? "bg-[var(--bg)]/70"
          : "bg-[var(--bg)]/80"
      )}
    >
      <div className="mx-auto flex h-[72px] w-full max-w-[1440px] items-center justify-between px-6 md:px-10">
        {/* Left: wordmark */}
        <Link
          href="/"
          className="group flex items-center gap-2.5 text-[var(--ink)]"
          aria-label="Vaulx home"
        >
          <span
            aria-hidden
            className="inline-block h-[9px] w-[9px] rounded-full bg-[var(--brand)] transition-transform duration-300 ease-decisive group-hover:scale-125"
          />
          <span className="font-display text-[1.35rem] font-extrabold tracking-[-0.03em] leading-none">
            Vaulx
          </span>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--ink-muted)] md:inline-block">
            · VX-01
          </span>
        </Link>

        {/* Center: nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => {
            const active = pathname?.startsWith(item.href.split("/")[1] ? `/${item.href.split("/")[1]}` : item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "font-mono text-[11px] uppercase tracking-[0.18em] transition-colors duration-200",
                  active
                    ? "text-[var(--brand)]"
                    : "text-[var(--ink-dim)] hover:text-[var(--ink)]"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: wallet + theme */}
        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          <WalletConnectButton />
        </div>

        {/* Mobile trigger */}
        <button
          className="flex h-9 w-9 items-center justify-center border border-[var(--rule-strong)] text-[var(--ink)] md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
            {open ? (
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="border-t border-[var(--rule)] bg-[var(--bg-elev-1)] md:hidden">
          <nav className="mx-auto flex w-full max-w-[1440px] flex-col px-6 py-6">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="border-b border-[var(--rule)] py-4 font-mono text-xs uppercase tracking-[0.18em] text-[var(--ink)]"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-6 flex items-center gap-3">
              <ThemeToggle />
              <WalletConnectButton />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
