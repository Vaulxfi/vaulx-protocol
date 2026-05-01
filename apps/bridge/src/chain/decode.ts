import { BorshAccountsCoder, type Idl } from "@coral-xyz/anchor";
import type { PublicKey } from "@solana/web3.js";
import { auctionIdl, loanIdl, trdcIdl, vaultIdl } from "@vaulx/idls";

interface RegistryEntry {
  name: string;
  idl: Idl;
  coder: BorshAccountsCoder;
}

/**
 * One-time registry build. Keyed by program id (base58 string) so account
 * decode lookups go owner → entry in O(1). Each entry caches its
 * BorshAccountsCoder so we don't re-parse the IDL on every request.
 */
const REGISTRY: Record<string, RegistryEntry> = (() => {
  const r: Record<string, RegistryEntry> = {};
  const programs: Array<readonly [string, unknown]> = [
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
