"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function VerifyIdEntryPage() {
  return (
    <Suspense fallback={null}>
      <VerifyIdEntryContent />
    </Suspense>
  );
}

function VerifyIdEntryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mockAuto = searchParams.get("mock") === "auto";
  const returnTo = searchParams.get("return_to") ?? "";

  const nextHref = (() => {
    const qs = new URLSearchParams();
    if (mockAuto) qs.set("mock", "auto");
    if (returnTo) qs.set("return_to", returnTo);
    const s = qs.toString();
    return `/borrow/verify-id/redirecting${s ? `?${s}` : ""}`;
  })();

  useEffect(() => {
    if (!mockAuto) return;
    const t = setTimeout(() => router.push(nextHref), 200);
    return () => clearTimeout(t);
  }, [mockAuto, nextHref, router]);

  return (
    <main className="min-h-screen bg-background px-6 py-16">
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
            Verify your Brazilian identity
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Required to apply for a loan. We verify your CPF via gov.br, the
            official Brazilian government identity service.
          </p>
        </div>

        <Card className="overflow-hidden border-[#1351B4]/20">
          <div className="bg-gradient-to-r from-[#1351B4] to-[#2670E8] px-6 py-8 text-white">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold tracking-tight">
                <span className="text-white">gov</span>
                <span className="text-[#FFCD07]">.br</span>
              </span>
              <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide">
                Demo
              </span>
            </div>
            <p className="mt-3 text-sm text-white/90">
              Conta única do cidadão brasileiro
            </p>
          </div>
          <CardHeader>
            <CardTitle>Continue with gov.br</CardTitle>
            <CardDescription>
              You will be redirected to gov.br to authenticate with your CPF.
              Vaulx never stores your password.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button
              onClick={() => router.push(nextHref)}
              className="bg-[#1351B4] text-white hover:bg-[#0D3F8F]"
            >
              Continue with gov.br
            </Button>
            <p className="text-xs text-muted-foreground">
              Demo mode — no real government service is contacted. This flow
              simulates the federated gov.br OAuth handshake for hackathon
              purposes only.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
