"use client";

import type { ReactNode } from "react";
// SDK: `@civic/auth-web3@0.11.x` re-exports `CivicAuthProvider` and `useUser`
// from `./react`. `useUser()` returns a `Web3UserContextType` whose base shape
// is `UserContextType` from `@civic/auth/react/hooks/useUser` — fields used
// here: `user`, `idToken`, `signIn`. Verified against
// `node_modules/@civic/auth-web3/dist/reactjs/index.d.ts` and
// `node_modules/@civic/auth/dist/reactjs/hooks/useUser.d.ts`.
import { CivicAuthProvider, useUser } from "@civic/auth-web3/react";

const CIVIC_CLIENT_ID = process.env.NEXT_PUBLIC_CIVIC_AUTH_CLIENT_ID;

/**
 * Wraps the app in `<CivicAuthProvider>` when a client id is configured.
 * Without a client id we render the children unwrapped — useful for local
 * dev / demo where Civic Auth is not provisioned yet.
 */
export function CivicAuthRoot({ children }: { children: ReactNode }) {
  if (!CIVIC_CLIENT_ID) return <>{children}</>;
  return (
    <CivicAuthProvider clientId={CIVIC_CLIENT_ID}>{children}</CivicAuthProvider>
  );
}

/**
 * Renders `children` only when the user is signed in via Civic Auth.
 * Otherwise renders `fallback` (or a default sign-in button).
 *
 * Contract: when `NEXT_PUBLIC_CIVIC_AUTH_CLIENT_ID` is unset, the gate is a
 * no-op passthrough — it renders `children` unconditionally. This matches
 * `<CivicAuthRoot>`'s passthrough mode (no provider mounted) and means
 * callers do NOT need to double-gate on the env flag. When the env flag is
 * set, a real `<CivicAuthProvider>` is required as an ancestor; this gate
 * delegates to `useUser()` inside an inner component so the hook is only
 * called when a provider exists.
 */
export function CivicAuthGate({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  if (!CIVIC_CLIENT_ID) return <>{children}</>;
  return <CivicAuthGateInner fallback={fallback}>{children}</CivicAuthGateInner>;
}

function CivicAuthGateInner({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { user, signIn } = useUser();
  if (!user)
    return (
      <>
        {fallback ?? (
          <button
            type="button"
            onClick={() => signIn()}
            className="rounded-md border border-[var(--brand)]/40 bg-[var(--brand)]/10 px-4 py-2 font-mono text-sm uppercase tracking-wider text-[var(--brand)]"
          >
            Sign in with Civic
          </button>
        )}
      </>
    );
  return <>{children}</>;
}
