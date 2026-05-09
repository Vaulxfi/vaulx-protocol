import crypto from "node:crypto";

// `@coral-xyz/anchor` (0.30.1) doesn't surface BN as a named ESM export in
// our bridge's "type": "module" runtime — the named import succeeds in TS
// type-checking (it's in the .d.ts) but blows up at runtime under tsx with
// "does not provide an export named 'BN'". Wildcard-import the module and
// destructure BN at the value level — same class, no runtime ESM stumble.
import * as anchor from "@coral-xyz/anchor";
const { BN } = anchor;
import {
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  Transaction,
} from "@solana/web3.js";

import { PROGRAM_IDS, decodeAs } from "../decode";
import {
  deriveLoanConfigPda,
  deriveTrdcStatePda,
  deriveVaultPda,
} from "../pdas";
import { loadLoanProgram } from "../program";
import type { BridgeProvider } from "../provider";

/**
 * Loan-lifecycle write builders.
 *
 * `buildConfirmCustody` is real: bundles `confirm_custody` +
 * `disburse_from_vault` into a single transaction signed by the operator
 * (which doubles as both `custodian` and `borrower` in the demo single-
 * keypair setup). Idempotent ATA creation for the borrower keeps the path
 * resilient against demo loans created without pre-funding the borrower
 * side.
 *
 * `buildPayInstallment` / `buildRenew` / `buildRepay` are still
 * placeholder. Those instructions require the `borrower` to sign in
 * production — operator-as-borrower would let any admin pay any
 * borrower's installments, which is fine in a single-key demo of the
 * custody gate but wrong as a default. They light up when the
 * wallet-signed flow lands (Area A item 2 of the spec).
 */

const LOAN_AUTHORITY_SEED = Buffer.from("loan_authority");

export interface LoanWriteResult {
  ok: true;
  txSignature: string;
  loanId: string;
  accounts: Record<string, string>;
  /** Reserved for the future wallet-signed path. Always null today. */
  unsignedTx: null;
  /**
   * True when the result represents a real on-chain confirmation; false
   * when the response is still a hand-crafted placeholder. Lets clients
   * (Laravel admin view, log scrapers) tell at a glance whether the
   * txSignature points to a real cluster tx or a synthetic string.
   */
  executed: boolean;
  /** Present and `true` only on placeholder responses. */
  _placeholder?: boolean;
}

function placeholderSignature(operation: string): string {
  return `placeholder-${operation}-${Date.now()}`;
}

function commonAccounts(loanId: PublicKey): Record<string, string> {
  return {
    loanConfig: deriveLoanConfigPda().toBase58(),
    trdcState: deriveTrdcStatePda(loanId).toBase58(),
  };
}

/**
 * Real implementation: read TRDC state, derive every related account,
 * build a single Solana transaction containing
 *   1) (idempotent) borrower ATA create
 *   2) loan::confirm_custody(doc_hash)
 *   3) loan::disburse_from_vault(loan_amount)
 * and submit it signed by the operator.
 *
 * `doc_hash` is `sha256("custody-doc-" + loanId)` — deterministic, so the
 * same Laravel loan always lands the same on-chain hash. Laravel can pass
 * an explicit doc_hash in a future revision; for the demo the convention
 * is enough.
 *
 * `assetMint` is supplied by the caller (route layer pulls it from
 * config.demoAssetMint when Laravel doesn't override).
 */
export async function buildConfirmCustody(
  provider: BridgeProvider,
  loanId: PublicKey,
  assetMint: PublicKey,
): Promise<LoanWriteResult> {
  const loanProgram = loadLoanProgram(provider);

  const trdcStatePda = deriveTrdcStatePda(loanId);
  const trdcAccount = await provider.connection.getAccountInfo(
    trdcStatePda,
    "confirmed",
  );
  if (!trdcAccount) {
    throw new Error(`trdc_state_not_found: ${trdcStatePda.toBase58()}`);
  }
  // Anchor 0.30 mutates the IDL (clones + camelCases it) inside
  // `new Program(idl)`, so the program-namespace's coder only knows
  // `trdcState` (camelCase) — not `TRDCState`. Decode against the
  // registry's pristine BorshAccountsCoder (built from the original
  // PascalCase IDL in `chain/decode.ts`) instead, so the account-name
  // lookup matches.
  //
  // **Field-name caveat**: the registry coder uses the IDL's field
  // names *as-written*, which is snake_case (`loan_amount`, not
  // `loanAmount`). Anchor's `program.account.X.fetch` would camelCase
  // them post-decode, but we decode raw via the BorshAccountsCoder so
  // the snake_case stays. Read `loan_amount` literally — typing it
  // here as a string-keyed accessor stops TS from yelling.
  const trdcStateRaw = decodeAs<Record<string, unknown>>(
    "trdc",
    "TRDCState",
    trdcAccount.data,
  );
  const borrower = trdcStateRaw.borrower as PublicKey;
  const loanAmount = trdcStateRaw["loan_amount"] as InstanceType<typeof BN>;
  if (!borrower || !loanAmount) {
    throw new Error(
      `trdc_state_decode_incomplete: borrower=${!!borrower} loan_amount=${!!loanAmount}`,
    );
  }

  const docHash = crypto
    .createHash("sha256")
    .update("custody-doc-" + loanId.toBase58())
    .digest();

  const loanConfigPda = deriveLoanConfigPda();
  const vaultPda = deriveVaultPda(assetMint);
  const [loanAuthorityPda] = PublicKey.findProgramAddressSync(
    [LOAN_AUTHORITY_SEED],
    loanProgram.programId,
  );
  // The vault PDA is off-curve (program-owned), so the ATA helper has to
  // accept off-curve owners — pass `allowOwnerOffCurve = true`.
  const vaultAta = getAssociatedTokenAddressSync(assetMint, vaultPda, true);
  const borrowerAta = getAssociatedTokenAddressSync(
    assetMint,
    borrower,
  );

  // The borrower ATA must exist BEFORE confirm_custody runs, but we
  // can't bundle `createAssociatedTokenAccountIdempotent` in the same
  // tx — vault::disburse's Layer 2 check enforces that the top-level
  // ix (index 0) belongs to the loan program, and the ATA create
  // belongs to the SPL Associated Token Program. Send it as a
  // standalone tx first, idempotently — the on-chain helper is a
  // no-op if the ATA already exists.
  const borrowerAtaExists =
    (await provider.connection.getAccountInfo(borrowerAta, "confirmed")) !==
    null;
  if (!borrowerAtaExists) {
    const ataTx = new Transaction().add(
      createAssociatedTokenAccountIdempotentInstruction(
        provider.operator.publicKey,
        borrowerAta,
        borrower,
        assetMint,
      ),
    );
    await provider.anchor.sendAndConfirm(ataTx, [], {
      commitment: "confirmed",
    });
  }

  // confirm_custody (atomic) — the merge-spec ix that flips
  // PendingCustody → ActiveInCustody, runs vault::disburse, and
  // transitions to Active in ONE on-chain ix. Custodian is the only
  // signer; the program's accounts struct pins `borrower_ata.authority`
  // to `trdc_state.borrower` so the custodian can't redirect principal.
  //
  // `price_feed` is consulted only when `loan_config.oracle_admin !=
  // Pubkey::default()`. The redeployed devnet stack ships oracle OFF
  // (set in bootstrap-edson-devnet.ts), so SystemProgram suffices.
  // Oracle-on demos would inject the real PriceFeed PDA here.
  const confirmIx = await loanProgram.methods
    .confirmCustody(Array.from(docHash))
    .accounts({
      trdcState: trdcStatePda,
      loanConfig: loanConfigPda,
      trdcProgram: new PublicKey(PROGRAM_IDS.trdc),
      custodian: provider.operator.publicKey,
      vault: vaultPda,
      assetMint,
      vaultAta,
      borrowerAta,
      loanAuthority: loanAuthorityPda,
      vaultProgram: new PublicKey(PROGRAM_IDS.vault),
      tokenProgram: TOKEN_PROGRAM_ID,
      instructionsSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
      priceFeed: SystemProgram.programId,
    })
    .instruction();

  const tx = new Transaction().add(confirmIx);

  // The operator wallet on the AnchorProvider signs as the custodian.
  // No other signer is required: borrower_ata.authority is pinned at
  // the accounts-struct level so the borrower's signature is moot for
  // the disburse step folded inside confirm_custody.
  const signature = await provider.anchor.sendAndConfirm(tx, [], {
    commitment: "confirmed",
  });

  return {
    ok: true,
    txSignature: signature,
    loanId: loanId.toBase58(),
    accounts: {
      loanConfig: loanConfigPda.toBase58(),
      trdcState: trdcStatePda.toBase58(),
      vault: vaultPda.toBase58(),
      vaultAta: vaultAta.toBase58(),
      borrowerAta: borrowerAta.toBase58(),
      loanAuthority: loanAuthorityPda.toBase58(),
      borrower: borrower.toBase58(),
      assetMint: assetMint.toBase58(),
    },
    unsignedTx: null,
    executed: true,
  };
}

/**
 * Real implementation: mint a fresh `TRDCState` PDA via
 * `loan::create_ccb_trdc`. The Laravel side calls this when a borrower
 * requests a new loan in the UI — without a real on-chain trdc_state,
 * the subsequent `confirm_custody` would fail with `trdc_state_not_found`.
 *
 * Operator signs as `payer` (= borrower in the demo single-keypair model;
 * `trdc_state.borrower` is captured from the `payer` arg per
 * `initialize_trdc_state` in the trdc program). When the wallet-signed
 * flow lands the real borrower will sign instead, but the ix shape stays
 * the same.
 *
 * Oracle is OFF on Edson's deployed `loan_config` (set in
 * bootstrap-edson-devnet.ts), so:
 *   - `appraisal_value` is consumed directly (no PriceFeed re-derive)
 *   - `_asset_hint` is stored as-zeros on the TRDCState (zero-byte ref)
 *   - `kyc_attestation` and `price_feed` accounts default to SystemProgram
 *
 * `loanIdAtoms` is the loan amount in USDC atoms (6dp), matching what
 * `disburse_from_vault` will eventually move out of the vault.
 *
 * Returns the freshly-minted `loanId` (random pubkey) so Laravel can
 * persist it as `loans.solana_loan_id` and pass it back to the bridge
 * during the eventual `confirm_custody` call.
 */
export async function buildCreateCcbTrdc(
  provider: BridgeProvider,
  args: {
    appraisalAtoms: bigint;
    loanAmountAtoms: bigint;
    termDays: number;
    rateBps: number;
  },
): Promise<LoanWriteResult> {
  const loanProgram = loadLoanProgram(provider);

  const loanIdKp = Keypair.generate();
  const loanId = loanIdKp.publicKey;
  const trdcStatePda = deriveTrdcStatePda(loanId);
  const loanConfigPda = deriveLoanConfigPda();

  const dueTs = Math.floor(Date.now() / 1000) + args.termDays * 86_400;
  const refBytes = Buffer.alloc(32); // oracle OFF → ref_bytes unused

  const signature: string = await (loanProgram.methods as unknown as {
    createCcbTrdc: (...as: unknown[]) => {
      accounts: (a: Record<string, PublicKey>) => {
        rpc: () => Promise<string>;
      };
    };
  })
    .createCcbTrdc(
      loanId,
      new BN(args.appraisalAtoms.toString()),
      new BN(args.loanAmountAtoms.toString()),
      new BN(dueTs),
      new BN(args.rateBps),
      Array.from(refBytes),
    )
    .accounts({
      trdcState: trdcStatePda,
      trdcProgram: new PublicKey(PROGRAM_IDS.trdc),
      payer: provider.operator.publicKey,
      systemProgram: SystemProgram.programId,
      loanConfig: loanConfigPda,
      kycAttestation: SystemProgram.programId, // KYC OFF
      priceFeed: SystemProgram.programId, // oracle OFF
    })
    .rpc();

  return {
    ok: true,
    txSignature: signature,
    loanId: loanId.toBase58(),
    accounts: {
      loanConfig: loanConfigPda.toBase58(),
      trdcState: trdcStatePda.toBase58(),
      borrower: provider.operator.publicKey.toBase58(),
      _dueTs: String(dueTs),
      _appraisalAtoms: args.appraisalAtoms.toString(),
      _loanAmountAtoms: args.loanAmountAtoms.toString(),
      _rateBps: String(args.rateBps),
    },
    unsignedTx: null,
    executed: true,
  };
}

// ---- Placeholder builders (pay / repay / renew). ---------------------
// These routes still answer with deterministic shapes so Laravel can
// integrate the call sites today; the real ix calls land with the
// wallet-signed flow, when we can sign as the borrower instead of as
// the operator.

export function buildPayInstallment(
  loanId: PublicKey,
  amount: bigint,
): LoanWriteResult {
  return {
    ok: true,
    txSignature: placeholderSignature("pay-installment"),
    loanId: loanId.toBase58(),
    accounts: {
      ...commonAccounts(loanId),
      _amount: amount.toString(),
    },
    unsignedTx: null,
    executed: false,
    _placeholder: true,
  };
}

export function buildRenew(
  loanId: PublicKey,
  newTermDays: number,
): LoanWriteResult {
  return {
    ok: true,
    txSignature: placeholderSignature("renew"),
    loanId: loanId.toBase58(),
    accounts: {
      ...commonAccounts(loanId),
      _newTermDays: newTermDays.toString(),
    },
    unsignedTx: null,
    executed: false,
    _placeholder: true,
  };
}

export function buildRepay(loanId: PublicKey): LoanWriteResult {
  return {
    ok: true,
    txSignature: placeholderSignature("repay"),
    loanId: loanId.toBase58(),
    accounts: commonAccounts(loanId),
    unsignedTx: null,
    executed: false,
    _placeholder: true,
  };
}
