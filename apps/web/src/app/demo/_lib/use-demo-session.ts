"use client";
import { useCallback, useEffect, useState } from "react";
import { DEMO_SESSION_KEY, type DemoSession } from "./types";

const initial = (): DemoSession => ({
  sessionId: crypto.randomUUID(),
  startedAt: Date.now(),
  civic: {}, govbr: {}, wallet: {},
  tour: { active: false, step: 0, resumable: false, history: [] },
  mocksDismissed: [],
});

const load = (): DemoSession => {
  if (typeof window === "undefined") return initial();
  try {
    const raw = sessionStorage.getItem(DEMO_SESSION_KEY);
    if (raw) return JSON.parse(raw) as DemoSession;
  } catch {}
  const fresh = initial();
  sessionStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(fresh));
  return fresh;
};

const save = (s: DemoSession) => sessionStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(s));

export function useDemoSession() {
  const [session, setSession] = useState<DemoSession>(load);

  useEffect(() => save(session), [session]);

  const patch = useCallback((patch: Partial<DemoSession>) => {
    setSession((prev) => ({ ...prev, ...patch }));
  }, []);

  const reset = useCallback(() => {
    sessionStorage.removeItem(DEMO_SESSION_KEY);
    setSession(initial());
  }, []);

  return { session, patch, reset };
}
