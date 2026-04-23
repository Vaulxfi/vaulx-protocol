"use client";

import { useMemo } from "react";
import Link from "next/link";
import { PublicKey } from "@solana/web3.js";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WalletConnectButton } from "@/components/wallet-connect-button";
import {
  useUserShareBalance,
  useUserUsdcBalance,
  useVaultData,
} from "@/lib/chain/vault";
import { DepositForm } from "@/components/vaulx/deposit-form";

const USDC_DECIMALS = 6;

function formatAtoms(amount: bigint | undefined, decimals = USDC_DECIMALS): string {
  if (amount === undefined) return "—";
  const base = 10n ** BigInt(decimals);
  const whole = amount / base;
  const frac = amount % base;
  const fracStr = frac.toString().padStart(decimals, "0").replace(/0+$/, "");
  return fracStr ? `${whole.toString()}.${fracStr}` : whole.toString();
}

export function VaultDetail({ assetMintBase58 }: { assetMintBase58: string }) {
  const assetMint = useMemo(() => new PublicKey(assetMintBase58), [assetMintBase58]);

  const vault = useVaultData(assetMint);
  const shareMint = vault.data?.shareMint;
  const usdc = useUserUsdcBalance(assetMint);
  const shares = useUserShareBalance(shareMint);

  const totalAssets = vault.data
    ? BigInt(vault.data.totalAssets.toString())
    : undefined;
  const totalShares = vault.data
    ? BigInt(vault.data.totalShares.toString())
    : undefined;

  return (
    <main className="min-h-screen bg-background px-6 py-16">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <Link
              href="/lend/vaults"
              className="text-sm text-muted-foreground hover:text-brand-blue"
            >
              ← Back to vaults
            </Link>
            <h1 className="font-heading text-4xl font-bold tracking-tight text-brand-blue">
              USDC Vault
            </h1>
            <p className="font-mono text-xs text-muted-foreground">
              {assetMintBase58}
            </p>
          </div>
          <WalletConnectButton />
        </header>

        {vault.isLoading ? (
          <Card>
            <CardHeader>
              <CardTitle>Loading vault…</CardTitle>
            </CardHeader>
          </Card>
        ) : vault.data === null ? (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle>Vault not initialised</CardTitle>
              <CardDescription>
                No vault account exists for this asset mint on the current
                cluster yet. Run the on-chain initialiser before depositing.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                asChild
                variant="outline"
                className="border-brand-blue/20"
              >
                <Link href="/lend/vaults">Back to vaults</Link>
              </Button>
            </CardContent>
          </Card>
        ) : vault.isError ? (
          <Card>
            <CardHeader>
              <CardTitle>Error loading vault</CardTitle>
              <CardDescription>
                {vault.error instanceof Error
                  ? vault.error.message
                  : "Unknown error"}
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Vault stats</CardTitle>
                <CardDescription>Live on-chain figures.</CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-6 sm:grid-cols-4">
                  <Stat label="APR" value="—" />
                  <Stat
                    label="Total assets"
                    value={`${formatAtoms(totalAssets)} USDC`}
                  />
                  <Stat
                    label="Total shares"
                    value={formatAtoms(totalShares)}
                  />
                  <Stat
                    label="Your shares"
                    value={formatAtoms(shares.data)}
                  />
                </dl>
                <div className="mt-4 text-sm text-muted-foreground">
                  Your USDC balance:{" "}
                  <span className="font-medium text-foreground">
                    {formatAtoms(usdc.data)} USDC
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Deposit</CardTitle>
                <CardDescription>
                  Minimum 1 USDC. First deposit runs a one-time identity check.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DepositForm assetMint={assetMint} />
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="font-heading text-xl font-semibold text-brand-blue">
        {value}
      </dd>
    </div>
  );
}
