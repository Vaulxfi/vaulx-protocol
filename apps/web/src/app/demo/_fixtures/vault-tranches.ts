// 4-tranche vault fixture for the lender-side mock.
// Aspirational launch values — not production data.

export type VaultTranche = {
  id: string;
  name: string;
  apy: number;
  tvl: number;
  currency: "USDC" | "BRL";
  risk: "senior" | "subordinate";
  audience: string;
};

export const TRANCHES: readonly VaultTranche[] = [
  {
    id: "inst-usdc",
    name: "Institutional · USDC",
    apy: 11.0,
    tvl: 4_200_000,
    currency: "USDC",
    risk: "senior",
    audience: "Accredited / FIDC LPs",
  },
  {
    id: "inst-brl",
    name: "Institutional · BRL",
    apy: 14.0,
    tvl: 1_800_000,
    currency: "BRL",
    risk: "senior",
    audience: "Accredited / FIDC LPs",
  },
  {
    id: "retail-usdc",
    name: "Retail FIDC · USDC",
    apy: 9.5,
    tvl: 850_000,
    currency: "USDC",
    risk: "subordinate",
    audience: "Retail (FIDC-wrapped)",
  },
  {
    id: "retail-brl",
    name: "Retail FIDC · BRL",
    apy: 12.5,
    tvl: 320_000,
    currency: "BRL",
    risk: "subordinate",
    audience: "Retail (FIDC-wrapped)",
  },
] as const;

export function getTranche(id: string): VaultTranche | undefined {
  return TRANCHES.find((t) => t.id === id);
}

export function totalTvl(): number {
  return TRANCHES.reduce((sum, t) => sum + t.tvl, 0);
}
