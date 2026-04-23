// Phase 1 fallback: anchor-client-gen@0.28.1 (the latest published version as
// of this commit) does not understand Anchor 0.30 IDLs — it errors with
// `Unreachable.` on the new IDL shape (top-level `address`, `metadata`,
// inline `discriminator` arrays). See scripts/dev/gen-clients.mjs.
//
// Until anchor-client-gen ships 0.30 support, this module exposes a minimal
// hand-rolled facade: the raw IDLs plus typed `Program` factory helpers built
// on @coral-xyz/anchor. Consumers get full IDL-derived typing via Anchor's
// own `Program<Idl>` generics. Once anchor-client-gen supports 0.30, this
// file will be replaced with per-program re-exports of
// `./generated/{trdc,vault,loan,auction}`.
import { AnchorProvider, Program, type Idl } from "@coral-xyz/anchor";
import {
  trdcIdl,
  vaultIdl,
  loanIdl,
  auctionIdl,
} from "@vaulx/idls";

export { trdcIdl, vaultIdl, loanIdl, auctionIdl };

const makeFactory =
  <T extends Idl>(idl: T) =>
  (provider: AnchorProvider): Program<T> =>
    new Program<T>(idl, provider);

export const trdc = {
  idl: trdcIdl as unknown as Idl,
  programId: (trdcIdl as { address: string }).address,
  program: makeFactory(trdcIdl as unknown as Idl),
};

export const vault = {
  idl: vaultIdl as unknown as Idl,
  programId: (vaultIdl as { address: string }).address,
  program: makeFactory(vaultIdl as unknown as Idl),
};

export const loan = {
  idl: loanIdl as unknown as Idl,
  programId: (loanIdl as { address: string }).address,
  program: makeFactory(loanIdl as unknown as Idl),
};

export const auction = {
  idl: auctionIdl as unknown as Idl,
  programId: (auctionIdl as { address: string }).address,
  program: makeFactory(auctionIdl as unknown as Idl),
};
