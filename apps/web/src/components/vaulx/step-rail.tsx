"use client";

import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const STEPS = [
  { key: "civic", label: "Civic", match: ["/borrow/verify-id"] },
  { key: "govbr", label: "gov.br", match: ["/borrow/verify-id", "/borrow/new/asset"] },
  { key: "asset", label: "Asset", match: ["/borrow/new/asset"] },
  {
    key: "terms",
    label: "Terms",
    match: ["/borrow/new/appraisal", "/borrow/new/terms"]
  },
  { key: "custody", label: "Custody", match: ["/borrow/new/awaiting-custody"] }
] as const;

function activeIndex(path: string | null): number {
  if (!path) return 0;
  if (path.startsWith("/borrow/new/awaiting-custody")) return 4;
  if (path.startsWith("/borrow/new/terms") || path.startsWith("/borrow/new/appraisal")) return 3;
  if (path.startsWith("/borrow/new/asset")) return 2;
  if (path.startsWith("/borrow/verify-id")) return 1;
  return 2;
}

export function StepRail() {
  const pathname = usePathname();
  const activeIdx = activeIndex(pathname);

  return (
    <div className="border-b border-[var(--rule)] bg-[var(--bg)]">
      <div className="mx-auto flex w-full max-w-[1440px] items-center gap-4 px-6 py-5 md:px-10">
        <span className="hidden font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--ink-muted)] md:inline-block">
          Borrower Journey ·
        </span>

        <ol className="flex flex-1 items-center gap-3 overflow-x-auto md:gap-5">
          {STEPS.map((step, i) => {
            const done = i < activeIdx;
            const current = i === activeIdx;
            return (
              <li key={step.key} className="flex shrink-0 items-center gap-3">
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center border font-mono text-[10px] tabular-nums transition-colors",
                      current &&
                        "border-[var(--brand)] bg-[var(--brand)] text-[var(--bg)]",
                      done &&
                        "border-[var(--brand)] text-[var(--brand)] bg-transparent",
                      !done && !current &&
                        "border-[var(--rule)] text-[var(--ink-muted)]"
                    )}
                  >
                    {done ? (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        className="h-3 w-3"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      (i + 1).toString().padStart(2, "0")
                    )}
                  </span>
                  <span
                    className={cn(
                      "font-mono text-[11px] uppercase tracking-[0.16em]",
                      current && "text-[var(--brand)]",
                      done && "text-[var(--ink-dim)]",
                      !done && !current && "text-[var(--ink-muted)]"
                    )}
                  >
                    {step.label}
                  </span>
                </span>
                {i < STEPS.length - 1 && (
                  <span
                    aria-hidden
                    className={cn(
                      "hidden h-px w-8 md:block",
                      done ? "bg-[var(--brand)]" : "bg-[var(--rule)]"
                    )}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
