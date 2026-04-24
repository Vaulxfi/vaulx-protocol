import type {
  AppraisalInput,
  AppraisalResponse,
  SourceName,
  SourceResult,
} from "./types";
import { chrono24Price } from "./chrono24";
import { watchchartsPrice } from "./watchcharts";
import { internalPrice } from "./internal";

const TIMEOUT_MS = 10_000;

export function medianOf(xs: number[]): number {
  if (xs.length === 0) return 0;
  const sorted = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid];
}

export function withTimeout<T extends SourceResult>(
  p: Promise<T>,
  ms: number,
  source: SourceName,
): Promise<SourceResult> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<SourceResult>((resolve) => {
    timer = setTimeout(() => {
      resolve({
        ok: false,
        source,
        detail: `timeout after ${ms}ms`,
      });
    }, ms);
  });
  return Promise.race([
    p.then((v) => {
      if (timer) clearTimeout(timer);
      return v;
    }),
    timeout,
  ]);
}

export async function aggregate(
  input: AppraisalInput,
  opts: { timeoutMs?: number } = {},
): Promise<AppraisalResponse> {
  const ms = opts.timeoutMs ?? TIMEOUT_MS;
  const [chrono24Res, watchchartsRes, internalRes] = await Promise.all([
    withTimeout(chrono24Price(input), ms, "chrono24").catch(
      (err: Error): SourceResult => ({
        ok: false,
        source: "chrono24",
        detail: `unhandled: ${err.message}`,
      }),
    ),
    withTimeout(watchchartsPrice(input), ms, "watchcharts").catch(
      (err: Error): SourceResult => ({
        ok: false,
        source: "watchcharts",
        detail: `unhandled: ${err.message}`,
      }),
    ),
    Promise.resolve(internalPrice(input)),
  ]);

  const results: SourceResult[] = [chrono24Res, watchchartsRes, internalRes];
  const okValues = results
    .filter((r) => r.ok && typeof r.value === "number")
    .map((r) => r.value as number);
  const okCount = okValues.length;
  const median = medianOf(okValues);
  const fallbackFlags = results
    .filter((r) => r.ok)
    .map((r) => Boolean(r.fallback));
  const allFallback =
    fallbackFlags.length > 0 && fallbackFlags.every((f) => f);

  return {
    chrono24: chrono24Res,
    watchcharts: watchchartsRes,
    internal: internalRes,
    median,
    okCount,
    allFallback,
    generatedAt: Math.floor(Date.now() / 1000),
    echo: input,
  };
}
