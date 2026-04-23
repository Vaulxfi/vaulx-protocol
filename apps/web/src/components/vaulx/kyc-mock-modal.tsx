"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  open: boolean;
  walletPubkey: string | undefined;
  onPass: () => void;
  onOpenChange: (open: boolean) => void;
};

const FAKE_VERIFY_MS = 3000;

export function KycMockModal({ open, walletPubkey, onPass, onOpenChange }: Props) {
  const [state, setState] = useState<"idle" | "verifying" | "done">("idle");

  useEffect(() => {
    if (!open) {
      setState("idle");
      return;
    }
    setState("verifying");
    const t = setTimeout(() => setState("done"), FAKE_VERIFY_MS);
    return () => clearTimeout(t);
  }, [open]);

  function handlePass() {
    if (walletPubkey) {
      try {
        localStorage.setItem(
          `vaulx_kyc_${walletPubkey}`,
          JSON.stringify({ wallet: walletPubkey, passedAt: Date.now() })
        );
      } catch {
        // ignore storage errors (private mode etc.)
      }
    }
    onPass();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Identity check</DialogTitle>
          <DialogDescription>
            First-time depositors are verified via Civic + Blockpass. This is a
            mock for Phase 1 — no data leaves your device.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3 py-2">
          <span className="inline-flex items-center rounded-md border border-brand-gold/40 bg-brand-gold/10 px-2 py-1 text-xs font-medium text-brand-blue">
            [Civic]
          </span>
          <span className="inline-flex items-center rounded-md border border-brand-gold/40 bg-brand-gold/10 px-2 py-1 text-xs font-medium text-brand-blue">
            [Blockpass]
          </span>
        </div>

        <div className="flex flex-col items-center justify-center gap-3 py-6">
          {state === "verifying" ? (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-brand-blue" />
              <p className="text-sm text-muted-foreground">
                Verifying identity…
              </p>
            </>
          ) : (
            <>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <Check className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium text-foreground">
                Verification passed
              </p>
            </>
          )}
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handlePass}
            disabled={state !== "done"}
            className="bg-brand-gold text-brand-blue hover:bg-brand-gold/90"
          >
            Proceed
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
