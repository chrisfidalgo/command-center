'use client'

import { useState, useEffect } from 'react'
import { useLocalStore } from '@/lib/store'
import type { Project, Gate, Task, ProjectCategory } from '@/lib/entities'
import { projectSeeds } from '@/data/projectSeeds'

const CATEGORY_COLORS: Record<ProjectCategory, string> = {
  game:     'bg-purple-900/60 text-purple-300',
  tool:     'bg-blue-900/60 text-blue-300',
  research: 'bg-green-900/60 text-green-300',
  client:   'bg-amber-900/60 text-amber-300',
}

const CATEGORY_LABELS: Record<ProjectCategory, string> = {
  game:     'Game',
  tool:     'Tool',
  research: 'Research',
  client:   'Client',
}

function gateProgress(gates: Gate[]) {
  if (gates.length === 0) return { pct: 0, met: 0, total: 0, current: 'No gates' }
  const met = gates.filter(g => g.met).length
  const next = gates.find(g => !g.met)
  return {
    pct: Math.round((met / gates.length) * 100),
    met,
    total: gates.length,
    current: next?.label ?? 'Shipped',
  }
}

function formatMetDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function LinkedTasks({ projectId }: { projectId: string }) {
  const [linked, setLinked] = useState<Task[]>([])

  useEffect(() => {
    const saved = localStorage.getItem('cc_tasks')
    if (!saved) return
    const all: Task[] = JSON.parse(saved)
    setLinked(all.filter(t => t.projectId === projectId))
  }, [projectId])

  if (linked.length === 0) return null

  return (
    <div>
      <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-zinc-500">
        Linked Tasks
      </h4>
      <ul className="space-y-1">
        {linked.map(t => (
          <li key={t.id} className="flex items-center gap-2 text-sm">
            <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${t.done ? 'bg-zinc-600' : 'bg-zinc-400'}`} />
            <span className={t.done ? 'text-zinc-600 line-through' : 'text-zinc-400'}>
              {t.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

type FilterValue = 'all' | ProjectCategory

export default function ProjectsPanel() {
  const [projects, projectActions, mounted] = useLocalStore<Project>('cc_projects', projectSeeds)
  const [filter, setFilter] = useState<FilterValue>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (!mounted) return null

  const filtered =
    filter === 'all' ? projects : projects.filter(p => p.category === filter)

  function toggleGate(projectId: string, gateId: string) {
    const project = projects.find(p => p.id === projectId)
    if (!project) return
    const gate = project.gates.find(g => g.id === gateId)
    if (!gate) return
    const updatedGate: Gate = gate.met
      ? { ...gate, met: false, metDate: undefined }
      : { ...gate, met: true, metDate: new Date().toISOString() }
    projectActions.update(projectId, {
      gates: project.gates.map(g => (g.id === gateId ? updatedGate : g)),
    })
  }

  const filterOptions: { value: FilterValue; label: string }[] = [
    { value: 'all',      label: 'All' },
    { value: 'game',     label: 'Game' },
    { value: 'tool',     label: 'Tool' },
    { value: 'research', label: 'Research' },
    { value: 'client',   label: 'Client' },
  ]

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Projects</h2>
        <span className="text-xs text-zinc-500">{projects.length} total</span>
      </div>

      {/* Category filter */}
      <div className="mb-4 flex gap-1 flex-wrap">
        {filterOptions.map(opt => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filter === opt.value
                ? 'bg-zinc-700 text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(project => {
          const { pct, met, total, current } = gateProgress(project.gates)
          const isExpanded = expandedId === project.id

          return (
            <div
              key={project.id}
              className="rounded-xl border border-zinc-800 bg-zinc-950"
            >
              {/* Card header — always visible */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : project.id)}
                className="w-full text-left p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${CATEGORY_COLORS[project.category]}`}
                    >
                      {CATEGORY_LABELS[project.category]}
                    </span>
                    <h3 className="font-medium truncate">{project.name}</h3>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {project.status !== 'active' && (
                      <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-400 capitalize">
                        {project.status}
                      </span>
                    )}
                    <span className="text-xs text-zinc-500">{isExpanded ? '↑' : '↓'}</span>
                  </div>
                </div>

                {/* Gate progress */}
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-zinc-500">
                      {current}
                    </span>
                    <span className="text-xs text-zinc-600">{met}/{total}</span>
                  </div>
                  <div className="h-1 w-full rounded-full bg-zinc-800">
                    <div
                      className="h-1 rounded-full bg-zinc-500 transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </button>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="border-t border-zinc-800 px-4 pb-4 pt-3 space-y-4">
                  {/* Description */}
                  {project.description && (
                    <p className="text-sm text-zinc-400">{project.description}</p>
                  )}

                  {/* Links */}
                  {project.links.length > 0 && (
                    <div>
                      <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-zinc-500">
                        Links
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {project.links.map(link => (
                          <a
                            key={link.label}
                            href={link.url}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg border border-zinc-800 px-3 py-1 text-xs text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
                          >
                            {link.label} ↗
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Agents */}
                  {project.agentAssignments.length > 0 && (
                    <div>
                      <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-zinc-500">
                        Agents
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {project.agentAssignments.map(prefix => (
                          <span
                            key={prefix}
                            className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-mono text-zinc-300"
                          >
                            {prefix}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Gates */}
                  {project.gates.length > 0 && (
                    <div>
                      <h4 className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-500">
                        Production Gates
                      </h4>
                      <ul className="space-y-1.5">
                        {project.gates.map(gate => (
                          <li key={gate.id} className="flex items-center gap-2.5">
                            <button
                              onClick={() => toggleGate(project.id, gate.id)}
                              className={`flex-shrink-0 h-4 w-4 rounded border transition-colors ${
                                gate.met
                                  ? 'border-zinc-500 bg-zinc-500'
                                  : 'border-zinc-700 hover:border-zinc-500'
                              }`}
                              aria-label={gate.met ? `Unmark ${gate.label}` : `Mark ${gate.label} as met`}
                            >
                              {gate.met && (
                                <svg className="w-full h-full p-0.5 text-zinc-950" fill="none" viewBox="0 0 12 12">
                                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                            </button>
                            <span className={`text-sm ${gate.met ? 'text-zinc-600 line-through' : 'text-zinc-300'}`}>
                              {gate.label}
                            </span>
                            {gate.met && gate.metDate && (
                              <span className="ml-auto text-xs text-zinc-600 flex-shrink-0">
                                {formatMetDate(gate.metDate)}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Linked tasks */}
                  <LinkedTasks projectId={project.id} />
                </div>
              )}
            </div>
          )
        })}

        {filtered.length === 0 && (
          <p className="text-sm text-zinc-600 py-2">No projects in this category.</p>
        )}
      </div>
    </section>
  )
}
