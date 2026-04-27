import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { useDemoSession } from "../use-demo-session";
import { DEMO_SESSION_KEY } from "../types";

describe("useDemoSession", () => {
  beforeEach(() => sessionStorage.clear());

  it("creates a fresh session on first call", async () => {
    const { result } = renderHook(() => useDemoSession());
    await waitFor(() => expect(result.current.session).not.toBeNull());
    expect(result.current.session!.sessionId).toMatch(/^[0-9a-f-]{36}$/);
    expect(result.current.session!.startedAt).toBeGreaterThan(0);
  });

  it("persists patches across re-mounts", async () => {
    const { result: first } = renderHook(() => useDemoSession());
    await waitFor(() => expect(first.current.session).not.toBeNull());
    act(() =>
      first.current.patch((s) => ({ ...s, govbr: { ...s.govbr, cpf: "111.444.777-35" } })),
    );

    const { result: second } = renderHook(() => useDemoSession());
    await waitFor(() => expect(second.current.session).not.toBeNull());
    expect(second.current.session!.govbr.cpf).toBe("111.444.777-35");
  });

  it("reset clears storage and creates new session", async () => {
    const { result } = renderHook(() => useDemoSession());
    await waitFor(() => expect(result.current.session).not.toBeNull());
    const firstId = result.current.session!.sessionId;
    act(() =>
      result.current.patch((s) => ({ ...s, govbr: { ...s.govbr, cpf: "111.444.777-35" } })),
    );
    act(() => result.current.reset());
    expect(result.current.session!.sessionId).not.toBe(firstId);
    expect(result.current.session!.govbr.cpf).toBeUndefined();
  });

  it("recovers from corrupt storage by seeding a fresh session", async () => {
    sessionStorage.setItem(DEMO_SESSION_KEY, "{not json");
    const { result } = renderHook(() => useDemoSession());
    await waitFor(() => expect(result.current.session).not.toBeNull());
    expect(result.current.session!.sessionId).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("multi-key patches accumulate (no clobbering)", async () => {
    const { result } = renderHook(() => useDemoSession());
    await waitFor(() => expect(result.current.session).not.toBeNull());
    act(() =>
      result.current.patch((s) => ({ ...s, govbr: { ...s.govbr, cpf: "111.444.777-35" } })),
    );
    act(() =>
      result.current.patch((s) => ({ ...s, civic: { ...s.civic, jwtHash: "tok" } })),
    );
    expect(result.current.session!.govbr.cpf).toBe("111.444.777-35");
    expect(result.current.session!.civic.jwtHash).toBe("tok");
  });
});
