import "dotenv/config";
import { Connection, PublicKey } from "@solana/web3.js";
import { BorshCoder, EventParser, type Idl } from "@coral-xyz/anchor";
import { vaultIdl } from "@vaulx/idls";
import { insertEvent } from "./supabase.js";

// Phase 1 scope: subscribe to vault logs only. trdc / loan come in Phase 2.
//
// Anchor 0.30.1 EventParser gotcha (discovered in Task 1.9): the runtime
// parser emits `ev.name` with the first letter LOWERCASED — e.g. our
// `#[event] pub struct Deposited {...}` arrives as `ev.name === "deposited"`.
// We store the name exactly as emitted; any downstream consumer (FE queries,
// indexer analytics) must match against the lowercased form.
//
// To run locally you must populate apps/indexer/.env.local with:
//   SUPABASE_URL=...
//   SUPABASE_SERVICE_ROLE_KEY=... (service-role, server-only)
//   SOLANA_RPC_URL=... (optional, defaults to public devnet)

const RPC = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
const VAULT_PROGRAM = new PublicKey((vaultIdl as { address: string }).address);

async function main(): Promise<void> {
  const conn = new Connection(RPC, "confirmed");
  const parser = new EventParser(
    VAULT_PROGRAM,
    new BorshCoder(vaultIdl as unknown as Idl),
  );

  conn.onLogs(
    VAULT_PROGRAM,
    async ({ signature, logs, err }, ctx) => {
      if (err) return;
      for (const ev of parser.parseLogs(logs)) {
        const payload = JSON.parse(
          JSON.stringify(ev.data, (_k, v) => {
            if (typeof v === "bigint") return v.toString();
            if (v && typeof v.toBase58 === "function") return v.toBase58();
            return v;
          }),
        );
        try {
          await insertEvent({
            program_id: VAULT_PROGRAM.toBase58(),
            event_name: ev.name,
            payload,
            slot: ctx.slot,
            signature,
          });
          console.log(
            `[indexer] ${ev.name} slot=${ctx.slot} sig=${signature.slice(0, 8)}…`,
          );
        } catch (e) {
          // `23505` is the unique-constraint violation we expect on reconnect replay.
          const code = (e as { code?: string }).code;
          if (code !== "23505") console.error("[indexer] insert failed:", e);
        }
      }
    },
  );

  console.log(
    `[indexer] subscribed to vault ${VAULT_PROGRAM.toBase58()} on ${RPC}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
