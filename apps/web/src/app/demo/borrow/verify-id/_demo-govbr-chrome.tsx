"use client";

import type { ReactNode } from "react";

/**
 * Demo-mode gov.br chrome — phone-bezel friendly version of the production
 * <GovbrChrome>. Visually equivalent (gov.br blue header, demo-mode badge,
 * yellow accent), but uses min-h-full instead of min-h-screen so it fits
 * inside the demo phone viewport without overflowing.
 */
export function DemoGovbrChrome({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex min-h-full flex-col bg-[#F8F8F8] text-[#1351B4]"
      style={{
        fontFamily: "system-ui, -apple-system, Helvetica, Arial, sans-serif",
      }}
    >
      <header className="bg-[#1351B4] text-white">
        <div className="flex flex-col gap-2 px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold tracking-tight">
              <span className="text-white">gov</span>
              <span className="text-[#FFCD07]">.br</span>
            </span>
            <span className="rounded-full bg-[#FFCD07] px-2 py-0.5 text-[10px] font-semibold text-[#1351B4]">
              Demo mode
            </span>
          </div>
          <p className="text-[10px] text-white/80">
            Simulação — não é um serviço real do governo
          </p>
        </div>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-8">
        {children}
      </main>
      <footer className="border-t border-[#1351B4]/20 bg-white">
        <div className="px-4 py-3 text-center text-[10px] text-[#1351B4]">
          Governo Federal · Simulação demonstrativa Vaulx
        </div>
      </footer>
    </div>
  );
}
