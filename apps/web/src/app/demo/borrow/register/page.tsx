"use client";
// Phase E (Wire 2): when a real **signing** wallet is connected (Phantom or
// Solflare via wallet-adapter), the register form drives the FE-signing
// flow split across two routes:
//   1) POST /api/demo/build-create-ccb-tx — server returns an UNSIGNED
//      Transaction (createATA + create_ccb_trdc, payer = borrower).
//   2) The wallet adapter signs the tx; we submit via RPC ourselves.
//   3) POST /api/demo/confirm-and-disburse — operator/custodian-signed
//      atomic confirm_custody (collapses Pending → Active and disburses
//      principal into the borrower's USDC ATA in one tx).
// This is the correct architecture post-commit 3163352 (atomic
// confirm-and-disburse), and replaces the legacy single-shot
// /api/demo/provision-loan that signed create_ccb_trdc as the operator
// (which broke the borrower_ata.authority = trdc_state.borrower
// constraint and silently sent disburse to the operator's ATA).
//
// Mock fallback: when no signing wallet is available (no wallet, or
// Crossmint identity-only), the original UUID-loan mock flow still runs
// so the demo is always clickable.
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Transaction } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { DemoShell } from "../../_components/demo-shell";
import { useDemoSession } from "../../_lib/use-demo-session";
import { useUnifiedWallet } from "@/components/providers/crossmint-wallet-adapter";
import { useKycGate, KycCancelledError } from "@/lib/use-kyc-gate";
import { rateForTermDays } from "@vaulx/terms";

const MAKES = [
  "Rolex",
  "Patek Philippe",
  "Audemars Piguet",
  "Omega",
  "IWC",
  "Cartier",
  "Other",
] as const;

const CONDITIONS: { value: "mint" | "excellent" | "very_good" | "good"; label: string }[] = [
  { value: "mint", label: "Mint" },
  { value: "excellent", label: "Excellent" },
  { value: "very_good", label: "Very good" },
  { value: "good", label: "Good" },
];

const currentYear = new Date().getUTCFullYear();

const Schema = z.object({
  make: z.string().min(1, "Required"),
  makeOther: z.string().optional(),
  model: z.string().min(1, "Required").max(128),
  ref: z.string().min(1, "Required").max(64),
  year: z.coerce
    .number({ invalid_type_error: "Enter a year" })
    .int()
    .min(1950, "Year must be >= 1950")
    .max(currentYear, `Year must be <= ${currentYear}`),
  condition: z.enum(["mint", "excellent", "very_good", "good"]),
});

type FormValues = z.infer<typeof Schema>;

// Deterministic median appraisal for the mock-friendly path. The real
// `/api/appraisal` route uses the same triangulation under the hood — for the
// register page we only need a stable USD number to feed into provision-loan
// when a wallet is connected. Source: deterministic blend keyed by `ref`.
function computeFallbackMedianUsd(values: FormValues): number {
  // Base prices anchored to coarse market intuition (in USD). Multiplier by
  // condition keeps the number directionally sensible without scraping.
  const baseByMake: Record<string, number> = {
    Rolex: 14000,
    "Patek Philippe": 35000,
    "Audemars Piguet": 28000,
    Omega: 6000,
    IWC: 8000,
    Cartier: 7000,
    Other: 5000,
  };
  const condMult: Record<FormValues["condition"], number> = {
    mint: 1.1,
    excellent: 1.0,
    very_good: 0.9,
    good: 0.78,
  };
  // Cheap deterministic jitter from `ref` so two refs of the same model
  // disagree by a hundred bucks or so. Stable across renders.
  let h = 0;
  for (let i = 0; i < values.ref.length; i++) {
    h = (h * 31 + values.ref.charCodeAt(i)) >>> 0;
  }
  const jitter = ((h % 2000) - 1000) / 1000; // [-1, +1)
  const base = baseByMake[values.make] ?? baseByMake.Other;
  const yearAdj = 1 + Math.max(0, currentYear - values.year - 5) * -0.005;
  const median = base * condMult[values.condition] * yearAdj * (1 + jitter * 0.05);
  return Math.max(500, Math.round(median));
}

export default function RegisterPage() {
  const router = useRouter();
  const { session, patch } = useDemoSession();
  const wallet = useUnifiedWallet();
  const solanaWallet = useWallet(); // wallet-adapter — exposes signTransaction
  const { connection } = useConnection();
  const { guard, modalNode } = useKycGate("Submit asset for evaluation");
  const [photos, setPhotos] = useState<string[]>(["", "", ""]);
  const [submitting, setSubmitting] = useState(false);
  const [provisionMsg, setProvisionMsg] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: {
      make: session?.watch?.make && (MAKES as readonly string[]).includes(session.watch.make)
        ? session.watch.make
        : "Rolex",
      makeOther: "",
      model: session?.watch?.model ?? "",
      ref: session?.watch?.ref ?? "",
      year: session?.watch?.year ?? currentYear - 3,
      condition: session?.watch?.condition ?? "excellent",
    },
  });

  const selectedMake = watch("make");

  if (!session) {
    return (
      <DemoShell formFactor="phone">
        <div className="px-6 py-12 text-[var(--ink-muted)]">Loading…</div>
      </DemoShell>
    );
  }

  function onPhoto(idx: number, file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = typeof reader.result === "string" ? reader.result : "";
      setPhotos((prev) => {
        const next = [...prev];
        next[idx] = url;
        return next;
      });
    };
    reader.readAsDataURL(file);
  }

  async function onSubmit(values: FormValues) {
    setErrMsg(null);
    setSubmitting(true);
    const finalMake =
      values.make === "Other"
        ? (values.makeOther ?? "").trim() || "Other"
        : values.make;
    const filledPhotos = photos.filter((p) => p.length > 0);
    const watchPatch = {
      make: finalMake,
      model: values.model.trim(),
      ref: values.ref.trim(),
      year: values.year,
      condition: values.condition,
      photos: filledPhotos,
    };
    patch((prev) => ({
      ...prev,
      watch: { ...(prev.watch ?? { photos: [] }), ...watchPatch },
    }));

    // Phase E (Wire 2): on-chain provisioning runs ONLY when wallet-adapter
    // (Phantom/Solflare) is connected — we need a real `signTransaction`.
    // Crossmint identity-only (no wallet-adapter) falls through to mock
    // because Crossmint SDK 1.0.14 has no detached signTransaction (see
    // crossmint-wallet-adapter.ts header). Mock pubkeys (`MOCK…`) also
    // fall through.
    const borrowerPubkey = wallet.publicKey?.toBase58() ?? null;
    const isMockPubkey = !!borrowerPubkey && borrowerPubkey.startsWith("MOCK");
    const canProvision =
      wallet.canSign &&
      !!borrowerPubkey &&
      !isMockPubkey &&
      !!solanaWallet.signTransaction;

    if (canProvision) {
      try {
        await guard(async () => {
          const median = computeFallbackMedianUsd(values);
          const watchRef = `${watchPatch.make} ${watchPatch.ref}`.trim();
          const ltvBps = 5000; // 50% — sane default for the demo
          const termDays = 60;

          // 1/3 — Server builds the unsigned tx (publish_price + createATA +
          // create_ccb_trdc with payer = borrower).
          setProvisionMsg("Preparing your loan on Devnet…");
          const buildRes = await fetch("/api/demo/build-create-ccb-tx", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              borrowerPubkey,
              watchRef,
              appraisalUsdCents: Math.round(median * 100),
              ltvBps,
              termDays,
            }),
          });
          const buildJson = (await buildRes.json().catch(() => ({}))) as {
            ok?: boolean;
            loanId?: string;
            trdcStatePda?: string;
            serializedTx?: string;
            blockhash?: string;
            lastValidBlockHeight?: number;
            state?: { loanAmountAtoms?: string; rateBps?: number; dueTs?: string };
            error?: string;
            detail?: string;
          };
          if (
            !buildRes.ok ||
            !buildJson.ok ||
            !buildJson.serializedTx ||
            !buildJson.loanId
          ) {
            throw new Error(
              buildJson.error ??
                buildJson.detail ??
                `build-create-ccb-tx failed (${buildRes.status})`,
            );
          }

          // 2/3 — Wallet signs and we submit. The wallet popup will show
          // the user the createATA + create_ccb_trdc instructions; rejecting
          // surfaces as a thrown error we catch as "user cancelled".
          setProvisionMsg("Sign the transaction in your wallet…");
          let signed: Transaction;
          try {
            const tx = Transaction.from(
              Buffer.from(buildJson.serializedTx, "base64"),
            );
            signed = await solanaWallet.signTransaction!(tx);
          } catch (sigErr) {
            // Phantom / Solflare reject path
            const msg = sigErr instanceof Error ? sigErr.message : String(sigErr);
            if (msg.toLowerCase().includes("user rejected") || msg.toLowerCase().includes("declined")) {
              throw new Error("Signature cancelled in your wallet.");
            }
            throw sigErr;
          }

          setProvisionMsg("Submitting your transaction…");
          const createSig = await connection.sendRawTransaction(
            signed.serialize(),
            { maxRetries: 5 },
          );
          if (
            buildJson.blockhash &&
            typeof buildJson.lastValidBlockHeight === "number"
          ) {
            await connection.confirmTransaction(
              {
                signature: createSig,
                blockhash: buildJson.blockhash,
                lastValidBlockHeight: buildJson.lastValidBlockHeight,
              },
              "confirmed",
            );
          } else {
            await connection.confirmTransaction(createSig, "confirmed");
          }

          // 3/3 — Operator/custodian-signed atomic confirm_custody (flips
          // Pending → Active and disburses principal into borrower_ata).
          setProvisionMsg("Confirming custody and disbursing principal…");
          const confirmRes = await fetch("/api/demo/confirm-and-disburse", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              loanId: buildJson.loanId,
              borrowerPubkey,
            }),
          });
          const confirmJson = (await confirmRes.json().catch(() => ({}))) as {
            ok?: boolean;
            custodyTx?: string;
            borrowerBalanceAfter?: string | null;
            finalStatus?: string;
            error?: string;
            detail?: string;
          };
          if (!confirmRes.ok || !confirmJson.ok || !confirmJson.custodyTx) {
            throw new Error(
              confirmJson.error ??
                confirmJson.detail ??
                `confirm-and-disburse failed (${confirmRes.status})`,
            );
          }

          const principalAtoms = buildJson.state?.loanAmountAtoms ?? "0";
          const rateBps = buildJson.state?.rateBps ?? rateForTermDays(termDays);
          const dueTs = buildJson.state?.dueTs
            ? Number(buildJson.state.dueTs)
            : Math.floor(Date.now() / 1000) + termDays * 86400;
          // The disburse landed in the borrower's USDC ATA; surface it as
          // the demo's "in-app balance" so the disburse page renders.
          const inAppBalanceAtoms = confirmJson.borrowerBalanceAfter
            ? String(Math.round(Number(confirmJson.borrowerBalanceAfter) * 1_000_000))
            : "0";

          patch((prev) => ({
            ...prev,
            watch: {
              ...(prev.watch ?? { photos: [] }),
              ...watchPatch,
              appraisal: prev.watch?.appraisal ?? {
                chrono24: median,
                watchcharts: median,
                internal: median,
                median,
              },
            },
            loan: {
              loanId: buildJson.loanId!,
              principalAtoms,
              rateBps,
              termDays,
              dueTs,
              ccbHashHex: "",
              signatureDataUrl: "",
              custody: {
                provider: "brinks",
                confirmedAt: Date.now(),
              },
              inAppBalanceAtoms,
              trdcStatePda: buildJson.trdcStatePda,
              createTx: createSig,
              custodyTx: confirmJson.custodyTx,
              provisionedOnChain: true,
            },
            tour: { ...prev.tour, step: 8 },
          }));
          router.push("/demo/borrow/disburse");
        });
        return;
      } catch (err) {
        if (err instanceof KycCancelledError) {
          setSubmitting(false);
          setProvisionMsg(null);
          return;
        }
        setErrMsg(err instanceof Error ? err.message : String(err));
        setSubmitting(false);
        setProvisionMsg(null);
        return;
      }
    }

    // Mock fallback: no signing wallet — keep the original demo flow alive.
    router.push("/demo/borrow/appraisal/" + crypto.randomUUID());
  }

  return (
    <DemoShell formFactor="phone">
      {modalNode}
      <div className="px-6 py-8">
        <p className="eyebrow">Step 5 / 14 · Asset</p>
        <h1 className="display-md mt-3">Register your watch.</h1>
        <p className="mt-3 text-sm text-[var(--ink-dim)]">
          Make, model, reference, year and condition. Three photos help our model triangulate.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 flex flex-col gap-5">
          <Field label="Make" error={errors.make?.message}>
            <select
              className="h-11 w-full rounded-md border border-[var(--rule)] bg-[var(--bg)] px-3 py-2 font-mono text-sm text-[var(--ink)] focus:border-[var(--brand)] focus:outline-none"
              {...register("make")}
            >
              {MAKES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </Field>

          {selectedMake === "Other" ? (
            <Field label="Make (other)" error={errors.makeOther?.message}>
              <input
                className="h-11 w-full rounded-md border border-[var(--rule)] bg-[var(--bg)] px-3 py-2 font-mono text-sm text-[var(--ink)] focus:border-[var(--brand)] focus:outline-none"
                placeholder="e.g. Grand Seiko"
                {...register("makeOther")}
              />
            </Field>
          ) : null}

          <Field label="Model" error={errors.model?.message}>
            <input
              className="h-11 w-full rounded-md border border-[var(--rule)] bg-[var(--bg)] px-3 py-2 font-mono text-sm text-[var(--ink)] focus:border-[var(--brand)] focus:outline-none"
              placeholder="e.g. Submariner Date"
              {...register("model")}
            />
          </Field>

          <Field
            label="Reference"
            error={errors.ref?.message}
            hint="Reference number (usually on the warranty card)"
          >
            <input
              className="h-11 w-full rounded-md border border-[var(--rule)] bg-[var(--bg)] px-3 py-2 font-mono text-sm text-[var(--ink)] focus:border-[var(--brand)] focus:outline-none"
              placeholder="116610LN"
              {...register("ref")}
            />
          </Field>

          <Field label="Year" error={errors.year?.message}>
            <input
              type="number"
              min={1950}
              max={currentYear}
              step={1}
              className="h-11 w-full rounded-md border border-[var(--rule)] bg-[var(--bg)] px-3 py-2 font-mono text-sm text-[var(--ink)] focus:border-[var(--brand)] focus:outline-none"
              {...register("year")}
            />
          </Field>

          <fieldset>
            <legend className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
              Condition
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {CONDITIONS.map((c) => (
                <label
                  key={c.value}
                  className="flex cursor-pointer items-center justify-center rounded-md border border-[var(--rule)] bg-[var(--bg)] px-3 py-3 font-mono text-xs uppercase tracking-[0.14em] text-[var(--ink-dim)] transition-colors has-[:checked]:border-[var(--brand)] has-[:checked]:bg-[var(--brand)]/10 has-[:checked]:text-[var(--brand)]"
                >
                  <input
                    type="radio"
                    value={c.value}
                    className="sr-only"
                    {...register("condition")}
                  />
                  {c.label}
                </label>
              ))}
            </div>
            {errors.condition ? (
              <p className="mt-2 font-mono text-xs text-red-400">{errors.condition.message}</p>
            ) : null}
          </fieldset>

          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
              Photos (3)
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map((i) => (
                <PhotoSlot key={i} idx={i} dataUrl={photos[i]} onPick={onPhoto} />
              ))}
            </div>
            <p className="mt-2 font-mono text-[11px] text-[var(--ink-muted)]">
              Dial · Caseback · Movement (or any 3 angles).
            </p>
          </div>

          {submitting && provisionMsg && (
            <div className="rounded-md border border-[var(--brand)]/40 bg-[var(--brand-wash)] p-4 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--brand)]">
              <span
                className="mr-2 inline-block h-2 w-2 rounded-full bg-[var(--brand)] align-middle"
                style={{ animation: "vxRegisterPulse 1.4s ease-in-out infinite" }}
              />
              {provisionMsg}
            </div>
          )}
          {errMsg && (
            <div className="rounded-md border border-rose-500/50 bg-rose-500/10 p-3 font-mono text-[11px] text-rose-300">
              {errMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-4 w-full rounded-md border border-[var(--brand)] bg-[var(--brand)] px-4 py-3 font-mono text-sm uppercase tracking-wider text-[var(--bg)] disabled:opacity-50"
          >
            {submitting
              ? provisionMsg
                ? "Provisioning…"
                : "Submitting…"
              : "Get appraisal →"}
          </button>

          <style jsx>{`
            @keyframes vxRegisterPulse {
              0%,
              100% {
                opacity: 1;
              }
              50% {
                opacity: 0.3;
              }
            }
          `}</style>
        </form>
      </div>
    </DemoShell>
  );
}

function PhotoSlot({
  idx,
  dataUrl,
  onPick,
}: {
  idx: number;
  dataUrl: string;
  onPick: (idx: number, file: File | undefined) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className="relative aspect-square overflow-hidden rounded-md border border-dashed border-[var(--rule)] bg-[var(--bg)] hover:border-[var(--brand)]"
      aria-label={`Photo ${idx + 1}`}
    >
      {dataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={dataUrl} alt={`Watch photo ${idx + 1}`} className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center font-mono text-[10px] uppercase tracking-wider text-[var(--ink-muted)]">
          + Photo
        </span>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => onPick(idx, e.target.files?.[0])}
      />
    </button>
  );
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
        {label}
      </label>
      {children}
      {hint ? <p className="font-mono text-[11px] text-[var(--ink-muted)]">{hint}</p> : null}
      {error ? <p className="font-mono text-[11px] text-red-400">{error}</p> : null}
    </div>
  );
}
