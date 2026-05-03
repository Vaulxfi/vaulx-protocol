import crypto from "node:crypto";

import type { NextFunction, Request, Response } from "express";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /**
       * Raw body bytes captured by `express.json({verify})` before JSON
       * parsing. The HMAC is computed over these literal bytes — re-
       * stringifying the parsed object would change whitespace and break
       * the signature.
       */
      rawBody?: string;
    }
  }
}

const TIMESTAMP_HEADER = "x-vaulx-timestamp";
const SIGNATURE_HEADER = "x-vaulx-signature";

export interface HmacMiddlewareOptions {
  secret: string;
  freshnessSeconds: number;
  /**
   * Paths exempted from HMAC verification. Compared against `req.path`
   * (no query). Health probes live here so monitoring services don't need
   * to negotiate auth. The HMAC payload still covers `req.originalUrl`
   * (with query) for protected paths.
   */
  unauthenticatedPaths: ReadonlySet<string>;
}

/**
 * Express middleware that verifies HMAC-SHA256 on every protected request.
 *
 * Canonical payload (UTF-8): `${timestamp}\n${METHOD}\n${originalUrl}\n${body}`
 *   - `timestamp`: Unix seconds the client minted.
 *   - `METHOD`: uppercased HTTP verb.
 *   - `originalUrl`: path + query string, exactly as the server received.
 *   - `body`: the raw request body (empty string for GET/DELETE).
 *
 * Signature is hex (lowercase). Compared against the client-supplied
 * `X-Vaulx-Signature` header in constant time. Timestamps outside the
 * freshness window are rejected with `stale_timestamp` to defend against
 * replay; the signature MUST cover the timestamp so a replay can't simply
 * patch the header.
 */
export function createHmacMiddleware(opts: HmacMiddlewareOptions) {
  return function hmacMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    if (opts.unauthenticatedPaths.has(req.path)) {
      next();
      return;
    }

    const timestampHeader = req.header(TIMESTAMP_HEADER);
    const signatureHeader = req.header(SIGNATURE_HEADER);
    if (!timestampHeader || !signatureHeader) {
      res.status(401).json({ ok: false, error: "missing_auth_headers" });
      return;
    }

    const timestamp = Number.parseInt(timestampHeader, 10);
    if (!Number.isFinite(timestamp)) {
      res.status(401).json({ ok: false, error: "invalid_timestamp" });
      return;
    }

    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > opts.freshnessSeconds) {
      res.status(401).json({ ok: false, error: "stale_timestamp" });
      return;
    }

    const payload =
      `${timestamp}\n${req.method.toUpperCase()}\n${req.originalUrl}\n${req.rawBody ?? ""}`;
    const expected = crypto
      .createHmac("sha256", opts.secret)
      .update(payload)
      .digest("hex");

    const provided = signatureHeader.toLowerCase();
    // Length check first — `timingSafeEqual` throws on mismatched buffers.
    // `Buffer.from(x, 'hex')` silently truncates non-hex chars, so a
    // malformed signature lands here as a length mismatch and gets rejected.
    if (provided.length !== expected.length) {
      res.status(401).json({ ok: false, error: "bad_signature" });
      return;
    }

    const providedBuf = Buffer.from(provided, "hex");
    const expectedBuf = Buffer.from(expected, "hex");
    if (
      providedBuf.length !== expectedBuf.length ||
      !crypto.timingSafeEqual(providedBuf, expectedBuf)
    ) {
      res.status(401).json({ ok: false, error: "bad_signature" });
      return;
    }

    next();
  };
}
