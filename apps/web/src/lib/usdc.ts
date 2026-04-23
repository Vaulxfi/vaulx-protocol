import { PublicKey } from "@solana/web3.js";

const raw = process.env.NEXT_PUBLIC_USDC_MINT;

export const USDC_MINT: PublicKey | undefined = raw
  ? safeMint(raw)
  : undefined;

function safeMint(s: string): PublicKey | undefined {
  try {
    return new PublicKey(s);
  } catch {
    return undefined;
  }
}

export function requireUsdcMint(): PublicKey {
  if (!USDC_MINT) {
    throw new Error(
      "NEXT_PUBLIC_USDC_MINT is not set. Populate it from scripts/dev/devnet-usdc.json after running the devnet USDC seed script."
    );
  }
  return USDC_MINT;
}
