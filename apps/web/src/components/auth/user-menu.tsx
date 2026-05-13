"use client";

import { useUser } from "@/lib/auth/client";

import { SignInButton } from "./sign-in-button";
import { SignOutButton } from "./sign-out-button";

const SYNTHETIC_EMAIL_DOMAIN = "siws.vaulx.local";

function shortenAddress(addr: string): string {
  if (addr.length <= 8) return addr;
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

function userLabel(user: {
  display_name: string | null;
  email: string;
  solana_address: string | null;
}): string {
  if (user.display_name) return user.display_name;
  // Synthetic SIWS emails are noise. Prefer the wallet pubkey suffix.
  if (user.email.endsWith(`@${SYNTHETIC_EMAIL_DOMAIN}`) && user.solana_address) {
    return shortenAddress(user.solana_address);
  }
  return user.email;
}

export function UserMenu() {
  const { user, loading } = useUser();

  if (loading) {
    return (
      <div
        className="h-9 w-24 animate-pulse rounded-md bg-[var(--bg-elev-1)]"
        aria-hidden
      />
    );
  }

  if (!user) {
    return <SignInButton />;
  }

  return (
    <div
      className="flex items-center gap-3"
      data-testid="user-menu"
      data-user-id={user.id}
    >
      <span className="font-mono text-xs text-[var(--ink-muted)]">
        {userLabel(user)}
      </span>
      <SignOutButton size="sm" />
    </div>
  );
}
