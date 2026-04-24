"use client";

import type { ReactNode } from "react";
// SDK: `@civic/solana-gateway-react@1.2.x` re-exports `useGateway`,
// `IdentityButton`, and `GatewayStatus` (from `@civic/gateway-client-react`).
// `GatewayStatus.ACTIVE` is the string literal "ACTIVE" — verified against
// `node_modules/@civic/gateway-client-core/dist/types/gateway.d.ts`.
import { useGateway, IdentityButton, GatewayStatus } from "@civic/solana-gateway-react";

/**
 * Wraps children behind a Civic Pass wall. Renders `children` iff the user's
 * gateway status is ACTIVE; otherwise renders the Civic IdentityButton for
 * the user to obtain a pass.
 *
 * Requires a `<GatewayProvider>` ancestor (see
 * `apps/web/src/components/providers/wallet-provider.tsx`).
 *
 * When `NEXT_PUBLIC_CIVIC_PASS_NETWORK` is unset, the parent opts out of the
 * provider entirely and this component is effectively bypassed (the parent
 * renders the children directly in the disabled branch).
 */
export function CivicPassGate({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { gatewayStatus } = useGateway();
  const active = gatewayStatus === GatewayStatus.ACTIVE;
  if (active) return <>{children}</>;
  return (
    <div className="rounded-lg border border-border p-6 text-center">
      <p className="mb-4 text-sm text-muted-foreground">
        Civic Pass required to continue.
      </p>
      <IdentityButton />
      {fallback}
    </div>
  );
}
