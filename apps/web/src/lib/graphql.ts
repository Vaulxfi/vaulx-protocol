// Thin client for the indexer's GraphQL endpoint (Item 6). Used by future
// loan-history pages; not consumed by any route at the time this file was
// added. Keep it dependency-free (no Apollo / urql) so it works in both
// server components and the browser.
//
// Endpoint shape: see apps/indexer/src/graphql/schema.ts.

const DEFAULT_ENDPOINT =
  process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "http://localhost:4000/graphql";

export class GraphQLError extends Error {
  constructor(
    message: string,
    public readonly errors?: unknown[],
  ) {
    super(message);
    this.name = "GraphQLError";
  }
}

export async function gqlRequest<T>(
  query: string,
  variables?: Record<string, unknown>,
  opts: { endpoint?: string; signal?: AbortSignal } = {},
): Promise<T> {
  const endpoint = opts.endpoint ?? DEFAULT_ENDPOINT;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
    signal: opts.signal,
  });
  if (!res.ok) {
    throw new GraphQLError(`GraphQL HTTP ${res.status}`);
  }
  const json = (await res.json()) as { data?: T; errors?: unknown[] };
  if (json.errors && json.errors.length > 0) {
    throw new GraphQLError("GraphQL errors", json.errors);
  }
  if (!json.data) {
    throw new GraphQLError("GraphQL response missing data");
  }
  return json.data;
}

// Typed helpers for the shapes the indexer currently exposes. Keep these in
// sync with apps/indexer/src/graphql/schema.ts.

export type Loan = {
  id: string;
  borrower: string;
  collateralRef: string;
  principal: string;
  ltvBps: number;
  rateBps: number;
  status: string;
  openedAt: string;
  dueAt: string | null;
  slot: number;
  tx: string;
};

export type Disbursement = {
  loanId: string;
  amount: string;
  slot: number;
  tx: string;
  disbursedAt: string;
};

export type Repayment = {
  loanId: string;
  amount: string;
  slot: number;
  tx: string;
  repaidAt: string;
  kind: "installment" | "full";
};

export async function fetchLoan(id: string, endpoint?: string) {
  const data = await gqlRequest<{ loan: Loan | null }>(
    `query Loan($id: ID!) {
       loan(id: $id) {
         id borrower collateralRef principal ltvBps rateBps status
         openedAt dueAt slot tx
       }
     }`,
    { id },
    { endpoint },
  );
  return data.loan;
}

export async function fetchLoans(
  args: { limit?: number; offset?: number; status?: string } = {},
  endpoint?: string,
) {
  const data = await gqlRequest<{ loans: Loan[] }>(
    `query Loans($limit: Int, $offset: Int, $status: String) {
       loans(limit: $limit, offset: $offset, status: $status) {
         id borrower principal ltvBps status openedAt dueAt
       }
     }`,
    args,
    { endpoint },
  );
  return data.loans;
}
