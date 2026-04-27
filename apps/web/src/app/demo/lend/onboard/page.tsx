"use client";
// Accredited LP KYB mock. Tokeny ERC-3643-style 4-step intake.
// Pure local state; no API calls. The submission is a 2s spinner → success.
import { useState } from "react";
import Link from "next/link";
import { DemoShell } from "../../_components/demo-shell";
import { MockBadge } from "../../_components/integration-badges";

type EntityType =
  | "accredited"
  | "family-office"
  | "hedge-fund"
  | "bank-treasury"
  | "asset-manager";

type Jurisdiction = "BR" | "EU" | "US" | "Cayman" | "Singapore" | "Other";

type AumRange = "100k-1M" | "1M-10M" | "10M+";

type FormState = {
  entity?: EntityType;
  jurisdiction?: Jurisdiction;
  aum?: AumRange;
};

const ENTITY_OPTIONS: { id: EntityType; label: string }[] = [
  { id: "accredited", label: "Accredited individual" },
  { id: "family-office", label: "Family office" },
  { id: "hedge-fund", label: "Hedge fund" },
  { id: "bank-treasury", label: "Bank treasury" },
  { id: "asset-manager", label: "Asset manager" },
];

const JURISDICTIONS: Jurisdiction[] = [
  "BR",
  "EU",
  "US",
  "Cayman",
  "Singapore",
  "Other",
];

const AUM_OPTIONS: { id: AumRange; label: string }[] = [
  { id: "100k-1M", label: "$100k – $1M" },
  { id: "1M-10M", label: "$1M – $10M" },
  { id: "10M+", label: "$10M+" },
];

export default function OnboardLpPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [form, setForm] = useState<FormState>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const next = () => setStep((s) => (s < 4 ? ((s + 1) as 1 | 2 | 3 | 4) : s));
  const back = () => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3 | 4) : s));

  function handleSubmit() {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setDone(true);
    }, 2000);
  }

  const canAdvance =
    (step === 1 && !!form.entity) ||
    (step === 2 && !!form.jurisdiction) ||
    (step === 3 && !!form.aum);

  return (
    <DemoShell formFactor="desktop">
      <div className="mx-auto w-full max-w-[640px]">
        <div className="flex items-center gap-3">
          <span className="h-px w-10 bg-[var(--brand)]" />
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--ink-muted)]">
            VAULX · LP ONBOARDING
          </span>
        </div>
        <h1
          className="mt-6 font-display font-bold leading-[1.05] tracking-[-0.02em] text-[var(--ink)]"
          style={{
            fontSize: "clamp(2rem, 4vw, 3rem)",
            fontVariationSettings: '"opsz" 96',
          }}
        >
          Accredited LP application.
        </h1>
        <p className="mt-4 font-sans text-[15px] leading-[1.65] text-[var(--ink-dim)]">
          Four steps. Tokeny ERC-3643 issuance handles the on-chain identity
          credential after pre-approval.
        </p>

        {/* Progress */}
        <div className="mt-10 grid grid-cols-4 gap-1.5">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className={`h-1 ${
                n <= step ? "bg-[var(--brand)]" : "bg-[var(--rule)]"
              }`}
            />
          ))}
        </div>
        <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
          Step {step} / 4
        </div>

        {/* Steps */}
        <div className="mt-10 border border-[var(--rule)] bg-[var(--bg-elev-1)] p-8">
          {done ? (
            <SuccessState />
          ) : (
            <>
              {step === 1 && (
                <Step title="Entity type">
                  <RadioGroup
                    name="entity"
                    options={ENTITY_OPTIONS}
                    value={form.entity}
                    onChange={(v) => setForm((f) => ({ ...f, entity: v as EntityType }))}
                  />
                </Step>
              )}
              {step === 2 && (
                <Step title="Jurisdiction of formation">
                  <RadioGroup
                    name="jurisdiction"
                    options={JURISDICTIONS.map((j) => ({ id: j, label: j }))}
                    value={form.jurisdiction}
                    onChange={(v) =>
                      setForm((f) => ({ ...f, jurisdiction: v as Jurisdiction }))
                    }
                  />
                </Step>
              )}
              {step === 3 && (
                <Step title="AUM range / commitment">
                  <RadioGroup
                    name="aum"
                    options={AUM_OPTIONS}
                    value={form.aum}
                    onChange={(v) => setForm((f) => ({ ...f, aum: v as AumRange }))}
                  />
                </Step>
              )}
              {step === 4 && (
                <Step title="Confirm and submit">
                  <ConfirmReview form={form} />
                </Step>
              )}

              <div className="mt-10 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={back}
                  disabled={step === 1}
                  className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ink-muted)] transition-colors hover:text-[var(--ink)] disabled:opacity-30 disabled:hover:text-[var(--ink-muted)]"
                >
                  ← Back
                </button>
                {step < 4 ? (
                  <button
                    type="button"
                    onClick={next}
                    disabled={!canAdvance}
                    className="inline-flex items-center gap-2 border border-[var(--brand)] bg-[var(--brand)] px-5 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--bg)] transition-opacity disabled:opacity-30"
                  >
                    Continue →
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="inline-flex items-center gap-2 border border-[var(--brand)] bg-[var(--brand)] px-5 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--bg)] transition-opacity disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Spinner /> Submitting…
                      </>
                    ) : (
                      <>Submit application →</>
                    )}
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Disclosure footer */}
        <p className="mt-10 max-w-[60ch] font-mono text-[10px] uppercase leading-[1.6] tracking-[0.14em] text-[var(--ink-muted)]">
          FIDC wrapper structures retail capital under BR CVM regulation.
          Institutional capital flows directly via Tokeny ERC-3643 issuance.
        </p>

        <Link
          href="/demo/lend"
          className="mt-6 inline-block font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)] hover:text-[var(--ink)]"
        >
          ← Back to lender dashboard
        </Link>
      </div>
      <MockBadge partner="Tokeny ERC-3643" />
    </DemoShell>
  );
}

function Step({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-display text-2xl font-semibold tracking-[-0.01em] text-[var(--ink)]">
        {title}
      </h2>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function RadioGroup<T extends string>({
  name,
  options,
  value,
  onChange,
}: {
  name: string;
  options: { id: T; label: string }[];
  value?: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {options.map((opt) => {
        const selected = value === opt.id;
        return (
          <label
            key={opt.id}
            className={`flex cursor-pointer items-center gap-3 border px-4 py-3 transition-colors ${
              selected
                ? "border-[var(--brand)] bg-[var(--brand)]/10"
                : "border-[var(--rule)] hover:border-[var(--rule-strong)]"
            }`}
          >
            <input
              type="radio"
              name={name}
              checked={selected}
              onChange={() => onChange(opt.id)}
              className="sr-only"
            />
            <span
              aria-hidden
              className={`flex h-3.5 w-3.5 items-center justify-center rounded-full border ${
                selected
                  ? "border-[var(--brand)] bg-[var(--brand)]"
                  : "border-[var(--rule-strong)]"
              }`}
            >
              {selected && <span className="h-1.5 w-1.5 rounded-full bg-[var(--bg)]" />}
            </span>
            <span
              className={`font-mono text-[12px] uppercase tracking-[0.12em] ${
                selected ? "text-[var(--ink)]" : "text-[var(--ink-dim)]"
              }`}
            >
              {opt.label}
            </span>
          </label>
        );
      })}
    </div>
  );
}

function ConfirmReview({ form }: { form: FormState }) {
  const entityLabel =
    ENTITY_OPTIONS.find((e) => e.id === form.entity)?.label ?? "—";
  const aumLabel = AUM_OPTIONS.find((a) => a.id === form.aum)?.label ?? "—";
  return (
    <div>
      <dl className="flex flex-col divide-y divide-[var(--rule)] border border-[var(--rule)]">
        <ReviewRow label="Entity" value={entityLabel} />
        <ReviewRow label="Jurisdiction" value={form.jurisdiction ?? "—"} />
        <ReviewRow label="AUM range" value={aumLabel} />
      </dl>
      <p className="mt-6 font-sans text-sm leading-[1.6] text-[var(--ink-dim)]">
        Submitting initiates a pre-approval review by the Vaulx LP analyst
        team. On approval, Tokeny ERC-3643 issues your on-chain identity
        credential. You can fund a vault immediately after credential receipt.
      </p>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-4 py-3">
      <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
        {label}
      </dt>
      <dd className="font-mono text-sm text-[var(--ink)] tabnums">{value}</dd>
    </div>
  );
}

function SuccessState() {
  return (
    <div className="py-6 text-center">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[var(--brand)] bg-[var(--brand)]/10 font-mono text-xl text-[var(--brand)]">
        ✓
      </div>
      <h2 className="mt-6 font-display text-2xl font-semibold tracking-[-0.01em] text-[var(--ink)]">
        Pre-approved.
      </h2>
      <p className="mt-3 font-sans text-sm leading-[1.65] text-[var(--ink-dim)]">
        A Vaulx LP analyst will be in touch within 48h to complete identity
        issuance and onboard your wallet.
      </p>
      <Link
        href="/demo/lend"
        className="mt-8 inline-flex items-center gap-2 border border-[var(--brand)] bg-[var(--brand)] px-5 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--bg)]"
      >
        Return to dashboard →
      </Link>
    </div>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden
      className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-[1.5px] border-current border-t-transparent"
    />
  );
}
