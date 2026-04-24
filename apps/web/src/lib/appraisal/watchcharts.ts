import type { AppraisalInput, SourceResult } from "./types";
import fallbackData from "./fixtures/watchcharts-fallback.json";

type FallbackEntry = { make: string; model: string; price_usd: number };
const FALLBACK: Record<string, FallbackEntry> = fallbackData as Record<
  string,
  FallbackEntry
>;

const DEFAULT_STUB = 10000;

function findByMakeModel(input: AppraisalInput): FallbackEntry | undefined {
  const wantMake = input.make.trim().toLowerCase();
  const wantModel = input.model.trim().toLowerCase();
  for (const entry of Object.values(FALLBACK)) {
    if (
      entry.make.toLowerCase() === wantMake &&
      entry.model.toLowerCase() === wantModel
    ) {
      return entry;
    }
  }
  // Partial match: make only
  for (const entry of Object.values(FALLBACK)) {
    if (entry.make.toLowerCase() === wantMake) return entry;
  }
  return undefined;
}

export function watchchartsFallback(input: AppraisalInput): SourceResult {
  const direct = FALLBACK[input.ref];
  if (direct) {
    return {
      ok: true,
      value: direct.price_usd,
      source: "watchcharts",
      fallback: true,
      detail: "fixture hit",
    };
  }
  const near = findByMakeModel(input);
  if (near) {
    return {
      ok: true,
      value: near.price_usd,
      source: "watchcharts",
      fallback: true,
      detail: "nearest make/model match",
    };
  }
  return {
    ok: true,
    value: DEFAULT_STUB,
    source: "watchcharts",
    fallback: true,
    detail: "unknown ref, default stub",
  };
}

export async function watchchartsPrice(
  input: AppraisalInput,
): Promise<SourceResult> {
  const key = process.env.WATCHCHARTS_API_KEY;
  if (!key) return watchchartsFallback(input);

  try {
    const url = `https://watchcharts.com/api/v1/prices?ref=${encodeURIComponent(input.ref)}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${key}`,
        Accept: "application/json",
      },
    });
    if (!res.ok) {
      const fb = watchchartsFallback(input);
      return { ...fb, detail: `upstream ${res.status}; used fallback` };
    }
    const data = (await res.json()) as { price_usd?: number; value?: number };
    const value = data.price_usd ?? data.value;
    if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
      const fb = watchchartsFallback(input);
      return { ...fb, detail: "bad upstream payload; used fallback" };
    }
    return {
      ok: true,
      value: Math.round(value),
      source: "watchcharts",
      detail: "live api",
    };
  } catch (err) {
    const fb = watchchartsFallback(input);
    return {
      ...fb,
      detail: `api error: ${(err as Error).message}; used fallback`,
    };
  }
}

export { FALLBACK as _WATCHCHARTS_FALLBACK };
