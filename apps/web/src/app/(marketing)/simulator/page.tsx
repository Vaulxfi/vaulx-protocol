import type { Metadata } from "next";

import { LiveCapacityStrip } from "@/components/marketing/simulator/live-capacity-strip";
import { SimulatorForm } from "@/components/marketing/simulator/simulator-form";
import { readSimulatorOnchain } from "@/lib/marketing/onchain";

// Server-render every 60s — mirrors Laravel HomeController's
// `ONCHAIN_CACHE_TTL_SECONDS = 60` cache window for the live capacity pill.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Simulator — Vaulx",
  description:
    "Loan simulator — find out how much you can borrow using your assets as collateral.",
};

export default async function SimulatorPage() {
  const onchain = await readSimulatorOnchain();

  return (
    <div className="mx-auto w-full max-w-[1320px] px-4 py-12 md:px-6">
      <div className="mb-12 text-center">
        <h2
          className="font-sans font-bold tracking-[-0.025em] text-[var(--vx-text)]"
          style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.25rem)", lineHeight: 1.15 }}
        >
          Loan Simulator
        </h2>
        <p
          className="text-[var(--vx-text-muted)]"
          style={{ maxWidth: "38rem", margin: "1rem auto 0" }}
        >
          Find out how much you can borrow using your assets as collateral
        </p>
      </div>

      <LiveCapacityStrip onchain={onchain} />

      <SimulatorForm />
    </div>
  );
}
