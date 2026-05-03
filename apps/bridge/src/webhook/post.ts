import crypto from "node:crypto";

/**
 * Outbound HMAC + POST. Symmetric to the inbound `createHmacMiddleware` —
 * same secret, same canonical payload format (`${ts}\n${METHOD}\n${path}\n${body}`),
 * same hex-lowercase signature. Laravel runs the mirror verifier on the
 * receive side.
 *
 * Fire-and-forget per the user's MVP decision: network errors and non-2xx
 * responses are logged but never thrown — a downed Laravel must not stall
 * the listener loop or spawn unbounded retry pressure on the chain RPC.
 */

export interface SignAndPostOptions {
  baseUrl: string;
  secret: string;
  /** Already kebab-case (e.g. `custody-confirmed`). */
  eventName: string;
  payload: unknown;
}

export async function signAndPost(opts: SignAndPostOptions): Promise<void> {
  const ts = Math.floor(Date.now() / 1000);
  const body = JSON.stringify(opts.payload);

  // Compose URL preserving any subpath in baseUrl. Trailing slash on
  // baseUrl is normalised so we never emit `//api/...`.
  const trimmedBase = opts.baseUrl.replace(/\/$/, "");
  const fullUrl = `${trimmedBase}/api/onchain-events/${opts.eventName}`;
  // pathForHmac includes baseUrl's path component if any — Laravel sees
  // the same string in `req.originalUrl` (path + query, no host).
  const pathForHmac = new URL(fullUrl).pathname;

  const sig = crypto
    .createHmac("sha256", opts.secret)
    .update(`${ts}\nPOST\n${pathForHmac}\n${body}`)
    .digest("hex");

  try {
    const res = await fetch(fullUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Vaulx-Timestamp": String(ts),
        "X-Vaulx-Signature": sig,
      },
      body,
    });
    if (!res.ok) {
      console.warn(
        `[webhook] ${opts.eventName} → ${res.status} ${res.statusText}`,
      );
    }
  } catch (e) {
    console.warn(
      `[webhook] ${opts.eventName} → network error: ${
        e instanceof Error ? e.message : String(e)
      }`,
    );
  }
}

/**
 * Anchor 0.30 emits event names in lowerCamelCase at runtime
 * (`custodyConfirmed`, `disbursed`, `ccbTrdcCreated`). Convert to kebab-
 * case for use as a URL path segment.
 */
export function camelToKebab(s: string): string {
  return s.replace(/[A-Z]/g, (c, i) =>
    i === 0 ? c.toLowerCase() : `-${c.toLowerCase()}`,
  );
}
