# Clinician Visit Cockpit

## Purpose

Create a static, end-to-end demonstration of the outpatient Visit workflow observed in the legacy assessment screen. A Doctor starts from a list of two Visits, opens either Visit, and sees the entire clinical workflow in one desktop cockpit without tabs, accordions, or page scrolling.

The implementation is deliberately frontend-only. It does not call an API or modify database records.

## Routes and navigation

### Visit list

`/visits` presents two de-identified static Visits in the existing application shell. Each row shows:

- Patient name and Medical Record Number
- Visit Number and queue token
- Doctor and VisitType
- Visit date and arrival time
- Visit Status
- An `Open consultation` action

The first Visit is `In Consultation` and editable. The second Visit is `Completed` and read-only. Selecting a row action navigates to `/visits/[id]/assessment`.

### Assessment cockpit

`/visits/[id]/assessment` resolves the matching Visit from the route-local static dataset. Unknown identifiers render the existing not-found experience. The cockpit preserves the global application shell and keeps the active Tenant and Facility visible.

## Desktop constraint

The cockpit targets a viewport of 1440 by 900 pixels or larger. At the target size:

- The document and cockpit must not show vertical or horizontal scrollbars.
- The full workflow remains visible at once.
- The application header, safety strip, three workflow columns, and bottom command bar all fit within the viewport.

Smaller viewports show a clear `Desktop workspace required` message instead of compressing patient-safety information or introducing scrolling.

## Information hierarchy

### Safety strip

A compact strip at the top of the cockpit always shows:

- Facility
- Patient name, age, sex, and Medical Record Number
- Visit Number, VisitType, queue token, and Visit Status
- Allergy warning
- Encounter time and Doctor

This information is never hover-only or truncated-only.

### Column 1: Assess

The first column covers intake and history:

- Vital Signs: temperature, blood pressure, pulse, respiratory rate, oxygen saturation, oxygen support, height, and weight
- Chief complaint and History of Present Illness: location, severity, timing, modifying factor, context, duration, symptom, and quality
- Allergies and Problems
- Smoking, physical activity, family, and social history summaries

The static data is pre-populated and editable only for the active Visit.

### Column 2: Examine

The second column covers Review of Systems and Physical Examination:

- Review of Systems for constitutional, eyes, ENT, cardiovascular, respiratory, gastrointestinal, genitourinary, musculoskeletal, skin, neurologic, psychiatric, endocrine, hematologic/lymphatic, and allergic/immunologic systems
- Physical Examination for the same relevant systems plus neck and chest
- `Mark all normal` controls for Review of Systems and Physical Examination
- Abnormal findings remain conspicuous and include visible remarks
- Prakriti Pariksha, Vikriti Pariksha, and Ashtavidha Pariksha summaries

The interface uses compact status controls rather than hidden tabs or accordions.

### Column 3: Plan

The third column covers decision-making and completion:

- Clinical impression
- Diagnosis with primary diagnosis, code, description, type, reason for Visit, onset year, and narrative
- Advised treatment
- Treatment plan with service, sessions, summary, and status
- OP procedure with CPT code, quantity, and notes
- Prescription with medicine, unit, route, dose, frequency, duration, refill, quantity, dates, and instructions
- Medical Decision Making selections for problem complexity, data reviewed, and level of risk
- Addendum
- Patient/family education checklist
- OP medical report, encounter end, and Discharge Disposition

Compact row editors support adding and removing local diagnosis, treatment, procedure, and prescription entries for the active Visit.

## Command bar and Visit lifecycle

A fixed command bar spans the bottom of the cockpit:

- Workflow completion indicator
- Last locally saved timestamp
- `Save draft`
- `Print summary`
- `Complete Visit`

`Save draft` updates only local React state and the displayed timestamp. `Print summary` invokes browser printing. `Complete Visit` uses a confirmation dialog, requires a primary diagnosis and Discharge Disposition, and changes the local Visit Status to `Completed`. A completed Visit is read-only and its mutating controls are disabled.

## Static data

All sample data lives in a pure route-local TypeScript module. It contains exactly two clearly fictional Patients and their Visit-specific clinical records. Longitudinal Allergies, Problems, and Medications are represented as Patient context but are copied into the local demo model to keep this prototype API-free.

The data module exposes a list function and identifier lookup so the Visit list and assessment route use one source of truth.

## Component structure

The existing protected Visit routes remain server-component entry points. Route-local components own presentation and local interactions:

```text
app/(protected)/visits/
├── page.tsx
├── loader.tsx
├── _components/
│   ├── visits-page-impl.tsx
│   └── visits-table.tsx
├── _data/
│   └── static-clinician-visits.ts
└── [id]/assessment/
    ├── page.tsx
    ├── loader.tsx
    └── _components/
        ├── clinician-assessment-page-impl.tsx
        ├── visit-safety-strip.tsx
        ├── assess-column.tsx
        ├── examine-column.tsx
        ├── plan-column.tsx
        └── assessment-command-bar.tsx
```

Existing shadcn/ui primitives provide cards, inputs, textareas, badges, checkboxes, radio groups, buttons, tables, and the completion confirmation dialog. Components use semantic design tokens and the Fluent elevation utilities from `DESIGN.md`. No continuous animation is introduced.

## Loading, empty, and error states

- `/visits/loader.tsx` matches the static two-row Visit table.
- `/visits/[id]/assessment/loader.tsx` matches the safety strip, three-column cockpit, and command bar.
- The exact two-Visit dataset means the list has no normal empty state, but its table component retains a clear empty presentation for testability.
- An invalid assessment identifier returns not found.
- Completion validation appears inline and directs the Doctor to the missing primary diagnosis or Discharge Disposition.

## Accessibility and safety

- All controls are keyboard reachable and retain visible focus rings.
- Labels remain associated with editable controls.
- Status is communicated by text and iconography, not colour alone.
- Allergy and abnormal-finding warnings use high-contrast semantic styles and remain visible.
- The completion action is the single primary action.
- Completed Visit controls expose their disabled/read-only state programmatically.
- Light and dark themes are supported without raw colour values.

## Testing and verification

Component tests cover:

- Both static Visits appear with their correct status and consultation links.
- Each assessment exposes all three workflow regions without tabs or accordions.
- Active Visit fields can be edited.
- Completed Visit controls are read-only.
- `Mark all normal` updates the relevant findings.
- Adding and removing local clinical rows works.
- Saving a draft updates the saved timestamp.
- Completing without required fields shows validation.
- Confirmed completion changes the Visit Status locally.

Verification includes targeted tests, the repository test suite where practical, TypeScript checking, linting, formatting checks, and visual inspection at 1440 by 900 pixels in light and dark themes. The final visual check confirms that neither the page nor cockpit has horizontal or vertical scrollbars at the target viewport.
