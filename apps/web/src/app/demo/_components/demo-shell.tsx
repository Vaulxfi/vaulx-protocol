"use client";
// Adaptive responsive shell — no iPhone bezel. Both `formFactor` values
// render full-width on mobile and a centered column on desktop. The
// borrower flow uses a narrower column (`max-w-[640px]`) so the
// portrait-shaped content doesn't sprawl across a wide screen; the
// lender / auction surfaces use the wider `max-w-[1280px]` for tables
// and grids.
//
// The `formFactor` prop is retained on every page that mounts <DemoShell>
// because the borrower-side pages also mount <DemoFooterNav> (4-tab
// bottom nav). Lender / auction pages don't.
import type { ReactNode } from "react";
import type { DemoFormFactor } from "../_lib/types";
import { DemoTopBar } from "./demo-top-bar";
import { DemoFooterNav } from "./demo-footer-nav";

export function DemoShell({
  children,
  formFactor,
}: {
  children: ReactNode;
  formFactor: DemoFormFactor;
}) {
  if (formFactor === "phone") {
    return (
      <>
        <DemoTopBar />
        <main className="mx-auto w-full max-w-[640px] px-5 pb-24 pt-6 sm:px-8 md:pt-12">
          {children}
        </main>
        <DemoFooterNav />
      </>
    );
  }
  return (
    <>
      <DemoTopBar />
      <main className="mx-auto w-full max-w-[1280px] px-6 py-12 md:py-20">
        {children}
      </main>
    </>
  );
}
