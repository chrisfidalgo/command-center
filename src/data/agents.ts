export type Agent = {
  prefix: string;
  name: string;
  role: string;
  summary: string;
  isNew?: boolean;
};

export const agents: Agent[] = [
  {
    prefix: "ARTY",
    name: "Arty",
    role: "Artist",
    summary: "Visual development, art direction, concept prompts, and style documentation.",
  },
  {
    prefix: "JEFF",
    name: "Jeff",
    role: "Producer",
    summary: "Milestone planning, sprint structure, scope control, and backlog management.",
  },
  {
    prefix: "CID",
    name: "Cid",
    role: "Engineer",
    summary: "Architecture, refactoring, debugging, implementation plans, and code review.",
  },
  {
    prefix: "D",
    name: "D",
    role: "Designer",
    summary: "Gameplay systems, combat design, progression, balance, and player experience.",
  },
  {
    prefix: "NADYA",
    name: "Nadya",
    role: "Writer",
    summary: "Narrative design, dialogue, worldbuilding, lore, and tone consistency.",
  },
  {
    prefix: "QAIRA",
    name: "Qaira",
    role: "QA Tester",
    summary: "Test plans, bug reports, repro steps, edge cases, and release validation.",
  },
  {
    prefix: "MIRA",
    name: "Mira",
    role: "Marketing",
    summary: "Pitches, Steam/itch copy, trailer scripts, press kits, and audience positioning.",
  },
  {
    prefix: "PAMELA",
    name: "Pamela",
    role: "Product Manager",
    summary: "Business strategy, cost estimation, budgets, risk assessment, and operational planning.",
    isNew: true,
  },
];
