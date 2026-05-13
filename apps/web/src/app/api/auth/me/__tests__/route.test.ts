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

const getServerUser = vi.fn();

vi.mock("@/lib/auth/server", () => ({
  getServerUser: () => getServerUser(),
}));

vi.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown) => ({
      status: 200,
      async json() {
        return body;
      },
    }),
  },
}));

beforeEach(() => {
  getServerUser.mockReset();
});

describe("GET /api/auth/me", () => {
  it("returns the user when authenticated", async () => {
    getServerUser.mockResolvedValue(FIXTURE_USER);
    const { GET } = await import("../route");
    const res = await GET();
    const body = await res.json();
    expect(body).toEqual({ user: FIXTURE_USER });
  });

  it("returns null user when not authenticated", async () => {
    getServerUser.mockResolvedValue(null);
    const { GET } = await import("../route");
    const res = await GET();
    const body = await res.json();
    expect(body).toEqual({ user: null });
  });
});
