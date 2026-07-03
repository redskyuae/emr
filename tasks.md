# Unit Test Implementation Tasks

## Overview

This document tracks the implementation of unit tests for all backend API modules. Unit tests should use Vitest module mocks for collaborators and follow the project's testing policy outlined in `CLAUDE.md`.

## What We Want to Achieve

For each API module, we need to implement unit tests for:

1. **Schema** (`*.schema.unit.tests.ts`)
   - Required field validation
   - Trimming/transforms (e.g., `.trim()`)
   - Boundary limits (min/max)
   - Exact validation messages where specified

2. **Validator** (`*-validator.unit.tests.ts`)
   - Schema failure behavior
   - Repository-backed existence checks (before update/delete)
   - Repository-backed uniqueness checks (before create/update)
   - No repository calls when schema parsing fails
   - `ValidationResult<T>` shape
   - `status` propagation

3. **Commands** (`*-commands.unit.tests.ts`)
   - Validator is called first
   - Repository writes are not called on validation failure
   - Repository success maps to `CommandResult<T>` success
   - Database constraint failures (e.g., Postgres 23505) map to clean conflict errors

4. **Queries** (`*-queries.unit.tests.ts`)
   - Validate tenant/id/list params
   - Avoid repository calls on validation failure
   - Return `QueryResult<T>` shapes correctly

**Note:** Route handler unit tests are required only when HTTP adapter logic is non-trivial. We can defer route tests.

## Modules

| Module                       | Status  | Assigned To         | Notes                                                                                                                                                                                                                                                                              |
| ---------------------------- | ------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| appointment-mode             | ✅ DONE | -                   | Already has all unit tests                                                                                                                                                                                                                                                         |
| appointment-cancelled-reason | ✅ DONE | a-09-08-09_09-51-13 | Schema, validator, commands, queries tests implemented                                                                                                                                                                                                                             |
| appointment-reason           | ✅ DONE | subagent            | Schema, validator, commands, queries tests implemented. All pass. Fixed: files were misnamed `*.unit.test.ts` (singular) so Vitest never discovered them — renamed to `*.unit.tests.ts`. The earlier "cross-test contamination" was a symptom of that mis-discovery, now resolved. |
| appointment-status           | ✅ DONE | subagent            | Schema, validator, commands, queries tests implemented                                                                                                                                                                                                                             |
| appointment-type             | ✅ DONE | subagent            | Schema, validator, commands, queries tests implemented                                                                                                                                                                                                                             |
| asset                        | ✅ DONE | -                   | Schema, validator, commands, queries unit tests implemented; all pass and typecheck.                                                                                                                                                                                               |
| asset-category               | ✅ DONE | -                   | Schema, validator, commands, queries unit tests implemented; all pass and typecheck.                                                                                                                                                                                               |
| asset-condition              | ✅ DONE | -                   | Schema, validator, commands, queries unit tests implemented; all pass and typecheck.                                                                                                                                                                                               |
| asset-status                 | ✅ DONE | -                   | Schema, validator, commands, queries unit tests implemented; all pass and typecheck.                                                                                                                                                                                               |
| country                      | ✅ DONE | -                   | Schema, validator, commands, queries unit tests implemented; all pass and typecheck.                                                                                                                                                                                               |
| language                     | ✅ DONE | -                   | Schema, validator, commands, queries unit tests implemented; all pass and typecheck.                                                                                                                                                                                               |
| nationality                  | ✅ DONE | -                   | Schema, validator, commands, queries unit tests implemented; all pass and typecheck.                                                                                                                                                                                               |
| permission                   | ✅ DONE | -                   | Schema, validator, commands, queries unit tests implemented; all pass and typecheck.                                                                                                                                                                                               |
| religion                     | ✅ DONE | -                   | Schema, validator, commands, queries unit tests implemented; all pass and typecheck.                                                                                                                                                                                               |
| role                         | ✅ DONE | -                   | Schema, validator, commands, queries unit tests implemented; all pass and typecheck.                                                                                                                                                                                               |
| role-permission              | ✅ DONE | -                   | Schema, validator, commands, queries unit tests implemented; all pass and typecheck.                                                                                                                                                                                               |
| staff                        | ✅ DONE | -                   | Schema, validator, commands, queries unit tests implemented; all pass and typecheck.                                                                                                                                                                                               |
| state                        | ✅ DONE | -                   | Schema, validator, commands, queries unit tests implemented; all pass and typecheck.                                                                                                                                                                                               |
| tenant                       | ✅ DONE | -                   | Schema, validator, commands, queries unit tests implemented; all pass and typecheck.                                                                                                                                                                                               |
| user-role                    | ✅ DONE | -                   | Schema, validator, commands, queries unit tests implemented; all pass and typecheck.                                                                                                                                                                                               |
| work-order                   | ✅ DONE | -                   | Schema, validator, commands, queries unit tests implemented; all pass and typecheck.                                                                                                                                                                                               |
| work-order-priority          | ✅ DONE | -                   | Schema, validator, commands, queries unit tests implemented; all pass and typecheck.                                                                                                                                                                                               |
| work-order-status            | ✅ DONE | -                   | Schema, validator, commands, queries unit tests implemented; all pass and typecheck.                                                                                                                                                                                               |
| work-order-type              | ✅ DONE | -                   | Schema, validator, commands, queries unit tests implemented; all pass and typecheck.                                                                                                                                                                                               |

## Status Legend

- ✅ **DONE** - All unit tests implemented
- 🔄 **TODO** - Unit tests not yet implemented
- 🚧 **IN PROGRESS** - Currently being worked on
- ❌ **BLOCKED** - Blocked by dependencies

## Reference Module

Use `appointment-mode` as the reference implementation:

- `app/api/lib/modules/appointment-mode/schemas/appointment-mode-schema.unit.tests.ts`
- `app/api/lib/modules/appointment-mode/validator/appointment-mode-validator.unit.tests.ts`
- `app/api/lib/modules/appointment-mode/commands/appointment-mode-commands.unit.tests.ts`
- `app/api/lib/modules/appointment-mode/queries/appointment-mode-queries.unit.tests.ts`

## Notes for Subagents

1. **Read the reference module first** - The appointment-mode tests show the patterns to follow
2. **Use explicit imports from vitest** - `import { describe, it, expect, vi, beforeEach } from 'vitest'`
3. **Test names must be readable** - Start with `should ...`
4. **Use Vitest module mocks** - Don't refactor for dependency injection
5. **Each subagent works independently** - Update the status in this file when done

## Coordination

- Subagents should update the status in this file as they progress
- When a subagent completes their module, they should mark it ✅ DONE
- The main agent monitors this file for completion
- When all modules are ✅ DONE, the main agent reports completion
