'use client'

import { useState } from 'react'
import type { SessionLogSummary, DailyTotal, ProjectSummary } from '@/lib/parse-session-logs'
import { calculateApiCost } from '@/lib/api-cost-calculator'
import type { DailyUsageEntry } from '@/data/usage-log'

// ── Benchmark (simulated) data ────────────────────────────────────────────────
const MODEL = 'claude-sonnet-4-6'

const RAW_BENCHMARK: Omit<DailyUsageEntry, 'estimatedCostUsd' | 'source'>[] = [
  { date: '2026-05-12', calls: 18, inputTokens: 95_000,  outputTokens: 14_000, cacheWriteTokens: 8_000,  cacheReadTokens: 62_000 },
  { date: '2026-05-11', calls: 22, inputTokens: 120_000, outputTokens: 18_000, cacheWriteTokens: 12_000, cacheReadTokens: 75_000 },
  { date: '2026-05-10', calls: 14, inputTokens: 65_000,  outputTokens: 10_000, cacheWriteTokens: 6_000,  cacheReadTokens: 40_000 },
  { date: '2026-05-09', calls: 8,  inputTokens: 30_000,  outputTokens: 5_000,  cacheWriteTokens: 4_000,  cacheReadTokens: 15_000 },
  { date: '2026-05-08', calls: 20, inputTokens: 110_000, outputTokens: 16_000, cacheWriteTokens: 10_000, cacheReadTokens: 68_000 },
  { date: '2026-05-07', calls: 12, inputTokens: 55_000,  outputTokens: 8_000,  cacheWriteTokens: 5_000,  cacheReadTokens: 32_000 },
  { date: '2026-05-06', calls: 5,  inputTokens: 20_000,  outputTokens: 3_000,  cacheWriteTokens: 2_000,  cacheReadTokens: 10_000 },
]

const BENCHMARK: DailyUsageEntry[] = RAW_BENCHMARK.map((e) => ({
  ...e,
  source: 'subscription',
  estimatedCostUsd: calculateApiCost(
    { input_tokens: e.inputTokens, output_tokens: e.outputTokens,
      cache_creation_input_tokens: e.cacheWriteTokens, cache_read_input_tokens: e.cacheReadTokens },
    MODEL
  ).costs.total,
}))

const BENCHMARK_TOTAL = BENCHMARK.reduce((s, e) => s + e.estimatedCostUsd, 0)
const BENCHMARK_NO_CACHE_TOTAL = BENCHMARK.reduce((s, e) => {
  const allInput = e.inputTokens + e.cacheWriteTokens + e.cacheReadTokens
  return s + calculateApiCost({ input_tokens: allInput, output_tokens: e.outputTokens }, MODEL).costs.total
}, 0)

// ── Shared helpers ────────────────────────────────────────────────────────────
function fmt(n: number) {
  if (n === 0) return <span className="text-zinc-700">—</span>
  return n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000 ? `${(n / 1_000).toFixed(0)}k` : String(n)
}

function fmtCost(n: number) {
  return n > 0 ? `$${n.toFixed(4)}` : <span className="text-zinc-700">$0.00</span>
}

function SummaryCards({ total, noCacheTotal }: { total: number; noCacheTotal: number }) {
  const saved = noCacheTotal - total
  const pct = noCacheTotal > 0 ? ((saved / noCacheTotal) * 100).toFixed(0) : '—'
  return (
    <div className="mt-3 grid grid-cols-3 gap-3">
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
        <p className="text-xs uppercase tracking-wider text-zinc-500">7-day cost</p>
        <p className="mt-1 text-lg font-semibold text-zinc-100">${total.toFixed(2)}</p>
        <p className="mt-0.5 text-xs text-zinc-500">~${(total * 30 / 7).toFixed(2)}/month projected</p>
      </div>
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
        <p className="text-xs uppercase tracking-wider text-zinc-500">Without caching</p>
        <p className="mt-1 text-lg font-semibold text-zinc-400">${noCacheTotal.toFixed(2)}</p>
        <p className="mt-0.5 text-xs text-zinc-500">~${(noCacheTotal * 30 / 7).toFixed(2)}/month projected</p>
      </div>
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
        <p className="text-xs uppercase tracking-wider text-zinc-500">Saved by caching</p>
        <p className="mt-1 text-lg font-semibold text-green-400">${saved.toFixed(2)}</p>
        <p className="mt-0.5 text-xs text-zinc-500">{pct}% reduction</p>
      </div>
    </div>
  )
}

// ── Projects: visual bar chart ────────────────────────────────────────────────
const BAR_COLORS = [
  'bg-indigo-500',
  'bg-violet-500',
  'bg-sky-500',
  'bg-teal-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-pink-500',
  'bg-orange-500',
  'bg-cyan-500',
]

function ProjectSpendView({ projects }: { projects: ProjectSummary[] }) {
  const maxCost = Math.max(...projects.map(p => p.estimatedCostUsd), 0.0001)
  const totalCost = projects.reduce((s, p) => s + p.estimatedCostUsd, 0)

  return (
    <div className="space-y-2">
      {projects.map((p, i) => {
        const barPct = (p.estimatedCostUsd / maxCost) * 100
        const sharePct = totalCost > 0 ? ((p.estimatedCostUsd / totalCost) * 100).toFixed(0) : '0'
        const color = BAR_COLORS[i % BAR_COLORS.length]
        return (
          <div key={p.project} className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${color}`} />
                <span className="text-sm font-medium text-zinc-200">{p.project}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-zinc-500">
                <span>{p.calls} calls</span>
                <span className="w-10 text-right text-zinc-600">{sharePct}%</span>
                <span className="w-16 text-right font-mono text-zinc-300">
                  {p.estimatedCostUsd > 0 ? `$${p.estimatedCostUsd.toFixed(4)}` : '—'}
                </span>
              </div>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
              <div
                className={`h-1.5 rounded-full transition-all ${color}`}
                style={{ width: `${barPct}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Projects: detail table ────────────────────────────────────────────────────
function ProjectTable({ projects }: { projects: ProjectSummary[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800 text-left text-xs uppercase tracking-wider text-zinc-500">
            <th className="px-4 py-2">Project</th>
            <th className="px-4 py-2 text-right">Calls</th>
            <th className="px-4 py-2 text-right">Input</th>
            <th className="px-4 py-2 text-right text-yellow-700">Cache Write</th>
            <th className="px-4 py-2 text-right text-green-700">Cache Read</th>
            <th className="px-4 py-2 text-right">Output</th>
            <th className="px-4 py-2 text-right">Est. Cost</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((p) => (
            <tr key={p.project} className="border-b border-zinc-800/50 last:border-0 text-zinc-400">
              <td className="px-4 py-2 font-medium text-zinc-200">{p.project}</td>
              <td className="px-4 py-2 text-right">{fmt(p.calls)}</td>
              <td className="px-4 py-2 text-right">{fmt(p.inputTokens)}</td>
              <td className="px-4 py-2 text-right text-yellow-600">{fmt(p.cacheWriteTokens)}</td>
              <td className="px-4 py-2 text-right text-green-600">{fmt(p.cacheReadTokens)}</td>
              <td className="px-4 py-2 text-right">{fmt(p.outputTokens)}</td>
              <td className="px-4 py-2 text-right">{fmtCost(p.estimatedCostUsd)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Actual: date table ────────────────────────────────────────────────────────
function DateTable({ dates }: { dates: DailyTotal[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800 text-left text-xs uppercase tracking-wider text-zinc-500">
            <th className="px-4 py-2">Date</th>
            <th className="px-4 py-2 text-right">Calls</th>
            <th className="px-4 py-2 text-right">Input</th>
            <th className="px-4 py-2 text-right text-yellow-700">Cache Write</th>
            <th className="px-4 py-2 text-right text-green-700">Cache Read</th>
            <th className="px-4 py-2 text-right">Output</th>
            <th className="px-4 py-2 text-right">Est. Cost</th>
          </tr>
        </thead>
        <tbody>
          {dates.map((d) => (
            <tr key={d.date} className="border-b border-zinc-800/50 last:border-0 text-zinc-400">
              <td className="px-4 py-2 font-mono text-xs">{d.date}</td>
              <td className="px-4 py-2 text-right">{fmt(d.calls)}</td>
              <td className="px-4 py-2 text-right">{fmt(d.inputTokens)}</td>
              <td className="px-4 py-2 text-right text-yellow-600">{fmt(d.cacheWriteTokens)}</td>
              <td className="px-4 py-2 text-right text-green-600">{fmt(d.cacheReadTokens)}</td>
              <td className="px-4 py-2 text-right">{fmt(d.outputTokens)}</td>
              <td className="px-4 py-2 text-right">{fmtCost(d.estimatedCostUsd)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Benchmark tab ─────────────────────────────────────────────────────────────
function BenchmarkView() {
  return (
    <>
      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-left text-xs uppercase tracking-wider text-zinc-500">
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2 text-right">Calls</th>
              <th className="px-4 py-2 text-right">Input</th>
              <th className="px-4 py-2 text-right text-yellow-700">Cache Write</th>
              <th className="px-4 py-2 text-right text-green-700">Cache Read</th>
              <th className="px-4 py-2 text-right">Output</th>
              <th className="px-4 py-2 text-right">Est. Cost</th>
            </tr>
          </thead>
          <tbody>
            {BENCHMARK.map((e) => (
              <tr key={e.date} className="border-b border-zinc-800/50 last:border-0 text-zinc-400">
                <td className="px-4 py-2 font-mono text-xs">{e.date}</td>
                <td className="px-4 py-2 text-right">{fmt(e.calls)}</td>
                <td className="px-4 py-2 text-right">{fmt(e.inputTokens)}</td>
                <td className="px-4 py-2 text-right text-yellow-600">{fmt(e.cacheWriteTokens)}</td>
                <td className="px-4 py-2 text-right text-green-600">{fmt(e.cacheReadTokens)}</td>
                <td className="px-4 py-2 text-right">{fmt(e.outputTokens)}</td>
                <td className="px-4 py-2 text-right">{fmtCost(e.estimatedCostUsd)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <SummaryCards total={BENCHMARK_TOTAL} noCacheTotal={BENCHMARK_NO_CACHE_TOTAL} />
      <p className="mt-2 px-1 text-xs text-zinc-600">
        Simulated — representative of a heavy Claude Code week across multiple projects.
        Yellow = cache write (1.25× input rate). Green = cache read (0.10× input rate).
      </p>
    </>
  )
}

// ── No data placeholder ───────────────────────────────────────────────────────
function NoData() {
  return (
    <p className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-6 text-center text-sm text-zinc-600">
      No session data found in the last 7 days.
    </p>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ApiUsagePanel({ summary }: { summary: SessionLogSummary }) {
  const [tab, setTab] = useState<'actual' | 'projects' | 'benchmark'>('benchmark')

  const tabs = [
    { id: 'actual',    label: 'Actual' },
    { id: 'projects',  label: 'Projects' },
    { id: 'benchmark', label: 'Benchmark' },
  ] as const

  const hasData = summary.byProject.length > 0

  const total7d = summary.byDate.reduce((s, e) => s + e.estimatedCostUsd, 0)
  const noCacheTotal7d = summary.byDate.reduce((s, e) => {
    const allInput = e.inputTokens + e.cacheWriteTokens + e.cacheReadTokens
    return s + calculateApiCost({ input_tokens: allInput, output_tokens: e.outputTokens }, MODEL).costs.total
  }, 0)

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
        {tab === 'benchmark' && <BenchmarkView />}

        {tab === 'actual' && (
          hasData ? (
            <>
              <DateTable dates={summary.byDate} />
              <SummaryCards total={total7d} noCacheTotal={noCacheTotal7d} />
              <p className="mt-2 px-1 text-xs text-zinc-600">
                Subscription usage across all GitProjects — costs are simulated API equivalent, not billed.
                Scans <code className="text-zinc-500">~/.claude/projects/</code> for sessions under D:\GitProjects.
              </p>
            </>
          ) : <NoData />
        )}

        {tab === 'projects' && (
          hasData ? (
            <>
              <ProjectSpendView projects={summary.byProject} />
              <div className="mt-4">
                <ProjectTable projects={summary.byProject} />
              </div>
              <SummaryCards total={total7d} noCacheTotal={noCacheTotal7d} />
              <p className="mt-2 px-1 text-xs text-zinc-600">
                Sorted by estimated cost. Bars show relative spend — top project is 100%.
              </p>
            </>
          ) : <NoData />
        )}
      </div>
    </div>
  )
}
