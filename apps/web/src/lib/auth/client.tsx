"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { PublicUser } from "./types";

type UserContextValue = {
  user: PublicUser | null;
  loading: boolean;
};

const UserContext = createContext<UserContextValue>({
  user: null,
  loading: false,
});

export function UserProvider({
  children,
  value,
}: {
  children: ReactNode;
  value?: UserContextValue;
}) {
  return (
    <UserContext.Provider value={value ?? { user: null, loading: false }}>
      {children}
    </UserContext.Provider>
  );
}

// Hook that reads the current user from a React context.
// Provider wraps app/(authed)/layout.tsx in Wave 2.2.
// Until then the default context returns { user: null, loading: false }
// so any caller built before Wave 2.2 compiles and runs without throwing.
export function useUser(): UserContextValue {
  return useContext(UserContext);
}
