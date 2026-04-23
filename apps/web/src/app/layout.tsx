import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import { Toaster } from "sonner";

import { WalletProvider } from "@/components/providers/wallet-provider";
import { QueryProvider } from "@/lib/query-provider";
import { cn } from "@/lib/utils";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Vaulx",
  description: "Vaulx — asset-backed lending on Solana"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn(inter.variable, manrope.variable)}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <QueryProvider>
          <WalletProvider>{children}</WalletProvider>
        </QueryProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
