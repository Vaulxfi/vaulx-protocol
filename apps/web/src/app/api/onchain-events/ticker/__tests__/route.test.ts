import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

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
  builder.in = record("in");
  builder.order = record("order");
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

describe("GET /api/onchain-events/ticker", () => {
  it("queries and orders by occurred_at; relative time is derived from occurred_at", async () => {
    const nowIso = new Date(Date.now() - 60_000).toISOString();
    resolveData = {
      data: [
        {
          event_name: "deposited",
          payload: { amount: "1000", vault: "vault-abc" },
          occurred_at: nowIso,
          created_at: "2099-01-01T00:00:00Z",
        },
      ],
      error: null,
    };

    const { GET } = await import("../route");
    const res = await GET();
    expect(res.status).toBe(200);

    const select = calls.find((c) => c.method === "select");
    expect(select!.args[0]).toMatch(/occurred_at/);
    expect(select!.args[0]).not.toMatch(/created_at/);

    const order = calls.find((c) => c.method === "order");
    expect(order!.args[0]).toBe("occurred_at");

    const body = (await res.json()) as {
      events: Array<{ t: string }>;
      source: string;
    };
    expect(body.source).toBe("live");
    // ~60s ago when derived from occurred_at; if it had used the stale
    // created_at (year 2099), the relative-time would be "-00:00:00".
    expect(body.events[0].t).toMatch(/^-00:0[01]:/);
  });
});
