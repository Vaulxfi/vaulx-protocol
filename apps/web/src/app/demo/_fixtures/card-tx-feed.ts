export type CardTx = {
  merchant: string;
  amount: number; // BRL, negative = debit
  ts: string;
};

// Merchant-keyed only — no personal names anywhere.
export const CARD_TX: readonly CardTx[] = [
  { merchant: "Uber", amount: -28.4, ts: "2 min ago" },
  { merchant: "Pão de Açúcar", amount: -142.18, ts: "12 min ago" },
  { merchant: "iFood · Ristorante Capricciosa", amount: -89.5, ts: "1 h ago" },
  { merchant: "Shell Posto Ipiranga", amount: -160.0, ts: "Yesterday" },
  { merchant: "Spotify", amount: -19.9, ts: "Yesterday" },
  { merchant: "Apple Music", amount: -16.9, ts: "2 days ago" },
  { merchant: "Mercado Livre", amount: -487.3, ts: "3 days ago" },
  { merchant: "Amazon", amount: -89.99, ts: "4 days ago" },
  { merchant: "Netflix", amount: -55.9, ts: "5 days ago" },
  { merchant: "Posto Shell — Av. Paulista", amount: -210.0, ts: "1 week ago" },
  { merchant: "Drogaria São Paulo", amount: -47.2, ts: "1 week ago" },
  { merchant: "Restaurante Fasano", amount: -385.0, ts: "1 week ago" },
] as const;
