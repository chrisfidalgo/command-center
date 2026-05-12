# PROJECT_CONTEXT.md

> Canonical reference for all agents. Read this before giving project-specific guidance.

---

## Project Vision

A personal Command Center — a living dashboard and studio OS for one person.

The primary purpose is to build AI fluency through real, shipped work: learning pipelines, assembling reusable AI components and skills, and using that growing suite to accelerate the creation of other ideas, prototypes, and websites.

The dashboard itself is both the product and the proof of concept. If the tools built here work, they should be visible in how the dashboard itself gets built.

Longer term, the project may expand into personal and life management territory — tracking goals, habits, decisions, or other personal context — but that is out of scope for the current milestone.

---

## Owner

Solo. One developer/designer/creator.

---

## Target Platform

Web — desktop-first, personal use. Not a public product. No multi-user requirements.

---

## Core Purpose

1. **Learn** — AI skills, pipelines, tooling, and agent patterns through hands-on building.
2. **Build** — Reusable AI components and workflows that compound over time.
3. **Ship** — Use what is built to accelerate other ideas, prototypes, and websites.

The Command Center tracks and supports all three.

---

## Current Milestone — V1: Real Shell

**Goal:** Stand up a dashboard that is genuinely useful, not just a scaffold.

This means moving from placeholder/static data toward real content, real tasks, and real interactivity — while continuing to onboard AI tools and workflows into the process.

**Milestone is complete when:**
- The dashboard reflects actual current projects and tasks (not lorem ipsum-level placeholders)
- At least one section is interactive or dynamic (not fully static)
- At least one AI integration or workflow is documented or wired in
- The site can be opened daily and provide useful signal

---

## Current Priorities

1. Make existing sections data-real (projects, tasks, costs reflect actual state)
2. Add basic interactivity to the task list (toggle completion state)
3. Document and wire in at least one AI workflow or pipeline component
4. Identify and stub the next section the dashboard actually needs

---

## Technical Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.6 (App Router) |
| UI | React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Data | Static files in `src/data/` (current) |
| Hosting | TBD |
| AI integrations | TBD — being built out |

**Note:** This version of Next.js has breaking changes from prior versions. Agents should check `node_modules/next/dist/docs/` before writing framework-specific code.

---

## Current Structure

```
src/
  app/
    page.tsx        ← main dashboard (single route)
    layout.tsx      ← root layout, Geist fonts
    globals.css
  data/
    projects.ts     ← active projects with status + focus
    tasks.ts        ← task list with label + done state
    costs.ts        ← AI tool subscriptions + monthly cost
```

No component directory yet. All markup is inline in `page.tsx`.

---

## Dashboard Sections (Current)

| Section | Status | Notes |
|---|---|---|
| Current Focus | Static string | Hardcoded, not data-backed |
| Projects | Static data | Driven by `projects.ts` |
| Next Tasks | Static data | Typed objects with `done` boolean; no interactivity yet |
| AI Spend Tracker | Static data | Driven by `costs.ts`; total computed |

---

## Design Direction

- Dark theme: `zinc-950` background, `zinc-900` cards, `zinc-800` borders
- Minimal, functional — no decorative chrome
- Typography: Geist Sans / Geist Mono
- Card pattern: `rounded-2xl border border-zinc-800 bg-zinc-900 p-6` (sections), `rounded-xl border border-zinc-800 bg-zinc-950 p-4` (items)
- No external UI library — Tailwind only

---

## Production Constraints

- Solo project — no review process, no sprint ceremonies
- Scope creep is the primary risk; default to the smallest useful increment
- No backend yet — keep data in static files until there is a clear reason to add a database
- No authentication required — personal use only
- Avoid dependencies unless clearly justified

---

## Known Risks

- Scope expansion: the vision is large; the milestone must stay small
- AI integrations can become rabbit holes — timebox exploration
- No persistent state yet — interactivity is limited until storage is added

---

## Open Questions

- What is the first AI workflow to document or wire in?
- What storage layer (if any) makes sense for task completion state? (localStorage, flat file, DB)
- What is the next dashboard section that would provide real daily utility?
- Does the dashboard need a nav structure as sections grow, or does a single scrolling page stay appropriate?

---

## Out of Scope (Current Milestone)

- Personal / life management features
- Multi-page routing beyond the main dashboard
- Authentication or user accounts
- Public-facing marketing or landing page
- Mobile optimization
- Any game project work (tracked separately)

---

## Companion Files

| File | Purpose | Status |
|---|---|---|
| `AGENT_INIT.MD` | Agent roster and routing rules | Exists |
| `PROJECT_CONTEXT.md` | This file | Exists |
| `ROADMAP.md` | Milestone plan beyond V1 | Not created |
| `TASKS.md` | Running task list | Not created |

---

*Last updated: 2026-05-12*
