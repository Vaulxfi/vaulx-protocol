import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { useDemoSession } from "../use-demo-session";

describe("useDemoSession", () => {
  beforeEach(() => sessionStorage.clear());

  it("creates a fresh session on first call", () => {
    const { result } = renderHook(() => useDemoSession());
    expect(result.current.session.sessionId).toMatch(/^[0-9a-f-]{36}$/);
    expect(result.current.session.startedAt).toBeGreaterThan(0);
  });

  it("persists patches across re-mounts", () => {
    const { result: first } = renderHook(() => useDemoSession());
    act(() => first.current.patch({ govbr: { cpf: "111.444.777-35" } }));

    const { result: second } = renderHook(() => useDemoSession());
    expect(second.current.session.govbr.cpf).toBe("111.444.777-35");
  });

  it("reset clears storage and creates new session", () => {
    const { result } = renderHook(() => useDemoSession());
    const firstId = result.current.session.sessionId;
    act(() => result.current.patch({ govbr: { cpf: "111.444.777-35" } }));
    act(() => result.current.reset());
    expect(result.current.session.sessionId).not.toBe(firstId);
    expect(result.current.session.govbr.cpf).toBeUndefined();
  });
});
