import fs from 'fs'
import path from 'path'
import os from 'os'
import { calculateApiCost } from './api-cost-calculator'
import type { DailyUsageEntry } from '@/data/usage-log'

const SESSIONS_DIR = path.join(
  os.homedir(),
  '.claude',
  'projects',
  'd--GitProjects-command-center'
)

const MODEL = 'claude-sonnet-4-6'

interface RawUsage {
  input_tokens?: number
  cache_creation_input_tokens?: number
  cache_read_input_tokens?: number
  output_tokens?: number
}

interface DailyAccumulator {
  date: string
  calls: number
  inputTokens: number
  cacheWriteTokens: number
  cacheReadTokens: number
  outputTokens: number
}

export function parseSessionLogs(days = 7): DailyUsageEntry[] {
  if (!fs.existsSync(SESSIONS_DIR)) return []

  const files = fs.readdirSync(SESSIONS_DIR).filter((f) => f.endsWith('.jsonl'))
  const seen = new Set<string>()
  const byDate: Record<string, DailyAccumulator> = {}

  for (const file of files) {
    const lines = fs
      .readFileSync(path.join(SESSIONS_DIR, file), 'utf8')
      .split('\n')
      .filter(Boolean)

    for (const line of lines) {
      try {
        const obj = JSON.parse(line)
        if (obj.type !== 'assistant') continue

        const rid: string | undefined = obj.requestId
        if (!rid || seen.has(rid)) continue
        seen.add(rid)

        const u: RawUsage | undefined = obj.message?.usage
        if (!u) continue

        const date: string = obj.timestamp.slice(0, 10)
        if (!byDate[date]) {
          byDate[date] = { date, calls: 0, inputTokens: 0, cacheWriteTokens: 0, cacheReadTokens: 0, outputTokens: 0 }
        }

        byDate[date].calls++
        byDate[date].inputTokens += u.input_tokens ?? 0
        byDate[date].cacheWriteTokens += u.cache_creation_input_tokens ?? 0
        byDate[date].cacheReadTokens += u.cache_read_input_tokens ?? 0
        byDate[date].outputTokens += u.output_tokens ?? 0
      } catch {
        // malformed line — skip
      }
    }
  }

  // Sort newest-first, take last N days
  const sorted = Object.values(byDate).sort((a, b) => b.date.localeCompare(a.date))
  const window = sorted.slice(0, days)

  // Pad with empty rows so the table always shows the full window
  const result: DailyUsageEntry[] = []
  for (let i = 0; i < days; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    const found = window.find((e) => e.date === dateStr)

    if (found) {
      const cost = calculateApiCost(
        {
          input_tokens: found.inputTokens,
          output_tokens: found.outputTokens,
          cache_creation_input_tokens: found.cacheWriteTokens,
          cache_read_input_tokens: found.cacheReadTokens,
        },
        MODEL
      )
      result.push({
        date: found.date,
        calls: found.calls,
        inputTokens: found.inputTokens,
        outputTokens: found.outputTokens,
        cacheWriteTokens: found.cacheWriteTokens,
        cacheReadTokens: found.cacheReadTokens,
        estimatedCostUsd: cost.costs.total,
        source: 'subscription',
      })
    } else {
      result.push({
        date: dateStr,
        calls: 0,
        inputTokens: 0,
        outputTokens: 0,
        cacheWriteTokens: 0,
        cacheReadTokens: 0,
        estimatedCostUsd: 0,
        source: 'subscription',
      })
    }
  }

  return result
}
