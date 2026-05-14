"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUser } from "@/lib/auth/client";
import { createBrowserClient } from "@vaulx/supabase/browser";

import { linkAuthenticatedWallet } from "@/app/(auth)/actions";

const REDIRECT_AFTER_SIGNIN = "/";
const STATEMENT =
  "Sign in to Vaulx with your Solana wallet. By signing, you agree to the Vaulx Terms of Service.";

export type SignInModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SignInModal({ open, onOpenChange }: SignInModalProps) {
  const wallet = useWallet();
  const { setVisible: setWalletModalVisible } = useWalletModal();
  const { refresh } = useUser();
  const router = useRouter();
  const [busy, setBusy] = useState<"direct" | "crossmint" | null>(null);

  const runDirectSiws = useCallback(async () => {
    if (busy) return;
    setBusy("direct");
    try {
      // If no wallet is connected yet, open the wallet-adapter modal and let
      // the user pick one. The modal stays open underneath; we bail out so
      // they can re-trigger sign-in once a wallet is connected.
      if (!wallet.connected || !wallet.publicKey) {
        setWalletModalVisible(true);
        return;
      }
      if (typeof wallet.signMessage !== "function") {
        toast.error("This wallet does not support message signing.");
        return;
      }

      const supabase = createBrowserClient();
      const { data, error } = await supabase.auth.signInWithWeb3({
        chain: "solana",
        statement: STATEMENT,
        // wallet-adapter useWallet() result is structurally compatible with
        // the SolanaWallet interface Supabase expects ({ publicKey, signMessage }).
        // The cast keeps the shape narrow without dragging in adapter types.
        wallet: wallet as unknown as Parameters<
          typeof supabase.auth.signInWithWeb3
        >[0] extends { wallet?: infer W }
          ? W
          : never,
      });

      if (error || !data?.user) {
        toast.error(error?.message ?? "Sign-in failed");
        return;
      }

      const pubkey = wallet.publicKey.toBase58();
      const link = await linkAuthenticatedWallet({ wallet: pubkey });
      if (!link.ok) {
        if (link.code === "conflict") {
          toast.error("This wallet is already linked to another account.");
        } else {
          toast.error(link.message);
        }
        return;
      }

      await refresh();
      toast.success("Signed in");
      onOpenChange(false);
      router.push(REDIRECT_AFTER_SIGNIN);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setBusy(null);
    }
  }, [
    busy,
    wallet,
    setWalletModalVisible,
    refresh,
    onOpenChange,
    router,
  ]);

  // The Crossmint smart-wallet path is intentionally stubbed for this wave:
  // @crossmint/wallets-sdk@1.0.14 does not expose detached `signMessage` on
  // the Solana smart wallet (only `sendTransaction`). That blocks the
  // signInWithWeb3 SIWS flow as drafted. See
  // apps/web/src/components/providers/crossmint-wallet-adapter.ts for the
  // canonical write-up. Until Crossmint exposes a signMessage primitive,
  // the button is rendered disabled so the divider/visual rhythm of the
  // spec is preserved but the user cannot mistake it for a working flow.

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-[var(--rule)] bg-[var(--bg)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Sign in to Vaulx
          </DialogTitle>
          <DialogDescription className="text-sm text-[var(--ink-muted)]">
            Wallet-native sign-in. Your Solana wallet is your identity.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 pt-2">
          <Button
            type="button"
            variant="default"
            className={cn(
              "w-full justify-between opacity-60",
              "cursor-not-allowed",
            )}
            disabled
            aria-disabled="true"
            data-testid="sign-in-crossmint"
          >
            <span>Continue with email or social</span>
            <span className="ml-3 rounded-full border border-[var(--rule)] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
              Coming soon
            </span>
          </Button>

          <div className="relative my-1 flex items-center">
            <div className="flex-1 border-t border-[var(--rule)]" />
            <span className="mx-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
              or
            </span>
            <div className="flex-1 border-t border-[var(--rule)]" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full justify-start"
            onClick={runDirectSiws}
            disabled={busy !== null}
            data-testid="sign-in-direct"
          >
            {busy === "direct"
              ? "Signing…"
              : wallet.connected
                ? "I already have a wallet"
                : "Connect a Solana wallet"}
          </Button>

          <p className="pt-2 text-center text-[10px] text-[var(--ink-muted)]">
            By signing in you agree to the Vaulx{" "}
            <a className="underline" href="/legal/terms">
              Terms
            </a>
            .
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
