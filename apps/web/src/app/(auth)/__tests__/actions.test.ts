import { describe, it, expect, vi, beforeEach } from "vitest";

import type { PublicUser } from "@/lib/auth/types";

const FIXTURE_USER: PublicUser = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "borrower@example.com",
  role: "borrower",
  display_name: null,
  solana_address: null,
  created_at: "2026-05-14T00:00:00.000Z",
  updated_at: "2026-05-14T00:00:00.000Z",
};

const VALID_WALLET = "9w3TgmPwxFFu1xq4tGyHGT4qwq7e8c9P9PzL2dQjg1Yo";

let authedShouldThrow: "auth" | "none" = "none";
let updateResult: { error: { message?: string; code?: string } | null } = {
  error: null,
};
const updateEq = vi.fn();
const updateFn = vi.fn(() => ({ eq: updateEq }));
const fromFn = vi.fn(() => ({ update: updateFn }));

vi.mock("next/headers", () => ({
  cookies: () => ({
    get: () => undefined,
    set: () => undefined,
  }),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: { signOut: vi.fn(async () => ({ error: null })) },
  })),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("REDIRECT");
  }),
}));

vi.mock("@/lib/auth/server", async () => {
  class AuthRequiredError extends Error {
    constructor(message = "Authentication required") {
      super(message);
      this.name = "AuthRequiredError";
    }
  }
  return {
    AuthRequiredError,
    getAuthedClient: vi.fn(async () => {
      if (authedShouldThrow === "auth") throw new AuthRequiredError();
      return {
        user: FIXTURE_USER,
        supabase: { from: fromFn },
      };
    }),
  };
});

beforeEach(() => {
  authedShouldThrow = "none";
  updateResult = { error: null };
  updateEq.mockReset();
  updateEq.mockImplementation(async () => updateResult);
  updateFn.mockClear();
  fromFn.mockClear();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://stub.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "stub-anon-key";
});

describe("linkAuthenticatedWallet", () => {
  it("updates public.users for the authenticated caller", async () => {
    const { linkAuthenticatedWallet } = await import("../actions");
    const result = await linkAuthenticatedWallet({
      email: `${VALID_WALLET}@siws.vaulx.local`,
      wallet: VALID_WALLET,
    });
    expect(result).toEqual({ ok: true });
    expect(fromFn).toHaveBeenCalledWith("users");
    expect(updateFn).toHaveBeenCalledWith({
      email: `${VALID_WALLET}@siws.vaulx.local`,
      solana_address: VALID_WALLET,
    });
    expect(updateEq).toHaveBeenCalledWith("id", FIXTURE_USER.id);
  });

  it("rejects unauthenticated callers", async () => {
    authedShouldThrow = "auth";
    const { linkAuthenticatedWallet } = await import("../actions");
    const result = await linkAuthenticatedWallet({
      email: `${VALID_WALLET}@siws.vaulx.local`,
      wallet: VALID_WALLET,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("unauthenticated");
    expect(updateFn).not.toHaveBeenCalled();
  });

  it("rejects invalid wallet input without hitting Supabase", async () => {
    const { linkAuthenticatedWallet } = await import("../actions");
    const result = await linkAuthenticatedWallet({
      email: "borrower@example.com",
      wallet: "not-a-base58",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("invalid");
    expect(updateFn).not.toHaveBeenCalled();
  });

  it("maps unique-violation errors to a conflict code", async () => {
    updateResult = {
      error: { code: "23505", message: "duplicate key value violates unique constraint" },
    };
    const { linkAuthenticatedWallet } = await import("../actions");
    const result = await linkAuthenticatedWallet({
      email: `${VALID_WALLET}@siws.vaulx.local`,
      wallet: VALID_WALLET,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("conflict");
  });
});

describe("signOut", () => {
  it("calls supabase.auth.signOut and redirects", async () => {
    const { signOut } = await import("../actions");
    await expect(signOut()).rejects.toThrow("REDIRECT");
    const { redirect } = await import("next/navigation");
    expect(redirect).toHaveBeenCalledWith("/");
  });
});
