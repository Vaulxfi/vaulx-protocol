// SSE endpoint that spawns `anchor test --skip-build` and pipes stdout/stderr
// as Server-Sent Events. Consumed by the `<TestStream>` component at
// /admin/tests.
//
// Auth model (hackathon-grade):
//   If `NEXT_PUBLIC_VAULX_ADMIN_PUBKEY` is set, the handler requires a matching
//   value in the `vaulx-admin` cookie (or `x-vaulx-admin` header) before it
//   will spawn the child process. If the env var is absent the route is open
//   — this is intentional for demo/judging on localhost, and MUST be tightened
//   before any public deployment. EventSource cannot set custom headers so a
//   cookie is the only practical browser-side transport.
//
// Runtime caveats:
//   - `child_process.spawn` is a Node-only API, so the route must run on the
//     Node runtime (`runtime = "nodejs"`), not Edge.
//   - On Vercel serverless the function-duration limit (30s Hobby / 300s Pro)
//     will cut the stream before `anchor test` finishes (~3–4 min). This page
//     is therefore a local-demo surface; hosted deployments should serve a
//     cached log instead.
//   - The hardcoded PATH entries below are specific to this dev machine (the
//     mac where the hackathon demo runs). Portable enough for judges; not
//     production-shaped.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { spawn } from "node:child_process";
import path from "node:path";

export async function GET(req: Request) {
  // Hackathon-grade gate: only enforced when the admin pubkey env is set.
  const adminPubkey = process.env.NEXT_PUBLIC_VAULX_ADMIN_PUBKEY?.trim();
  if (adminPubkey) {
    const cookieHeader = req.headers.get("cookie") ?? "";
    const headerToken = req.headers.get("x-vaulx-admin")?.trim() ?? "";
    const cookieMatch = cookieHeader
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("vaulx-admin="));
    const cookieToken = cookieMatch
      ? decodeURIComponent(cookieMatch.slice("vaulx-admin=".length))
      : "";
    const provided = headerToken || cookieToken;
    if (provided !== adminPubkey) {
      return new Response("unauthorized", { status: 401 });
    }
  }

  const encoder = new TextEncoder();
  // Route handler CWD is `apps/web/`; walk up two levels to the repo root where
  // `anchor test` must run.
  const repoRoot = path.resolve(process.cwd(), "..", "..");

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;
      const close = () => {
        if (closed) return;
        closed = true;
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };
      const send = (event: string, data: unknown) => {
        if (closed) return;
        const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        try {
          controller.enqueue(encoder.encode(payload));
        } catch {
          /* controller was closed mid-write */
        }
      };

      send("started", { pid: 0, at: Date.now() });

      const child = spawn("anchor", ["test", "--skip-build"], {
        cwd: repoRoot,
        env: {
          ...process.env,
          // macOS dev-machine PATH. Contains solana + cargo + homebrew bins so
          // `anchor`, `solana`, and the sBPF toolchain resolve. Adjust for
          // other hosts.
          PATH:
            "/Users/gogy/.local/share/solana/install/active_release/bin:/Users/gogy/.cargo/bin:" +
            (process.env.PATH ?? ""),
          // Required on macOS per the repo's anchor-test pattern — stops the
          // filesystem from appending ._ AppleDouble files that break the
          // Anchor validator.
          COPYFILE_DISABLE: "1",
        },
        shell: false,
      });

      const emitLine =
        (source: "stdout" | "stderr") => (chunk: Buffer) => {
          const text = chunk.toString();
          for (const line of text.split("\n")) {
            if (line.length === 0) continue;
            send("line", { source, text: line, at: Date.now() });
          }
        };

      child.stdout?.on("data", emitLine("stdout"));
      child.stderr?.on("data", emitLine("stderr"));

      child.on("exit", (code, signal) => {
        send("exit", { code, signal, at: Date.now() });
        close();
      });

      child.on("error", (err) => {
        send("error", { message: String(err), at: Date.now() });
        close();
      });

      // Kill the child if the client disconnects — otherwise `anchor test`
      // orphans on the dev machine.
      req.signal.addEventListener("abort", () => {
        try {
          child.kill("SIGTERM");
        } catch {
          /* already exited */
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      // Hint to proxies (nginx, Vercel's edge) to not buffer the response.
      "X-Accel-Buffering": "no",
    },
  });
}
