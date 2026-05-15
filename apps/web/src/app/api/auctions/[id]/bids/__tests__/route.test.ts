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

describe("GET /api/auctions/[id]/bids", () => {
  it("selects occurred_at (not created_at) and exposes it in the response", async () => {
    resolveData = {
      data: [
        {
          payload: {
            auction: "auc-1",
            bidder: "bidder-1",
            amount: "100",
            ts: 123,
          },
          slot: 42,
          signature: "sig-abc",
          occurred_at: "2026-05-13T12:00:00Z",
          // The legacy `created_at` value differs and must NOT leak.
          created_at: "2099-01-01T00:00:00Z",
        },
      ],
      error: null,
    };

    const { GET } = await import("../route");
    const res = await GET(new Request("http://localhost/x"), {
      params: { id: "auc-1" },
    });
    expect(res.status).toBe(200);

    const select = calls.find((c) => c.method === "select");
    expect(select!.args[0]).toMatch(/occurred_at/);
    expect(select!.args[0]).not.toMatch(/created_at/);

    const body = (await res.json()) as { bids: Array<{ created_at: string }> };
    // Public response field name is unchanged (back-compat), but value comes
    // from occurred_at.
    expect(body.bids[0].created_at).toBe("2026-05-13T12:00:00Z");
  });
});
