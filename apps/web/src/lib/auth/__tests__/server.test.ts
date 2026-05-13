import { describe, it, expect, vi, beforeEach } from "vitest";

import type { PublicUser } from "../types";

const FIXTURE_USER: PublicUser = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "borrower@example.com",
  role: "borrower",
  display_name: null,
  solana_address: null,
  created_at: "2026-05-14T00:00:00.000Z",
  updated_at: "2026-05-14T00:00:00.000Z",
};

type AuthUser = { id: string } | null;

let currentAuthUser: AuthUser = null;
let currentRow: PublicUser | null = null;
let currentRowError: { message: string } | null = null;

function makeFakeClient() {
  return {
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: currentAuthUser },
        error: null,
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(async () => ({
            data: currentRow,
            error: currentRowError,
          })),
        })),
      })),
    })),
  };
}

vi.mock("next/headers", () => ({
  cookies: () => ({
    get: () => undefined,
    set: () => undefined,
  }),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => makeFakeClient()),
}));

beforeEach(() => {
  vi.resetModules();
  currentAuthUser = null;
  currentRow = null;
  currentRowError = null;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://stub.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "stub-anon-key";
});

describe("getServerUser", () => {
  it("returns PublicUser when a session and matching public.users row exist", async () => {
    currentAuthUser = { id: FIXTURE_USER.id };
    currentRow = FIXTURE_USER;

    const { getServerUser } = await import("../server");
    const user = await getServerUser();

    expect(user).toEqual(FIXTURE_USER);
  });

  it("returns null when no session is present", async () => {
    currentAuthUser = null;

    const { getServerUser } = await import("../server");
    const user = await getServerUser();

    expect(user).toBeNull();
  });

  it("returns null when the auth user has no public.users row yet", async () => {
    currentAuthUser = { id: FIXTURE_USER.id };
    currentRow = null;

    const { getServerUser } = await import("../server");
    const user = await getServerUser();

    expect(user).toBeNull();
  });
});

describe("requireUser", () => {
  it("returns PublicUser when session is valid", async () => {
    currentAuthUser = { id: FIXTURE_USER.id };
    currentRow = FIXTURE_USER;

    const { requireUser } = await import("../server");
    const user = await requireUser();

    expect(user).toEqual(FIXTURE_USER);
  });

  it("throws AuthRequiredError when no session", async () => {
    currentAuthUser = null;

    const { requireUser, AuthRequiredError } = await import("../server");

    await expect(requireUser()).rejects.toBeInstanceOf(AuthRequiredError);
  });

  it("throws AuthRequiredError when session exists but public.users row is missing", async () => {
    currentAuthUser = { id: FIXTURE_USER.id };
    currentRow = null;

    const { requireUser, AuthRequiredError } = await import("../server");

    await expect(requireUser()).rejects.toBeInstanceOf(AuthRequiredError);
  });
});

describe("getAuthedClient", () => {
  it("returns user + supabase client when authenticated", async () => {
    currentAuthUser = { id: FIXTURE_USER.id };
    currentRow = FIXTURE_USER;

    const { getAuthedClient } = await import("../server");
    const { user, supabase } = await getAuthedClient();

    expect(user).toEqual(FIXTURE_USER);
    expect(supabase).toBeDefined();
    expect(typeof (supabase as { from: unknown }).from).toBe("function");
  });

  it("throws AuthRequiredError when not authenticated", async () => {
    currentAuthUser = null;

    const { getAuthedClient, AuthRequiredError } = await import("../server");

    await expect(getAuthedClient()).rejects.toBeInstanceOf(AuthRequiredError);
  });
});
