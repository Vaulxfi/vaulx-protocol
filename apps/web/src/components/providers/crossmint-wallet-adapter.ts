"use client";
// Crossmint <-> Solana wallet-adapter bridge — Phase B.
//
// ## Why this is a "soft bridge", not a full Adapter
//
// The Crossmint client SDK (`@crossmint/wallets-sdk@1.0.14`, re-exported via
// `@crossmint/client-sdk-react-ui@4.1.5`) does NOT expose a detached
// `signTransaction(VersionedTransaction): Promise<VersionedTransaction>` on
// the smart wallet — by design. Crossmint's Solana model is:
//
//   wallet.sendTransaction({ transaction }) → submits via Crossmint's backend,
//                                              returns { hash, explorerLink, transactionId }
//   wallet.sendTransaction({ ..., options: { prepareOnly: true } })
//                                            → returns { transactionId } only;
//                                              the tx still lives on Crossmint's API
//                                              and is approved out-of-band.
//
// There is NO public API path that takes a VersionedTransaction, runs the
// smart-wallet signers, and returns a fully-signed VersionedTransaction the
// caller can submit through `connection.sendRawTransaction`. That's the
// shape Anchor's `AnchorProvider` (and every wallet-adapter `Adapter`) needs.
//
// SDK file evidence:
//   node_modules/.pnpm/@crossmint+wallets-sdk@1.0.14_*/.../wallets/solana.d.ts
//     class SolanaWallet { sendTransaction(...) }   // submit-only
//   node_modules/.pnpm/@crossmint+wallets-sdk@1.0.14_*/.../types-*.d.ts
//     SolanaTransactionInput = ({ transaction: VersionedTransaction } | ...) & {
//       options?: TransactionInputOptions   // PrepareOnly + signer override
//     }
//   The `SignerAdapter.signTransaction(string)` on `Wallet.signer` returns a
//   raw signature blob, not a signed VersionedTransaction — and is not the
//   smart-wallet's actual operational signer (Squads multisig flow lives on
//   Crossmint's backend, not in the client SDK).
//
// ## What this file does
//
// 1) Exposes `useCrossmintIdentity()` — a thin selector over `useDemoSession()`
//    that exposes `{ pubkey, email, provider }` when a Crossmint sign-in has
//    completed (mock or real). Lets UI components show a unified "wallet"
//    chip without having to thread Crossmint's React context everywhere.
//
// 2) Exposes `useUnifiedWallet()` — merges the Solana wallet-adapter state
//    with the Crossmint identity state into a single shape:
//      {
//        provider: "phantom" | "solflare" | "crossmint" | null,
//        publicKey: PublicKey | null,
//        canSign: boolean,         // true only when wallet-adapter is connected
//        email?: string,
//        identityOnly: boolean,    // true when Crossmint is signed-in but no
//                                  // wallet-adapter wallet is connected — the
//                                  // chain hooks won't be able to submit txns
//      }
//    This is what `LendDepositPanel` and other action components consume to
//    decide between "show deposit form" and "ask user to also connect Phantom".
//
// 3) When/if Crossmint ships a detached signing API on the client SDK
//    (likely `wallet.signTransaction(tx): Promise<VersionedTransaction>` or
//    a callback-shaped signer config), the swap is:
//      - turn `useUnifiedWallet().canSign` into `(walletAdapter.connected ||
//        crossmintWallet?.signTransaction != null)`
//      - drop in a real `BaseSignerWalletAdapter` subclass here that
//        delegates to `crossmintWallet.signTransaction`, register it in
//        `wallet-provider.tsx`, and the chain hooks Just Work unchanged.
//    The integration surface stays inside this file.

import { useMemo } from "react";
import { PublicKey } from "@solana/web3.js";
import { useWallet as useSolanaWallet } from "@solana/wallet-adapter-react";

import { useDemoSession } from "@/app/demo/_lib/use-demo-session";

export type WalletProvider = "phantom" | "solflare" | "crossmint" | "other";

export interface UnifiedWallet {
  /** Active provider (whichever has a usable pubkey). Phantom/Solflare win
   * for tx-signing flows; Crossmint surfaces only when wallet-adapter has
   * not connected anything. */
  provider: WalletProvider | null;
  /** Best-known on-chain pubkey. Solana wallet-adapter takes priority because
   * the chain hooks bind their `signTransaction` to it. */
  publicKey: PublicKey | null;
  /** True when an Anchor-signing path is available. Currently equivalent to
   * `walletAdapter.publicKey != null`. Crossmint alone is NOT signable
   * (see file header). */
  canSign: boolean;
  /** True when Crossmint is signed-in but no wallet-adapter wallet is
   * connected. UI should prompt the user to also connect Phantom/Solflare
   * for actions that submit txns. */
  identityOnly: boolean;
  /** Crossmint email when present. */
  email?: string;
}

export function useCrossmintIdentity(): {
  pubkey: PublicKey | null;
  email?: string;
  isCrossmint: boolean;
} {
  const { session } = useDemoSession();
  const w = session?.wallet;
  return useMemo(() => {
    if (!w || w.provider !== "crossmint" || !w.pubkey) {
      return { pubkey: null, email: undefined, isCrossmint: false };
    }
    let pk: PublicKey | null = null;
    try {
      pk = new PublicKey(w.pubkey);
    } catch {
      // Mock pubkey is not base58 — fine, identity-only chip still renders.
      pk = null;
    }
    return { pubkey: pk, email: w.email, isCrossmint: true };
  }, [w]);
}

export function useUnifiedWallet(): UnifiedWallet {
  const wa = useSolanaWallet();
  const xm = useCrossmintIdentity();

  return useMemo<UnifiedWallet>(() => {
    if (wa.publicKey) {
      const name = wa.wallet?.adapter.name?.toLowerCase() ?? "";
      let provider: WalletProvider = "other";
      if (name.includes("phantom")) provider = "phantom";
      else if (name.includes("solflare")) provider = "solflare";
      return {
        provider,
        publicKey: wa.publicKey,
        canSign: true,
        identityOnly: false,
        email: xm.email,
      };
    }
    if (xm.isCrossmint) {
      return {
        provider: "crossmint",
        publicKey: xm.pubkey, // may be null for mock
        canSign: false,
        identityOnly: true,
        email: xm.email,
      };
    }
    return {
      provider: null,
      publicKey: null,
      canSign: false,
      identityOnly: false,
    };
  }, [wa.publicKey, wa.wallet, xm]);
}

/** Short pretty label for the wallet-status chip. */
export function formatWalletLabel(u: UnifiedWallet): string {
  if (u.provider == null) return "Connect wallet";
  const pkStr =
    u.publicKey?.toBase58() ?? (u.identityOnly ? "mock" : "—");
  const short = pkStr.length > 8 ? `${pkStr.slice(0, 4)}…${pkStr.slice(-4)}` : pkStr;
  const name = u.provider === "crossmint" ? "Crossmint" : capitalize(u.provider);
  if (u.email) return `${name} · ${u.email} · ${short}`;
  return `${name} · ${short}`;
}

function capitalize(s: string): string {
  return s.length === 0 ? s : s.charAt(0).toUpperCase() + s.slice(1);
}
