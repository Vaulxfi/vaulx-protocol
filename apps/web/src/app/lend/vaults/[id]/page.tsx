import Link from "next/link";
import { PublicKey } from "@solana/web3.js";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { VaultDetail } from "@/components/vaulx/vault-detail";

export default function VaultDetailPage({
  params,
}: {
  params: { id: string };
}) {
  let mint: PublicKey | null = null;
  try {
    mint = new PublicKey(params.id);
  } catch {
    mint = null;
  }

  if (!mint) {
    return (
      <main className="min-h-screen bg-background px-6 py-16">
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Invalid vault</CardTitle>
              <CardDescription>
                <code className="font-mono text-xs">{params.id}</code> is not a
                valid asset mint.
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
        </div>
      </main>
    );
  }

  return <VaultDetail assetMintBase58={mint.toBase58()} />;
}
