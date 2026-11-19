<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Project Instructions

Read `CLAUDE.md` for the full project architecture, coding conventions, module structure, and multi-tenancy rules. Read `CONTEXT.md` for the canonical domain glossary — use those terms exactly. Read `lessons.md` for important lessons learned, such as how to implement DB-level unique constraints with soft deletes.

Any backend change (anything under `app/api/lib/modules/**` or `app/db/schema/**`) must ship with colocated Vitest tests in the **same change**. Read [`docs/backend-testing.md`](docs/backend-testing.md) — it has the mandatory per-layer coverage, the file-naming rule (the suffix is `*.unit.tests.ts` / `*.integration.tests.ts`, **plural**; singular / `*.test.ts` / `*.spec.ts` files are silently ignored by Vitest), worked examples for schema/validator/command/query/repository tests, and the shared mocking patterns. The suite (`bun run test`) and `bunx tsc --noEmit` must stay green.

# Team Skills

This repository is set up for Claude Code. The `.claude/skills/` directory contains the project's workflow skills. Each skill is a directory with a `SKILL.md` that describes what it does and when to use it.

Key skills for this project:

| Skill           | When to use                                                                        |
| --------------- | ---------------------------------------------------------------------------------- |
| `create-ticket` | Turning a business requirement into a GitHub ticket (`/create-ticket` only)        |
| `ticket`        | Working a GitHub issue: bug root cause, or feature plan and build (`/ticket` only) |
| `pr`            | Writing a pull request description from the PR template (`/pr` only)               |

Each one runs only when typed as a slash command, for example `/ticket 263`. The `bug-investigator` agent that `/ticket` uses lives in `.claude/agents/`.

# Issue labels

Every issue carries **exactly one layer label** — `frontend` or `backend` — plus zero or more
orthogonal type labels (`enhancement`, `master-data`, `bug`, `documentation`). See
[`docs/conventions/labels.md`](docs/conventions/labels.md) for the full taxonomy, colors, and
how to backfill existing issues.
