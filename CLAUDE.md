@AGENTS.md

# EMR — Multi-Tenant Hospital Management System

API-first hospital management platform. A **Tenant** is a hospital group (e.g., Apollo Hospitals). Each tenant contains one or more **Facilities** (hospitals, clinics, labs). All clinical and operational data is scoped to a tenant via row-level isolation.

## Stack

| Layer           | Tool                              |
| --------------- | --------------------------------- |
| Framework       | Next.js 16.2.7 (App Router)       |
| Language        | TypeScript                        |
| Database        | PostgreSQL via Drizzle ORM        |
| Validation      | Zod v4                            |
| Auth            | BetterAuth (Organizations plugin) |
| Styles          | Tailwind CSS v4                   |
| Package manager | Bun                               |

## Architecture: CQRS + Repository + Validation

Every API module follows this pattern — no exceptions:

```
app/
├── db/
│   └── schema/{entity}.ts              # Drizzle table definition
└── api/
    ├── v1/{module}/route.ts            # Next.js route handler (thin)
    └── lib/
        └── modules/{module}/
            ├── schemas/{module}-schema.ts   # Zod schemas + inferred types
            ├── validator/                   # Validation functions (schema + repository-backed checks)
            ├── commands/                    # Write operations (one file per command)
            ├── queries/                     # Read operations (one file per query)
            └── repository/                  # All DB access (Drizzle queries)
```

**Route handlers are thin.** Parse HTTP input → call command/query → return NextResponse. No business logic in route files.

**Commands validate first.** Every command calls its validator before performing writes. A command that skips validation is a bug.

**Validators own all operation validation.** Files under `app/api/lib/modules/*/validator/**/*.ts` are not limited to Zod parsing. Validators should wrap Zod schema parsing and may also call repository functions for DB-level checks such as existence checks before update/delete operations and uniqueness checks before create/update operations. Validators must still return `ValidationResult<T>` and must not write Drizzle queries directly.

**Queries never mutate.** Query functions are read-only. If you find yourself writing an INSERT inside a query, move it to a command.

**Repositories own all SQL.** Never write Drizzle queries outside a repository file. When validators need DB-level validation, add or reuse repository read functions and call those from the validator.

## Result types

All commands, queries, and validators return discriminated unions from `app/api/lib/utils/types.ts`. Always use these — never throw or return raw data:

```ts
CommandResult<T>; // { success: true; data: T } | { success: false; errors: string[] }
QueryResult<T>; // success variant + optional { data: T[]; total: number } for paginated
ValidationResult<T>; // { success: true; data: T } | { success: false; errors: string[] }
Paginated<T>; // { data: T[]; meta: { total, totalPages, pageSize, pageNumber } }
```

## API validation messages

Keep API error strings exact when a task specifies them. For Global Reference duplicate checks, include the submitted field value in the error, e.g. `Nationality name Indian already exists.` and `Nationality code IND already exists.` Invalid ID validators should return the task's exact entity wording, e.g. `Nationality abc is Invalid.`.

## Multi-tenancy — critical rule

Every table that holds tenant-scoped data MUST have a `tenantId` column. Every repository query MUST filter by `tenantId`. There are no exceptions. A query that omits the tenant filter leaks cross-tenant data.

`tenantId` is resolved from the BetterAuth session (Organizations plugin). Route handlers extract it from the session and pass it into commands/queries. It never comes from the request body.

## Auth infrastructure

BetterAuth is configured in `app/lib/auth.ts` and mounted at `app/api/auth/[...all]/route.ts`. The BetterAuth Organizations plugin uses generated `organization` tables internally, but project code should continue to use the domain term **Tenant**.

`session.session.activeOrganizationId` is the auth-layer source of `tenantId`. Existing route handlers may still accept legacy request-provided `tenantId` until the dedicated migration task removes that path.

## Lessons Learned

Read `lessons.md` for documented architectural solutions and historical bug fixes. For example, `lessons.md` explains how to properly add unique constraints to tables with soft deletes.

## Adding a new module

1. Define the Drizzle table in `app/db/schema/{entity}.ts`, include `tenantId`. If the table requires unique fields, read `lessons.md` for the correct implementation using partial unique indexes.
2. Run `bun run db:generate` to generate the migration, then `bun run db:migrate`
3. Create `app/api/lib/modules/{module}/schemas/{module}-schema.ts` — Zod schema + exported types
4. Create repository in `repository/` — exports a plain object of async functions, including reads needed by validators
5. Create validator(s) in `validator/` — one function per operation, performs Zod parsing plus any repository-backed existence/uniqueness checks, returns `ValidationResult<T>`
6. Create command(s) in `commands/` — validate → repository write → return `CommandResult<T>`
7. Create query/queries in `queries/` — repository → return `QueryResult<T>`
8. Create `app/api/v1/{module}/route.ts` — HTTP parsing, call command/query, NextResponse

## Database commands

```bash
bun run db:generate   # generate migration from schema changes
bun run db:migrate    # run pending migrations
bun run db:deploy     # check + migrate (use in CI/prod)
bun run db:push       # push schema directly (dev only, no migration file)
bun run db:studio     # open Drizzle Studio
```

## Dev commands

```bash
bun run dev           # start dev server
bun run build         # production build
bun run lint          # ESLint
bun run format        # Prettier (write)
bun run format:check  # Prettier (check only)
```

## Domain reference

See `CONTEXT.md` for the canonical glossary of domain terms. Use those terms exactly — do not introduce synonyms.
