import { Router, type Request, type Response } from "express";
import { type Connection, PublicKey } from "@solana/web3.js";

import { cleanForJson, tryDecodeAccount } from "../../chain/decode";

/**
 * GET /chain/account/:pda — generic on-chain read.
 *
 * Returns the raw account bytes (base64) plus, when the owner is one of the
 * 4 Vaulx programs (loan/vault/trdc/auction), an Anchor-decoded view of the
 * fields. Laravel can rely on `decoded` for the common case and fall back to
 * `dataBase64` for anything outside the registry (SPL token accounts, the
 * system program, etc).
 *
 * Auth: intentionally unauthenticated for now — read-only data, no signing.
 * The HMAC middleware lands in a follow-up commit and will cover this route
 * along with the protocol-side endpoints.
 */
export function createChainAccountRouter(connection: Connection): Router {
  const router = Router();

  router.get("/chain/account/:pda", async (req: Request, res: Response) => {
    let pubkey: PublicKey;
    try {
      pubkey = new PublicKey(req.params.pda);
    } catch {
      res.status(400).json({ ok: false, error: "invalid_pubkey" });
      return;
    }

    const acc = await connection.getAccountInfo(pubkey, "confirmed");
    if (!acc) {
      res.status(404).json({ ok: false, error: "account_not_found" });
      return;
    }

    const decoded = tryDecodeAccount(acc.owner, acc.data);

    res.json({
      ok: true,
      data: {
        pubkey: pubkey.toBase58(),
        owner: acc.owner.toBase58(),
        lamports: acc.lamports,
        executable: acc.executable,
        dataLength: acc.data.length,
        dataBase64: acc.data.toString("base64"),
        decoded: decoded
          ? { ...decoded, fields: cleanForJson(decoded.fields) }
          : null,
      },
    });
  });

  return router;
}
