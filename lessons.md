---
title: Soft Deletes and Unique Constraints
date: 2026-06-05
description: How to correctly implement database-level unique constraints on tables that support soft deletes.
tags: [database, schema, lessons]
---

# Soft Deletes and Unique Constraints

## The Problem

When tables implement soft deletes (e.g., `isDeleted` or `is_deleted` flag) and rely solely on application-level checks to prevent duplicates (a check-then-write pattern), they are vulnerable to Time-Of-Check-Time-Of-Use (TOCTOU) race conditions. Concurrent requests can both pass the check and create duplicate active rows.

Adding a standard unique index solves the race condition, but it breaks soft deletes: if a record is soft-deleted, you can no longer create a new record with that same unique value.

## The Solution

Use a **Partial Unique Index** in PostgreSQL. This allows you to enforce uniqueness only among active rows, completely ignoring soft-deleted rows.

### Example in Drizzle ORM

When defining a table, add a partial unique index on the relevant columns, filtered by `isDeleted = false`.

```ts
import { eq, sql } from 'drizzle-orm';
import { pgTable, uniqueIndex, varchar } from 'drizzle-orm/pg-core';

export const exampleTable = pgTable(
  'example',
  {
    // ... columns including isDeleted
    name: varchar({ length: 100 }).notNull(),
    isDeleted: boolean('is_deleted').default(false).notNull(),
  },
  (table) => ({
    nameUniqueIdx: uniqueIndex('example_name_idx')
      .on(sql`lower(${table.name})`) // often you want case-insensitive uniqueness
      .where(sql`${table.isDeleted} = false`), // Do not use eq(table.isDeleted, false) in indexes!
  })
);
```

### Handling the Error

Wrap repository writes in a `try/catch` and catch the Postgres `23505` unique constraint violation error to return a clean 409 Conflict response.

### Permanent identifiers are the exception

Use a partial unique index only when a value may legitimately be reused after soft deletion. Permanent operational identifiers that must remain unambiguous across history—such as a system-generated Work Order code—need a full unique index that includes soft-deleted rows. Soft deletion must not make those identifiers available for reuse.

# Auth Module Boundary

## The Problem

Creating one-off modules such as `signin` or `signout` fragments the authentication lifecycle. Sign-in, sign-out, cookie forwarding, and active Tenant selection are tightly related auth concerns; splitting them into tiny modules makes the codebase harder to navigate and encourages future agents to create more shallow modules.

## The Solution

Keep authentication lifecycle operations inside `app/api/lib/modules/auth/`. Public routes may remain explicit, such as `/api/v1/signin` and `/api/v1/signout`, but their commands, validators, schemas, and repositories should live under the auth module.

Session administration is distinct: listing Sessions, revoking another Session, or revoking all Sessions may remain in the Session module because those operations manage existing Sessions rather than performing the sign-in/sign-out lifecycle.

# Backend Test Files Are Discovered by an Exact Suffix

## The Problem

Vitest only collects files matching `**/*.unit.tests.ts` and `**/*.integration.tests.ts` (see `vitest.config.ts`). The word `tests` is plural. A file named `*.unit.test.ts` (singular), `*.test.ts`, or `*.spec.ts` is **silently ignored**: it never runs, no error is reported, and CI stays green while the code it "covers" is actually untested. We have shipped both mis-named unit tests and hand-rolled `node:assert` `*.test.ts` files that executed nothing.

A second, related trap: a repository finder/soft-delete (`getXById`, `findActiveBy*`, soft-`delete`/`update`) that returns the entity at runtime but is inferred as non-optional will pass tests yet fail `bunx tsc --noEmit` the moment a test mocks it as `undefined` — runtime-green is not enough.

## The Solution

Name backend test files `*.unit.tests.ts` / `*.integration.tests.ts` exactly, and gate "done" on both `bun run test` **and** `bunx tsc --noEmit`. Annotate finders/soft-deletes that callers guard with `if (!row)` as `Promise<Entity | undefined>` so the production type matches reality. Full per-layer coverage, worked examples, and the shared mocking patterns live in [`docs/backend-testing.md`](docs/backend-testing.md).
