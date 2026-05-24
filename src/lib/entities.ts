import { gateTemplates } from '@/data/gateTemplates'

export type ProjectCategory = 'game' | 'tool' | 'research' | 'client'
export type ProjectStatus = 'active' | 'paused' | 'shipped' | 'cancelled'

export type ProjectLink = {
  label: string
  url: string
}

export type Gate = {
  id: string
  label: string
  met: boolean
  metDate?: string
  notes?: string
}

export type Project = {
  id: string
  name: string
  category: ProjectCategory
  description: string
  links: ProjectLink[]
  agentAssignments: string[]
  gates: Gate[]
  status: ProjectStatus
  createdAt: string
}

export type Task = {
  id: string
  label: string
  done: boolean
  backlog: boolean
  projectId?: string
  createdAt: string
}

export type ArchivedTask = {
  id: string
  label: string
  completedAt: string
  projectId?: string
}

export function createProject(
  partial: Partial<Project> & { name: string; category: ProjectCategory }
): Project {
  const template = gateTemplates[partial.category] ?? []
  const gates: Gate[] = partial.gates ?? template.map(label => ({
    id: crypto.randomUUID(),
    label,
    met: false,
  }))
  return {
    id: partial.id ?? crypto.randomUUID(),
    name: partial.name,
    category: partial.category,
    description: partial.description ?? '',
    links: partial.links ?? [],
    agentAssignments: partial.agentAssignments ?? [],
    gates,
    status: partial.status ?? 'active',
    createdAt: partial.createdAt ?? new Date().toISOString(),
  }
}

export function createTask(partial: Partial<Task> & { label: string }): Task {
  return {
    id: partial.id ?? crypto.randomUUID(),
    label: partial.label,
    done: partial.done ?? false,
    backlog: partial.backlog ?? false,
    projectId: partial.projectId,
    createdAt: partial.createdAt ?? new Date().toISOString(),
  }
}

export function createArchivedTask(
  partial: Partial<ArchivedTask> & { label: string; completedAt: string }
): ArchivedTask {
  return {
    id: partial.id ?? crypto.randomUUID(),
    label: partial.label,
    completedAt: partial.completedAt,
    projectId: partial.projectId,
  }
}
