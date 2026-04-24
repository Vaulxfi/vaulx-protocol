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

export default function AwaitingCustodyPage() {
  return (
    <Suspense fallback={null}>
      <AwaitingCustodyContent />
    </Suspense>
  );
}

function AwaitingCustodyContent() {
  const params = useParams<{ trdc: string }>();
  const trdc = params?.trdc ?? "";
  return (
    <main className="min-h-screen bg-background px-6 py-12">
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <header>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
            Awaiting custody
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your TRDC has been minted. The custodian will confirm receipt of
            your watch before disbursement.
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
        <p className="text-xs text-muted-foreground">
          Placeholder screen — Task 2.9 wires the custody-confirmation polling
          and status updates.
        </p>
      </div>
    </main>
  );
}
