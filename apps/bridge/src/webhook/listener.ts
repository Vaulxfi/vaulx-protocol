import type { Connection } from "@solana/web3.js";

import { ALL_PROGRAM_NAMES, parseEvents, programIdFor } from "./parse";
import { camelToKebab, signAndPost } from "./post";

export interface ListenerOptions {
  connection: Connection;
  secret: string;
  baseUrl: string;
}

export interface ListenerHandle {
  shutdown: () => Promise<void>;
}

/**
 * Boots one `connection.onLogs` subscription per program (4 total). On each
 * fired callback, decodes Anchor `#[event]` emissions and forwards them to
 * Laravel as HMAC-signed POSTs. Errors inside the callback are caught and
 * logged — the listener never lets a single bad tx kill the loop.
 *
 * Returns a `shutdown()` handle that the SIGTERM/SIGINT path in `main.ts`
 * awaits before closing the HTTP server, so RPC subscriptions are released
 * cleanly on graceful exit.
 */
export function startWebhookListener(
  opts: ListenerOptions,
): ListenerHandle {
  const subs: number[] = [];

  for (const name of ALL_PROGRAM_NAMES) {
    const programPk = programIdFor(name);
    const subId = opts.connection.onLogs(
      programPk,
      (logs, ctx) => {
        // Failed txs sometimes emit partial logs; skip them — Laravel
        // shouldn't see events from a tx that reverted.
        if (logs.err) return;

        let events: ReturnType<typeof parseEvents>;
        try {
          events = parseEvents(name, logs.logs);
        } catch (e) {
          console.warn(
            `[webhook] ${name} parse failure on ${logs.signature}: ${
              e instanceof Error ? e.message : String(e)
            }`,
          );
          return;
        }

        for (const ev of events) {
          // Fire-and-forget — `signAndPost` swallows its own errors. We
          // intentionally don't `await` so a slow Laravel doesn't block
          // the next event from firing.
          void signAndPost({
            baseUrl: opts.baseUrl,
            secret: opts.secret,
            eventName: camelToKebab(ev.event),
            payload: {
              program: ev.program,
              event: ev.event,
              signature: logs.signature,
              slot: ctx.slot,
              data: ev.data,
            },
          });
        }
      },
      "confirmed",
    );
    subs.push(subId);
    console.log(
      `[webhook] subscribed to ${name} (${programPk.toBase58()}) sub=${subId}`,
    );
  }

  return {
    async shutdown(): Promise<void> {
      await Promise.all(
        subs.map((s) => opts.connection.removeOnLogsListener(s)),
      );
      console.log(`[webhook] removed ${subs.length} subscriptions`);
    },
  };
}
