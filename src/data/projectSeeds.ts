import type { Project } from '@/lib/entities'

// Hardcoded IDs so seeds are stable across SSR and client renders.
// Gates use the same stability guarantee.

export const projectSeeds: Project[] = [
  {
    id: 'proj-cc',
    name: 'Command Center',
    category: 'tool',
    description: 'Personal studio OS — a dashboard for tracking projects, AI workflows, costs, prompts, and prototype momentum.',
    links: [],
    agentAssignments: ['CID', 'JEFF'],
    status: 'active',
    createdAt: '2026-05-01T00:00:00.000Z',
    gates: [
      { id: 'g-cc-1', label: 'Concept', met: true,  metDate: '2026-05-01T00:00:00.000Z' },
      { id: 'g-cc-2', label: 'MVP',     met: true,  metDate: '2026-05-07T00:00:00.000Z' },
      { id: 'g-cc-3', label: 'Alpha',   met: false },
      { id: 'g-cc-4', label: 'Beta',    met: false },
      { id: 'g-cc-5', label: 'Launch',  met: false },
    ],
  },
  {
    id: 'proj-mp',
    name: 'MyPedestal',
    category: 'game',
    description: 'Project planning underway. Details TBD.',
    links: [],
    agentAssignments: ['JEFF', 'D'],
    status: 'active',
    createdAt: '2026-04-15T00:00:00.000Z',
    gates: [
      { id: 'g-mp-1', label: 'Concept',          met: true,  metDate: '2026-04-15T00:00:00.000Z' },
      { id: 'g-mp-2', label: 'Prototype',         met: true,  metDate: '2026-05-01T00:00:00.000Z' },
      { id: 'g-mp-3', label: 'Vertical Slice',    met: false },
      { id: 'g-mp-4', label: 'Horizontal Slice',  met: false },
      { id: 'g-mp-5', label: 'Alpha',             met: false },
      { id: 'g-mp-6', label: 'Art Pass',          met: false },
      { id: 'g-mp-7', label: 'Beta',              met: false },
      { id: 'g-mp-8', label: 'Publisher Pitch',   met: false },
      { id: 'g-mp-9', label: 'Ship',              met: false },
    ],
  },
  {
    id: 'proj-gpk',
    name: 'Game Prototype Kit',
    category: 'tool',
    description: 'A transportable AI kit for spinning up game prototypes quickly with consistent scaffolding.',
    links: [],
    agentAssignments: ['CID', 'D'],
    status: 'active',
    createdAt: '2026-05-01T00:00:00.000Z',
    gates: [
      { id: 'g-gpk-1', label: 'Concept', met: true,  metDate: '2026-05-01T00:00:00.000Z' },
      { id: 'g-gpk-2', label: 'MVP',     met: false },
      { id: 'g-gpk-3', label: 'Alpha',   met: false },
      { id: 'g-gpk-4', label: 'Beta',    met: false },
      { id: 'g-gpk-5', label: 'Launch',  met: false },
    ],
  },
  {
    id: 'proj-aws',
    name: 'AI Workflow System',
    category: 'research',
    description: 'Research into reusable AI workflow scaffolding — agent roles, prompt patterns, and session structures.',
    links: [],
    agentAssignments: ['JEFF', 'CID', 'PAMELA'],
    status: 'active',
    createdAt: '2026-04-01T00:00:00.000Z',
    gates: [
      { id: 'g-aws-1', label: 'Exploration', met: true,  metDate: '2026-04-01T00:00:00.000Z' },
      { id: 'g-aws-2', label: 'Synthesis',   met: false },
      { id: 'g-aws-3', label: 'Draft',       met: false },
      { id: 'g-aws-4', label: 'Published',   met: false },
    ],
  },
]
