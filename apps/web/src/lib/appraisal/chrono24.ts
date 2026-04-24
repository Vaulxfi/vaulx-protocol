import { parse } from "node-html-parser";
import type { AppraisalInput, SourceResult } from "./types";
import { watchchartsFallback } from "./watchcharts";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15";

function buildUrl(input: AppraisalInput): string {
  const params = new URLSearchParams({
    query: `${input.make} ${input.model} ${input.ref}`.trim(),
    dosearch: "true",
  });
  return `https://www.chrono24.com/search/index.htm?${params.toString()}`;
}

function median(xs: number[]): number {
  if (xs.length === 0) return 0;
  const sorted = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid];
}

export function parsePrices(html: string): number[] {
  const out: number[] = [];

  // Strategy 1: structured data-price attributes.
  const root = parse(html);
  const priced = root.querySelectorAll("[data-price]");
  for (const node of priced) {
    const raw = node.getAttribute("data-price");
    if (!raw) continue;
    const n = Number(raw.replace(/[^0-9.]/g, ""));
    if (Number.isFinite(n) && n > 0) out.push(n);
  }
  // Strategy 2: .js-price content.
  const jsPrice = root.querySelectorAll(".js-price");
  for (const node of jsPrice) {
    const txt = node.text.replace(/[^0-9.,]/g, "");
    const normalized = txt.replace(/,/g, "");
    const n = Number(normalized);
    if (Number.isFinite(n) && n > 100) out.push(n);
  }
  // Strategy 3: fallback regex on "$ 14,500" or "US$ 14,500" forms.
  if (out.length < 3) {
    const re = /US?\$\s*([0-9]{1,3}(?:[.,][0-9]{3})+|[0-9]+)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null) {
      const n = Number(m[1].replace(/[.,]/g, ""));
      if (Number.isFinite(n) && n > 500) out.push(n);
    }
  }
  return out;
}

function fallbackStub(input: AppraisalInput, detail: string): SourceResult {
  const fb = watchchartsFallback(input);
  return {
    ok: true,
    value: fb.value,
    source: "chrono24",
    fallback: true,
    detail,
  };
}

export async function chrono24Price(
  input: AppraisalInput,
): Promise<SourceResult> {
  try {
    const res = await fetch(buildUrl(input), {
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) {
      return fallbackStub(input, `upstream ${res.status}; used fallback`);
    }
    const html = await res.text();
    const prices = parsePrices(html);
    if (prices.length < 3) {
      return fallbackStub(
        input,
        `only ${prices.length} prices parsed; used fallback`,
      );
    }
    const top = prices.slice(0, 10);
    const value = median(top);
    return {
      ok: true,
      value,
      source: "chrono24",
      detail: `parsed ${prices.length} prices; median of top ${top.length}`,
    };
  } catch (err) {
    return fallbackStub(
      input,
      `scrape error: ${(err as Error).message}; used fallback`,
    );
  }
}

export { median as _median };
