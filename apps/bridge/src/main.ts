import express, { type Request, type Response } from "express";

import { loadConfig } from "./config";

const config = loadConfig();
const app = express();

app.use(express.json({ limit: "64kb" }));

/**
 * GET /chain/health — liveness probe. Intentionally unauthenticated so a
 * monitoring service (or `curl` from a deploy verifier) can hit it without
 * negotiating HMAC. Returns the cluster the bridge is configured against,
 * not a Solana RPC ping — that comes when the chain layer wires up.
 */
app.get("/chain/health", (_req: Request, res: Response) => {
  res.json({
    ok: true,
    service: "vaulx-bridge",
    version: "0.0.1",
    cluster: config.solanaCluster,
    timestamp: Math.floor(Date.now() / 1000),
  });
});

app.listen(config.port, () => {
  console.log(
    `[bridge] listening on http://127.0.0.1:${config.port} ` +
      `(cluster=${config.solanaCluster})`,
  );
});
