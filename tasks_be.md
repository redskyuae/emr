# Patient Module — Backend Tasks

## Overview

Build the backend for **Patient Registration** and Patient management: a tenant-scoped `patient` module following the standard CQRS + Repository + Validation architecture. Patients do **not** log in — no BetterAuth user is created; a Patient is a domain record only (see `CONTEXT.md` → Patient, Patient Registration, Medical Record Number, Emergency Contact).

Scope is **backend only**: schema, module layers, routes, permissions, Swagger, and tests. No frontend work in this document.

### Decisions locked (grilling session, 2026-07-07)

| Decision     | Outcome                                                                                                                                                      |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Operations   | Full CRUD + paginated search, plus deactivate/reactivate                                                                                                     |
| Identity     | Server-generated tenant-scoped MRN, `MRN-1001` style — **ADR 0019**                                                                                          |
| Scoping      | Tenant-scoped only; no `facilityId` (no Facility table exists; glossary says Patient belongs to a Tenant)                                                    |
| Field set    | "Standard" tier — FHIR/OpenMRS-aligned single-table registration form (below)                                                                                |
| Coded values | Fixed Zod value sets stored as varchar, not Masters and not pgEnums — **ADR 0020**                                                                           |
| Uniqueness   | MRN unique per tenant (full index); government ID unique per tenant when present (partial index)                                                             |
| Out of scope | Patient login/BetterAuth, Facility linkage, duplicate detection/merge, multiple addresses/identifiers, next-of-kin list, deceased tracking, photo, insurance |

### References

- `CLAUDE.md` — module architecture, result types, multi-tenancy rule, testing policy
- `docs/backend-testing.md` — mandatory per-layer test patterns
- `lessons.md` — partial unique indexes with soft deletes
- `docs/adr/0011` — counter-table allocation pattern being reused for MRN
- `docs/adr/0019` — Patient MRN decision · `docs/adr/0020` — fixed value sets decision
- Closest analog modules: `staff` (tenant-scoped person record), `work-order` (code counter + list/search)

---

## Data model

### Table: `patient` (`app/db/schema/patient.ts`)

Export as `export const patient = pgTable(...)`; consumers import as `patient as patientTable` (ADR 0015). Uses `masterColumns()` from `helpers.ts`.

| Column                                           | Type / constraint                                | Notes                                                 |
| ------------------------------------------------ | ------------------------------------------------ | ----------------------------------------------------- |
| `id`                                             | integer identity PK                              | from `masterColumns()`                                |
| `tenantId`                                       | text, not null, FK → `organization.id` (cascade) | from session, never from request body                 |
| `mrn`                                            | varchar(20), not null                            | server-generated, immutable (ADR 0019)                |
| `firstName`                                      | varchar(100), not null                           |                                                       |
| `middleName`                                     | varchar(100)                                     |                                                       |
| `lastName`                                       | varchar(100), not null                           |                                                       |
| `gender`                                         | varchar(20), not null                            | `male \| female \| other \| unknown`                  |
| `dateOfBirth`                                    | date, not null                                   | must not be in the future                             |
| `bloodGroup`                                     | varchar(5)                                       | `A+ A- B+ B- AB+ AB- O+ O-`                           |
| `maritalStatus`                                  | varchar(20)                                      | `single \| married \| divorced \| widowed \| other`   |
| `phone`                                          | varchar(20), not null                            | not unique — families share phones                    |
| `alternatePhone`                                 | varchar(20)                                      |                                                       |
| `email`                                          | varchar(255)                                     | format-validated when present                         |
| `addressLine1`                                   | varchar(255)                                     |                                                       |
| `addressLine2`                                   | varchar(255)                                     |                                                       |
| `city`                                           | varchar(100)                                     |                                                       |
| `stateId`                                        | integer, FK → `state.id`                         | must belong to `countryId` when both set              |
| `countryId`                                      | integer, FK → `country.id`                       |                                                       |
| `postalCode`                                     | varchar(20)                                      |                                                       |
| `nationalityId`                                  | integer, FK → `nationality.id`                   | Global Reference                                      |
| `languageId`                                     | integer, FK → `language.id`                      | preferred language, Global Reference                  |
| `religionId`                                     | integer, FK → `religion.id`                      | Global Reference                                      |
| `govtIdType`                                     | varchar(30)                                      | `passport \| national-id \| driving-license \| other` |
| `govtIdNumber`                                   | varchar(50)                                      | required together with `govtIdType`                   |
| `emergencyContactName`                           | varchar(150)                                     | inline single Emergency Contact                       |
| `emergencyContactRelationship`                   | varchar(50)                                      |                                                       |
| `emergencyContactPhone`                          | varchar(20)                                      |                                                       |
| `isActive`                                       | boolean, not null, default true                  | deactivate/reactivate lifecycle                       |
| `isDeleted`/`createdOn`/`modifiedOn`/`deletedOn` | from `masterColumns()`                           | soft delete per ADR 0012                              |

**Indexes**

- `patient_tenant_mrn_idx` — **full** unique on `(tenant_id, lower(mrn))`, _including_ soft-deleted rows (ADR 0019: MRNs are never reused).
- `patient_tenant_govt_id_idx` — partial unique on `(tenant_id, govt_id_type, lower(govt_id_number))` `WHERE is_deleted = false AND govt_id_number IS NOT NULL` (lessons.md pattern).

### Table: `patient_mrn_counter` (same schema file)

Mirror of `work_order_code_counter`: `tenantId` (text PK, FK → organization) + `lastValue` (integer, not null). Allocation is an atomic upsert-increment with `RETURNING` in the **same transaction** as the patient insert; first allocation is **1001**, rendered `MRN-1001` (zero-padded minimum four digits).

---

## Module: `app/api/lib/modules/patient/`

Standard layout: `schemas/`, `validator/`, `commands/`, `queries/`, `repository/`. All layers return the `CommandResult` / `QueryResult` / `ValidationResult` unions — never throw.

### Validation rules (validator layer)

- Zod parse first; **no repository calls when schema parsing fails**.
- Fixed value sets per ADR 0020 for `gender`, `bloodGroup`, `maritalStatus`, `govtIdType`.
- `govtIdType` and `govtIdNumber` must be provided together (both or neither).
- `stateId` requires `countryId`; validator checks the State exists **and belongs to** the given Country.
- Existence checks via repositories for every reference FK provided: nationality, language, religion, country, state.
- `dateOfBirth` must be a valid date not in the future.
- Uniqueness pre-check: duplicate `(govtIdType, govtIdNumber)` in tenant → conflict.
- Invalid-ID wording follows the house pattern: `Patient {id} is Invalid.`
- Duplicate wording includes the submitted value: `Patient government ID {govtIdNumber} already exists.`
- Update: `mrn` is not accepted in the update schema at all (immutable).
- Commands also map raw Postgres `23505` from the two unique indexes to the same clean conflict messages (race-safety), per the wrapped-23505 pattern in `docs/backend-testing.md`.

### Commands

`registerPatient` (allocates MRN in-transaction), `updatePatient`, `deletePatient` (soft delete per ADR 0012 naming), `deactivatePatient`, `reactivatePatient`.

### Queries

`getPatientById`, `getPatients` — paginated (`Paginated<T>` envelope), search across `firstName`/`middleName`/`lastName`/`mrn`/`phone`, filters `gender` and `isActive`, tenant-filtered always.

---

## API surface (`app/api/v1/patients/`)

Every `route.ts` has a sibling type-only `types.ts` for the public contracts. `tenantId` resolves from `session.session.activeOrganizationId` — never from the body.

| Route                              | Method | Behavior                                         |
| ---------------------------------- | ------ | ------------------------------------------------ |
| `/api/v1/patients`                 | GET    | Paginated list + search + filters                |
| `/api/v1/patients`                 | POST   | Register; server allocates MRN; returns 201      |
| `/api/v1/patients/[id]`            | GET    | Get by ID (404 when absent/deleted/other tenant) |
| `/api/v1/patients/[id]`            | PUT    | Update (MRN immutable)                           |
| `/api/v1/patients/[id]`            | DELETE | Soft delete, 204 (`void` response type)          |
| `/api/v1/patients/[id]/deactivate` | PATCH  | Sets `isActive = false`                          |
| `/api/v1/patients/[id]/reactivate` | PATCH  | Sets `isActive = true`                           |

## Permissions

New Permission Module `patients` in the system-wide catalogue, seeded exactly like the recent doctor/specialty permissions (catalogue seed + Tenant Onboarding path):

`patient:read`, `patient:create`, `patient:update`, `patient:delete`, `patient:deactivate`, `patient:reactivate`

---

## Tasks

Work top to bottom — each phase depends on the one above. **Every phase ships with its test files in the same change** (`docs/backend-testing.md`); the suite (`bun run test`) and `bunx tsc --noEmit` must be green before a phase is marked DONE. Integration tests need `TEST_DATABASE_URL` (docker `emr-test-pg` on :5433) and `bun run test:db:migrate` first.

| #   | Task                                                                                                                                                                                                                                                                                                                                                                                                                       | Status  | Notes                                                                                                                                                                                                                                                                                                                                                              |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | **Schema + migration** — `app/db/schema/patient.ts` (`patient` + `patient_mrn_counter`, indexes above), `bun run db:generate`, `bun run db:migrate`                                                                                                                                                                                                                                                                        | ✅ DONE | Migration `0030_salty_joshua_kane.sql`; applied to dev + test DBs                                                                                                                                                                                                                                                                                                  |
| 2   | **Zod schemas** — `schemas/patient-schema.ts` (create/update/list-params + inferred types) + `schemas/patient-schema.unit.tests.ts` (required fields, trims, value sets, boundaries, exact messages)                                                                                                                                                                                                                       | ✅ DONE | 17 tests passing, typecheck clean                                                                                                                                                                                                                                                                                                                                  |
| 3   | **Repository** — `repository/patient-repository.ts` (CRUD reads/writes, MRN allocation transaction, validator-support reads, list w/ search+filters+pagination) + `repository/patient-repository.integration.tests.ts` (tenant isolation, soft-delete filtering, MRN counter starts at 1001 and never reuses, full MRN index includes deleted rows, partial govt-ID index, case-insensitive uniqueness, search/pagination) | ✅ DONE | 14 tests passing, typecheck clean                                                                                                                                                                                                                                                                                                                                  |
| 4   | **Validator** — `validator/patient-validator.ts` (one function per operation) + `validator/patient-validator.unit.tests.ts` (schema-failure short-circuit, FK existence, state-in-country, govt-ID pairing + duplicate, no repo calls on parse failure, `ValidationResult` shape)                                                                                                                                          | ✅ DONE | Split into per-operation validator files (create/update/get-by-id/get-list/existence/reference/govt-id); combined test file, 33 tests passing                                                                                                                                                                                                                      |
| 5   | **Commands** — `commands/patient-commands.ts` (register/update/delete/deactivate/reactivate) + `commands/patient-commands.unit.tests.ts` (validator-first, no writes on validation failure, `CommandResult` mapping, 23505 → clean conflict)                                                                                                                                                                               | ✅ DONE | Split into per-operation command files; combined test file, 13 tests passing                                                                                                                                                                                                                                                                                       |
| 6   | **Queries** — `queries/patient-queries.ts` (getById, list) + `queries/patient-queries.unit.tests.ts` (param validation, no repo calls on failure, `QueryResult`/`Paginated` shapes)                                                                                                                                                                                                                                        | ✅ DONE | Split into get-by-id/get-list query files; combined test file, 6 tests passing                                                                                                                                                                                                                                                                                     |
| 7   | **Routes + contracts** — all seven routes with sibling `types.ts` files; route unit tests only where adapter logic is non-trivial (session/auth mapping, invalid JSON, status codes)                                                                                                                                                                                                                                       | ✅ DONE | Follows the `assets`/`users` route patterns exactly (thin handlers, `requireTenantSession`); deactivate/reactivate use PATCH to match codebase convention (not POST as originally drafted); no route unit tests needed (adapter logic is the same trivial shape as every other module)                                                                             |
| 8   | **Permissions** — add `patients` module permissions to catalogue seed + Tenant Onboarding; update/extend the existing seeding tests                                                                                                                                                                                                                                                                                        | ✅ DONE | Added `patient-management` Permission Module (6 actions) to `permission/seed-data.ts`; no other wiring needed — `onboard-tenant-command.ts` seeds idempotently from that data; existing permission/onboarding tests (37 unit + 25 integration) stay green                                                                                                          |
| 9   | **Swagger** — document all seven operations at `/swagger`: params, bodies, responses, status codes, auth, realistic EMR examples incl. validation/conflict/not-found errors                                                                                                                                                                                                                                                | ✅ DONE | Added `Patient` tag, `PatientGender`/`PatientIsActive` list filter parameters, `PatientReferenceSummary`/`PatientCountrySummary`/`CreatePatientRequest`/`UpdatePatientRequest`/`Patient` schemas, and all 7 paths with realistic examples (validation/conflict/not-found) mirroring the `asset` module's hand-written style; document loads and serializes cleanly |
| 10  | **Final gate** — `bun run test` green, `bunx tsc --noEmit` clean, `bun run lint` clean                                                                                                                                                                                                                                                                                                                                     | ✅ DONE | Full suite: 1344 tests passing (140 files); `tsc --noEmit` clean; `lint` clean (only pre-existing unrelated warnings)                                                                                                                                                                                                                                              |

## Status legend

- ✅ **DONE** — implemented, tests green
- 🚧 **IN PROGRESS** — currently being worked on
- 🔄 **TODO** — not started
- ❌ **BLOCKED** — blocked by dependencies
