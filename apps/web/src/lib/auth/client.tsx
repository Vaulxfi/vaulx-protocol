"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { PublicUser } from "./types";

type UserContextValue = {
  user: PublicUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

const defaultContext: UserContextValue = {
  user: null,
  loading: false,
  refresh: async () => {},
};

const UserContext = createContext<UserContextValue>(defaultContext);

async function fetchMe(): Promise<PublicUser | null> {
  const res = await fetch("/api/auth/me", {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) return null;
  const body = (await res.json()) as { user: PublicUser | null };
  return body.user ?? null;
}

export function UserProvider({
  children,
  initialUser = null,
  // Allows tests / Storybook to short-circuit fetching by passing a fully
  // computed context. When omitted, the provider self-hydrates via /api/auth/me.
  value,
}: {
  children: ReactNode;
  initialUser?: PublicUser | null;
  value?: UserContextValue;
}) {
  const [user, setUser] = useState<PublicUser | null>(initialUser);
  const [loading, setLoading] = useState<boolean>(!value && initialUser === null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const next = await fetchMe();
      setUser(next);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (value) return;
    if (initialUser !== null) {
      // Server already hydrated us; skip the round-trip on mount.
      setLoading(false);
      return;
    }
    void refresh();
  }, [value, initialUser, refresh]);

  const ctx = useMemo<UserContextValue>(
    () => value ?? { user, loading, refresh },
    [value, user, loading, refresh],
  );

  return <UserContext.Provider value={ctx}>{children}</UserContext.Provider>;
}

export function useUser(): UserContextValue {
  return useContext(UserContext);
}
