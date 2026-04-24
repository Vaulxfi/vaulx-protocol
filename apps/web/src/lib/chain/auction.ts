"use client";

import { useMemo } from "react";
import { BN, AnchorProvider, type Idl, type Program } from "@coral-xyz/anchor";
import {
  useConnection,
  useAnchorWallet,
  useWallet,
} from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { auction as auctionFacade } from "@vaulx/anchor-client";

import {
  TRDC_PROGRAM_ID,
  VAULT_PROGRAM_ID,
  deriveVaultPda,
} from "./loan-accounts";

export const AUCTION_PROGRAM_ID = new PublicKey(auctionFacade.programId);

// ---------------------------------------------------------------------------
// PDA helpers
// ---------------------------------------------------------------------------

/** Auction PDA: seeds = [b"auction", trdc_state]. */
export function deriveAuctionPda(trdcState: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("auction"), trdcState.toBuffer()],
    AUCTION_PROGRAM_ID,
  );
  return pda;
}

/** auction_authority PDA: seeds = [b"auction_authority"]. */
export function deriveAuctionAuthorityPda(): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("auction_authority")],
    AUCTION_PROGRAM_ID,
  );
  return pda;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AuctionStatusKey = "open" | "closed";
export type AuctionDerivedStatus = "OPEN" | "ENDED" | "CLOSED";

export interface AuctionAccount {
  auctionPda: PublicKey;
  trdcState: PublicKey;
  assetMint: PublicKey;
  reservePrice: bigint;
  minIncrement: bigint;
  startTs: number;
  endTs: number;
  highBid: bigint;
  highBidder: PublicKey;
  escrowAta: PublicKey;
  vault: PublicKey;
  status: AuctionStatusKey;
  /** Derived: OPEN (on-chain open, now < end_ts) / ENDED (on-chain open, now >= end_ts) / CLOSED (on-chain closed). */
  derivedStatus: AuctionDerivedStatus;
}

function toBig(v: unknown): bigint {
  if (v == null) return 0n;
  if (typeof v === "bigint") return v;
  if (typeof v === "number") return BigInt(v);
  if (typeof v === "string") return BigInt(v);
  if (typeof (v as { toString?: () => string }).toString === "function") {
    return BigInt((v as { toString: () => string }).toString());
  }
  return 0n;
}

function decodeAuctionStatus(raw: Record<string, unknown> | undefined): AuctionStatusKey {
  if (!raw) return "open";
  const k = Object.keys(raw)[0];
  if (!k) return "open";
  return k.toLowerCase() as AuctionStatusKey;
}

export function deriveStatus(
  statusKey: AuctionStatusKey,
  endTs: number,
  nowSec: number = Math.floor(Date.now() / 1000),
): AuctionDerivedStatus {
  if (statusKey === "closed") return "CLOSED";
  if (nowSec >= endTs) return "ENDED";
  return "OPEN";
}

/** Readonly AnchorProvider suitable for reads without a connected wallet. */
function makeReadonlyProvider(connection: ReturnType<typeof useConnection>["connection"]): AnchorProvider {
  const dummy = {
    publicKey: PublicKey.default,
    signTransaction: async <T,>(tx: T) => tx,
    signAllTransactions: async <T,>(txs: T[]) => txs,
  };
  return new AnchorProvider(connection, dummy, { commitment: "confirmed" });
}

function mapAuctionAccount(
  auctionPda: PublicKey,
  raw: Record<string, unknown>,
): AuctionAccount {
  const trdcState = (raw.trdcState ?? raw.trdc_state) as PublicKey;
  const assetMint = (raw.assetMint ?? raw.asset_mint) as PublicKey;
  const reservePrice = toBig(raw.reservePrice ?? raw.reserve_price);
  const minIncrement = toBig(raw.minIncrement ?? raw.min_increment);
  const startTs = Number(toBig(raw.startTs ?? raw.start_ts));
  const endTs = Number(toBig(raw.endTs ?? raw.end_ts));
  const highBid = toBig(raw.highBid ?? raw.high_bid);
  const highBidder = (raw.highBidder ?? raw.high_bidder) as PublicKey;
  const escrowAta = (raw.escrowAta ?? raw.escrow_ata) as PublicKey;
  const vault = raw.vault as PublicKey;
  const statusKey = decodeAuctionStatus(
    raw.status as Record<string, unknown> | undefined,
  );
  return {
    auctionPda,
    trdcState,
    assetMint,
    reservePrice,
    minIncrement,
    startTs,
    endTs,
    highBid,
    highBidder,
    escrowAta,
    vault,
    status: statusKey,
    derivedStatus: deriveStatus(statusKey, endTs),
  };
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export interface AuctionListItem {
  auction_pda: string;
  trdc_pda: string;
  asset_mint: string;
  reserve_price: string;
  min_increment: string;
  start_ts: number;
  end_ts: number;
  high_bid: string;
  high_bidder: string;
  status: AuctionDerivedStatus;
}

export interface AuctionListResponse {
  auctions: AuctionListItem[];
  source: "live" | "empty" | "supabase_not_configured";
}

export function useAuctionList() {
  return useQuery<AuctionListResponse>({
    queryKey: ["auction-list"],
    refetchInterval: 15_000,
    queryFn: async () => {
      const res = await fetch("/api/auctions", { cache: "no-store" });
      if (!res.ok) throw new Error(`auction list: ${res.status}`);
      return (await res.json()) as AuctionListResponse;
    },
  });
}

export function useAuction(auctionPda: PublicKey | string | null | undefined) {
  const { connection } = useConnection();

  const pda = useMemo(() => {
    if (!auctionPda) return null;
    if (auctionPda instanceof PublicKey) return auctionPda;
    try {
      return new PublicKey(auctionPda);
    } catch {
      return null;
    }
  }, [auctionPda]);

  return useQuery<AuctionAccount | null>({
    queryKey: ["auction", pda?.toBase58() ?? "none"],
    enabled: !!pda,
    refetchInterval: 10_000,
    queryFn: async () => {
      if (!pda) return null;
      const provider = makeReadonlyProvider(connection);
      const program = auctionFacade.program(provider) as Program<Idl>;
      try {
        const raw = (await (program.account as any).auction.fetch(pda)) as
          | Record<string, unknown>
          | null;
        if (!raw) return null;
        return mapAuctionAccount(pda, raw);
      } catch (e) {
        if (
          e instanceof Error &&
          /Account does not exist|has no data|AccountNotFound/i.test(e.message)
        ) {
          return null;
        }
        throw e;
      }
    },
  });
}

export interface BidEvent {
  auction: string;
  bidder: string;
  amount: string;
  high_bid_previous: string;
  ts: number;
  slot: number;
  signature: string;
  created_at: string;
}

export interface BidHistoryResponse {
  bids: BidEvent[];
  source: "live" | "supabase_not_configured" | "empty";
}

export function useAuctionBids(auctionPda: string | null | undefined) {
  return useQuery<BidHistoryResponse>({
    queryKey: ["auction-bids", auctionPda ?? "none"],
    enabled: !!auctionPda,
    refetchInterval: 10_000,
    queryFn: async () => {
      const res = await fetch(
        `/api/auctions/${encodeURIComponent(auctionPda!)}/bids`,
        { cache: "no-store" },
      );
      if (!res.ok) throw new Error(`bid history: ${res.status}`);
      return (await res.json()) as BidHistoryResponse;
    },
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export interface PlaceBidArgs {
  auctionPda: PublicKey;
  assetMint: PublicKey;
  /** Current `high_bidder` from the auction state. May be `PublicKey.default` when no bids yet. */
  highBidder: PublicKey;
  /** USDC atoms (×1_000_000). */
  amount: bigint;
}

export interface AuctionTxResult {
  txSig: string;
}

export function usePlaceBid() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (args: PlaceBidArgs): Promise<AuctionTxResult> => {
      if (!wallet) throw new Error("Connect your wallet first");
      if (args.amount <= 0n) throw new Error("Amount must be > 0");

      const provider = new AnchorProvider(connection, wallet, {
        commitment: "confirmed",
      });
      const program = auctionFacade.program(provider) as Program<Idl>;

      const escrowAta = getAssociatedTokenAddressSync(
        args.assetMint,
        args.auctionPda,
        true,
      );
      const bidderAta = getAssociatedTokenAddressSync(
        args.assetMint,
        wallet.publicKey,
      );

      // When there is no prior bidder, the IDL says we can pass the bidder's
      // own ATA — the program validates mint matches and only debits when
      // there's an actual refund owed.
      const previousBidderAta =
        args.highBidder.equals(PublicKey.default)
          ? bidderAta
          : getAssociatedTokenAddressSync(args.assetMint, args.highBidder);

      const sig = await (program.methods as any)
        .placeBid(new BN(args.amount.toString()))
        .accounts({
          auction: args.auctionPda,
          assetMint: args.assetMint,
          escrowAta,
          bidderAta,
          previousBidderAta,
          bidder: wallet.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      qc.invalidateQueries({
        queryKey: ["auction", args.auctionPda.toBase58()],
      });
      qc.invalidateQueries({
        queryKey: ["auction-bids", args.auctionPda.toBase58()],
      });
      qc.invalidateQueries({ queryKey: ["auction-list"] });

      return { txSig: sig as string };
    },
  });
}

export interface CloseAuctionArgs {
  auctionPda: PublicKey;
  /** TRDCState PDA. */
  trdcState: PublicKey;
  assetMint: PublicKey;
  /** Vault PDA (owner of `vault_ata`). Can be re-derived from `asset_mint`. */
  vault?: PublicKey;
}

export function useCloseAuction() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (args: CloseAuctionArgs): Promise<AuctionTxResult> => {
      if (!wallet) throw new Error("Connect your wallet first");

      const provider = new AnchorProvider(connection, wallet, {
        commitment: "confirmed",
      });
      const program = auctionFacade.program(provider) as Program<Idl>;

      const vaultPda = args.vault ?? deriveVaultPda(args.assetMint);
      const escrowAta = getAssociatedTokenAddressSync(
        args.assetMint,
        args.auctionPda,
        true,
      );
      const vaultAta = getAssociatedTokenAddressSync(
        args.assetMint,
        vaultPda,
        true,
      );
      const auctionAuthority = deriveAuctionAuthorityPda();

      const sig = await (program.methods as any)
        .closeAuction()
        .accounts({
          auction: args.auctionPda,
          trdcState: args.trdcState,
          assetMint: args.assetMint,
          escrowAta,
          vaultAta,
          vault: vaultPda,
          auctionAuthority,
          instructionsSysvar: new PublicKey(
            "Sysvar1nstructions1111111111111111111111111",
          ),
          trdcProgram: TRDC_PROGRAM_ID,
          vaultProgram: VAULT_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          caller: wallet.publicKey,
        })
        .rpc();

      qc.invalidateQueries({
        queryKey: ["auction", args.auctionPda.toBase58()],
      });
      qc.invalidateQueries({ queryKey: ["auction-list"] });

      return { txSig: sig as string };
    },
  });
}

// ---------------------------------------------------------------------------
// Shared utilities
// ---------------------------------------------------------------------------

export function shortPda(pk: string | PublicKey | null | undefined, width = 4): string {
  if (!pk) return "—";
  const s = typeof pk === "string" ? pk : pk.toBase58();
  if (s.length <= width * 2 + 1) return s;
  return `${s.slice(0, width)}…${s.slice(-width)}`;
}

export function useUsdcBalance(assetMint: PublicKey | undefined) {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  return useQuery({
    queryKey: [
      "userUsdc-auction",
      assetMint?.toBase58() ?? "none",
      publicKey?.toBase58() ?? "none",
    ],
    enabled: !!assetMint && !!publicKey,
    queryFn: async (): Promise<bigint> => {
      if (!assetMint || !publicKey) return 0n;
      const ata = getAssociatedTokenAddressSync(assetMint, publicKey);
      try {
        const { getAccount } = await import("@solana/spl-token");
        const acc = await getAccount(connection, ata);
        return acc.amount;
      } catch {
        return 0n;
      }
    },
  });
}
