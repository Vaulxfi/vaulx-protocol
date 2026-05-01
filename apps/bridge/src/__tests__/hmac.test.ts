import crypto from "node:crypto";

import express, { type Request } from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";

import { createHmacMiddleware } from "../http/hmac";

const SECRET = "test-secret-do-not-use";
const FRESHNESS = 300;

function sign(
  ts: number,
  method: string,
  pathWithQuery: string,
  body = "",
): string {
  return crypto
    .createHmac("sha256", SECRET)
    .update(`${ts}\n${method.toUpperCase()}\n${pathWithQuery}\n${body}`)
    .digest("hex");
}

function makeApp(unauth: ReadonlySet<string> = new Set()): express.Express {
  const app = express();
  app.use(
    express.json({
      verify: (req, _res, buf) => {
        (req as Request).rawBody = buf.toString("utf8");
      },
    }),
  );
  app.use(
    createHmacMiddleware({
      secret: SECRET,
      freshnessSeconds: FRESHNESS,
      unauthenticatedPaths: unauth,
    }),
  );
  app.get("/protected", (_req, res) => {
    res.json({ ok: true });
  });
  app.post("/echo", (req, res) => {
    res.json({ ok: true, body: req.body });
  });
  app.get("/health", (_req, res) => {
    res.json({ ok: true, health: true });
  });
  return app;
}

describe("createHmacMiddleware", () => {
  it("rejects when both auth headers are missing", async () => {
    const r = await request(makeApp()).get("/protected");
    expect(r.status).toBe(401);
    expect(r.body).toEqual({ ok: false, error: "missing_auth_headers" });
  });

  it("rejects when only the timestamp header is provided", async () => {
    const r = await request(makeApp())
      .get("/protected")
      .set("X-Vaulx-Timestamp", "1234567890");
    expect(r.status).toBe(401);
    expect(r.body.error).toBe("missing_auth_headers");
  });

  it("rejects when only the signature header is provided", async () => {
    const r = await request(makeApp())
      .get("/protected")
      .set("X-Vaulx-Signature", "0".repeat(64));
    expect(r.status).toBe(401);
    expect(r.body.error).toBe("missing_auth_headers");
  });

  it("rejects an unparseable timestamp", async () => {
    const r = await request(makeApp())
      .get("/protected")
      .set("X-Vaulx-Timestamp", "not-a-number")
      .set("X-Vaulx-Signature", "0".repeat(64));
    expect(r.status).toBe(401);
    expect(r.body.error).toBe("invalid_timestamp");
  });

  it("rejects a stale timestamp outside the freshness window", async () => {
    const ts = Math.floor(Date.now() / 1000) - FRESHNESS - 60;
    const sig = sign(ts, "GET", "/protected");
    const r = await request(makeApp())
      .get("/protected")
      .set("X-Vaulx-Timestamp", String(ts))
      .set("X-Vaulx-Signature", sig);
    expect(r.status).toBe(401);
    expect(r.body.error).toBe("stale_timestamp");
  });

  it("rejects a future-dated timestamp outside the freshness window", async () => {
    const ts = Math.floor(Date.now() / 1000) + FRESHNESS + 60;
    const sig = sign(ts, "GET", "/protected");
    const r = await request(makeApp())
      .get("/protected")
      .set("X-Vaulx-Timestamp", String(ts))
      .set("X-Vaulx-Signature", sig);
    expect(r.status).toBe(401);
    expect(r.body.error).toBe("stale_timestamp");
  });

  it("rejects an invalid signature with a fresh timestamp", async () => {
    const ts = Math.floor(Date.now() / 1000);
    const r = await request(makeApp())
      .get("/protected")
      .set("X-Vaulx-Timestamp", String(ts))
      .set("X-Vaulx-Signature", "0".repeat(64));
    expect(r.status).toBe(401);
    expect(r.body.error).toBe("bad_signature");
  });

  it("rejects a malformed (non-hex) signature", async () => {
    const ts = Math.floor(Date.now() / 1000);
    const r = await request(makeApp())
      .get("/protected")
      .set("X-Vaulx-Timestamp", String(ts))
      .set("X-Vaulx-Signature", `zzzz${"0".repeat(60)}`);
    expect(r.status).toBe(401);
    expect(r.body.error).toBe("bad_signature");
  });

  it("rejects a signature of wrong length", async () => {
    const ts = Math.floor(Date.now() / 1000);
    const r = await request(makeApp())
      .get("/protected")
      .set("X-Vaulx-Timestamp", String(ts))
      .set("X-Vaulx-Signature", "abcd");
    expect(r.status).toBe(401);
    expect(r.body.error).toBe("bad_signature");
  });

  it("accepts a valid HMAC for GET with no body", async () => {
    const ts = Math.floor(Date.now() / 1000);
    const sig = sign(ts, "GET", "/protected");
    const r = await request(makeApp())
      .get("/protected")
      .set("X-Vaulx-Timestamp", String(ts))
      .set("X-Vaulx-Signature", sig);
    expect(r.status).toBe(200);
    expect(r.body).toEqual({ ok: true });
  });

  it("accepts a valid HMAC for POST with JSON body", async () => {
    const ts = Math.floor(Date.now() / 1000);
    const body = JSON.stringify({ hello: "world", n: 42 });
    const sig = sign(ts, "POST", "/echo", body);
    const r = await request(makeApp())
      .post("/echo")
      .set("Content-Type", "application/json")
      .set("X-Vaulx-Timestamp", String(ts))
      .set("X-Vaulx-Signature", sig)
      .send(body);
    expect(r.status).toBe(200);
    expect(r.body.body).toEqual({ hello: "world", n: 42 });
  });

  it("rejects when body is altered after signing", async () => {
    const ts = Math.floor(Date.now() / 1000);
    const signedBody = JSON.stringify({ hello: "world" });
    const sig = sign(ts, "POST", "/echo", signedBody);
    const tamperedBody = JSON.stringify({ hello: "evil" });
    const r = await request(makeApp())
      .post("/echo")
      .set("Content-Type", "application/json")
      .set("X-Vaulx-Timestamp", String(ts))
      .set("X-Vaulx-Signature", sig)
      .send(tamperedBody);
    expect(r.status).toBe(401);
    expect(r.body.error).toBe("bad_signature");
  });

  it("includes query string in the signed payload", async () => {
    const ts = Math.floor(Date.now() / 1000);
    // Sign for /protected (no query) but call /protected?foo=bar — the
    // server-side payload uses originalUrl which includes the query.
    const sig = sign(ts, "GET", "/protected");
    const r = await request(makeApp())
      .get("/protected?foo=bar")
      .set("X-Vaulx-Timestamp", String(ts))
      .set("X-Vaulx-Signature", sig);
    expect(r.status).toBe(401);
    expect(r.body.error).toBe("bad_signature");
  });

  it("bypasses HMAC for whitelisted paths", async () => {
    const r = await request(makeApp(new Set(["/health"]))).get("/health");
    expect(r.status).toBe(200);
    expect(r.body.health).toBe(true);
  });

  it("still enforces HMAC on non-whitelisted paths when whitelist exists", async () => {
    const r = await request(makeApp(new Set(["/health"]))).get("/protected");
    expect(r.status).toBe(401);
  });
});
