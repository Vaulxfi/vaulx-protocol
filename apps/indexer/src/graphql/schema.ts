import { createSchema } from "graphql-yoga";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseClient } from "./supabase-client.js";

// Anchor 0.30.1 EventParser lowercases the first letter of `#[event]` struct
// names (see apps/indexer/src/main.ts). On-chain emits map to the following
// rows in `public.onchain_events.event_name`:
//
//   ccbTrdcCreated     → Loan
//   custodyConfirmed   → Custody
//   disburseRequested  → Disbursement
//   installmentPaid    → Repayment   (partial)
//   ccbRepaid          → Repayment   (full payoff)
//   ccbRenewed         → Renewal
//   afDefaultExecuted  → Liquidation
//
// Field casing in `payload` may be either snake_case (Anchor IDL) or
// camelCase depending on indexer version (same gotcha as
// apps/web/src/app/api/onchain-events/custody-confirmed/route.ts). The
// `pick()` helper below tolerates both.
export const EVENT_NAMES = {
  loan: "ccbTrdcCreated",
  custody: "custodyConfirmed",
  disbursement: "disburseRequested",
  installment: "installmentPaid",
  repayment: "ccbRepaid",
  renewal: "ccbRenewed",
  liquidation: "afDefaultExecuted",
} as const;

type Row = {
  id: string;
  event_name: string;
  payload: Record<string, unknown>;
  slot: number;
  signature: string;
  created_at: string;
};

function pick<T = unknown>(
  payload: Record<string, unknown>,
  ...keys: string[]
): T | null {
  for (const k of keys) {
    if (payload[k] !== undefined && payload[k] !== null) return payload[k] as T;
  }
  return null;
}

function tsToIso(ts: unknown, fallback: string): string {
  // On-chain events store UNIX seconds (i64) in `ts` / `tsField`. If it's a
  // numeric string (BigInt-safe) parse it; otherwise fall back to created_at.
  if (typeof ts === "string" && /^\d+$/.test(ts)) {
    const ms = Number(ts) * 1000;
    if (Number.isFinite(ms)) return new Date(ms).toISOString();
  }
  if (typeof ts === "number" && Number.isFinite(ts)) {
    return new Date(ts * 1000).toISOString();
  }
  return fallback;
}

function rowToLoan(row: Row) {
  const p = row.payload ?? {};
  const trdc = pick<string>(p, "trdc_state", "trdcState") ?? row.id;
  const principal = pick<string | number>(p, "loan_amount", "loanAmount") ?? "0";
  const appraisal = pick<string | number>(p, "appraisal_value", "appraisalValue") ?? "0";
  const rate = Number(pick<string | number>(p, "rate_bps", "rateBps") ?? 0);
  // LTV in bps = principal / appraisal * 10000. Numbers may overflow Number;
  // do it in BigInt and cast to Int afterwards (10000 fits in Int trivially).
  let ltvBps = 0;
  try {
    const pp = BigInt(String(principal));
    const aa = BigInt(String(appraisal));
    if (aa > 0n) ltvBps = Number((pp * 10_000n) / aa);
  } catch {
    /* ignore */
  }
  const dueTs = pick<string | number>(p, "due_ts", "dueTs");
  const ts = pick<string | number>(p, "ts");
  return {
    id: trdc,
    borrower: pick<string>(p, "borrower") ?? "",
    collateralRef: pick<string>(p, "loan_id", "loanId") ?? "",
    principal: String(principal),
    ltvBps,
    rateBps: rate,
    status: "opened",
    openedAt: tsToIso(ts, row.created_at),
    dueAt: dueTs ? tsToIso(dueTs, row.created_at) : null,
    slot: row.slot,
    tx: row.signature,
  };
}

function rowToCustody(row: Row) {
  const p = row.payload ?? {};
  return {
    trdcState: pick<string>(p, "trdc_state", "trdcState") ?? "",
    confirmedAt: tsToIso(pick(p, "ts"), row.created_at),
    custodian: pick<string>(p, "custodian") ?? "",
    slot: row.slot,
    tx: row.signature,
  };
}

function rowToDisbursement(row: Row) {
  const p = row.payload ?? {};
  return {
    loanId: pick<string>(p, "trdc_state", "trdcState") ?? "",
    amount: String(pick<string | number>(p, "amount") ?? "0"),
    slot: row.slot,
    tx: row.signature,
    disbursedAt: tsToIso(pick(p, "ts"), row.created_at),
  };
}

function rowToRepayment(row: Row) {
  const p = row.payload ?? {};
  // installmentPaid uses `amount`; ccbRepaid uses `payoff_amount`.
  const amount =
    pick<string | number>(p, "amount") ??
    pick<string | number>(p, "payoff_amount", "payoffAmount") ??
    "0";
  return {
    loanId: pick<string>(p, "trdc_state", "trdcState") ?? "",
    amount: String(amount),
    slot: row.slot,
    tx: row.signature,
    repaidAt: tsToIso(pick(p, "ts"), row.created_at),
    kind: row.event_name === EVENT_NAMES.repayment ? "full" : "installment",
  };
}

function rowToRenewal(row: Row) {
  const p = row.payload ?? {};
  return {
    loanId: pick<string>(p, "trdc_state", "trdcState") ?? "",
    newDueAt: tsToIso(pick(p, "new_due_ts", "newDueTs"), row.created_at),
    slot: row.slot,
    tx: row.signature,
  };
}

function rowToLiquidation(row: Row) {
  const p = row.payload ?? {};
  return {
    loanId: pick<string>(p, "trdc_state", "trdcState") ?? "",
    slot: row.slot,
    tx: row.signature,
    auctionPubkey: pick<string>(p, "auction_pubkey", "auctionPubkey"),
  };
}

async function selectByEvent(
  client: SupabaseClient,
  eventName: string,
  filters: { trdcEq?: string; limit?: number; offset?: number } = {},
): Promise<Row[]> {
  const limit = Math.max(1, Math.min(filters.limit ?? 50, 200));
  const offset = Math.max(0, filters.offset ?? 0);
  let q = client
    .from("onchain_events")
    .select("id, event_name, payload, slot, signature, created_at")
    .eq("event_name", eventName)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (filters.trdcEq) {
    q = q.or(
      `payload->>trdc_state.eq.${filters.trdcEq},payload->>trdcState.eq.${filters.trdcEq}`,
    );
  }
  const { data, error } = await q;
  if (error) {
    // Don't leak Supabase internals to GraphQL clients.
    console.error("[graphql] supabase query failed:", error.message);
    return [];
  }
  return (data ?? []) as Row[];
}

export const typeDefs = /* GraphQL */ `
  type Loan {
    id: ID!
    borrower: String!
    collateralRef: String!
    principal: String!
    ltvBps: Int!
    rateBps: Int!
    status: String!
    openedAt: String!
    dueAt: String
    slot: Int!
    tx: String!
  }

  type Custody {
    trdcState: String!
    confirmedAt: String!
    custodian: String!
    slot: Int!
    tx: String!
  }

  type Disbursement {
    loanId: ID!
    amount: String!
    slot: Int!
    tx: String!
    disbursedAt: String!
  }

  type Repayment {
    loanId: ID!
    amount: String!
    slot: Int!
    tx: String!
    repaidAt: String!
    kind: String!
  }

  type Renewal {
    loanId: ID!
    newDueAt: String!
    slot: Int!
    tx: String!
  }

  type Liquidation {
    loanId: ID!
    slot: Int!
    tx: String!
    auctionPubkey: String
  }

  union LifecycleEvent =
      Loan
    | Custody
    | Disbursement
    | Repayment
    | Renewal
    | Liquidation

  type Query {
    loan(id: ID!): Loan
    loans(limit: Int = 50, offset: Int = 0, status: String): [Loan!]!
    custody(loanId: ID!): Custody
    disbursements(loanId: ID!): [Disbursement!]!
    repayments(loanId: ID!): [Repayment!]!
    renewals(loanId: ID!): [Renewal!]!
    liquidations(loanId: ID!): [Liquidation!]!
    lifecycleEvents(loanId: ID!): [LifecycleEvent!]!
  }
`;

type LoanLike = ReturnType<typeof rowToLoan>;
type CustodyLike = ReturnType<typeof rowToCustody>;
type DisbursementLike = ReturnType<typeof rowToDisbursement>;
type RepaymentLike = ReturnType<typeof rowToRepayment>;
type RenewalLike = ReturnType<typeof rowToRenewal>;
type LiquidationLike = ReturnType<typeof rowToLiquidation>;

export const resolvers = {
  LifecycleEvent: {
    __resolveType(obj: Record<string, unknown>) {
      if ("custodian" in obj) return "Custody";
      if ("disbursedAt" in obj) return "Disbursement";
      if ("repaidAt" in obj) return "Repayment";
      if ("newDueAt" in obj) return "Renewal";
      if ("auctionPubkey" in obj) return "Liquidation";
      if ("borrower" in obj) return "Loan";
      return null;
    },
  },
  Query: {
    loan: async (
      _p: unknown,
      args: { id: string },
    ): Promise<LoanLike | null> => {
      const sb = getSupabaseClient();
      if (!sb) return null;
      const rows = await selectByEvent(sb, EVENT_NAMES.loan, {
        trdcEq: args.id,
        limit: 1,
      });
      return rows.length > 0 ? rowToLoan(rows[0]) : null;
    },
    loans: async (
      _p: unknown,
      args: { limit?: number; offset?: number; status?: string },
    ): Promise<LoanLike[]> => {
      const sb = getSupabaseClient();
      if (!sb) return [];
      const rows = await selectByEvent(sb, EVENT_NAMES.loan, {
        limit: args.limit,
        offset: args.offset,
      });
      const loans = rows.map(rowToLoan);
      if (args.status) return loans.filter((l) => l.status === args.status);
      return loans;
    },
    custody: async (
      _p: unknown,
      args: { loanId: string },
    ): Promise<CustodyLike | null> => {
      const sb = getSupabaseClient();
      if (!sb) return null;
      const rows = await selectByEvent(sb, EVENT_NAMES.custody, {
        trdcEq: args.loanId,
        limit: 1,
      });
      return rows.length > 0 ? rowToCustody(rows[0]) : null;
    },
    disbursements: async (
      _p: unknown,
      args: { loanId: string },
    ): Promise<DisbursementLike[]> => {
      const sb = getSupabaseClient();
      if (!sb) return [];
      const rows = await selectByEvent(sb, EVENT_NAMES.disbursement, {
        trdcEq: args.loanId,
        limit: 200,
      });
      return rows.map(rowToDisbursement);
    },
    repayments: async (
      _p: unknown,
      args: { loanId: string },
    ): Promise<RepaymentLike[]> => {
      const sb = getSupabaseClient();
      if (!sb) return [];
      const [installments, payoffs] = await Promise.all([
        selectByEvent(sb, EVENT_NAMES.installment, {
          trdcEq: args.loanId,
          limit: 200,
        }),
        selectByEvent(sb, EVENT_NAMES.repayment, {
          trdcEq: args.loanId,
          limit: 200,
        }),
      ]);
      return [...installments, ...payoffs]
        .map(rowToRepayment)
        .sort((a, b) => (a.repaidAt < b.repaidAt ? 1 : -1));
    },
    renewals: async (
      _p: unknown,
      args: { loanId: string },
    ): Promise<RenewalLike[]> => {
      const sb = getSupabaseClient();
      if (!sb) return [];
      const rows = await selectByEvent(sb, EVENT_NAMES.renewal, {
        trdcEq: args.loanId,
        limit: 200,
      });
      return rows.map(rowToRenewal);
    },
    liquidations: async (
      _p: unknown,
      args: { loanId: string },
    ): Promise<LiquidationLike[]> => {
      const sb = getSupabaseClient();
      if (!sb) return [];
      const rows = await selectByEvent(sb, EVENT_NAMES.liquidation, {
        trdcEq: args.loanId,
        limit: 200,
      });
      return rows.map(rowToLiquidation);
    },
    lifecycleEvents: async (_p: unknown, args: { loanId: string }) => {
      const sb = getSupabaseClient();
      if (!sb) return [];
      const eventNames = [
        EVENT_NAMES.loan,
        EVENT_NAMES.custody,
        EVENT_NAMES.disbursement,
        EVENT_NAMES.installment,
        EVENT_NAMES.repayment,
        EVENT_NAMES.renewal,
        EVENT_NAMES.liquidation,
      ];
      const all = await Promise.all(
        eventNames.map((n) =>
          selectByEvent(sb, n, { trdcEq: args.loanId, limit: 200 }),
        ),
      );
      const flat = all.flat();
      const mapped = flat.map((row) => {
        switch (row.event_name) {
          case EVENT_NAMES.loan:
            return rowToLoan(row);
          case EVENT_NAMES.custody:
            return rowToCustody(row);
          case EVENT_NAMES.disbursement:
            return rowToDisbursement(row);
          case EVENT_NAMES.installment:
          case EVENT_NAMES.repayment:
            return rowToRepayment(row);
          case EVENT_NAMES.renewal:
            return rowToRenewal(row);
          case EVENT_NAMES.liquidation:
            return rowToLiquidation(row);
          default:
            return null;
        }
      });
      return mapped.filter((x): x is NonNullable<typeof x> => x !== null);
    },
  },
};

export const schema = createSchema({ typeDefs, resolvers });
