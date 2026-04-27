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
import { maskCpf } from "@/lib/govbr/cpf";

import { DemoShell } from "../../../_components/demo-shell";
import { useDemoSession } from "../../../_lib/use-demo-session";

export default function DemoCallbackPage() {
  return (
    <Suspense fallback={null}>
      <DemoCallbackContent />
    </Suspense>
  );
}

function DemoCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, isLoading } = useDemoSession();

  const returnTo = searchParams.get("return_to") || "/demo/borrow/onboard";
  const mockAuto = searchParams.get("mock") === "auto";

  const govbr = session?.govbr;
  const verified = !!govbr?.verifiedAt;

  useEffect(() => {
    if (!mockAuto || isLoading || !verified) return;
    const t = setTimeout(() => router.push(returnTo), 1000);
    return () => clearTimeout(t);
  }, [mockAuto, isLoading, verified, returnTo, router]);

  return (
    <DemoShell formFactor="phone">
      <div className="flex flex-col gap-6 px-6 py-8">
        <Card className="border-emerald-500/30">
          <CardHeader className="flex flex-row items-start gap-3">
            <div
              aria-hidden
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div className="flex flex-col gap-1">
              <CardTitle>Verification complete</CardTitle>
              <CardDescription>
                Your Brazilian identity has been verified via gov.br (demo).
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : !verified ? (
              <p className="text-sm text-destructive">
                No verification found. Please start again.
              </p>
            ) : (
              <div className="rounded-md border bg-muted/40 p-4 text-sm">
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
                  <dt className="text-muted-foreground">Full name</dt>
                  <dd className="font-medium text-foreground">
                    {govbr!.name}
                  </dd>
                  <dt className="text-muted-foreground">CPF</dt>
                  <dd className="font-mono text-foreground">
                    {maskCpf(govbr!.cpf ?? "")}
                  </dd>
                  <dt className="text-muted-foreground">Verified at</dt>
                  <dd className="text-foreground">
                    {new Date(govbr!.verifiedAt!).toLocaleString()}
                  </dd>
                </dl>
              </div>
            )}
            <Button
              onClick={() => router.push(returnTo)}
              className="bg-[#1351B4] text-white hover:bg-[#0D3F8F]"
            >
              Return to loan application
            </Button>
            <p className="text-xs text-muted-foreground">
              Demo mode — this verification is stored in your session only and
              is not a real government attestation.
            </p>
          </CardContent>
        </Card>
      </div>
    </DemoShell>
  );
}
