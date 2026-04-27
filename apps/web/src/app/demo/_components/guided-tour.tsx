"use client";
// React-native guided tour overlay — simpler than driver.js with React lifecycles.
// Renders a fixed centered popover (or near a `selector` element if provided),
// reads/writes `session.tour.{active,step,history,resumable}`, and pushes the
// router to the next step's route on advance. Step 9 (AHA moment) only advances
// once `session.loan.disbursedAt` is set.
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useDemoSession } from "../_lib/use-demo-session";
import { TOUR_STEPS } from "../_lib/tour-steps";
import { TOUR_STEPS_TOTAL } from "../_lib/types";

export function GuidedTour() {
  const router = useRouter();
  const pathname = usePathname();
  const { session, patch } = useDemoSession();
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

  const active = !!session?.tour.active;
  const stepIndex = session?.tour.step ?? 0;
  const step = TOUR_STEPS[stepIndex];

  // Track the highlight target's bounding rect when on the right route.
  useEffect(() => {
    if (!active || !step?.selector) {
      setHighlightRect(null);
      return;
    }
    if (pathname && !pathname.startsWith(step.route)) {
      setHighlightRect(null);
      return;
    }
    const update = () => {
      const el = document.querySelector(step.selector!);
      if (el instanceof HTMLElement) {
        setHighlightRect(el.getBoundingClientRect());
      } else {
        setHighlightRect(null);
      }
    };
    update();
    const t = setInterval(update, 500);
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      clearInterval(t);
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [active, step?.selector, step?.route, pathname]);

  // Auto-resume when the AHA-moment disburse step's wait condition is met:
  // once disbursedAt is set, advance to step 10.
  useEffect(() => {
    if (!active || !step) return;
    if (!step.pauseAfter) return;
    if (session?.loan?.disbursedAt && stepIndex === step.index) {
      // Don't auto-advance — keep step counter where it is, but mark resumable.
      // The user clicks "Continue tour" themselves.
    }
  }, [active, step, session?.loan?.disbursedAt, stepIndex]);

  const next = () => {
    if (!step) return;
    const nextIdx = Math.min(TOUR_STEPS_TOTAL - 1, stepIndex + 1);
    const nextStep = TOUR_STEPS[nextIdx];
    patch((s) => ({
      ...s,
      tour: {
        ...s.tour,
        step: nextIdx,
        history: [...s.tour.history, stepIndex],
        resumable: true,
      },
    }));
    if (nextStep && !pathname?.startsWith(nextStep.route)) {
      router.push(nextStep.route);
    }
  };

  const prev = () => {
    if (stepIndex === 0) return;
    patch((s) => {
      const history = [...s.tour.history];
      const last = history.pop() ?? Math.max(0, stepIndex - 1);
      return {
        ...s,
        tour: { ...s.tour, step: last, history, resumable: true },
      };
    });
    const prevStep = TOUR_STEPS[Math.max(0, stepIndex - 1)];
    if (prevStep && !pathname?.startsWith(prevStep.route)) {
      router.push(prevStep.route);
    }
  };

  const skip = () => {
    patch((s) => ({
      ...s,
      tour: { ...s.tour, active: false, resumable: stepIndex > 0 },
    }));
  };

  const restart = () => {
    patch((s) => ({
      ...s,
      tour: { active: true, step: 0, resumable: true, history: [] },
    }));
    router.push("/demo");
  };

  if (!session || !active || !step) return null;

  // For pauseAfter (step 9): only allow "Continue tour after the moment" once
  // the loan has been disbursed.
  const blocked = !!step.pauseAfter && !session.loan?.disbursedAt;
  const onCorrectRoute = !!pathname?.startsWith(step.route);

  return (
    <div className="pointer-events-none fixed inset-0 z-[60]">
      {/* Backdrop — soft, lets the page show through */}
      <div
        aria-hidden
        className="pointer-events-auto absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        onClick={skip}
      />

      {/* Brass ring on highlighted element */}
      {highlightRect && (
        <div
          aria-hidden
          className="pointer-events-none absolute rounded-md"
          style={{
            top: highlightRect.top - 6,
            left: highlightRect.left - 6,
            width: highlightRect.width + 12,
            height: highlightRect.height + 12,
            boxShadow:
              "0 0 0 4px rgba(212, 175, 55, 0.55), 0 0 0 9999px rgba(0,0,0,0.5)",
            transition: "all 0.25s ease-out",
          }}
        />
      )}

      {/* Popover */}
      <div
        role="dialog"
        aria-label="Guided tour"
        className="pointer-events-auto absolute left-1/2 top-1/2 w-[min(92vw,520px)] -translate-x-1/2 -translate-y-1/2 rounded-md border border-[var(--rule-strong)] bg-[var(--bg-elev-2)] p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--ink-muted)]">
          <span>
            Step {step.index + 1} / {TOUR_STEPS_TOTAL}
          </span>
          <button
            type="button"
            onClick={skip}
            className="text-[var(--ink-muted)] hover:text-[var(--ink)]"
          >
            Skip ×
          </button>
        </div>

        <h2 className="mt-4 font-display text-xl font-semibold leading-tight tracking-tight text-[var(--ink)]">
          {step.headline}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--ink-dim)]">
          {step.caption}
        </p>

        {!onCorrectRoute && (
          <p className="mt-4 rounded-sm border border-[var(--brand)]/30 bg-[var(--brand)]/5 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--brand)]">
            Walk to {step.route}
          </p>
        )}

        {step.pauseAfter && blocked && (
          <p className="mt-4 rounded-sm border border-rose-500/30 bg-rose-500/5 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-rose-300">
            Tap Release on this page to continue the tour.
          </p>
        )}

        <div className="mt-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={prev}
              disabled={stepIndex === 0}
              className="rounded-md border border-[var(--rule)] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-dim)] disabled:opacity-40"
            >
              Back
            </button>
            <button
              type="button"
              onClick={restart}
              className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)] hover:text-[var(--ink)]"
            >
              Restart
            </button>
          </div>
          {step.pauseAfter && blocked ? (
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
              Awaiting disburse…
            </span>
          ) : stepIndex >= TOUR_STEPS_TOTAL - 1 ? (
            <button
              type="button"
              onClick={skip}
              className="rounded-md bg-[var(--brand)] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--bg)]"
            >
              Finish tour
            </button>
          ) : (
            <button
              type="button"
              onClick={next}
              className="rounded-md bg-[var(--brand)] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--bg)]"
            >
              {step.pauseAfter ? "Continue tour" : "Next →"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
