"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DemoShell } from "../../_components/demo-shell";
import { useDemoSession } from "../../_lib/use-demo-session";

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

export default function RegisterPage() {
  const router = useRouter();
  const { session, patch } = useDemoSession();
  const [photos, setPhotos] = useState<string[]>(["", "", ""]);
  const [submitting, setSubmitting] = useState(false);

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

  function onSubmit(values: FormValues) {
    setSubmitting(true);
    const finalMake =
      values.make === "Other"
        ? (values.makeOther ?? "").trim() || "Other"
        : values.make;
    const filledPhotos = photos.filter((p) => p.length > 0);
    patch((prev) => ({
      ...prev,
      watch: {
        ...(prev.watch ?? { photos: [] }),
        make: finalMake,
        model: values.model.trim(),
        ref: values.ref.trim(),
        year: values.year,
        condition: values.condition,
        photos: filledPhotos,
      },
    }));
    router.push("/demo/borrow/appraisal/" + crypto.randomUUID());
  }

  return (
    <DemoShell formFactor="phone">
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

          <button
            type="submit"
            disabled={submitting}
            className="mt-4 w-full rounded-md border border-[var(--brand)] bg-[var(--brand)] px-4 py-3 font-mono text-sm uppercase tracking-wider text-[var(--bg)] disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Get appraisal →"}
          </button>
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
