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
| UI components   | shadcn/ui (full set, themed)      |
| Animation       | GSAP + @gsap/react                |
| Package manager | Bun                               |

## Frontend

All UI work follows the design system in `DESIGN.md` (Microsoft Fluent-inspired, shadcn/ui, deep blue primary) — read it before building or changing any UI, and use the `design-system` team skill. Key facts:

- Themed shadcn components live in `components/ui/` (do not fork them); domain composites in `components/{brand,marketing,auth}/`. Page-specific React components under `app/` must live in the route-local `_components/` directory. Design tokens live only in `app/globals.css`.
- Pages: marketing in `app/(marketing)/`, auth in `app/(auth)/` (login, signup), and authenticated clinical/app pages in `app/(protected)/`. New protected pages must go in `app/(protected)/`; do not create another protected route group for app pages. Signup is wired to public Tenant Provisioning; login is wired to public sign-in and selects the active Tenant before entering the app. The app shell requires a valid Session and uses sign-out to end the current Session.
- Animations use GSAP via the data-attribute pattern in `components/marketing/marketing-animations.tsx`; always respect `prefers-reduced-motion`.
- Every `app/**/page.tsx` outside `app/api/` must have a sibling `loader.tsx` that imports and renders `Skeleton` from `@/components/ui/skeleton`. When a page or route-local `_components/` file changes, update that route's `loader.tsx` in the same change so the skeleton stays page-shaped.
- TanStack Query work must use the `tanstack-query-patterns` team skill. Claude Code should invoke `/tanstack-query-patterns`; other agents should read `.agents/skills/tanstack-query-patterns/SKILL.md` before adding or modifying API calls, query hooks, mutations, optimistic updates, query keys, `useQuery`, `useSuspenseQuery`, or `useMutation` code.

### Screen composition

Every non-trivial page is composed from small, single-responsibility files under its route directory. Do not let a page implementation grow into one giant client component. Follow this structure (see `app/(protected)/identity-access/roles/` as the reference implementation):

```
{route}/
├── page.tsx                    # server component; renders the container, no business logic
├── loader.tsx                  # Skeleton (see loader rule above)
├── _components/
│   ├── {feature}-page-impl.tsx # thin container: composes children, owns URL-derived open/close state
│   ├── {component}.tsx         # presentational / feature components (a component + its skeleton may share a file)
│   ├── _sheets/                # every Sheet (slide-over) shell lives here
│   │   └── {thing}-sheet.tsx
│   └── _modals/                # every Dialog / AlertDialog shell lives here
│       └── {thing}-dialog.tsx
└── _utils/                     # pure TypeScript only — no JSX, no React hooks
    ├── {feature}-form-schema.ts
    └── {helpers}.ts
```

- **`_sheets` / `_modals` hold the shell only.** A sheet or dialog is self-contained: it owns its form state and its own mutations. Reusable sub-parts it composes (e.g. a permission matrix) stay in `_components/` root, not nested inside the shell. The container passes only open-state, mode, and the target entity down.
- **`_utils` is pure.** Only framework-free functions and the form's Zod schema go here. Anything that renders or uses a hook is a component, not a util. Utilities shared across the whole app still belong in `lib/`, not a route `_utils/`.
- **Types are co-located**, not centralized in `_utils`. A type lives in the component that owns it; a type shared across sibling components is exported from its primary component file (e.g. `PermissionSection` from `permission-matrix.tsx`).
- **No speculative exports.** Don't `export` a component, hook, type, or helper until something actually imports it — keep it module-private (no `export` keyword) until a real consumer exists, and add the `export` in the same change that adds the first importer. An export with no importer is dead surface area. This applies to all React/TS code, not just screens; where a more specific skill once said to export ahead of need (e.g. query read hooks), this rule overrides it — export only the flavor a consumer uses.
- **Forms use `react-hook-form` + `zodResolver`** with a dedicated client-side Zod schema in `_utils` (separate from the API schema, which stays the server contract). `mode: 'onTouched'` to match the forgiving-forms rule in `DESIGN.md`; map server errors back with `setError`. See `docs/adr/0009-client-forms-use-react-hook-form.md`.
- **Required-field asterisks come from the API contract for that operation**, not from an ad-hoc decision. Read required-ness from the request DTO / Zod schema (e.g. `SaveRoleRequest`/`createRoleSchema` vs `UpdateRoleRequest`/`updateRoleSchema`) so a field that is optional or absent in the contract gets no asterisk. Render the asterisk as inline `FieldLabel` children — do **not** fork the themed `FieldLabel` in `components/ui/` — mark it `aria-hidden` and set `aria-required` on the input.
- **Sheet / dialog open-state lives in the URL via `nuqs`**, not `useState`, so the view is deep-linkable and survives refresh. Use one param to drive the whole surface (e.g. `?role=new` for create, `?role=42` for edit, absent for closed); the container derives mode from it and resolves the entity from already-loaded query data. `page.tsx` does not read `searchParams` for this. See `docs/adr/0010-sheet-and-dialog-state-in-url-via-nuqs.md`.

## Architecture: CQRS + Repository + Validation

Every API module follows this pattern — no exceptions:

```
app/
├── db/
│   └── schema/{entity}.ts              # Drizzle table definition
└── api/
    ├── v1/{module}/route.ts            # Next.js route handler (thin)
    ├── v1/{module}/types.ts            # Public API request/response contract types
    └── lib/
        └── modules/{module}/
            ├── schemas/{module}-schema.ts   # Zod schemas + inferred types
            ├── validator/                   # Validation functions (schema + repository-backed checks)
            ├── commands/                    # Write operations (one file per command)
            ├── queries/                     # Read operations (one file per query)
            └── repository/                  # All DB access (Drizzle queries)
```

**Route handlers are thin.** Parse HTTP input → call command/query → return NextResponse. No business logic in route files.

**API contract types live beside routes.** Every `app/api/v1/**/route.ts` must have a sibling `types.ts` that exports the public success request/response contract types for that route. `route.ts` must not define/export those contracts inline; import response types from `./types` with `import type` when typing `NextResponse.json<T>()`. `types.ts` must be type-only: no runtime code, no functions/constants, and no `next/server` imports. It may import schema-derived or domain types with `import type`, and may use `z.infer`/`z.input` when that is the clearest contract. Request types describe the raw JSON body clients may send. Success response types describe the server in-memory shape returned by handlers; 204 No Content routes use `void` response types. Error response contracts are not exported per route unless a task explicitly standardizes them.

**Commands validate first.** Every command calls its validator before performing writes. A command that skips validation is a bug.

**Validators own all operation validation.** Files under `app/api/lib/modules/*/validator/**/*.ts` are not limited to Zod parsing. Validators should wrap Zod schema parsing and may also call repository functions for DB-level checks such as existence checks before update/delete operations and uniqueness checks before create/update operations. Validators must still return `ValidationResult<T>` and must not write Drizzle queries directly.

**Queries never mutate.** Query functions are read-only. If you find yourself writing an INSERT inside a query, move it to a command.

**Repositories own all SQL.** Never write Drizzle queries outside a repository file. When validators need DB-level validation, add or reuse repository read functions and call those from the validator.

**Delete methods are named `delete{Entity}`, not `softDelete{Entity}`.** Soft delete is the default removal semantics for tenant-scoped domain and master-data tables, so the repository method is named `delete{Entity}` (e.g. `deleteRole`) even though it flips the `isDeleted` flag rather than removing the row. Do not introduce `softDelete`-prefixed names. True hard deletes that physically remove rows (`db.delete(...)`) are the named exception and exist only for transient auth/session/provisioning data (e.g. `deleteSession`, `deleteAuthUser`, `deleteTenantArtifacts`). See `docs/adr/0012-delete-repository-methods-are-soft-delete-by-default.md`.

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

There is no Platform Admin role in the domain. When Tenant Provisioning creates a Tenant, the signup user becomes the Tenant Owner. Tenant ownership is represented through BetterAuth organization membership.

Tenant creation happens only through public signup/Tenant Provisioning. Tenant management APIs are Tenant-scoped. Do not expose a global Tenant list endpoint or an authenticated create-Tenant endpoint. Tenant Owners may update Tenant display details and deactivate or reactivate their Tenant. Any authenticated Tenant member may read that Tenant's basic profile by ID.

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
9. Update the Swagger/OpenAPI documentation for every API surface you add or change. Keep the docs in sync with the route path, HTTP method, request body, query/path parameters, response schemas, status codes, auth requirements, and error responses. Every new or changed API operation must include realistic examples for successful requests and responses, plus relevant validation/conflict/not-found error examples.

## Swagger/OpenAPI documentation

The public API documentation lives at `/swagger`. Any agent building, changing, or removing APIs must update the Swagger/OpenAPI source before finishing the task. Treat Swagger updates as part of the API change, not as optional follow-up work.

When updating Swagger/OpenAPI docs:

- Use the canonical domain terms from `CONTEXT.md` exactly.
- Document all path parameters, query parameters, request bodies, response schemas, status codes, auth/session requirements, and common error shapes.
- Include proper examples for each operation. Examples should be realistic EMR data, show transformed fields where applicable (for example uppercased codes), and cover both success and important failure cases such as validation errors, conflicts, not found, unauthorized access, and invalid JSON.
- Keep tenant-scoped APIs explicit about how `tenantId` is resolved or supplied during the current migration period.
- If the implementation changes validation messages or response envelopes, update Swagger examples in the same change.

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

## Style Guide

### Code Formatting: Pyramid Structure

Type definitions, object literals, and object exports should be ordered by line length (shortest to longest) to create a visual pyramid structure. This improves readability by establishing a natural visual hierarchy.

**Examples:**

Object literals:
```ts
const columns = {
  id: table.id,              // 2-char key
  name: table.name,          // 4-char key
  code: table.code,          // 4-char key
  tenantId: table.tenantId,  // 8-char key
  createdOn: table.createdOn, // 9-char key
  description: table.description, // 11-char key
};
```

Object exports:
```ts
export const repo = {
  getAll,               // short
  create,               // short
  update,               // short
  delete,               // short
  findByName,           // medium
  findByCode,           // medium
  seedDefaults,         // longest
};
```

**When to apply:** All new code, all directories. Refactored API modules should follow this pattern. Only comment on violations if asked — this is a style preference, not a hard requirement.

## Domain reference

See `CONTEXT.md` for the canonical glossary of domain terms. Use those terms exactly — do not introduce synonyms.
