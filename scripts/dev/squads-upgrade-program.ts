/**
 * Submits a Squads V4 vault_transaction proposal whose inner instruction
 * is bpf_loader_upgradeable::upgrade. Proposer (payer) submits + first
 * approve; ops adds the second approve; payer executes. After execution,
 * the program is upgraded to the bytecode in `--buffer`.
 *
 * Usage:
 *   pnpm tsx scripts/dev/squads-upgrade-program.ts \
 *     --program <PROGRAM_PUBKEY> \
 *     --buffer  <BUFFER_PUBKEY>  \
 *     --label   <free-form label, e.g. "trdc">
 *
 * The script appends one record per upgrade to scripts/dev/squads-upgrade-history.json
 * with the 4 tx signatures (propose, approve#1, approve#2, execute) so the
 * Squads vote audit trail is committable.
 *
 * Hard rule: no fallback to single-key upgrade. If the SDK can't construct a
 * working vault_transaction for a BPF Loader upgrade, the script throws and
 * the operator must fix the SDK shim, not bypass the multisig.
 */
import * as multisig from "@sqds/multisig";
import {
  Connection,
  Keypair,
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
} from "@solana/web3.js";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// ---------------------------------------------------------------------------
// constants
// ---------------------------------------------------------------------------

const RPC_URL = "https://api.devnet.solana.com";

const MULTISIG_PDA = new PublicKey(
  "4uHLWx8dz3kpECAjGpP3CsB2sv9vjvFz2utVJMwfyXCj",
);
const VAULT_PDA = new PublicKey(
  "99o9WXdP3Gt1wwnYtEXheTh5x599f6SfmAdn9um3hejR",
);
const BPF_LOADER_UPGRADEABLE_PROGRAM_ID = new PublicKey(
  "BPFLoaderUpgradeab1e11111111111111111111111",
);
const SYSVAR_RENT_PUBKEY = new PublicKey(
  "SysvarRent111111111111111111111111111111111",
);
const SYSVAR_CLOCK_PUBKEY = new PublicKey(
  "SysvarC1ock11111111111111111111111111111111",
);

const HISTORY_FILE = path.resolve(
  __dirname,
  "squads-upgrade-history.json",
);

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function loadKeypair(filePath: string): Keypair {
  const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  return Keypair.fromSecretKey(Uint8Array.from(raw));
}

function deriveProgramData(programId: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [programId.toBuffer()],
    BPF_LOADER_UPGRADEABLE_PROGRAM_ID,
  )[0];
}

/**
 * Build the BPF Loader Upgradeable `Upgrade` instruction (instruction
 * variant index 3 in the loader's u32-LE-tagged enum).
 *
 * Account ordering (from solana_program::bpf_loader_upgradeable source):
 *   0. [WRITE]        ProgramData address
 *   1. [WRITE]        Program address
 *   2. [WRITE]        Buffer address (closed; lamports drained to spill)
 *   3. [WRITE]        Spill address (receives buffer's rent)
 *   4. [READ]         Rent sysvar
 *   5. [READ]         Clock sysvar
 *   6. [READ, SIGNER] Authority (the upgrade authority — vault PDA in our case)
 */
function buildUpgradeIx(args: {
  program: PublicKey;
  buffer: PublicKey;
  spill: PublicKey;
  authority: PublicKey;
}): TransactionInstruction {
  const data = Buffer.alloc(4);
  data.writeUInt32LE(3, 0); // BpfLoaderUpgradeable::Upgrade
  return new TransactionInstruction({
    programId: BPF_LOADER_UPGRADEABLE_PROGRAM_ID,
    keys: [
      { pubkey: deriveProgramData(args.program), isSigner: false, isWritable: true },
      { pubkey: args.program, isSigner: false, isWritable: true },
      { pubkey: args.buffer, isSigner: false, isWritable: true },
      { pubkey: args.spill, isSigner: false, isWritable: true },
      { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
      { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
      { pubkey: args.authority, isSigner: true, isWritable: false },
    ],
    data,
  });
}

function parseArgs(): { program: PublicKey; buffer: PublicKey; label: string } {
  const argv = process.argv.slice(2);
  const get = (flag: string): string => {
    const i = argv.indexOf(flag);
    if (i === -1 || !argv[i + 1]) {
      throw new Error(`missing required arg: ${flag}`);
    }
    return argv[i + 1];
  };
  return {
    program: new PublicKey(get("--program")),
    buffer: new PublicKey(get("--buffer")),
    label: get("--label"),
  };
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

async function main() {
  const { program, buffer, label } = parseArgs();
  const conn = new Connection(RPC_URL, "confirmed");

  const proposer = loadKeypair(path.join(os.homedir(), ".config", "solana", "id.json"));
  const ops = loadKeypair(path.join(os.homedir(), ".config", "vaulx", "ops-keypair.json"));

  console.log(`label:        ${label}`);
  console.log(`program:      ${program.toBase58()}`);
  console.log(`buffer:       ${buffer.toBase58()}`);
  console.log(`vault PDA:    ${VAULT_PDA.toBase58()}`);
  console.log(`multisig PDA: ${MULTISIG_PDA.toBase58()}`);
  console.log(`proposer:     ${proposer.publicKey.toBase58()}`);
  console.log(`ops:          ${ops.publicKey.toBase58()}`);

  // ----- Pre-flight: confirm buffer authority is the vault PDA -----
  const bufInfo = await conn.getAccountInfo(buffer);
  if (!bufInfo) throw new Error(`buffer ${buffer.toBase58()} not found`);
  if (!bufInfo.owner.equals(BPF_LOADER_UPGRADEABLE_PROGRAM_ID)) {
    throw new Error(
      `buffer owner is ${bufInfo.owner.toBase58()}, expected BpfLoaderUpgradeable`,
    );
  }
  // Buffer state layout: [4 bytes state tag = 1][1 byte option = 1][32 byte authority][bytecode...]
  if (bufInfo.data.readUInt32LE(0) !== 1) {
    throw new Error("buffer is not in Buffer state");
  }
  if (bufInfo.data[4] !== 1) {
    throw new Error("buffer has no authority set");
  }
  const bufAuth = new PublicKey(bufInfo.data.slice(5, 37));
  if (!bufAuth.equals(VAULT_PDA)) {
    throw new Error(
      `buffer authority is ${bufAuth.toBase58()}, expected vault PDA ${VAULT_PDA.toBase58()}`,
    );
  }
  console.log("buffer authority OK (= vault PDA)");

  // ----- Get next tx index from multisig -----
  const msAccount = await multisig.accounts.Multisig.fromAccountAddress(
    conn,
    MULTISIG_PDA,
  );
  const newTxIndex = BigInt(Number(msAccount.transactionIndex) + 1);
  console.log(`new transaction index: ${newTxIndex}`);

  // ----- Build the inner instruction (BPF Loader Upgrade) -----
  // spill = proposer wallet (gets buffer's rent back ~= bytecode_size * 6.96e-6 SOL)
  const upgradeIx = buildUpgradeIx({
    program,
    buffer,
    spill: proposer.publicKey,
    authority: VAULT_PDA,
  });

  // Wrap as a TransactionMessage with vault PDA as fee-payer placeholder.
  // The Squads SDK only uses the message's accountKeys + instructions; the
  // payer key is irrelevant for the inner-tx-message storage but is required
  // by the TransactionMessage constructor.
  const { blockhash } = await conn.getLatestBlockhash();
  const innerMessage = new TransactionMessage({
    payerKey: VAULT_PDA,
    recentBlockhash: blockhash,
    instructions: [upgradeIx],
  });

  // ----- Step A: vault_transaction_create -----
  const proposeSig = await multisig.rpc.vaultTransactionCreate({
    connection: conn,
    feePayer: proposer,
    multisigPda: MULTISIG_PDA,
    transactionIndex: newTxIndex,
    creator: proposer.publicKey,
    vaultIndex: 0,
    ephemeralSigners: 0,
    transactionMessage: innerMessage,
    addressLookupTableAccounts: [],
    memo: `Upgrade ${label} via buffer ${buffer.toBase58().slice(0, 8)}…`,
  });
  await conn.confirmTransaction(proposeSig, "confirmed");
  console.log(`vault_transaction_create sig: ${proposeSig}`);

  // ----- Step B: proposal_create -----
  const proposalSig = await multisig.rpc.proposalCreate({
    connection: conn,
    feePayer: proposer,
    multisigPda: MULTISIG_PDA,
    transactionIndex: newTxIndex,
    creator: proposer,
  });
  await conn.confirmTransaction(proposalSig, "confirmed");
  console.log(`proposal_create sig: ${proposalSig}`);

  // ----- Step C: proposal_approve #1 (proposer / payer) -----
  const approve1Sig = await multisig.rpc.proposalApprove({
    connection: conn,
    feePayer: proposer,
    multisigPda: MULTISIG_PDA,
    transactionIndex: newTxIndex,
    member: proposer,
  });
  await conn.confirmTransaction(approve1Sig, "confirmed");
  console.log(`proposal_approve #1 (payer) sig: ${approve1Sig}`);

  // ----- Step D: proposal_approve #2 (ops) — meets threshold of 2 -----
  const approve2Sig = await multisig.rpc.proposalApprove({
    connection: conn,
    feePayer: ops,
    multisigPda: MULTISIG_PDA,
    transactionIndex: newTxIndex,
    member: ops,
  });
  await conn.confirmTransaction(approve2Sig, "confirmed");
  console.log(`proposal_approve #2 (ops) sig: ${approve2Sig}`);

  // ----- Step E: vault_transaction_execute -----
  const executeSig = await multisig.rpc.vaultTransactionExecute({
    connection: conn,
    feePayer: proposer,
    multisigPda: MULTISIG_PDA,
    transactionIndex: newTxIndex,
    member: proposer.publicKey,
  });
  await conn.confirmTransaction(executeSig, "confirmed");
  console.log(`vault_transaction_execute sig: ${executeSig}`);

  // ----- Persist audit trail -----
  let history: any[] = [];
  if (fs.existsSync(HISTORY_FILE)) {
    history = JSON.parse(fs.readFileSync(HISTORY_FILE, "utf-8"));
  }
  history.push({
    label,
    program: program.toBase58(),
    buffer: buffer.toBase58(),
    multisigPda: MULTISIG_PDA.toBase58(),
    vaultPda: VAULT_PDA.toBase58(),
    transactionIndex: Number(newTxIndex),
    proposeSig,
    proposalSig,
    approve1Sig,
    approve1By: proposer.publicKey.toBase58(),
    approve2Sig,
    approve2By: ops.publicKey.toBase58(),
    executeSig,
    executedAt: new Date().toISOString(),
  });
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
  console.log(`history appended to ${HISTORY_FILE}`);
  console.log("");
  console.log("Solscan links:");
  console.log(`  propose:  https://solscan.io/tx/${proposeSig}?cluster=devnet`);
  console.log(`  approve1: https://solscan.io/tx/${approve1Sig}?cluster=devnet`);
  console.log(`  approve2: https://solscan.io/tx/${approve2Sig}?cluster=devnet`);
  console.log(`  execute:  https://solscan.io/tx/${executeSig}?cluster=devnet`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
