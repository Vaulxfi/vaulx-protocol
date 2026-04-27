"use client";

import type { ReactNode } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import { CivicAuthGate } from "@/components/vaulx/civic-auth-gate";
import { GovbrGate } from "@/components/vaulx/govbr-gate";
import { useGovbrVerification } from "@/lib/govbr/mock-storage";

const CIVIC_AUTH_ENABLED = !!process.env.NEXT_PUBLIC_CIVIC_AUTH_CLIENT_ID;

/**
 * Composes the Civic Auth + gov.br gates into a single stepped UI.
 *
 * Users complete Civic Auth first, then gov.br. Either can be completed
 * first in isolation, but children only render when both are satisfied.
 */
export function IdentityGates({ children }: { children: ReactNode }) {
  const { publicKey } = useWallet();
  const walletStr = publicKey?.toBase58();
  const { verification: govbr } = useGovbrVerification(walletStr);

  const step1Label = CIVIC_AUTH_ENABLED ? "Step 1 of 2: Civic Auth" : null;
  const step2Label = "Step 2 of 2: gov.br identity";

  return (
    <div className="flex flex-col gap-4">
      {CIVIC_AUTH_ENABLED ? (
        <section>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {step1Label}
          </div>
          <CivicAuthGate>
            <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm text-emerald-700 dark:text-emerald-400">
              Civic Auth verified
            </div>
          </CivicAuthGate>
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

      {/*
       * Gate children behind BOTH gates. `<CivicAuthGate>` is self-aware of
       * the env flag — it becomes a no-op passthrough when Civic Auth is
       * disabled, so we don't need to branch here.
       */}
      <CivicAuthGate>
        <GovbrGate>{children}</GovbrGate>
      </CivicAuthGate>
    </div>
  );
}
