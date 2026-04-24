"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { PublicKey } from "@solana/web3.js";
import {
  useConnection,
  useWallet,
} from "@solana/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { WalletConnectButton } from "@/components/wallet-connect-button";
import {
  hexToBytes32,
  useConfirmCustody,
  useLoanConfig,
  useTrdcState,
} from "@/lib/chain/custody";

const USD = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});
function fmtUsdc(atoms: bigint | undefined): string {
  if (atoms === undefined) return "—";
  const whole = Number(atoms) / 1_000_000;
  return `$${USD.format(Math.round(whole))} USDC`;
}
function toIsoDate(unixSec: bigint | undefined): string {
  if (unixSec === undefined) return "—";
  return new Date(Number(unixSec) * 1000).toISOString().slice(0, 10);
}
function shorten(pda: string, head = 4, tail = 4): string {
  if (pda.length <= head + tail + 1) return pda;
  return `${pda.slice(0, head)}…${pda.slice(-tail)}`;
}

function statusName(status: Record<string, unknown> | undefined): string {
  if (!status) return "—";
  // Anchor serializes enum variants as `{ variantName: {} }`.
  const key = Object.keys(status)[0];
  if (!key) return "—";
  return key.charAt(0).toUpperCase() + key.slice(1);
}

const CHECKLIST = [
  "Watch received and physically inspected",
  "Serial number matches submission",
  "Condition matches declared condition",
  "Photographed for archive",
  "Placed in vault",
] as const;

export default function CustodianIntakePage() {
  return (
    <Suspense fallback={null}>
      <CustodianIntakeContent />
    </Suspense>
  );
}

function CustodianIntakeContent() {
  const params = useParams<{ trdc: string }>();
  const searchParams = useSearchParams();
  const trdc = params?.trdc ?? "";
  const hashParam = searchParams?.get("hash") ?? "";

  const trdcPda = useMemo(() => {
    try {
      return new PublicKey(trdc);
    } catch {
      return undefined;
    }
  }, [trdc]);

  return (
    <main className="min-h-screen bg-background px-6 py-12">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
              Custodian intake — TRDC {shorten(trdc, 6, 6)}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Review the loan details, verify the watch, then sign the
              confirm-custody transaction to flip the TRDC to
              <code className="mx-1 rounded bg-muted px-1 py-0.5 text-xs">
                ActiveInCustody
              </code>
              .
            </p>
          </div>
          <WalletConnectButton />
        </header>

        {!trdcPda ? (
          <Card>
            <CardContent className="pt-6 text-sm text-destructive">
              Invalid TRDC pubkey in URL.
            </CardContent>
          </Card>
        ) : (
          <CustodianInner trdc={trdc} trdcPda={trdcPda} hashParam={hashParam} />
        )}
      </div>
    </main>
  );
}

function CustodianInner({
  trdc,
  trdcPda,
  hashParam,
}: {
  trdc: string;
  trdcPda: PublicKey;
  hashParam: string;
}) {
  const router = useRouter();
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();

  const loanConfigQuery = useLoanConfig();
  const trdcQuery = useTrdcState(trdcPda);

  const [balanceLamports, setBalanceLamports] = useState<number | null>(null);
  useEffect(() => {
    if (!publicKey) {
      setBalanceLamports(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const lamports = await connection.getBalance(publicKey, "confirmed");
        if (!cancelled) setBalanceLamports(lamports);
      } catch {
        if (!cancelled) setBalanceLamports(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [connection, publicKey]);

  const [checklist, setChecklist] = useState<boolean[]>(
    () => CHECKLIST.map(() => false),
  );
  const [docHashHex, setDocHashHex] = useState<string>(hashParam);
  useEffect(() => {
    if (hashParam && !docHashHex) setDocHashHex(hashParam);
  }, [hashParam, docHashHex]);

  const confirmMutation = useConfirmCustody();

  const loanConfig = loanConfigQuery.data;
  const trdcState = trdcQuery.data;

  // Gate 1: loan_config not initialised.
  if (loanConfigQuery.isLoading) {
    return <Card><CardContent className="pt-6 text-sm">Loading loan config…</CardContent></Card>;
  }
  if (loanConfigQuery.isError) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-destructive">
          Failed to load loan_config: {String((loanConfigQuery.error as Error)?.message ?? "unknown")}
        </CardContent>
      </Card>
    );
  }
  if (!loanConfig) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>LoanConfig not initialized</CardTitle>
          <CardDescription>
            The on-chain loan_config singleton has not been initialised yet.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Task 2.10 wires the E2E script that calls{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            initialize_loan_config(custodian, civic_network)
          </code>
          . Run that first, then come back to this page.
        </CardContent>
      </Card>
    );
  }

  // Gate 2: wallet not connected or not the custodian.
  if (!connected || !publicKey) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Connect the custodian wallet</CardTitle>
          <CardDescription>
            The expected custodian pubkey is shown below.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <div className="text-muted-foreground">Expected custodian:</div>
          <div className="break-all font-mono text-xs">
            {loanConfig.custodian.toBase58()}
          </div>
        </CardContent>
      </Card>
    );
  }
  const isCustodian = publicKey.equals(loanConfig.custodian);
  if (!isCustodian) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Not authorized as custodian</CardTitle>
          <CardDescription>
            This wallet is not the configured custodian.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">Connected:</div>
            <div className="break-all font-mono text-xs">
              {publicKey.toBase58()}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Expected:</div>
            <div className="break-all font-mono text-xs">
              {loanConfig.custodian.toBase58()}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Gate 3: TRDC state loads + is in PendingCustody.
  const trdcLoading = trdcQuery.isLoading;
  const trdcError = trdcQuery.isError;
  const missingTrdc = !trdcLoading && !trdcError && !trdcState;
  const status = statusName(trdcState?.status as Record<string, unknown> | undefined);
  const isPendingCustody = status === "PendingCustody";

  const lowBalance =
    balanceLamports !== null && balanceLamports < 1_000_000; // < 0.001 SOL

  const allChecked = checklist.every(Boolean);
  const hashValid = /^(0x)?[0-9a-fA-F]{64}$/.test(docHashHex.trim());
  const canConfirm =
    allChecked &&
    hashValid &&
    !trdcLoading &&
    !missingTrdc &&
    isPendingCustody &&
    !confirmMutation.isPending;

  async function onConfirm() {
    try {
      const bytes = hexToBytes32(docHashHex.trim());
      const result = await confirmMutation.mutateAsync({
        trdcPda,
        docHash: bytes,
      });
      toast.success(
        `Custody confirmed: ${result.txSig.slice(0, 8)}…`,
      );
      router.push(`/custodian/done/${trdc}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>TRDC details</CardTitle>
          <CardDescription>Read-only on-chain state</CardDescription>
        </CardHeader>
        <CardContent>
          {trdcLoading && <div className="text-sm">Loading TRDC…</div>}
          {trdcError && (
            <div className="text-sm text-destructive">
              Failed to load TRDC: {String((trdcQuery.error as Error)?.message)}
            </div>
          )}
          {missingTrdc && (
            <div className="text-sm text-destructive">
              TRDCState account not found at{" "}
              <span className="font-mono">{trdc}</span>.
            </div>
          )}
          {trdcState && (
            <dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-1.5 text-sm">
              <dt className="text-muted-foreground">Loan ID</dt>
              <dd className="break-all font-mono text-xs">
                {trdcState.loanId.toBase58()}
              </dd>
              <dt className="text-muted-foreground">Status</dt>
              <dd>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    isPendingCustody
                      ? "bg-amber-100 text-amber-900"
                      : "bg-destructive/15 text-destructive"
                  }`}
                >
                  {status}
                </span>
              </dd>
              <dt className="text-muted-foreground">Appraisal</dt>
              <dd className="tabular-nums">
                {fmtUsdc(trdcState.appraisalValue as unknown as bigint)}
              </dd>
              <dt className="text-muted-foreground">Loan amount</dt>
              <dd className="tabular-nums">
                {fmtUsdc(trdcState.loanAmount as unknown as bigint)}
              </dd>
              <dt className="text-muted-foreground">Due date</dt>
              <dd className="tabular-nums">
                {toIsoDate(trdcState.dueTs as unknown as bigint)}
              </dd>
            </dl>
          )}
          {trdcState && !isPendingCustody && (
            <div className="mt-3 rounded-md border border-destructive bg-destructive/10 p-3 text-xs text-destructive">
              TRDC not in PendingCustody — cannot confirm.
            </div>
          )}
        </CardContent>
      </Card>

      {lowBalance && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
          Custodian wallet balance is below 0.001 SOL — fund it on Devnet
          before signing (<code>solana airdrop 1 &lt;pubkey&gt; --url devnet</code>).
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Watch intake checklist</CardTitle>
          <CardDescription>
            All items must be checked before confirming.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {CHECKLIST.map((item, idx) => (
            <label
              key={item}
              className="flex cursor-pointer items-center gap-3 rounded-md border border-border px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                checked={checklist[idx]}
                onChange={(e) => {
                  setChecklist((prev) => {
                    const next = [...prev];
                    next[idx] = e.target.checked;
                    return next;
                  });
                }}
                className="h-4 w-4 accent-brand-gold"
              />
              <span>{item}</span>
            </label>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>CCB hash</CardTitle>
          <CardDescription>
            32-byte hex — matches the CCB PDF the borrower signed. Pre-filled
            from the URL when the borrower shared the deeplink.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Input
            value={docHashHex}
            onChange={(e) => setDocHashHex(e.target.value)}
            placeholder="0x… (64 hex chars)"
            className="font-mono text-xs"
            spellCheck={false}
          />
          {!hashValid && docHashHex.length > 0 && (
            <div className="text-xs text-destructive">
              Expected 64 hex characters (with optional <code>0x</code> prefix).
            </div>
          )}
        </CardContent>
      </Card>

      <Button
        onClick={onConfirm}
        disabled={!canConfirm}
        className="bg-brand-gold text-brand-blue hover:bg-brand-gold/90"
      >
        {confirmMutation.isPending
          ? "Confirming…"
          : "Confirm custody received"}
      </Button>
    </>
  );
}
