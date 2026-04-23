import { Button } from "@/components/ui/button";
import { WalletConnectButton } from "@/components/wallet-connect-button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-20">
      <div className="flex max-w-2xl flex-col items-center gap-8 text-center">
        <h1 className="font-heading text-6xl font-bold tracking-tight text-brand-blue">
          Vaulx
        </h1>
        <p className="font-sans text-lg text-muted-foreground">
          Asset-backed lending on Solana. Lock your collateral, borrow
          stablecoins, keep your upside.
        </p>
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <Button size="lg">Get started</Button>
          <WalletConnectButton />
        </div>
        <div className="mt-4 h-1 w-24 rounded-full bg-brand-gold" />
      </div>
    </main>
  );
}
