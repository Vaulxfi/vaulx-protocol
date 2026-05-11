/**
 * Devnet helper — idempotently initialises `vault_config` + `loan_config`
 * PDAs with the Civic CAPTCHA / uniqueness gatekeeper network.
 *
 * Usage:
 *   pnpm init:civic --custodian <pubkey>          # first run
 *   pnpm init:civic                                # re-run (idempotent)
 *   pnpm init:civic --network <new-network-pubkey> --custodian <pubkey>
 *
 * Exit codes:
 *   0   success (or no-op when already initialised)
 *   1   error
 *   2   SKIPPED (prerequisite missing — payer underfunded or demo mint absent)
 */
import fs from "node:fs";
import path from "node:path";
import {
  AnchorProvider,
  Program,
  Wallet,
  type Idl,
} from "@coral-xyz/anchor";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  clusterApiUrl,
} from "@solana/web3.js";
import { vault as vaultFacade, loan as loanFacade } from "@vaulx/anchor-client";

// Civic CAPTCHA / uniqueness gatekeeper network (hackathon demo default).
const DEFAULT_CIVIC_NETWORK = "ignREusXmGrscGNUesoU9mxfds9AiYTezUKex2PsZV6";

const MIN_PAYER_SOL = 0.01;
const DEVNET_USDC_FILE = path.resolve(
  __dirname,
  "devnet-usdc.json",
);

type Args = {
  custodian?: PublicKey;
  network: PublicKey;
  rpcUrl: string;
};

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  let custodian: PublicKey | undefined;
  let networkStr = DEFAULT_CIVIC_NETWORK;
  let rpcUrl = process.env.RPC_URL ?? clusterApiUrl("devnet");

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--custodian" && argv[i + 1]) {
      custodian = new PublicKey(argv[++i]);
    } else if (a === "--network" && argv[i + 1]) {
      networkStr = argv[++i];
    } else if (a === "--rpc" && argv[i + 1]) {
      rpcUrl = argv[++i];
    } else if (a === "-h" || a === "--help") {
      console.log(
        "Usage: pnpm init:civic [--custodian <pubkey>] [--network <pubkey>] [--rpc <url>]",
      );
      process.exit(0);
    }
  }

  return { custodian, network: new PublicKey(networkStr), rpcUrl };
}

function loadPayer(): Keypair {
  const p = `${process.env.HOME}/.config/solana/id.json`;
  if (!fs.existsSync(p)) {
    console.error(`Payer keypair not found at ${p}. Run 'solana-keygen new' first.`);
    process.exit(2);
  }
  return Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(p, "utf8"))),
  );
}

async function main() {
  const { custodian, network, rpcUrl } = parseArgs();

  // SKIP prerequisite: the demo USDC mint file should exist.
  if (!fs.existsSync(DEVNET_USDC_FILE)) {
    console.log(
      `SKIPPED: ${DEVNET_USDC_FILE} not found. Run 'pnpm seed:usdc' first.`,
    );
    process.exit(2);
  }

  const payer = loadPayer();
  const conn = new Connection(rpcUrl, "confirmed");
  const bal = await conn.getBalance(payer.publicKey);
  const balSol = bal / LAMPORTS_PER_SOL;
  if (balSol < MIN_PAYER_SOL) {
    console.log(
      `SKIPPED: payer ${payer.publicKey.toBase58()} has only ${balSol} SOL ` +
        `(< ${MIN_PAYER_SOL}). Top up at https://faucet.solana.com and re-run.`,
    );
    process.exit(2);
  }

  const provider = new AnchorProvider(conn, new Wallet(payer), {
    commitment: "confirmed",
  });

  const vaultProgram = vaultFacade.program(provider) as Program<Idl>;
  const loanProgram = loanFacade.program(provider) as Program<Idl>;

  console.log(`  payer:      ${payer.publicKey.toBase58()}`);
  console.log(`  rpc:        ${rpcUrl}`);
  console.log(`  network:    ${network.toBase58()} (Civic gatekeeper network)`);
  console.log(``);

  // --- vault_config ----------------------------------------------------
  const [vaultConfigPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault_config")],
    vaultProgram.programId,
  );
  const existingVault = await (
    vaultProgram.account as any
  ).vaultConfig.fetchNullable(vaultConfigPda);
  if (existingVault) {
    const cur = existingVault.civicNetwork.toBase58();
    console.log(`  vault_config already exists (${vaultConfigPda.toBase58()})`);
    console.log(`    current civic_network: ${cur}`);
    if (cur !== network.toBase58()) {
      console.log(
        `    NOTE: existing network differs from requested. vault_config is ` +
          `first-writer-wins; no on-chain admin 'set_civic_network' exists yet.`,
      );
    }
  } else {
    console.log(`  initializing vault_config...`);
    const sig = await (vaultProgram.methods as any)
      .initializeVaultConfig(network)
      .accounts({
        vaultConfig: vaultConfigPda,
        admin: payer.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    console.log(`    -> ${vaultConfigPda.toBase58()} (tx ${sig})`);
  }

  // --- loan_config -----------------------------------------------------
  const [loanConfigPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("loan_config")],
    loanProgram.programId,
  );
  const existingLoan = await (
    loanProgram.account as any
  ).loanConfig.fetchNullable(loanConfigPda);
  if (existingLoan) {
    console.log(`  loan_config already exists (${loanConfigPda.toBase58()})`);
    console.log(`    custodian:      ${existingLoan.custodian.toBase58()}`);
    console.log(
      `    civic_network:  ${existingLoan.civicNetwork.toBase58()}`,
    );
  } else {
    if (!custodian) {
      console.error(
        `  loan_config does not exist and --custodian was not provided.\n` +
          `  Re-run with: pnpm init:civic --custodian <pubkey>`,
      );
      process.exit(1);
    }
    console.log(`  initializing loan_config with custodian ${custodian.toBase58()}...`);
    const sig = await (loanProgram.methods as any)
      .initializeLoanConfig(custodian, network)
      .accounts({
        loanConfig: loanConfigPda,
        admin: payer.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    console.log(`    -> ${loanConfigPda.toBase58()} (tx ${sig})`);
  }

  console.log(`\ndone.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
