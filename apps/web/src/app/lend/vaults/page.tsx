import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WalletConnectButton } from "@/components/wallet-connect-button";

export default function VaultsListPage() {
  const usdcMint = process.env.NEXT_PUBLIC_USDC_MINT;

  return (
    <main className="min-h-screen bg-background px-6 py-16">
      <div className="mx-auto flex max-w-5xl flex-col gap-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <p className="font-sans text-sm uppercase tracking-wider text-brand-gold">
              Phase 1 · Devnet
            </p>
            <h1 className="font-heading text-4xl font-bold tracking-tight text-brand-blue">
              Vaults
            </h1>
            <p className="font-sans text-muted-foreground">
              A single USDC vault funds watch-backed loans.
            </p>
          </div>
          <WalletConnectButton />
        </header>

        {!usdcMint ? (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle>No vaults available yet</CardTitle>
              <CardDescription>
                Set <code className="font-mono text-xs">NEXT_PUBLIC_USDC_MINT</code>{" "}
                in <code className="font-mono text-xs">apps/web/.env.local</code>{" "}
                after running the devnet USDC seed script
                (<code className="font-mono text-xs">scripts/dev/seed-usdc.ts</code>).
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="border-border/70 hover:-translate-y-0.5 hover:border-brand-gold/60 hover:shadow-md">
              <CardHeader>
                <CardTitle>USDC</CardTitle>
                <CardDescription>USD Coin · Devnet</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-muted-foreground">APR</dt>
                    <dd className="font-heading text-lg font-semibold text-brand-blue">
                      —
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Asset</dt>
                    <dd className="font-heading text-lg font-semibold text-brand-blue">
                      USDC
                    </dd>
                  </div>
                </dl>
                <Button
                  asChild
                  className="bg-brand-gold text-brand-blue hover:bg-brand-gold/90"
                >
                  <Link href={`/lend/vaults/${usdcMint}`}>Deposit</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
