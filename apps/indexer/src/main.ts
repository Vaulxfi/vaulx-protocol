import { config as loadDotenv } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
// Load `.env.local` first (developer override), then `.env` (defaults). Both
// relative to apps/indexer/.
const __indexerDir = path.dirname(fileURLToPath(import.meta.url));
loadDotenv({ path: path.resolve(__indexerDir, "..", ".env.local") });
loadDotenv({ path: path.resolve(__indexerDir, "..", ".env") });

import { Connection, PublicKey } from "@solana/web3.js";
import { BorshCoder, EventParser, type Idl } from "@coral-xyz/anchor";
import { createRequire } from "node:module";
import { insertEvent } from "./supabase.js";
import { RedstonePublisher, type AppraisalQuery } from "./redstone-publisher.js";

// Load IDL JSONs via createRequire to sidestep a Node 24 ESM regression where
// re-exported JSON named-exports from @vaulx/idls fail at module-instantiation
// with "does not provide an export named 'auctionIdl'". This bypasses the
// barrel and reads the JSONs directly from the workspace package.
const require = createRequire(import.meta.url);
const vaultIdl = require("@vaulx/idls/src/vault.json");
const loanIdl = require("@vaulx/idls/src/loan.json");
const auctionIdl = require("@vaulx/idls/src/auction.json");

// Phase 3 scope (Task 3.5): subscribe to vault + loan + auction logs. trdc
// remains indirect (its events arrive through the programs that CPI into it).
//
// Anchor 0.30.1 EventParser gotcha (discovered in Task 1.9): the runtime
// parser emits `ev.name` with the first letter LOWERCASED — e.g. our
// `#[event] pub struct Deposited {...}` arrives as `ev.name === "deposited"`.
// Same applies to loan: `CustodyConfirmed` → `custodyConfirmed`, and auction:
// `AuctionCreated` → `auctionCreated`, `BidPlaced` → `bidPlaced`, etc. We
// store the name exactly as emitted; downstream consumers must match
// lowercased.
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
    buildSubscription("auction", auctionIdl),
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

  // Item 5 — RedStone-pattern price publisher. Only starts when the operator
  // supplies a signer keypair via env; absent that, the indexer keeps its
  // existing event-streaming behaviour and the loan program runs in
  // legacy-appraisal mode (oracle_admin == default).
  const signerPath = process.env.REDSTONE_SIGNER_KEYPAIR_PATH;
  if (signerPath) {
    const loanProgramId = (loanIdl as { address: string }).address;
    const appraisalBaseUrl =
      process.env.APPRAISAL_BASE_URL ?? "http://localhost:3000";
    // Comma-separated list of refs to refresh, e.g.
    //   REDSTONE_WATCHED_REFS=Rolex|Submariner|126610LN|2024|excellent,Patek|Nautilus|5711|2023|excellent
    const refsEnv = process.env.REDSTONE_WATCHED_REFS;
    const watchedRefs: AppraisalQuery[] = refsEnv
      ? refsEnv
          .split(",")
          .map((r) => r.trim())
          .filter(Boolean)
          .map((entry) => {
            const [make, model, ref, yearStr, condition] = entry
              .split("|")
              .map((s) => s.trim());
            return {
              make: make ?? "Rolex",
              model: model ?? "Submariner",
              ref: ref ?? "126610LN",
              year: Number(yearStr ?? "2024"),
              condition:
                (condition as AppraisalQuery["condition"]) ?? "excellent",
            };
          })
      : [
          {
            make: "Rolex",
            model: "Submariner",
            ref: "126610LN",
            year: 2024,
            condition: "excellent",
          },
        ];
    try {
      const publisher = new RedstonePublisher({
        rpcUrl: RPC,
        signerKeypairPath: signerPath,
        programId: loanProgramId,
        appraisalBaseUrl,
        watchedRefs,
      });
      publisher.start();
    } catch (err) {
      console.error(
        "[indexer] failed to start redstone publisher:",
        (err as Error).message,
      );
    }
  } else {
    console.log(
      "[indexer] REDSTONE_SIGNER_KEYPAIR_PATH not set — publisher disabled",
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
