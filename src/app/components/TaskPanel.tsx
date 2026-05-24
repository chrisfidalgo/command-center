'use client'

import { useState, useEffect } from 'react'
import { useLocalStore } from '@/lib/store'
import { createTask, createArchivedTask } from '@/lib/entities'
import type { Task, ArchivedTask, Project } from '@/lib/entities'
import { taskSeeds } from '@/data/taskSeeds'

const KEY_TASKS    = 'cc_tasks'
const KEY_ARCHIVED = 'cc_archived_tasks'
const KEY_PROJECTS = 'cc_projects'
// Legacy keys from v1 schema
const KEY_OLD_ACTIVE  = 'cc_active_tasks'
const KEY_OLD_BACKLOG = 'cc_backlog_tasks'

const MAX_ACTIVE = 7

function migrateFromLegacy() {
  if (localStorage.getItem(KEY_TASKS)) return  // already migrated
  const oldActive  = localStorage.getItem(KEY_OLD_ACTIVE)
  const oldBacklog = localStorage.getItem(KEY_OLD_BACKLOG)
  if (!oldActive && !oldBacklog) return

  const active:  { label: string; done: boolean }[] = oldActive  ? JSON.parse(oldActive)  : []
  const backlog: { label: string; done: boolean }[] = oldBacklog ? JSON.parse(oldBacklog) : []

  const migrated: Task[] = [
    ...active.map(t  => createTask({ label: t.label,  done: t.done,  backlog: false })),
    ...backlog.map(t => createTask({ label: t.label,  done: t.done,  backlog: true  })),
  ]
  localStorage.setItem(KEY_TASKS, JSON.stringify(migrated))
  localStorage.removeItem(KEY_OLD_ACTIVE)
  localStorage.removeItem(KEY_OLD_BACKLOG)
}

export default function TaskPanel() {
  const [tasks, taskActions, mounted] = useLocalStore<Task>(KEY_TASKS, taskSeeds)
  const [archived, setArchived] = useState<ArchivedTask[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [view, setView] = useState<'active' | 'archive'>('active')
  const [newLabel, setNewLabel] = useState('')
  const [newProjectId, setNewProjectId] = useState('')

  useEffect(() => {
    migrateFromLegacy()

    const savedArchived = localStorage.getItem(KEY_ARCHIVED)
    if (savedArchived) {
      const items: ArchivedTask[] = JSON.parse(savedArchived)
      setArchived(items.map(t => t.id ? t : { ...t, id: crypto.randomUUID() }))
    }

    const savedProjects = localStorage.getItem(KEY_PROJECTS)
    if (savedProjects) setProjects(JSON.parse(savedProjects))
  }, [])

  useEffect(() => {
    if (mounted) localStorage.setItem(KEY_ARCHIVED, JSON.stringify(archived))
  }, [archived, mounted])

  if (!mounted) return null

  const active  = tasks.filter(t => !t.backlog)
  const backlog = tasks.filter(t =>  t.backlog)
  const doneCount = active.filter(t => t.done).length

  function toggleDone(id: string) {
    taskActions.update(id, { done: !tasks.find(t => t.id === id)?.done })
  }

  function closeSprint() {
    const done = active.filter(t => t.done)
    if (done.length === 0) return

    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    })
    const newArchived = done.map(t =>
      createArchivedTask({ label: t.label, completedAt: today, projectId: t.projectId })
    )

    const remaining = active.filter(t => !t.done)
    const slots = MAX_ACTIVE - remaining.length
    const promoted = backlog.slice(0, slots).map(t => ({ ...t, backlog: false }))
    const newBacklog = backlog.slice(slots)

    taskActions.set([...remaining, ...promoted, ...newBacklog])
    setArchived(prev => [...newArchived, ...prev])
  }

  function addTask(e: React.FormEvent) {
    e.preventDefault()
    if (!newLabel.trim()) return
    const toBacklog = active.length >= MAX_ACTIVE
    taskActions.add(createTask({
      label: newLabel.trim(),
      backlog: toBacklog,
      projectId: newProjectId || undefined,
    }))
    setNewLabel('')
    setNewProjectId('')
  }

  function projectName(projectId?: string) {
    if (!projectId) return null
    return projects.find(p => p.id === projectId)?.name ?? null
  }

  if (view === 'archive') {
    return (
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Task Archive</h2>
          <button
            onClick={() => setView('active')}
            className="text-xs text-zinc-400 transition-colors hover:text-zinc-200"
          >
            ← Back
          </button>
        </div>
        {archived.length === 0 ? (
          <p className="text-sm text-zinc-500">No archived tasks yet.</p>
        ) : (
          <ul className="space-y-2">
            {archived.map(t => (
              <li
                key={t.id}
                className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-zinc-500 line-through truncate">{t.label}</span>
                  {t.projectId && projectName(t.projectId) && (
                    <span className="flex-shrink-0 rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-500">
                      {projectName(t.projectId)}
                    </span>
                  )}
                </div>
                <span className="flex-shrink-0 text-xs text-zinc-600 ml-2">{t.completedAt}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <h2 className="mb-4 text-xl font-semibold">Next Tasks</h2>

      <ul className="space-y-3">
        {active.map(task => {
          const pName = projectName(task.projectId)
          return (
            <li
              key={task.id}
              className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm"
            >
              <input
                type="checkbox"
                checked={task.done}
                onChange={() => toggleDone(task.id)}
                className="h-4 w-4 flex-shrink-0 cursor-pointer accent-zinc-400"
              />
              <span
                className={`flex-1 min-w-0 truncate ${task.done ? 'text-zinc-500 line-through' : 'text-zinc-300'}`}
              >
                {task.label}
              </span>
              {pName && (
                <span className="flex-shrink-0 rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-500">
                  {pName}
                </span>
              )}
            </li>
          )
        })}
      </ul>

      {backlog.length > 0 && (
        <p className="mt-3 text-xs text-zinc-600">
          {backlog.length} task{backlog.length !== 1 ? 's' : ''} in backlog
        </p>
      )}

      {/* Add task */}
      <form onSubmit={addTask} className="mt-4 flex gap-2">
        <input
          type="text"
          value={newLabel}
          onChange={e => setNewLabel(e.target.value)}
          placeholder="Add a task…"
          className="flex-1 min-w-0 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-300 placeholder-zinc-600 outline-none focus:border-zinc-600"
        />
        {projects.length > 0 && (
          <select
            value={newProjectId}
            onChange={e => setNewProjectId(e.target.value)}
            className="rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-400 outline-none focus:border-zinc-600"
          >
            <option value="">No project</option>
            {projects.filter(p => p.status === 'active').map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        )}
        <button
          type="submit"
          disabled={!newLabel.trim()}
          className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Add
        </button>
      </form>

      <div className="mt-3 flex items-center justify-between">
        <button
          onClick={() => setView('archive')}
          className="text-xs text-zinc-500 transition-colors hover:text-zinc-300"
        >
          View archive{archived.length > 0 ? ` (${archived.length})` : ''}
        </button>
        {doneCount > 0 && (
          <button
            onClick={closeSprint}
            className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-zinc-100"
          >
            Archive Tasks ({doneCount} done)
          </button>
        )}
      </div>
    </section>
  )
}
