import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { graphql, validateSchema } from "graphql";
import type { SupabaseClient } from "@supabase/supabase-js";

import { schema, EVENT_NAMES } from "../schema.js";
import { setSupabaseClientForTests } from "../supabase-client.js";

// Minimal in-memory mock that mimics the Supabase fluent query builder used
// by `selectByEvent()` in schema.ts: from().select().eq().order().range()
// and an optional .or(). Only the `.eq("event_name", X)` filter and pagination
// are honoured — enough for the GraphQL resolver-level tests.

type Row = {
  id: string;
  event_name: string;
  payload: Record<string, unknown>;
  slot: number;
  signature: string;
  created_at: string;
};

function buildMock(rows: Row[]): SupabaseClient {
  const builder = (eventName?: string) => {
    let _event = eventName;
    let _from = 0;
    let _to = Number.MAX_SAFE_INTEGER;
    let _orFilter: { trdc: string } | null = null;

    const exec = () => {
      let out = rows.slice();
      if (_event) out = out.filter((r) => r.event_name === _event);
      if (_orFilter) {
        out = out.filter((r) => {
          const p = r.payload ?? {};
          return (
            p.trdc_state === _orFilter!.trdc || p.trdcState === _orFilter!.trdc
          );
        });
      }
      // Order by created_at desc (matches schema.ts default).
      out.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
      const sliced = out.slice(_from, _to + 1);
      return Promise.resolve({ data: sliced, error: null });
    };

    const api: Record<string, unknown> = {
      select: () => api,
      eq: (col: string, val: string) => {
        if (col === "event_name") _event = val;
        return api;
      },
      or: (expr: string) => {
        // The query passes "payload->>trdc_state.eq.<v>,payload->>trdcState.eq.<v>".
        const m = expr.match(/payload->>trdc_state\.eq\.([^,]+)/);
        if (m) _orFilter = { trdc: m[1] };
        return api;
      },
      order: () => api,
      range: (from: number, to: number) => {
        _from = from;
        _to = to;
        return api;
      },
      then: (onFulfilled: (v: unknown) => unknown) => exec().then(onFulfilled),
    };
    return api;
  };

  return {
    from: () => builder(),
  } as unknown as SupabaseClient;
}

const TRDC_A = "TrdcStateAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
const TRDC_B = "TrdcStateBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB";
const BORROWER = "BorrowerXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";
const LOAN_PDA = "LoanPdaXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";

function makeLoanRow(trdc: string, createdAt: string, idx: number): Row {
  return {
    id: `evt-${idx}`,
    event_name: EVENT_NAMES.loan,
    payload: {
      trdc_state: trdc,
      borrower: BORROWER,
      loan_id: LOAN_PDA,
      appraisal_value: "25000000000",
      loan_amount: "15000000000", // 60% LTV → 6000 bps
      due_ts: "1900000000",
      rate_bps: "1500",
      ts: "1790000000",
    },
    slot: 100 + idx,
    signature: `sig-${idx}`,
    created_at: createdAt,
  };
}

beforeEach(() => {
  setSupabaseClientForTests(null);
});

afterEach(() => {
  setSupabaseClientForTests(null);
});

describe("graphql/schema", () => {
  it("schema parses and validates without error", () => {
    const errors = validateSchema(schema);
    expect(errors).toEqual([]);
  });

  it("loan(id) returns null for unknown id", async () => {
    setSupabaseClientForTests(buildMock([]));

    const res = await graphql({
      schema,
      source: `query Q($id: ID!) { loan(id: $id) { id borrower } }`,
      variableValues: { id: "UnknownTrdc11111111111111111111111111111111" },
    });

    expect(res.errors).toBeUndefined();
    expect(res.data).toEqual({ loan: null });
  });

  it("loans(limit, offset) paginates", async () => {
    const rows: Row[] = [];
    // 5 distinct loans, monotonically increasing created_at so order is
    // deterministic on desc sort.
    for (let i = 0; i < 5; i++) {
      rows.push(
        makeLoanRow(
          `${TRDC_A}-${i}`,
          `2026-04-${String(20 + i).padStart(2, "0")}T00:00:00Z`,
          i,
        ),
      );
    }
    setSupabaseClientForTests(buildMock(rows));

    const page1 = await graphql({
      schema,
      source: `{ loans(limit: 2, offset: 0) { id slot } }`,
    });
    const page2 = await graphql({
      schema,
      source: `{ loans(limit: 2, offset: 2) { id slot } }`,
    });

    expect(page1.errors).toBeUndefined();
    expect(page2.errors).toBeUndefined();
    const p1 = (page1.data as { loans: Array<{ id: string; slot: number }> })
      .loans;
    const p2 = (page2.data as { loans: Array<{ id: string; slot: number }> })
      .loans;
    expect(p1).toHaveLength(2);
    expect(p2).toHaveLength(2);
    // Newest first; offset advances the window — no overlap.
    const ids1 = new Set(p1.map((l) => l.id));
    const ids2 = new Set(p2.map((l) => l.id));
    for (const id of ids2) expect(ids1.has(id)).toBe(false);
  });

  it("loan returns full row for known id with derived ltvBps", async () => {
    const row = makeLoanRow(TRDC_B, "2026-04-25T12:00:00Z", 42);
    setSupabaseClientForTests(buildMock([row]));

    const res = await graphql({
      schema,
      source: `
        query Q($id: ID!) {
          loan(id: $id) {
            id
            borrower
            collateralRef
            principal
            ltvBps
            rateBps
            slot
            tx
            openedAt
            dueAt
          }
        }
      `,
      variableValues: { id: TRDC_B },
    });

    expect(res.errors).toBeUndefined();
    const loan = (res.data as { loan: Record<string, unknown> }).loan;
    expect(loan.id).toBe(TRDC_B);
    expect(loan.borrower).toBe(BORROWER);
    expect(loan.collateralRef).toBe(LOAN_PDA);
    expect(loan.principal).toBe("15000000000");
    expect(loan.ltvBps).toBe(6000);
    expect(loan.rateBps).toBe(1500);
    expect(loan.slot).toBe(142);
    expect(loan.tx).toBe("sig-42");
    // openedAt comes from payload.ts (1790000000s → 2026-09-22T01:33:20Z range).
    expect(loan.openedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(loan.dueAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
