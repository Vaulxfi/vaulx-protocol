/**
 * Server-side helper to mint a `KycAttestation` PDA on the vault program
 * after Sumsub returns GREEN. Uses the operator keypair (loaded from env
 * or local file via `loadOperatorKeypair`) to sign `vault.issue_kyc_attestation`.
 *
 * Idempotency: if the attestation PDA already exists, treat as success
 * (Sumsub may retry the webhook and we don't want to double-mint or error).
 *
 * IDL signature (see programs/vault/src/lib.rs):
 *   issue_kyc_attestation(owner: Pubkey, jwt_hash: [u8; 32])
 *   accounts: { kyc_attestation, vault_config, admin, system_program }
 */
import { AnchorProvider, Program, type Idl } from "@coral-xyz/anchor";
import { Connection, PublicKey, SystemProgram } from "@solana/web3.js";
import { vault as vaultFacade } from "@vaulx/anchor-client";

import {
  loadOperatorKeypair,
  walletFromKeypair,
} from "@/lib/admin/demo";

export function derivePda(wallet: PublicKey): PublicKey {
  const programId = new PublicKey(vaultFacade.programId);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("kyc_attestation"), wallet.toBuffer()],
    programId,
  )[0];
}

export type MintAttestationOpts = {
  wallet: PublicKey;
  jwtHash: Uint8Array; // 32 bytes; SHA-256 of the Sumsub-signed identity payload
  applicantId: string; // Sumsub applicant id, for audit logging
};

export type MintAttestationResult = {
  ok: true;
  pda: string;
  signature: string;
  alreadyExisted: boolean;
};

export async function mintAttestationForWallet(
  opts: MintAttestationOpts,
): Promise<MintAttestationResult> {
  if (opts.jwtHash.length !== 32) {
    throw new Error("jwtHash must be 32 bytes");
  }

  const payer = loadOperatorKeypair();
  const rpc = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
  const conn = new Connection(rpc, "confirmed");
  const provider = new AnchorProvider(conn, walletFromKeypair(payer), {
    commitment: "confirmed",
  });
  const vaultProgramId = new PublicKey(vaultFacade.programId);
  const vaultProgram = vaultFacade.program(provider) as Program<Idl>;

  const pda = derivePda(opts.wallet);

  // Idempotency: if the PDA already exists, return success without re-minting.
  const existing = await conn.getAccountInfo(pda);
  if (existing) {
    return {
      ok: true,
      pda: pda.toBase58(),
      signature: "",
      alreadyExisted: true,
    };
  }

  const vaultConfigPda = PublicKey.findProgramAddressSync(
    [Buffer.from("vault_config")],
    vaultProgramId,
  )[0];

  const sig: string = await (vaultProgram.methods as any)
    .issueKycAttestation(opts.wallet, Array.from(opts.jwtHash))
    .accounts({
      kycAttestation: pda,
      vaultConfig: vaultConfigPda,
      admin: payer.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc({ commitment: "confirmed" });

  console.log(
    `[sumsub.attestation] minted KycAttestation for ${opts.wallet
      .toBase58()
      .slice(0, 8)}… (applicant=${opts.applicantId.slice(0, 8)}…) tx=${sig.slice(0, 32)}…`,
  );

  return {
    ok: true,
    pda: pda.toBase58(),
    signature: sig,
    alreadyExisted: false,
  };
}
