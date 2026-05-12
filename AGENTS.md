<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:subagent-context-rules -->
# Subagent Design — Tight Brief Pattern

## The Core Rule
Never pass a subagent the full conversation history. Synthesize only what it needs to make judgment calls on its specific task.

A good subagent prompt has exactly four parts:
1. **Goal** — what it must produce
2. **Background** — only the facts relevant to this task (not the whole session)
3. **Constraints** — format, scope limits, things to avoid
4. **Output spec** — the exact shape of the answer expected

## What to Strip Before Passing to a Subagent
- Tool results the subagent won't use
- Prior conversation turns that don't affect the task
- System context that is implicit in the task itself
- Your own reasoning and deliberation about *how* to do the task

## Token Target
A well-scoped subagent brief should be 30–60% smaller than a naive "here's everything" dump, with no loss in output quality.

## Prompt Template
```
You are [role]. Your task: [goal in one sentence].

Context you need:
- [fact 1]
- [fact 2]
- [file path / symbol if relevant]

Constraints:
- [scope limit]
- [format requirement]

Return: [exact output description — a list, a patch, a yes/no with reason, etc.]
```

## When to Use a Subagent at All
- Parallel independent lookups (don't serialize what can run at once)
- Tasks that would bloat the main context with large tool results
- Work where a fresh perspective is better than inherited assumptions

Do NOT spawn a subagent for tasks you can complete in 1–3 tool calls inline.
<!-- END:subagent-context-rules -->
