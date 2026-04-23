#!/usr/bin/env node
// Generates typed anchor clients for all Vaulx programs from their IDLs.
// Usage: node scripts/dev/gen-clients.mjs
import { execFileSync } from "node:child_process";
import { readFileSync, rmSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, "..", "..");

const programs = ["trdc", "vault", "loan", "auction"];
const idlsDir = resolve(repoRoot, "packages/idls/src");
const outRoot = resolve(repoRoot, "packages/anchor-client/src/generated");

console.log(`[gen-clients] repo root: ${repoRoot}`);
console.log(`[gen-clients] cleaning ${outRoot}`);
rmSync(outRoot, { recursive: true, force: true });
mkdirSync(outRoot, { recursive: true });

for (const name of programs) {
  const idlPath = resolve(idlsDir, `${name}.json`);
  if (!existsSync(idlPath)) {
    console.error(`[gen-clients] missing IDL: ${idlPath}`);
    process.exit(1);
  }
  const idl = JSON.parse(readFileSync(idlPath, "utf8"));
  const address = idl.address;
  if (!address) {
    console.error(`[gen-clients] IDL ${idlPath} missing .address`);
    process.exit(1);
  }
  const outDir = resolve(outRoot, name);
  console.log(`[gen-clients] ${name} -> ${outDir} (program ${address})`);
  try {
    execFileSync(
      "npx",
      [
        "--yes",
        "anchor-client-gen@latest",
        "--program-id",
        address,
        idlPath,
        outDir,
      ],
      { stdio: "inherit", cwd: repoRoot },
    );
  } catch (err) {
    console.error(`[gen-clients] failed for ${name}: ${err.message}`);
    process.exit(1);
  }
}

console.log("[gen-clients] done");
