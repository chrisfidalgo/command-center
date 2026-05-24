import type { Task } from '@/lib/entities'

// Mirrors the original tasks.ts data with stable IDs.
// These are only used when localStorage has no task data.
// The 'done: true' items would normally be archived but are kept here
// as a starting point — users can close the sprint to archive them.

export const taskSeeds: Task[] = [
  { id: 'task-01', label: 'Create dashboard layout',          done: true,  backlog: false, createdAt: '2026-05-01T00:00:00.000Z' },
  { id: 'task-02', label: 'Add project cards',                done: true,  backlog: false, createdAt: '2026-05-01T00:00:00.000Z' },
  { id: 'task-03', label: 'Add cost tracker placeholder',     done: true,  backlog: false, createdAt: '2026-05-01T00:00:00.000Z' },
  { id: 'task-04', label: 'Create data files',                done: true,  backlog: false, createdAt: '2026-05-01T00:00:00.000Z' },
  { id: 'task-05', label: 'Add task checkbox interactions',   done: true,  backlog: false, createdAt: '2026-05-01T00:00:00.000Z' },
  { id: 'task-06', label: 'Add archive & backlog system',     done: true,  backlog: false, createdAt: '2026-05-01T00:00:00.000Z' },
  { id: 'task-07', label: 'Commit data-driven dashboard update', done: false, backlog: false, createdAt: '2026-05-01T00:00:00.000Z' },
  { id: 'task-08', label: 'Add project detail views',         done: false, backlog: true,  createdAt: '2026-05-01T00:00:00.000Z' },
  { id: 'task-09', label: 'Add AI workflow knowledge tracker',done: false, backlog: true,  createdAt: '2026-05-01T00:00:00.000Z' },
  { id: 'task-10', label: 'Add prompt & tool library section',done: false, backlog: true,  createdAt: '2026-05-01T00:00:00.000Z' },
  { id: 'task-11', label: 'Connect live cost APIs',           done: false, backlog: true,  createdAt: '2026-05-01T00:00:00.000Z' },
  { id: 'task-12', label: 'Add weekly summary view',          done: false, backlog: true,  createdAt: '2026-05-01T00:00:00.000Z' },
]
