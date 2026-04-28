/**
 * Transfer upgrade authority of all 4 Vaulx programs to the Squads V4 multisig vault PDA.
 *
 * Reads scripts/dev/squads-multisig.json for the multisig + vault addresses.
 * Reads scripts/dev/devnet-deploy.json for the program IDs.
 *
 * Issues `solana program set-upgrade-authority <PROGRAM_ID> --new-upgrade-authority <VAULT_PDA>`
 * for each program. The current upgrade authority (payer) signs the change.
 *
 * After this runs, NO single keypair can upgrade these programs — only a 2-of-3
 * Squads vote can.
 *
 * Run: pnpm transfer:authorities [--mainnet] [--dry-run] [--include-treasury <amount>]
 *
 * IMPORTANT: This is NOT idempotent — once authority is transferred, you can't
 * undo it without a Squads vote. Use --dry-run first to preview.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const PAYER_KEYPAIR_PATH = path.join(os.homedir(), ".config", "solana", "id.json");
const SQUADS_FILE = path.resolve(__dirname, "squads-multisig.json");
const DEPLOY_FILE = path.resolve(__dirname, "devnet-deploy.json");

type Args = {
  mainnet: boolean;
  dryRun: boolean;
  includeTreasury: number | null;
  help: boolean;
};

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const out: Args = {
    mainnet: argv.includes("--mainnet"),
    dryRun: argv.includes("--dry-run"),
    includeTreasury: null,
    help: argv.includes("--help") || argv.includes("-h"),
  };
  const idx = argv.indexOf("--include-treasury");
  if (idx !== -1) {
    const val = argv[idx + 1];
    if (!val || val.startsWith("--")) {
      throw new Error("--include-treasury requires a SOL amount, e.g. --include-treasury 1.5");
    }
    const n = Number(val);
    if (!Number.isFinite(n) || n <= 0) {
      throw new Error(`--include-treasury amount must be a positive number; got ${val}`);
    }
    out.includeTreasury = n;
  }
  return out;
}

function printHelp() {
  process.stdout.write(
    `Usage: pnpm transfer:authorities [--mainnet] [--dry-run] [--include-treasury <SOL>]

  Transfers upgrade authority for all 4 Vaulx programs (trdc, vault, loan, auction)
  from the current payer keypair to the Squads V4 multisig vault PDA.

  Defaults to Devnet. Pass --mainnet to target mainnet-beta (explicit opt-in).

  --dry-run             Print the commands without executing.
  --include-treasury N  Also transfer N SOL from payer to the multisig vault PDA.
                        Opt-in only — default is no SOL transfer.

  NOT idempotent. After authority is transferred, only a 2/3 Squads vote
  can upgrade or change authority on these programs.
`,
  );
}

function loadJson<T>(filePath: string, label: string): T {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${label} not found at ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
}

function run(cmd: string): string {
  return execSync(cmd, { encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] });
}

type DeployFile = {
  cluster: string;
  upgrade_authority: string;
  programs: Record<string, { program_id: string }>;
  upgrade_authority_transferred_to?: string;
  upgrade_authority_transfer_tx?: string[];
  transferred_at?: string;
};

type SquadsFile = {
  cluster: string;
  multisigPda: string;
  vaultPda: string;
};

async function main() {
  const args = parseArgs();
  if (args.help) {
    printHelp();
    process.exit(0);
  }

  const cluster = args.mainnet ? "mainnet-beta" : "devnet";
  const urlFlag = args.mainnet ? "--url mainnet-beta" : "--url devnet";

  const squads = loadJson<SquadsFile>(SQUADS_FILE, "squads-multisig.json");
  const deploy = loadJson<DeployFile>(DEPLOY_FILE, "devnet-deploy.json");

  if (!args.mainnet && squads.cluster !== "devnet") {
    throw new Error(
      `squads-multisig.json cluster=${squads.cluster} but running on devnet. Refusing.`,
    );
  }
  if (args.mainnet && squads.cluster !== "mainnet-beta") {
    throw new Error(
      `--mainnet passed but squads-multisig.json cluster=${squads.cluster}. Refusing.`,
    );
  }

  const newAuthority = squads.vaultPda;
  console.log(`Cluster:        ${cluster}`);
  console.log(`Multisig PDA:   ${squads.multisigPda}`);
  console.log(`New authority:  ${newAuthority}  (vault PDA)`);
  console.log(`Payer keypair:  ${PAYER_KEYPAIR_PATH}`);
  console.log(`Dry run:        ${args.dryRun}`);
  console.log("");

  const orderedNames = ["trdc", "vault", "loan", "auction"];
  const programs: Array<{ name: string; programId: string }> = [];
  for (const name of orderedNames) {
    const entry = deploy.programs[name];
    if (!entry) throw new Error(`devnet-deploy.json missing programs.${name}`);
    programs.push({ name, programId: entry.program_id });
  }

  const transferResults: Array<{
    name: string;
    programId: string;
    oldAuthority: string;
    newAuthority: string;
    txSignature: string;
  }> = [];

  for (const { name, programId } of programs) {
    const cmd =
      `solana program set-upgrade-authority ${programId} ` +
      `--new-upgrade-authority ${newAuthority} ` +
      `--skip-new-upgrade-authority-signer-check ` +
      `--keypair ${PAYER_KEYPAIR_PATH} ${urlFlag}`;

    console.log(`[${name}] ${programId}`);
    console.log(`  cmd: ${cmd}`);

    if (args.dryRun) {
      console.log("  (dry-run — not executed)");
      console.log("");
      continue;
    }

    // Read current authority before transfer.
    let oldAuthority = "<unknown>";
    try {
      const showOut = run(`solana program show ${programId} ${urlFlag}`);
      const m = showOut.match(/Authority:\s*(\S+)/);
      if (m) oldAuthority = m[1];
    } catch (e) {
      console.warn(`  warn: could not read pre-transfer authority: ${(e as Error).message}`);
    }

    let txSignature = "";
    try {
      const out = run(cmd);
      console.log(out.trim().split("\n").map((l) => `  ${l}`).join("\n"));
      const sigMatch = out.match(/Signature:\s*(\S+)/i);
      if (sigMatch) txSignature = sigMatch[1];
    } catch (e) {
      const err = e as { stdout?: Buffer | string; stderr?: Buffer | string; message: string };
      const stderr = err.stderr ? err.stderr.toString() : "";
      const stdout = err.stdout ? err.stdout.toString() : "";
      console.error(`  FAILED: ${err.message}`);
      if (stdout) console.error(`  stdout: ${stdout}`);
      if (stderr) console.error(`  stderr: ${stderr}`);
      console.error(
        `\nAborting after ${transferResults.length}/${programs.length} successful transfers.`,
      );
      console.error("Re-run to retry the remaining programs after fixing the issue.");
      writeUpdatedDeployFile(deploy, transferResults, newAuthority);
      process.exit(1);
    }

    // Verify new authority.
    let postAuthority = "<unknown>";
    try {
      const showOut = run(`solana program show ${programId} ${urlFlag}`);
      const m = showOut.match(/Authority:\s*(\S+)/);
      if (m) postAuthority = m[1];
    } catch (e) {
      console.warn(`  warn: could not read post-transfer authority: ${(e as Error).message}`);
    }

    if (postAuthority !== newAuthority) {
      console.error(
        `  VERIFY FAILED: post-transfer Authority=${postAuthority}, expected ${newAuthority}`,
      );
      writeUpdatedDeployFile(deploy, transferResults, newAuthority);
      process.exit(1);
    }

    console.log(`  OK  ${oldAuthority} -> ${postAuthority}`);
    if (txSignature) console.log(`  tx  ${txSignature}`);
    console.log("");

    transferResults.push({
      name,
      programId,
      oldAuthority,
      newAuthority: postAuthority,
      txSignature,
    });
  }

  if (!args.dryRun) {
    writeUpdatedDeployFile(deploy, transferResults, newAuthority);
  }

  // Optional treasury SOL transfer.
  if (args.includeTreasury !== null) {
    console.log("");
    console.log(`Transferring ${args.includeTreasury} SOL to vault PDA ${newAuthority}...`);
    const transferCmd =
      `solana transfer ${newAuthority} ${args.includeTreasury} ` +
      `--keypair ${PAYER_KEYPAIR_PATH} ${urlFlag} ` +
      `--allow-unfunded-recipient`;
    console.log(`  cmd: ${transferCmd}`);
    if (args.dryRun) {
      console.log("  (dry-run — not executed)");
    } else {
      try {
        const out = run(transferCmd);
        console.log(out.trim().split("\n").map((l) => `  ${l}`).join("\n"));
      } catch (e) {
        const err = e as { stdout?: Buffer | string; stderr?: Buffer | string; message: string };
        console.error(`  FAILED: ${err.message}`);
        if (err.stderr) console.error(`  stderr: ${err.stderr.toString()}`);
        process.exit(1);
      }
    }
  }

  console.log("");
  if (args.dryRun) {
    console.log(`Dry run complete. ${programs.length} commands previewed.`);
  } else {
    console.log(`Done. ${transferResults.length}/${programs.length} programs transferred.`);
    for (const r of transferResults) {
      console.log(`  ${r.name.padEnd(8)} ${r.programId} -> ${r.newAuthority}`);
    }
  }
}

function writeUpdatedDeployFile(
  deploy: DeployFile,
  transferResults: Array<{ txSignature: string }>,
  newAuthority: string,
) {
  if (transferResults.length === 0) return;
  deploy.upgrade_authority_transferred_to = newAuthority;
  deploy.upgrade_authority_transfer_tx = transferResults.map((r) => r.txSignature);
  deploy.transferred_at = new Date().toISOString();
  fs.writeFileSync(DEPLOY_FILE, `${JSON.stringify(deploy, null, 2)}\n`);
  console.log(`Updated ${path.relative(process.cwd(), DEPLOY_FILE)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
