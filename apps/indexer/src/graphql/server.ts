import { createYoga } from "graphql-yoga";
import { createServer, type Server } from "node:http";

import { schema } from "./schema.js";

export function startGraphqlServer(): Server | null {
  // Gated env-style: set GRAPHQL_PORT=0 to disable; absent OR positive starts.
  const raw = process.env.GRAPHQL_PORT;
  if (raw === "0") {
    console.log("[graphql] disabled (GRAPHQL_PORT=0)");
    return null;
  }
  const port = Number(raw ?? 4000);
  if (!Number.isFinite(port) || port < 0) {
    console.error(`[graphql] invalid GRAPHQL_PORT=${raw}; not starting`);
    return null;
  }

  const yoga = createYoga({
    schema,
    graphqlEndpoint: "/graphql",
    // Mask resolver errors so internal details (Supabase queries, stack
    // traces) don't leak to GraphQL clients in production.
    maskedErrors: { errorMessage: "Internal server error" },
    landingPage: false,
  });
  const server = createServer(yoga);
  server.listen(port, () => {
    console.log(`[graphql] listening at http://localhost:${port}/graphql`);
  });
  return server;
}
