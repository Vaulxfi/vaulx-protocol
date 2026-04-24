"use client";

import { AnchorProvider, type Idl, type Program } from "@coral-xyz/anchor";
import {
  useConnection,
  useAnchorWallet,
} from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useMutation, useQuery } from "@tanstack/react-query";
import { loan as loanFacade } from "@vaulx/anchor-client";

import { deriveLoanConfigPda } from "./loan";

const LOAN_PROGRAM_ID = new PublicKey(loanFacade.programId);
const TRDC_PROGRAM_ID = new PublicKey(
  "FcDPvRaixjAz7LeC64h9xkXPzvHT7dusbNmg83eJfr7R",
);

export interface LoanConfigAccount {
  admin: PublicKey;
  custodian: PublicKey;
  civicNetwork: PublicKey;
  bump: number;
}

/**
 * Read-only fetch of the singleton LoanConfig account. Returns `null` when
 * the account is not initialised (Task 2.10 inits it on Devnet).
 */
export function useLoanConfig() {
  const { connection } = useConnection();

  return useQuery({
    queryKey: ["loanConfig", LOAN_PROGRAM_ID.toBase58()],
    queryFn: async (): Promise<LoanConfigAccount | null> => {
      const readonlyWallet = {
        publicKey: PublicKey.default,
        signTransaction: async <T,>(tx: T) => tx,
        signAllTransactions: async <T,>(txs: T[]) => txs,
      };
      const provider = new AnchorProvider(
        connection,
        readonlyWallet,
        { commitment: "confirmed" },
      );
      const program = loanFacade.program(provider) as Program<Idl>;
      const pda = deriveLoanConfigPda();
      try {
        const acc = (await (program.account as any).loanConfig.fetch(
          pda,
        )) as LoanConfigAccount;
        return acc;
      } catch (e) {
        if (
          e instanceof Error &&
          /Account does not exist|has no data|AccountNotFound/i.test(e.message)
        ) {
          return null;
        }
        throw e;
      }
    },
  });
}

export interface TrdcStateAccount {
  loanId: PublicKey;
  status: Record<string, unknown>;
  appraisalValue: bigint;
  loanAmount: bigint;
  dueTs: bigint;
  bump: number;
  assetId: PublicKey;
  createdAt: bigint;
  docHash: number[];
}

/**
 * Read-only fetch of the TRDCState account at the given PDA. Returns `null`
 * when missing. The account lives on the **trdc** program — anchor's typed
 * account fetcher uses that IDL.
 */
export function useTrdcState(trdcPda: PublicKey | undefined) {
  const { connection } = useConnection();
  return useQuery({
    queryKey: ["trdcState", trdcPda?.toBase58() ?? "none"],
    enabled: !!trdcPda,
    queryFn: async (): Promise<TrdcStateAccount | null> => {
      if (!trdcPda) return null;
      const { trdc: trdcFacade } = await import("@vaulx/anchor-client");
      const readonlyWallet = {
        publicKey: PublicKey.default,
        signTransaction: async <T,>(tx: T) => tx,
        signAllTransactions: async <T,>(txs: T[]) => txs,
      };
      const provider = new AnchorProvider(
        connection,
        readonlyWallet,
        { commitment: "confirmed" },
      );
      const program = trdcFacade.program(provider) as Program<Idl>;
      try {
        const acc = (await (program.account as any).trdcState.fetch(
          trdcPda,
        )) as TrdcStateAccount;
        return acc;
      } catch (e) {
        if (
          e instanceof Error &&
          /Account does not exist|has no data|AccountNotFound/i.test(e.message)
        ) {
          return null;
        }
        throw e;
      }
    },
  });
}

export interface ConfirmCustodyArgs {
  trdcPda: PublicKey;
  /** 32-byte CCB hash (hex-decoded). */
  docHash: Uint8Array;
}

export interface ConfirmCustodyResult {
  txSig: string;
}

/**
 * Hook: calls `loan.confirm_custody(doc_hash)` as the custodian signer.
 *
 * Mirrors the wiring pattern from `useCreateCcbTrdc`. Accounts from the
 * post-2.1 loan IDL:
 *   trdc_state, loan_config, trdc_program, custodian (signer).
 */
export function useConfirmCustody() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  return useMutation({
    mutationFn: async (
      args: ConfirmCustodyArgs,
    ): Promise<ConfirmCustodyResult> => {
      if (!wallet) throw new Error("Connect the custodian wallet first");
      if (args.docHash.length !== 32) {
        throw new Error("doc_hash must be exactly 32 bytes");
      }

      const provider = new AnchorProvider(connection, wallet, {
        commitment: "confirmed",
      });
      const program = loanFacade.program(provider) as Program<Idl>;

      const loanConfigPda = deriveLoanConfigPda();

      const sig = await (program.methods as any)
        .confirmCustody(Array.from(args.docHash))
        .accounts({
          trdcState: args.trdcPda,
          loanConfig: loanConfigPda,
          trdcProgram: TRDC_PROGRAM_ID,
          custodian: wallet.publicKey,
        })
        .rpc();

      return { txSig: sig as string };
    },
  });
}

/** Utility: decode a 64-hex-char string into a 32-byte Uint8Array. */
export function hexToBytes32(hex: string): Uint8Array {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (!/^[0-9a-fA-F]{64}$/.test(clean)) {
    throw new Error("doc_hash must be 64 hex chars (32 bytes)");
  }
  const out = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}
