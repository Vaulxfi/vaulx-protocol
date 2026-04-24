import Link from "next/link";
import { PublicKey } from "@solana/web3.js";

import { SiteFooter } from "@/components/vaulx/site-footer";
import { SiteHeader } from "@/components/vaulx/site-header";
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
      <>
        <SiteHeader />
        <main className="min-h-[calc(100vh-72px)]">
          <div className="mx-auto max-w-[1440px] px-6 py-24 md:px-10">
            <div className="border border-[var(--signal-bad)] bg-[var(--bg-elev-1)] p-10">
              <div
                className="eyebrow"
                style={{ color: "var(--signal-bad)" }}
              >
                Invalid vault
              </div>
              <p className="mt-4 font-sans text-sm text-[var(--ink-dim)]">
                <code className="bg-[var(--bg)] px-1.5 py-0.5 font-mono text-xs text-[var(--brand)]">
                  {params.id}
                </code>{" "}
                is not a valid asset mint.
              </p>
              <Link href="/lend/vaults" className="btn-ghost mt-6">
                Back to vaults
              </Link>
            </div>
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  return <VaultDetail assetMintBase58={mint.toBase58()} />;
}
