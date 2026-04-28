"use client";

import { PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDeposit } from "@/lib/chain/vault";

const schema = z.object({
  amount: z.coerce
    .number({ invalid_type_error: "Enter an amount" })
    .positive()
    .min(1, "≥ 1 USDC"),
});

type FormValues = z.infer<typeof schema>;

export function DepositForm({ assetMint }: { assetMint: PublicKey }) {
  const { publicKey } = useWallet();
  const mutation = useDeposit(assetMint);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { amount: 1 },
  });

  async function submitDeposit(amount: number) {
    const atoms = BigInt(Math.round(amount * 1_000_000));
    try {
      const sig = await mutation.mutateAsync(atoms);
      toast.success(`Deposit confirmed: ${sig.slice(0, 8)}…`);
      reset({ amount: 1 });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    }
  }

  async function onSubmit(values: FormValues) {
    if (!publicKey) {
      toast.error("Connect your wallet first");
      return;
    }
    await submitDeposit(values.amount);
  }

  const pending = isSubmitting || mutation.isPending;

  const formEl = (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-3 sm:flex-row sm:items-start"
    >
      <div className="flex-1">
        <Input
          type="number"
          step="0.000001"
          min={1}
          disabled={pending || !publicKey}
          placeholder="Amount (USDC)"
          {...register("amount")}
        />
        {errors.amount ? (
          <p className="mt-1 text-xs text-destructive">
            {errors.amount.message}
          </p>
        ) : null}
      </div>
      <Button
        type="submit"
        disabled={pending || !publicKey}
        className="bg-brand-gold text-brand-blue hover:bg-brand-gold/90 sm:w-40"
      >
        {pending ? "Depositing…" : "Deposit"}
      </Button>
    </form>
  );

  return formEl;
}
