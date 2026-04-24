"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { SiteFooter } from "@/components/vaulx/site-footer";
import { SiteHeader } from "@/components/vaulx/site-header";

function shorten(s: string, head = 6, tail = 6): string {
  if (s.length <= head + tail + 1) return s;
  return `${s.slice(0, head)}…${s.slice(-tail)}`;
}

export default function LoanRepaidPage() {
  return (
    <>
      <SiteHeader />
      <Suspense fallback={null}>
        <Content />
      </Suspense>
      <SiteFooter />
    </>
  );
}

function Content() {
  const params = useParams<{ trdc: string }>();
  const trdc = params?.trdc ?? "";
  return (
    <main className="relative min-h-[calc(100vh-72px-64px)]">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-8 px-6 py-24 text-center md:py-32">
        <div className="flex h-16 w-16 items-center justify-center border border-[var(--signal-good)] text-[var(--signal-good)]">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="h-8 w-8"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div>
          <span className="eyebrow">Loan repaid</span>
          <h1
            className="mt-5 font-display font-extrabold leading-[1.05] tracking-[-0.02em] text-[var(--ink)]"
            style={{ fontSize: "clamp(2.25rem, 5vw, 4rem)" }}
          >
            Thank you.
          </h1>
          <p className="mt-6 font-sans text-base leading-[1.65] text-[var(--ink-dim)]">
            Your TRDC is now <span className="font-mono text-[var(--ink)]">Repaid</span>. Your watch is being released from custody — the custodian will reach out with shipping details.
          </p>
        </div>

        {trdc && (
          <div className="w-full max-w-md border border-[var(--rule)] bg-[var(--bg-elev-1)] p-6">
            <span className="eyebrow">TRDC</span>
            <div className="mt-3 break-all font-mono text-xs text-[var(--brand)]">
              {shorten(trdc, 10, 10)}
            </div>
          </div>
        )}

        <Link href="/" className="btn-ghost">
          Back to Vaulx
        </Link>
      </div>
    </main>
  );
}
