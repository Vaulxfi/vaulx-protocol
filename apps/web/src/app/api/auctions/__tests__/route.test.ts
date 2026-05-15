import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Capture the builder so each test can assert which column/order was queried.
type Call = { method: string; args: unknown[] };

let calls: Call[] = [];
let resolveData: { data: unknown; error: unknown } = { data: [], error: null };

function makeBuilder() {
  const builder: Record<string, unknown> = {};
  const record = (method: string) =>
    (...args: unknown[]) => {
      calls.push({ method, args });
      return builder;
    };
  builder.select = record("select");
  builder.eq = record("eq");
  builder.in = record("in");
  builder.or = record("or");
  builder.order = record("order");
  // `limit` is the awaited terminator — return a thenable.
  builder.limit = (...args: unknown[]) => {
    calls.push({ method: "limit", args });
    return Promise.resolve(resolveData) as unknown as typeof builder;
  };
  return builder;
}

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: (table: string) => {
      calls.push({ method: "from", args: [table] });
      return makeBuilder();
    },
  }),
}));

beforeEach(() => {
  calls = [];
  resolveData = { data: [], error: null };
  process.env.SUPABASE_URL = "http://localhost";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service";
});

afterEach(() => {
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
});

describe("GET /api/auctions", () => {
  it("queries onchain_events by occurred_at, not created_at", async () => {
    // No payloads with auction PDA → handler short-circuits to `empty`
    // without touching the Solana RPC.
    resolveData = {
      data: [
        {
          payload: { other: "x" },
          occurred_at: "2026-05-13T12:00:00Z",
          created_at: "2026-05-13T12:01:00Z",
          slot: 1,
        },
      ],
      error: null,
    };

    const { GET } = await import("../route");
    const res = await GET();
    expect(res.status).toBe(200);

    const select = calls.find((c) => c.method === "select");
    expect(select).toBeTruthy();
    expect(select!.args[0]).toMatch(/occurred_at/);
    expect(select!.args[0]).not.toMatch(/created_at/);

    const order = calls.find((c) => c.method === "order");
    expect(order).toBeTruthy();
    expect(order!.args[0]).toBe("occurred_at");
  });
});
