import { BorshAccountsCoder, type Idl } from "@coral-xyz/anchor";
import type { PublicKey } from "@solana/web3.js";
import { auctionIdl, loanIdl, trdcIdl, vaultIdl } from "@vaulx/idls";

interface RegistryEntry {
  name: string;
  idl: Idl;
  coder: BorshAccountsCoder;
}

/**
 * Public lookup table from program nickname → on-chain program id (base58).
 * Typed routes consume this to validate `account.owner` against the program
 * they expect. Keys also drive the `ProgramName` type used by `decodeAs`.
 */
export const PROGRAM_IDS = {
  loan: (loanIdl as { address: string }).address,
  vault: (vaultIdl as { address: string }).address,
  trdc: (trdcIdl as { address: string }).address,
  auction: (auctionIdl as { address: string }).address,
};

export type ProgramName = keyof typeof PROGRAM_IDS;

/**
 * One-time registry build. Keyed by program id (base58 string) so account
 * decode lookups go owner → entry in O(1). Each entry caches its
 * BorshAccountsCoder so we don't re-parse the IDL on every request.
 */
const REGISTRY: Record<string, RegistryEntry> = (() => {
  const r: Record<string, RegistryEntry> = {};
  const programs: Array<readonly [ProgramName, unknown]> = [
    ["loan", loanIdl],
    ["vault", vaultIdl],
    ["trdc", trdcIdl],
    ["auction", auctionIdl],
  ];
  for (const [name, idl] of programs) {
    const programId = (idl as { address: string }).address;
    const typedIdl = idl as Idl;
    r[programId] = {
      name,
      idl: typedIdl,
      coder: new BorshAccountsCoder(typedIdl),
    };
  }
  return r;
})();

/**
 * Typed-known decode: given a program nickname and the IDL account type
 * name, decode `data` as that account. Throws if the discriminator/layout
 * doesn't match — callers should catch and surface as 500 `decode_failed`,
 * which only fires when the on-disk IDL drifted from the deployed program.
 */
export function decodeAs<T = unknown>(
  programName: ProgramName,
  accountType: string,
  data: Buffer,
): T {
  const entry = REGISTRY[PROGRAM_IDS[programName]];
  if (!entry) {
    // Type-level impossibility — defensive throw to make the failure mode
    // legible if someone bypasses the type system.
    throw new Error(`unknown program: ${programName}`);
  }
  return entry.coder.decode<T>(accountType, data);
}

export interface DecodedAccount {
  /** One of: "loan" | "vault" | "trdc" | "auction". */
  program: string;
  /** Anchor account name from the IDL (e.g. "LoanConfig", "TRDCState"). */
  type: string;
  /** Decoded fields with the IDL-named structure. */
  fields: unknown;
}

/**
 * Hybrid-mode decode: returns null when the owner is not one of our four
 * programs OR the 8-byte discriminator doesn't match any registered account
 * type. Callers always get the raw bytes alongside this result, so a `null`
 * here is never a hard failure — it just means the caller has to interpret
 * the bytes itself.
 */
export function tryDecodeAccount(
  owner: PublicKey,
  data: Buffer,
): DecodedAccount | null {
  const entry = REGISTRY[owner.toBase58()];
  if (!entry || data.length < 8) return null;

  const accounts = (entry.idl.accounts ?? []) as Array<{
    name: string;
    discriminator?: number[];
  }>;

  for (const acc of accounts) {
    if (!acc.discriminator || acc.discriminator.length !== 8) continue;
    let match = true;
    for (let i = 0; i < 8; i++) {
      if (data[i] !== acc.discriminator[i]) {
        match = false;
        break;
      }
    }
    if (!match) continue;
    try {
      return {
        program: entry.name,
        type: acc.name,
        fields: entry.coder.decode(acc.name, data),
      };
    } catch {
      // Discriminator matched but the body failed Borsh decode — typically
      // means the IDL on disk is out of sync with the deployed program.
      // Surface as `decoded: null`; the caller sees `dataBase64` and knows
      // they hit a known program but couldn't interpret the layout.
      return null;
    }
  }
  return null;
}
