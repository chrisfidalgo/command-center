// Prices in USD per million tokens (as of May 2026)
export const MODEL_PRICES: Record<
  string,
  {
    input: number;
    output: number;
    cacheWrite: number;
    cacheRead: number;
  }
> = {
  "claude-opus-4-7": {
    input: 15.0,
    output: 75.0,
    cacheWrite: 18.75, // 1.25x input
    cacheRead: 1.5,    // 0.10x input
  },
  "claude-sonnet-4-6": {
    input: 3.0,
    output: 15.0,
    cacheWrite: 3.75,
    cacheRead: 0.3,
  },
  "claude-haiku-4-5": {
    input: 0.8,
    output: 4.0,
    cacheWrite: 1.0,
    cacheRead: 0.08,
  },
};

export interface UsageObject {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
}

export interface CostBreakdown {
  model: string;
  tokens: {
    input: number;
    output: number;
    cacheWrite: number;
    cacheRead: number;
  };
  costs: {
    input: number;
    output: number;
    cacheWrite: number;
    cacheRead: number;
    total: number;
  };
  // What it would have cost with no caching
  noCacheCost: number;
  savedByCache: number;
}

export function calculateApiCost(
  usage: UsageObject,
  model: string = "claude-sonnet-4-6"
): CostBreakdown {
  const prices = MODEL_PRICES[model];
  if (!prices) {
    throw new Error(`Unknown model: ${model}. Add it to MODEL_PRICES.`);
  }

  const M = 1_000_000;
  const cacheWrite = usage.cache_creation_input_tokens ?? 0;
  const cacheRead = usage.cache_read_input_tokens ?? 0;

  const costs = {
    input: (usage.input_tokens / M) * prices.input,
    output: (usage.output_tokens / M) * prices.output,
    cacheWrite: (cacheWrite / M) * prices.cacheWrite,
    cacheRead: (cacheRead / M) * prices.cacheRead,
    total: 0,
  };
  costs.total = costs.input + costs.output + costs.cacheWrite + costs.cacheRead;

  // Hypothetical cost if all tokens were billed at full input + output rate
  const totalInputTokens = usage.input_tokens + cacheWrite + cacheRead;
  const noCacheCost =
    (totalInputTokens / M) * prices.input +
    (usage.output_tokens / M) * prices.output;

  return {
    model,
    tokens: {
      input: usage.input_tokens,
      output: usage.output_tokens,
      cacheWrite,
      cacheRead,
    },
    costs,
    noCacheCost,
    savedByCache: noCacheCost - costs.total,
  };
}

export function formatCostReport(breakdown: CostBreakdown): string {
  const { tokens, costs } = breakdown;
  const pct = (n: number) => `${((n / breakdown.noCacheCost) * 100).toFixed(1)}%`;

  return [
    `Model: ${breakdown.model}`,
    ``,
    `Token breakdown:`,
    `  Input (billed full):   ${tokens.input.toLocaleString()}`,
    `  Cache write:           ${tokens.cacheWrite.toLocaleString()}`,
    `  Cache read (10% rate): ${tokens.cacheRead.toLocaleString()}`,
    `  Output:                ${tokens.output.toLocaleString()}`,
    ``,
    `Cost breakdown:`,
    `  Input:       $${costs.input.toFixed(6)}`,
    `  Cache write: $${costs.cacheWrite.toFixed(6)}`,
    `  Cache read:  $${costs.cacheRead.toFixed(6)}`,
    `  Output:      $${costs.output.toFixed(6)}`,
    `  ─────────────────────────`,
    `  Total:       $${costs.total.toFixed(6)}`,
    ``,
    `Without caching: $${breakdown.noCacheCost.toFixed(6)}`,
    `Saved by cache:  $${breakdown.savedByCache.toFixed(6)} (${pct(breakdown.savedByCache)} reduction)`,
  ].join("\n");
}
