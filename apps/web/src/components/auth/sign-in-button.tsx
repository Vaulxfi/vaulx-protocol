"use client";

import { useState } from "react";

import { Button, type ButtonProps } from "@/components/ui/button";

import { SignInModal } from "./sign-in-modal";

export type SignInButtonProps = Omit<ButtonProps, "onClick"> & {
  label?: string;
};

export function SignInButton({
  label = "Sign in",
  variant = "default",
  size,
  className,
  ...rest
}: SignInButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        onClick={() => setOpen(true)}
        data-testid="sign-in-button"
        {...rest}
      >
        {label}
      </Button>
      <SignInModal open={open} onOpenChange={setOpen} />
    </>
  );
}
