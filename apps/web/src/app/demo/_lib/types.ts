export type DemoFormFactor = "phone" | "desktop";

export type DemoSession = {
  sessionId: string;
  startedAt: number;
  civic: { jwtHash?: string; verifiedAt?: number };
  govbr: { cpf?: string; name?: string; verifiedAt?: number };
  wallet: {
    provider?: "crossmint";
    pubkey?: string;
    email?: string;
  };
  watch?: {
    make: string; model: string; ref: string; year: number;
    condition: "mint" | "excellent" | "very_good" | "good";
    photos: string[];
    appraisal?: { chrono24: number; watchcharts: number; internal: number; median: number };
    priceHistory?: number[];
  };
  loan?: {
    loanId: string;
    principalAtoms: string;        // bigint as string for JSON safety
    rateBps: number; termDays: number; dueTs: number;
    ccbHashHex: string;
    signatureDataUrl: string;
    custody: { provider: "brinks" | "prosegur" | "loomis"; bookedSlot?: string; confirmedAt?: number };
    disbursedAt?: number;
    inAppBalanceAtoms: string;
  };
  tour: { active: boolean; step: number; resumable: boolean; history: number[] };
  mocksDismissed: string[];
};

export const DEMO_SESSION_KEY = "vaulx_demo_session";

export const TOUR_STEPS_TOTAL = 14;
