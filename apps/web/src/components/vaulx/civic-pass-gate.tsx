"use client";

import type { ReactNode } from "react";
// TODO(civic-sdk-verify): confirm hook + status enum names against installed
// package. `@civic/solana-gateway-react@1.2.x` is expected to expose
// `useGateway`, `IdentityButton`, and `GatewayStatus`. Some versions use
// `State.ACTIVE` instead of `GatewayStatus.ACTIVE`.
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
  // TODO(civic-sdk-verify): some SDK versions use `State.ACTIVE`, others
  // `GatewayStatus.ACTIVE`. Confirm post-install.
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
