"use client";
// TODO(lazorkit-sdk-verify): @lazorkit/wallet@2.0.1's transitive deps
// (@solana/kora → @solana-program/token) require @solana/kit@^5, but pnpm
// resolves an older kit@2.3.0 from elsewhere in the workspace, breaking the
// webpack build. Until the upstream peer mismatch is resolved (or we add a
// pnpm.overrides pin for @solana/kit ^5 in this transitive chain), the card
// renders the mock-only fallback. Real-SDK shape is preserved in the
// `WALLET-SDK-NOTES` file in the implementation plan: render <LazorkitProvider>
// then a child that calls `useWallet()`, then connect on click and read
// `info.smartWallet`.
import { MockBadge } from "../integration-badges";
import { useDemoSession } from "../../_lib/use-demo-session";

export function LazorKitCard() {
  const { session, patch } = useDemoSession();

  return (
    <>
      <button
        onClick={() =>
          session &&
          patch((s) => ({
            ...s,
            wallet: {
              provider: "lazorkit",
              pubkey: "MOCK33333333333333333333333333333333333333",
            },
          }))
        }
        className="w-full rounded-md border border-[var(--rule)] p-4 text-left hover:border-[var(--brand)]/50"
      >
        <p className="font-mono text-xs uppercase tracking-wider text-[var(--ink-muted)]">
          LazorKit · sandbox unset
        </p>
        <p className="mt-1 font-display text-lg">FaceID · mock</p>
        <p className="mt-1 text-xs text-[var(--ink-muted)]">
          Real SDK pending @solana/kit ^5 alignment. Mock for now.
        </p>
      </button>
      <MockBadge partner="LazorKit" />
    </>
  );
}
