import { spawnSync } from "node:child_process";
import path from "node:path";

// Moments 2 + 3 + 4 E2E: create_ccb_trdc -> confirm_custody -> disburse_from_vault,
// each round-tripped through the indexer into Supabase.
// Delegates to scripts/dev/moments-2-3-4-e2e.ts so the harness is also
// runnable standalone via `pnpm exec tsx scripts/dev/moments-2-3-4-e2e.ts`.
//
// Exit codes from the script:
//   0 -> pass
//   2 -> SKIPPED (env/funding/vault-liquidity not set up; CI-friendly)
//   *   -> fail with captured stdout/stderr
describe("moments 2+3+4 / e2e happy path", function () {
  this.timeout(180_000);

  it("create_ccb_trdc -> confirm_custody -> disburse_from_vault", function () {
    const repoRoot = path.resolve(__dirname, "..");
    const scriptPath = path.join(
      repoRoot,
      "scripts",
      "dev",
      "moments-2-3-4-e2e.ts",
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
        `moments-2-3-4-e2e.ts exited with status ${res.status}\n${out}`,
      );
    }
  });
});
