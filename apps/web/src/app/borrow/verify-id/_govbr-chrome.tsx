"use client";

import type { ReactNode } from "react";

/**
 * Shared chrome for all gov.br-styled pages. Provides the blue header, a
 * visible demo-mode disclaimer, and a footer. Uses system sans-serif so the
 * mock reads as "official" rather than as a Vaulx page.
 */
export function GovbrChrome({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex min-h-screen flex-col bg-[#F8F8F8] text-[#1351B4]"
      style={{ fontFamily: "system-ui, -apple-system, Helvetica, Arial, sans-serif" }}
    >
      <header className="bg-[#1351B4] text-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
          <span className="text-lg font-bold tracking-tight">
            <span className="text-white">gov</span>
            <span className="text-[#FFCD07]">.br</span>
          </span>
          <span className="rounded-full bg-[#FFCD07] px-3 py-1 text-xs font-semibold text-[#1351B4]">
            Demo mode — not a real government service
          </span>
        </div>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-10">
        {children}
      </main>
      <footer className="border-t border-[#1351B4]/20 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-4 text-center text-xs text-[#1351B4]">
          Governo Federal · Simulação demonstrativa Vaulx
        </div>
      </footer>
    </div>
  );
}
