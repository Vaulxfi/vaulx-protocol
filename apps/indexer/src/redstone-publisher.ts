// RedStone-pattern off-chain price publisher.
//
// Track A→B status: as of writing there is no `@redstone-finance/sdk-solana`
// package on npm (RedStone's first-party SDKs target EVM + their own Casper /
// Radix runtimes; Solana support is on the roadmap but not shipped). The
// publisher therefore implements the *pattern* — push model, signed-payload,
// Anchor-verified, fixed cadence — but with a single Vaulx-controlled signer
// instead of the RedStone signer network. The on-chain shape is
// forward-compatible: when the real SDK ships we swap the signer set without
// touching the indexer's polling / circuit-breaker logic.
//
// Security recap (mirrors `programs/loan/src/lib.rs` SR map):
//   SR-1 freshness:     publisher rejects observations older than 600s
//   SR-2 wrong feed:    every published feed is keyed off `ref_bytes` (PDA)
//   SR-3 attestation:   payload signed by the Vaulx admin keypair only
//   SR-4 publisher key: keypair path is read from env, never hard-coded
//   SR-5 data quality:  refuse to publish unless aggregate.okCount >= 3
//   SR-6 decimals:      median scaled to USD cents (10^-2)

import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { createHash } from "node:crypto";
import fs from "node:fs";

const POLL_INTERVAL_MS = 60_000; // 60s — RedStone's reference cadence.
const MAX_PRICE_AGE_SECONDS = 600;

interface PriceObservation {
  ref: string;
  refBytes: Buffer; // 32-byte canonical id
  medianUsdCents: bigint;
  listings: number;
  fetchedAt: number; // unix seconds
}

export interface AppraisalQuery {
  /** Watch ref string sent to `/api/appraisal`, e.g. "126610LN". */
  ref: string;
  make: string;
  model: string;
  year: number;
  condition: "mint" | "excellent" | "very_good" | "good";
}

export interface RedstonePublisherOpts {
  rpcUrl: string;
  /** Absolute path to a Solana JSON keypair (the Vaulx oracle admin). */
  signerKeypairPath: string;
  /** Loan program id (base58). */
  programId: string;
  /** Base URL of the appraisal endpoint, e.g. "http://localhost:3000". */
  appraisalBaseUrl: string;
  /** One or more watches to refresh on each tick. */
  watchedRefs: AppraisalQuery[];
}

/** sha256(ref).slice(0,32) — stable mapping from a free-form ref string to
 *  the 32-byte PDA seed expected by the loan program. */
export function refBytesFor(ref: string): Buffer {
  return createHash("sha256").update(ref).digest(); // 32 bytes
}

export class RedstonePublisher {
  private connection: Connection;
  private signer: Keypair;
  private programId: PublicKey;
  private appraisalBaseUrl: string;
  private watchedRefs: AppraisalQuery[];
  private timer: NodeJS.Timeout | null = null;
  private inFlight = false;

  constructor(opts: RedstonePublisherOpts) {
    this.connection = new Connection(opts.rpcUrl, "confirmed");
    const secret = JSON.parse(
      fs.readFileSync(opts.signerKeypairPath, "utf-8"),
    ) as number[];
    this.signer = Keypair.fromSecretKey(Uint8Array.from(secret));
    this.programId = new PublicKey(opts.programId);
    this.appraisalBaseUrl = opts.appraisalBaseUrl.replace(/\/+$/, "");
    this.watchedRefs = opts.watchedRefs;
  }

  start() {
    void this.tick();
    this.timer = setInterval(() => void this.tick(), POLL_INTERVAL_MS);
    console.log(
      `[redstone-publisher] started; signer=${this.signer.publicKey.toBase58()} watching ${this.watchedRefs.length} refs`,
    );
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private async tick() {
    if (this.inFlight) {
      console.warn("[redstone-publisher] previous tick still running, skipping");
      return;
    }
    this.inFlight = true;
    try {
      for (const q of this.watchedRefs) {
        try {
          const obs = await this.fetchAppraisal(q);
          if (!obs) continue; // SR-5 — refused at fetch
          if (Date.now() / 1000 - obs.fetchedAt > MAX_PRICE_AGE_SECONDS) {
            console.warn(
              `[redstone-publisher] dropping ${q.ref}: observation aged out before publish`,
            );
            continue;
          }
          await this.publish(obs);
        } catch (err) {
          console.error(
            `[redstone-publisher] ${q.ref} tick error:`,
            (err as Error).message,
          );
        }
      }
    } finally {
      this.inFlight = false;
    }
  }

  private async fetchAppraisal(
    q: AppraisalQuery,
  ): Promise<PriceObservation | null> {
    const url = `${this.appraisalBaseUrl}/api/appraisal`;
    const r = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        make: q.make,
        model: q.model,
        ref: q.ref,
        year: q.year,
        condition: q.condition,
      }),
    });
    if (!r.ok) {
      console.warn(`[redstone-publisher] ${q.ref} appraisal HTTP ${r.status}`);
      return null;
    }
    const j = (await r.json()) as {
      median?: number;
      okCount?: number;
      generatedAt?: number;
    };
    // SR-5 — refuse to publish on insufficient sources. The loan program
    // also enforces this at consume-time, but stopping here keeps wasted
    // signatures (and on-chain rent) off the books.
    if (typeof j.median !== "number" || !Number.isFinite(j.median) || j.median <= 0) {
      console.warn(`[redstone-publisher] ${q.ref} median missing/invalid`);
      return null;
    }
    if (typeof j.okCount !== "number" || j.okCount < 3) {
      console.warn(
        `[redstone-publisher] ${q.ref} only ${j.okCount} sources — refusing to publish`,
      );
      return null;
    }
    const fetchedAt =
      typeof j.generatedAt === "number"
        ? j.generatedAt
        : Math.floor(Date.now() / 1000);
    // SR-6 — scale USD price to cents (2 decimals). Use Math.round on the
    // float-cent intermediate to avoid IEEE-754 drift, then BigInt for the
    // u64 ix arg.
    const medianUsdCents = BigInt(Math.round(j.median * 100));
    return {
      ref: q.ref,
      refBytes: refBytesFor(q.ref),
      medianUsdCents,
      listings: j.okCount,
      fetchedAt,
    };
  }

  private async publish(obs: PriceObservation) {
    // Build the publish_price ix manually (we don't pull in the full Anchor
    // workspace IDL on this lean indexer). The discriminator is the first 8
    // bytes of sha256("global:publish_price").
    //
    // Argument layout:
    //   [u8;32] ref_bytes | u64 median_usd_cents | u32 listings | i64 observed_at
    const disc = createHash("sha256")
      .update("global:publish_price")
      .digest()
      .subarray(0, 8);
    const buf = Buffer.alloc(8 + 32 + 8 + 4 + 8);
    let off = 0;
    disc.copy(buf, off);
    off += 8;
    obs.refBytes.copy(buf, off);
    off += 32;
    buf.writeBigUInt64LE(obs.medianUsdCents, off);
    off += 8;
    buf.writeUInt32LE(obs.listings, off);
    off += 4;
    buf.writeBigInt64LE(BigInt(obs.fetchedAt), off);

    const [priceFeedPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("price_feed"), obs.refBytes],
      this.programId,
    );
    const [loanConfigPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("loan_config")],
      this.programId,
    );

    const ix = new anchor.web3.TransactionInstruction({
      programId: this.programId,
      keys: [
        { pubkey: priceFeedPda, isSigner: false, isWritable: true },
        { pubkey: loanConfigPda, isSigner: false, isWritable: false },
        { pubkey: this.signer.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data: buf,
    });

    const tx = new anchor.web3.Transaction().add(ix);
    const sig = await anchor.web3.sendAndConfirmTransaction(
      this.connection,
      tx,
      [this.signer],
      { commitment: "confirmed" },
    );

    console.log(
      `[redstone-publisher] published ${obs.ref}: $${
        Number(obs.medianUsdCents) / 100
      } (${obs.listings} listings) sig=${sig.slice(0, 8)}…`,
    );
  }
}
