import type { Metadata } from "next";
import { JetBrains_Mono, Outfit } from "next/font/google";
import { Toaster } from "sonner";

import { WalletProvider } from "@/components/providers/wallet-provider";
import { GrainOverlay } from "@/components/vaulx/grain-overlay";
import { QueryProvider } from "@/lib/query-provider";
import { cn } from "@/lib/utils";

import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap"
});

const outfitDisplay = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700", "800"],
  display: "swap"
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600", "700"],
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
    var cls = saved === 'dark' ? 'dark' : 'light';
    document.documentElement.classList.add(cls);
    if (cls !== 'light') document.documentElement.classList.remove('light');
  } catch (e) {
    document.documentElement.classList.add('light');
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
        "light",
        outfit.variable,
        outfitDisplay.variable,
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
          theme="light"
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
