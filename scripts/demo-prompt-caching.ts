/**
 * Task 2: Prompt Caching
 *
 * Run with: ANTHROPIC_API_KEY=your-key npx tsx scripts/demo-prompt-caching.ts
 *
 * What you'll observe:
 * - Call 1: cache_creation_input_tokens > 0, cache_read_input_tokens = 0 (writing)
 * - Call 2 (within 5 min): cache_read_input_tokens > 0, input_tokens drops (reading)
 * - Cost delta printed after both calls
 *
 * Rules this demo teaches by doing:
 * - The cached block must be >= 1,024 tokens or the cache is silently skipped
 * - cache_control must be on the LAST content block you want cached
 * - Cache TTL is 5 minutes — run both calls quickly to see a hit
 */

import Anthropic from "@anthropic-ai/sdk";
import { calculateApiCost, formatCostReport } from "../src/lib/api-cost-calculator";

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env

// ─── Build a large system prompt ─────────────────────────────────────────────
// Must be >= 1,024 tokens to qualify for caching.
// This is a stand-in for a real reference doc, persona, or rule set.
function buildLargeSystemPrompt(): string {
  const baseDoc = `
You are an expert game economy analyst. You have deep knowledge of:
- F2P monetization models: gacha, battle pass, cosmetics, pay-to-win vs pay-to-convenience
- Player LTV (lifetime value), ARPDAU, conversion funnels, whale segmentation
- Retention curves, D1/D7/D30 benchmarks across genres
- Virtual currency design: sinks, faucets, inflation, deflation
- Loot tables, drop rates, pity systems (soft and hard pity)
- Live ops cadence: seasonal events, limited-time offers, flash sales
- A/B testing frameworks for economy changes
- Economy KPIs: session length, purchase frequency, refund rates, churn by spend tier

Reference definitions:
- ARPDAU: Average Revenue Per Daily Active User
- LTV: Lifetime Value = ARPDAU × average session days
- Conversion rate: % of DAU that make >= 1 purchase
- Whale: top 1-5% of spenders, often 50-80% of revenue
- Dolphin: mid-tier spenders, important for volume
- Minnow: F2P or very low spend, high volume, low revenue
- Soft pity: increasing drop rate as bad luck accumulates
- Hard pity: guaranteed drop at N pulls
- Battle pass: seasonal content unlock via paid track, retention anchor
- FOMO: Fear Of Missing Out, used in limited-time offer design

Economy design heuristics:
1. Never make premium currency earnable in meaningful quantities for free
2. Price anchoring: show high-value bundles first to make standard bundles look cheap
3. First purchase offer: deeply discounted to lower the psychological barrier to paying
4. Merge sinks with social visibility for maximum effectiveness
5. Faucets should feel generous; sinks should feel optional but appealing
6. Never remove earned currency — only add new sinks
7. Hard pity should be high enough to maintain aspiration but reachable for dolphins
8. Limited-time events should drive 20-40% of monthly revenue in mature titles

Genre benchmarks (mobile, 2024):
- Casual: D1 40%, D7 15%, D30 5%, ARPDAU $0.04-0.08
- Mid-core RPG: D1 35%, D7 12%, D30 4%, ARPDAU $0.10-0.25
- 4X Strategy: D1 25%, D7 10%, D30 5%, ARPDAU $0.20-0.60
- Collectible/gacha: D1 40%, D7 18%, D30 8%, ARPDAU $0.30-1.20

When analyzing economy questions, always:
1. Identify the player segment affected
2. Consider second-order effects on other segments
3. Estimate impact on conversion, LTV, and retention separately
4. Propose a measurement plan (what to A/B test, what metrics to watch)
5. Flag risks to balance (inflation, deflation, player perception)
`;

  // Pad to ensure we're well over 1,024 tokens (~4 chars per token)
  const padding = "Additional context. ".repeat(300);
  return baseDoc + padding;
}

const SYSTEM_PROMPT = buildLargeSystemPrompt();
const USER_MESSAGE = "What's the biggest economy mistake new mobile game studios make?";
const MODEL = "claude-haiku-4-5-20251001"; // cheapest model — good for experiments

async function makeCall(callNumber: number): Promise<void> {
  console.log(`\n${"─".repeat(50)}`);
  console.log(`Call ${callNumber}`);
  console.log("─".repeat(50));

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 300,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        // This tells Anthropic: "cache everything up to and including this block"
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: USER_MESSAGE }],
  });

  const usage = response.usage as {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
  };

  console.log("\nRaw usage object (what the API returns):");
  console.log(JSON.stringify(usage, null, 2));

  const breakdown = calculateApiCost(
    {
      input_tokens: usage.input_tokens,
      output_tokens: usage.output_tokens,
      cache_creation_input_tokens: usage.cache_creation_input_tokens,
      cache_read_input_tokens: usage.cache_read_input_tokens,
    },
    MODEL
  );
  console.log("\n" + formatCostReport(breakdown));

  if (callNumber === 1) {
    if ((usage.cache_creation_input_tokens ?? 0) > 0) {
      console.log(
        "\n✓ Cache WRITE confirmed — system prompt is now cached for 5 minutes."
      );
      console.log(
        "  Run this script again immediately to observe a cache READ on Call 2."
      );
    } else {
      console.log(
        "\n⚠  No cache write recorded. System prompt may be under 1,024 tokens."
      );
    }
  }

  if (callNumber === 2) {
    if ((usage.cache_read_input_tokens ?? 0) > 0) {
      console.log("\n✓ Cache HIT confirmed — system prompt was read from cache.");
      console.log(
        `  You paid for ${usage.cache_read_input_tokens} tokens at 10% rate instead of full input rate.`
      );
    } else {
      console.log(
        "\n⚠  No cache read recorded. Cache may have expired (> 5 min since Call 1)."
      );
    }
  }
}

async function main() {
  console.log("=".repeat(50));
  console.log("PROMPT CACHING DEMO");
  console.log(`Model: ${MODEL}`);
  console.log(`System prompt size: ~${Math.round(SYSTEM_PROMPT.length / 4)} tokens`);
  console.log("=".repeat(50));

  // Make two calls in sequence — the second should hit the cache
  await makeCall(1);

  console.log("\nWaiting 2 seconds before Call 2 (cache TTL is 5 minutes)...");
  await new Promise((r) => setTimeout(r, 2000));

  await makeCall(2);

  console.log(`\n${"=".repeat(50)}`);
  console.log("What to remember:");
  console.log("  1. cache_creation_input_tokens > 0 = you paid to WRITE the cache");
  console.log("  2. cache_read_input_tokens > 0 = you paid 10% to READ the cache");
  console.log("  3. Cache TTL is 5 minutes — design agentic loops accordingly");
  console.log("  4. The break-even point is ~1.25 calls (write + 1/4 of a read turn)");
  console.log("  5. High-value targets: system prompts, tool definitions, large docs");
}

main().catch(console.error);
