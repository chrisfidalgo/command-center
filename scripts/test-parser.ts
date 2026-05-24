import { parseSessionLogs } from '../src/lib/parse-session-logs'

const r = parseSessionLogs(7)
console.log('\nProjects found:')
for (const p of r.byProject) {
  console.log(`  ${p.project.padEnd(25)} calls=${String(p.calls).padStart(4)}  cacheRead=${String(p.cacheReadTokens).padStart(10)}  est=$${p.estimatedCostUsd.toFixed(4)}`)
}
console.log('\nDates with activity:')
for (const d of r.byDate.filter(d => d.calls > 0)) {
  console.log(`  ${d.date}  calls=${d.calls}  est=$${d.estimatedCostUsd.toFixed(4)}`)
}
