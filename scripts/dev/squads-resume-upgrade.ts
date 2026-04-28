// Resume Squads upgrade flow from a partially-completed transaction index.
//
// Use this when squads-upgrade-program.ts crashed mid-flight (most commonly
// because the @sqds/multisig 2.1.4 SDK throws TypeError on the AnchorError
// wrapper -- "Cannot set property logs of Error which has only a getter" --
// and the underlying tx may or may not have actually landed on-chain).
//
// The script reads the proposal PDA, sees who has already approved, skips
// duplicate votes, and only executes when threshold is met.
//
// Usage: pnpm exec tsx scripts/dev/squads-resume-upgrade.ts <txIndex> <label> <programPubkey> <bufferPubkey>
import * as multisig from "@sqds/multisig";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const RPC = "https://api.devnet.solana.com";
const MULTISIG = new PublicKey("4uHLWx8dz3kpECAjGpP3CsB2sv9vjvFz2utVJMwfyXCj");
const VAULT = new PublicKey("99o9WXdP3Gt1wwnYtEXheTh5x599f6SfmAdn9um3hejR");
const HISTORY = path.resolve(__dirname, "squads-upgrade-history.json");

function load(p: string): Keypair {
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(p, "utf-8"))));
}

async function send(name: string, txPromise: Promise<string>): Promise<string | null> {
  try {
    const sig = await txPromise;
    return sig;
  } catch (e: any) {
    console.log(`${name}: SDK threw (will re-check on-chain): ${e?.message || e}`);
    return null;
  }
}

async function main() {
  const [txIdxStr, label, programStr, bufferStr] = process.argv.slice(2);
  const txIndex = BigInt(txIdxStr);
  const program = new PublicKey(programStr);
  const buffer = new PublicKey(bufferStr);

  const conn = new Connection(RPC, "confirmed");
  const proposer = load(path.join(os.homedir(), ".config", "solana", "id.json"));
  const ops = load(path.join(os.homedir(), ".config", "vaulx", "ops-keypair.json"));

  const [proposalPda] = multisig.getProposalPda({ multisigPda: MULTISIG, transactionIndex: txIndex });
  console.log("proposal PDA:", proposalPda.toBase58());

  let prop = await multisig.accounts.Proposal.fromAccountAddress(conn, proposalPda);
  console.log("status:", prop.status);
  console.log("approved:", prop.approved.map((p: PublicKey) => p.toBase58()));

  let approve1Sig = "(prior tx)";
  let approve2Sig = "(prior tx)";

  const proposerApproved = prop.approved.some((p: PublicKey) => p.equals(proposer.publicKey));
  const opsApproved = prop.approved.some((p: PublicKey) => p.equals(ops.publicKey));

  if (!proposerApproved) {
    const sig = await send("approve#1 (payer)", multisig.rpc.proposalApprove({
      connection: conn, feePayer: proposer, multisigPda: MULTISIG,
      transactionIndex: txIndex, member: proposer,
    }));
    if (sig) {
      await conn.confirmTransaction(sig, "confirmed");
      approve1Sig = sig;
      console.log(`approve#1 (payer) sig: ${sig}`);
    }
  }

  if (!opsApproved) {
    const sig = await send("approve#2 (ops)", multisig.rpc.proposalApprove({
      connection: conn, feePayer: ops, multisigPda: MULTISIG,
      transactionIndex: txIndex, member: ops,
    }));
    if (sig) {
      await conn.confirmTransaction(sig, "confirmed");
      approve2Sig = sig;
      console.log(`approve#2 (ops) sig: ${sig}`);
    }
  }

  prop = await multisig.accounts.Proposal.fromAccountAddress(conn, proposalPda);
  console.log("post-approve status:", prop.status);
  console.log("post-approve approvals:", prop.approved.map((p: PublicKey) => p.toBase58()));

  if (prop.status.__kind !== "Approved") {
    console.error(`Proposal not in Approved state -- got ${prop.status.__kind}. Aborting execute.`);
    process.exit(1);
  }

  let executeSig: string | null = null;
  try {
    executeSig = await multisig.rpc.vaultTransactionExecute({
      connection: conn, feePayer: proposer, multisigPda: MULTISIG,
      transactionIndex: txIndex, member: proposer.publicKey,
    });
    await conn.confirmTransaction(executeSig, "confirmed");
    console.log(`execute sig: ${executeSig}`);
  } catch (e: any) {
    console.error("execute threw:", e?.message || e);
    if (e?.logs) console.error("logs:", e.logs);
    throw e;
  }

  let history: any[] = [];
  if (fs.existsSync(HISTORY)) history = JSON.parse(fs.readFileSync(HISTORY, "utf-8"));
  history.push({
    label, program: program.toBase58(), buffer: buffer.toBase58(),
    multisigPda: MULTISIG.toBase58(), vaultPda: VAULT.toBase58(),
    transactionIndex: Number(txIndex),
    approve1Sig, approve1By: proposer.publicKey.toBase58(),
    approve2Sig, approve2By: ops.publicKey.toBase58(),
    executeSig, executedAt: new Date().toISOString(),
    note: "Resumed after SDK error-wrapper threw on a successful approve. On-chain proposal state checked before re-vote.",
  });
  fs.writeFileSync(HISTORY, JSON.stringify(history, null, 2));
  console.log("history appended.");
  console.log(`https://solscan.io/tx/${executeSig}?cluster=devnet`);
}

main().catch((e) => { console.error(e); process.exit(1); });
