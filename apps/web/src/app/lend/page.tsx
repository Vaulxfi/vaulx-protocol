import Link from "next/link";

import { Button } from "@/components/ui/button";
import { WalletConnectButton } from "@/components/wallet-connect-button";

export default function LendLandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-20">
      <div className="flex max-w-2xl flex-col items-center gap-8 text-center">
        <h1 className="font-heading text-5xl font-bold tracking-tight text-brand-blue sm:text-6xl">
          Lend USDC on Vaulx
        </h1>
        <p className="font-sans text-lg text-muted-foreground">
          Supply USDC. Earn real-world watch-backed yield. Overcollateralised
          loans, on-chain settlement, no middlemen.
        </p>
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <Button
            asChild
            size="lg"
            className="bg-brand-gold text-brand-blue hover:bg-brand-gold/90"
          >
            <Link href="/lend/vaults">Browse vaults</Link>
          </Button>
          <WalletConnectButton />
        </div>
        <div className="mt-4 h-1 w-24 rounded-full bg-brand-gold" />
      </div>
    </main>
  );
}
