"use client";

import type { ReactNode } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import { GovbrGate } from "@/components/vaulx/govbr-gate";
import { useGovbrVerification } from "@/lib/govbr/mock-storage";

/**
 * gov.br identity gate for the legacy `/borrow/new/...` flow.
 *
 * The hackathon demo at `/demo/borrow/...` uses the lazy `<KycRequiredModal>`
 * via `useKycGate()` instead — that path replaces both this and the dropped
 * Civic Auth gate (commit 025f832, 2026-04-28). This component is kept while
 * the legacy `/borrow/new/...` pages still render; remove when those go.
 */
export function IdentityGates({ children }: { children: ReactNode }) {
  const { publicKey } = useWallet();
  const walletStr = publicKey?.toBase58();
  const { verification: govbr } = useGovbrVerification(walletStr);

  return (
    <div className="flex flex-col gap-4">
      <section>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          gov.br identity
        </div>
        {govbr ? (
          <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm text-emerald-700 dark:text-emerald-400">
            gov.br verified as {govbr.name} (CPF {govbr.cpf})
          </div>
        ) : (
          <GovbrGate>
            <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm text-emerald-700 dark:text-emerald-400">
              gov.br verified
            </div>
          </GovbrGate>
        )}
      </section>

      <GovbrGate>{children}</GovbrGate>
    </div>
  );
}
