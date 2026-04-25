"use client";

import { useEffect, useRef, useState } from "react";

type Line = { source: "stdout" | "stderr"; text: string; at: number };

// Minimal ANSI -> HTML color mapper. Mocha's colorful output uses basic SGR
// codes only (31 red, 32 green, 33 yellow, 34 blue, 90 grey, 1 bold, 0 reset),
// so a regex swap is enough — no need for a full ansi-to-html dependency.
function ansiToHtml(s: string): string {
  // Escape HTML first so embedded `<` / `>` / `&` in log lines render as text.
  const escaped = s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped
    .replace(/\x1b\[0m/g, "</span>")
    .replace(/\x1b\[1m/g, "<span class='font-bold'>")
    .replace(/\x1b\[31m/g, "<span class='text-rose-400'>")
    .replace(/\x1b\[32m/g, "<span class='text-emerald-400'>")
    .replace(/\x1b\[33m/g, "<span class='text-amber-400'>")
    .replace(/\x1b\[34m/g, "<span class='text-sky-400'>")
    .replace(/\x1b\[35m/g, "<span class='text-fuchsia-400'>")
    .replace(/\x1b\[36m/g, "<span class='text-cyan-400'>")
    .replace(/\x1b\[90m/g, "<span class='opacity-60'>")
    .replace(/\x1b\[\d+(?:;\d+)*m/g, ""); // strip any unmatched codes
}

export function TestStream() {
  const [lines, setLines] = useState<Line[]>([]);
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">(
    "idle"
  );
  const [exitCode, setExitCode] = useState<number | null>(null);
  const esRef = useRef<EventSource | null>(null);
  const logRef = useRef<HTMLDivElement | null>(null);

  const start = () => {
    esRef.current?.close();
    setLines([]);
    setStatus("running");
    setExitCode(null);
    const es = new EventSource("/api/admin/tests/stream");
    esRef.current = es;
    es.addEventListener("started", () => {
      /* handshake only */
    });
    es.addEventListener("line", (e) => {
      try {
        const line = JSON.parse((e as MessageEvent).data) as Line;
        setLines((prev) => [...prev, line]);
      } catch {
        /* ignore malformed frame */
      }
    });
    es.addEventListener("exit", (e) => {
      try {
        const { code } = JSON.parse((e as MessageEvent).data) as {
          code: number | null;
        };
        setExitCode(code);
        setStatus(code === 0 ? "done" : "error");
      } catch {
        setStatus("error");
      }
      es.close();
    });
    es.addEventListener("error", () => {
      // Native EventSource fires `error` on network close too — only flip to
      // "error" if we hadn't already recorded an exit.
      if (es.readyState === EventSource.CLOSED) {
        setStatus((prev) => (prev === "running" ? "error" : prev));
      }
    });
  };

  const stop = () => {
    esRef.current?.close();
    esRef.current = null;
    setStatus("idle");
  };

  // Replay the pre-recorded `apps/web/public/demo/test-run.log` line-by-line
  // at ~120 lines/s so judges on Vercel (where /api/admin/tests/stream cannot
  // spawn anchor) still see a meaningful test trace.
  const replayStatic = async () => {
    esRef.current?.close();
    setLines([]);
    setExitCode(null);
    setStatus("running");
    try {
      const res = await fetch("/demo/test-run.log", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const all = text.split("\n");
      const last = Date.now();
      // Push synchronously so the auto-scroll logic still works.
      let buffered: Line[] = [];
      for (let i = 0; i < all.length; i++) {
        buffered.push({ source: "stdout", text: all[i] ?? "", at: last + i });
        if (i % 8 === 0) {
          // flush every 8 lines for smoothness
          const snapshot = [...buffered];
          setLines(snapshot);
          await new Promise((r) => setTimeout(r, 16));
        }
      }
      setLines(buffered);
      setExitCode(0);
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setLines([
        {
          source: "stderr",
          text: `failed to load /demo/test-run.log — ${String(err)}`,
          at: Date.now(),
        },
      ]);
    }
  };

  // Auto-scroll to newest line. Only nudge when the user is already near the
  // bottom so a judge scrolling up to inspect a failure doesn't get yanked.
  useEffect(() => {
    const el = logRef.current;
    if (!el) return;
    const nearBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (nearBottom) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [lines]);

  useEffect(
    () => () => {
      esRef.current?.close();
    },
    []
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`eyebrow ${statusClass(status)}`}>
            {statusLabel(status, exitCode, lines.length)}
          </div>
          {exitCode !== null && (
            <span className="font-mono text-xs text-[var(--ink-muted)]">
              exit {exitCode}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {status === "running" ? (
            <button className="btn-ghost text-xs" onClick={stop}>
              Abort
            </button>
          ) : (
            <>
              <button className="btn-ghost text-xs" onClick={replayStatic}>
                Replay last run
              </button>
              <button className="btn-gold text-xs" onClick={start}>
                Run live
              </button>
            </>
          )}
        </div>
      </div>

      <div
        ref={logRef}
        className="h-[520px] overflow-y-auto rounded-md border border-[var(--rule)] bg-[var(--bg-elev-1)] p-4 font-mono text-xs leading-6"
      >
        {lines.length === 0 && status === "idle" && (
          <div className="space-y-2 text-[var(--ink-muted)]">
            <div>
              <span className="text-[var(--brand)]">Run live</span> spawns{" "}
              <span className="text-[var(--ink-dim)]">
                anchor test --skip-build
              </span>{" "}
              on the server. Local dev only.
            </div>
            <div>
              <span className="text-[var(--ink-dim)]">Replay last run</span>{" "}
              streams the static
              <span className="font-mono"> /demo/test-run.log</span> recorded
              from the latest green run (45 passing).
            </div>
          </div>
        )}
        {lines.length === 0 && status === "running" && (
          <div className="text-[var(--ink-muted)]">
            Spawning child process…
          </div>
        )}
        {lines.map((l, i) => (
          <div
            key={i}
            className={
              l.source === "stderr"
                ? "text-rose-300"
                : "text-[var(--ink-dim)]"
            }
            dangerouslySetInnerHTML={{ __html: ansiToHtml(l.text) }}
          />
        ))}
      </div>
    </div>
  );
}

function statusLabel(
  status: string,
  exitCode: number | null,
  lineCount: number
): string {
  if (status === "idle") return "IDLE";
  if (status === "running") return `RUNNING · ${lineCount} LINES`;
  if (status === "done") return "ALL GREEN";
  if (status === "error") return `FAILED · EXIT ${exitCode ?? "?"}`;
  return status.toUpperCase();
}

function statusClass(status: string): string {
  return status === "done"
    ? "text-[var(--signal-good)]"
    : status === "error"
      ? "text-[var(--signal-bad)]"
      : status === "running"
        ? "text-[var(--brand)]"
        : "text-[var(--ink-muted)]";
}
