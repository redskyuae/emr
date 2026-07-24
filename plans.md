# Plan: Emirates ID and Identity Documents on Patient

> Standalone implementation plan. Written for an implementing agent that has **not** seen the
> planning conversation. Read `CLAUDE.md`, `AGENTS.md`, `CONTEXT.md`, `DESIGN.md`, `lessons.md`,
> and `docs/backend-testing.md` before starting. Follow every convention in those docs exactly —
> this plan describes _what_ to build and _in what order_; those docs remain the binding _how_.
>
> Supersedes the previous plan in this file (Patient Timeline tab), which is fully implemented and
> committed — the `patient-timeline` module, `GET /api/v1/patients/[id]/timeline`, and the Timeline
> tab on `/patients/[id]` all exist.

## 1. Goal

This platform targets the UAE, but Patient has no Emirates ID. It carries one generic government ID
instead: a `govtIdType` enum (`passport`, `national-id`, `driving-license`, `other`) paired with
`govtIdNumber` (`app/db/schema/patient.ts:54-55`).

One slot cannot hold what a UAE hospital actually records. An expat resident — the most common
patient in this market — holds an Emirates ID _and_ a foreign passport. Today, recording one
destroys the other. There is also no way to answer "which patients have no Emirates ID?", because
`govt_id_number IS NOT NULL` is equally true of a passport-only tourist.

Give Patient a dedicated **Emirates ID**, and move every other government document into an
**Identity Document** collection that accepts many documents per patient with the metadata that
makes them meaningful (issuing country, expiry date). Both API and UI.

Emirates ID is **optional** throughout — visitors and foreign nationals treated without UAE
residency will not have one.

### Decisions already made

Recorded in full — read both before starting:

- **`docs/adr/0042-emirates-id-is-a-dedicated-patient-attribute.md`**
- **`docs/adr/0043-identity-documents-are-nested-in-the-patient-payload.md`**

Glossary terms **Emirates ID** and **Identity Document** are defined in `CONTEXT.md`. Use them
exactly; do not reintroduce "government ID" as a domain term.

What those settle:

1. **`emiratesId` is its own nullable column on `patient`.** Not a value in an ID-type enum, not a
   row in the collection. It is a singleton by law, hard-unique per Tenant, and optional.
2. **Everything else becomes a `patient_identity_document` collection.** A Patient may hold many,
   including several of the same type — a dual national holds two valid passports.
3. **The collection has no uniqueness constraint.** The existing `patient_tenant_govt_id_idx` is
   dropped, not ported. Passport numbers are unique only within their issuing country, so the old
   index rejects legitimate patients.
4. **Documents are nested in the Patient contract**, replaced wholesale by `POST /patients` and
   `PUT /patients/[id]`. There is no sub-resource endpoint, deliberately — unlike allergies,
   medications, problems, vitals, and clinical notes.
5. **The replace is diffed by document `id`**, not delete-all-and-reinsert.
6. **Emirates ID is stored digit-normalised**, validated for shape only — never its check digit.
7. **Booking captures `emiratesId` only**, not documents.

### Out of scope (deliberate — do not add)

- **Check-digit validation.** The ICP has never published the algorithm; a false rejection turns
  away a patient holding a valid card. ADR 0042.
- **Cross-checking the Emirates ID year segment against `dateOfBirth`.** Real cards mismatch, and
  `date_of_birth` is nullable.
- **Identity document numbers in patient search.** Would put a join on every keystroke for a rare
  lookup.
- **Emirates ID as a patient list column.** The table already has seven; searchable, not displayed.
- **A sub-resource API for documents.** ADR 0043.
- **Insurance member IDs.** These belong to an Insurance Policy entity, not an Identity Document.
  Billing is cash-first today.

> **No production data exists on this branch.** The migration drops `govtIdType`/`govtIdNumber`
> with no backfill. This is deliberate and approved.

---

## 2. Data model

### 2.1 `patient` (modified) — `app/db/schema/patient.ts`

| Change   | Detail                                                                                                                                   |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **add**  | `emiratesId varchar(15)` nullable — digits only, no dashes                                                                               |
| **add**  | partial unique index `patient_tenant_emirates_id_idx` on `(tenantId, emiratesId)` `WHERE is_deleted = false AND emirates_id IS NOT NULL` |
| **drop** | `govtIdType`, `govtIdNumber`                                                                                                             |
| **drop** | index `patient_tenant_govt_id_idx`                                                                                                       |

The partial-on-`is_deleted` predicate follows `lessons.md`, so a soft-deleted Patient does not
permanently burn an Emirates ID. No `lower()` is needed — the stored value is digits only.

### 2.2 `patient_identity_document` (new) — `app/db/schema/patient-identity-document.ts`

| Column                                                 | Type                              | Notes                                            |
| ------------------------------------------------------ | --------------------------------- | ------------------------------------------------ |
| `id`                                                   | identity PK                       | from `masterColumns()`                           |
| `tenantId`                                             | `varchar(255)` not null           | every query filters on it                        |
| `patientId`                                            | `integer` not null → `patient.id` |                                                  |
| `documentType`                                         | `varchar(30)` not null            | check constraint on the five values              |
| `documentNumber`                                       | `varchar(50)` not null            |                                                  |
| `issuingCountryId`                                     | `integer` → `country.id`          | nullable                                         |
| `expiryDate`                                           | `date`                            | nullable                                         |
| `label`                                                | `varchar(100)`                    | nullable; free text, meaningful for `other` only |
| `isDeleted` / `createdOn` / `modifiedOn` / `deletedOn` |                                   | from `masterColumns()`                           |

Index `patient_identity_document_tenant_patient_idx` on `(tenantId, patientId)`.

**No unique index** — ADR 0042.

Export the table variable without a `Table` suffix and import it with an `as ...Table` alias, per
ADR 0015.

`documentType` values: `passport`, `national-id`, `residence-visa`, `driving-license`, `other`.

> **`emirates-id` is not a valid `documentType`.** One home only. If it were both a column and a
> legal row type, the two would drift and "does this patient have an Emirates ID?" would have two
> answers. Add a schema test asserting it is rejected.

### 2.3 Per-type field rules

Enforced by a **Zod discriminated union** on `documentType` — not by database constraints:

| Type              | `issuingCountryId`        | `expiryDate` | `label`  |
| ----------------- | ------------------------- | ------------ | -------- |
| `passport`        | required                  | required     | —        |
| `national-id`     | required                  | optional     | —        |
| `residence-visa`  | not accepted (always UAE) | required     | —        |
| `driving-license` | optional                  | optional     | —        |
| `other`           | optional                  | optional     | optional |

Each branch is `.strict()` and accepts an **optional `id`** — absent means a new row. Requests are
discriminated; the response type stays flat with nullable fields, matching the stored row.

`passport` requires an issuing country because passport numbers are only unique within their
issuing country — India and Brazil can both issue `J8369854`.

### 2.4 Emirates ID handling

- **Normalise on input** — strip every non-digit before validation and storage.
- **Validate** — `/^784\d{12}$/`: 15 digits, `784` prefix (the UAE's ISO 3166-1 numeric code).
- **Store** — `784199012345671`.
- **Display** — `784-1990-1234567-1` (3-4-7-1 grouping).

Normalisation is what makes the unique index meaningful: without it, `784-1990-1234567-1`,
`784 1990 1234567 1`, and `784199012345671` all insert cleanly as three different patients.

---

## 3. Backend

### 3.1 Zod schema — `app/api/lib/modules/patient/schemas/patient-schema.ts`

- Delete `PATIENT_GOVT_ID_TYPES` (line 6), `govtIdTypeSchema` (line 94), the `govtIdType` /
  `govtIdNumber` fields (lines 140-143), and their paired-presence `.refine` (lines 155-158).
- Add `PATIENT_IDENTITY_DOCUMENT_TYPES` and the discriminated union from §2.3.
- Add `emiratesIdSchema`: `z.preprocess` strip-non-digits → regex → optional, reusing the existing
  `optionalTrimmedValue` idiom so empty string becomes `undefined`.
- Add `identityDocuments` to `patientPayloadSchema` as an optional array defaulting to `[]`.
- Update the `Patient` type: drop the two `govtId` fields, add `emiratesId: string | null` and
  `identityDocuments: PatientIdentityDocument[]`.

### 3.2 Repository

**New — `repository/patient-identity-document-repository.ts`**

`listByPatientIds`, `insertMany`, `updateOne`, `deleteMany` (soft), and `findByIdsForPatient` (the
ownership read the validator needs). Every function filters on `tenantId`. All functions accept an
optional transaction executor, following the `SelectExecutor` pattern already used in
`appointment-repository.ts`.

Name the removal function `deleteIdentityDocuments`, not `softDelete...` — ADR 0012.

**Modified — `repository/patient-repository.ts`**

- Swap `govtIdType`/`govtIdNumber` for `emiratesId` in `patientColumns` (lines 60, 68),
  `PatientRow` (lines 21-30), `toPatient` (line 37), `createPatient`, and `updatePatient`.
- Replace `findActiveByGovtId` with `findActiveByEmiratesId`.
- Attach `identityDocuments` to read results. **`getPatients` must batch-load by patient ID** —
  one `listByPatientIds` call for the page, not one query per row.
- `createPatient` and `updatePatient` wrap the patient write and the document diff in **one
  transaction**, so a failed document write cannot leave a half-saved patient.

**Search** — at `patient-repository.ts:286-293`, alongside the five existing `ilike`s, add an
`emiratesId` branch matching the **digit-normalised** query.

> Guard it on the normalised string being non-empty. Receptionists type the dashed form off the
> card, so the query must be normalised too — but an unguarded strip turns a name search for
> `O'Brien` into `''`, which matches every patient in the Tenant.

### 3.3 Validator

- **Rename** `validator/patient-govt-id-validator.ts` → `patient-emirates-id-validator.ts`.
  Uniqueness check against `findActiveByEmiratesId`, honouring `excludeId` on update. Remap the
  `23505` constraint handler (line 59) from `patient_tenant_govt_id_idx` to
  `patient_tenant_emirates_id_idx`. Message: `Patient Emirates ID {value} already exists.`
- **New** `validator/validate-patient-identity-documents.ts` — schema parsing plus the ownership
  check.

> **Every submitted document `id` must belong to that Patient within that Tenant.** Without this,
> `PUT /patients/12` carrying a document id owned by a patient in another Tenant rewrites their
> data — a cross-tenant write through an identifier nobody validated. This is the security-critical
> check of the whole change. It must have a test asserting rejection across tenants **and** across
> patients within one tenant.

### 3.4 Commands

`commands/create-patient-command.ts` and `commands/update-patient-command.ts` — validate first (the
rule is unchanged), then inside one transaction write the patient and apply the diff:

- rows whose `id` matched an existing document → **update**
- rows arriving without an `id` → **insert**
- existing rows absent from the payload → **soft-delete**

Do not delete-all-and-reinsert. That tombstones an unchanged passport every time an unrelated field
is edited, and resets its `createdOn` to "today" forever. ADR 0043.

### 3.5 Appointment module

The provisional patient path breaks at compile time, because `provisionalPatientSchema` mirrors
`createPatientSchema.shape` field-by-field and is `.strict()`.

- `schemas/appointment-schema.ts:92-93` — swap the two `govtId` fields for
  `emiratesId: patientShape.emiratesId`. Delete the paired-presence `.refine` at lines 99-101.
  **Do not add `identityDocuments`** — nobody reads a passport expiry date down the phone.
- `validator/create-appointment-validator.ts:127-130` — swap the govt-ID uniqueness call for the
  Emirates ID one.
- `repository/appointment-repository.ts:478-479` — swap the two insert fields for `emiratesId`.
- `repository/appointment-repository.ts:384` `findPotentialPatientMatches` — add Emirates ID as a
  match criterion beside name and phone.

> The last point matters. An Emirates ID collision must surface through the **existing candidate
> path** at `create-appointment-validator.ts:152` — "this is Mohammed Ali, MRN 10042, book for him
> instead?" — not as a bare 409 from the unique index. That matches the Patient Reconciliation rule
> in `CONTEXT.md`: matching identifies candidates but never links or merges automatically. It also
> closes a real gap, since today "Mohammed Ali" booking from his wife's phone sails into a second
> chart.

### 3.6 Contracts and Swagger

- `app/api/v1/patients/types.ts` and `app/api/v1/patients/[id]/types.ts` (lines 27-28 in both) —
  drop the two `govtId` fields, add `emiratesId` and the `identityDocuments` array. Keep these
  files type-only, per CLAUDE.md.
- Route handlers stay thin; no logic change expected in `route.ts`.
- `app/api/lib/openapi/document.ts` — **15 `govtId` references** to replace. Needs the new request
  and response schemas, the per-type rules spelled out, and realistic UAE examples:
  - a successful registration with an Emirates ID and two passports (the dual-national case);
  - an Emirates ID conflict (409);
  - a per-type validation failure (a `passport` submitted without `expiryDate`);
  - a rejected `documentType` of `emirates-id`.

---

## 4. Frontend

Read `DESIGN.md` and use the `design-system` skill before touching UI.

### 4.1 Value sets — `app/(protected)/patients/_utils/patient-value-sets.ts`

Replace `PATIENT_GOVT_ID_TYPES` (line 13), `GOVT_ID_TYPE_LABELS` (line 36),
`PATIENT_GOVT_ID_TYPE_OPTIONS` (line 60), and `getPatientGovtIdTypeLabel` (line 81) with identity
document equivalents. Add `formatEmiratesId` (digits → dashed) and `normaliseEmiratesId`
(any → digits).

### 4.2 Form schema — `app/(protected)/patients/_utils/patient-form-schema.ts`

Drop the `govtId` fields (lines 74-75) and their `superRefine` block (lines 87-91). Add `emiratesId`
and an `identityDocuments` array whose rows carry an optional `id`. Mirror the per-type required
rules in `superRefine` so the client matches the API contract.

Drive the required-field asterisks from this schema, per CLAUDE.md — a field that is optional in the
contract gets no asterisk. Note this means the asterisk on a document's expiry date is
**conditional on its type**.

### 4.3 Form — `app/(protected)/patients/_components/patient-form.tsx`

Replace the two-field Government ID block (lines 564-611) with:

- an **Emirates ID** input that formats to the dashed form on blur;
- a repeatable **Identity Documents** section using `useFieldArray` — **the first in this
  codebase** — with add/remove, fields shown conditionally per selected type, and the row `id` held
  in a hidden field so the server-side diff works.

Per the CLAUDE.md screen-composition rules, the repeatable section is its own component in
`_components/`, not inlined into `patient-form.tsx`, which is already long.

The existing server-error remap at line 755 (which currently looks for a govt-ID conflict) must be
updated to the Emirates ID message and `setError` onto the `emiratesId` field.

### 4.4 Detail page — `app/(protected)/patients/[id]/_components/patient-detail-impl.tsx`

Replace the two `DetailField`s at lines 270-274 with:

- an **Emirates ID** `DetailField` showing the dashed form;
- a small **Identity Documents** table — Type / Number / Issuing country / Expiry — as its own
  component, since a repeating collection cannot be a `DetailField` pair.

**Flag expired documents** with a badge. An expired passport at check-in is something the desk must
see at a glance, and it is the entire reason expiry is stored.

### 4.5 Loaders

Reshape to match their changed pages, per the CLAUDE.md loader rule:

- `app/(protected)/patients/new/loader.tsx`
- `app/(protected)/patients/[id]/edit/loader.tsx`
- `app/(protected)/patients/[id]/loader.tsx`

---

## 5. Tests

Colocated, written in the **same change** as the code. Suffixes are **plural** —
`*.unit.tests.ts` / `*.integration.tests.ts`. Singular, `*.test.ts`, and `*.spec.ts` are silently
ignored by Vitest and never run. Follow `docs/backend-testing.md`.

- **Schema** — Emirates ID normalisation (dashed, spaced, and bare inputs all reach one value);
  rejection of wrong length and wrong prefix; each per-type document rule; `emirates-id` rejected
  as a `documentType`.
- **Validator** — Emirates ID uniqueness including `excludeId` on update; **document ownership
  rejection across tenants and across patients**; no repository calls when schema parsing fails;
  `status` propagation.
- **Command** — validator called first; no repository writes on validation failure; the diff
  applies update / insert / soft-delete correctly; `23505` on the Emirates ID index maps to a clean
  409 conflict.
- **Query** — `identityDocuments` present on both read models; list read does not N+1.
- **Repository (integration)** — tenant isolation on the new table; soft-delete filtering; the
  partial unique index, including that soft-deleting a patient frees their Emirates ID for reuse;
  several documents of the same type accepted for one patient; digit-normalised search matching a
  dashed query.

Five existing test files reference `govtId` and must be updated in the same change:
`patient-schema.unit.tests.ts`, `patient-validator.unit.tests.ts`, `patient-commands.unit.tests.ts`,
`patient-queries.unit.tests.ts`, `patient-repository.integration.tests.ts`.

Integration tests need `TEST_DATABASE_URL` exported and `bun run test:db:migrate` run first.

---

## 6. Task checklist

### Phase 1 — Database

- [ ] `app/db/schema/patient.ts`: add `emiratesId` + partial unique index; drop both `govtId`
      columns and `patient_tenant_govt_id_idx`
- [ ] Create `app/db/schema/patient-identity-document.ts`
- [ ] `bun run db:generate`, then `bun run db:migrate`

### Phase 2 — Backend patient module

- [ ] Zod schema: Emirates ID, discriminated document union, updated `Patient` type
- [ ] `patient-identity-document-repository.ts`
- [ ] `patient-repository.ts`: columns, transactional create/update, batch read, normalised search
- [ ] `patient-emirates-id-validator.ts` (replaces the govt-ID validator)
- [ ] `validate-patient-identity-documents.ts` — **tenant + patient ownership**
- [ ] Commands apply the ID-diffed replace
- [ ] Queries return `identityDocuments`
- [ ] All backend test files, including the five existing ones

### Phase 3 — Appointment module

- [ ] `provisionalPatientSchema`: `emiratesId`, no documents
- [ ] Validator and repository insert updated
- [ ] `findPotentialPatientMatches` matches on Emirates ID
- [ ] Appointment tests updated

### Phase 4 — Contracts and docs

- [ ] Both `types.ts` files
- [ ] Swagger: schemas, per-type rules, success + 409 + validation examples

### Phase 5 — Frontend

- [ ] Value sets: labels, `formatEmiratesId`, `normaliseEmiratesId`
- [ ] Form schema with per-type rules and conditional asterisks
- [ ] Emirates ID input + `useFieldArray` documents section
- [ ] Detail page: Emirates ID field + documents table with expiry badges
- [ ] Server-error remap updated to the Emirates ID message
- [ ] Three `loader.tsx` files reshaped

### Phase 6 — Verify

- [ ] `bunx tsc --noEmit`
- [ ] `bun run test`
- [ ] `bun run lint` and `bun run format`
