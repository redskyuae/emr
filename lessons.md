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

# Auth Module Boundary

## The Problem

Creating one-off modules such as `signin` or `signout` fragments the authentication lifecycle. Sign-in, sign-out, cookie forwarding, and active Tenant selection are tightly related auth concerns; splitting them into tiny modules makes the codebase harder to navigate and encourages future agents to create more shallow modules.

## The Solution

Keep authentication lifecycle operations inside `app/api/lib/modules/auth/`. Public routes may remain explicit, such as `/api/v1/signin` and `/api/v1/signout`, but their commands, validators, schemas, and repositories should live under the auth module.

Session administration is distinct: listing Sessions, revoking another Session, or revoking all Sessions may remain in the Session module because those operations manage existing Sessions rather than performing the sign-in/sign-out lifecycle.
