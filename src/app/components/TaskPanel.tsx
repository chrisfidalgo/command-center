'use client'

import { useState } from 'react'
import type { Task } from '@/data/tasks'

type ArchivedTask = { label: string; completedAt: string }

const MAX_ACTIVE = 7

export default function TaskPanel({
  initialActive,
  initialBacklog,
}: {
  initialActive: Task[]
  initialBacklog: Task[]
}) {
  const [active, setActive] = useState(initialActive)
  const [backlog, setBacklog] = useState(initialBacklog)
  const [archived, setArchived] = useState<ArchivedTask[]>([])
  const [view, setView] = useState<'active' | 'archive'>('active')

  function toggleDone(label: string) {
    setActive(prev =>
      prev.map(t => (t.label === label ? { ...t, done: !t.done } : t))
    )
  }

  function closeSprint() {
    const done = active.filter(t => t.done)
    if (done.length === 0) return

    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
    const newArchived: ArchivedTask[] = done.map(t => ({
      label: t.label,
      completedAt: today,
    }))

    const remaining = active.filter(t => !t.done)
    const slots = MAX_ACTIVE - remaining.length
    const promoted = backlog.slice(0, slots).map(t => ({ ...t, done: false }))
    const newBacklog = backlog.slice(slots)

    setActive([...remaining, ...promoted])
    setBacklog(newBacklog)
    setArchived(prev => [...newArchived, ...prev])
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
            {archived.map((t, i) => (
              <li
                key={i}
                className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm"
              >
                <span className="text-zinc-500 line-through">{t.label}</span>
                <span className="text-xs text-zinc-600">{t.completedAt}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    )
  }

  const doneCount = active.filter(t => t.done).length

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <h2 className="mb-4 text-xl font-semibold">Next Tasks</h2>
      <ul className="space-y-3">
        {active.map(task => (
          <li
            key={task.label}
            className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm"
          >
            <input
              type="checkbox"
              checked={task.done}
              onChange={() => toggleDone(task.label)}
              className="h-4 w-4 cursor-pointer accent-zinc-400"
            />
            <span
              className={
                task.done ? 'text-zinc-500 line-through' : 'text-zinc-300'
              }
            >
              {task.label}
            </span>
          </li>
        ))}
      </ul>
      {backlog.length > 0 && (
        <p className="mt-3 text-xs text-zinc-600">
          {backlog.length} task{backlog.length !== 1 ? 's' : ''} in backlog
        </p>
      )}
      <div className="mt-4 flex items-center justify-between">
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
