/**
 * One-shot multisig rollover: transfer the BPF Loader Upgradeable
 * upgrade authority of all four Vaulx programs (trdc, vault, loan,
 * auction) from the OLD Squads V4 multisig vault PDA to the NEW
 * Squads V4 multisig vault PDA created by George (see
 * §5 of docs/handoffs/2026-05-15-hotfix-deployed-edson-finalize.md).
 *
 * Mechanically:
 *   For each program:
 *     1. Build `BPFLoaderUpgradeable::SetAuthority` ix
 *        - signer = OLD vault PDA (program's current authority)
 *        - new_authority = NEW vault PDA
 *     2. Wrap in Squads V4 vault_transaction_create (vaultIndex=0)
 *     3. proposal_create + 2× proposal_approve (threshold met)
 *     4. vault_transaction_execute (CPIs into BPF Loader)
 *     5. Verify the program's upgrade authority on-chain flipped
 *
 * Edson runs this solo — he holds all 3 OLD multisig keypairs
 * locally (`~/.config/vaulx/{payer,ops,team}-keypair.json`), so
 * the 2-of-3 threshold is met by his single execution. No
 * coordination with other humans needed.
 *
 * Usage:
 *   pnpm exec tsx scripts/dev/multisig-rollover.ts --dry-run
 *   pnpm exec tsx scripts/dev/multisig-rollover.ts --execute
 *
 * Writes signatures + verification table to
 * scripts/dev/multisig-rollover-history.json after a real execution.
 */

import "dotenv/config";

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  Connection,
  Keypair,
  PublicKey,
  SendTransactionError,
  TransactionInstruction,
  TransactionMessage,
} from "@solana/web3.js";
import * as multisig from "@sqds/multisig";

// ---------------------------------------------------------------------------
// SDK bug monkey-patch
// ---------------------------------------------------------------------------
// `@sqds/multisig@2.1.4` does `translatedError.logs = err.logs` deep inside
// translateAndThrowAnchorError. `SendTransactionError.logs` is a getter-only
// property in modern `@solana/web3.js`, so strict-mode assignment throws
// `TypeError` and masks the real chain error. Install a setter that writes
// through to `.transactionLogs` so we get a useful error if SetAuthority
// reverts for some reason. Per the architect note in the 2026-05-15 handoff
// (§8 "lessons").
{
  const descriptor = Object.getOwnPropertyDescriptor(
    SendTransactionError.prototype,
    "logs",
  );
  if (descriptor && typeof descriptor.set !== "function") {
    Object.defineProperty(SendTransactionError.prototype, "logs", {
      configurable: true,
      enumerable: false,
      get: descriptor.get,
      set: function (this: any, v: unknown) {
        this.transactionLogs = v;
      },
    });
  }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const RPC_URL = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
const BPF_LOADER_UPGRADEABLE = new PublicKey(
  "BPFLoaderUpgradeab1e11111111111111111111111",
);

// From scripts/dev/squads-multisig.json (OLD multisig identity)
const OLD_MULTISIG_PDA = new PublicKey(
  "4uHLWx8dz3kpECAjGpP3CsB2sv9vjvFz2utVJMwfyXCj",
);
const OLD_VAULT_PDA = new PublicKey(
  "99o9WXdP3Gt1wwnYtEXheTh5x599f6SfmAdn9um3hejR",
);
const OLD_THRESHOLD = 2;

// NEW multisig vault PDA (from George 2026-05-15 WhatsApp; derived via
// @sqds/multisig.getVaultPda from `nVm3J6EByZcTX8bacm6pbRVw87ogJySKafzEpe27jVE`)
const NEW_VAULT_PDA = new PublicKey(
  "5HkQDrbM9G45kGuiuzBbZ87GzRsZa36fECSV4eebZEWT",
);

// 4 programs to rollover.
const PROGRAMS: Array<{ name: string; id: string }> = [
  { name: "trdc", id: "26rb68SPyjKmFNwSUmfZA7WRFtsKFheXf5xN8eHeeRWk" },
  { name: "vault", id: "GQU6pGwdUAWdhzNDGUU8toVCqxo22mHpFrJeFRE4hpDL" },
  { name: "loan", id: "BCzcP4soWYSVWAt8gWPZmcNxcCiw8LdU8sT5VS3TPuW8" },
  { name: "auction", id: "Fth5WyopNBi6JatJtTnxb7eHs2GSFhJU7AqskRBZGU8m" },
];

const HISTORY_FILE = path.join(__dirname, "multisig-rollover-history.json");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadKeypair(p: string): Keypair {
  return Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(fs.readFileSync(p, "utf8"))),
  );
}

/**
 * Build a BPF Loader Upgradeable `SetAuthority` instruction.
 * Variant index 4, no payload. Accounts:
 *   0. ProgramData account (writable)
 *   1. Current authority (signer)
 *   2. New authority (read-only)
 */
function buildSetAuthorityIx(args: {
  programDataAccount: PublicKey;
  currentAuthority: PublicKey;
  newAuthority: PublicKey;
}): TransactionInstruction {
  const data = Buffer.alloc(4);
  data.writeUInt32LE(4, 0); // SetAuthority variant
  return new TransactionInstruction({
    programId: BPF_LOADER_UPGRADEABLE,
    keys: [
      {
        pubkey: args.programDataAccount,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: args.currentAuthority,
        isSigner: true,
        isWritable: false,
      },
      {
        pubkey: args.newAuthority,
        isSigner: false,
        isWritable: false,
      },
    ],
    data,
  });
}

/**
 * Read a Program account, decode the BPF Loader Upgradeable
 * "Program" variant (4-byte tag = 2, then 32-byte programdata
 * pubkey), and return the programdata address.
 */
async function getProgramDataAddress(
  conn: Connection,
  programId: PublicKey,
): Promise<PublicKey> {
  const acc = await conn.getAccountInfo(programId);
  if (!acc) throw new Error(`program ${programId.toBase58()} not found`);
  if (acc.data.length < 36) {
    throw new Error(
      `program ${programId.toBase58()} data too short (${acc.data.length} bytes)`,
    );
  }
  // First 4 bytes = variant; bytes 4..36 = programdata pubkey.
  return new PublicKey(acc.data.slice(4, 36));
}

/**
 * Read a ProgramData account, return the upgrade authority pubkey
 * (or null if the account is marked immutable).
 *
 * Layout: 4 bytes variant (3) + 8 bytes slot (u64) + 1 byte option
 * tag + 32 bytes authority pubkey when option=1.
 */
async function getCurrentUpgradeAuthority(
  conn: Connection,
  programDataAddress: PublicKey,
): Promise<PublicKey | null> {
  const acc = await conn.getAccountInfo(programDataAddress);
  if (!acc) {
    throw new Error(
      `programdata ${programDataAddress.toBase58()} not found`,
    );
  }
  const optionTag = acc.data[12];
  if (optionTag !== 1) return null;
  return new PublicKey(acc.data.slice(13, 45));
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

type ExecuteResult = {
  program: string;
  programId: string;
  programDataAddress: string;
  before: string;
  after: string;
  createSig?: string;
  proposalSig?: string;
  approve1Sig?: string;
  approve2Sig?: string;
  executeSig?: string;
};

async function rolloverOne(opts: {
  conn: Connection;
  members: { payer: Keypair; ops: Keypair; team: Keypair };
  program: { name: string; id: string };
  oldMultisigPda: PublicKey;
  oldVaultPda: PublicKey;
  newVaultPda: PublicKey;
  dryRun: boolean;
}): Promise<ExecuteResult> {
  const { conn, members, program, oldMultisigPda, oldVaultPda, newVaultPda, dryRun } = opts;
  const programId = new PublicKey(program.id);
  const programDataAddress = await getProgramDataAddress(conn, programId);

  // Sanity 1: current authority must match OLD vault PDA.
  const currentAuthority = await getCurrentUpgradeAuthority(
    conn,
    programDataAddress,
  );
  if (!currentAuthority) {
    throw new Error(
      `[${program.name}] is immutable — no upgrade authority to transfer.`,
    );
  }
  if (!currentAuthority.equals(oldVaultPda)) {
    throw new Error(
      `[${program.name}] current authority ${currentAuthority.toBase58()} does not match OLD vault PDA ${oldVaultPda.toBase58()} — refusing to proceed.`,
    );
  }

  console.log(`\n=== [${program.name}] ${programId.toBase58()} ===`);
  console.log(`    programdata : ${programDataAddress.toBase58()}`);
  console.log(`    current auth: ${currentAuthority.toBase58()} ✓ (= OLD vault)`);
  console.log(`    will set to : ${newVaultPda.toBase58()}`);

  if (dryRun) {
    console.log(`    DRY RUN — no on-chain action`);
    return {
      program: program.name,
      programId: programId.toBase58(),
      programDataAddress: programDataAddress.toBase58(),
      before: currentAuthority.toBase58(),
      after: "(dry-run)",
    };
  }

  // Build the inner SetAuthority ix.
  const setAuthorityIx = buildSetAuthorityIx({
    programDataAccount: programDataAddress,
    currentAuthority: oldVaultPda, // signs via Squads CPI
    newAuthority: newVaultPda,
  });

  // Wrap in a TransactionMessage. The payerKey here is irrelevant for the
  // stored Squads vault_tx — Squads only persists accountKeys + instructions.
  const { blockhash } = await conn.getLatestBlockhash();
  const innerMessage = new TransactionMessage({
    payerKey: oldVaultPda,
    recentBlockhash: blockhash,
    instructions: [setAuthorityIx],
  });

  // Next tx index.
  const multisigAccount = await multisig.accounts.Multisig.fromAccountAddress(
    conn,
    oldMultisigPda,
  );
  // SDK types transactionIndex as `bignum` (BN at runtime). A plain
  // cast to `bigint` is a runtime no-op — the resulting `BN + 1n`
  // silently goes through string coercion (`"8" + 1n` → "81"), which
  // is the bug that ate our first execution attempt. Match the proven
  // pattern from squads-upgrade-program.ts: Number→BigInt round-trip.
  const newTxIndex = BigInt(
    Number(multisigAccount.transactionIndex as unknown as number) + 1,
  );
  console.log(`    Squads tx idx: ${newTxIndex.toString()}`);

  // Step A — vault_transaction_create (creator = payer; pays + signs).
  const createSig = await multisig.rpc.vaultTransactionCreate({
    connection: conn,
    feePayer: members.payer,
    multisigPda: oldMultisigPda,
    transactionIndex: newTxIndex,
    creator: members.payer.publicKey,
    vaultIndex: 0,
    ephemeralSigners: 0,
    transactionMessage: innerMessage,
    addressLookupTableAccounts: [],
    memo: `rollover ${program.name} → NEW multisig vault`,
  });
  await conn.confirmTransaction(createSig, "confirmed");
  console.log(`    vault_transaction_create : ${createSig}`);

  // Step B — proposal_create.
  const proposalSig = await multisig.rpc.proposalCreate({
    connection: conn,
    feePayer: members.payer,
    multisigPda: oldMultisigPda,
    transactionIndex: newTxIndex,
    creator: members.payer,
  });
  await conn.confirmTransaction(proposalSig, "confirmed");
  console.log(`    proposal_create          : ${proposalSig}`);

  // Step C — proposal_approve #1 (payer).
  const approve1Sig = await multisig.rpc.proposalApprove({
    connection: conn,
    feePayer: members.payer,
    multisigPda: oldMultisigPda,
    transactionIndex: newTxIndex,
    member: members.payer,
  });
  await conn.confirmTransaction(approve1Sig, "confirmed");
  console.log(`    proposal_approve #1 (payer): ${approve1Sig}`);

  // Step D — proposal_approve #2 (ops); meets the 2-of-3 threshold.
  const approve2Sig = await multisig.rpc.proposalApprove({
    connection: conn,
    feePayer: members.ops,
    multisigPda: oldMultisigPda,
    transactionIndex: newTxIndex,
    member: members.ops,
  });
  await conn.confirmTransaction(approve2Sig, "confirmed");
  console.log(`    proposal_approve #2 (ops): ${approve2Sig}`);

  // Step E — vault_transaction_execute (any member can submit).
  const executeSig = await multisig.rpc.vaultTransactionExecute({
    connection: conn,
    feePayer: members.payer,
    multisigPda: oldMultisigPda,
    transactionIndex: newTxIndex,
    member: members.payer.publicKey,
  });
  await conn.confirmTransaction(executeSig, "confirmed");
  console.log(`    vault_transaction_execute: ${executeSig}`);

  // Verify on-chain.
  const newAuthority = await getCurrentUpgradeAuthority(
    conn,
    programDataAddress,
  );
  if (!newAuthority || !newAuthority.equals(newVaultPda)) {
    throw new Error(
      `[${program.name}] post-execute authority is ${newAuthority?.toBase58() ?? "(immutable)"} — expected ${newVaultPda.toBase58()}`,
    );
  }
  console.log(`    ✓ verified: authority now ${newAuthority.toBase58()}`);

  return {
    program: program.name,
    programId: programId.toBase58(),
    programDataAddress: programDataAddress.toBase58(),
    before: currentAuthority.toBase58(),
    after: newAuthority.toBase58(),
    createSig,
    proposalSig,
    approve1Sig,
    approve2Sig,
    executeSig,
  };
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const execute = process.argv.includes("--execute");
  if (dryRun === execute) {
    console.error(
      "Usage: tsx multisig-rollover.ts (--dry-run | --execute) — exactly one of the two flags is required.",
    );
    process.exit(2);
  }

  const vaulxDir = path.join(os.homedir(), ".config/vaulx");
  const payer = loadKeypair(path.join(vaulxDir, "payer-keypair.json"));
  const ops = loadKeypair(path.join(vaulxDir, "ops-keypair.json"));
  const team = loadKeypair(path.join(vaulxDir, "team-keypair.json"));

  const conn = new Connection(RPC_URL, "confirmed");

  // Sanity: confirm the 3 keypairs match the expected OLD multisig
  // member set from scripts/dev/squads-multisig.json.
  const EXPECTED_MEMBERS = new Set([
    "2HYjytRc4oKY2ndmJfAq2XdGhPqYB7VdDPLzA18QEiAH",
    "7QpTNAveTSfQSEzjPCmfzgE9ZGrgkcUBmDZ97dcSixdE",
    "9MBdm6fbFTMCzvesKDDBYD58JdTsqWNGiefjdaS83LzS",
  ]);
  for (const kp of [payer, ops, team]) {
    if (!EXPECTED_MEMBERS.has(kp.publicKey.toBase58())) {
      throw new Error(
        `keypair ${kp.publicKey.toBase58()} does not match any expected OLD multisig member — refusing to proceed.`,
      );
    }
  }

  // Also sanity-check the multisig account exists + threshold matches.
  const multisigAccount = await multisig.accounts.Multisig.fromAccountAddress(
    conn,
    OLD_MULTISIG_PDA,
  );
  if (multisigAccount.threshold !== OLD_THRESHOLD) {
    throw new Error(
      `OLD multisig threshold is ${multisigAccount.threshold}, expected ${OLD_THRESHOLD}.`,
    );
  }

  console.log("===== Vaulx multisig rollover =====");
  console.log(`mode            : ${dryRun ? "DRY RUN" : "EXECUTE"}`);
  console.log(`RPC             : ${RPC_URL}`);
  console.log(`OLD multisig PDA: ${OLD_MULTISIG_PDA.toBase58()}`);
  console.log(`OLD vault PDA   : ${OLD_VAULT_PDA.toBase58()}`);
  console.log(`NEW vault PDA   : ${NEW_VAULT_PDA.toBase58()}`);
  console.log(`payer keypair   : ${payer.publicKey.toBase58()}`);
  console.log(`ops keypair     : ${ops.publicKey.toBase58()}`);
  console.log(`team keypair    : ${team.publicKey.toBase58()}`);

  const results: ExecuteResult[] = [];
  for (const program of PROGRAMS) {
    const result = await rolloverOne({
      conn,
      members: { payer, ops, team },
      program,
      oldMultisigPda: OLD_MULTISIG_PDA,
      oldVaultPda: OLD_VAULT_PDA,
      newVaultPda: NEW_VAULT_PDA,
      dryRun,
    });
    results.push(result);
  }

  if (!dryRun) {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(results, null, 2));
    console.log(`\nhistory written to ${path.relative(process.cwd(), HISTORY_FILE)}`);
  }

  console.log("\n===== summary =====");
  for (const r of results) {
    console.log(
      `${r.program.padEnd(8)} ${r.before} → ${r.after}`,
    );
  }

  console.log("\ndone.");
}

main().catch((err) => {
  console.error("\nmultisig-rollover FAILED:", err);
  process.exit(1);
});
