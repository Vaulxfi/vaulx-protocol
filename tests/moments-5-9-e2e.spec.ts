import { spawnSync } from "node:child_process";
import path from "node:path";

// Moments 5 + 6 + 7 + 8 + 9 E2E: pay -> renew -> repay (Loan A) then
// default -> auction -> bid -> close (Loan B), each round-tripped through
// the indexer into Supabase.
//
// Delegates to scripts/dev/moments-5-9-e2e.ts so the harness is also
// runnable standalone via `pnpm exec tsx scripts/dev/moments-5-9-e2e.ts`.
//
// Timeout is 240s — the auction close path does a wall-clock sleep for
// `duration_secs + 2` between bid and close.
//
// Exit codes from the script:
//   0 -> pass
//   2 -> SKIPPED (env/funding/vault-liquidity not set up; CI-friendly)
//   *   -> fail with captured stdout/stderr
describe("moments 5-9 / e2e happy path", function () {
  this.timeout(240_000);

  it("pay -> renew -> repay then default -> auction -> bid -> close", function () {
    const repoRoot = path.resolve(__dirname, "..");
    const scriptPath = path.join(
      repoRoot,
      "scripts",
      "dev",
      "moments-5-9-e2e.ts",
    );

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
        `moments-5-9-e2e.ts exited with status ${res.status}\n${out}`,
      );
    }
  });
});
