#!/usr/bin/env node
// Standalone usage report — mirrors parse-session-logs.ts logic, no build step needed.
// Usage: node src/scripts/usage-report.mjs [days=7]

import fs from 'fs'
import path from 'path'
import os from 'os'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const HISTORY_PATH = path.resolve(__dirname, '../../src/data/usage-history.csv')

const GIT_PROJECTS_ROOT = 'C:\\Users\\cfida\\Documents\\projects\\git'
const BLACKLIST = new Set(['galactic-match'])
const CLAUDE_PROJECTS_DIR = path.join(os.homedir(), '.claude', 'projects')
const MODEL = 'claude-sonnet-4-6'
const DAYS = parseInt(process.argv[2] ?? '7', 10)

// Prices in USD per million tokens
const PRICES = {
  'claude-opus-4-7':  { input: 15.0,  output: 75.0,  cacheWrite: 18.75, cacheRead: 1.5  },
  'claude-sonnet-4-6':{ input: 3.0,   output: 15.0,  cacheWrite: 3.75,  cacheRead: 0.3  },
  'claude-haiku-4-5': { input: 0.8,   output: 4.0,   cacheWrite: 1.0,   cacheRead: 0.08 },
}

function calcCost(u) {
  const p = PRICES[MODEL]
  const M = 1_000_000
  const cw = u.cache_creation_input_tokens ?? 0
  const cr = u.cache_read_input_tokens ?? 0
  return (u.input_tokens / M) * p.input
       + (u.output_tokens / M) * p.output
       + (cw / M) * p.cacheWrite
       + (cr / M) * p.cacheRead
}

function calcNoCacheCost(u) {
  const p = PRICES[MODEL]
  const M = 1_000_000
  const allInput = u.input_tokens + (u.cache_creation_input_tokens ?? 0) + (u.cache_read_input_tokens ?? 0)
  return (allInput / M) * p.input + (u.output_tokens / M) * p.output
}

function dateFromNow(daysAgo) {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().slice(0, 10)
}

function getProjectName(cwd) {
  const base = path.basename(cwd)
  return base === '.claude' ? path.basename(path.dirname(cwd)) : base
}

// ── Parse ────────────────────────────────────────────────────────────────────

if (!fs.existsSync(CLAUDE_PROJECTS_DIR)) {
  console.error('No ~/.claude/projects directory found.')
  process.exit(1)
}

const cutoff = dateFromNow(DAYS - 1)
const acc = {}  // "project|date" → entry

for (const slug of fs.readdirSync(CLAUDE_PROJECTS_DIR)) {
  const slugPath = path.join(CLAUDE_PROJECTS_DIR, slug)
  if (!fs.statSync(slugPath).isDirectory()) continue

  const jsonlFiles = fs.readdirSync(slugPath).filter(f => f.endsWith('.jsonl'))
  if (!jsonlFiles.length) continue

  let projectCwd = null
  outer: for (const file of jsonlFiles) {
    for (const line of fs.readFileSync(path.join(slugPath, file), 'utf8').split('\n')) {
      try {
        const obj = JSON.parse(line)
        if (obj.cwd) { projectCwd = obj.cwd; break outer }
      } catch {}
    }
  }

  if (!projectCwd || !projectCwd.toLowerCase().startsWith(GIT_PROJECTS_ROOT.toLowerCase())) continue

  const project = getProjectName(projectCwd)
  if (BLACKLIST.has(project)) continue

  const seen = new Set()
  for (const file of jsonlFiles) {
    for (const line of fs.readFileSync(path.join(slugPath, file), 'utf8').split('\n')) {
      try {
        const obj = JSON.parse(line)
        if (obj.type !== 'assistant') continue
        const rid = obj.requestId
        if (!rid || seen.has(rid)) continue
        seen.add(rid)
        const u = obj.message?.usage
        if (!u) continue
        const date = obj.timestamp.slice(0, 10)
        if (date < cutoff) continue

        const key = `${project}|${date}`
        if (!acc[key]) {
          acc[key] = { project, date, calls: 0, input: 0, cw: 0, cr: 0, output: 0 }
        }
        acc[key].calls++
        acc[key].input  += u.input_tokens ?? 0
        acc[key].cw     += u.cache_creation_input_tokens ?? 0
        acc[key].cr     += u.cache_read_input_tokens ?? 0
        acc[key].output += u.output_tokens ?? 0
      } catch {}
    }
  }
}

const entries = Object.values(acc).map(e => ({
  ...e,
  cost: calcCost({ input_tokens: e.input, output_tokens: e.output,
                   cache_creation_input_tokens: e.cw, cache_read_input_tokens: e.cr }),
  noCacheCost: calcNoCacheCost({ input_tokens: e.input, output_tokens: e.output,
                                 cache_creation_input_tokens: e.cw, cache_read_input_tokens: e.cr }),
}))

// Roll up by project
const byProject = {}
for (const e of entries) {
  if (!byProject[e.project]) byProject[e.project] = { project: e.project, calls: 0, input: 0, cw: 0, cr: 0, output: 0, cost: 0, noCacheCost: 0 }
  const p = byProject[e.project]
  p.calls += e.calls; p.input += e.input; p.cw += e.cw; p.cr += e.cr
  p.output += e.output; p.cost += e.cost; p.noCacheCost += e.noCacheCost
}
const projects = Object.values(byProject).sort((a, b) => b.cost - a.cost)

// Roll up by date — pad full window
const byDate = {}
for (const e of entries) {
  if (!byDate[e.date]) byDate[e.date] = { date: e.date, calls: 0, input: 0, cw: 0, cr: 0, output: 0, cost: 0, noCacheCost: 0 }
  const d = byDate[e.date]
  d.calls += e.calls; d.input += e.input; d.cw += e.cw; d.cr += e.cr
  d.output += e.output; d.cost += e.cost; d.noCacheCost += e.noCacheCost
}
const dates = Array.from({ length: DAYS }, (_, i) => {
  const date = dateFromNow(i)
  return byDate[date] ?? { date, calls: 0, input: 0, cw: 0, cr: 0, output: 0, cost: 0, noCacheCost: 0 }
})

// ── Format ───────────────────────────────────────────────────────────────────

function fmt(n) {
  return n >= 1_000_000 ? `${(n/1_000_000).toFixed(1)}M`
       : n >= 1_000     ? `${(n/1_000).toFixed(0)}k`
       : String(n)
}
function fc(n) { return n > 0 ? `$${n.toFixed(4)}` : '—' }
function pad(s, w, right = false) {
  const str = String(s)
  return right ? str.padStart(w) : str.padEnd(w)
}

const totalCost = projects.reduce((s, p) => s + p.cost, 0)
const totalNoCacheCost = projects.reduce((s, p) => s + p.noCacheCost, 0)
const saved = totalNoCacheCost - totalCost
const savedPct = totalNoCacheCost > 0 ? ((saved / totalNoCacheCost) * 100).toFixed(0) : 0

console.log()
console.log(`  Claude Code Usage — Last ${DAYS} days  (${MODEL})`)
console.log(`  Scanned: ${CLAUDE_PROJECTS_DIR}`)
console.log(`  Root:    ${GIT_PROJECTS_ROOT}`)
console.log()

if (!projects.length) {
  console.log('  No session data found.\n')
  process.exit(0)
}

// By project
console.log('  ── By Project ───────────────────────────────────────────────────────────')
console.log(`  ${'Project'.padEnd(22)} ${'Calls'.padStart(6)} ${'Input'.padStart(8)} ${'CacheW'.padStart(8)} ${'CacheR'.padStart(8)} ${'Output'.padStart(8)} ${'Cost'.padStart(10)}`)
console.log(`  ${'─'.repeat(22)} ${'─'.repeat(6)} ${'─'.repeat(8)} ${'─'.repeat(8)} ${'─'.repeat(8)} ${'─'.repeat(8)} ${'─'.repeat(10)}`)
for (const p of projects) {
  console.log(`  ${pad(p.project,22)} ${pad(p.calls,6,true)} ${pad(fmt(p.input),8,true)} ${pad(fmt(p.cw),8,true)} ${pad(fmt(p.cr),8,true)} ${pad(fmt(p.output),8,true)} ${pad(fc(p.cost),10,true)}`)
}

// By date
console.log()
console.log('  ── By Date ─────────────────────────────────────────────────────────────')
console.log(`  ${'Date'.padEnd(12)} ${'Calls'.padStart(6)} ${'Input'.padStart(8)} ${'CacheW'.padStart(8)} ${'CacheR'.padStart(8)} ${'Output'.padStart(8)} ${'Cost'.padStart(10)}`)
console.log(`  ${'─'.repeat(12)} ${'─'.repeat(6)} ${'─'.repeat(8)} ${'─'.repeat(8)} ${'─'.repeat(8)} ${'─'.repeat(8)} ${'─'.repeat(10)}`)
for (const d of dates) {
  console.log(`  ${pad(d.date,12)} ${pad(d.calls,6,true)} ${pad(fmt(d.input),8,true)} ${pad(fmt(d.cw),8,true)} ${pad(fmt(d.cr),8,true)} ${pad(fmt(d.output),8,true)} ${pad(fc(d.cost),10,true)}`)
}

// Summary
const totalCalls = projects.reduce((s, p) => s + p.calls, 0)
console.log()
console.log(`  ── Summary ─────────────────────────────────────────────────────────────`)
console.log(`  ${DAYS}-day cost:   ${fc(totalCost)}`)
console.log(`  Without caching: ${fc(totalNoCacheCost)}`)
console.log(`  Saved by cache:  ${fc(saved)}  (${savedPct}% reduction)`)
console.log(`  Total calls:     ${totalCalls}`)
console.log(`  Monthly proj:    ~$${(totalCost * 30 / DAYS).toFixed(2)}/month`)
console.log()

// ── Upsert live data into usage-history.csv ──────────────────────────────────
const CSV_HEADER = 'date,calls,input_tokens,cache_write_tokens,cache_read_tokens,output_tokens,estimated_cost_usd,source'

function parseHistoryCsv() {
  try {
    const lines = fs.readFileSync(HISTORY_PATH, 'utf8').trim().split('\n')
    return lines.slice(1).map(line => {
      const [date, calls, input_tokens, cache_write_tokens, cache_read_tokens, output_tokens, estimated_cost_usd, source] = line.split(',')
      return { date, calls: +calls, inputTokens: +input_tokens, cacheWriteTokens: +cache_write_tokens,
               cacheReadTokens: +cache_read_tokens, outputTokens: +output_tokens,
               estimatedCostUsd: +estimated_cost_usd, source: source?.trim() ?? 'unknown' }
    })
  } catch { return [] }
}

const historyMap = {}
for (const h of parseHistoryCsv()) historyMap[h.date] = h

let added = 0, updated = 0
for (const d of dates) {
  if (d.calls === 0) continue
  const existing = historyMap[d.date]
  if (!existing) { added++ }
  else if (existing.source !== 'KING-BEHEMOTH') { updated++ }
  else continue
  historyMap[d.date] = { date: d.date, calls: d.calls, inputTokens: d.input,
    cacheWriteTokens: d.cw, cacheReadTokens: d.cr, outputTokens: d.output,
    estimatedCostUsd: parseFloat(d.cost.toFixed(6)), source: 'OMEGA' }
}

const sorted = Object.values(historyMap).sort((a, b) => b.date.localeCompare(a.date))
const csvRows = sorted.map(h =>
  `${h.date},${h.calls},${h.inputTokens},${h.cacheWriteTokens},${h.cacheReadTokens},${h.outputTokens},${h.estimatedCostUsd},${h.source}`
)
fs.writeFileSync(HISTORY_PATH, [CSV_HEADER, ...csvRows].join('\n') + '\n')
console.log(`  History updated: +${added} new, ${updated} refreshed  →  ${HISTORY_PATH}`)
console.log()
