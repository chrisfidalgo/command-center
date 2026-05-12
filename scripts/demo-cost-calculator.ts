/**
 * Task 1: Cost Modeling
 *
 * Run with: npx tsx scripts/demo-cost-calculator.ts
 *
 * This script teaches you to read a Claude API usage object and convert it
 * to real dollar costs — including cache discounts.
 *
 * No API key needed. All data here is mocked.
 */

import {
  calculateApiCost,
  formatCostReport,
  MODEL_PRICES,
} from "../src/lib/api-cost-calculator";

// ─── Scenario A: No caching ───────────────────────────────────────────────────
// What a typical single-turn call looks like with no cache involved.
const scenarioA = {
  label: "Single call, no caching",
  usage: {
    input_tokens: 5_000,
    output_tokens: 800,
    cache_creation_input_tokens: 0,
    cache_read_input_tokens: 0,
  },
};

// ─── Scenario B: First call that writes a cache ───────────────────────────────
// A large system prompt (e.g. a reference doc) gets written to cache.
// cache_creation costs 1.25x input rate — slightly MORE expensive than normal.
// This is the investment turn; the payoff is on every subsequent read.
const scenarioB = {
  label: "Cache WRITE (first call with large system prompt)",
  usage: {
    input_tokens: 200,         // just the user message
    output_tokens: 600,
    cache_creation_input_tokens: 4_800, // large system prompt cached
    cache_read_input_tokens: 0,
  },
};

// ─── Scenario C: Subsequent calls that hit the cache ─────────────────────────
// Same large system prompt, but now read from cache at 10% of input rate.
// The 4,800-token system prompt costs as if it were only 480 tokens.
const scenarioC = {
  label: "Cache READ (subsequent calls — same system prompt)",
  usage: {
    input_tokens: 200,
    output_tokens: 600,
    cache_creation_input_tokens: 0,
    cache_read_input_tokens: 4_800,  // <-- same tokens, 10% price
  },
};

// ─── Scenario D: Long agentic conversation, no cache ─────────────────────────
// After 10 turns of accumulation — history is 40k tokens being re-sent each time.
// This shows why compaction matters (Task 3).
const scenarioD = {
  label: "Turn 10 of a long conversation — unchecked accumulation",
  usage: {
    input_tokens: 40_000,
    output_tokens: 800,
    cache_creation_input_tokens: 0,
    cache_read_input_tokens: 0,
  },
};

const scenarios = [scenarioA, scenarioB, scenarioC, scenarioD];

console.log("=".repeat(60));
console.log("COST MODELING DEMO — claude-sonnet-4-6");
console.log("=".repeat(60));

for (const scenario of scenarios) {
  console.log(`\n>>> ${scenario.label}`);
  console.log("-".repeat(50));
  const breakdown = calculateApiCost(scenario.usage, "claude-sonnet-4-6");
  console.log(formatCostReport(breakdown));
}

// ─── Model comparison ─────────────────────────────────────────────────────────
console.log("\n" + "=".repeat(60));
console.log("MODEL COMPARISON — same workload, different models");
console.log("=".repeat(60));

const standardWorkload = {
  input_tokens: 5_000,
  output_tokens: 1_000,
  cache_creation_input_tokens: 0,
  cache_read_input_tokens: 0,
};

for (const model of Object.keys(MODEL_PRICES)) {
  const breakdown = calculateApiCost(standardWorkload, model);
  console.log(`\n${model}: $${breakdown.costs.total.toFixed(6)} per call`);
}

console.log(
  "\nKey insight: at scale, model choice and caching matter far more than prompt length tuning."
);
