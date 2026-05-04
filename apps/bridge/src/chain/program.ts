import { Program, type Idl } from "@coral-xyz/anchor";
import { loanIdl, vaultIdl, trdcIdl } from "@vaulx/idls";

import type { BridgeProvider } from "./provider";

/**
 * Anchor `Program` builders, one per Vaulx on-chain program.
 *
 * Each loader closes over the bridge's AnchorProvider so the resulting
 * `Program` shares the operator wallet and connection. Constructed lazily
 * (one per request) — Anchor 0.30's Program is cheap to instantiate; the
 * heavy work is the IDL parse, which `@vaulx/idls` already does at
 * import-time. Keeping the constructors stateless avoids a class of bugs
 * where a long-lived Program holds a stale `lastValidBlockHeight` between
 * calls.
 */

export function loadLoanProgram(provider: BridgeProvider): Program<Idl> {
  return new Program(loanIdl as Idl, provider.anchor);
}

export function loadVaultProgram(provider: BridgeProvider): Program<Idl> {
  return new Program(vaultIdl as Idl, provider.anchor);
}

export function loadTrdcProgram(provider: BridgeProvider): Program<Idl> {
  return new Program(trdcIdl as Idl, provider.anchor);
}
