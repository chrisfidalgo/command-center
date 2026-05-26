import { costs, totalMonthlyCost } from "@/data/costs";
import { agents } from "@/data/agents";
import { MODEL_PRICES } from "@/lib/api-cost-calculator";
import { getMergedSummary } from "@/lib/parse-session-logs";
import TaskPanel from "@/app/components/TaskPanel";
import ProjectsPanel from "@/app/components/ProjectsPanel";
import ApiUsagePanel from "@/app/components/ApiUsagePanel";

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-6xl p-8">
        <header className="mb-10">
          <p className="text-sm uppercase tracking-widest text-zinc-500">
            Personal Studio OS
          </p>
          <h1 className="mt-2 text-4xl font-bold">Command Center</h1>
          <p className="mt-3 max-w-2xl text-zinc-400">
            A dashboard for tracking projects, AI workflows, costs, prompts,
            and prototype momentum.
          </p>
        </header>

        <section className="mb-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-xl font-semibold">Current Focus</h2>
          <p className="mt-2 text-zinc-300">
            Stand up the first usable dashboard shell.
          </p>
        </section>

        <div className="grid gap-6 md:grid-cols-2">
          <ProjectsPanel />
          <TaskPanel />
        </div>

        <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-xl font-semibold">Agent Roster</h2>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            {agents.map((agent) => (
              <div
                key={agent.prefix}
                className="rounded-xl border border-zinc-800 bg-zinc-950 p-4"
              >
                {agent.isNew && (
                  <div className="flex justify-end">
                    <span className="rounded-full bg-purple-900/60 px-2 py-0.5 text-xs font-medium text-purple-300">
                      New
                    </span>
                  </div>
                )}
                <p className="mt-1 font-medium">{agent.name}</p>
                <p className="text-xs text-zinc-500">{agent.role}</p>
                <p className="mt-2 text-xs text-zinc-400">{agent.summary}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">AI Spend Tracker</h2>
            <span className="text-sm text-zinc-400">
              ${totalMonthlyCost}/month subscriptions
            </span>
          </div>

          {/* Daily API usage */}
          <div className="mt-4">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-zinc-500">
              API Usage — Last 30 Days
            </h3>
            <ApiUsagePanel summary={getMergedSummary(30)} />
          </div>

          {/* Model pricing reference */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-zinc-500">
              Model Pricing Reference · per 1M tokens
            </h3>
            <div className="mt-3 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-left text-xs uppercase tracking-wider text-zinc-500">
                    <th className="px-4 py-2">Model</th>
                    <th className="px-4 py-2 text-right">Input</th>
                    <th className="px-4 py-2 text-right">Output</th>
                    <th className="px-4 py-2 text-right">Cache Write</th>
                    <th className="px-4 py-2 text-right">Cache Read</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(MODEL_PRICES).map(([model, prices]) => (
                    <tr
                      key={model}
                      className="border-b border-zinc-800/50 last:border-0 text-zinc-400"
                    >
                      <td className="px-4 py-2 font-mono text-xs">{model}</td>
                      <td className="px-4 py-2 text-right">${prices.input.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right">${prices.output.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right text-yellow-600">${prices.cacheWrite.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right text-green-600">${prices.cacheRead.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="px-4 py-3 text-xs text-zinc-600">
                Cache write costs 1.25× input (investment). Cache read costs ~10% of input (payoff after ~1.3 calls).
              </p>
            </div>
          </div>

          {/* Subscriptions */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-zinc-500">
              Subscriptions
            </h3>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {costs.map((cost) => (
                <div
                  key={cost.name}
                  className="rounded-xl border border-zinc-800 bg-zinc-950 p-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{cost.name}</h3>
                    <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300">
                      {cost.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-zinc-400">
                    ${cost.monthlyCost}/month · flat rate
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}