export type PixRecipient = {
  id: string;
  bank: string;
  masked: string;
};

export const PIX_RECIPIENTS: readonly PixRecipient[] = [
  { id: "inter", bank: "Banco Inter", masked: "••••5234" },
  { id: "nubank", bank: "Nubank", masked: "••••8821" },
  { id: "itau", bank: "Itaú", masked: "••••3392" },
] as const;

// USD → BRL rate locked for the demo (close to live spot ~2026-04).
export const USDC_BRL_RATE = 5.05;
