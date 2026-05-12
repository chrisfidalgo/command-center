/**
 * Task 3: Compaction Strategies
 *
 * Run with: ANTHROPIC_API_KEY=your-key npx tsx scripts/demo-compaction.ts
 *
 * What you'll observe:
 * - Input token count growing each turn as history accumulates
 * - A manual compaction step at turn 5 that resets history to a summary
 * - Post-compaction turns costing significantly less than the unchecked trajectory
 *
 * This is what Claude Code's /compact does internally — you're replicating the
 * logic manually so you understand what's happening.
 */

import Anthropic from "@anthropic-ai/sdk";
import { calculateApiCost } from "../src/lib/api-cost-calculator";

const client = new Anthropic();
const MODEL = "claude-haiku-4-5-20251001";
const TOTAL_TURNS = 9;
const COMPACT_AT_TURN = 5;

type Message = { role: "user" | "assistant"; content: string };

const SYSTEM_PROMPT = `You are a helpful assistant who answers questions about game design.
Keep answers to 2-3 sentences maximum.`;

// Simulated user questions — each adds to the conversation history
const QUESTIONS = [
  "What is a retention curve?",
  "Why does D7 retention matter more than D1 for live service games?",
  "What's the difference between a hard pity and soft pity system in gacha?",
  "How should a game designer think about currency sinks versus faucets?",
  "What is ARPDAU and why do publishers track it?",
  "How do battle passes help with retention compared to direct sales?",
  "What's a good first-purchase offer strategy for F2P games?",
  "Why is whale segmentation important for live ops?",
  "How does a limited-time event affect a game's monthly revenue?",
];

async function summarizeConversation(history: Message[]): Promise<string> {
  const transcript = history
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n\n");

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 400,
    messages: [
      {
        role: "user",
        content: `Summarize the following conversation in 3-5 bullet points. Capture the key facts and decisions. This summary will replace the full history to save context space.\n\n${transcript}`,
      },
    ],
  });

  return (response.content[0] as { text: string }).text;
}

async function main() {
  console.log("=".repeat(60));
  console.log("COMPACTION DEMO");
  console.log(`Model: ${MODEL}`);
  console.log(`Turns: ${TOTAL_TURNS} | Compaction at turn: ${COMPACT_AT_TURN}`);
  console.log("=".repeat(60));
  console.log("\nTurn | Input Tokens | Turn Cost  | Note");
  console.log("─".repeat(60));

  const history: Message[] = [];
  let projectedNoCacheTotal = 0;
  let actualTotal = 0;

  for (let turn = 1; turn <= TOTAL_TURNS; turn++) {
    // ── Compact at the designated turn ──────────────────────────────────────
    if (turn === COMPACT_AT_TURN) {
      const summary = await summarizeConversation(history);
      // Replace full history with a single synthetic message pair
      history.length = 0;
      history.push({
        role: "user",
        content: "Please continue our conversation. Here is a summary of what we covered:",
      });
      history.push({
        role: "assistant",
        content: summary,
      });
      console.log(`${"─".repeat(60)}`);
      console.log(`     [Compaction applied at turn ${COMPACT_AT_TURN} — history replaced with summary]`);
      console.log(`${"─".repeat(60)}`);
    }

    const question = QUESTIONS[turn - 1];
    history.push({ role: "user", content: question });

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 150,
      system: SYSTEM_PROMPT,
      messages: history,
    });

    const assistantText = (response.content[0] as { text: string }).text;
    history.push({ role: "assistant", content: assistantText });

    const usage = response.usage as {
      input_tokens: number;
      output_tokens: number;
    };

    const breakdown = calculateApiCost(
      { input_tokens: usage.input_tokens, output_tokens: usage.output_tokens },
      MODEL
    );

    actualTotal += breakdown.costs.total;

    // Project what turn N would cost without compaction
    const projectedInputTokens = turn * 300; // rough: ~300 tokens added per round-trip
    const projectedBreakdown = calculateApiCost(
      { input_tokens: projectedInputTokens, output_tokens: usage.output_tokens },
      MODEL
    );
    projectedNoCacheTotal += projectedBreakdown.costs.total;

    const note = turn === COMPACT_AT_TURN - 1 ? "<-- before compact"
                : turn === COMPACT_AT_TURN     ? "<-- first post-compact"
                : "";

    console.log(
      `  ${String(turn).padStart(2)}  | ${String(usage.input_tokens).padStart(12)} | $${breakdown.costs.total.toFixed(6)} | ${note}`
    );
  }

  console.log("─".repeat(60));
  console.log(`\nActual total cost:              $${actualTotal.toFixed(6)}`);
  console.log(`Projected cost without compact: $${projectedNoCacheTotal.toFixed(6)}`);
  console.log(
    `Estimated savings from compact: $${(projectedNoCacheTotal - actualTotal).toFixed(6)}`
  );

  console.log(`\n${"=".repeat(60)}`);
  console.log("What to remember:");
  console.log("  1. Without compaction, input tokens grow linearly every turn");
  console.log("  2. Compaction resets the accumulation — but you pay once for the summary call");
  console.log("  3. The ideal compaction point: early enough to save more than the summary costs");
  console.log("  4. /compact in Claude Code does exactly this — you can trigger it manually");
  console.log("  5. Agentic loops with > ~10 turns need a compaction strategy");
}

main().catch(console.error);
