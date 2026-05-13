import { AnchorProvider, type Idl, type Program } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { loan as loanFacade, vault as vaultFacade } from "@vaulx/anchor-client";

import {
  deriveLoanConfigPda,
  deriveVaultPda,
} from "@/lib/chain/loan-accounts";

/**
 * Server-side read-only on-chain snapshot for the marketing surface.
 *
 * Mirrors Laravel `HomeController@index`: fetches `loan_config` (singleton
 * PDA under the loan program) and `vault` (per-asset PDA under the vault
 * program), shaped into the same envelope so the view layer renders the
 * same fallback when either read fails. 60-second cache matches Laravel.
 */

export interface OnchainEnvelope {
  ok: boolean;
  data?: Record<string, unknown> | null;
  error?: string;
}

export interface HomeOnchain {
  asset_mint: string;
  loan_config: OnchainEnvelope;
  vault: OnchainEnvelope;
  fetched_at: string;
}

const READONLY_WALLET = (() => {
  const kp = Keypair.generate();
  return {
    publicKey: kp.publicKey,
    signTransaction: async <T,>(tx: T) => tx,
    signAllTransactions: async <T,>(txs: T[]) => txs,
  };
})();

function rpcUrl(): string {
  return (
    process.env.SOLANA_RPC_URL ??
    process.env.NEXT_PUBLIC_RPC_URL ??
    "https://api.devnet.solana.com"
  );
}

function provider(): AnchorProvider {
  const conn = new Connection(rpcUrl(), "confirmed");
  return new AnchorProvider(conn, READONLY_WALLET, { commitment: "confirmed" });
}

async function readLoanConfig(): Promise<OnchainEnvelope> {
  try {
    const program = loanFacade.program(provider()) as Program<Idl>;
    const pda = deriveLoanConfigPda();
    const slot = await program.provider.connection.getSlot();
    const acc = (await (program.account as unknown as {
      loanConfig: { fetch: (k: PublicKey) => Promise<Record<string, unknown>> };
    }).loanConfig.fetch(pda)) as Record<string, unknown>;

    return {
      ok: true,
      data: {
        slot,
        fields: {
          kyc_required: Boolean(acc.kycRequired),
          oracle_admin:
            (acc.oracleAdmin as PublicKey | undefined)?.toBase58?.() ?? "",
          admin: (acc.admin as PublicKey | undefined)?.toBase58?.() ?? "",
        },
      },
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "unknown_error",
    };
  }
}

async function readVault(assetMint: string): Promise<OnchainEnvelope> {
  if (!assetMint) {
    return { ok: false, error: "asset_mint_missing" };
  }
  try {
    const mintKey = new PublicKey(assetMint);
    const program = vaultFacade.program(provider()) as Program<Idl>;
    const pda = deriveVaultPda(mintKey);
    const slot = await program.provider.connection.getSlot();
    const acc = (await (program.account as unknown as {
      vault: { fetch: (k: PublicKey) => Promise<Record<string, unknown>> };
    }).vault.fetch(pda)) as Record<string, unknown>;

    const totalAssets = (acc.totalAssets as { toString: () => string } | undefined)
      ?.toString?.();
    const totalShares = (acc.totalShares as { toString: () => string } | undefined)
      ?.toString?.();

    return {
      ok: true,
      data: {
        slot,
        fields: {
          total_assets: totalAssets ? Number(totalAssets) : 0,
          total_shares: totalShares ? Number(totalShares) : 0,
        },
      },
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "unknown_error",
    };
  }
}

function formatTimestamp(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ` +
    `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`
  );
}

export async function readHomeOnchain(): Promise<HomeOnchain> {
  const assetMint = process.env.NEXT_PUBLIC_USDC_MINT ?? "";
  const [loan_config, vault] = await Promise.all([
    readLoanConfig(),
    readVault(assetMint),
  ]);
  return {
    asset_mint: assetMint,
    loan_config,
    vault,
    fetched_at: formatTimestamp(new Date()),
  };
}
