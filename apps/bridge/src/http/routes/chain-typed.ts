import { Router, type Request, type Response } from "express";
import { type Connection, PublicKey } from "@solana/web3.js";

import {
  PROGRAM_IDS,
  type ProgramName,
  cleanForJson,
  decodeAs,
} from "../../chain/decode";
import {
  deriveLoanConfigPda,
  deriveTrdcStatePda,
  deriveVaultPda,
} from "../../chain/pdas";

/**
 * Typed-read endpoints — convenience wrappers over `/chain/account/:pda`
 * that derive the PDA server-side, validate `owner == expected program`,
 * and return only the decoded fields plus minimal context (lamports + slot).
 *
 * Laravel reaches for these instead of the generic raw-bytes endpoint
 * because (a) PDA derivation in PHP is tedious (sha256 + curve25519 off-
 * curve check), and (b) the typed shape is what the SolanaBridge service
 * class will surface to controllers.
 */

interface TypedReadOk {
  pda: PublicKey;
  lamports: number;
  slot: number;
  fields: unknown;
}

type TypedReadResult =
  | { ok: true; data: TypedReadOk }
  | { ok: false; status: number; error: string };

async function readTyped(
  connection: Connection,
  pda: PublicKey,
  programName: ProgramName,
  accountType: string,
): Promise<TypedReadResult> {
  const result = await connection.getAccountInfoAndContext(pda, "confirmed");
  if (!result.value) {
    return { ok: false, status: 404, error: "account_not_found" };
  }
  if (result.value.owner.toBase58() !== PROGRAM_IDS[programName]) {
    return { ok: false, status: 422, error: "wrong_account_type" };
  }
  let fields: unknown;
  try {
    fields = decodeAs(programName, accountType, result.value.data);
  } catch {
    // Owner matches but Borsh decode threw — typically the on-disk IDL
    // drifted from the deployed program. Surface as 500 so ops sees it as
    // "our problem to fix" rather than a client mistake.
    return { ok: false, status: 500, error: "decode_failed" };
  }
  return {
    ok: true,
    data: { pda, lamports: result.value.lamports, slot: result.context.slot, fields },
  };
}

function send(res: Response, r: TypedReadResult): void {
  if (!r.ok) {
    res.status(r.status).json({ ok: false, error: r.error });
    return;
  }
  res.json({
    ok: true,
    data: {
      pda: r.data.pda.toBase58(),
      lamports: r.data.lamports,
      slot: r.data.slot,
      fields: cleanForJson(r.data.fields),
    },
  });
}

export function createChainTypedRouter(connection: Connection): Router {
  const router = Router();

  router.get(
    "/chain/loan-config",
    async (_req: Request, res: Response): Promise<void> => {
      const pda = deriveLoanConfigPda();
      send(res, await readTyped(connection, pda, "loan", "LoanConfig"));
    },
  );

  router.get(
    "/chain/vault/:asset_mint",
    async (req: Request, res: Response): Promise<void> => {
      let assetMint: PublicKey;
      try {
        assetMint = new PublicKey(req.params.asset_mint);
      } catch {
        res.status(400).json({ ok: false, error: "invalid_pubkey" });
        return;
      }
      const pda = deriveVaultPda(assetMint);
      send(res, await readTyped(connection, pda, "vault", "Vault"));
    },
  );

  router.get(
    "/chain/trdc-state/:loan_id",
    async (req: Request, res: Response): Promise<void> => {
      let loanId: PublicKey;
      try {
        loanId = new PublicKey(req.params.loan_id);
      } catch {
        res.status(400).json({ ok: false, error: "invalid_pubkey" });
        return;
      }
      const pda = deriveTrdcStatePda(loanId);
      send(res, await readTyped(connection, pda, "trdc", "TRDCState"));
    },
  );

  return router;
}
