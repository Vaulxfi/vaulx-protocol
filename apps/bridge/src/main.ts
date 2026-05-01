import express, { type Request, type Response } from "express";

import { createBridgeProvider } from "./chain/provider";
import { loadConfig } from "./config";
import { createChainAccountRouter } from "./http/routes/chain-account";

const config = loadConfig();
const provider = createBridgeProvider(config);
const app = express();

app.use(express.json({ limit: "64kb" }));

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

app.use(createChainAccountRouter(provider.connection));

app.listen(config.port, () => {
  console.log(
    `[bridge] listening on http://127.0.0.1:${config.port} ` +
      `(cluster=${config.solanaCluster}, operator=${provider.operator.publicKey.toBase58()})`,
  );
});
