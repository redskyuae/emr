<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Project Instructions

Read `CLAUDE.md` for the full project architecture, coding conventions, module structure, and multi-tenancy rules. Read `CONTEXT.md` for the canonical domain glossary — use those terms exactly. Read `lessons.md` for important lessons learned, such as how to implement DB-level unique constraints with soft deletes.

Any backend change (anything under `app/api/lib/modules/**` or `app/db/schema/**`) must ship with colocated Vitest tests in the **same change**. Read [`docs/backend-testing.md`](docs/backend-testing.md) — it has the mandatory per-layer coverage, the file-naming rule (the suffix is `*.unit.tests.ts` / `*.integration.tests.ts`, **plural**; singular / `*.test.ts` / `*.spec.ts` files are silently ignored by Vitest), worked examples for schema/validator/command/query/repository tests, and the shared mocking patterns. The suite (`bun run test`) and `bunx tsc --noEmit` must stay green.

# Team Skills

The `.agents/skills/` directory contains shared workflow skills for this project. Each skill is a directory with a `SKILL.md` that describes what it does and when to use it.

Key skills for this project:

| Skill                           | When to use                                                   |
| ------------------------------- | ------------------------------------------------------------- |
| `tdd`                           | Building new features or fixing bugs using red-green-refactor |
| `diagnose`                      | Debugging errors, unexpected behaviour, or regressions        |
| `to-issues`                     | Breaking a plan or spec into independently-grabbable tickets  |
| `to-prd`                        | Turning a conversation into a PRD on the issue tracker        |
| `triage`                        | Creating or triaging issues                                   |
| `review`                        | Pre-merge code review                                         |
| `prepare-to-merge-to-main`      | Running branch readiness checks before PR/merge to main       |
| `prototype`                     | Exploring a design or data model before committing            |
| `grill-with-docs`               | Stress-testing a plan and updating domain documentation       |
| `improve-codebase-architecture` | Finding refactoring and architecture improvements             |
| `design-system`                 | Building or changing any frontend UI (see also `DESIGN.md`)   |

If you are Claude Code, invoke a skill with `/skill-name`. If you are another agent, read the skill's `SKILL.md` directly and follow its instructions.

# Issue labels

Every issue carries **exactly one layer label** — `frontend` or `backend` — plus zero or more
orthogonal type labels (`enhancement`, `master-data`, `bug`, `documentation`). See
[`docs/conventions/labels.md`](docs/conventions/labels.md) for the full taxonomy, colors, and
how to backfill existing issues.
