import type { ReactNode } from "react";

export function PhoneBezel({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto my-12 hidden md:block">
      <div className="relative w-[393px] h-[852px] rounded-[55px] border-[6px] border-[#1a1917] bg-[var(--bg)] shadow-[0_60px_120px_-30px_rgba(0,0,0,0.5)] overflow-hidden">
        {/* Dynamic island */}
        <div className="absolute left-1/2 top-2 -translate-x-1/2 z-50 h-[37px] w-[126px] rounded-full bg-black" />
        {/* Status bar */}
        <div className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-7 py-2 text-[12px] font-semibold text-[var(--ink)]">
          <span>9:41</span>
          <span className="opacity-0">VAULX</span>
          <span>VAULX</span>
        </div>
        {/* Inner viewport */}
        <div className="absolute inset-0 pt-[44px] pb-[18px] overflow-y-auto">
          {children}
        </div>
        {/* Home indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-50 h-[5px] w-[134px] rounded-full bg-[var(--ink)]/60" />
      </div>
    </div>
  );
}

export function PhoneFullBleed({ children }: { children: ReactNode }) {
  // mobile: full-bleed, no bezel
  return <div className="md:hidden min-h-screen">{children}</div>;
}
