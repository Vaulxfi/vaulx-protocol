"use client";
// useDemoSession is intentionally session-scoped (per-tab) — each new tab
// starts a fresh demo. For permanent state we use the production routes,
// not /demo.
import { useCallback, useEffect, useState } from "react";
import { DEMO_SESSION_KEY, type DemoSession } from "./types";

const initial = (): DemoSession => ({
  sessionId: crypto.randomUUID(),
  startedAt: Date.now(),
  civic: {}, govbr: {}, wallet: {},
  tour: { active: false, step: 0, resumable: false, history: [] },
  mocksDismissed: [],
});

const loadFromStorage = (): DemoSession | null => {
  try {
    const raw = sessionStorage.getItem(DEMO_SESSION_KEY);
    if (raw) return JSON.parse(raw) as DemoSession;
  } catch {
    // corrupt JSON; ignore and return null so a fresh session is created
  }
  return null;
};

export function useDemoSession() {
  const [session, setSession] = useState<DemoSession | null>(null);

  // Populate from storage (or seed a fresh session) on mount.
  useEffect(() => {
    const existing = loadFromStorage();
    if (existing) {
      setSession(existing);
    } else {
      const fresh = initial();
      sessionStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(fresh));
      setSession(fresh);
    }
  }, []);

  // Persist any session change after load.
  useEffect(() => {
    if (session) sessionStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session));
  }, [session]);

  const patch = useCallback(
    (updater: (prev: DemoSession) => DemoSession) => {
      setSession((prev) => (prev ? updater(prev) : prev));
    },
    [],
  );

  const reset = useCallback(() => {
    sessionStorage.removeItem(DEMO_SESSION_KEY);
    const fresh = initial();
    sessionStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(fresh));
    setSession(fresh);
  }, []);

  return { session, isLoading: session === null, patch, reset };
}
