"use client";
import type { ReactNode } from "react";
import type { DemoFormFactor } from "../_lib/types";
import { useMediaQuery } from "../_lib/use-media-query";
import { PhoneBezel, PhoneFullBleed } from "./phone-bezel";
import { DemoTopBar } from "./demo-top-bar";
import { DemoFooterNav } from "./demo-footer-nav";

export function DemoShell({
  children,
  formFactor,
}: {
  children: ReactNode;
  formFactor: DemoFormFactor;
}) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  return (
    <>
      <DemoTopBar />
      {formFactor === "phone" ? (
        isDesktop ? (
          <PhoneBezel>
            {children}
            <DemoFooterNav />
          </PhoneBezel>
        ) : (
          <PhoneFullBleed>
            {children}
            <DemoFooterNav />
          </PhoneFullBleed>
        )
      ) : (
        <main className="mx-auto max-w-[1280px] px-6 py-12 md:py-20">{children}</main>
      )}
    </>
  );
}
