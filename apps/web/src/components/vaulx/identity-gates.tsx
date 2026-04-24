"use client";

import type { ReactNode } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import { CivicPassGate } from "@/components/vaulx/civic-pass-gate";
import { GovbrGate } from "@/components/vaulx/govbr-gate";
import { useGovbrVerification } from "@/lib/govbr/mock-storage";

const CIVIC_PASS_ENABLED = !!process.env.NEXT_PUBLIC_CIVIC_PASS_NETWORK;

/**
 * Composes the Civic Pass + gov.br gates into a single stepped UI.
 *
 * Users complete Civic Pass first, then gov.br. Either can be completed
 * first in isolation, but children only render when both are satisfied.
 */
export function IdentityGates({ children }: { children: ReactNode }) {
  const { publicKey } = useWallet();
  const walletStr = publicKey?.toBase58();
  const { verification: govbr } = useGovbrVerification(walletStr);

  const step1Label = CIVIC_PASS_ENABLED ? "Step 1 of 2: Civic Pass" : null;
  const step2Label = "Step 2 of 2: gov.br identity";

  return (
    <div className="flex flex-col gap-4">
      {CIVIC_PASS_ENABLED ? (
        <section>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {step1Label}
          </div>
          <CivicPassGate>
            <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm text-emerald-700 dark:text-emerald-400">
              Civic Pass verified
            </div>
          </CivicPassGate>
        </section>
      ) : null}

      <section>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {step2Label}
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

      {/* Gate the children behind BOTH when Civic is enabled. */}
      {CIVIC_PASS_ENABLED ? (
        <CivicPassGate>
          <GovbrGate>{children}</GovbrGate>
        </CivicPassGate>
      ) : (
        <GovbrGate>{children}</GovbrGate>
      )}
    </div>
  );
}
