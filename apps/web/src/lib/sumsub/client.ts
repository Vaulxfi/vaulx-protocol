/**
 * Sumsub REST API client. Handles HMAC-SHA256 signing per Sumsub's
 * authentication scheme: every request needs X-App-Token, X-App-Access-Sig,
 * and X-App-Access-Ts headers. The signature covers (ts + method + path + body).
 *
 * Docs: https://docs.sumsub.com/reference/authentication
 *
 * Env vars (LOWERCASE — matches the user's existing .env file; Phase 4 will
 * also wire UPPERCASE variants in Vercel):
 *   - sumsub_token      → X-App-Token
 *   - sumsub_secret     → HMAC key for signRequest()
 */
import crypto from "node:crypto";

const SUMSUB_BASE_URL = "https://api.sumsub.com";

export type SignInput = {
  method: string; // e.g. "GET", "POST"
  path: string; // e.g. "/resources/applicants/-;externalUserId=u1/one"
  body: string; // request body as string ("" for GET)
  timestamp: number; // unix seconds
  secret: string; // sumsub secret key
};

export function signRequest({
  method,
  path,
  body,
  timestamp,
  secret,
}: SignInput): string {
  const payload = `${timestamp}${method.toUpperCase()}${path}${body}`;
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export type SumsubFetchOpts = {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  body?: unknown;
};

export async function sumsubFetch<T = unknown>(
  opts: SumsubFetchOpts,
): Promise<T> {
  const token = process.env.sumsub_token;
  const secret = process.env.sumsub_secret;
  if (!token || !secret) {
    throw new Error("sumsub_token and sumsub_secret must be set");
  }
  const ts = Math.floor(Date.now() / 1000);
  const bodyStr = opts.body === undefined ? "" : JSON.stringify(opts.body);
  const sig = signRequest({
    method: opts.method,
    path: opts.path,
    body: bodyStr,
    timestamp: ts,
    secret,
  });
  const res = await fetch(`${SUMSUB_BASE_URL}${opts.path}`, {
    method: opts.method,
    headers: {
      "Content-Type": "application/json",
      "X-App-Token": token,
      "X-App-Access-Sig": sig,
      "X-App-Access-Ts": String(ts),
    },
    body: opts.body === undefined ? undefined : bodyStr,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Sumsub API ${opts.method} ${opts.path} → ${res.status}: ${text}`,
    );
  }
  return (await res.json()) as T;
}
