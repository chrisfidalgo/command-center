import fs from 'fs'
import path from 'path'
import os from 'os'
import { calculateApiCost } from './api-cost-calculator'

// ── Config ────────────────────────────────────────────────────────────────────
const GIT_PROJECTS_ROOT = 'C:\\Users\\cfida\\Documents\\projects\\git'
const BLACKLIST = new Set(['galactic-match'])
const CLAUDE_PROJECTS_DIR = path.join(os.homedir(), '.claude', 'projects')
const MODEL = 'claude-sonnet-4-6'
const HISTORY_PATH = path.join(process.cwd(), 'src', 'data', 'usage-history.csv')
// ─────────────────────────────────────────────────────────────────────────────

export interface HistoryEntry {
  date: string
  calls: number
  inputTokens: number
  cacheWriteTokens: number
  cacheReadTokens: number
  outputTokens: number
  estimatedCostUsd: number
  source: string
}

export function loadUsageHistory(): HistoryEntry[] {
  try {
    const lines = fs.readFileSync(HISTORY_PATH, 'utf8').trim().split('\n')
    return lines.slice(1).map((line) => {
      const [date, calls, input_tokens, cache_write_tokens, cache_read_tokens, output_tokens, estimated_cost_usd, source] = line.split(',')
      return {
        date,
        calls: parseInt(calls, 10),
        inputTokens: parseInt(input_tokens, 10),
        cacheWriteTokens: parseInt(cache_write_tokens, 10),
        cacheReadTokens: parseInt(cache_read_tokens, 10),
        outputTokens: parseInt(output_tokens, 10),
        estimatedCostUsd: parseFloat(estimated_cost_usd),
        source: source?.trim() ?? 'unknown',
      }
    })
  } catch {
    return []
  }
}

export function getMergedSummary(days = 30): SessionLogSummary {
  const live = parseSessionLogs(days)
  const history = loadUsageHistory()

  // Live data wins on any date it has calls; history fills the rest
  const merged: Record<string, DailyTotal> = {}
  for (const d of live.byDate) {
    if (d.calls > 0) merged[d.date] = d
  }
  for (const h of history) {
    if (!merged[h.date]) {
      merged[h.date] = {
        date: h.date,
        calls: h.calls,
        inputTokens: h.inputTokens,
        cacheWriteTokens: h.cacheWriteTokens,
        cacheReadTokens: h.cacheReadTokens,
        outputTokens: h.outputTokens,
        estimatedCostUsd: h.estimatedCostUsd,
      }
    }
  }

  const byDate: DailyTotal[] = Array.from({ length: days }, (_, i) => {
    const date = dateFromNow(i)
    return merged[date] ?? {
      date, calls: 0, inputTokens: 0, cacheWriteTokens: 0,
      cacheReadTokens: 0, outputTokens: 0, estimatedCostUsd: 0,
    }
  })

  return { byProject: live.byProject, byDate, entries: live.entries }
}

export interface ProjectDayEntry {
  project: string
  date: string
  calls: number
  inputTokens: number
  cacheWriteTokens: number
  cacheReadTokens: number
  outputTokens: number
  estimatedCostUsd: number
}

export interface ProjectSummary {
  project: string
  calls: number
  inputTokens: number
  cacheWriteTokens: number
  cacheReadTokens: number
  outputTokens: number
  estimatedCostUsd: number
}

export interface DailyTotal {
  date: string
  calls: number
  inputTokens: number
  cacheWriteTokens: number
  cacheReadTokens: number
  outputTokens: number
  estimatedCostUsd: number
}

export interface SessionLogSummary {
  byProject: ProjectSummary[]
  byDate: DailyTotal[]
  entries: ProjectDayEntry[]
}

function getProjectName(cwd: string): string {
  // Handle edge case: cwd is inside .claude subdir (e.g. BackyardBlitz)
  const base = path.basename(cwd)
  return base === '.claude' ? path.basename(path.dirname(cwd)) : base
}

function isUnderRoot(cwd: string): boolean {
  return cwd.toLowerCase().startsWith(GIT_PROJECTS_ROOT.toLowerCase())
}

function dateFromNow(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().slice(0, 10)
}

export function parseSessionLogs(days = 7): SessionLogSummary {
  if (!fs.existsSync(CLAUDE_PROJECTS_DIR)) {
    return { byProject: [], byDate: [], entries: [] }
  }

  const cutoff = dateFromNow(days - 1)

  // Map: "project|date" → accumulator
  const acc: Record<string, ProjectDayEntry> = {}

  for (const slug of fs.readdirSync(CLAUDE_PROJECTS_DIR)) {
    const slugPath = path.join(CLAUDE_PROJECTS_DIR, slug)
    if (!fs.statSync(slugPath).isDirectory()) continue

    const jsonlFiles = fs.readdirSync(slugPath).filter((f) => f.endsWith('.jsonl'))
    if (!jsonlFiles.length) continue

    // Determine cwd and project name from the first line that has a cwd field
    let projectCwd: string | null = null
    outer: for (const file of jsonlFiles) {
      for (const line of fs.readFileSync(path.join(slugPath, file), 'utf8').split('\n')) {
        try {
          const obj = JSON.parse(line)
          if (obj.cwd) { projectCwd = obj.cwd; break outer }
        } catch { /* skip */ }
      }
    }

    if (!projectCwd || !isUnderRoot(projectCwd)) continue

    const project = getProjectName(projectCwd)
    if (BLACKLIST.has(project)) continue

    // Parse all JSONL files for this project, deduplicated by requestId
    const seen = new Set<string>()
    for (const file of jsonlFiles) {
      for (const line of fs.readFileSync(path.join(slugPath, file), 'utf8').split('\n')) {
        try {
          const obj = JSON.parse(line)
          if (obj.type !== 'assistant') continue

          const rid: string | undefined = obj.requestId
          if (!rid || seen.has(rid)) continue
          seen.add(rid)

          const u = obj.message?.usage
          if (!u) continue

          const date: string = obj.timestamp.slice(0, 10)
          if (date < cutoff) continue

          const key = `${project}|${date}`
          if (!acc[key]) {
            acc[key] = {
              project,
              date,
              calls: 0,
              inputTokens: 0,
              cacheWriteTokens: 0,
              cacheReadTokens: 0,
              outputTokens: 0,
              estimatedCostUsd: 0,
            }
          }

          acc[key].calls++
          acc[key].inputTokens += u.input_tokens ?? 0
          acc[key].cacheWriteTokens += u.cache_creation_input_tokens ?? 0
          acc[key].cacheReadTokens += u.cache_read_input_tokens ?? 0
          acc[key].outputTokens += u.output_tokens ?? 0
        } catch { /* skip */ }
      }
    }
  }

  // Compute costs per entry
  const entries: ProjectDayEntry[] = Object.values(acc).map((e) => ({
    ...e,
    estimatedCostUsd: calculateApiCost(
      {
        input_tokens: e.inputTokens,
        output_tokens: e.outputTokens,
        cache_creation_input_tokens: e.cacheWriteTokens,
        cache_read_input_tokens: e.cacheReadTokens,
      },
      MODEL
    ).costs.total,
  }))

  // Roll up by project
  const projectMap: Record<string, ProjectSummary> = {}
  for (const e of entries) {
    if (!projectMap[e.project]) {
      projectMap[e.project] = {
        project: e.project,
        calls: 0, inputTokens: 0, cacheWriteTokens: 0,
        cacheReadTokens: 0, outputTokens: 0, estimatedCostUsd: 0,
      }
    }
    const p = projectMap[e.project]
    p.calls += e.calls
    p.inputTokens += e.inputTokens
    p.cacheWriteTokens += e.cacheWriteTokens
    p.cacheReadTokens += e.cacheReadTokens
    p.outputTokens += e.outputTokens
    p.estimatedCostUsd += e.estimatedCostUsd
  }

  const byProject = Object.values(projectMap).sort(
    (a, b) => b.estimatedCostUsd - a.estimatedCostUsd
  )

  // Roll up by date — pad to full window
  const dateMap: Record<string, DailyTotal> = {}
  for (const e of entries) {
    if (!dateMap[e.date]) {
      dateMap[e.date] = {
        date: e.date, calls: 0, inputTokens: 0, cacheWriteTokens: 0,
        cacheReadTokens: 0, outputTokens: 0, estimatedCostUsd: 0,
      }
    }
    const d = dateMap[e.date]
    d.calls += e.calls
    d.inputTokens += e.inputTokens
    d.cacheWriteTokens += e.cacheWriteTokens
    d.cacheReadTokens += e.cacheReadTokens
    d.outputTokens += e.outputTokens
    d.estimatedCostUsd += e.estimatedCostUsd
  }

  const byDate: DailyTotal[] = Array.from({ length: days }, (_, i) => {
    const date = dateFromNow(i)
    return dateMap[date] ?? {
      date, calls: 0, inputTokens: 0, cacheWriteTokens: 0,
      cacheReadTokens: 0, outputTokens: 0, estimatedCostUsd: 0,
    }
  })

  return { byProject, byDate, entries }
}
