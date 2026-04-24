"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function CustodianDonePage() {
  return (
    <Suspense fallback={null}>
      <CustodianDoneContent />
    </Suspense>
  );
}

function CustodianDoneContent() {
  const params = useParams<{ trdc: string }>();
  const trdc = params?.trdc ?? "";
  return (
    <main className="min-h-screen bg-background px-6 py-12">
      <div className="mx-auto flex max-w-xl flex-col items-center gap-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            className="h-6 w-6"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
          Confirmed!
        </h1>
        <p className="text-sm text-muted-foreground">
          The TRDC has been flipped to <code>ActiveInCustody</code>. The
          borrower&apos;s page will auto-advance once the indexer picks up the
          event.
        </p>
        <Card className="w-full text-left">
          <CardHeader>
            <CardTitle>TRDC</CardTitle>
            <CardDescription>On-chain state account</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="break-all font-mono text-xs">{trdc}</div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
