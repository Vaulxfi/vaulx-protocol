import { BorshCoder, EventParser, type Idl } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

import { auctionIdl, loanIdl, trdcIdl, vaultIdl } from "@vaulx/idls";

import { PROGRAM_IDS, type ProgramName } from "../chain/decode";

/**
 * Module-level cache: one EventParser per program. The parser is built once
 * at import time so each `connection.onLogs` callback path stays cheap —
 * iterating an existing parser over a fresh log batch is O(logs), no IDL
 * re-parse per fire.
 */
interface ProgramEntry {
  name: ProgramName;
  programId: PublicKey;
  parser: EventParser;
}

const PARSERS: ProgramEntry[] = (() => {
  const programs: Array<readonly [ProgramName, unknown]> = [
    ["loan", loanIdl],
    ["vault", vaultIdl],
    ["trdc", trdcIdl],
    ["auction", auctionIdl],
  ];
  return programs.map(([name, idl]) => {
    const programId = new PublicKey(PROGRAM_IDS[name]);
    const coder = new BorshCoder(idl as Idl);
    const parser = new EventParser(programId, coder);
    return { name, programId, parser };
  });
})();

export interface ParsedEvent {
  program: ProgramName;
  event: string;
  data: unknown;
}

/** Public PDA-style accessor used by the listener to register subscriptions. */
export function programIdFor(name: ProgramName): PublicKey {
  return new PublicKey(PROGRAM_IDS[name]);
}

/**
 * Pure function: given a program nickname and the raw log lines from a
 * `connection.onLogs` callback, returns every Anchor `#[event]` emission
 * the parser recognises. Returns `[]` for empty / non-event / mismatched-
 * discriminator inputs — never throws.
 */
export function parseEvents(name: ProgramName, logs: string[]): ParsedEvent[] {
  if (logs.length === 0) return [];
  const entry = PARSERS.find((p) => p.name === name);
  if (!entry) return [];

  const out: ParsedEvent[] = [];
  for (const ev of entry.parser.parseLogs(logs)) {
    out.push({ program: entry.name, event: ev.name, data: ev.data });
  }
  return out;
}

/** Names of all programs the listener subscribes to. */
export const ALL_PROGRAM_NAMES: readonly ProgramName[] = [
  "loan",
  "vault",
  "trdc",
  "auction",
];
