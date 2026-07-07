# Patient Module — Frontend Tasks

## Overview

Build the frontend for **Patient Registration** and Patient management on top of the completed backend (`tasks_be.md`): a `/patients` area in the protected app with a searchable registry list, a dedicated registration page, a read-only detail page, and a dedicated edit page. All data access goes through TanStack Query hooks against the existing `/api/v1/patients` and Global Reference APIs. No backend changes in this document.

### Decisions locked (grilling session, 2026-07-07)

| Decision           | Outcome                                                                                                                                                                                                              |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Form surface       | Dedicated pages, not sheets: `/patients/new` and `/patients/[id]/edit` — **ADR 0021**. Sheets (ADR 0010) remain the pattern for config/master-data CRUD only                                                         |
| Detail view        | Read-only `/patients/[id]` page; list row click lands here; future clinical modules (Appointments, Visits) link here                                                                                                 |
| Form layout        | Single scrolling page of grouped section cards (Demographics / Contact / Address / Identifiers / Emergency Contact), one submit — no wizard                                                                          |
| Delete in UI       | Guarded: detail-page overflow menu only, behind an `AlertDialog` naming the patient and MRN; never on list rows                                                                                                      |
| Lifecycle actions  | Deactivate / Reactivate are the prominent lifecycle actions (header of detail page), each behind a confirm dialog                                                                                                    |
| Inactive semantics | **Inactive Patient** = record retained and readable, not eligible for new clinical activity (added to `CONTEXT.md`); inactive rows stay visible in the list with a status badge and an `isActive` filter — no hiding |
| Post-registration  | Redirect to `/patients/[id]` with a success toast surfacing the server-allocated MRN                                                                                                                                 |
| MRN in edit        | Displayed read-only on detail and edit surfaces; never an editable input (immutable per ADR 0019)                                                                                                                    |
| Permission gating  | None client-side — consistent with every existing page; enforcement stays server-side                                                                                                                                |

### References

- `CLAUDE.md` — screen composition rules, loader rule, no-speculative-exports, forms convention
- `DESIGN.md` + `design-system` team skill — mandatory before any UI work
- `tanstack-query-patterns` team skill — mandatory before writing any query/mutation hook
- `docs/adr/0009` — react-hook-form + zodResolver · `docs/adr/0010` — nuqs URL state · `docs/adr/0021` — clinical entity forms use dedicated pages
- `app/api/v1/patients/types.ts` — `SavePatientRequest` / `SavePatientResponse` / `ListPatientsResponse` contracts (required-field asterisks derive from `SavePatientRequest`)
- Closest analog screens: `identity-access/users` (list + toolbar + table + lifecycle dialogs), `identity-access/roles` (reference screen composition)
- Closest analog hooks: `app/queries/identity-access/useStaff.ts` (list filters, query keys, `keepPreviousData`)

---

## Route structure

```
app/(protected)/patients/
├── page.tsx                          # registry list (server component, thin)
├── loader.tsx                        # list skeleton
├── _components/
│   ├── patients-page-impl.tsx        # container: nuqs list state (search/filters/page)
│   ├── patients-table.tsx            # MRN, name, gender, DOB/age, phone, status badge
│   ├── patients-toolbar.tsx          # search + gender + isActive filters
│   └── patient-form.tsx              # shared sectioned form (create + edit modes)
├── _utils/
│   ├── patient-form-schema.ts        # client Zod schema (separate from API schema)
│   └── patient-value-sets.ts         # gender/bloodGroup/maritalStatus/govtIdType options + labels
├── new/
│   ├── page.tsx                      # Patient Registration
│   └── loader.tsx
└── [id]/
    ├── page.tsx                      # read-only detail
    ├── loader.tsx
    ├── _components/
    │   ├── patient-detail-impl.tsx   # sections + header actions
    │   └── _modals/
    │       ├── deactivate-patient-dialog.tsx   # also handles reactivate
    │       └── delete-patient-dialog.tsx
    └── edit/
        ├── page.tsx                  # edit form (reuses patient-form.tsx)
        └── loader.tsx
```

Query hooks live in `app/queries/patients/` and `app/queries/global-references/` following the existing per-hook-file convention. Export only the flavors a consumer actually imports (no speculative exports).

## Form behavior (applies to tasks 4–6)

- `react-hook-form` + `zodResolver`, `mode: 'onTouched'`; server errors mapped back with `setError` (ADR 0009).
- Required asterisks come from `SavePatientRequest`: only `firstName`, `lastName`, `gender`, `dateOfBirth`, `phone` are required — rendered as inline `FieldLabel` children, `aria-hidden`, with `aria-required` on the input.
- Country → State cascade: State select is disabled until a Country is chosen and fetches `/api/v1/states?countryId=`; changing Country clears the selected State.
- `govtIdType` / `govtIdNumber` pair: client schema enforces both-or-neither, mirroring the backend rule.
- `dateOfBirth` must not be in the future (client-side mirror of the backend rule).
- Coded fields (`gender`, `bloodGroup`, `maritalStatus`, `govtIdType`) render from the fixed value sets in `_utils/patient-value-sets.ts` (ADR 0020 values, human labels defined once).

---

## Tasks

Work top to bottom — each phase depends on the one above. Read the `design-system` and `tanstack-query-patterns` skills before their respective phases. `bunx tsc --noEmit`, `bun run lint`, and `bun run test` must stay green before a phase is marked DONE.

| #   | Task                                                                                                                                                                                                                                                                                                                                                                                                                                        | Status  | Notes |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ----- |
| 1   | **Patient query hooks** — `app/queries/patients/`: `usePatients` (paginated list: `search`, `gender`, `isActive`, page/pageSize; `keepPreviousData`; base/list/detail query keys per house pattern), `usePatient` (by id), `useRegisterPatient`, `useUpdatePatient`, `useDeletePatient`, `useDeactivatePatient`, `useReactivatePatient` — mutations invalidate the patients base key; types imported from `app/api/v1/patients/**/types.ts` | ✅ DONE |       |
| 2   | **Global Reference read hooks** — `app/queries/global-references/`: `useCountries`, `useStates` (accepts `countryId`, disabled until provided), `useNationalities`, `useLanguages`, `useReligions` — list flavors only, sized for select/combobox consumption                                                                                                                                                                               | ✅ DONE |       |
| 3   | **Form utils** — `_utils/patient-form-schema.ts` (client Zod schema: required set, DOB not-in-future, email format, govt-ID both-or-neither, `stateId` requires `countryId`) + `_utils/patient-value-sets.ts` (ADR 0020 value sets with display labels)                                                                                                                                                                                     | ✅ DONE |       |
| 4   | **Registry list `/patients`** — `page.tsx` + `loader.tsx` + `patients-page-impl` / `patients-toolbar` / `patients-table`; search + gender + isActive filters and page state in the URL via nuqs; columns MRN, full name, gender, date of birth (with age), phone, status badge; empty/loading/error states per DESIGN.md; row click → `/patients/[id]`; "Register patient" button → `/patients/new`                                         | ✅ DONE |       |
| 5   | **Registration `/patients/new`** — `page.tsx` + `loader.tsx`; shared `patient-form.tsx` in create mode: five section cards, single submit, form behavior above; on success redirect to `/patients/[id]` with toast showing the allocated MRN; on 409 map the govt-ID conflict to the field via `setError`                                                                                                                                   | ✅ DONE |       |
| 6   | **Detail `/patients/[id]`** — `page.tsx` + `loader.tsx` + `patient-detail-impl`; MRN prominent in header with status badge; sections mirror the form groups; header actions Edit → `/patients/[id]/edit`, Deactivate/Reactivate (confirm dialog), overflow-menu Delete (`AlertDialog` naming patient + MRN, redirects to `/patients` on success); not-found state for 404                                                                   | ✅ DONE |       |
| 7   | **Edit `/patients/[id]/edit`** — `page.tsx` + `loader.tsx`; `patient-form.tsx` in edit mode prefilled from `usePatient`; MRN shown read-only, never an input; submit → `useUpdatePatient` → redirect to detail with toast                                                                                                                                                                                                                   | ✅ DONE |       |
| 8   | **Shell wiring** — remove `badge: '404'` from the Patients nav item in `components/app/app-shell-config.ts`; add page meta entries for `/patients/new` and `/patients/[id]` surfaces as needed (list meta + primary action already exist)                                                                                                                                                                                                   | ✅ DONE |       |
| 9   | **Final gate** — `bun run lint` clean, `bunx tsc --noEmit` clean, `bun run test` green, `bun run build` succeeds; every new `page.tsx` has a page-shaped sibling `loader.tsx`; manual walkthrough: register → detail (MRN toast) → edit → deactivate → filter inactive → reactivate → guarded delete                                                                                                                                        | ✅ DONE | Full walkthrough done in a real browser against the dev DB (test patient created and cleaned up); lint/tsc/build clean; unit suite green (904 tests) — integration suite needs `TEST_DATABASE_URL` exported, unrelated to this change |

## Status legend

- ✅ **DONE** — implemented, checks green
- 🚧 **IN PROGRESS** — currently being worked on
- 🔄 **TODO** — not started
- ❌ **BLOCKED** — blocked by dependencies
