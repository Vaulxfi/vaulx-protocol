/**
 * Idempotent zero-state bootstrap for Edson's parallel devnet stack.
 *
 * Run once after `anchor deploy` has put the four programs at Edson's
 * keypairs. Each step checks for an existing PDA and skips if found, so
 * re-running on a partial bootstrap is safe.
 *
 * Steps:
 *
 *   1. vault::initialize_vault_config(civic_network = Pubkey.default)
 *      Edson signs as admin; civic gate is OFF. Sets kyc_required = false
 *      by default so deposits / loans need no KYC attestation.
 *
 *   2. vault::initialize_vault(asset_mint = USDC)
 *      Creates the per-mint vault PDA + a fresh share_mint. We persist the
 *      share_mint pubkey to scripts/dev/edson-devnet.json so later
 *      bootstraps + the demo seed know which share mint to wire.
 *
 *   3. loan::initialize_loan_config(custodian = Edson, civic_network = default)
 *      Edson signs as admin and is also the custodian — the bridge's
 *      confirm_custody+disburse bundle relies on operator == custodian.
 *
 *   4. vault::deposit(amount = 5 USDC)
 *      Funds the vault enough for the 4-USDC demo loan to disburse with
 *      a tiny margin. Skips if the vault already holds ≥ 5 USDC.
 *
 * Inputs (env vars):
 *   ASSET_MINT     default 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
 *                  (devnet USDC; the same mint the seed-usdc.ts script
 *                  produced and that the bridge already pins).
 *   PAYER_KEYPAIR  default ~/.config/solana/id.json (Edson's keypair).
 *   SOLANA_RPC_URL default https://api.devnet.solana.com.
 *
 * Outputs:
 *   scripts/dev/edson-devnet.json — { vaultConfig, vault, shareMint,
 *                                     loanConfig, depositSig }.
 *   Pretty-prints the same map to stdout.
 */

import "dotenv/config";

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  AnchorProvider,
  BN,
  Program,
  Wallet,
  type Idl,
} from "@coral-xyz/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  getAccount,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
} from "@solana/web3.js";

import loanIdlJson from "../../packages/idls/src/loan.json";
import vaultIdlJson from "../../packages/idls/src/vault.json";

const RPC_URL =
  process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";

// Asset-mint resolution order (most-explicit wins):
//   1. ASSET_MINT env var (one-shot override)
//   2. scripts/dev/edson-usdc.json from `init-fresh-usdc.ts` (Edson is
//      mint authority; this is the demo-pivoted mint)
//   3. The legacy demo mint baked in below (Edson was NOT mint authority
//      for this one — kept as the historical fallback so the script
//      still runs in environments where edson-usdc.json wasn't created)
function resolveAssetMint(): string {
  if (process.env.ASSET_MINT) return process.env.ASSET_MINT;
  try {
    const cfg = JSON.parse(
      fs.readFileSync(path.join(__dirname, "edson-usdc.json"), "utf8"),
    ) as { mint?: string };
    if (cfg.mint) return cfg.mint;
  } catch {
    /* no edson-usdc.json — fall through to legacy default */
  }
  return "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
}
const ASSET_MINT_STR = resolveAssetMint();
const DEPOSIT_AMOUNT_ATOMS = 5_000_000; // 5 USDC

const PAYER_KEYPAIR_PATH =
  process.env.PAYER_KEYPAIR ??
  path.join(os.homedir(), ".config", "solana", "id.json");

const OUT_PATH = path.join(__dirname, "edson-devnet.json");

const VAULT_PROGRAM_ID = new PublicKey(
  (vaultIdlJson as { address: string }).address,
);
const LOAN_PROGRAM_ID = new PublicKey(
  (loanIdlJson as { address: string }).address,
);

function expandHome(p: string): string {
  return p.startsWith("~/") ? p.replace(/^~/, os.homedir()) : p;
}

function loadKeypair(p: string): Keypair {
  const raw = fs.readFileSync(expandHome(p), "utf8");
  return Keypair.fromSecretKey(new Uint8Array(JSON.parse(raw)));
}

async function accountExists(
  conn: Connection,
  pda: PublicKey,
): Promise<boolean> {
  return (await conn.getAccountInfo(pda, "confirmed")) !== null;
}

interface Output {
  programs: {
    vault: string;
    loan: string;
  };
  payer: string;
  assetMint: string;
  vaultConfig: string;
  vault: string;
  shareMint?: string;
  vaultAta: string;
  loanConfig: string;
  steps: Record<string, string>; // stepName -> txSignature | "skipped"
}

async function main(): Promise<void> {
  const payer = loadKeypair(PAYER_KEYPAIR_PATH);
  console.log("payer:", payer.publicKey.toBase58());
  console.log("rpc:  ", RPC_URL);
  console.log("vault program: ", VAULT_PROGRAM_ID.toBase58());
  console.log("loan program:  ", LOAN_PROGRAM_ID.toBase58());

  const connection = new Connection(RPC_URL, "confirmed");
  const provider = new AnchorProvider(connection, new Wallet(payer), {
    commitment: "confirmed",
  });
  const vaultProgram = new Program(vaultIdlJson as Idl, provider);
  const loanProgram = new Program(loanIdlJson as Idl, provider);

  const assetMint = new PublicKey(ASSET_MINT_STR);

  const [vaultConfigPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault_config")],
    VAULT_PROGRAM_ID,
  );
  const [vaultPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), assetMint.toBuffer()],
    VAULT_PROGRAM_ID,
  );
  const [loanConfigPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("loan_config")],
    LOAN_PROGRAM_ID,
  );
  const vaultAta = getAssociatedTokenAddressSync(assetMint, vaultPda, true);

  const out: Output = {
    programs: {
      vault: VAULT_PROGRAM_ID.toBase58(),
      loan: LOAN_PROGRAM_ID.toBase58(),
    },
    payer: payer.publicKey.toBase58(),
    assetMint: assetMint.toBase58(),
    vaultConfig: vaultConfigPda.toBase58(),
    vault: vaultPda.toBase58(),
    vaultAta: vaultAta.toBase58(),
    loanConfig: loanConfigPda.toBase58(),
    steps: {},
  };

  // -------------------------------------------------------------------
  // 1. vault::initialize_vault_config
  // -------------------------------------------------------------------
  console.log("\n[1/4] initialize_vault_config");
  if (await accountExists(connection, vaultConfigPda)) {
    console.log("       skipped (already exists)");
    out.steps.initVaultConfig = "skipped";
  } else {
    const sig = await (vaultProgram.methods as any)
      .initializeVaultConfig(PublicKey.default)
      .accounts({
        vaultConfig: vaultConfigPda,
        admin: payer.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    console.log("       tx:", sig);
    out.steps.initVaultConfig = sig;
  }

  // -------------------------------------------------------------------
  // 2. vault::initialize_vault for USDC
  //    Anchor doesn't support init for the share_mint (Mint isn't an
  //    Anchor account type), so the program inits it imperatively from
  //    the supplied share_mint Signer keypair. We persist the keypair so
  //    re-runs can detect the existing mint and skip.
  // -------------------------------------------------------------------
  console.log("\n[2/4] initialize_vault");
  let shareMintPubkey: PublicKey | null = null;
  if (await accountExists(connection, vaultPda)) {
    console.log("       skipped (vault already exists)");
    out.steps.initVault = "skipped";
    // Recover share_mint from a previous run's output if present.
    try {
      const prev = JSON.parse(fs.readFileSync(OUT_PATH, "utf8")) as {
        shareMint?: string;
      };
      if (prev.shareMint) {
        shareMintPubkey = new PublicKey(prev.shareMint);
        console.log("       shareMint (from prior run):", prev.shareMint);
      }
    } catch {
      console.warn(
        "       WARN: vault exists but no edson-devnet.json — share_mint unknown.",
      );
    }
  } else {
    const shareMint = Keypair.generate();
    shareMintPubkey = shareMint.publicKey;
    const sig = await (vaultProgram.methods as any)
      .initializeVault()
      .accounts({
        vault: vaultPda,
        assetMint,
        shareMint: shareMint.publicKey,
        payer: payer.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([shareMint])
      .rpc();
    console.log("       tx:        ", sig);
    console.log("       shareMint: ", shareMint.publicKey.toBase58());
    out.steps.initVault = sig;
  }
  if (shareMintPubkey) {
    out.shareMint = shareMintPubkey.toBase58();
  }

  // -------------------------------------------------------------------
  // 3. loan::initialize_loan_config
  // -------------------------------------------------------------------
  console.log("\n[3/4] initialize_loan_config (custodian = payer)");
  if (await accountExists(connection, loanConfigPda)) {
    console.log("       skipped (already exists)");
    out.steps.initLoanConfig = "skipped";
  } else {
    const sig = await (loanProgram.methods as any)
      .initializeLoanConfig(payer.publicKey, PublicKey.default)
      .accounts({
        loanConfig: loanConfigPda,
        admin: payer.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    console.log("       tx:", sig);
    out.steps.initLoanConfig = sig;
  }

  // -------------------------------------------------------------------
  // 4. vault::deposit 5 USDC (skip if vault_ata already holds ≥ 5 USDC)
  // -------------------------------------------------------------------
  console.log("\n[4/4] deposit 5 USDC");
  if (!shareMintPubkey) {
    throw new Error(
      "deposit needs share_mint pubkey but it isn't known. Re-init the vault " +
        "(delete edson-devnet.json + close the existing vault PDA) and rerun.",
    );
  }
  let currentVaultBalance = 0n;
  try {
    const acc = await getAccount(connection, vaultAta, "confirmed");
    currentVaultBalance = acc.amount;
  } catch {
    // ATA doesn't exist yet → first deposit creates it.
  }
  if (currentVaultBalance >= BigInt(DEPOSIT_AMOUNT_ATOMS)) {
    console.log(
      `       skipped (vault_ata holds ${currentVaultBalance} atoms, ≥ ${DEPOSIT_AMOUNT_ATOMS})`,
    );
    out.steps.deposit = "skipped";
  } else {
    const depositorAta = getAssociatedTokenAddressSync(
      assetMint,
      payer.publicKey,
    );
    const depositorShareAta = getAssociatedTokenAddressSync(
      shareMintPubkey,
      payer.publicKey,
    );

    // Idempotent ATA creates ensure the depositor side accounts exist
    // even on a fresh wallet. The vault_ata is initialized by the
    // deposit ix itself the first time around.
    const tx = new Transaction()
      .add(
        createAssociatedTokenAccountIdempotentInstruction(
          payer.publicKey,
          depositorAta,
          payer.publicKey,
          assetMint,
        ),
      )
      .add(
        createAssociatedTokenAccountIdempotentInstruction(
          payer.publicKey,
          depositorShareAta,
          payer.publicKey,
          shareMintPubkey,
        ),
      )
      .add(
        createAssociatedTokenAccountIdempotentInstruction(
          payer.publicKey,
          vaultAta,
          vaultPda,
          assetMint,
        ),
      )
      .add(
        await (vaultProgram.methods as any)
          .deposit(new BN(DEPOSIT_AMOUNT_ATOMS))
          .accounts({
            vault: vaultPda,
            assetMint,
            shareMint: shareMintPubkey,
            vaultAta,
            depositorAta,
            depositorShareAta,
            depositor: payer.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
            vaultConfig: vaultConfigPda,
            kycAttestation: SystemProgram.programId, // KYC gate OFF
          })
          .instruction(),
      );

    const sig = await provider.sendAndConfirm(tx, [], {
      commitment: "confirmed",
    });
    console.log(
      `       tx:    ${sig}  (deposited ${DEPOSIT_AMOUNT_ATOMS} atoms)`,
    );
    out.steps.deposit = sig;
  }

  // -------------------------------------------------------------------
  // Persist + summary
  // -------------------------------------------------------------------
  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2));
  console.log(`\n→ wrote ${path.relative(process.cwd(), OUT_PATH)}`);
  console.log("\n--- Bootstrap summary ---");
  console.log(JSON.stringify(out, null, 2));
}

main().catch((err) => {
  console.error("bootstrap-edson-devnet failed:", err);
  process.exit(1);
});
