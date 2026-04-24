"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { IdentityGates } from "@/components/vaulx/identity-gates";
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
  { value: "very_good", label: "Very Good" },
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
    <main className="min-h-screen bg-background px-6 py-12">
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <header>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
            Tell us about your watch
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Step 1 of 3 — asset details. We&apos;ll price it against three
            sources and generate an appraisal.
          </p>
        </header>

        <IdentityGates>
          <AssetForm />
        </IdentityGates>
      </div>
    </main>
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
    <Card>
      <CardHeader>
        <CardTitle>Watch details</CardTitle>
        <CardDescription>
          All fields required. Reference number matters — it drives the
          model-price lookup.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <Field label="Make" error={errors.make?.message}>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
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
              <Input
                placeholder="e.g. Grand Seiko"
                {...register("makeOther")}
              />
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
            <legend className="mb-2 text-sm font-medium">Condition</legend>
            <div className="flex flex-wrap gap-3">
              {CONDITIONS.map((c) => (
                <label
                  key={c.value}
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent"
                >
                  <input
                    type="radio"
                    value={c.value}
                    {...register("condition")}
                  />
                  {c.label}
                </label>
              ))}
            </div>
            {errors.condition ? (
              <p className="mt-1 text-xs text-destructive">
                {errors.condition.message}
              </p>
            ) : null}
          </fieldset>

          <Button
            type="submit"
            disabled={submitting}
            className="bg-brand-gold text-brand-blue hover:bg-brand-gold/90"
          >
            {submitting ? "Getting appraisal…" : "Get appraisal"}
          </Button>
        </form>
      </CardContent>
    </Card>
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
      <label className="text-sm font-medium">{label}</label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
