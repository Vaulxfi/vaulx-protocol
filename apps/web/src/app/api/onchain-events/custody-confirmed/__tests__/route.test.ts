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
  builder.eq = record("eq");
  builder.or = record("or");
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

describe("GET /api/onchain-events/custody-confirmed", () => {
  it("queries onchain_events by occurred_at; confirmedAt is derived from occurred_at", async () => {
    const occurred = "2026-05-13T12:00:00Z";
    resolveData = {
      data: [
        {
          payload: { trdc_state: "TRDC-1", doc_hash: "0xabcd" },
          occurred_at: occurred,
          // Stale legacy value that must NOT be used.
          created_at: "2099-01-01T00:00:00Z",
        },
      ],
      error: null,
    };

    const { GET } = await import("../route");
    const res = await GET(
      new Request("http://localhost/x?trdc=TRDC-1"),
    );
    expect(res.status).toBe(200);

    const select = calls.find((c) => c.method === "select");
    expect(select!.args[0]).toMatch(/occurred_at/);
    expect(select!.args[0]).not.toMatch(/created_at/);

    const order = calls.find((c) => c.method === "order");
    expect(order!.args[0]).toBe("occurred_at");

    const body = (await res.json()) as { confirmed: boolean; confirmedAt: number };
    expect(body.confirmed).toBe(true);
    expect(body.confirmedAt).toBe(new Date(occurred).getTime());
  });
});
