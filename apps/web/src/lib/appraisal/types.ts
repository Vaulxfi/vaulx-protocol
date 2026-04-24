export type WatchCondition = "mint" | "excellent" | "very_good" | "good";

export interface AppraisalInput {
  make: string;
  model: string;
  ref: string;
  year: number;
  condition: WatchCondition;
}

export type SourceName = "chrono24" | "watchcharts" | "internal";

export interface SourceResult {
  ok: boolean;
  value?: number;
  source: SourceName;
  detail?: string;
  fallback?: boolean;
}

export interface AppraisalResponse {
  chrono24: SourceResult;
  watchcharts: SourceResult;
  internal: SourceResult;
  median: number;
  okCount: number;
  allFallback: boolean;
  generatedAt: number;
  echo: AppraisalInput;
}
