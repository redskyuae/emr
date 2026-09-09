# Clinician Visit Cockpit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current Visit board with two static demonstration Visits that open a complete, single-screen clinician assessment cockpit.

**Architecture:** A route-local static data module is the single source of truth for the Visit board and assessment pages. The assessment route keeps `page.tsx` server-side for parameter validation and delegates editable demo behavior to small client components backed by a pure state reducer. The cockpit uses a fixed desktop grid, existing shadcn primitives, and a viewport guard rather than tabs, accordions, or scrolling.

**Tech Stack:** Next.js 16.2 App Router, React 19, TypeScript 5.9, Tailwind CSS 4, shadcn/ui, Lucide icons, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-09-clinician-visit-cockpit-design.md`

## Global Constraints

- The implementation is frontend-only and must not call an API or modify database records.
- The dataset contains exactly two clearly fictional Patients and Visits.
- The first Visit is `IN_CONSULTATION`; the second is `COMPLETED` and read-only.
- At 1440 by 900 pixels or larger, the page must have no horizontal or vertical scrollbars.
- Smaller viewports show `Desktop workspace required` instead of a compressed or scrollable form.
- Use canonical terms from `CONTEXT.md`: Patient, Doctor, Visit, VisitType, Visit Status, Visit Number, Queue Token, Medical Record Number, Facility, Tenant, and Discharge Disposition.
- Use existing shadcn primitives, semantic design tokens, Fluent elevation utilities, Urbanist, and Geist Mono.
- Do not introduce tabs, accordions, continuous animation, raw colours, new dependencies, APIs, or database changes.
- Every new page has a sibling `loader.tsx` that renders `Skeleton` and mirrors the page shape.
- The unit-test runner collects `*.unit.tests.ts` in a Node environment. Test interactions through the pure reducer, and test rendered structure with `react-dom/server` plus `React.createElement` so test filenames remain `.ts`.

---

### Task 1: Static Visit model and assessment state

**Files:**

- Create: `app/(protected)/visits/_data/static-clinician-visits.ts`
- Create: `app/(protected)/visits/[id]/assessment/_utils/assessment-state.ts`
- Test: `app/(protected)/visits/[id]/assessment/_utils/assessment-state.unit.tests.ts`

**Interfaces:**

- Produces `ClinicalFinding`, `StaticClinicianVisit`, `staticClinicianVisits`, and `getStaticClinicianVisit(id: number)`.
- Produces `AssessmentState`, `AssessmentAction`, `createAssessmentState(visit)`, `assessmentReducer(state, action)`, and `canCompleteAssessment(state)`.
- Consumers receive fresh state; the reducer must never mutate objects imported from the static dataset.

- [ ] **Step 1: Write failing reducer and selector tests**

```ts
import { describe, expect, it } from 'vitest';

import { getStaticClinicianVisit, staticClinicianVisits } from '../../../_data/static-clinician-visits';
import { assessmentReducer, canCompleteAssessment, createAssessmentState } from './assessment-state';

describe('static clinician Visits', () => {
  it('should expose exactly one active and one completed Visit', () => {
    expect(staticClinicianVisits).toHaveLength(2);
    expect(staticClinicianVisits.map((visit) => visit.status)).toEqual([
      'IN_CONSULTATION',
      'COMPLETED',
    ]);
  });

  it('should resolve a Visit by numeric identifier', () => {
    expect(getStaticClinicianVisit(15730)?.visitNumber).toBe('VST-15730');
    expect(getStaticClinicianVisit(99999)).toBeUndefined();
  });
});

describe('assessmentReducer', () => {
  it('should mark every Review of Systems finding normal', () => {
    const visit = getStaticClinicianVisit(15730)!;
    const state = createAssessmentState(visit);
    const next = assessmentReducer(state, { type: 'mark-all-normal', target: 'ros' });
    expect(next.ros.every((finding) => finding.status === 'normal')).toBe(true);
  });

  it('should add and remove a prescription row', () => {
    const visit = getStaticClinicianVisit(15730)!;
    const state = createAssessmentState(visit);
    const added = assessmentReducer(state, { type: 'add-prescription' });
    const removed = assessmentReducer(added, {
      type: 'remove-prescription',
      id: added.prescriptions.at(-1)!.id,
    });
    expect(added.prescriptions).toHaveLength(state.prescriptions.length + 1);
    expect(removed.prescriptions).toHaveLength(state.prescriptions.length);
  });

  it('should require primary diagnosis and Discharge Disposition for completion', () => {
    const visit = getStaticClinicianVisit(15730)!;
    const state = createAssessmentState(visit);
    expect(canCompleteAssessment({ ...state, diagnoses: [], dischargeDisposition: '' })).toEqual({
      valid: false,
      errors: ['Add a primary diagnosis.', 'Select a Discharge Disposition.'],
    });
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `bunx vitest run --project unit 'app/(protected)/visits/[id]/assessment/_utils/assessment-state.unit.tests.ts'`

Expected: FAIL because the static data and reducer modules do not exist.

- [ ] **Step 3: Implement the static types, two Visits, selectors, and reducer**

Use fictional Patients such as Asha Menon and Kareem Rahman. Model every visible workflow group from the specification, but keep value types simple: strings, booleans, discriminated finding statuses, and row arrays. The active Visit includes at least one abnormal respiratory finding and a primary diagnosis; the completed Visit includes a completed timestamp and Discharge Disposition.

Reducer actions must include:

```ts
type AssessmentAction =
  | { type: 'update-field'; field: EditableTextField; value: string }
  | { type: 'update-finding'; target: 'ros' | 'exam'; id: string; status: FindingStatus }
  | { type: 'mark-all-normal'; target: 'ros' | 'exam' }
  | { type: 'add-diagnosis' }
  | { type: 'remove-diagnosis'; id: string }
  | { type: 'add-treatment' }
  | { type: 'remove-treatment'; id: string }
  | { type: 'add-procedure' }
  | { type: 'remove-procedure'; id: string }
  | { type: 'add-prescription' }
  | { type: 'remove-prescription'; id: string }
  | { type: 'save-draft'; savedAt: string }
  | { type: 'complete-visit'; completedAt: string };
```

`canCompleteAssessment` returns the exact validation messages asserted above.

- [ ] **Step 4: Run the targeted test and verify GREEN**

Run: `bunx vitest run --project unit 'app/(protected)/visits/[id]/assessment/_utils/assessment-state.unit.tests.ts'`

Expected: PASS.

- [ ] **Step 5: Commit the model and state logic**

```bash
git add 'app/(protected)/visits/_data/static-clinician-visits.ts' 'app/(protected)/visits/[id]/assessment/_utils/assessment-state.ts' 'app/(protected)/visits/[id]/assessment/_utils/assessment-state.unit.tests.ts'
git commit -m "feat: add static clinician Visit workflow data"
```

### Task 2: Two-row static Visit board

**Files:**

- Modify: `app/(protected)/visits/_components/visits-page-impl.tsx`
- Modify: `app/(protected)/visits/_components/visits-table.tsx`
- Modify: `app/(protected)/visits/loader.tsx`
- Test: `app/(protected)/visits/_components/visits-table.unit.tests.ts`

**Interfaces:**

- Consumes `staticClinicianVisits: StaticClinicianVisit[]` from Task 1.
- Produces links shaped as `/visits/${visit.id}/assessment` with the visible label `Open consultation`.

- [ ] **Step 1: Add failing list projection and server-render tests**

Extend `assessment-state.unit.tests.ts` with a pure list projection:

```ts
import { toVisitBoardRows } from '../../../_data/static-clinician-visits';

it('should project consultation links for both static Visits', () => {
  expect(toVisitBoardRows().map((row) => row.href)).toEqual([
    '/visits/15730/assessment',
    '/visits/15731/assessment',
  ]);
});
```

Create `visits-table.unit.tests.ts` without JSX:

```ts
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { staticClinicianVisits } from '../_data/static-clinician-visits';
import { VisitsTable } from './visits-table';

describe('VisitsTable', () => {
  it('should render two static Visits with consultation links', () => {
    const html = renderToStaticMarkup(createElement(VisitsTable, { visits: staticClinicianVisits }));
    expect(html).toContain('VST-15730');
    expect(html).toContain('VST-15731');
    expect(html).toContain('/visits/15730/assessment');
    expect(html.match(/Open consultation/g)).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run both targeted tests. Expected: FAIL because `toVisitBoardRows` is missing and the existing `VisitsTable` expects the API `Visit` shape plus callback props.

- [ ] **Step 3: Implement the board projection and static page**

Remove query, mutation, pagination, filtering, and check-in dialog dependencies from `VisitsPageImpl`. Render a calm header card explaining `Clinician workflow demonstration` and pass the two rows to `VisitsTable`.

Update `VisitsTable` to display Token, Visit, Patient, Doctor, VisitType, Visit Status, Checked in, and Action. Use `font-mono` for identifiers and `visitStatusPresentation` for textual status. Every row ends with:

```tsx
<Button asChild size="sm" variant={visit.status === 'COMPLETED' ? 'outline' : 'default'}>
  <Link href={`/visits/${visit.id}/assessment`}>
    <Stethoscope className="size-4" />
    Open consultation
  </Link>
</Button>
```

Change the table skeleton to exactly two rows and make its last cell match the action width.

- [ ] **Step 4: Verify GREEN and check types**

Run:

```bash
bunx vitest run --project unit 'app/(protected)/visits/[id]/assessment/_utils/assessment-state.unit.tests.ts'
bunx vitest run --project unit 'app/(protected)/visits/_components/visits-table.unit.tests.ts'
bunx tsc --noEmit
```

Expected: both commands pass.

- [ ] **Step 5: Commit the Visit board**

```bash
git add 'app/(protected)/visits/_components/visits-page-impl.tsx' 'app/(protected)/visits/_components/visits-table.tsx' 'app/(protected)/visits/_components/visits-table.unit.tests.ts' 'app/(protected)/visits/loader.tsx' 'app/(protected)/visits/[id]/assessment/_utils/assessment-state.unit.tests.ts' 'app/(protected)/visits/_data/static-clinician-visits.ts'
git commit -m "feat: show static clinician Visits"
```

### Task 3: Assessment route, viewport guard, and safety strip

**Files:**

- Create: `app/(protected)/visits/[id]/assessment/page.tsx`
- Create: `app/(protected)/visits/[id]/assessment/loader.tsx`
- Create: `app/(protected)/visits/[id]/assessment/_components/clinician-assessment-page-impl.tsx`
- Create: `app/(protected)/visits/[id]/assessment/_components/desktop-workspace-guard.tsx`
- Create: `app/(protected)/visits/[id]/assessment/_components/visit-safety-strip.tsx`
- Modify: `components/app/app-shell-config.ts`
- Test: `app/(protected)/visits/[id]/assessment/_components/visit-safety-strip.unit.tests.ts`

**Interfaces:**

- Consumes `getStaticClinicianVisit(id)` and calls `notFound()` before rendering when it returns `undefined`.
- `ClinicianAssessmentPageImpl` accepts `{ visit: StaticClinicianVisit }`.
- `DesktopWorkspaceGuard` shows children only when the viewport is at least 1400 pixels wide and 820 pixels high; smaller viewports get the desktop-required notice.

- [ ] **Step 1: Extend the selector test for invalid route input**

```ts
it('should reject non-finite and non-integer Visit identifiers', () => {
  expect(getStaticClinicianVisit(Number.NaN)).toBeUndefined();
  expect(getStaticClinicianVisit(15730.5)).toBeUndefined();
});
```

- [ ] **Step 2: Run the test and verify RED**

Run the targeted unit test. Expected: FAIL until the selector explicitly guards integer identifiers.

- [ ] **Step 3: Implement the route and top-level cockpit**

The page follows the Next.js 16 promise-based parameter contract:

```tsx
export default async function ClinicianAssessmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const visitId = Number(id);
  const visit = getStaticClinicianVisit(visitId);
  if (!visit) notFound();
  return <ClinicianAssessmentPageImpl visit={visit} />;
}
```

`VisitSafetyStrip` visibly renders Facility, Patient, age/sex, MRN, Visit Number, VisitType, Queue Token, Visit Status, Doctor, time, and allergy. Use a destructive-outline treatment for the allergy warning without raw colour utilities.

Add exact assessment metadata handling in `getAppPageMeta`: pathnames matching `/visits/<id>/assessment` return the title `Clinician assessment` and a subtitle that states the active Facility context.

Build a loader with a safety-strip skeleton, three equal column skeletons, and a bottom command-bar skeleton.

Add a server-render test using `renderToStaticMarkup(createElement(VisitSafetyStrip, { visit }))`. Assert the markup contains the Patient name, Medical Record Number, Visit Number, Facility, Doctor, Visit Status, and allergy text.

- [ ] **Step 4: Verify GREEN and check types**

Run the state test, safety-strip test, and `bunx tsc --noEmit`. Expected: PASS.

- [ ] **Step 5: Commit the route shell**

```bash
git add 'app/(protected)/visits/[id]/assessment' components/app/app-shell-config.ts
git commit -m "feat: add clinician assessment cockpit shell"
```

### Task 4: Assess and Examine workflow columns

**Files:**

- Create: `app/(protected)/visits/[id]/assessment/_components/section-heading.tsx`
- Create: `app/(protected)/visits/[id]/assessment/_components/finding-control.tsx`
- Create: `app/(protected)/visits/[id]/assessment/_components/assess-column.tsx`
- Create: `app/(protected)/visits/[id]/assessment/_components/examine-column.tsx`
- Modify: `app/(protected)/visits/[id]/assessment/_components/clinician-assessment-page-impl.tsx`

**Interfaces:**

- `AssessColumn` consumes `AssessmentState`, `disabled`, and `dispatch`.
- `ExamineColumn` consumes the same contract and dispatches `update-finding` and `mark-all-normal` actions.
- `FindingControl` always shows system name, Normal/Abnormal state, and abnormal remarks; it never hides safety information in a tooltip.

- [ ] **Step 1: Write failing reducer tests for field edits and finding status**

```ts
it('should edit the chief complaint without mutating the original Visit', () => {
  const visit = getStaticClinicianVisit(15730)!;
  const state = createAssessmentState(visit);
  const next = assessmentReducer(state, {
    type: 'update-field',
    field: 'chiefComplaint',
    value: 'Updated complaint',
  });
  expect(next.chiefComplaint).toBe('Updated complaint');
  expect(visit.assessment.chiefComplaint).not.toBe('Updated complaint');
});

it('should retain visible remarks for an abnormal examination finding', () => {
  const visit = getStaticClinicianVisit(15730)!;
  const state = createAssessmentState(visit);
  const next = assessmentReducer(state, {
    type: 'update-finding',
    target: 'exam',
    id: 'respiratory',
    status: 'abnormal',
  });
  expect(next.exam.find((item) => item.id === 'respiratory')?.remarks).toBeTruthy();
});
```

- [ ] **Step 2: Run the tests and verify RED**

Run the targeted unit test. Expected: at least one assertion fails until the reducer copies state and preserves remarks.

- [ ] **Step 3: Implement the Assess column**

Fit content into a compact card using a two-column vital grid, short labelled fields, badge-style history summaries, and one concise HPI textarea. Include every data group from the specification without nested scrolling. Completed Visits render the same values using disabled controls.

- [ ] **Step 4: Implement the Examine column**

Render Review of Systems and Physical Examination as dense finding matrices with explicit Normal/Abnormal segmented controls and a visible inline abnormal summary. Place Prakriti, Vikriti, and Ashtavidha summaries in a three-row compact footer. `Mark all normal` is an outline button for each matrix.

- [ ] **Step 5: Verify tests and types**

Run the targeted unit test and `bunx tsc --noEmit`. Expected: PASS.

- [ ] **Step 6: Commit the assessment and examination columns**

```bash
git add 'app/(protected)/visits/[id]/assessment/_components' 'app/(protected)/visits/[id]/assessment/_utils'
git commit -m "feat: add assessment and examination workflow"
```

### Task 5: Plan column and command bar interactions

**Files:**

- Create: `app/(protected)/visits/[id]/assessment/_components/plan-column.tsx`
- Create: `app/(protected)/visits/[id]/assessment/_components/compact-clinical-row.tsx`
- Create: `app/(protected)/visits/[id]/assessment/_components/assessment-command-bar.tsx`
- Modify: `app/(protected)/visits/[id]/assessment/_components/clinician-assessment-page-impl.tsx`
- Modify: `app/(protected)/visits/[id]/assessment/_utils/assessment-state.ts`
- Test: `app/(protected)/visits/[id]/assessment/_utils/assessment-state.unit.tests.ts`

**Interfaces:**

- `PlanColumn` consumes the complete `AssessmentState`, `disabled`, and reducer dispatch.
- `AssessmentCommandBar` receives `status`, `lastSavedAt`, `completionErrors`, `onSave`, `onPrint`, and `onComplete`.
- `ClinicianAssessmentPageImpl` owns `useReducer`, completion confirmation state, and the validation error list.

- [ ] **Step 1: Write failing save and completion tests**

```ts
it('should record a draft save timestamp', () => {
  const state = createAssessmentState(getStaticClinicianVisit(15730)!);
  const next = assessmentReducer(state, { type: 'save-draft', savedAt: '2026-09-09T12:00:00Z' });
  expect(next.lastSavedAt).toBe('2026-09-09T12:00:00Z');
});

it('should complete a valid active Visit locally', () => {
  const state = createAssessmentState(getStaticClinicianVisit(15730)!);
  const next = assessmentReducer(state, {
    type: 'complete-visit',
    completedAt: '2026-09-09T12:05:00Z',
  });
  expect(next.status).toBe('COMPLETED');
  expect(next.completedAt).toBe('2026-09-09T12:05:00Z');
});
```

- [ ] **Step 2: Run the tests and verify RED**

Run the targeted unit test. Expected: FAIL until save/completion state is implemented.

- [ ] **Step 3: Implement the Plan column**

Use compact visible sections for Clinical Impression, Diagnosis, Advised Treatment, Treatment Plan, OP Procedure, Prescription, MDM, Addendum, education, and discharge. Arrays render one dense row plus add/remove buttons. MDM exposes selected problem complexity, reviewed data, and risk without reproducing the legacy wall of checkboxes.

- [ ] **Step 4: Implement command bar actions**

`Save draft` dispatches an ISO timestamp and shows a local success toast. `Print summary` calls `window.print()`. `Complete Visit` first runs `canCompleteAssessment`; errors render in a destructive `Alert`. A valid state opens `AlertDialog`; confirming dispatches `complete-visit` and shows a success toast. Completed Visits disable mutation controls and replace the primary button with a `Completed` badge.

- [ ] **Step 5: Verify tests and types**

Run the targeted unit test and `bunx tsc --noEmit`. Expected: PASS.

- [ ] **Step 6: Commit the planning and lifecycle UI**

```bash
git add 'app/(protected)/visits/[id]/assessment'
git commit -m "feat: complete clinician Visit workflow"
```

### Task 6: Layout polish, loader parity, and end-to-end verification

**Files:**

- Modify: `app/(protected)/visits/[id]/assessment/_components/clinician-assessment-page-impl.tsx`
- Modify: `app/(protected)/visits/[id]/assessment/loader.tsx`
- Modify: `app/(protected)/visits/loader.tsx`
- Modify only if required for the route-specific fixed viewport: `app/(protected)/layout.tsx`

**Interfaces:**

- The cockpit root exposes `data-testid="clinician-cockpit"` for browser measurement.
- The fixed desktop layout uses `min-h-0`, `overflow-hidden`, and a three-column grid; no child introduces an overflow container.

- [ ] **Step 1: Run formatting on changed files**

Run:

```bash
bunx prettier --write 'app/(protected)/visits/**/*.{ts,tsx}' components/app/app-shell-config.ts docs/superpowers/{specs,plans}/2026-09-09-clinician-visit-cockpit*.md
```

- [ ] **Step 2: Run automated verification**

Run:

```bash
bunx vitest run --project unit 'app/(protected)/visits/[id]/assessment/_utils/assessment-state.unit.tests.ts'
bunx tsc --noEmit
bun run lint
bun run format:check
bun run build
```

Expected: every command exits with status 0 and no new warnings.

- [ ] **Step 3: Start the application and verify navigation**

Run `bun run dev`, open `/visits`, and confirm exactly two static Visits appear. Open each consultation link and verify the correct Patient, Visit Status, and clinical data load. Confirm the completed Visit is read-only.

- [ ] **Step 4: Verify 1440 by 900 layout and interactions**

At a 1440 by 900 viewport, verify in both light and dark themes:

- `document.documentElement.scrollHeight === document.documentElement.clientHeight`
- `document.documentElement.scrollWidth === document.documentElement.clientWidth`
- The safety strip, Assess, Examine, Plan, and command bar are simultaneously visible.
- No critical Patient data is clipped or hover-only.
- `Mark all normal`, add/remove rows, Save draft, Print summary, validation, confirmation, and completion behave as specified.
- Keyboard focus reaches every interactive control and focus rings remain visible.

- [ ] **Step 5: Verify the smaller-viewport guard**

At 1199 by 759 and 390 by 844, verify that `Desktop workspace required` is visible and the clinical cockpit is not rendered.

- [ ] **Step 6: Commit final polish**

```bash
git add 'app/(protected)/visits' components/app/app-shell-config.ts docs/superpowers/plans/2026-09-09-clinician-visit-cockpit.md
git commit -m "feat: polish clinician Visit cockpit"
```
