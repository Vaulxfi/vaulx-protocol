import { z } from "zod";

/**
 * Server-side Supabase env. Validated on module load so importing this file
 * from a route handler / edge function / server component will fail fast
 * with a clear error if keys are missing.
 *
 * Do NOT import this module from client components — SUPABASE_SERVICE_ROLE_KEY
 * must never reach the browser.
 */
const schema = z.object({
  SUPABASE_URL: z
    .string({ required_error: "SUPABASE_URL is required" })
    .url("SUPABASE_URL must be a valid URL (https://<project-ref>.supabase.co)"),
  SUPABASE_ANON_KEY: z
    .string({ required_error: "SUPABASE_ANON_KEY is required" })
    .min(1, "SUPABASE_ANON_KEY must not be empty"),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string({ required_error: "SUPABASE_SERVICE_ROLE_KEY is required" })
    .min(1, "SUPABASE_SERVICE_ROLE_KEY must not be empty")
});

const parsed = schema.safeParse({
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
});

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
    .join("\n");
  throw new Error(
    `[@vaulx/supabase] Missing or invalid Supabase env vars:\n${issues}\n` +
      `Copy .env.example to .env.local at the repo root and fill in the values from your Supabase project settings.`
  );
}

export const env = parsed.data;
export type SupabaseEnv = typeof env;
