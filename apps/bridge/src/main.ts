import express, { type Request, type Response } from "express";
import { PublicKey } from "@solana/web3.js";

import { createBridgeProvider } from "./chain/provider";
import { loadConfig } from "./config";
import { createHmacMiddleware } from "./http/hmac";
import { createChainAccountRouter } from "./http/routes/chain-account";
import { createChainLoanWritesRouter } from "./http/routes/chain-loan-writes";
import { createChainTypedRouter } from "./http/routes/chain-typed";
import {
  startWebhookListener,
  type ListenerHandle,
} from "./webhook/listener";

const config = loadConfig();
const provider = createBridgeProvider(config);
const app = express();

// Capture the raw body bytes alongside JSON parsing — the HMAC middleware
// signs over the literal bytes, not the re-stringified parse, so we have to
// stash them before Express discards them.
app.use(
  express.json({
    limit: "64kb",
    verify: (req, _res, buf) => {
      (req as Request).rawBody = buf.toString("utf8");
    },
  }),
);

// HMAC-SHA256 over (timestamp + method + originalUrl + rawBody). Health is
// whitelisted so monitoring probes can hit it without negotiating auth;
// every other route — including read-only ones like `/chain/account/:pda`
// — requires a valid signature.
app.use(
  createHmacMiddleware({
    secret: config.bridgeSharedSecret,
    freshnessSeconds: config.hmacFreshnessSeconds,
    unauthenticatedPaths: new Set(["/chain/health"]),
  }),
);

/**
 * GET /chain/health — liveness probe. Intentionally unauthenticated so a
 * monitoring service (or `curl` from a deploy verifier) can hit it without
 * negotiating HMAC. Reports the operator pubkey so ops can verify which
 * keypair the bridge is signing with at a glance.
 */
app.get("/chain/health", (_req: Request, res: Response) => {
  res.json({
    ok: true,
    service: "vaulx-bridge",
    version: "0.0.1",
    cluster: config.solanaCluster,
    operator: provider.operator.publicKey.toBase58(),
    timestamp: Math.floor(Date.now() / 1000),
  });
});

app.use(createChainTypedRouter(provider.connection));
app.use(createChainAccountRouter(provider.connection));
app.use(
  createChainLoanWritesRouter(provider, new PublicKey(config.demoAssetMint)),
);

let listenerHandle: ListenerHandle | null = null;
if (config.laravelWebhookBaseUrl) {
  listenerHandle = startWebhookListener({
    connection: provider.connection,
    secret: config.bridgeSharedSecret,
    baseUrl: config.laravelWebhookBaseUrl,
  });
} else {
  console.log(
    "[webhook] disabled — set LARAVEL_WEBHOOK_BASE_URL to enable on-chain → Laravel forwarding",
  );
}

const server = app.listen(config.port, () => {
  console.log(
    `[bridge] listening on http://127.0.0.1:${config.port} ` +
      `(cluster=${config.solanaCluster}, operator=${provider.operator.publicKey.toBase58()})`,
  );
});

// Graceful shutdown: release RPC subscriptions before the HTTP server
// closes, so the validator doesn't keep ghost subs around until timeout.
for (const sig of ["SIGTERM", "SIGINT"] as const) {
  process.on(sig, () => {
    void (async () => {
      console.log(`[bridge] ${sig} — shutting down`);
      if (listenerHandle) {
        await listenerHandle.shutdown();
      }
      server.close(() => {
        process.exit(0);
      });
    })();
  });
}
