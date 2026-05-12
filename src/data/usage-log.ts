// Daily API token usage log.
// Populated manually or by a future logging hook on real API calls.
// Subscription-only usage (Claude Pro, Cursor) has no token data — those rows will be empty.

export interface DailyUsageEntry {
  date: string; // ISO date, e.g. "2026-05-12"
  calls: number;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  estimatedCostUsd: number;
  source: "api" | "subscription"; // api = billed per token; subscription = flat rate
}

// Seed with the last 7 days. Replace with real data as you start making API calls.
// Until you have an ANTHROPIC_API_KEY in active use, all entries will be subscription.
export const usageLog: DailyUsageEntry[] = [
  { date: "2026-05-12", calls: 0, inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0, estimatedCostUsd: 0, source: "subscription" },
  { date: "2026-05-11", calls: 0, inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0, estimatedCostUsd: 0, source: "subscription" },
  { date: "2026-05-10", calls: 0, inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0, estimatedCostUsd: 0, source: "subscription" },
  { date: "2026-05-09", calls: 0, inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0, estimatedCostUsd: 0, source: "subscription" },
  { date: "2026-05-08", calls: 0, inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0, estimatedCostUsd: 0, source: "subscription" },
  { date: "2026-05-07", calls: 0, inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0, estimatedCostUsd: 0, source: "subscription" },
  { date: "2026-05-06", calls: 0, inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0, estimatedCostUsd: 0, source: "subscription" },
];
