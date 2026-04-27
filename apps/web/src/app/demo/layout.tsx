import type { ReactNode } from "react";

export const metadata = {
  title: "Vaulx · Mock app demo",
  description: "Click-through prototype of Vaulx — Solana RWA lending against luxury watches.",
};

export default function DemoLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-[var(--bg)]">{children}</div>;
}
