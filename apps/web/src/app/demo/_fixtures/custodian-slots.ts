export type CustodianId = "brinks" | "prosegur" | "loomis";

export type CustodianOption = {
  id: CustodianId;
  name: string;
  city: string;
  blurb: string;
};

export const CUSTODIANS: CustodianOption[] = [
  {
    id: "brinks",
    name: "Brinks",
    city: "São Paulo",
    blurb: "Class III vault · armored transit · 24/7 IoT.",
  },
  {
    id: "prosegur",
    name: "Prosegur",
    city: "São Paulo",
    blurb: "Tier-1 logistics · biometric vault access.",
  },
  {
    id: "loomis",
    name: "Loomis",
    city: "São Paulo",
    blurb: "Insured high-value transit · CCTV mirror feed.",
  },
];

export const SLOTS: string[] = [
  "Tomorrow · 09:00",
  "Tomorrow · 11:30",
  "Tomorrow · 14:30",
  "Tomorrow · 16:00",
  "Day after · 10:00",
];
