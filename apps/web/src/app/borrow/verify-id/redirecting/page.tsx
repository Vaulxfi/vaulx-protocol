"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { GovbrChrome } from "../_govbr-chrome";

export default function RedirectingPage() {
  return (
    <Suspense fallback={null}>
      <RedirectingContent />
    </Suspense>
  );
}

function RedirectingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mockAuto = searchParams.get("mock") === "auto";
  const returnTo = searchParams.get("return_to") ?? "";

  useEffect(() => {
    const qs = new URLSearchParams();
    if (mockAuto) qs.set("mock", "auto");
    if (returnTo) qs.set("return_to", returnTo);
    const s = qs.toString();
    const href = `/borrow/verify-id/govbr-login${s ? `?${s}` : ""}`;
    const delay = mockAuto ? 200 : 1000;
    const t = setTimeout(() => router.push(href), delay);
    return () => clearTimeout(t);
  }, [mockAuto, returnTo, router]);

  return (
    <GovbrChrome>
      <div className="flex flex-col items-center gap-4 text-center">
        <div
          aria-hidden
          className="h-10 w-10 animate-spin rounded-full border-4 border-[#1351B4]/20 border-t-[#1351B4]"
        />
        <p className="text-sm font-medium text-[#1351B4]">
          Redirecting to gov.br.gov…
        </p>
        <p className="text-xs text-[#1351B4]/70">
          Estabelecendo conexão segura
        </p>
      </div>
    </GovbrChrome>
  );
}
