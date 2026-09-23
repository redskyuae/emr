# Therapist Management and Procedure Assignment Execution Plan

**Date:** 2026-09-22  
**Status:** Decisions approved through `grill-with-docs`

## Goal

Introduce Staff-backed Therapists and a managed Therapist Skill catalogue, expose the six Therapist operations that mirror Doctors, add Therapist management below Doctors in the Operations sidebar, and replace the temporary Procedure-booking Therapist data with validated, persisted assignments.

## Architecture

- A Therapist is a Tenant-scoped clinical profile backed by a distinct Staff identity and `THERAPIST` system Role. Doctor and Therapist profiles are mutually exclusive.
- A Therapist may have zero or more Therapist Skills through a many-to-many assignment table.
- Therapist Skill is a Tenant-scoped Clinical Master. Treatment and Treatment Session requirements reference it by ID instead of free text.
- New Procedure Appointments require and persist a Therapist. Historical Procedure Appointments may retain `therapistId = null` until explicitly assigned.
- Therapist assignment is independent of the Procedure time window. This plan does not introduce Therapist schedules or overlap detection.
- Deactivation, skill removal, and skill deletion are guarded when future Scheduled or Confirmed Procedure Appointments depend on them.
- Therapist Reassignment is a dedicated Appointment operation, not Appointment Rescheduling.

## API Surface

| Capability                   | Endpoint                                                                            | Permission                       |
| ---------------------------- | ----------------------------------------------------------------------------------- | -------------------------------- |
| List Therapists              | `GET /api/v1/therapists`                                                            | `therapist:read`                 |
| Create Therapist             | `POST /api/v1/therapists`                                                           | `therapist:create`               |
| Get Therapist                | `GET /api/v1/therapists/{id}`                                                       | `therapist:read`                 |
| Update Therapist             | `PATCH /api/v1/therapists/{id}`                                                     | `therapist:update`               |
| Deactivate Therapist         | `POST /api/v1/therapists/{id}/deactivate`                                           | `therapist:deactivate`           |
| Reactivate Therapist         | `POST /api/v1/therapists/{id}/reactivate`                                           | `therapist:reactivate`           |
| Manage Therapist Skills      | `GET/POST /api/v1/therapist-skills`, `GET/PUT/DELETE /api/v1/therapist-skills/{id}` | `therapist-skill:*`              |
| Reassign Procedure Therapist | `POST /api/v1/appointments/{id}/reassign-therapist`                                 | `appointment:reassign-therapist` |

## Approved Contract Decisions

- Create Therapist requires `name`, `email`, and `password`.
- `therapistSkillIds` is optional and defaults to an empty list; a Therapist may be onboarded without skills.
- Optional profile fields are `phone`, `staffCode`, `designation`, `gender`, `dateOfBirth`, `qualifications`, and `registrationNumber`.
- Update does not change email or password. Passing `therapistSkillIds: []` explicitly clears all skills after dependency validation.
- A supplied registration number is case-insensitively unique among non-deleted Therapists in the Tenant.
- List filters are pagination, search, active/inactive status, and Therapist Skill.
- Therapists are Tenant-wide in this slice. Do not add a Therapist-only Facility field.
- New Procedure creation requires `therapistId`. If the effective Treatment Session requirement has a Therapist Skill, the Therapist must hold it.
- The effective required skill is the Session-level skill when present, otherwise the Treatment-level skill.
- Legacy Procedure Appointments with no Therapist remain readable and must be assigned before check-in.

## Global Constraints

- Follow `CLAUDE.md`, `CONTEXT.md`, `DESIGN.md`, and `docs/backend-testing.md`.
- Before frontend implementation, read `.agents/skills/design-system/SKILL.md`; before query/mutation work, read `.agents/skills/tanstack-query-patterns/SKILL.md`.
- Use TDD for every backend slice. Backend tests must use the exact plural suffixes `*.unit.tests.ts` and `*.integration.tests.ts`.
- Every Tenant-scoped query filters by `tenantId`; request payloads never supply the authoritative Tenant.
- Use partial unique indexes for soft-deletable names, codes, and registration numbers, and map PostgreSQL `23505` errors to 409 responses.
- Keep route handlers thin, public contract types in sibling `types.ts`, SQL in repositories, and validation in validators.
- Preserve the Doctor flow and Consultation Appointment behavior.
- Keep Room selection temporary and static; Room persistence and conflicts remain out of scope.
- Do not add Therapist availability, rota, slot, workload, or overlap logic in this plan.
- Every new or changed protected page has a page-shaped `loader.tsx`.
- Generate migrations with `bun run db:generate`; edit generated SQL only where deterministic data backfill is required.

---

## Task 1: Create the Therapist Skill data model and migrate Treatment requirements

**Files:**

- Create: `app/db/schema/therapist-skill.ts`
- Modify: `app/db/schema/treatment.ts`
- Modify: `app/api/lib/modules/treatment/schemas/treatment-schema.ts`
- Modify: `app/api/lib/modules/treatment/schemas/treatment-schema.unit.tests.ts`
- Modify: `app/api/lib/modules/treatment/repository/treatment-repository.ts`
- Modify: `app/api/lib/modules/treatment/repository/treatment-repository.integration.tests.ts`
- Generate: next `app/db/drizzle/0060_*.sql` and metadata files
- Create: colocated migration integration test following the `0056` migration-test pattern

- [ ] Write failing Treatment schema/repository tests for `therapistSkillId`, Session override, Treatment fallback, Tenant isolation, and nullable requirements.
- [ ] Add `therapist_skill` with Tenant ID, required name, optional uppercase code, optional description, soft-delete columns, and partial unique indexes on case-insensitive active name/code.
- [ ] Replace Treatment and Treatment Session `therapistSkill` strings with nullable `therapistSkillId` foreign keys and return a `{ id, name, code } | null` summary in API/domain shapes.
- [ ] Generate the migration, then add deterministic SQL that creates one skill per normalized `(tenantId, lower(name))`, maps both old columns to IDs, and only then drops the text columns.
- [ ] Verify mixed casing collapses safely, blank/null values stay null, and rerunning the data migration is idempotent in its integration test.
- [ ] Keep Session-level skill override semantics; consumers use `session.therapistSkill ?? treatment.therapistSkill`.
- [ ] Run Treatment schema and repository tests, migration tests, and `bunx tsc --noEmit`.

## Task 2: Build the Therapist Skill CQRS module and APIs

**Files:**

- Create: `app/api/lib/modules/therapist-skill/schemas/therapist-skill-schema.ts`
- Create: `app/api/lib/modules/therapist-skill/schemas/therapist-skill-schema.unit.tests.ts`
- Create: `app/api/lib/modules/therapist-skill/validator/*.ts`
- Create: `app/api/lib/modules/therapist-skill/validator/therapist-skill-validator.unit.tests.ts`
- Create: `app/api/lib/modules/therapist-skill/commands/*.ts`
- Create: `app/api/lib/modules/therapist-skill/commands/therapist-skill-commands.unit.tests.ts`
- Create: `app/api/lib/modules/therapist-skill/queries/*.ts`
- Create: `app/api/lib/modules/therapist-skill/queries/therapist-skill-queries.unit.tests.ts`
- Create: `app/api/lib/modules/therapist-skill/repository/therapist-skill-repository.ts`
- Create: `app/api/lib/modules/therapist-skill/repository/therapist-skill-repository.integration.tests.ts`
- Create: `app/api/v1/therapist-skills/route.ts`, `types.ts`, and `route.unit.tests.ts`
- Create: `app/api/v1/therapist-skills/[id]/route.ts` and `types.ts`

- [ ] Define strict create/update/list/id schemas matching the Specialty master shape: required name, optional code and description.
- [ ] Implement Tenant-scoped repository CRUD, pagination/search, get-by-ID, case-insensitive uniqueness checks, and dependency counts.
- [ ] Make delete a soft delete and reject it with 409 when an active Treatment or Treatment Session references the skill; Task 4 extends this guard once Therapist assignments exist.
- [ ] Map database uniqueness races to exact conflict errors.
- [ ] Implement thin `GET/POST` collection and `GET/PUT/DELETE` item routes with sibling public types.
- [ ] Cover every required backend layer and route adapter branch.

## Task 3: Seed permissions and the THERAPIST system Role

**Files:**

- Modify: `app/api/lib/modules/permission/seed-data.ts`
- Modify: `app/api/lib/modules/permission/repository/permission-repository.integration.tests.ts`
- Modify: `app/api/lib/modules/role/repository/role-repository.ts`
- Modify: `app/api/lib/modules/role/repository/role-repository.integration.tests.ts`
- Modify: `app/api/lib/modules/role-permission/repository/role-permission-repository.ts`
- Modify: `app/api/lib/modules/role-permission/repository/role-permission-repository.integration.tests.ts`
- Generate/create: idempotent permission and existing-Tenant role backfill migration plus integration test

- [ ] Add `therapist:read/create/update/deactivate/reactivate` under `identity-access`.
- [ ] Add `therapist-skill:read/create/update/delete` under `clinical-masters`.
- [ ] Add `appointment:reassign-therapist` under `appointments`.
- [ ] Add the `THERAPIST` system Role definition.
- [ ] Give `THERAPIST` only `appointment:read`, `patient:read`, `treatment:read`, `therapist:read`, and `therapist-skill:read` by default.
- [ ] Backfill the Role and new permissions idempotently for existing Tenants; grant all new permissions to active Tenant Admin system Roles, not to custom Roles.
- [ ] Assert repeated seeding/migration creates no duplicates and new Tenant provisioning receives the same result.

## Task 4: Add Therapist profile and skill-assignment persistence

**Files:**

- Create: `app/db/schema/therapist.ts`
- Create: `app/db/schema/therapist-skill-assignment.ts`
- Modify: `app/db/schema/appointment.ts`
- Create: `app/api/lib/modules/therapist/schemas/therapist-schema.ts`
- Create: `app/api/lib/modules/therapist/schemas/therapist-schema.unit.tests.ts`
- Create: `app/api/lib/modules/therapist/repository/therapist-repository.ts`
- Create: `app/api/lib/modules/therapist/repository/therapist-repository.integration.tests.ts`
- Modify: `app/api/lib/modules/therapist-skill/repository/therapist-skill-repository.ts`
- Modify: `app/api/lib/modules/therapist-skill/repository/therapist-skill-repository.integration.tests.ts`
- Modify: `app/api/lib/modules/staff/repository/staff-repository.ts`
- Modify: `app/api/lib/modules/staff/repository/staff-repository.integration.tests.ts`
- Generate: next Drizzle migration and metadata files

- [ ] Define `therapist` with Tenant ID, Staff `userId`, qualifications, optional registration number, active lifecycle, and soft-delete columns.
- [ ] Add partial unique indexes for one non-deleted Therapist profile per user and one case-insensitive non-null registration number per Tenant.
- [ ] Define `therapist_skill_assignment` as a Tenant-scoped association with a unique `(therapistId, therapistSkillId)` pair.
- [ ] Add nullable `appointment.therapistId` referencing Therapist in the same migration. Existing Procedure Appointments remain null; no sentinel data is generated.
- [ ] Define create/update/list contracts. Skills default to `[]`; update treats omitted skills as unchanged and an explicit empty array as clear-all.
- [ ] Implement joined Therapist reads that return Staff fields plus a stable `skills` array.
- [ ] Implement atomic Staff membership/profile, `THERAPIST` Role assignment, Therapist profile, and skill assignments after BetterAuth user creation; preserve best-effort cleanup if the transaction fails.
- [ ] Extend Therapist Skill deletion checks to reject active Therapist assignments in addition to Treatment requirements.
- [ ] Ensure Staff generic reads recognize the Therapist profile without conflating it with Doctor, and prevent any shared Doctor/Therapist Staff identity.
- [ ] Cover Tenant isolation, registration uniqueness races, empty/multiple skill assignments, and cross-Tenant skill rejection.

## Task 5: Implement all six Therapist APIs with lifecycle guards

**Files:**

- Create: `app/api/lib/modules/therapist/validator/*.ts`
- Create: `app/api/lib/modules/therapist/validator/therapist-validator.unit.tests.ts`
- Create: `app/api/lib/modules/therapist/commands/*.ts`
- Create: `app/api/lib/modules/therapist/commands/therapist-commands.unit.tests.ts`
- Create: `app/api/lib/modules/therapist/queries/*.ts`
- Create: `app/api/lib/modules/therapist/queries/therapist-queries.unit.tests.ts`
- Create: `app/api/v1/therapists/route.ts`, `types.ts`, and `route.unit.tests.ts`
- Create: `app/api/v1/therapists/[id]/route.ts` and `types.ts`
- Create: `app/api/v1/therapists/[id]/deactivate/route.ts` and `types.ts`
- Create: `app/api/v1/therapists/[id]/reactivate/route.ts` and `types.ts`

- [ ] Validate payload before repository calls and validate every skill ID belongs to the active Tenant.
- [ ] Reject duplicate Staff email, Doctor/Therapist identity overlap, duplicate registration number, and missing `THERAPIST` system Role with controlled statuses.
- [ ] Implement list/search/status/skill filters and pagination matching Doctors.
- [ ] Make deactivation update Therapist, Staff profile, BetterAuth ban state, and Sessions atomically.
- [ ] Before deactivation, reject when future Scheduled or Confirmed Procedure Appointments reference the Therapist.
- [ ] Before replacing skills, calculate removed skill IDs and reject any removal needed by such a future Appointment.
- [ ] Reactivation restores Therapist, Staff, and login lifecycle but does not restore removed skills.
- [ ] Protect reads with Tenant session and mutations with Tenant Admin session, matching Doctor route behavior.

## Task 6: Build Therapist Skill management UI

**Files:**

- Create: `app/queries/therapist-skills/useTherapistSkills.ts`
- Create: `app/queries/therapist-skills/useTherapistSkill.ts`
- Create: `app/queries/therapist-skills/useCreateTherapistSkill.ts`
- Create: `app/queries/therapist-skills/useUpdateTherapistSkill.ts`
- Create: `app/queries/therapist-skills/useDeleteTherapistSkill.ts`
- Create: `app/(protected)/clinical-masters/therapist-skills/page.tsx`
- Create: `app/(protected)/clinical-masters/therapist-skills/loader.tsx`
- Create: route-local `_components/`, `_components/_sheets/`, `_components/_modals/`, and `_utils/` files
- Modify: `components/app/app-shell-config.ts`
- Modify: `components/app/app-shell-config.unit.tests.ts`

- [ ] Implement canonical API-shaped query caches and mutation-owned invalidation.
- [ ] Add **Configuration → Clinical Masters → Therapist Skills**, gated by `therapist-skill:read`.
- [ ] Build searchable/paginated management views using the established Clinical Master page pattern.
- [ ] Use URL state for create/edit surfaces and permission-gate create, update, and delete actions.
- [ ] Surface dependency-conflict errors without closing the form/dialog.
- [ ] Keep the loader page-shaped and cover navigation filtering plus pure form/request transformations.

## Task 7: Build Therapist query hooks and Operations management UI

**Files:**

- Create: `app/queries/therapists/useTherapists.ts`
- Create: `app/queries/therapists/useTherapist.ts`
- Create: `app/queries/therapists/useCreateTherapist.ts`
- Create: `app/queries/therapists/useUpdateTherapist.ts`
- Create: `app/queries/therapists/useDeactivateTherapist.ts`
- Create: `app/queries/therapists/useReactivateTherapist.ts`
- Create: `app/(protected)/therapists/page.tsx`
- Create: `app/(protected)/therapists/loader.tsx`
- Create: `app/(protected)/therapists/_components/therapists-page-impl.tsx`
- Create: `app/(protected)/therapists/_components/therapist-views.tsx`
- Create: `app/(protected)/therapists/_components/therapist-skeletons.tsx`
- Create: `app/(protected)/therapists/_components/_sheets/therapist-form-sheet.tsx`
- Create: `app/(protected)/therapists/_components/_modals/therapist-status-dialog.tsx`
- Create: `app/(protected)/therapists/_utils/therapist-form-schema.ts`
- Create: `app/(protected)/therapists/_utils/therapist-form-values.ts`
- Create: focused `*.unit.tests.ts` files for pure form/request helpers
- Modify: `components/app/app-shell-config.ts`
- Modify: `components/app/app-shell-config.unit.tests.ts`

- [ ] Put **Therapists** immediately below **Doctors** under **Operations**, gated by `therapist:read`.
- [ ] Match the Doctor page’s table/card/list, search, status filter, skill filter, pagination, URL-driven add/edit sheet, and status confirmation dialog.
- [ ] Render Skills as compact accessible badges and use `N/A` for optional profile fields.
- [ ] Make Therapist Skills optional in the form; show an empty state instead of blocking creation when none exist.
- [ ] Keep email/password create-only and derive required asterisks from the API contract.
- [ ] Map API field errors back into React Hook Form; keep server dependency conflicts visible at form/dialog level.
- [ ] Add app-shell page metadata and an **Add Therapist** primary action gated by `therapist:create`.

## Task 8: Persist Therapist on Procedure Appointments

**Files:**

- Modify: `app/db/schema/appointment.ts`
- Modify: `app/api/lib/modules/appointment/schemas/appointment-schema.ts`
- Modify: `app/api/lib/modules/appointment/schemas/appointment-schema.unit.tests.ts`
- Modify: `app/api/lib/modules/appointment/validator/create-appointment-validator.ts`
- Modify: `app/api/lib/modules/appointment/validator/create-appointment-validator.unit.tests.ts`
- Modify: `app/api/lib/modules/appointment/repository/appointment-repository.ts`
- Modify: `app/api/lib/modules/appointment/repository/appointment-repository.integration.tests.ts`
- Modify: `app/api/lib/modules/appointment/commands/create-appointment-command.unit.tests.ts`
- Modify: `app/api/v1/appointments/types.ts`
- Modify: `app/api/v1/appointments/route.unit.tests.ts`

- [ ] Use the nullable `appointment.therapistId` introduced in Task 4. Keep it nullable for legacy history, but make `therapistId` required in the new Procedure create request and absent from Consultation requests.
- [ ] Add nullable Therapist summary to Appointment list/detail response types so legacy rows remain readable.
- [ ] Validate Therapist existence, active status, Tenant ownership, and effective required skill before patient write/slot work.
- [ ] Persist Therapist on Procedure only; Consultation stores null and retains all existing DoctorSlot behavior.
- [ ] Cover new Procedure success, inactive/wrong-Tenant/unqualified Therapist conflicts, no-skill requirement, and historical null reads.

## Task 9: Replace demo Therapists in Procedure booking

**Files:**

- Modify: `app/(protected)/appointments/new/_components/book-appointment-demo-data.ts`
- Modify: `app/(protected)/appointments/new/_components/book-appointment-demo-data.unit.tests.ts`
- Modify: `app/(protected)/appointments/new/_components/resource-allocation-section.tsx`
- Modify: `app/(protected)/appointments/new/_components/booking-summary.tsx`
- Modify: `app/(protected)/appointments/new/_components/use-book-appointment.ts`
- Modify: `app/(protected)/appointments/new/_utils/book-appointment-form-schema.ts`
- Modify: relevant request/form `*.unit.tests.ts`
- Modify: `app/(protected)/appointments/new/loader.tsx`

- [ ] Remove `DEMO_THERAPISTS`; keep temporary demo Rooms untouched.
- [ ] Query active Therapists using the effective Treatment/Session skill filter; when no skill is required, show all active Therapists.
- [ ] Reset an invalid selected Therapist when Treatment or Session changes.
- [ ] Require Therapist only for Procedure, include numeric `therapistId` in the request, and never send it for Consultation.
- [ ] Render qualification, registration number, and active status from real API data; do not show stored workload because it does not exist.
- [ ] Preserve accessible unavailable/empty/loading/error states and update the route loader.

## Task 10: Implement Therapist Reassignment

**Files:**

- Modify: `app/api/lib/modules/appointment/schemas/appointment-schema.ts`
- Modify: `app/api/lib/modules/appointment/schemas/appointment-schema.unit.tests.ts`
- Create: `app/api/lib/modules/appointment/validator/reassign-appointment-therapist-validator.ts`
- Modify: `app/api/lib/modules/appointment/validator/appointment-validator.unit.tests.ts` or the module’s combined validator test file
- Create: `app/api/lib/modules/appointment/commands/reassign-appointment-therapist-command.ts`
- Modify: `app/api/lib/modules/appointment/commands/appointment-commands.unit.tests.ts`
- Modify: `app/api/lib/modules/appointment/repository/appointment-repository.ts`
- Modify: `app/api/lib/modules/appointment/repository/appointment-repository.integration.tests.ts`
- Create: `app/api/v1/appointments/[id]/reassign-therapist/route.ts`, `types.ts`, and `route.unit.tests.ts`

- [ ] Define `{ therapistId: positive integer }` as a strict request.
- [ ] Allow only Procedure Appointments in Scheduled or Confirmed state and require an actual assignment change.
- [ ] Validate replacement Therapist Tenant, active lifecycle, and effective required skill.
- [ ] Update only `therapistId` and modification metadata; preserve Booking Number, status, Patient, Treatment, Session, Doctor, date, and times.
- [ ] Authorize with `appointment:reassign-therapist` and return the normal Appointment response.
- [ ] Cover wrong Booking Path/state, same Therapist, inactive/wrong-Tenant/unqualified Therapist, and successful atomic reassignment.

## Task 11: Add reassignment UI and legacy check-in protection

**Files:**

- Create: `app/queries/appointments/useReassignAppointmentTherapist.ts`
- Modify: `app/(protected)/appointments/[id]/_components/*` for the Appointment detail action and dialog/sheet
- Modify: corresponding Appointment detail loader and pure UI tests
- Modify: Visit/check-in validator and its `*.unit.tests.ts`
- Modify: Appointment/Visit repository integration tests where check-in reads the Appointment

- [ ] Show **Reassign Therapist** only for Scheduled/Confirmed Procedure Appointments and authorized users.
- [ ] Load active qualified replacements, exclude the current Therapist, and keep the original assignment on mutation failure.
- [ ] Invalidate Appointment list/detail and Therapist list caches in the mutation hook.
- [ ] For legacy future Procedures with null Therapist, label the action **Assign Therapist** but use the same endpoint and validation.
- [ ] Reject Visit check-in for a Procedure with no Therapist using a controlled conflict; keep the existing Doctor-required check.
- [ ] Preserve the Appointment’s existing schedule and make the UI language explicitly distinguish reassignment from rescheduling.

## Task 12: Update OpenAPI, documentation, and run full verification

**Files:**

- Modify: `app/api/lib/openapi/document.ts`
- Modify: OpenAPI unit tests/snapshots used by this repository
- Review/update: `CONTEXT.md`
- Review/update: `docs/adr/0045-procedure-appointments-use-direct-time-windows.md`
- Update: this plan’s checkboxes during implementation

- [ ] Document all Therapist, Therapist Skill, and Therapist Reassignment schemas, filters, success responses, validation failures, conflicts, permissions, and legacy-null response behavior.
- [ ] Verify the glossary contains only domain language and the ADR accurately reflects persistent Therapist assignment, guards, legacy migration, and deferred conflict detection.
- [ ] Run focused unit tests after each task.
- [ ] Run `bun run test:db:migrate` and `bun run test:integration` when `TEST_DATABASE_URL` is available.
- [ ] Run `bun run test`, `bunx tsc --noEmit`, `bun run lint`, and `bun run build`.
- [ ] Perform an authenticated browser walkthrough: manage skills, create/edit/deactivate/reactivate a Therapist, book a Procedure with a qualified Therapist, verify unqualified filtering, reassign the Therapist, and confirm deactivation/removal guards.
- [ ] Confirm Doctor management, Consultation booking, Procedure direct-time scheduling, and static Room selection are unchanged.

## Definition of Done

- All six Therapist endpoints are Tenant-isolated, permission-protected, documented, and tested.
- Therapist appears directly below Doctors in Operations and its screen follows the project design system.
- Therapist Skills are managed under Clinical Masters and replace free-text Treatment requirements.
- New Procedure Appointments persist a valid active Therapist; legacy null assignments remain readable and cannot check in until assigned.
- Reassignment works without changing the Appointment schedule or Booking Number.
- Deactivation, Therapist Skill removal, and Therapist Skill deletion guards behave as agreed.
- New Tenant provisioning and existing-Tenant migrations both create the correct permissions and `THERAPIST` Role defaults.
- Full tests, typecheck, lint, and production build pass.
