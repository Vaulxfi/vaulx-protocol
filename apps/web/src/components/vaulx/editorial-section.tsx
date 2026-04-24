import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface EditorialSectionProps {
  eyebrow?: string;
  headline?: string;
  lead?: string;
  children?: ReactNode;
  className?: string;
  align?: "left" | "center";
  tone?: "default" | "muted";
}

export function EditorialSection({
  eyebrow,
  headline,
  lead,
  children,
  className,
  align = "left",
  tone = "default"
}: EditorialSectionProps) {
  return (
    <section
      className={cn(
        "relative",
        tone === "muted" && "bg-[var(--bg-elev-1)]",
        className
      )}
    >
      {(eyebrow || headline || lead) && (
        <header
          className={cn(
            "flex flex-col gap-5",
            align === "center" && "items-center text-center"
          )}
        >
          {eyebrow && (
            <span className="eyebrow">{eyebrow}</span>
          )}
          {headline && (
            <h2 className="display-lg max-w-[18ch]">{headline}</h2>
          )}
          {lead && <p className="lead">{lead}</p>}
        </header>
      )}
      {children}
    </section>
  );
}
