"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/demo/borrow/onboard", label: "Home", icon: "◇" },
  { href: "/demo/borrow/loan-offer", label: "Borrow", icon: "▤" },
  { href: "/demo/borrow/funds", label: "Spend", icon: "◊" },
  { href: "/demo/borrow/dashboard", label: "Dashboard", icon: "▦" },
] as const;

export function DemoFooterNav() {
  const path = usePathname();
  return (
    <nav className="sticky bottom-0 left-0 right-0 grid grid-cols-4 border-t border-[var(--rule)] bg-[var(--bg)]/95 backdrop-blur-sm">
      {tabs.map((t) => {
        const active = path?.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`flex flex-col items-center gap-1 py-2.5 text-[10px] uppercase tracking-wider font-mono ${
              active ? "text-[var(--brand)]" : "text-[var(--ink-muted)]"
            }`}
          >
            <span className="text-lg">{t.icon}</span>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
