import { projects } from "@/data/projects";
import { tasks } from "@/data/tasks";
import { costs, totalMonthlyCost } from "@/data/costs";

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-6xl p-8">
        <header className="mb-10">
          <p className="text-sm uppercase tracking-widest text-zinc-500">
            Personal Studio OS
          </p>
          <h1 className="mt-2 text-4xl font-bold">Command Center</h1>
          <p className="mt-3 max-w-2xl text-zinc-400">
            A dashboard for tracking projects, AI workflows, costs, prompts,
            and prototype momentum.
          </p>
        </header>

        <section className="mb-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-xl font-semibold">Current Focus</h2>
          <p className="mt-2 text-zinc-300">
            Stand up the first usable dashboard shell.
          </p>
        </section>

        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="mb-4 text-xl font-semibold">Projects</h2>
            <div className="space-y-3">
              {projects.map((project) => (
                <div
                  key={project.name}
                  className="rounded-xl border border-zinc-800 bg-zinc-950 p-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{project.name}</h3>
                    <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300">
                      {project.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-zinc-400">{project.focus}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="mb-4 text-xl font-semibold">Next Tasks</h2>
            <ul className="space-y-3">
              {tasks.map((task) => (
                <li
                  key={task}
                  className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-300"
                >
                  {task}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">AI Spend Tracker</h2>
            <span className="text-sm text-zinc-400">
              ${totalMonthlyCost}/month planned
            </span>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {costs.map((cost) => (
              <div
                key={cost.name}
                className="rounded-xl border border-zinc-800 bg-zinc-950 p-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{cost.name}</h3>
                  <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300">
                    {cost.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-zinc-400">
                  ${cost.monthlyCost}/month
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}