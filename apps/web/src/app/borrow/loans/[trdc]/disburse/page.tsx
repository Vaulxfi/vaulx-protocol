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

export default function DisbursePage() {
  return (
    <Suspense fallback={null}>
      <DisburseContent />
    </Suspense>
  );
}

function DisburseContent() {
  const params = useParams<{ trdc: string }>();
  const trdc = params?.trdc ?? "";
  return (
    <main className="min-h-screen bg-background px-6 py-12">
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <header>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
            Disbursement — coming soon
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Phase 3 will wire `loan.disburse_from_vault` to pay USDC to your
            wallet. For now, your TRDC is secured in custody.
          </p>
        </header>
        <Card>
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
