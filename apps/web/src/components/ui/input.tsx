import * as React from "react";

import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full border border-[var(--rule-strong)] bg-[var(--bg)] px-3 py-2 font-mono text-sm text-[var(--ink)] transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[var(--ink-muted)] focus:border-[var(--brand)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
