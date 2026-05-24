export type Task = {
  label: string;
  done: boolean;
  backlog: boolean;
};

export const tasks: Task[] = [
  { label: "Create dashboard layout", done: true, backlog: false },
  { label: "Add project cards", done: true, backlog: false },
  { label: "Add cost tracker placeholder", done: true, backlog: false },
  { label: "Create data files", done: true, backlog: false },
  { label: "Add task checkbox interactions", done: true, backlog: false },
  { label: "Add archive & backlog system", done: true, backlog: false },
  { label: "Commit data-driven dashboard update", done: false, backlog: false },
  { label: "Add project detail views", done: false, backlog: true },
  { label: "Add AI workflow knowledge tracker", done: false, backlog: true },
  { label: "Add prompt & tool library section", done: false, backlog: true },
  { label: "Connect live cost APIs", done: false, backlog: true },
  { label: "Add weekly summary view", done: false, backlog: true },
];
