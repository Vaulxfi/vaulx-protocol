"use client";

import { useTransition } from "react";

import { signOut } from "@/app/(auth)/actions";
import { Button, type ButtonProps } from "@/components/ui/button";

export type SignOutButtonProps = Omit<ButtonProps, "onClick"> & {
  label?: string;
};

export function SignOutButton({
  label = "Sign out",
  variant = "outline",
  size,
  className,
  ...rest
}: SignOutButtonProps) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      disabled={pending}
      onClick={() => startTransition(() => signOut())}
      data-testid="sign-out-button"
      {...rest}
    >
      {pending ? "Signing out…" : label}
    </Button>
  );
}
