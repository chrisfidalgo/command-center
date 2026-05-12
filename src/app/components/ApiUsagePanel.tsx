'use client'

import { useState } from 'react'
import type { DailyUsageEntry } from '@/data/usage-log'
import { calculateApiCost } from '@/lib/api-cost-calculator'

// Simulated week based on typical Claude Code power-user patterns.
// Represents a hybrid of heavy prototyping days and lighter review days.
// Cache write = system prompts / CLAUDE.md written to cache on first call.
// Cache read = every subsequent turn reading those same prefixes at 10% rate.
const RAW_BENCHMARK: Omit<DailyUsageEntry, 'estimatedCostUsd' | 'source'>[] = [
  { date: '2026-05-12', calls: 18, inputTokens: 95_000,  outputTokens: 14_000, cacheWriteTokens: 8_000,  cacheReadTokens: 62_000 },
  { date: '2026-05-11', calls: 22, inputTokens: 120_000, outputTokens: 18_000, cacheWriteTokens: 12_000, cacheReadTokens: 75_000 },
  { date: '2026-05-10', calls: 14, inputTokens: 65_000,  outputTokens: 10_000, cacheWriteTokens: 6_000,  cacheReadTokens: 40_000 },
  { date: '2026-05-09', calls: 8,  inputTokens: 30_000,  outputTokens: 5_000,  cacheWriteTokens: 4_000,  cacheReadTokens: 15_000 },
  { date: '2026-05-08', calls: 20, inputTokens: 110_000, outputTokens: 16_000, cacheWriteTokens: 10_000, cacheReadTokens: 68_000 },
  { date: '2026-05-07', calls: 12, inputTokens: 55_000,  outputTokens: 8_000,  cacheWriteTokens: 5_000,  cacheReadTokens: 32_000 },
  { date: '2026-05-06', calls: 5,  inputTokens: 20_000,  outputTokens: 3_000,  cacheWriteTokens: 2_000,  cacheReadTokens: 10_000 },
]

const MODEL = 'claude-sonnet-4-6'

const BENCHMARK: DailyUsageEntry[] = RAW_BENCHMARK.map((entry) => ({
  ...entry,
  source: 'subscription',
  estimatedCostUsd: calculateApiCost(
    {
      input_tokens: entry.inputTokens,
      output_tokens: entry.outputTokens,
      cache_creation_input_tokens: entry.cacheWriteTokens,
      cache_read_input_tokens: entry.cacheReadTokens,
    },
    MODEL
  ).costs.total,
}))

const BENCHMARK_TOTAL = BENCHMARK.reduce((s, e) => s + e.estimatedCostUsd, 0)
const BENCHMARK_MONTHLY = BENCHMARK_TOTAL * (30 / 7)

// Without any caching — what the same usage would cost billed at full input rate
const BENCHMARK_NO_CACHE_TOTAL = BENCHMARK.reduce((s, entry) => {
  const allInput = entry.inputTokens + entry.cacheWriteTokens + entry.cacheReadTokens
  return s + calculateApiCost({ input_tokens: allInput, output_tokens: entry.outputTokens }, MODEL).costs.total
}, 0)

function fmt(n: number) {
  return n > 0 ? n.toLocaleString() : <span className="text-zinc-700">—</span>
}

function fmtCost(n: number) {
  return n > 0
    ? `$${n.toFixed(4)}`
    : <span className="text-zinc-700">$0.00</span>
}

function UsageTable({ entries, showCacheColumns }: { entries: DailyUsageEntry[], showCacheColumns: boolean }) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800 text-left text-xs uppercase tracking-wider text-zinc-500">
            <th className="px-4 py-2">Date</th>
            <th className="px-4 py-2 text-right">Calls</th>
            <th className="px-4 py-2 text-right">Input</th>
            {showCacheColumns && <th className="px-4 py-2 text-right text-yellow-700">Cache Write</th>}
            {showCacheColumns && <th className="px-4 py-2 text-right text-green-700">Cache Read</th>}
            <th className="px-4 py-2 text-right">Output</th>
            <th className="px-4 py-2 text-right">Est. Cost</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr
              key={entry.date}
              className="border-b border-zinc-800/50 last:border-0 text-zinc-400"
            >
              <td className="px-4 py-2 font-mono text-xs">{entry.date}</td>
              <td className="px-4 py-2 text-right">{fmt(entry.calls)}</td>
              <td className="px-4 py-2 text-right">{fmt(entry.inputTokens)}</td>
              {showCacheColumns && (
                <td className="px-4 py-2 text-right text-yellow-600">{fmt(entry.cacheWriteTokens)}</td>
              )}
              {showCacheColumns && (
                <td className="px-4 py-2 text-right text-green-600">{fmt(entry.cacheReadTokens)}</td>
              )}
              <td className="px-4 py-2 text-right">{fmt(entry.outputTokens)}</td>
              <td className="px-4 py-2 text-right">{fmtCost(entry.estimatedCostUsd)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function ApiUsagePanel({ usageLog }: { usageLog: DailyUsageEntry[] }) {
  const [tab, setTab] = useState<'actual' | 'benchmark'>('benchmark')

  const tabs = [
    { id: 'actual',    label: 'Actual' },
    { id: 'benchmark', label: 'Benchmark' },
  ] as const

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex gap-1 rounded-lg bg-zinc-800 p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                tab === t.id
                  ? 'bg-zinc-950 text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-zinc-600">Model: {MODEL}</span>
      </div>

      <div className="mt-3">
        {tab === 'actual' && (() => {
          const actualTotal = usageLog.reduce((s, e) => s + e.estimatedCostUsd, 0)
          const actualNoCacheTotal = usageLog.reduce((s, e) => {
            const allInput = e.inputTokens + e.cacheWriteTokens + e.cacheReadTokens
            return s + calculateApiCost({ input_tokens: allInput, output_tokens: e.outputTokens }, MODEL).costs.total
          }, 0)
          const hasData = usageLog.some(e => e.calls > 0)

          return (
            <>
              <UsageTable entries={usageLog} showCacheColumns={true} />
              {hasData ? (
                <div className="mt-3 grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                    <p className="text-xs uppercase tracking-wider text-zinc-500">7-day cost</p>
                    <p className="mt-1 text-lg font-semibold text-zinc-100">${actualTotal.toFixed(2)}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">~${(actualTotal * 30 / 7).toFixed(2)}/month projected</p>
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                    <p className="text-xs uppercase tracking-wider text-zinc-500">Without caching</p>
                    <p className="mt-1 text-lg font-semibold text-zinc-400">${actualNoCacheTotal.toFixed(2)}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">~${(actualNoCacheTotal * 30 / 7).toFixed(2)}/month projected</p>
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                    <p className="text-xs uppercase tracking-wider text-zinc-500">Saved by caching</p>
                    <p className="mt-1 text-lg font-semibold text-green-400">${(actualNoCacheTotal - actualTotal).toFixed(2)}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {actualNoCacheTotal > 0 ? `${(((actualNoCacheTotal - actualTotal) / actualNoCacheTotal) * 100).toFixed(0)}% reduction` : '—'}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="mt-2 px-1 text-xs text-zinc-600">
                  No sessions found for this window. Data is read from local Claude Code session logs.
                </p>
              )}
              <p className="mt-2 px-1 text-xs text-zinc-600">
                Subscription usage — costs shown are simulated API equivalent, not billed.
              </p>
            </>
          )
        })()}

        {tab === 'benchmark' && (
          <>
            <UsageTable entries={BENCHMARK} showCacheColumns={true} />

            {/* Summary row */}
            <div className="mt-3 grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <p className="text-xs uppercase tracking-wider text-zinc-500">7-day cost</p>
                <p className="mt-1 text-lg font-semibold text-zinc-100">${BENCHMARK_TOTAL.toFixed(2)}</p>
                <p className="mt-0.5 text-xs text-zinc-500">~${BENCHMARK_MONTHLY.toFixed(2)}/month projected</p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <p className="text-xs uppercase tracking-wider text-zinc-500">Without caching</p>
                <p className="mt-1 text-lg font-semibold text-zinc-400">${BENCHMARK_NO_CACHE_TOTAL.toFixed(2)}</p>
                <p className="mt-0.5 text-xs text-zinc-500">~${(BENCHMARK_NO_CACHE_TOTAL * 30 / 7).toFixed(2)}/month projected</p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <p className="text-xs uppercase tracking-wider text-zinc-500">Saved by caching</p>
                <p className="mt-1 text-lg font-semibold text-green-400">
                  ${(BENCHMARK_NO_CACHE_TOTAL - BENCHMARK_TOTAL).toFixed(2)}
                </p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {(((BENCHMARK_NO_CACHE_TOTAL - BENCHMARK_TOTAL) / BENCHMARK_NO_CACHE_TOTAL) * 100).toFixed(0)}% reduction
                </p>
              </div>
            </div>

            <p className="mt-3 px-1 text-xs text-zinc-600">
              Simulated based on typical Claude Code power-user patterns (cache-heavy, multi-session days).
              Yellow = cache write tokens (1.25× input rate). Green = cache read tokens (0.10× input rate).
              Replace with real data from usage-log.ts as you start making API calls.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
