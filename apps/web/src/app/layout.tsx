import type { Metadata } from "next";
import { Fraunces, Instrument_Sans, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";

import { WalletProvider } from "@/components/providers/wallet-provider";
import { GrainOverlay } from "@/components/vaulx/grain-overlay";
import { QueryProvider } from "@/lib/query-provider";
import { cn } from "@/lib/utils";

import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  style: ["normal", "italic"],
  axes: ["opsz"],
  display: "swap"
});

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"],
  display: "swap"
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
  display: "swap"
});

export const metadata: Metadata = {
  title: "Vaulx — Asset-backed lending on Solana",
  description:
    "Vaulx · VX-01 — a private lending protocol for the world's most resilient assets. Watches today, art and passports tomorrow. Built on Solana, anchored in Brazilian law."
};

const themeBoot = `
(function(){
  try {
    var saved = localStorage.getItem('vx-theme');
    var cls = saved === 'light' ? 'light' : 'dark';
    document.documentElement.classList.add(cls);
    if (cls !== 'dark') document.documentElement.classList.remove('dark');
  } catch (e) {
    document.documentElement.classList.add('dark');
  }
})();
`;

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={cn(
        "dark",
        fraunces.variable,
        instrumentSans.variable,
        jetbrains.variable
      )}
      suppressHydrationWarning
    >
      <head>
        {/* Pre-hydration theme class to avoid FOUC */}
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
      </head>
      <body className="min-h-screen bg-[var(--bg)] font-sans text-[var(--ink)] antialiased">
        <GrainOverlay />
        <QueryProvider>
          <WalletProvider>{children}</WalletProvider>
        </QueryProvider>
        <Toaster
          richColors
          position="top-right"
          theme="dark"
          toastOptions={{
            style: {
              background: "var(--bg-elev-1)",
              color: "var(--ink)",
              border: "1px solid var(--rule)",
              borderRadius: "0.25rem",
              fontFamily: "var(--font-body)"
            }
          }}
        />
      </body>
    </html>
  );
}
