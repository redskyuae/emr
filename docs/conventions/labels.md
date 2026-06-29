# Issue labels

Every issue in this repo is classified along two independent axes: **which layer** it
touches and **what kind of change** it is. Keep them orthogonal — a single issue carries
exactly one layer label plus zero or more type labels.

## Layer labels — exactly one per issue

Every task is either frontend work or backend work. Pick exactly one. This lets us tell at
a glance whether a ticket is for the UI/integration developer or the API developer, and lets
each developer filter the board down to their lane.

| Label      | Color     | Meaning                                                                  |
| ---------- | --------- | ------------------------------------------------------------------------ |
| `frontend` | `#BF5AF2` | UI work and API integration — screens, components, `app/queries/` hooks. |
| `backend`  | `#1D76DB` | API and data work — routes, commands/queries, repositories, schema, DB.  |

> **The XOR rule.** Full-stack work is split into a `frontend` ticket and a `backend`
> ticket (the API-first architecture already separates these concerns), so an issue never
> carries both layer labels. The frontend ticket links its backend dependency with a
> `Blocked by #<n>` line.

## Type labels — orthogonal, zero or more

Layer answers _who_ works on it; type answers _what kind of change_ it is. They stack.

| Label           | Meaning                                                       |
| --------------- | ------------------------------------------------------------- |
| `enhancement`   | New feature or capability.                                    |
| `master-data`   | Tenant-scoped Master / lookup CRUD (categories, statuses, …). |
| `bug`           | Something isn't working.                                      |
| `documentation` | Docs-only change.                                             |

A backend Master CRUD ticket is `backend` + `master-data` + `enhancement`. A screen
integration ticket is `frontend` + `enhancement`.

## Applying the convention

- **New issues:** add the one layer label at creation time, alongside any type labels.
- **Existing open issues:** backfill the missing layer label. Closed issues are left as-is —
  we don't rewrite history.
- If `frontend` or `backend` does not exist in the repo yet, create it with the color above
  (`gh label create backend --color 1D76DB --description "Backend / API tasks"`).
