/**
 * POST /api/admin/demo/reset
 *
 * No-op by design. Solana state is append-only — there is nothing to "reset"
 * on-chain short of nuking and re-seeding demo wallets, which is too heavy
 * a hammer for a stage demo. Pressing this button just re-renders the UI
 * with an empty status log; the next moment button will mint a new loan_id
 * keypair anyway.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { checkAdminAuth } from "@/lib/admin/demo";

export async function POST(req: Request) {
  const gate = checkAdminAuth(req);
  if (gate) return gate;
  return Response.json({
    ok: true,
    detail:
      "State is append-only on-chain. Refresh the page to clear the local status log, then run the buttons again — each fresh run mints a new loan_id.",
  });
}
