# Vaulx Mock App Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` to implement this plan task-by-task.

**Goal:** Build the Vaulx mock app at `vaulx.vercel.app/demo/*` — full borrower flow (mobile bezel) + lender flow (desktop) + 3-tier auction waterfall + landing + interactive architecture diagram + 14-step guided tour. β+ scope per the design doc.

**Architecture:** New routes under `apps/web/src/app/demo/*`, embedded in the existing Next.js 14 app, sharing the editorial dark-operator design system. State persists in `sessionStorage` keyed by a session UUID. Real SDK integrations (Crossmint, Civic CAPTCHA, WatchCharts, Chrono24, Devnet wallet send); mock UIs for everything that requires commercial agreements (Pix off-ramp, Solflare card, Kamino, Plume, Tokeny, gov.br, Brinks IoT). All mocks ribbon-tagged `MOCK · partnership in progress`.

**Tech Stack:** Next.js 14 App Router · Tailwind · shadcn/ui · `@crossmint/client-sdk-react-ui` · `driver.js` · `@vaulx/ccb` (existing PDF generator) · existing `/api/appraisal` (Chrono24 + WatchCharts + internal model).

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
    provider?: "crossmint";
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

**Step 2:** Implement page (post-fix `useDemoSession` shape: `session: DemoSession | null` + functional `patch((s) => ...)` updater). The gov.br button deep-links to a demo-specific gov.br flow at `/demo/borrow/verify-id` (Task 1.1.b below) which writes directly to `session.govbr` — no localStorage bridge from the production `/borrow/verify-id` route, because that route requires a connected Solana wallet pubkey at the time of writing the verification (and Step 1 happens before Step 3 wallet connect):

```tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { DemoShell } from "../../_components/demo-shell";
import { LiveBadge, MockBadge } from "../../_components/integration-badges";
import { useDemoSession } from "../../_lib/use-demo-session";

export default function OnboardPage() {
  const { session, patch } = useDemoSession();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (session?.civic.verifiedAt) return;
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [session?.civic.verifiedAt]);

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
          href={`/demo/borrow/verify-id?return_to=/demo/borrow/onboard`}
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

### Task 1.1.b: demo-specific gov.br flow at `/demo/borrow/verify-id` (4 pages)

**Why:** the production gov.br pages at `/borrow/verify-id` require a connected Solana wallet adapter pubkey to write the verification (`setGovbrVerification(wallet, …)` keys localStorage by pubkey). At demo Step 1, no wallet is connected yet (wallet is Step 3 of the demo). Bridging the production flow into demo would strand users when the production page bails with "Connect wallet". Solution: duplicate the 4-page gov.br mock under the demo namespace, with two key differences vs production — reads/writes session via `useDemoSession()` + `patch()` instead of the production `useGovbrVerification` hook, and never requires a connected wallet (the demo session itself is the identity scope).

**Files to create:**
- `apps/web/src/app/demo/borrow/verify-id/page.tsx` — entry "Verify your Brazilian identity"
- `apps/web/src/app/demo/borrow/verify-id/redirecting/page.tsx` — 1s spinner
- `apps/web/src/app/demo/borrow/verify-id/govbr-login/page.tsx` — CPF mask + auth spinner; on submit calls `patch((s) => ({ ...s, govbr: { cpf, name, verifiedAt } }))`
- `apps/web/src/app/demo/borrow/verify-id/callback/page.tsx` — success card; reads `session.govbr`; "Return" button → `return_to` (default `/demo/borrow/onboard`)
- `apps/web/src/app/demo/borrow/verify-id/_demo-govbr-chrome.tsx` — phone-bezel-friendly version of the production `<GovbrChrome>` (gov.br blue header + demo badge + footer, but `min-h-full` instead of `min-h-screen` so it fits inside the demo phone viewport)

Each page is wrapped in `<DemoShell formFactor="phone">`. The CPF validator + `mockNameForCpf` helpers from `@/lib/govbr/cpf` and `@/lib/govbr/names` are reused; the production `mock-storage.ts` hook is **not** used.

**Commit:**
```bash
git add apps/web/src/app/demo/borrow/verify-id/ apps/web/src/app/demo/borrow/onboard/
git commit -m "fix(demo): demo-specific gov.br flow under /demo/borrow/verify-id (resolves wallet-key mismatch)"
```

### Task 1.2: Install Crossmint SDK

**Step 1:** Install:
```bash
pnpm --filter @vaulx/web add @crossmint/client-sdk-react-ui
```

**Step 2:** Get sandbox API key (assume user provides; otherwise fall back to mock UI):
- Crossmint: crossmint.com/console → API keys → "Client API key (Production-Server)"

**Step 3:** Add to Vercel env vars (production + preview) via CLI:
```bash
TOKEN=$(grep -i vercel_token .env | cut -d= -f2)
SCOPE=team_xxnjJw6BsmOjrWZhABWgity1
echo -n "<crossmint-key>" | vercel env add NEXT_PUBLIC_CROSSMINT_API_KEY production --token=$TOKEN --scope=$SCOPE --force
```

(If user hasn't provided the key, leave env unset; the SDK provider component falls back to a mock placeholder card with a `<MockBadge partner="Crossmint" />` ribbon.)

**Step 4:** Add to `.env.example` + local `.env.local`:
```
NEXT_PUBLIC_CROSSMINT_API_KEY=
```

**Step 5:** Commit:
```bash
git add apps/web/package.json apps/web/.env.example pnpm-lock.yaml
git commit -m "chore(demo): add Crossmint SDK"
```

### Task 1.3: `/demo/borrow/wallet` with single-CTA Crossmint wallet

**Files:**
- Create: `apps/web/src/app/demo/borrow/wallet/page.tsx`
- Create: `apps/web/src/app/demo/_components/crossmint-wallet.tsx`

**Step 1:** Implement `crossmint-wallet.tsx`. Verified against `@crossmint/client-sdk-react-ui@4.1.5`:
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
import { useDemoSession } from "../_lib/use-demo-session";
import { MockBadge } from "./integration-badges";

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
      <p className="mt-1 font-display text-lg">Sign in with Google · Apple · Email</p>
      <p className="mt-1 text-xs text-[var(--ink-dim)]">Solana smart wallet provisioned. Passkey-ready.</p>
    </button>
  );
}

export function CrossmintWallet() {
  const { session, patch } = useDemoSession();
  if (!CROSSMINT_API_KEY) {
    return (
      <>
        <button
          onClick={() =>
            session &&
            patch((s) => ({
              ...s,
              wallet: { provider: "crossmint", pubkey: "MOCK22222222222222222222222222222222222222", email: "demo@vaulx.app" },
            }))
          }
          className="w-full rounded-md border border-[var(--rule)] p-4 text-left hover:border-[var(--brand)]/50"
        >
          <p className="font-mono text-xs uppercase tracking-wider text-[var(--ink-muted)]">Crossmint · sandbox unset</p>
          <p className="mt-1 font-display text-lg">Sign in with Google · MOCK</p>
          <p className="mt-1 text-xs text-[var(--ink-muted)]">Set NEXT_PUBLIC_CROSSMINT_API_KEY to enable real SDK.</p>
        </button>
        <MockBadge partner="Crossmint" />
      </>
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

**Step 2:** Implement page `apps/web/src/app/demo/borrow/wallet/page.tsx`. Single CTA, single component — no chooser, no fallback paths to choose between wallets. Civic Pass already gated this user upstream; Crossmint provisions a Solana smart wallet on a single click.

```tsx
"use client";
import Link from "next/link";
import { DemoShell } from "../../_components/demo-shell";
import { LiveBadge } from "../../_components/integration-badges";
import { CrossmintWallet } from "../../_components/crossmint-wallet";
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
        <h1 className="display-md mt-3">Sign in once. Solana smart wallet provisioned.</h1>
        <p className="mt-3 text-sm text-[var(--ink-dim)]">
          Email, Google, or Apple. No seed phrase, no extension. Your wallet
          is a Solana program-derived address — Vaulx and the borrower share
          the keys, neither side controls alone.
        </p>

        <div className="mt-6">
          <CrossmintWallet />
        </div>

        {connected && (
          <div className="mt-6 rounded-md border border-emerald-500/30 bg-emerald-500/5 p-4">
            <LiveBadge partner="Crossmint" />
            <p className="mt-2 font-mono text-xs text-[var(--ink-dim)]">
              {session.wallet.pubkey?.slice(0, 8)}…{session.wallet.pubkey?.slice(-4)}
            </p>
            {session.wallet.email && (
              <p className="mt-1 font-mono text-xs text-[var(--ink-muted)]">{session.wallet.email}</p>
            )}
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

### Open SDK + integration verifications

- `TODO(crossmint-sdk-verify)` in `apps/web/src/app/demo/_components/crossmint-wallet.tsx` — confirm `useCrossmintAuth().login()` triggers the right flow (Google / Apple / Email vs OTP-only) when `loginMethods` defaults are in play, and that `useWallet().wallet.address` is the chain-specific pubkey for `chain: "solana"`.
- `TODO(crossmint-program-audit)` — run `solana program show <PROGRAM_ID>` on Crossmint's smart-wallet program and check upgrade authority; if upgradeable, confirm Squads V4 multisig + timelock governance before mainnet.
- `TODO(crossmint-kyc-fields)` — confirm Brazilian field mapping (CPF, RG, CNH, employment, source of funds) with the Crossmint solutions team. Verify gov.br ouro output covers the Create User schema.
- `TODO(crossmint-civic-pass-acceptance)` — confirm Civic Pass gateway token (or signed attestation from our KYC pipeline) satisfies Crossmint's Full KYC liveness gate; otherwise we run a duplicate liveness flow.
- `TODO(crossmint-region-jwt)` — gov.br / Aadhaar / Singpass / UAE Pass aren't pre-built Crossmint OIDC providers. Each region needs a custom-token JWT bridge. Confirm pricing + schema per region.

**Step 3:** Build + verify:
```bash
pnpm --filter @vaulx/web build 2>&1 | tail -5
```

**Step 4:** Commit:
```bash
git add apps/web/src/app/demo/borrow/wallet/ apps/web/src/app/demo/_components/crossmint-wallet.tsx
git commit -m "feat(demo): single-CTA Crossmint wallet (Civic + Crossmint as the auth duo)"
```

---

## Phase 2 — Asset registration + Appraisal (Day 3, Apr 30)

### Task 2.1: `/demo/borrow/register` form

**Files:**
- Create: `apps/web/src/app/demo/borrow/register/page.tsx`

**Step 1:** Implement page (RHF + Zod, mirror existing `/borrow/new/asset` pattern). Key behavior:
- Make (select w/ presets + "Other" → free-text) / model / ref / year (1950..now) / condition (radio: mint/excellent/very_good/good)
- 3-slot photo upload via `FileReader.readAsDataURL` → store data URLs in `session.watch.photos`
- Read/write session via the post-fix `useDemoSession()` shape: `const { session, patch } = useDemoSession()` where `session: DemoSession | null` and `patch((prev) => DemoSession)` is a functional updater
- On submit: `patch` watch info into session, then `router.push("/demo/borrow/appraisal/" + crypto.randomUUID())`
- Wrap in `<DemoShell formFactor="phone">`; eyebrow "Step 5 / 14 · Asset" + "Register your watch."

**Step 2:** Build + commit:
```bash
pnpm --filter @vaulx/web build 2>&1 | tail -3
git add apps/web/src/app/demo/borrow/register/
git commit -m "feat(demo): /demo/borrow/register — watch form + 3-photo upload"
```

### Task 2.2: `/demo/borrow/appraisal/[reqId]` triangulation reveal

**Files:**
- Create: `apps/web/src/app/demo/borrow/appraisal/[reqId]/page.tsx`

**Step 1:** Page reads `session.watch` via `useDemoSession()` (redirect to `/demo/borrow/register` if missing), calls `POST /api/appraisal` with `{make, model, ref, year, condition}`, animates a sequential reveal: Chrono24 (t=0) → WatchCharts (t=200ms) → Vaulx Model (t=400ms) → median card with scale-bump (t=700ms). Each source card shows source name, mono-formatted value, status pill (`LIVE` / `FALLBACK` / `ERROR`).

**Step 2:** Persist via `patch`:
- `session.watch.appraisal = { chrono24, watchcharts, internal, median }` (numbers only — pull `.value` off each `SourceResult`, falling back to median if a source failed)
- `session.watch.priceHistory` = 24-point random walk seeded from `session.sessionId` (deterministic mulberry32 PRNG so refreshes are stable). Walk parameters: ±2% per hour, clamped to ±8% over 24h. First element = median.

```ts
function priceHistoryFrom(median: number, sessionId: string): number[] {
  let seed = 0;
  for (let i = 0; i < sessionId.length; i++) {
    seed = (seed * 31 + sessionId.charCodeAt(i)) >>> 0;
  }
  const rand = () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const points: number[] = [median];
  let lastFactor = 1;
  for (let i = 1; i < 24; i++) {
    const step = (rand() - 0.5) * 0.04;            // ±2% step
    let nextFactor = lastFactor + step;
    nextFactor = Math.max(0.92, Math.min(1.08, nextFactor)); // clamp ±8%
    points.push(Math.round(median * nextFactor));
    lastFactor = nextFactor;
  }
  return points;
}
```

**Step 3:** "Continue with this appraisal" routes to `/demo/borrow/loan-offer/<reqId>` — note this route does not exist until Phase 3 Task 3.2 builds it. Until then the link 404s; that's acceptable. "Start over" routes back to `/demo/borrow/register`. Eyebrow "Step 6 / 14 · Appraisal" + "Three sources. One number."

**Step 4:** Build + commit:
```bash
pnpm --filter @vaulx/web build 2>&1 | tail -3
git add apps/web/src/app/demo/borrow/appraisal/
git commit -m "feat(demo): /demo/borrow/appraisal/[reqId] — triangulation reveal + 24h price history seed"
```

---

## Phase 3 — Loan offer + Custody (Day 4, May 1) — SHIPPED

### Task 3.1: `<CcbDocument>` with signature pad ✅

**Files:**
- Created: `apps/web/src/app/demo/_components/ccb-document.tsx`

**As shipped:** stylized HTML document card (NOT inline PDF preview) showing borrower / asset / terms / live SHA-256, an inline `<canvas width=300 height=120>` signature pad driven by `pointer*` events (mouse + touch), and a "Sign and continue" button that returns:

```ts
type SignedResult = {
  pdfBytes: Uint8Array;
  signatureDataUrl: string;  // canvas.toDataURL("image/png")
  ccbHashHex: string;        // hashCcb(pdfBytes).hex
};
```

PDF is generated via `generateCcbPdf` from `@vaulx/ccb`; preview hash is computed on every `ccb` change so the user can see the digest update as they tweak terms. No appended-keywords step beyond what `@vaulx/ccb` already does.

```bash
git commit -m "feat(demo): <CcbDocument> — PDF + canvas signature pad"
```

### Task 3.2: `/demo/borrow/loan-offer/[reqId]` page ✅

**Files:**
- Created: `apps/web/src/app/demo/borrow/loan-offer/[reqId]/page.tsx`

**As shipped:** dynamic route (matches the `[reqId]` produced by the appraisal page). Reads `session.watch.appraisal.median`; redirects to `/demo/borrow/register` if missing. LTV slider 10–60% (default 50), term radios 30/60/90d, rate via `rateForTermDays(termDays)`. Editorial 5/7 grid: terms form left, `<CcbDocument>` right.

`CcbInput` is built with `BigInt(...)` for atom fields. `issuedAtTs` is captured once per page mount so the preview hash matches the signed-PDF hash. On `onSigned` we persist:

```ts
patch((s) => ({
  ...s,
  loan: {
    loanId: crypto.randomUUID(),
    principalAtoms: loanAmountAtoms.toString(),
    rateBps, termDays, dueTs,
    ccbHashHex, signatureDataUrl,
    custody: { provider: "brinks" }, // overwritten on next page
    inAppBalanceAtoms: "0",
  },
}));
router.push("/demo/borrow/custody");
```

```bash
git commit -m "feat(demo): /demo/borrow/loan-offer/[reqId] — LTV/term/rate + CCB e-sign"
```

### Task 3.3: `/demo/borrow/custody` calendar mock ✅

**Files:**
- Created: `apps/web/src/app/demo/borrow/custody/page.tsx`
- Created: `apps/web/src/app/demo/_fixtures/custodian-slots.ts`

**Fixtures (as shipped):**
```ts
export const CUSTODIANS = [
  { id: "brinks",   name: "Brinks",   city: "São Paulo", blurb: "Class III vault · armored transit · 24/7 IoT." },
  { id: "prosegur", name: "Prosegur", city: "São Paulo", blurb: "Tier-1 logistics · biometric vault access." },
  { id: "loomis",   name: "Loomis",   city: "São Paulo", blurb: "Insured high-value transit · CCTV mirror feed." },
];
export const SLOTS = [
  "Tomorrow · 09:00", "Tomorrow · 11:30", "Tomorrow · 14:30",
  "Tomorrow · 16:00", "Day after · 10:00",
];
```

Two-step picker (custodian tile → slot grid). On submit: persists `loan.custody.{provider, bookedSlot}` and pushes to `/demo/borrow/awaiting-custody/<crypto.randomUUID()>` (the placeholder TRDC PDA).

```bash
git commit -m "feat(demo): /demo/borrow/custody — custodian + slot picker"
```

### Task 3.4: `/demo/borrow/awaiting-custody/[trdc]` with IoT placeholder ✅

**Files:**
- Created: `apps/web/src/app/demo/borrow/awaiting-custody/[trdc]/page.tsx`
- Created: `apps/web/public/demo/iot-feed-placeholder.svg` (animated SVG vault interior with scanline + watch silhouette)

**Deviation from original plan:** real `iot-feed.mp4` was not available, so we ship an animated SVG placeholder instead. USER_TODO has an item to swap in a 4-second royalty-free vault video at `apps/web/public/demo/iot-feed.mp4` later.

**Auto-progression timing (3 stages, total ~3s):**
- 0ms — `inspecting` ("Custodian inspecting…")
- 1500ms — `signing` ("Custodian signing…")
- 3000ms — `confirmed` ("Custody confirmed") → persists `loan.custody.confirmedAt = Date.now()`

User can also click "Skip wait" to jump to `confirmed`. On confirm, the CTA flips to a "Continue → Disburse" link pointing at `/demo/borrow/disburse` (Phase 4 Task 4.1, doesn't exist yet — link 404s until that lands).

```bash
git commit -m "feat(demo): /demo/borrow/awaiting-custody/[trdc] — IoT feed placeholder + auto custody flip"
```

---

## Phase 4 — THE AHA MOMENT (Day 5, May 2)

### Task 4.1: `/demo/borrow/disburse` choreography — DONE (2026-04-24)

**Files:**
- Create: `apps/web/src/app/demo/borrow/disburse/page.tsx` ✓
- Edit: `apps/web/src/app/globals.css` (added `@keyframes shake` + `.animate-shake` + reduced-motion guard) ✓

**Implementation note (deviation from sketch):** the page uses a 6-state local
state machine (`ready | refused | custodian-signing | custodian-signed |
disbursing | done`) and **ignores `session.loan.custody.confirmedAt` until
the user walks through the choreography**. Even though Phase 3's
`awaiting-custody` already populated `confirmedAt`, the disburse page treats
its own state as the source of truth so the AHA refusal always lands on first
tap. Session is patched in parallel (custody.confirmedAt at custodian-sign,
disbursedAt + inAppBalanceAtoms at done) for downstream pages (dashboard,
funds). This is the "cleaner, internal-state-machine" branch from the design
brief — no sneaky un-confirm on mount.

The "Wake the custodian" CTA inside the refused panel advances to the
`custodian-signing` step (a brass-bordered "Custodian terminal — Brinks SP"
panel). Shake animation is keyed off `key={state}` so it retriggers on
re-entry. Confetti was substituted with a green panel using the existing
`vxReveal` animation — keeps the visual language consistent with the rest of
the demo and avoids pulling in a new animation lib.

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

## Phase 5 — Funds + Spend rails (Day 6, May 3) — SHIPPED

### Task 5.1: `/demo/borrow/funds` hub — DONE

**Files shipped:**
- `apps/web/src/app/demo/borrow/funds/page.tsx`

Eyebrow `STEP 11 / 14 · FUNDS`, heading "Your funds. Three ways out.", balance card reads `session.loan.inAppBalanceAtoms` (atoms → USDC formatted), three outflow CTAs (Pix, Solana wallet, Vaulx card). Redirects to `/demo/borrow/disburse` if `loan.disbursedAt` is missing.

### Task 5.2: `/demo/borrow/funds/pix` mock flow — DONE

**Files shipped:**
- `apps/web/src/app/demo/borrow/funds/pix/page.tsx`
- `apps/web/src/app/demo/_fixtures/pix-recipients.ts`

Fixtures expose `PIX_RECIPIENTS` (Banco Inter, Nubank, Itaú — masked accounts only) and a locked `USDC_BRL_RATE = 5.05`. State machine: `idle` → `submitting` (2s) → `done`. On `done`, decrements `loan.inAppBalanceAtoms` by the sent USDC atoms and links back to `/demo/borrow/funds`. `<MockBadge partner="Pix Off-Ramp" />` ribbon. Eyebrow `STEP 12 / 14 · PIX OFF-RAMP`.

### Task 5.3: `/demo/borrow/funds/wallet` real Devnet send — DONE (with deployed-host fallback)

**Files shipped:**
- `apps/web/src/app/demo/borrow/funds/wallet/page.tsx`
- `apps/web/src/app/api/demo/devnet-send/route.ts`

**Architecture deviation from original spec:** Crossmint holds the user's secret key, so the browser cannot sign. Instead the page POSTs to a Node-runtime API route that loads the project's payer keypair from `~/.config/solana/id.json` and signs a real `SystemProgram.transfer` (0.001 SOL) on Devnet via the Helius RPC. Returns `{ ok, signature }` rendered as a Solscan-Devnet link.

**Deployed-host fallback:** when the keypair is absent on disk (e.g. Vercel), the route returns 503 with `{ kind: "payer-unavailable", reason }`. The page renders a friendly "Local demo only" info card instead of an error. `<LiveBadge partner="Solana Devnet" />` is displayed regardless.

### Task 5.4: `/demo/borrow/funds/card` mock — DONE

**Files shipped:**
- `apps/web/src/app/demo/borrow/funds/card/page.tsx`
- `apps/web/src/app/demo/_fixtures/card-tx-feed.ts`

Fixture: 12 merchant-only transactions (Uber, Pão de Açúcar, iFood, Shell, Spotify, Apple Music, Mercado Livre, Amazon, Netflix, Posto Shell Av. Paulista, Drogaria São Paulo, Restaurante Fasano). Page: Vaulx debit card art + "Add Vaulx Card to Wallet" CTA (toast: "Mock — Solflare card pending issuer agreement") + recent-tx list in BRL mono. `<MockBadge partner="Solflare Card" />` ribbon. Eyebrow `STEP 11 / 14 · CARD` (no separate tour step — card is reachable from funds).

---

## Phase 6 — Dashboard + Repay/Renew (Day 7, May 4)

### Task 6.1: `<LtvGauge>` component — DONE

**Files shipped:**
- `apps/web/src/app/demo/_components/ltv-gauge.tsx`
- `apps/web/src/app/demo/_components/__tests__/ltv-gauge.test.tsx`
- `apps/web/vitest.config.ts` — extended include glob to `*.test.tsx` + esbuild `jsx: "automatic"` so React component tests work without a dedicated plugin.

200×200 SVG gauge. Computes LTV via BigInt: `Number((loanAmountAtoms * 10000n) / collateralValueAtoms) / 100`. Zero-collateral falls through to 0 without dividing. Three zones — safe <60% (`var(--brand)`), warn 60–75% (amber-400), danger ≥75% (rose-400) — exposed via `data-zone` for DOM tests. Five vitest cases cover the percentage render, all three zones, and the zero-collateral path.

### Task 6.2: `<RedstoneFeedCard>` sparkline — DONE

**Files shipped:**
- `apps/web/src/app/demo/_components/redstone-feed-card.tsx`

200×60 inline SVG of `priceHistory` (24 points). Brass stroke + linear-gradient fill at 25%→0% under the curve. Three source pills above (RedStone, Pyth, Chrono24). Right-aligned `$<last>` mono numeral + 24h % delta (brass when up, rose when down). Footer caption: "RedStone-wrapped Chrono24 · 60s tick · simulated demo". Zero re-implementation: `<LtvGauge>` and this card consume the same `session.watch.priceHistory`, so the gauge ticks in lockstep with the sparkline.

### Task 6.3: `<LiveTicker>` synthetic stream — DONE

**Files shipped:**
- `apps/web/src/app/demo/_components/live-ticker.tsx`

`setInterval(5_000)` emits round-robin `interest_accrued` / `ltv_recompute` / `price_tick` events anchored to `session.loan` + `session.watch.priceHistory`. Interest line uses `computeInterestAccrued(principal, rateBps, 1) / 24n` for a believable per-hour trickle. Reuses the existing `.vx-marquee` / `.vx-marquee-track` classes (defined in `globals.css`) so it pauses on hover and respects `prefers-reduced-motion`. Brass pulse dot at the start indicates live.

### Task 6.4: `/demo/borrow/dashboard` page — DONE

**Files shipped:**
- `apps/web/src/app/demo/borrow/dashboard/page.tsx`

Composition (phone bezel, single column): eyebrow `STEP 13 / 14 · DASHBOARD` + heading "Your loan, live." → centered `<LtvGauge>` → loan summary card (principal, accrued interest via `computeInterestAccrued` with `createdAtSec = dueTs - termDays*86400`, rate · term, days to due) → `<RedstoneFeedCard>` → IoT placeholder (`/demo/iot-feed-placeholder.svg` via `next/image`) with `📡 LIVE · Brinks SP · Vault A-32` brass pill → `<LiveTicker>` → two-column CTA grid (Repay full / Renew loan). Redirects to `/demo/borrow/disburse` if `loan.disbursedAt` is missing. Tour-step 13 of 14.

### Task 6.5: `/demo/borrow/repay` + `/demo/borrow/renew` — DONE

**Files shipped:**
- `apps/web/src/app/demo/borrow/repay/page.tsx`
- `apps/web/src/app/demo/borrow/renew/page.tsx`

**Repay (final tour step, 14/14):** Reads `session.loan` (redirects on missing). Breakdown rows = principal, interest (`X days at Y% APR`), total payoff (computed via `computePayoff`). Single brass CTA → 1.5s spinner ("Settling on-chain…") → emerald confirmation. On done, patches `inAppBalanceAtoms` (clamped at 0n if the in-app balance is below payoff) and bumps `tour.step` to 14. "Back to dashboard" link.

**Renew:** Reads `session.loan` (redirects on missing). Term radio 30/60/90 with brass-highlighted selection. Preview shows new due date (`renewAtSec + termDays*86400`), new rate (`rateForTermDays`), and 2% flat renewal fee (`computeRenewalFee`). Single CTA → 1.5s spinner → emerald confirmation. On done, patches `loan.termDays`, `loan.rateBps`, `loan.dueTs`, and decrements `inAppBalanceAtoms` by the fee (clamped at 0n).

Both wrapped in `<DemoShell formFactor="phone">`. Editorial pattern (eyebrow + display heading + body + CTA). All math goes through `@vaulx/terms` — no re-implementation.

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

### Task 7.4: `/demo/lend/liquidity` — 3-tier liquidity stack visualization

**Files:**
- Create: `apps/web/src/app/demo/lend/liquidity/page.tsx`

**Framing (drop the old "Kamino + Plume side-by-side" treatment):** Render a 3-tier liquidity stack that puts anchor capital relationships in the foreground and infrastructure rails in the background.

**Caption at top of page:**
> "$5–10M target launch TVL — closed manually via 2-3 anchor relationships. Kamino V2 + Plume Nest = infrastructure rails, not capital sources."

**Tier 1 (foreground — 3 anchor capital relationship tiles, large, P1 status):**
- Re7 Labs — vault curator (accessed via Kamino V2)
- MEV Capital — vault curator (accessed via Kamino V2)
- Mercado Bitcoin OR Transfero — BR institutional anchor lender

**Tier 2 (middle — 1 tile, P1):**
- Crypto-native credit facility (TBD specific name)

**Tier 3 (background — INFRASTRUCTURE substrate, smaller tiles, dashed connection lines linking back to Tier 1 curators):**
- Kamino V2 — curator marketplace where Re7 + MEV deploy capital
- Plume Nest — later-stage institutional issuance, post-launch

**Tier 3 caption beneath the tiles:**
> "Kamino V2 — curator marketplace where Re7 + MEV deploy capital. Plume Nest — later-stage institutional issuance, post-launch."

**Step 1:** Build the 3-tier layout described above. Hover any node → tooltip with role + status (P1 / P2 / infrastructure). Re7 + MEV tiles include a small "via Kamino V2" subscript with a dashed line drawn to the Kamino V2 substrate tile in Tier 3.

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

**Source adaptation note:** When adapting `vaulx-liquidity-architecture.md` (and `VAULX_Architecture_Interactive.html`) into the React component, the source files have legacy "Garanti.fi" branding throughout. **Strip every Garanti.fi reference during the adaptation and use Vaulx exclusively.** No "Garanti.fi" string should reach the rendered React output.

**Step 1:** Adapt `VAULX_Architecture_Interactive.html` into a React page. Hover-per-partner tooltips with role + status (LIVE / SDK SANDBOX / MOCK / GOV-GATED).

**Step 2:** Commit.

### Task 8.5: `/demo` landing (final)

**Files:**
- Modify: `apps/web/src/app/demo/page.tsx`

**Copy directives:**
- Where the value-prop framing previously contrasted Vaulx against "Caixa" — replace with the generic **"TradFi"** wording (e.g., "vs TradFi pawn lenders", "TradFi incumbents (state-bank monopoly in BR)").
- Where any "Garanti.fi" string appears — kill it. Vaulx everywhere.

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
