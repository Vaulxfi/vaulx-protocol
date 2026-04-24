import { spawnSync } from "node:child_process";
import path from "node:path";

// Moment 1 E2E: deposit -> indexer -> Supabase round trip.
// Delegates to scripts/dev/moment-1-e2e.ts so the harness is also runnable
// standalone via `pnpm exec tsx scripts/dev/moment-1-e2e.ts`.
//
// Exit codes from the script:
//   0 -> pass
//   2 -> SKIPPED (env/funding not set up; CI/localnet friendly)
//   *   -> fail with captured stdout/stderr
describe("moment 1 / e2e happy path", function () {
  this.timeout(120_000);

  it("deposit -> indexer -> Supabase", function () {
    const repoRoot = path.resolve(__dirname, "..");
    const scriptPath = path.join(repoRoot, "scripts", "dev", "moment-1-e2e.ts");

    const res = spawnSync("npx", ["tsx", scriptPath], {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: "pipe",
    });

    const out = `${res.stdout ?? ""}${res.stderr ?? ""}`;

    if (res.status === 2) {
      console.log(out.trim());
      this.skip();
      return;
    }
    if (res.status !== 0) {
      throw new Error(
        `moment-1-e2e.ts exited with status ${res.status}\n${out}`,
      );
    }
  });
});
