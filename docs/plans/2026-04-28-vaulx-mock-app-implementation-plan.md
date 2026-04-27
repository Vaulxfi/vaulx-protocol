# Vaulx Mock App Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` to implement this plan task-by-task.

**Goal:** Build the Vaulx mock app at `vaulx.vercel.app/demo/*` — full borrower flow (mobile bezel) + lender flow (desktop) + 3-tier auction waterfall + landing + interactive architecture diagram + 14-step guided tour. β+ scope per the design doc.

**Architecture:** New routes under `apps/web/src/app/demo/*`, embedded in the existing Next.js 14 app, sharing the editorial dark-operator design system. State persists in `sessionStorage` keyed by a session UUID. Real SDK integrations (Privy, Crossmint, LazorKit, Civic CAPTCHA, WatchCharts, Chrono24); mock UIs for everything that requires commercial agreements (Privy Pix, Solflare card, Kamino, Plume, Tokeny, gov.br, Brinks IoT). All mocks ribbon-tagged `MOCK · partnership in progress`.

**Tech Stack:** Next.js 14 App Router · Tailwind · shadcn/ui · `@privy-io/react-auth` · `@crossmint/client-sdk-react-ui` · `@lazorkit/wallet` · `driver.js` · `@vaulx/ccb` (existing PDF generator) · existing `/api/appraisal` (Chrono24 + WatchCharts + internal model).

**Source-of-truth design:** [`docs/plans/2026-04-27-vaulx-mock-app-demo-design.md`](2026-04-27-vaulx-mock-app-demo-design.md). Read it before starting Task 0.1.

**Skills referenced:**
- `superpowers:test-driven-development` — for component tests
- `superpowers:verification-before-completion` — before declaring any task complete
- `superpowers:requesting-code-review` — at end of each phase

**Global rule (enforced by CI):** No personal names anywhere in `apps/web/src/app/demo/*` rendered output. See §9 of design doc.

---

## Phase 0 — Foundation (Day 1, Apr 28)

Goal: scaffolding ready so Day 2+ tasks just plug components in.

### Task 0.1: Add demo route tree + minimal landing

**Files:**
- Create: `apps/web/src/app/demo/page.tsx`
- Create: `apps/web/src/app/demo/layout.tsx`
- Create: `apps/web/src/app/demo/_lib/types.ts`

**Step 1:** Read the design doc end-to-end.

**Step 2:** Create `apps/web/src/app/demo/_lib/types.ts`:

```ts
export type DemoFormFactor = "phone" | "desktop";

export type DemoSession = {
  sessionId: string;
  startedAt: number;
  civic: { gatewayToken?: string; verifiedAt?: number };
  govbr: { cpf?: string; name?: string; verifiedAt?: number };
  wallet: {
    provider?: "privy" | "crossmint" | "lazorkit";
    pubkey?: string;
    email?: string;
  };
  watch?: {
    make: string; model: string; ref: string; year: number;
    condition: "mint" | "excellent" | "very_good" | "good";
    photos: string[];
    appraisal?: { chrono24: number; watchcharts: number; internal: number; median: number };
    priceHistory?: number[];
  };
  loan?: {
    loanId: string;
    principalAtoms: string;        // bigint as string for JSON safety
    rateBps: number; termDays: number; dueTs: number;
    ccbHashHex: string;
    signatureDataUrl: string;
    custody: { provider: "brinks" | "prosegur" | "loomis"; bookedSlot?: string; confirmedAt?: number };
    disbursedAt?: number;
    inAppBalanceAtoms: string;
  };
  tour: { active: boolean; step: number; resumable: boolean; history: number[] };
  mocksDismissed: string[];
};

export const DEMO_SESSION_KEY = "vaulx_demo_session";
```

**Step 3:** Create `apps/web/src/app/demo/layout.tsx`:

```tsx
import type { ReactNode } from "react";

export const metadata = {
  title: "Vaulx · Mock app demo",
  description: "Click-through prototype of Vaulx — Solana RWA lending against luxury watches.",
};

export default function DemoLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-[var(--bg)]">{children}</div>;
}
```

**Step 4:** Create `apps/web/src/app/demo/page.tsx` (minimal placeholder for Day 1 — fleshed out on Day 9):

```tsx
export default function DemoLanding() {
  return (
    <main className="mx-auto flex min-h-screen max-w-[1100px] flex-col justify-center px-6 py-20">
      <p className="eyebrow">Vaulx · Mock app demo</p>
      <h1 className="display-xl mt-4">Two minutes from Rolex to Pix.</h1>
      <p className="mt-6 max-w-[60ch] text-[var(--ink-dim)]">
        Routes scaffolded. Coming online over the next 9 days.
      </p>
    </main>
  );
}
```

**Step 5:** Verify build:
```bash
pnpm --filter @vaulx/web build 2>&1 | tail -10
```
Expected: green; `/demo` listed in route manifest as static.

**Step 6:** Commit:
```bash
git add apps/web/src/app/demo/
git commit -m "feat(demo): scaffold /demo route tree + types"
```

### Task 0.2: `useDemoSession()` hook

**Files:**
- Create: `apps/web/src/app/demo/_lib/use-demo-session.ts`
- Test: `apps/web/src/app/demo/_lib/__tests__/use-demo-session.test.ts`

**Step 1:** Write the failing test:

```ts
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
      result.current.patch((s) => ({ ...s, civic: { ...s.civic, gatewayToken: "tok" } })),
    );
    expect(result.current.session!.govbr.cpf).toBe("111.444.777-35");
    expect(result.current.session!.civic.gatewayToken).toBe("tok");
  });
});
```

**Step 2:** Run test, verify it fails:
```bash
pnpm --filter @vaulx/web test -- use-demo-session
```
Expected: FAIL — `useDemoSession is not defined`.

**Step 3:** Implement (Pattern: load-in-effect + functional updater. Avoids hydration mismatch + nested-key clobbering.):

```ts
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
```

Callers use the functional updater to merge nested state explicitly:

```ts
patch((s) => ({ ...s, govbr: { ...s.govbr, cpf: "X" } }));
```

The returned `session` is `null` until the mount effect runs (use `isLoading` to gate UI).

**Step 4:** Run test, verify pass:
```bash
pnpm --filter @vaulx/web test -- use-demo-session
```
Expected: PASS, 3 tests.

**Step 5:** Commit:
```bash
git add apps/web/src/app/demo/_lib/
git commit -m "feat(demo): useDemoSession hook with sessionStorage persistence"
```

### Task 0.3: `<PhoneBezel>` component

**Files:**
- Create: `apps/web/src/app/demo/_components/phone-bezel.tsx`

**Note:** Both `<PhoneBezel>` and `<PhoneFullBleed>` render their children unconditionally — the CSS responsive utilities only hide one visually. Stateful children mounted directly inside these primitives would run twice. Use `<DemoShell>` (Task 0.4) for any flow with state.

**Step 1:** Implement (no test — pure visual component):

```tsx
// CONSTRAINT: Both <PhoneBezel> and <PhoneFullBleed> render their children
// unconditionally — the CSS responsive utilities (`hidden md:block` / `md:hidden`)
// only hide one visually. Stateful children would mount twice, double-fire
// effects, and clash on DOM IDs. Callers requiring stateful content should
// use <DemoShell> (Task 0.4), which mounts one branch at a time.
import type { ReactNode } from "react";

export function PhoneBezel({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto my-12 hidden md:block">
      <div
        role="img"
        aria-label="Phone mockup"
        className="relative w-[393px] h-[852px] rounded-[55px] border-[6px] border-[#1a1917] bg-[var(--bg)] shadow-[0_60px_120px_-30px_rgba(0,0,0,0.5)] overflow-hidden"
      >
        {/* Dynamic island */}
        <div className="absolute left-1/2 top-2 -translate-x-1/2 z-50 h-[37px] w-[126px] rounded-full bg-black" />
        {/* Status bar */}
        <div className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-7 py-2 text-[12px] font-semibold text-[var(--ink)]">
          <span>9:41</span>
          <span className="opacity-0" aria-hidden="true">VAULX</span>
          <span>VAULX</span>
        </div>
        {/* Inner viewport */}
        <div className="absolute inset-0 pt-[44px] pb-[18px] overflow-y-auto">
          {children}
        </div>
        {/* Home indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-50 h-[5px] w-[134px] rounded-full bg-[var(--ink)]/60" />
      </div>
    </div>
  );
}

export function PhoneFullBleed({ children }: { children: ReactNode }) {
  return <div className="md:hidden min-h-screen">{children}</div>;
}
```

**Step 2:** Verify it renders by adding a quick story page at `apps/web/src/app/demo/dev/bezel/page.tsx` (gitignored later):

```tsx
import { PhoneBezel, PhoneFullBleed } from "@/app/demo/_components/phone-bezel";

export default function DevBezel() {
  return (
    <>
      <PhoneBezel><div className="p-6">Hello bezel</div></PhoneBezel>
      <PhoneFullBleed><div className="p-6">Hello full-bleed</div></PhoneFullBleed>
    </>
  );
}
```

**Step 3:** Verify in browser:
```bash
pnpm --filter @vaulx/web dev
# open http://localhost:3000/demo/dev/bezel
```
Expected: visible iPhone bezel on desktop ≥ md, full-bleed below md.

**Step 4:** Build:
```bash
pnpm --filter @vaulx/web build 2>&1 | tail -5
```
Expected: green.

**Step 5:** Commit:
```bash
git add apps/web/src/app/demo/_components/phone-bezel.tsx apps/web/src/app/demo/dev/
git commit -m "feat(demo): <PhoneBezel> + <PhoneFullBleed> primitives"
```

### Task 0.4: `<DemoShell>` + `<DemoTopBar>` + `<DemoFooterNav>`

**Files:**
- Create: `apps/web/src/app/demo/_components/demo-shell.tsx`
- Create: `apps/web/src/app/demo/_components/demo-top-bar.tsx`
- Create: `apps/web/src/app/demo/_components/demo-footer-nav.tsx`

**Step 1:** Add a small `useMediaQuery` hook at `apps/web/src/app/demo/_lib/use-media-query.ts` (uses `useSyncExternalStore` for SSR safety; SSR fallback assumes mobile / full-bleed):

```ts
"use client";
import { useSyncExternalStore } from "react";

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (cb) => {
      if (typeof window === "undefined") return () => {};
      const mq = window.matchMedia(query);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => (typeof window === "undefined" ? false : window.matchMedia(query).matches),
    () => false, // SSR fallback: assume mobile (full-bleed)
  );
}
```

Then implement `<DemoShell>`. Resolves the double-mount caveat from Task 0.3 by picking ONE branch at runtime (children mount once):

```tsx
"use client";
import type { ReactNode } from "react";
import type { DemoFormFactor } from "../_lib/types";
import { useMediaQuery } from "../_lib/use-media-query";
import { PhoneBezel, PhoneFullBleed } from "./phone-bezel";
import { DemoTopBar } from "./demo-top-bar";
import { DemoFooterNav } from "./demo-footer-nav";

export function DemoShell({
  children,
  formFactor,
}: {
  children: ReactNode;
  formFactor: DemoFormFactor;
}) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  return (
    <>
      <DemoTopBar />
      {formFactor === "phone" ? (
        isDesktop ? (
          <PhoneBezel>
            {children}
            <DemoFooterNav />
          </PhoneBezel>
        ) : (
          <PhoneFullBleed>
            {children}
            <DemoFooterNav />
          </PhoneFullBleed>
        )
      ) : (
        <main className="mx-auto max-w-[1280px] px-6 py-12 md:py-20">{children}</main>
      )}
    </>
  );
}
```

**Step 2:** Implement `<DemoTopBar>`:

```tsx
"use client";
import Link from "next/link";
import { useDemoSession } from "../_lib/use-demo-session";

export function DemoTopBar() {
  const { session, patch, reset } = useDemoSession();
  const tourLabel =
    session?.tour.resumable && session.tour.step > 0
      ? `Resume tour · ${session.tour.step}/14`
      : "Tour";

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between gap-4 border-b border-[var(--rule)] bg-[var(--bg)]/85 px-6 py-3 backdrop-blur-sm">
      <Link href="/demo" className="font-display text-lg tracking-tight">
        <span className="text-[var(--brand)]">●</span> Vaulx{" "}
        <span className="text-xs font-mono text-[var(--ink-muted)] tracking-widest uppercase">demo</span>
      </Link>
      <div className="flex items-center gap-2">
        <button
          onClick={() => session && patch((s) => ({ ...s, tour: { ...s.tour, active: !s.tour.active } }))}
          className="rounded-md border border-[var(--rule)] px-3 py-1.5 text-xs font-mono uppercase tracking-wide text-[var(--ink-dim)] hover:bg-[var(--bg-elev-1)]"
        >
          {tourLabel}
        </button>
        <button
          onClick={() => {
            if (confirm("Reset demo? This clears your progress.")) reset();
          }}
          className="rounded-md border border-[var(--rule)] px-3 py-1.5 text-xs font-mono uppercase tracking-wide text-[var(--ink-dim)] hover:bg-[var(--bg-elev-1)]"
        >
          Reset
        </button>
        <Link
          href="/"
          className="rounded-md border border-[var(--rule)] px-3 py-1.5 text-xs font-mono uppercase tracking-wide text-[var(--ink-dim)] hover:bg-[var(--bg-elev-1)]"
        >
          Exit
        </Link>
      </div>
    </header>
  );
}
```

**Step 3:** Implement `<DemoFooterNav>`:

```tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/demo/borrow/onboard", label: "Home", icon: "◇" },
  { href: "/demo/borrow/loan-offer", label: "Borrow", icon: "▤" },
  { href: "/demo/borrow/funds", label: "Spend", icon: "◊" },
  { href: "/demo/borrow/dashboard", label: "Dashboard", icon: "▦" },
] as const;

export function DemoFooterNav() {
  const path = usePathname();
  return (
    <nav className="sticky bottom-0 left-0 right-0 grid grid-cols-4 border-t border-[var(--rule)] bg-[var(--bg)]/95 backdrop-blur-sm">
      {tabs.map((t) => {
        const active = path?.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`flex flex-col items-center gap-1 py-2.5 text-[10px] uppercase tracking-wider font-mono ${
              active ? "text-[var(--brand)]" : "text-[var(--ink-muted)]"
            }`}
          >
            <span className="text-lg">{t.icon}</span>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
```

**Step 4:** Build:
```bash
pnpm --filter @vaulx/web build 2>&1 | tail -5
```
Expected: green.

**Step 5:** Commit:
```bash
git add apps/web/src/app/demo/_components/
git commit -m "feat(demo): <DemoShell> + <DemoTopBar> + <DemoFooterNav>"
```

### Task 0.5: `<MockBadge>` + `<LiveBadge>`

**Files:**
- Create: `apps/web/src/app/demo/_components/integration-badges.tsx`

**Step 1:** Implement:

```tsx
"use client";
import { useDemoSession } from "../_lib/use-demo-session";

type Props = { partner: string };

export function MockBadge({ partner }: Props) {
  const { session, patch } = useDemoSession();
  const dismissed = session?.mocksDismissed.includes(partner);
  if (!session || dismissed) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full border border-[var(--brand)]/30 bg-[var(--brand)]/10 px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider text-[var(--brand)] backdrop-blur-sm">
      <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand)]" />
      MOCK · {partner} · agreement pending
      <button
        onClick={() => patch((s) => ({ ...s, mocksDismissed: [...s.mocksDismissed, partner] }))}
        className="ml-1 opacity-60 hover:opacity-100"
        aria-label="Dismiss"
      >×</button>
    </div>
  );
}

export function LiveBadge({ partner }: Props) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-emerald-400">
      <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
      LIVE · {partner}
    </span>
  );
}
```

**Step 2:** Build + commit:
```bash
pnpm --filter @vaulx/web build 2>&1 | tail -3
git add apps/web/src/app/demo/_components/integration-badges.tsx
git commit -m "feat(demo): <MockBadge> + <LiveBadge> primitives"
```

### Task 0.6: CI grep — no personal names rule

**Files:**
- Modify: `.github/workflows/ci.yml`

**Step 1:** Add a step to the existing `ts` job:

```yaml
      - name: Enforce no personal names rule (demo surfaces)
        run: |
          if grep -rE "(Felipe|Marcelo|Rodrigo|Edson|George|gogy)" \
              apps/web/src/app/demo/ \
              apps/web/src/components/vaulx/demo*/ 2>/dev/null; then
            echo "::error::Personal names found in demo surfaces. See design doc §9."
            exit 1
          fi
          echo "✓ no personal names in /demo"
```

**Step 2:** Run locally to verify:
```bash
grep -rE "(Felipe|Marcelo|Rodrigo|Edson|George|gogy)" \
  apps/web/src/app/demo/ 2>/dev/null && echo "FAIL" || echo "PASS"
```
Expected: PASS.

**Step 3:** Commit:
```bash
git add .github/workflows/ci.yml
git commit -m "ci(demo): enforce no-personal-names rule on /demo surfaces"
```

### Task 0.7: Verify Day 1 deploy + checkpoint

**Step 1:** Push:
```bash
git push origin main
```

**Step 2:** Wait ~2 min for Vercel deploy. Verify:
```bash
curl -sS -o /dev/null -w "%{http_code}\n" https://vaulx.vercel.app/demo
```
Expected: `200`.

**Step 3:** Use `superpowers:requesting-code-review` skill on the Day 1 increment before moving on.

---

## Phase 1 — Onboarding + Wallet (Day 2, Apr 29)

### Task 1.1: `/demo/borrow/onboard` page + Civic CAPTCHA

**Files:**
- Create: `apps/web/src/app/demo/borrow/onboard/page.tsx`

**Step 1:** Read the existing `<CivicPassGate>` at `apps/web/src/components/vaulx/civic-pass-gate.tsx` to understand the pattern.

**Step 2:** Implement page (post-fix `useDemoSession` shape: `session: DemoSession | null` + functional `patch((s) => ...)` updater). The `gov.br` bridge effect reads from the production `/borrow/verify-id` flow's localStorage (keyed by wallet pubkey, with a `demo-no-wallet` fallback) when the user returns via `?via=demo`:

```tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { DemoShell } from "../../_components/demo-shell";
import { LiveBadge, MockBadge } from "../../_components/integration-badges";
import { useDemoSession } from "../../_lib/use-demo-session";
import { getGovbrVerification } from "@/lib/govbr/mock-storage";

export default function OnboardPage() {
  const { session, patch } = useDemoSession();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (session?.civic.verifiedAt) return;
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [session?.civic.verifiedAt]);

  // Bridge: pull gov.br verification from the production /borrow/verify-id
  // page's localStorage (keyed by wallet pubkey, falling back to a sentinel
  // when no wallet is set yet).
  useEffect(() => {
    if (!session) return;
    if (session.govbr.verifiedAt) return;
    const wallet = session.wallet.pubkey ?? "demo-no-wallet";
    const v = getGovbrVerification(wallet);
    if (v) {
      patch((s) => ({
        ...s,
        govbr: { cpf: v.cpf, name: v.name, verifiedAt: v.verified_at },
      }));
    }
  }, [session, patch]);

  if (!session)
    return (
      <DemoShell formFactor="phone">
        <div className="px-6 py-12 text-[var(--ink-muted)]">Loading…</div>
      </DemoShell>
    );

  const civicDone = !!session.civic.verifiedAt;
  const govbrDone = !!session.govbr.verifiedAt;

  return (
    <DemoShell formFactor="phone">
      <div className="px-6 py-8">
        <p className="eyebrow">Step 1 / 14 · 60-sec onboarding</p>
        <h1 className="display-md mt-3">Verify in under a minute.</h1>
        <p className="mt-3 text-sm text-[var(--ink-dim)]">
          Civic Pass on Solana for Sybil resistance. gov.br for Brazilian PII.
        </p>

        <div className="mt-6 rounded-md border border-[var(--rule)] p-4">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs uppercase tracking-wider text-[var(--ink-muted)]">
              Elapsed: {elapsed}s
            </p>
            {civicDone && govbrDone && <LiveBadge partner="Civic" />}
          </div>
        </div>

        <button
          disabled={civicDone}
          onClick={() =>
            patch((s) => ({
              ...s,
              civic: { gatewayToken: "demo-token", verifiedAt: Date.now() },
            }))
          }
          className="mt-6 w-full rounded-md border border-[var(--brand)]/40 bg-[var(--brand)]/10 px-4 py-3 font-mono text-sm uppercase tracking-wider text-[var(--brand)] disabled:opacity-50"
        >
          {civicDone ? "✓ Civic Pass verified" : "Verify with Civic"}
        </button>

        <Link
          href={`/borrow/verify-id?return_to=/demo/borrow/onboard&via=demo`}
          className="mt-3 block w-full rounded-md border border-[var(--rule)] px-4 py-3 text-center font-mono text-sm uppercase tracking-wider text-[var(--ink-dim)]"
        >
          {govbrDone ? "✓ gov.br verified" : "Continue with gov.br"}
        </Link>

        <Link
          href="/demo/borrow/wallet"
          className={`mt-8 block w-full rounded-md border px-4 py-3 text-center font-mono text-sm uppercase tracking-wider ${
            civicDone && govbrDone
              ? "border-[var(--brand)] bg-[var(--brand)] text-[var(--bg)]"
              : "border-[var(--rule)] text-[var(--ink-muted)] pointer-events-none"
          }`}
        >
          Next →
        </Link>
      </div>
      <MockBadge partner="gov.br" />
    </DemoShell>
  );
}
```

**Step 3:** Build + smoke test:
```bash
pnpm --filter @vaulx/web build 2>&1 | tail -3
```

**Step 4:** Commit:
```bash
git add apps/web/src/app/demo/borrow/onboard/
git commit -m "feat(demo): /demo/borrow/onboard — Civic CAPTCHA + gov.br mock"
```

### Task 1.2: Install Privy + Crossmint + LazorKit SDKs

**Step 1:** Install:
```bash
pnpm --filter @vaulx/web add @privy-io/react-auth @crossmint/client-sdk-react-ui @lazorkit/wallet
```

**Step 2:** Get sandbox API keys (assume user provides; otherwise fall back to mock UI):
- Privy: dashboard.privy.io → create app → copy "App ID"
- Crossmint: crossmint.com/console → API keys → "Client API key (Production-Server)"
- LazorKit: no key needed

**Step 3:** Add to Vercel env vars (production + preview) via CLI:
```bash
TOKEN=$(grep -i vercel_token .env | cut -d= -f2)
SCOPE=team_xxnjJw6BsmOjrWZhABWgity1
echo -n "<privy-app-id>" | vercel env add NEXT_PUBLIC_PRIVY_APP_ID production --token=$TOKEN --scope=$SCOPE --force
echo -n "<crossmint-key>" | vercel env add NEXT_PUBLIC_CROSSMINT_API_KEY production --token=$TOKEN --scope=$SCOPE --force
```

(If user hasn't provided keys, leave env unset; the SDK provider components must `if (!apiKey) return <PlaceholderCard />` gracefully.)

**Step 4:** Add to `.env.example` + local `.env.local`:
```
NEXT_PUBLIC_PRIVY_APP_ID=
NEXT_PUBLIC_CROSSMINT_API_KEY=
```

**Step 5:** Commit:
```bash
git add apps/web/package.json apps/web/.env.example pnpm-lock.yaml
git commit -m "chore(demo): add Privy + Crossmint + LazorKit SDKs"
```

### Task 1.3: `/demo/borrow/wallet` with 3 SDK cards

**Files:**
- Create: `apps/web/src/app/demo/borrow/wallet/page.tsx`
- Create: `apps/web/src/app/demo/_components/wallet-cards/privy-card.tsx`
- Create: `apps/web/src/app/demo/_components/wallet-cards/crossmint-card.tsx`
- Create: `apps/web/src/app/demo/_components/wallet-cards/lazorkit-card.tsx`

**Step 1:** Implement `privy-card.tsx` (post-fix `useDemoSession` shape: `session && patch((s) => ...)`). The eslint-disabled `any` casts in the original plan don't fly under the repo's eslint config — use `Record<string, unknown>` casts via `unknown` instead:

```tsx
"use client";
import { PrivyProvider, usePrivy } from "@privy-io/react-auth";
import { useEffect } from "react";
import { useDemoSession } from "../../_lib/use-demo-session";

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

type Loose = Record<string, unknown>;

function PrivyInner({
  onConnected,
}: {
  onConnected: (pubkey: string, email?: string) => void;
}) {
  const { login, ready, authenticated, user } = usePrivy();
  useEffect(() => {
    if (authenticated && user) {
      const sol = user.linkedAccounts.find((a) => {
        const x = a as unknown as Loose;
        return x.type === "wallet" && x.chainType === "solana";
      });
      const pubkey =
        ((sol as unknown as Loose | undefined)?.address as string | undefined) ?? user.id;
      const email =
        ((user.email as unknown as Loose | undefined)?.address as string | undefined) ?? undefined;
      onConnected(pubkey, email);
    }
  }, [authenticated, user, onConnected]);

  return (
    <button
      disabled={!ready}
      onClick={() => login()}
      className="w-full rounded-md border border-[var(--rule)] p-4 text-left hover:border-[var(--brand)]/50 disabled:opacity-50"
    >
      <p className="font-mono text-xs uppercase tracking-wider text-[var(--ink-muted)]">Privy</p>
      <p className="mt-1 font-display text-lg">Email or social</p>
      <p className="mt-1 text-xs text-[var(--ink-dim)]">Stripe-acquired. Embedded Solana wallet.</p>
    </button>
  );
}

export function PrivyCard() {
  const { session, patch } = useDemoSession();
  if (!PRIVY_APP_ID) {
    return (
      <button
        onClick={() =>
          session &&
          patch((s) => ({
            ...s,
            wallet: { provider: "privy", pubkey: "MOCK11111111111111111111111111111111111111" },
          }))
        }
        className="w-full rounded-md border border-[var(--rule)] p-4 text-left hover:border-[var(--brand)]/50"
      >
        <p className="font-mono text-xs uppercase tracking-wider text-[var(--ink-muted)]">Privy · sandbox unset</p>
        <p className="mt-1 font-display text-lg">Email or social</p>
        <p className="mt-1 text-xs text-[var(--ink-muted)]">MOCK — set NEXT_PUBLIC_PRIVY_APP_ID to enable real SDK.</p>
      </button>
    );
  }
  return (
    <PrivyProvider appId={PRIVY_APP_ID} config={{ appearance: { theme: "dark" } }}>
      <PrivyInner
        onConnected={(pubkey, email) =>
          session && patch((s) => ({ ...s, wallet: { provider: "privy", pubkey, email } }))
        }
      />
    </PrivyProvider>
  );
}
```

**Step 2:** Implement `crossmint-card.tsx`. Verified against `@crossmint/client-sdk-react-ui@4.1.5`:
- `<CrossmintProvider apiKey>` (top)
- `<CrossmintAuthProvider>` exposes `useCrossmintAuth().{ login, status, user }`
- `<CrossmintWalletProvider createOnLogin={...}>` exposes `useWallet().{ wallet }` with `wallet.address` as the chain-specific pubkey

```tsx
"use client";
// TODO(crossmint-sdk-verify): confirm hook + provider names against installed types.
import {
  CrossmintProvider,
  CrossmintAuthProvider,
  CrossmintWalletProvider,
  useCrossmintAuth,
  useWallet,
} from "@crossmint/client-sdk-react-ui";
import { useEffect } from "react";
import { useDemoSession } from "../../_lib/use-demo-session";

const CROSSMINT_API_KEY = process.env.NEXT_PUBLIC_CROSSMINT_API_KEY;

function CrossmintInner({
  onConnected,
}: {
  onConnected: (pubkey: string, email?: string) => void;
}) {
  const { login, status, user } = useCrossmintAuth();
  const { wallet } = useWallet();
  useEffect(() => {
    if (status === "logged-in" && wallet?.address) {
      const email = (user as Record<string, unknown> | undefined)?.email as string | undefined;
      onConnected(wallet.address, email);
    }
  }, [status, wallet?.address, user, onConnected]);
  return (
    <button onClick={() => login()} className="w-full rounded-md border border-[var(--rule)] p-4 text-left hover:border-[var(--brand)]/50">
      <p className="font-mono text-xs uppercase tracking-wider text-[var(--ink-muted)]">Crossmint</p>
      <p className="mt-1 font-display text-lg">Email login</p>
      <p className="mt-1 text-xs text-[var(--ink-dim)]">Wallet-as-a-service. OTP-gated.</p>
    </button>
  );
}

export function CrossmintCard() {
  const { session, patch } = useDemoSession();
  if (!CROSSMINT_API_KEY) {
    return (
      <button
        onClick={() =>
          session &&
          patch((s) => ({
            ...s,
            wallet: { provider: "crossmint", pubkey: "MOCK22222222222222222222222222222222222222" },
          }))
        }
        className="w-full rounded-md border border-[var(--rule)] p-4 text-left hover:border-[var(--brand)]/50"
      >
        <p className="font-mono text-xs uppercase tracking-wider text-[var(--ink-muted)]">Crossmint · sandbox unset</p>
        <p className="mt-1 font-display text-lg">Email login</p>
        <p className="mt-1 text-xs text-[var(--ink-muted)]">MOCK — set NEXT_PUBLIC_CROSSMINT_API_KEY to enable real SDK.</p>
      </button>
    );
  }
  return (
    <CrossmintProvider apiKey={CROSSMINT_API_KEY}>
      <CrossmintAuthProvider>
        <CrossmintWalletProvider
          createOnLogin={{ chain: "solana", recovery: { type: "email" }, signers: [{ type: "email" }] }}
        >
          <CrossmintInner
            onConnected={(pubkey, email) =>
              session && patch((s) => ({ ...s, wallet: { provider: "crossmint", pubkey, email } }))
            }
          />
        </CrossmintWalletProvider>
      </CrossmintAuthProvider>
    </CrossmintProvider>
  );
}
```

**Step 3:** Implement `lazorkit-card.tsx`. The original plan suggested `try { useWallet() } catch {}` — a hook can't be called from try-catch (rules of hooks), and dynamic-importing inside a click handler also won't work for hooks. Real shape (verified against `@lazorkit/wallet@2.0.1`) is `<LazorkitProvider>` + a child that calls `useWallet()` and triggers `await w.connect()` (returns `WalletInfo` with `smartWallet` as the on-chain pubkey).

**However**, `@lazorkit/wallet@2.0.1` pulls a transitive `@solana/kora → @solana-program/token@0.9.0` chain that requires `@solana/kit@^5`. pnpm intermittently resolves a stale `kit@2.3.0` paired path that breaks webpack. Until the upstream peer is pinned cleanly, the card ships as mock-only with a `TODO(lazorkit-sdk-verify)` note. Real-SDK shape preserved in the file's comment block.

```tsx
"use client";
// TODO(lazorkit-sdk-verify): @lazorkit/wallet@2.0.1 transitive deps require
// @solana/kit ^5; pnpm resolves a paired kit@2.3.0 from elsewhere in the
// workspace, breaking the webpack build. Render mock-only until upstream
// peers are pinned. Real-SDK shape: render <LazorkitProvider>, then a child
// that calls `useWallet()` and reads `info.smartWallet` after `await w.connect()`.
import { useDemoSession } from "../../_lib/use-demo-session";

export function LazorKitCard() {
  const { session, patch } = useDemoSession();
  return (
    <button
      onClick={() =>
        session &&
        patch((s) => ({
          ...s,
          wallet: { provider: "lazorkit", pubkey: "MOCK33333333333333333333333333333333333333" },
        }))
      }
      className="w-full rounded-md border border-[var(--rule)] p-4 text-left hover:border-[var(--brand)]/50"
    >
      <p className="font-mono text-xs uppercase tracking-wider text-[var(--ink-muted)]">LazorKit · sandbox unset</p>
      <p className="mt-1 font-display text-lg">FaceID / passkey</p>
      <p className="mt-1 text-xs text-[var(--ink-muted)]">MOCK — upstream peer-dep mismatch (@solana/kit ^5).</p>
    </button>
  );
}
```

**Step 4:** Implement page `apps/web/src/app/demo/borrow/wallet/page.tsx` (post-fix shape: handle null session before reading `session.wallet`):

```tsx
"use client";
import Link from "next/link";
import { DemoShell } from "../../_components/demo-shell";
import { LiveBadge } from "../../_components/integration-badges";
import { PrivyCard } from "../../_components/wallet-cards/privy-card";
import { CrossmintCard } from "../../_components/wallet-cards/crossmint-card";
import { LazorKitCard } from "../../_components/wallet-cards/lazorkit-card";
import { useDemoSession } from "../../_lib/use-demo-session";

export default function WalletPage() {
  const { session } = useDemoSession();
  if (!session)
    return (
      <DemoShell formFactor="phone">
        <div className="px-6 py-12 text-[var(--ink-muted)]">Loading…</div>
      </DemoShell>
    );
  const connected = !!session.wallet.pubkey;

  return (
    <DemoShell formFactor="phone">
      <div className="px-6 py-8">
        <p className="eyebrow">Step 3 / 14 · Wallet</p>
        <h1 className="display-md mt-3">Pick how you sign in.</h1>
        <p className="mt-3 text-sm text-[var(--ink-dim)]">
          No seed phrase, no extension. Three real Solana-native options.
        </p>

        <div className="mt-6 space-y-3">
          <PrivyCard />
          <CrossmintCard />
          <LazorKitCard />
        </div>

        {connected && (
          <div className="mt-6 rounded-md border border-emerald-500/30 bg-emerald-500/5 p-4">
            <LiveBadge partner={session.wallet.provider!} />
            <p className="mt-2 font-mono text-xs text-[var(--ink-dim)]">
              {session.wallet.pubkey?.slice(0, 8)}…{session.wallet.pubkey?.slice(-4)}
            </p>
          </div>
        )}

        <Link
          href="/demo/borrow/register"
          className={`mt-8 block w-full rounded-md border px-4 py-3 text-center font-mono text-sm uppercase tracking-wider ${
            connected
              ? "border-[var(--brand)] bg-[var(--brand)] text-[var(--bg)]"
              : "border-[var(--rule)] text-[var(--ink-muted)] pointer-events-none"
          }`}
        >
          Next →
        </Link>
      </div>
    </DemoShell>
  );
}
```

**Side effects of Task 1.3 (build dependencies):**
- Workspace `package.json` now has `pnpm.overrides: { "@solana/kit": "^5.0.0" }` to force kit@^5 across the dep graph (Privy + Crossmint + Lazorkit transitive `@solana-program/token@0.9.0` requires `sequentialInstructionPlan`, which only exists in kit ^5).
- `apps/web/next.config.mjs` adds a webpack `resolve.alias` stub: `"@farcaster/mini-app-solana": false` — Privy declares it as an optional peer (`peerDependenciesMeta`) but webpack still tries to import it; the `false` alias makes it a no-op stub.

### Open SDK verifications

- `TODO(crossmint-sdk-verify)` in `apps/web/src/app/demo/_components/wallet-cards/crossmint-card.tsx` — confirm `useCrossmintAuth().login()` does the OTP flow (not just OAuth) when `loginMethods` defaults are in play, and that `useWallet().wallet.address` is the chain-specific pubkey for `chain: "solana"`. Card compiles + renders, but the mock fallback path is the only one currently exercised (since `NEXT_PUBLIC_CROSSMINT_API_KEY` is unset).
- `TODO(lazorkit-sdk-verify)` in `apps/web/src/app/demo/_components/wallet-cards/lazorkit-card.tsx` — re-introduce the real-SDK path once the `@solana/kit ^5` peer-dep chain stops getting paired with kit@2.3.0 (likely needs a deeper `pnpm.overrides` entry or the workspace bumping its own kit usage to v5).

**Step 5:** Build + verify:
```bash
pnpm --filter @vaulx/web build 2>&1 | tail -5
```

**Step 6:** Commit:
```bash
git add apps/web/src/app/demo/borrow/wallet/ apps/web/src/app/demo/_components/wallet-cards/
git commit -m "feat(demo): /demo/borrow/wallet — Privy + Crossmint + LazorKit chooser"
```

---

## Phase 2 — Asset registration + Appraisal (Day 3, Apr 30)

### Task 2.1: `/demo/borrow/register` form

**Files:**
- Create: `apps/web/src/app/demo/borrow/register/page.tsx`

**Step 1:** Implement page (RHF + Zod, mirror existing `/borrow/new/asset` pattern). Key behavior:
- Make/model/ref/year/condition fields
- Up to 3 photo upload via FileReader → data-URL → store in `session.watch.photos`
- "Continue" advances to `/demo/borrow/appraisal`

**Step 2:** Build + commit:
```bash
pnpm --filter @vaulx/web build 2>&1 | tail -3
git add apps/web/src/app/demo/borrow/register/
git commit -m "feat(demo): /demo/borrow/register — watch + photos form"
```

### Task 2.2: `/demo/borrow/appraisal` triangulation reveal

**Files:**
- Create: `apps/web/src/app/demo/borrow/appraisal/page.tsx`

**Step 1:** Page reads `session.watch`, calls `POST /api/appraisal`, animates a sequential reveal: Chrono24 → WatchCharts → Vaulx Model → median (200ms stagger).

**Step 2:** Persist `watch.appraisal` + generate `watch.priceHistory` (24-point random walk from median).

**Step 3:** Build + commit:
```bash
git add apps/web/src/app/demo/borrow/appraisal/
git commit -m "feat(demo): /demo/borrow/appraisal — triangulation reveal + price history seed"
```

---

## Phase 3 — Loan offer + Custody (Day 4, May 1)

### Task 3.1: `<CcbDocument>` with signature pad

**Files:**
- Create: `apps/web/src/app/demo/_components/ccb-document.tsx`
- Test: `apps/web/src/app/demo/_components/__tests__/ccb-document.test.ts`

**Step 1:** Write a test that the signature pad produces a non-empty data-URL on `getSignature()`.

**Step 2:** Implement:
- Use existing `@vaulx/ccb`'s `generateCcbPdf` for the PDF
- Add a `<canvas width=300 height=120>` for signature
- On submit: hash the signature image bytes, append to PDF Keywords metadata, regenerate PDF
- Return `{ pdfBytes, signatureDataUrl, ccbHashHex }`

**Step 3:** Run test, verify pass.

**Step 4:** Commit:
```bash
git add apps/web/src/app/demo/_components/ccb-document.tsx apps/web/src/app/demo/_components/__tests__/
git commit -m "feat(demo): <CcbDocument> — PDF + canvas signature pad"
```

### Task 3.2: `/demo/borrow/loan-offer` page

**Files:**
- Create: `apps/web/src/app/demo/borrow/loan-offer/page.tsx`

**Step 1:** Page:
- LTV slider 10-60%, term radio 30/60/90d, computed rate from `@vaulx/terms::rateForTermDays`
- Embeds `<CcbDocument>`; on submit persists `session.loan` with all fields

**Step 2:** Commit:
```bash
git add apps/web/src/app/demo/borrow/loan-offer/
git commit -m "feat(demo): /demo/borrow/loan-offer — LTV/term/rate + CCB e-sign"
```

### Task 3.3: `/demo/borrow/custody` calendar mock

**Files:**
- Create: `apps/web/src/app/demo/borrow/custody/page.tsx`
- Create: `apps/web/src/app/demo/_fixtures/custodian-slots.ts`

**Step 1:** Fixtures:
```ts
// custodian-slots.ts
export const CUSTODIANS = [
  { id: "brinks", name: "Brinks SP", address: "Av. Paulista 1234, São Paulo" },
  { id: "prosegur", name: "Prosegur SP", address: "R. da Consolação 56, São Paulo" },
  { id: "loomis", name: "Loomis SP", address: "Av. Brigadeiro 789, São Paulo" },
];

export const SLOTS = [
  "Tomorrow 09:00", "Tomorrow 14:30", "Tomorrow 17:00",
  "Day after 10:00", "Day after 15:30",
];
```

**Step 2:** Page: pick custodian + slot → persist `loan.custody.{provider, bookedSlot}` → advance.

**Step 3:** Commit:
```bash
git add apps/web/src/app/demo/borrow/custody/ apps/web/src/app/demo/_fixtures/custodian-slots.ts
git commit -m "feat(demo): /demo/borrow/custody — custodian + slot picker"
```

### Task 3.4: `/demo/borrow/awaiting-custody` with IoT loop

**Files:**
- Create: `apps/web/src/app/demo/borrow/awaiting-custody/page.tsx`
- Asset: `apps/web/public/demo/iot-feed.mp4` (royalty-free 4-sec vault loop, ≤2MB; user provides or scaffold a placeholder)

**Step 1:** Page shows looping muted `<video>` with `📡 LIVE` badge. After 4 seconds (or button), simulates custodian sign → `loan.custody.confirmedAt = Date.now()` → enables "Continue" link to disburse.

**Step 2:** Commit:
```bash
git add apps/web/src/app/demo/borrow/awaiting-custody/ apps/web/public/demo/iot-feed.mp4
git commit -m "feat(demo): /demo/borrow/awaiting-custody — IoT feed loop + sign"
```

---

## Phase 4 — THE AHA MOMENT (Day 5, May 2)

### Task 4.1: `/demo/borrow/disburse` choreography

**Files:**
- Create: `apps/web/src/app/demo/borrow/disburse/page.tsx`

**Step 1:** Implement the refuse-then-accept flow:

```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDemoSession } from "../../_lib/use-demo-session";
import { DemoShell } from "../../_components/demo-shell";

export default function DisbursePage() {
  const { session, patch } = useDemoSession();
  const router = useRouter();
  const [state, setState] = useState<"ready" | "refused" | "custodian-signing" | "custodian-done" | "disbursing" | "done">("ready");
  const custodyConfirmed = !!session.loan?.custody.confirmedAt;

  return (
    <DemoShell formFactor="phone">
      <div className="px-6 py-8">
        <p className="eyebrow">Step 10 / 14 · The aha moment</p>
        <h1 className="display-md mt-3">Release funds.</h1>
        <p className="mt-3 text-sm text-[var(--ink-dim)]">
          Vaulx will refuse until custody is confirmed. Then it will let go.
        </p>

        {state === "refused" && (
          <div className="mt-6 rounded-md border border-rose-500/40 bg-rose-500/10 p-4 text-rose-300 animate-shake">
            <p className="font-mono text-xs uppercase tracking-wider">Contract refused</p>
            <p className="mt-2 text-sm">Error: <span className="font-mono">CustodyNotConfirmed</span></p>
            <button
              onClick={() => setState("custodian-signing")}
              className="mt-4 rounded-md border border-[var(--brand)]/40 bg-[var(--brand)]/10 px-3 py-2 text-xs font-mono uppercase text-[var(--brand)]"
            >
              Custodian: confirm receipt →
            </button>
          </div>
        )}

        {state === "custodian-signing" && (
          <div className="mt-6 rounded-md border border-[var(--brand)]/40 bg-[var(--brand)]/5 p-4">
            <p className="font-mono text-xs uppercase tracking-wider text-[var(--brand)]">Custodian terminal</p>
            <p className="mt-2 text-sm">Watch received and inspected. Signing custody confirmation...</p>
            <button
              onClick={() => {
                patch({ loan: { ...session.loan!, custody: { ...session.loan!.custody, confirmedAt: Date.now() } } });
                setState("custodian-done");
              }}
              className="mt-3 w-full rounded-md border border-[var(--brand)] bg-[var(--brand)] px-3 py-2 text-xs font-mono uppercase text-[var(--bg)]"
            >
              Sign with custodian wallet
            </button>
          </div>
        )}

        {state === "custodian-done" && (
          <div className="mt-6 rounded-md border border-emerald-500/40 bg-emerald-500/5 p-4 text-emerald-300">
            <p className="font-mono text-xs uppercase tracking-wider">✓ custody confirmed on-chain</p>
            <p className="mt-2 text-xs text-[var(--ink-dim)]">Try again now.</p>
          </div>
        )}

        {state === "done" && (
          <div className="mt-6 rounded-md border border-emerald-500/40 bg-emerald-500/5 p-4 text-emerald-300 animate-pulse">
            <p className="font-display text-2xl">✓ {Number(session.loan?.principalAtoms ?? 0n) / 1_000_000} USDC released</p>
            <p className="mt-2 text-xs text-[var(--ink-dim)]">In your Vaulx wallet.</p>
          </div>
        )}

        <button
          disabled={state === "disbursing" || state === "done"}
          onClick={() => {
            if (!custodyConfirmed && state === "ready") {
              setState("refused");
              return;
            }
            setState("disbursing");
            setTimeout(() => {
              patch({ loan: { ...session.loan!, disbursedAt: Date.now(), inAppBalanceAtoms: session.loan!.principalAtoms } });
              setState("done");
            }, 1200);
          }}
          className="mt-8 w-full rounded-md border border-[var(--brand)] bg-[var(--brand)] px-4 py-4 font-display text-lg text-[var(--bg)] disabled:opacity-50"
        >
          {state === "done" ? "Continue →" : state === "disbursing" ? "Disbursing…" : "Release funds"}
        </button>

        {state === "done" && (
          <button
            onClick={() => router.push("/demo/borrow/funds")}
            className="mt-3 w-full rounded-md border border-[var(--rule)] px-4 py-3 font-mono text-xs uppercase text-[var(--ink-dim)]"
          >
            Open Vaulx wallet →
          </button>
        )}
      </div>
    </DemoShell>
  );
}
```

**Step 2:** Add the `animate-shake` keyframes to `apps/web/src/app/globals.css`.

**Step 3:** Commit:
```bash
git add apps/web/src/app/demo/borrow/disburse/ apps/web/src/app/globals.css
git commit -m "feat(demo): /demo/borrow/disburse — refuse-then-accept aha moment"
```

---

## Phase 5 — Funds + Spend rails (Day 6, May 3)

### Task 5.1: `/demo/borrow/funds` hub

**Files:**
- Create: `apps/web/src/app/demo/borrow/funds/page.tsx`

**Step 1:** Page shows in-app USDC balance (mono numerals, big), 3 outflow CTAs:
- "Send to Pix" → `/demo/borrow/funds/pix`
- "Send to wallet" → `/demo/borrow/funds/wallet`
- "Spend on card" → `/demo/borrow/funds/card`

**Step 2:** Commit.

### Task 5.2: `/demo/borrow/funds/pix` mock flow

**Files:**
- Create: `apps/web/src/app/demo/borrow/funds/pix/page.tsx`
- Create: `apps/web/src/app/demo/_fixtures/pix-recipients.ts`

**Step 1:** Fixtures (no personal names — masked accounts only):
```ts
export const PIX_RECIPIENTS = [
  { id: "inter", bank: "Banco Inter", masked: "••••5234" },
  { id: "nubank", bank: "Nubank", masked: "••••8821" },
  { id: "itau", bank: "Itaú", masked: "••••3392" },
];
```

**Step 2:** Page: pick recipient + amount → 2-second spinner → "✓ R$X received at {bank} {masked}" → debits `loan.inAppBalanceAtoms`.

**Step 3:** Add `<MockBadge partner="Privy Pix" />`.

**Step 4:** Commit.

### Task 5.3: `/demo/borrow/funds/wallet` real Devnet send

**Files:**
- Create: `apps/web/src/app/demo/borrow/funds/wallet/page.tsx`

**Step 1:** Form: paste destination Solana pubkey + amount. On submit, real on-chain transfer using `session.wallet.pubkey` to sign. Returns tx signature; toast it with a Solscan link.

**Step 2:** If wallet not connected: link to `/demo/borrow/wallet`.

**Step 3:** Add `<LiveBadge partner="Solana Devnet" />`.

**Step 4:** Commit.

### Task 5.4: `/demo/borrow/funds/card` mock

**Files:**
- Create: `apps/web/src/app/demo/borrow/funds/card/page.tsx`
- Create: `apps/web/src/app/demo/_fixtures/card-tx-feed.ts`

**Step 1:** Fixtures (merchant-keyed, NO personal names):
```ts
export const CARD_TX = [
  { merchant: "Uber", amount: -28.40, ts: "2 min ago" },
  { merchant: "Pão de Açúcar", amount: -142.18, ts: "12 min ago" },
  { merchant: "iFood · Ristorante Capricciosa", amount: -89.50, ts: "1 h ago" },
  { merchant: "Shell Posto Ipiranga", amount: -160.00, ts: "Yesterday" },
  // ...12 total, all merchants only
];
```

**Step 2:** Page: Apple-Pay-styled "Add Vaulx card to Wallet" + transaction feed.

**Step 3:** Add `<MockBadge partner="Solflare Card" />`.

**Step 4:** Commit.

---

## Phase 6 — Dashboard + Repay/Renew (Day 7, May 4)

### Task 6.1: `<LtvGauge>` component

**Files:**
- Create: `apps/web/src/app/demo/_components/ltv-gauge.tsx`
- Test: `apps/web/src/app/demo/_components/__tests__/ltv-gauge.test.tsx`

**Step 1:** Test: gauge renders correct % from props; color zones (safe <60, warn 60-75, danger >75).

**Step 2:** Implement using SVG circular progress. Mono numeral at center.

**Step 3:** Pass + commit.

### Task 6.2: `<RedstoneFeedCard>` sparkline

**Files:**
- Create: `apps/web/src/app/demo/_components/redstone-feed-card.tsx`

**Step 1:** Inline SVG sparkline of `session.watch.priceHistory` (24 points). Last-tick timestamp + 3 source pills (RedStone, Pyth, Chrono24).

**Step 2:** Commit.

### Task 6.3: `<LiveTicker>` synthetic stream

**Files:**
- Create: `apps/web/src/app/demo/_components/live-ticker.tsx`

**Step 1:** 5-second `setInterval` emits events anchored to `session.loan` (interest accrued, ltv recompute). Renders as scrolling marquee.

**Step 2:** Commit.

### Task 6.4: `/demo/borrow/dashboard` page

**Files:**
- Create: `apps/web/src/app/demo/borrow/dashboard/page.tsx`

**Step 1:** Compose: `<LtvGauge>` + `<RedstoneFeedCard>` + IoT video + `<LiveTicker>`. Repay/Renew CTAs at bottom.

**Step 2:** Commit.

### Task 6.5: `/demo/borrow/repay` + `/demo/borrow/renew`

**Files:**
- Create: `apps/web/src/app/demo/borrow/repay/page.tsx`
- Create: `apps/web/src/app/demo/borrow/renew/page.tsx`

**Step 1:** Repay: principal + accrued interest preview → "Pay full" CTA → updates `loan.inAppBalanceAtoms`.

**Step 2:** Renew: term radio (30/60/90), 2% flat fee preview → "Renew" CTA → updates `loan.dueTs` + `loan.rateBps`.

**Step 3:** Commit each separately.

---

## Phase 7 — Lender side (Day 8, May 5)

### Task 7.1: `/demo/lend` operator dashboard

**Files:**
- Create: `apps/web/src/app/demo/lend/page.tsx`
- Create: `apps/web/src/app/demo/_fixtures/kamino-tranches.ts`

**Step 1:** 4 tranche tiles: Inst-USDC, Inst-BRL, Retail-FIDC-USDC, Retail-FIDC-BRL. Each with TVL, APY, current LTV health, "Deposit" CTA.

**Step 2:** Commit.

### Task 7.2: `/demo/lend/onboard` Tokeny ERC-3643 mock

**Files:**
- Create: `apps/web/src/app/demo/lend/onboard/page.tsx`

**Step 1:** Multi-step KYB form for accredited LP onboarding. Fully mocked.

**Step 2:** Commit.

### Task 7.3: `/demo/lend/vaults/[id]` detail

**Files:**
- Create: `apps/web/src/app/demo/lend/vaults/[id]/page.tsx`

**Step 1:** Vault detail: TVL chart, APY history, current LTV health gauge, deposit form (mock submit).

**Step 2:** Commit.

### Task 7.4: `/demo/lend/liquidity` routing visualization

**Files:**
- Create: `apps/web/src/app/demo/lend/liquidity/page.tsx`

**Step 1:** Adapt the visualization from `vaulx-liquidity-architecture.html` into a React component. Hover any node → tooltip with role + status.

**Step 2:** Commit.

---

## Phase 8 — Auction + Landing + Tour (Day 9, May 6)

### Task 8.1: `<AuctionTierTimeline>` component

**Files:**
- Create: `apps/web/src/app/demo/_components/auction-tier-timeline.tsx`
- Test: `apps/web/src/app/demo/_components/__tests__/auction-tier-timeline.test.tsx`

**Step 1:** Test: renders 3 tiers; active tier has brass left-rule; countdown displays.

**Step 2:** Implement. Animated tier transition.

**Step 3:** Commit.

### Task 8.2: `/demo/auction` floor

**Files:**
- Create: `apps/web/src/app/demo/auction/page.tsx`
- Create: `apps/web/src/app/demo/_fixtures/auction-bids.ts` (pseudonymized bidders only — `vaulx-lender-04` etc.)

**Step 1:** List of ≥3 mock auctions with watch / appraisal / outstanding loan / current tier / countdown / high bid.

**Step 2:** Commit.

### Task 8.3: `/demo/auction/[trdc]` detail

**Files:**
- Create: `apps/web/src/app/demo/auction/[trdc]/page.tsx`

**Step 1:** Full waterfall: `<AuctionTierTimeline>` + 3 editorial copy blocks + live bid feed (replays auction-bids fixtures over 60s) + bid form.

**Step 2:** Commit.

### Task 8.4: `/demo/architecture` page

**Files:**
- Create: `apps/web/src/app/demo/architecture/page.tsx`

**Step 1:** Adapt `VAULX_Architecture_Interactive.html` into a React page. Hover-per-partner tooltips with role + status (LIVE / SDK SANDBOX / MOCK / GOV-GATED).

**Step 2:** Commit.

### Task 8.5: `/demo` landing (final)

**Files:**
- Modify: `apps/web/src/app/demo/page.tsx`

**Step 1:** Replace placeholder with full hero: tagline, two big CTAs (Borrow journey, Lend dashboard), embedded architecture diagram, "Start guided tour" button.

**Step 2:** Commit.

### Task 8.6: driver.js guided tour

**Files:**
- Install: `pnpm --filter @vaulx/web add driver.js`
- Create: `apps/web/src/app/demo/_components/guided-tour.tsx`
- Create: `apps/web/src/app/demo/_lib/tour-steps.ts`

**Step 1:** `tour-steps.ts` — array of 14 step definitions with `route` + `selector` + `headline` + `caption`.

**Step 2:** `<GuidedTour>` — listens to `session.tour.active`, mounts driver.js with the current step's config, persists `step` on `next`/`prev`. Step 10 explicitly pauses (no auto-advance).

**Step 3:** Mount `<GuidedTour>` inside `<DemoShell>`.

**Step 4:** Commit.

---

## Phase 9 — Polish, video, README (Days 10-12, May 7-9)

### Task 9.1: Walkthrough acceptance pass

Use `superpowers:verification-before-completion`. Run all 10 walkthrough criteria from §8 of design doc. Fix any failures.

### Task 9.2: Empty / loading / error state pass

Each route has a graceful: empty (no session yet), loading (spinner), error (toast + link to reset).

### Task 9.3: README screenshots from live URL

Capture clean screenshots from `vaulx.vercel.app/demo/*`. Embed in README's "Live demo" section.

### Task 9.4: Final code review

Use `superpowers:requesting-code-review` on the full `/demo` increment.

### Task 9.5: Tag `mock-app-v1`

```bash
git tag mock-app-v1
git push --tags
```

---

## Verification before any task is "done"

Before marking any task complete, the implementer (or subagent) must:

1. Run the build: `pnpm --filter @vaulx/web build` — must be green.
2. Run typecheck: `pnpm -w typecheck` — must be green.
3. Run any tests added: `pnpm --filter @vaulx/web test -- <file>` — must pass.
4. **Manually open the new route in dev** (or screenshot via playwright) — must render without console errors.
5. CI grep for personal names in `apps/web/src/app/demo/` — must return 0 hits.

See `superpowers:verification-before-completion` for the discipline.

---

## Plan complete

Plan saved to `docs/plans/2026-04-28-vaulx-mock-app-implementation-plan.md`. Two execution options:

1. **Subagent-Driven (this session)** — I dispatch fresh subagent per task, review between tasks, fast iteration. ~9 working days, runs concurrently with Felipe/Marcelo's partnership outreach.

2. **Parallel Session (separate)** — Open new session with `superpowers:executing-plans`, batch execution with checkpoints.

**Which approach?**
