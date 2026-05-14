import type { HomeOnchain } from "@/lib/marketing/onchain";

import { PitchLine } from "./pitch-line";
import { PitchNumber } from "./pitch-number";

interface Props {
  onchain: HomeOnchain;
}

const DEFAULT_ORACLE = "11111111111111111111111111111111";

function asNumber(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return Number(v);
  return 0;
}

/**
 * Live on-chain stats — devnet snapshot, refreshed server-side every 60s.
 * Hidden when both reads are offline so the public landing degrades to
 * its static narrative (matches Laravel home.blade.php line 52).
 */
export function LiveVaultStrip({ onchain }: Props) {
  const vaultOk = onchain.vault.ok;
  const loanCfgOk = onchain.loan_config.ok;

  if (!vaultOk && !loanCfgOk) {
    return null;
  }

  const vaultFields =
    (onchain.vault.data?.fields as Record<string, unknown> | undefined) ?? {};
  const cfgFields =
    (onchain.loan_config.data?.fields as Record<string, unknown> | undefined) ?? {};

  const totalAssetsUsdc = asNumber(vaultFields.total_assets) / 1_000_000;
  const slot = asNumber(onchain.vault.data?.slot);
  const kycRequired = Boolean(cfgFields.kyc_required);
  const oracle = (cfgFields.oracle_admin as string | undefined) ?? "";
  const oracleOn = !!oracle && oracle !== DEFAULT_ORACLE;

  const fmtNum = (n: number) =>
    new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);

  return (
    <section className="border-b border-[var(--vx-border)] bg-[var(--vx-bg)] py-[3rem]">
      <div className="mx-auto w-full max-w-[1320px] px-4 md:px-6">
        <div className="mb-4 text-center">
          <PitchLine variant="pill">
            <span className="text-[var(--vx-text-muted)]">
              live · devnet · refreshed {onchain.fetched_at}
            </span>
          </PitchLine>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4">
          {vaultOk ? (
            <>
              <PitchNumber
                value={fmtNum(totalAssetsUsdc)}
                label="USDC in vault"
              />
              <PitchNumber value={fmtNum(slot)} label="Solana slot" accent />
            </>
          ) : null}
          {loanCfgOk ? (
            <>
              <PitchNumber value={kycRequired ? "ON" : "OFF"} label="KYC gate" />
              <PitchNumber
                value={oracleOn ? "ON" : "OFF"}
                label="RedStone oracle"
                accent
              />
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
