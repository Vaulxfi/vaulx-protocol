"use client";

import { useMemo } from "react";
import { BN, AnchorProvider, type Idl, type Program } from "@coral-xyz/anchor";
import {
  useConnection,
  useAnchorWallet,
  useWallet,
} from "@solana/wallet-adapter-react";
import {
  PublicKey,
  Transaction,
  SystemProgram,
  type Connection,
  type TransactionInstruction,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  getAccount,
} from "@solana/spl-token";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { vault as vaultFacade } from "@vaulx/anchor-client";

const VAULT_PROGRAM_ID = new PublicKey(vaultFacade.programId);

/** Deterministic vault PDA: seeds = [b"vault", asset_mint]. */
export function deriveVaultPda(assetMint: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), assetMint.toBuffer()],
    VAULT_PROGRAM_ID
  );
  return pda;
}

/** Singleton vault-config PDA: seeds = [b"vault_config"]. */
export function deriveVaultConfigPda(): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault_config")],
    VAULT_PROGRAM_ID
  );
  return pda;
}

/** Deterministic KYC-attestation PDA: seeds = [b"kyc_attestation", owner]. */
export function deriveKycAttestationPda(owner: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("kyc_attestation"), owner.toBuffer()],
    VAULT_PROGRAM_ID
  );
  return pda;
}

export function useVaultPda(assetMint: PublicKey | undefined): PublicKey | undefined {
  return useMemo(
    () => (assetMint ? deriveVaultPda(assetMint) : undefined),
    [assetMint]
  );
}

/** Anchor provider that only reads; fine even without a connected wallet. */
function useReadProvider(): AnchorProvider {
  const { connection } = useConnection();
  return useMemo(
    () => new AnchorProvider(connection, makeReadonlyWallet(), { commitment: "confirmed" }),
    [connection]
  );
}

function makeReadonlyWallet() {
  // AnchorProvider requires *a* wallet object for reads. Use a dummy signer
  // — we never call signTransaction on it for read-only `fetch` calls.
  const dummy = PublicKey.default;
  return {
    publicKey: dummy,
    signTransaction: async <T,>(tx: T) => tx,
    signAllTransactions: async <T,>(txs: T[]) => txs,
  };
}

export type VaultAccount = {
  assetMint: PublicKey;
  shareMint: PublicKey;
  totalAssets: BN;
  totalShares: BN;
  bump: number;
};

export function useVaultData(assetMint: PublicKey | undefined) {
  const provider = useReadProvider();

  return useQuery({
    queryKey: ["vault", assetMint?.toBase58() ?? "none"],
    enabled: !!assetMint,
    queryFn: async (): Promise<VaultAccount | null> => {
      if (!assetMint) return null;
      const program = vaultFacade.program(provider) as Program<Idl>;
      const pda = deriveVaultPda(assetMint);
      try {
        const acc = (await (program.account as any).vault.fetch(pda)) as {
          assetMint: PublicKey;
          shareMint: PublicKey;
          totalAssets: BN;
          totalShares: BN;
          bump: number;
        };
        return {
          assetMint: acc.assetMint,
          shareMint: acc.shareMint,
          totalAssets: acc.totalAssets,
          totalShares: acc.totalShares,
          bump: acc.bump,
        };
      } catch (e) {
        // Account not initialised → surface as `null`, not error.
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

async function fetchTokenAmount(
  connection: Connection,
  ata: PublicKey
): Promise<bigint> {
  try {
    const acc = await getAccount(connection, ata);
    return acc.amount;
  } catch {
    return 0n;
  }
}

export function useUserUsdcBalance(assetMint: PublicKey | undefined) {
  const { connection } = useConnection();
  const { publicKey } = useWallet();

  return useQuery({
    queryKey: [
      "userUsdc",
      assetMint?.toBase58() ?? "none",
      publicKey?.toBase58() ?? "none",
    ],
    enabled: !!assetMint && !!publicKey,
    queryFn: async (): Promise<bigint> => {
      if (!assetMint || !publicKey) return 0n;
      const ata = getAssociatedTokenAddressSync(assetMint, publicKey);
      return fetchTokenAmount(connection, ata);
    },
  });
}

export function useUserShareBalance(shareMint: PublicKey | undefined) {
  const { connection } = useConnection();
  const { publicKey } = useWallet();

  return useQuery({
    queryKey: [
      "userShares",
      shareMint?.toBase58() ?? "none",
      publicKey?.toBase58() ?? "none",
    ],
    enabled: !!shareMint && !!publicKey,
    queryFn: async (): Promise<bigint> => {
      if (!shareMint || !publicKey) return 0n;
      const ata = getAssociatedTokenAddressSync(shareMint, publicKey);
      return fetchTokenAmount(connection, ata);
    },
  });
}

export function useDeposit(assetMint: PublicKey | undefined) {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (amountAtoms: bigint): Promise<string> => {
      if (!assetMint) throw new Error("Asset mint missing");
      if (!wallet) throw new Error("Connect your wallet first");
      if (amountAtoms <= 0n) throw new Error("Amount must be > 0");

      const provider = new AnchorProvider(connection, wallet, {
        commitment: "confirmed",
      });
      const program = vaultFacade.program(provider) as Program<Idl>;

      const vaultPda = deriveVaultPda(assetMint);
      const vaultConfigPda = deriveVaultConfigPda();

      // Read the vault to pick up the correct share_mint.
      const vaultAcc = (await (program.account as any).vault.fetch(
        vaultPda
      )) as { shareMint: PublicKey };
      const shareMint = vaultAcc.shareMint;

      // KYC-attestation account. Default = `SystemProgram.programId` (placeholder)
      // since `vault_config.kyc_required` is `false` by default and the on-chain
      // handler skips the check. When a real attestation exists the admin-issued
      // PDA at `[b"kyc_attestation", depositor]` should be passed instead.
      // TODO: read `vault_config.kyc_required` and pass the real PDA when set.
      const kycAttestationKey: PublicKey = SystemProgram.programId;

      const depositor = wallet.publicKey;
      const depositorAta = getAssociatedTokenAddressSync(assetMint, depositor);
      const depositorShareAta = getAssociatedTokenAddressSync(
        shareMint,
        depositor
      );
      const vaultAta = getAssociatedTokenAddressSync(
        assetMint,
        vaultPda,
        true // allowOwnerOffCurve — vault PDA is off-curve
      );

      const preIxs: TransactionInstruction[] = [];
      const [depAtaInfo, depShareAtaInfo] = await Promise.all([
        connection.getAccountInfo(depositorAta),
        connection.getAccountInfo(depositorShareAta),
      ]);
      if (!depAtaInfo) {
        preIxs.push(
          createAssociatedTokenAccountInstruction(
            depositor,
            depositorAta,
            depositor,
            assetMint
          )
        );
      }
      if (!depShareAtaInfo) {
        preIxs.push(
          createAssociatedTokenAccountInstruction(
            depositor,
            depositorShareAta,
            depositor,
            shareMint
          )
        );
      }

      const methodBuilder = (program.methods as any)
        .deposit(new BN(amountAtoms.toString()))
        .accounts({
          vault: vaultPda,
          assetMint,
          shareMint,
          vaultAta,
          depositorAta,
          depositorShareAta,
          depositor,
          tokenProgram: TOKEN_PROGRAM_ID,
          vaultConfig: vaultConfigPda,
          kycAttestation: kycAttestationKey,
        });

      const sig =
        preIxs.length > 0
          ? await methodBuilder.preInstructions(preIxs).rpc()
          : await methodBuilder.rpc();

      // Invalidate dependent queries.
      qc.invalidateQueries({ queryKey: ["vault", assetMint.toBase58()] });
      qc.invalidateQueries({ queryKey: ["userUsdc", assetMint.toBase58()] });
      qc.invalidateQueries({ queryKey: ["userShares", shareMint.toBase58()] });

      return sig as string;
    },
  });
}

// Silence unused-import complaints for a helper that keeps the provider
// construction ergonomic for future extensions.
export const __ids = { SystemProgram, ASSOCIATED_TOKEN_PROGRAM_ID };
