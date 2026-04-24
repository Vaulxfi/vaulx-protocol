"use client";

import { BN, AnchorProvider, type Idl, type Program } from "@coral-xyz/anchor";
import {
  useConnection,
  useAnchorWallet,
} from "@solana/wallet-adapter-react";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_INSTRUCTIONS_PUBKEY,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { loan as loanFacade } from "@vaulx/anchor-client";
import { rateForTermDays } from "@vaulx/terms";

const LOAN_PROGRAM_ID = new PublicKey(loanFacade.programId);
const TRDC_PROGRAM_ID = new PublicKey(
  "FcDPvRaixjAz7LeC64h9xkXPzvHT7dusbNmg83eJfr7R",
);
const VAULT_PROGRAM_ID = new PublicKey(
  "4PPyUvazjDBvFndGUL2rgKTwZrFbsSP1tk4a2uMhE9MS",
);

/** loan_authority PDA: seeds = [b"loan_authority"]. */
export function deriveLoanAuthorityPda(): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("loan_authority")],
    LOAN_PROGRAM_ID,
  );
  return pda;
}

/** Vault PDA derived in the vault program: seeds = [b"vault", asset_mint]. */
export function deriveVaultPda(assetMint: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), assetMint.toBuffer()],
    VAULT_PROGRAM_ID,
  );
  return pda;
}

/** TRDCState PDA: seeds = [b"trdc_state", loan_id]. */
export function deriveTrdcStatePda(loanId: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("trdc_state"), loanId.toBuffer()],
    LOAN_PROGRAM_ID,
  );
  return pda;
}

/** Singleton loan_config PDA: seeds = [b"loan_config"]. */
export function deriveLoanConfigPda(): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("loan_config")],
    LOAN_PROGRAM_ID,
  );
  return pda;
}

const CIVIC_PASS_NETWORK_ENV = process.env.NEXT_PUBLIC_CIVIC_PASS_NETWORK;
const CIVIC_NETWORK =
  CIVIC_PASS_NETWORK_ENV && CIVIC_PASS_NETWORK_ENV.length > 0
    ? new PublicKey(CIVIC_PASS_NETWORK_ENV)
    : null;

export interface CreateCcbTrdcArgs {
  /** Pre-generated loan id (Keypair.generate().publicKey). Used as TRDCState seed. */
  loanId: PublicKey;
  /** USDC atoms (×1_000_000). */
  appraisalValue: bigint;
  /** USDC atoms (×1_000_000). */
  loanAmount: bigint;
  /** Unix seconds (i64). */
  dueTs: number;
  /** Loan term in days — mapped to rate_bps via `rateForTermDays`. */
  termDays: number;
  /** 32-byte asset hint (typically first 32 bytes of CCB hash). */
  assetHint: Uint8Array;
}

export interface CreateCcbTrdcResult {
  txSig: string;
  trdcPda: PublicKey;
  loanId: PublicKey;
}

/**
 * Hook: calls `loan.create_ccb_trdc` with the given loan parameters.
 *
 * Mirrors the wiring pattern from `useDeposit` in `vault.ts` — derives the
 * loan_config PDA, the TRDCState PDA, and the Civic gateway token PDA when
 * the gate is enabled client-side. When the gate is disabled (env unset),
 * passes `SystemProgram.programId` as the gateway_token account — the
 * on-chain check is a no-op when `loan_config.civic_network == default`.
 */
export function useCreateCcbTrdc() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  return useMutation({
    mutationFn: async (
      args: CreateCcbTrdcArgs,
    ): Promise<CreateCcbTrdcResult> => {
      if (!wallet) throw new Error("Connect your wallet first");
      if (args.assetHint.length !== 32) {
        throw new Error("asset_hint must be exactly 32 bytes");
      }

      const provider = new AnchorProvider(connection, wallet, {
        commitment: "confirmed",
      });
      const program = loanFacade.program(provider) as Program<Idl>;

      const trdcPda = deriveTrdcStatePda(args.loanId);
      const loanConfigPda = deriveLoanConfigPda();

      let gatewayTokenKey: PublicKey = SystemProgram.programId;
      if (CIVIC_NETWORK) {
        try {
          const { findGatewayToken } = await import(
            "@identity.com/solana-gateway-ts"
          );
          const token = await findGatewayToken(
            connection,
            wallet.publicKey,
            CIVIC_NETWORK,
          );
          if (token?.publicKey) gatewayTokenKey = token.publicKey as PublicKey;
        } catch (e) {
          throw new Error(
            `Civic Pass not found. Obtain a pass before minting a TRDC. (${
              e instanceof Error ? e.message : String(e)
            })`,
          );
        }
      }

      const rateBps = rateForTermDays(args.termDays);

      const sig = await (program.methods as any)
        .createCcbTrdc(
          args.loanId,
          new BN(args.appraisalValue.toString()),
          new BN(args.loanAmount.toString()),
          new BN(args.dueTs),
          new BN(rateBps),
          Array.from(args.assetHint),
        )
        .accounts({
          trdcState: trdcPda,
          trdcProgram: TRDC_PROGRAM_ID,
          payer: wallet.publicKey,
          systemProgram: SystemProgram.programId,
          loanConfig: loanConfigPda,
          gatewayToken: gatewayTokenKey,
        })
        .rpc();

      return {
        txSig: sig as string,
        trdcPda,
        loanId: args.loanId,
      };
    },
  });
}

/** Utility: generate a fresh loan_id keypair for a new loan. */
export function generateLoanId(): PublicKey {
  return Keypair.generate().publicKey;
}

// ---------------------------------------------------------------------------
// Moment 5 — `loan.pay_installment`
// ---------------------------------------------------------------------------

export interface LoanInstallmentArgs {
  trdcPda: PublicKey;
  assetMint: PublicKey;
  /** USDC atoms (×1_000_000). */
  amount: bigint;
}

export interface LoanTxResult {
  txSig: string;
}

/**
 * Hook: calls `loan.pay_installment(amount)` from the connected borrower
 * wallet. Decrements the TRDC `principal_remaining` by `amount` and moves
 * USDC from the borrower ATA into the vault ATA via a signed SPL transfer.
 */
export function useLoanInstallment() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (args: LoanInstallmentArgs): Promise<LoanTxResult> => {
      if (!wallet) throw new Error("Connect your wallet first");
      if (args.amount <= 0n) throw new Error("Amount must be > 0");

      const provider = new AnchorProvider(connection, wallet, {
        commitment: "confirmed",
      });
      const program = loanFacade.program(provider) as Program<Idl>;

      const vaultPda = deriveVaultPda(args.assetMint);
      const vaultAta = getAssociatedTokenAddressSync(
        args.assetMint,
        vaultPda,
        true,
      );
      const borrowerAta = getAssociatedTokenAddressSync(
        args.assetMint,
        wallet.publicKey,
      );
      const loanAuthority = deriveLoanAuthorityPda();

      const sig = await (program.methods as any)
        .payInstallment(new BN(args.amount.toString()))
        .accounts({
          trdcState: args.trdcPda,
          vault: vaultPda,
          assetMint: args.assetMint,
          vaultAta,
          borrowerAta,
          borrower: wallet.publicKey,
          loanAuthority,
          trdcProgram: TRDC_PROGRAM_ID,
          vaultProgram: VAULT_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          instructionsSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
        })
        .rpc();

      qc.invalidateQueries({
        queryKey: ["loan-summary", args.trdcPda.toBase58()],
      });
      qc.invalidateQueries({
        queryKey: ["trdcState", args.trdcPda.toBase58()],
      });

      return { txSig: sig as string };
    },
  });
}

// ---------------------------------------------------------------------------
// Moment 6 — `loan.renew_ccb`
// ---------------------------------------------------------------------------

export interface LoanRenewArgs {
  trdcPda: PublicKey;
  assetMint: PublicKey;
  /** 30 / 60 / 90 — used both on-chain (log) and to derive new_rate_bps client-side. */
  newTermDays: number;
  /** Unix seconds — typically now + newTermDays*86400. */
  newDueTs: number;
}

export function useLoanRenew() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (args: LoanRenewArgs): Promise<LoanTxResult> => {
      if (!wallet) throw new Error("Connect your wallet first");
      const newRateBps = rateForTermDays(args.newTermDays);

      const provider = new AnchorProvider(connection, wallet, {
        commitment: "confirmed",
      });
      const program = loanFacade.program(provider) as Program<Idl>;

      const vaultPda = deriveVaultPda(args.assetMint);
      const vaultAta = getAssociatedTokenAddressSync(
        args.assetMint,
        vaultPda,
        true,
      );
      const borrowerAta = getAssociatedTokenAddressSync(
        args.assetMint,
        wallet.publicKey,
      );
      const loanAuthority = deriveLoanAuthorityPda();

      const sig = await (program.methods as any)
        .renewCcb(
          new BN(args.newTermDays),
          new BN(args.newDueTs),
          new BN(newRateBps),
        )
        .accounts({
          trdcState: args.trdcPda,
          vault: vaultPda,
          assetMint: args.assetMint,
          vaultAta,
          borrowerAta,
          borrower: wallet.publicKey,
          loanAuthority,
          trdcProgram: TRDC_PROGRAM_ID,
          vaultProgram: VAULT_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          instructionsSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
        })
        .rpc();

      qc.invalidateQueries({
        queryKey: ["loan-summary", args.trdcPda.toBase58()],
      });
      qc.invalidateQueries({
        queryKey: ["trdcState", args.trdcPda.toBase58()],
      });

      return { txSig: sig as string };
    },
  });
}

// ---------------------------------------------------------------------------
// Moment 5 (full) — `loan.repay_ccb`
// ---------------------------------------------------------------------------

export interface LoanRepayArgs {
  trdcPda: PublicKey;
  assetMint: PublicKey;
}

export function useLoanRepay() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (args: LoanRepayArgs): Promise<LoanTxResult> => {
      if (!wallet) throw new Error("Connect your wallet first");

      const provider = new AnchorProvider(connection, wallet, {
        commitment: "confirmed",
      });
      const program = loanFacade.program(provider) as Program<Idl>;

      const vaultPda = deriveVaultPda(args.assetMint);
      const vaultAta = getAssociatedTokenAddressSync(
        args.assetMint,
        vaultPda,
        true,
      );
      const borrowerAta = getAssociatedTokenAddressSync(
        args.assetMint,
        wallet.publicKey,
      );
      const loanAuthority = deriveLoanAuthorityPda();

      const sig = await (program.methods as any)
        .repayCcb()
        .accounts({
          trdcState: args.trdcPda,
          vault: vaultPda,
          assetMint: args.assetMint,
          vaultAta,
          borrowerAta,
          borrower: wallet.publicKey,
          loanAuthority,
          trdcProgram: TRDC_PROGRAM_ID,
          vaultProgram: VAULT_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          instructionsSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
        })
        .rpc();

      qc.invalidateQueries({
        queryKey: ["loan-summary", args.trdcPda.toBase58()],
      });
      qc.invalidateQueries({
        queryKey: ["trdcState", args.trdcPda.toBase58()],
      });

      return { txSig: sig as string };
    },
  });
}
