"use client";

import type { ReactNode } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter, usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useGovbrVerification } from "@/lib/govbr/mock-storage";

/**
 * Wraps children behind the gov.br mock verification. Renders `children` iff
 * the connected wallet has a stored gov.br verification; otherwise renders a
 * CTA that redirects to `/borrow/verify-id` with a `return_to` query param
 * pointing at the current path.
 */
export function GovbrGate({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { publicKey } = useWallet();
  const router = useRouter();
  const pathname = usePathname();
  const walletStr = publicKey?.toBase58();
  const { verification, loading } = useGovbrVerification(walletStr);

  if (!publicKey) {
    return (
      <div className="rounded-lg border border-border p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Connect your wallet to verify your identity.
        </p>
        {fallback}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-border p-6 text-center text-sm text-muted-foreground">
        Checking gov.br verification…
      </div>
    );
  }

  if (verification) return <>{children}</>;

  const returnTo = pathname ?? "/borrow/new/asset";
  const href = `/borrow/verify-id?return_to=${encodeURIComponent(returnTo)}`;
  return (
    <div className="rounded-lg border border-border p-6 text-center">
      <p className="mb-4 text-sm text-muted-foreground">
        gov.br identity verification required to continue.
      </p>
      <Button
        onClick={() => router.push(href)}
        className="bg-[#1351B4] text-white hover:bg-[#0D3F8F]"
      >
        Verify with gov.br
      </Button>
      {fallback}
    </div>
  );
}
