import type { SimulatorOnchain } from "@/lib/marketing/onchain";

interface Props {
  onchain: SimulatorOnchain;
}

function asNumber(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return Number(v);
  return 0;
}

/**
 * Centered "live capacity" pill above the simulator cards. Hidden when
 * the vault read is offline or the vault account is missing — matches
 * Laravel `simulator.blade.php:12-24`.
 */
export function LiveCapacityStrip({ onchain }: Props) {
  if (!onchain.vault.ok) return null;

  const fields =
    (onchain.vault.data?.fields as Record<string, unknown> | undefined) ?? {};
  const totalAssetsUsdc = asNumber(fields.total_assets) / 1_000_000;
  const formatted = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(totalAssetsUsdc);

  return (
    <div className="mb-12 text-center">
      <span
        className="inline-flex items-center gap-2 rounded-full border border-[var(--vx-border-soft)] px-[1.1rem] py-[0.4rem] font-mono text-[0.75rem] text-[var(--vx-text-muted)]"
      >
        <span style={{ color: "var(--vx-accent-mark)" }} aria-hidden>
          ●
        </span>
        <span>
          live ·{" "}
          <strong className="text-[var(--vx-text)]">{formatted} USDC</strong>{" "}
          available right now ·{" "}
          <span className="text-[var(--vx-text-muted)]">
            refreshed {onchain.fetched_at}
          </span>
        </span>
      </span>
    </div>
  );
}
