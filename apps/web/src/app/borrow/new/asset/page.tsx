"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { EditorialSection } from "@/components/vaulx/editorial-section";
import { IdentityGates } from "@/components/vaulx/identity-gates";
import { SiteFooter } from "@/components/vaulx/site-footer";
import { SiteHeader } from "@/components/vaulx/site-header";
import { StepRail } from "@/components/vaulx/step-rail";
import type {
  AppraisalInput,
  AppraisalResponse,
  WatchCondition,
} from "@/lib/appraisal/types";

const PRESET_MAKES = [
  "Rolex",
  "Patek Philippe",
  "Audemars Piguet",
  "Omega",
  "IWC",
  "Cartier",
  "Other",
] as const;

const CONDITIONS: { value: WatchCondition; label: string }[] = [
  { value: "mint", label: "Mint" },
  { value: "excellent", label: "Excellent" },
  { value: "very_good", label: "Very good" },
  { value: "good", label: "Good" },
];

const currentYear = new Date().getUTCFullYear();

const schema = z.object({
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

type FormValues = z.infer<typeof schema>;

export default function AssetPage() {
  return (
    <>
      <SiteHeader />
      <StepRail />

      <main className="relative min-h-[calc(100vh-72px-64px)]">
        <div className="mx-auto w-full max-w-[1440px] px-6 py-16 md:px-10 md:py-20">
          <EditorialSection
            eyebrow="Step 03 — Asset"
            headline="Tell us about the watch."
            lead="We triangulate a value across Chrono24, WatchCharts and our internal model — the median becomes your appraisal floor."
          />

          <div className="mt-14 grid gap-10 md:grid-cols-12 md:gap-8">
            <div className="md:col-span-7">
              <IdentityGates>
                <AssetForm />
              </IdentityGates>
            </div>

            <aside className="md:col-span-5">
              <div className="border border-[var(--rule)] bg-[var(--bg-elev-1)] p-6 md:p-8">
                <span className="eyebrow">The appraisal</span>
                <p className="mt-5 font-sans text-sm leading-[1.65] text-[var(--ink-dim)]">
                  Reference numbers matter. The ref (often engraved on the warranty card) drives the model lookup. Without it we fall back to Vaulx&apos;s internal model — accurate, but conservative.
                </p>
                <div className="mt-8 flex flex-col gap-4 font-mono text-xs">
                  <Row k="Sources" v="Chrono24 · WatchCharts · VX-Model" />
                  <Row k="Consensus" v="Median of three" />
                  <Row k="Max LTV" v="60%" />
                  <Row k="Terms" v="30 · 60 · 90 days" />
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-[var(--rule)] pb-3 last:border-b-0">
      <span className="uppercase tracking-[0.14em] text-[var(--ink-muted)]">
        {k}
      </span>
      <span className="text-right text-[var(--ink)]">{v}</span>
    </div>
  );
}

function AssetForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      make: "Rolex",
      makeOther: "",
      model: "",
      ref: "",
      year: currentYear - 3,
      condition: "excellent",
    },
  });

  const selectedMake = watch("make");

  async function onSubmit(values: FormValues) {
    const finalMake =
      values.make === "Other"
        ? (values.makeOther ?? "").trim() || "Other"
        : values.make;

    const input: AppraisalInput = {
      make: finalMake,
      model: values.model.trim(),
      ref: values.ref.trim(),
      year: values.year,
      condition: values.condition,
    };

    setSubmitting(true);
    try {
      const res = await fetch("/api/appraisal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          (err && typeof err.error === "string" && err.error) ||
            `Appraisal failed (${res.status})`,
        );
      }
      const data = (await res.json()) as AppraisalResponse;
      const reqId = crypto.randomUUID();
      sessionStorage.setItem(
        `vaulx_appraisal_${reqId}`,
        JSON.stringify({ input, response: data }),
      );
      router.push(`/borrow/new/appraisal/${reqId}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
      setSubmitting(false);
    }
  }

  return (
    <div className="border border-[var(--rule)] bg-[var(--bg-elev-1)] p-6 md:p-10">
      <span className="eyebrow">Watch details</span>
      <h3 className="mt-4 font-display text-2xl font-semibold tracking-[-0.01em] text-[var(--ink)] md:text-3xl">
        The asset.
      </h3>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-10 flex flex-col gap-6"
      >
        <Field label="Make" error={errors.make?.message}>
          <select
            className="h-11 w-full border border-[var(--rule-strong)] bg-[var(--bg)] px-3 py-2 font-mono text-sm text-[var(--ink)] focus:border-[var(--brand)] focus:outline-none"
            {...register("make")}
          >
            {PRESET_MAKES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </Field>

        {selectedMake === "Other" ? (
          <Field label="Make (other)" error={errors.makeOther?.message}>
            <Input placeholder="e.g. Grand Seiko" {...register("makeOther")} />
          </Field>
        ) : null}

        <Field label="Model" error={errors.model?.message}>
          <Input placeholder="e.g. Submariner Date" {...register("model")} />
        </Field>

        <Field
          label="Reference"
          error={errors.ref?.message}
          hint="Reference number (usually on the warranty card)"
        >
          <Input placeholder="116610LN" {...register("ref")} />
        </Field>

        <Field label="Year" error={errors.year?.message}>
          <Input
            type="number"
            min={1950}
            max={currentYear}
            step={1}
            {...register("year")}
          />
        </Field>

        <fieldset>
          <legend className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
            Condition
          </legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {CONDITIONS.map((c) => (
              <label
                key={c.value}
                className="group flex cursor-pointer items-center justify-center border border-[var(--rule-strong)] bg-[var(--bg)] px-3 py-3 font-mono text-xs uppercase tracking-[0.14em] text-[var(--ink-dim)] transition-colors has-[:checked]:border-[var(--brand)] has-[:checked]:bg-[var(--brand-wash)] has-[:checked]:text-[var(--brand)]"
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
            <p className="mt-2 font-mono text-xs text-[var(--signal-bad)]">
              {errors.condition.message}
            </p>
          ) : null}
        </fieldset>

        <button
          type="submit"
          disabled={submitting}
          className="btn-gold mt-6 w-full justify-center disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Appraising…" : "Get appraisal"}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-4 w-4">
            <path strokeLinecap="round" d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </button>
      </form>
    </div>
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
    <div className="flex flex-col gap-2">
      <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
        {label}
      </label>
      {children}
      {hint ? (
        <p className="font-mono text-[11px] text-[var(--ink-muted)]">{hint}</p>
      ) : null}
      {error ? (
        <p className="font-mono text-[11px] text-[var(--signal-bad)]">{error}</p>
      ) : null}
    </div>
  );
}
