import "dotenv/config";
import { Connection, PublicKey } from "@solana/web3.js";
import { BorshCoder, EventParser, type Idl } from "@coral-xyz/anchor";
import { vaultIdl, loanIdl } from "@vaulx/idls";
import { insertEvent } from "./supabase.js";

// Phase 2 scope (Task 2.9): subscribe to vault + loan logs. trdc / auction
// come later.
//
// Anchor 0.30.1 EventParser gotcha (discovered in Task 1.9): the runtime
// parser emits `ev.name` with the first letter LOWERCASED — e.g. our
// `#[event] pub struct Deposited {...}` arrives as `ev.name === "deposited"`.
// Same applies to loan: `CustodyConfirmed` → `custodyConfirmed`. We store
// the name exactly as emitted; downstream consumers must match lowercased.
//
// To run locally you must populate apps/indexer/.env.local with:
//   SUPABASE_URL=...
//   SUPABASE_SERVICE_ROLE_KEY=... (service-role, server-only)
//   SOLANA_RPC_URL=... (optional, defaults to public devnet)

const RPC = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";

interface Subscription {
  label: string;
  programId: PublicKey;
  parser: EventParser;
}

function buildSubscription(label: string, idl: unknown): Subscription {
  const programId = new PublicKey((idl as { address: string }).address);
  const parser = new EventParser(programId, new BorshCoder(idl as Idl));
  return { label, programId, parser };
}

async function main(): Promise<void> {
  const conn = new Connection(RPC, "confirmed");

  const subs: Subscription[] = [
    buildSubscription("vault", vaultIdl),
    buildSubscription("loan", loanIdl),
  ];

  for (const sub of subs) {
    conn.onLogs(
      sub.programId,
      async ({ signature, logs, err }, ctx) => {
        if (err) return;
        for (const ev of sub.parser.parseLogs(logs)) {
          const payload = JSON.parse(
            JSON.stringify(ev.data, (_k, v) => {
              if (typeof v === "bigint") return v.toString();
              if (v && typeof v.toBase58 === "function") return v.toBase58();
              return v;
            }),
          );
          try {
            await insertEvent({
              program_id: sub.programId.toBase58(),
              event_name: ev.name,
              payload,
              slot: ctx.slot,
              signature,
            });
            console.log(
              `[indexer:${sub.label}] ${ev.name} slot=${ctx.slot} sig=${signature.slice(0, 8)}…`,
            );
          } catch (e) {
            // `23505` is the unique-constraint violation we expect on reconnect replay.
            const code = (e as { code?: string }).code;
            if (code !== "23505") console.error(`[indexer:${sub.label}] insert failed:`, e);
          }
        }
      },
    );

    console.log(
      `[indexer] subscribed to ${sub.label} ${sub.programId.toBase58()} on ${RPC}`,
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
