"use client";

/**
 * <DemoCockpit/> — client-side orchestrator for the /admin/demo cockpit.
 *
 * Renders six large editorial buttons (one per moment), a reset button, an
 * "Accelerate time" toggle, and a rolling status log. Each button POSTs to a
 * per-moment API route; responses include the tx signature which gets piped
 * into the log + the explorer link on the button face.
 *
 * Cross-button state: moments 02–05 all operate on the TRDC PDA minted in
 * moment 02. We hold it in component state; buttons are disabled until a
 * TRDC has been minted.
 */

import { useCallback, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type Phase = "pending" | "running" | "done" | "failed";

type MomentKey = "01" | "02" | "03" | "04" | "05" | "06";

type LogEvent = {
  at: number;
  source: MomentKey | "RESET" | "SYSTEM";
  level: "info" | "ok" | "warn" | "error";
  message: string;
};

type MomentState = {
  phase: Phase;
  signature?: string;
  detail?: string;
};

type DemoResponse = {
  ok: boolean;
  signature?: string;
  signatures?: Record<string, string>;
  detail: string;
  state?: Record<string, unknown>;
};

interface MomentDef {
  key: MomentKey;
  numeral: string;
  title: string;
  description: string;
  endpoint: string;
  needsTrdc: boolean;
  buildBody?: (ctx: { trdc: string | null; fast: boolean }) => Record<string, unknown> | null;
  appendFastQuery?: boolean;
}

const MOMENTS: MomentDef[] = [
  {
    key: "01",
    numeral: "01",
    title: "Seed pool",
    description: "Lender deposits 100 USDC into the vault.",
    endpoint: "/api/admin/demo/seed-pool",
    needsTrdc: false,
  },
  {
    key: "02",
    numeral: "02",
    title: "Mint TRDC",
    description: "Borrower mints a TRDC against a 100 USDC Rolex at 60% LTV.",
    endpoint: "/api/admin/demo/mint-trdc",
    needsTrdc: false,
    buildBody: () => ({ ltvBps: 6000, termDays: 30, appraisalUsdc: "100000000" }),
  },
  {
    key: "03",
    numeral: "03",
    title: "Confirm custody",
    description: "Custodian attests safekeeping with a fresh doc_hash.",
    endpoint: "/api/admin/demo/confirm-custody",
    needsTrdc: true,
    buildBody: ({ trdc }) => (trdc ? { trdc } : null),
  },
  {
    key: "04",
    numeral: "04",
    title: "Disburse",
    description: "Borrower pulls principal out of the vault into their ATA.",
    endpoint: "/api/admin/demo/disburse",
    needsTrdc: true,
    buildBody: ({ trdc }) => (trdc ? { trdc } : null),
  },
  {
    key: "05",
    numeral: "05",
    title: "Simulate repay",
    description: "Borrower repays principal + accrued interest. TRDC → Repaid.",
    endpoint: "/api/admin/demo/repay",
    needsTrdc: true,
    buildBody: ({ trdc }) => (trdc ? { trdc } : null),
  },
  {
    key: "06",
    numeral: "06",
    title: "Default → auction",
    description:
      "Parallel overdue loan → `execute_af_default` → winning bid → close.",
    endpoint: "/api/admin/demo/default-and-auction",
    needsTrdc: false,
    buildBody: ({ fast }) => ({ fast }),
    appendFastQuery: true,
  },
];

const EXPLORER_BASE = "https://explorer.solana.com/tx";

function shortSig(sig: string, width = 6): string {
  if (!sig) return "";
  if (sig.length <= width * 2 + 1) return sig;
  return `${sig.slice(0, width)}…${sig.slice(-width)}`;
}

export function DemoCockpit() {
  const [trdc, setTrdc] = useState<string | null>(null);
  const [fast, setFast] = useState<boolean>(true);
  const [moments, setMoments] = useState<Record<MomentKey, MomentState>>({
    "01": { phase: "pending" },
    "02": { phase: "pending" },
    "03": { phase: "pending" },
    "04": { phase: "pending" },
    "05": { phase: "pending" },
    "06": { phase: "pending" },
  });
  const [log, setLog] = useState<LogEvent[]>([]);
  const logRef = useRef<HTMLDivElement | null>(null);

  const appendLog = useCallback((e: Omit<LogEvent, "at">) => {
    setLog((prev) => {
      const next = [...prev, { ...e, at: Date.now() }];
      // cap at ~200 entries so the panel doesn't grow unbounded on stage
      return next.slice(-200);
    });
    requestAnimationFrame(() => {
      const el = logRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }, []);

  const setMoment = useCallback((key: MomentKey, next: Partial<MomentState>) => {
    setMoments((m) => ({ ...m, [key]: { ...m[key], ...next } }));
  }, []);

  const runMoment = useCallback(
    async (def: MomentDef) => {
      const body = def.buildBody ? def.buildBody({ trdc, fast }) : undefined;
      if (def.buildBody && !body) {
        appendLog({
          source: def.key,
          level: "warn",
          message: "Skipped — mint a TRDC first (Moment 02).",
        });
        return;
      }

      setMoment(def.key, { phase: "running", detail: undefined });
      appendLog({
        source: def.key,
        level: "info",
        message: `POST ${def.endpoint}${def.appendFastQuery ? `?fast=${fast}` : ""}`,
      });

      const url =
        def.endpoint +
        (def.appendFastQuery ? `?fast=${fast ? "true" : "false"}` : "");

      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: body ? JSON.stringify(body) : "{}",
        });
        const json = (await res.json()) as DemoResponse;

        if (!res.ok || !json.ok) {
          setMoment(def.key, {
            phase: "failed",
            detail: json.detail,
            signature: json.signature,
          });
          appendLog({
            source: def.key,
            level: "error",
            message: `FAIL ${res.status}: ${json.detail}`,
          });
          return;
        }

        // Moment 02 returns the TRDC PDA — stash it for later buttons.
        if (def.key === "02" && json.state && typeof json.state.trdc === "string") {
          setTrdc(json.state.trdc);
          appendLog({
            source: def.key,
            level: "info",
            message: `trdc=${shortSig(json.state.trdc as string, 8)}`,
          });
        }

        setMoment(def.key, {
          phase: "done",
          signature: json.signature,
          detail: json.detail,
        });
        appendLog({
          source: def.key,
          level: "ok",
          message: json.detail,
        });
        if (json.signature) {
          appendLog({
            source: def.key,
            level: "info",
            message: `sig=${json.signature}`,
          });
        }
        if (json.signatures) {
          for (const [k, v] of Object.entries(json.signatures)) {
            appendLog({
              source: def.key,
              level: "info",
              message: `${k}=${v}`,
            });
          }
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setMoment(def.key, { phase: "failed", detail: msg });
        appendLog({
          source: def.key,
          level: "error",
          message: `network error: ${msg}`,
        });
      }
    },
    [trdc, fast, setMoment, appendLog],
  );

  const onReset = useCallback(async () => {
    appendLog({ source: "RESET", level: "info", message: "POST /api/admin/demo/reset" });
    try {
      const res = await fetch("/api/admin/demo/reset", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      });
      const json = (await res.json()) as DemoResponse;
      appendLog({
        source: "RESET",
        level: json.ok ? "ok" : "warn",
        message: json.detail,
      });
    } catch (e) {
      appendLog({
        source: "RESET",
        level: "error",
        message: `reset failed: ${e instanceof Error ? e.message : String(e)}`,
      });
    }
    setTrdc(null);
    setMoments({
      "01": { phase: "pending" },
      "02": { phase: "pending" },
      "03": { phase: "pending" },
      "04": { phase: "pending" },
      "05": { phase: "pending" },
      "06": { phase: "pending" },
    });
  }, [appendLog]);

  return (
    <div className="flex flex-col gap-10">
      {/* Controls strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 border border-[var(--rule)] bg-[var(--bg-elev-1)] px-6 py-4">
        <div className="flex items-center gap-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--ink-muted)]">
            TRDC
          </span>
          <span className="font-mono text-xs text-[var(--ink)]">
            {trdc ? shortSig(trdc, 8) : "— not minted —"}
          </span>
          <button
            type="button"
            onClick={() => setFast((f) => !f)}
            className={cn(
              "ml-6 flex h-8 items-center gap-2 border px-3 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors",
              fast
                ? "border-[var(--brand)] bg-[var(--brand-wash)] text-[var(--brand)]"
                : "border-[var(--rule-strong)] text-[var(--ink-dim)] hover:text-[var(--ink)]",
            )}
            aria-pressed={fast}
          >
            <span
              aria-hidden
              className={cn(
                "inline-block h-2 w-2 rounded-full",
                fast ? "bg-[var(--brand)]" : "bg-[var(--ink-muted)]",
              )}
            />
            Accelerate time {fast ? "ON" : "OFF"}
          </button>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="flex h-9 items-center border border-[var(--rule-strong)] px-4 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--ink-dim)] transition-colors hover:border-[var(--brand)] hover:text-[var(--brand)]"
        >
          Reset cockpit
        </button>
      </div>

      {/* 3×2 grid of big buttons */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {MOMENTS.map((m) => {
          const state = moments[m.key];
          const disabled = state.phase === "running" || (m.needsTrdc && !trdc);
          return (
            <MomentButton
              key={m.key}
              def={m}
              state={state}
              disabled={disabled}
              onClick={() => runMoment(m)}
            />
          );
        })}
      </div>

      {/* Status log */}
      <div className="flex flex-col border border-[var(--rule)] bg-[var(--bg-elev-1)]">
        <div className="flex items-center justify-between border-b border-[var(--rule)] px-5 py-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--ink-muted)]">
            Status log · {log.length} events
          </div>
          <button
            type="button"
            onClick={() => setLog([])}
            className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--ink-muted)] hover:text-[var(--ink)]"
          >
            clear
          </button>
        </div>
        <div
          ref={logRef}
          className="max-h-[320px] min-h-[160px] overflow-y-auto px-5 py-4 font-mono text-xs leading-6 text-[var(--ink-dim)]"
        >
          {log.length === 0 ? (
            <div className="text-[var(--ink-muted)]">
              idle — click a moment to begin
            </div>
          ) : (
            log.map((e, i) => (
              <div key={i} className="flex gap-3">
                <span className="text-[var(--ink-muted)]">
                  {new Date(e.at).toLocaleTimeString([], {
                    hour12: false,
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>
                <span
                  className={cn(
                    "w-[3.5rem] shrink-0 uppercase tracking-[0.14em]",
                    e.source === "SYSTEM" || e.source === "RESET"
                      ? "text-[var(--ink-muted)]"
                      : "text-[var(--brand)]",
                  )}
                >
                  {e.source}
                </span>
                <span
                  className={cn(
                    "break-all",
                    e.level === "error" && "text-[var(--signal-bad)]",
                    e.level === "ok" && "text-[var(--signal-good)]",
                    e.level === "warn" && "text-[var(--signal-warn)]",
                  )}
                >
                  {e.message}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

interface MomentButtonProps {
  def: MomentDef;
  state: MomentState;
  disabled: boolean;
  onClick: () => void;
}

function MomentButton({ def, state, disabled, onClick }: MomentButtonProps) {
  const pillClass =
    state.phase === "done"
      ? "border-[var(--signal-good)] text-[var(--signal-good)]"
      : state.phase === "running"
        ? "border-[var(--brand)] text-[var(--brand)]"
        : state.phase === "failed"
          ? "border-[var(--signal-bad)] text-[var(--signal-bad)]"
          : "border-[var(--rule-strong)] text-[var(--ink-muted)]";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group relative flex flex-col justify-between border border-[var(--rule)] bg-[var(--bg-elev-1)] p-6 text-left transition-colors",
        "hover:border-[var(--brand)] hover:bg-[var(--bg-elev-2)]",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-[var(--rule)] disabled:hover:bg-[var(--bg-elev-1)]",
        "min-h-[220px]",
      )}
    >
      <div className="flex items-start justify-between">
        <span
          className="font-display font-extrabold leading-none text-[var(--ink)]"
          style={{
            fontSize: "clamp(3rem, 6vw, 4.25rem)",
            fontVariationSettings: '"opsz" 144',
          }}
        >
          {def.numeral}
        </span>
        <span
          className={cn(
            "flex items-center gap-2 border px-2 py-1 font-mono text-[9px] uppercase tracking-[0.22em]",
            pillClass,
          )}
        >
          {state.phase === "running" && (
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
          )}
          {state.phase}
        </span>
      </div>

      <div className="mt-6 flex flex-col gap-2">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--ink-muted)]">
          Moment {def.numeral}
        </div>
        <div className="font-display text-[1.35rem] font-semibold leading-tight text-[var(--ink)]">
          {def.title}
        </div>
        <p className="font-sans text-sm leading-snug text-[var(--ink-dim)]">
          {def.description}
        </p>
      </div>

      {state.signature ? (
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--rule)] pt-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--ink-muted)]">
            tx
          </span>
          <a
            href={`${EXPLORER_BASE}/${state.signature}?cluster=devnet`}
            target="_blank"
            rel="noreferrer noopener"
            onClick={(e) => e.stopPropagation()}
            className="truncate font-mono text-[11px] text-[var(--brand)] hover:underline"
          >
            {shortSig(state.signature, 6)} ↗
          </a>
        </div>
      ) : (
        <div className="mt-4 h-[28px] border-t border-[var(--rule)] pt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--ink-muted)]">
          {state.phase === "failed" ? "failed · retry" : "awaiting click"}
        </div>
      )}
    </button>
  );
}
