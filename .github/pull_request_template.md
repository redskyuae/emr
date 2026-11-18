## Summary

<!-- Include a summary of the change: what changes and why -->
<!-- (Eg Adds Appointment Cancellation: the front desk can cancel a Scheduled or Confirmed Appointment with an Appointment Cancelled Reason, which frees the Doctor's slots.) -->

## GitHub issue

<!-- Link the issue with a closing keyword so merging this PR closes it. Use "Refs" when the PR covers only part of the issue -->
<!-- (Eg Closes #263) -->

## Feature flags

<!-- List any environment flag this PR adds, changes or removes, and what it controls. Write "None" if there are none -->
<!-- Eg:

| Flag | Status | Default | What it does |
|---|---|---|---|
| `ENABLE_DEMO_PAGES` | Existing | `false` | Shows the static-data demo pages. Must stay off in production. |
| `SIDEBAR_SHOW_VISITS` | New | `false` | Adds Visits and Visit List to the reduced sidebar. |
-->

## Testing Notes

<!-- Describe how you verified the change: the tests you added or ran, and the manual steps you took. Include before and after screenshots for UI changes, and the request and response for API changes -->
<!-- Put each screenshot in its own collapsible block, eg:

<details>
<summary>Cancel Appointment dialog</summary>

<img width="1280" height="720" alt="cancel-appointment-dialog" src="https://github.com/user-attachments/assets/..." />

</details>
-->

## Merge Danger

<!-- Door: two-way = undo by reverting or turning a flag off. one-way = can't simply be undone (a migration that changes or deletes data, an API contract change a screen or client relies on, a change to who can see or do what) -->
<!-- Blast radius: None (docs, tests, tooling) · Low (one screen or one route) · Medium (one module or feature, or behind a flag) · High (every Tenant, sign-in, Tenant isolation, shared components or shared data) -->
<!-- For a one-way door, or Medium/High, say what could go wrong and how you'd recover -->

**Door:**
**Blast radius:**
**Risk and recovery:**

## Checklist

- [ ] The issue is linked above, and its acceptance criteria are met or the gaps are listed
- [ ] Backend changes ship with colocated tests (`*.unit.tests.ts`, `*.integration.tests.ts`), and Swagger/OpenAPI is updated for every changed API operation
- [ ] Every changed page or route-local component has its `loader.tsx` updated
- [ ] If this PR adds or changes an environment flag, tested with it on and off, and `.env.example` is updated
- [ ] The following are green: `bun run format:check` `bun run lint` `bunx tsc --noEmit` `bun run test:unit` `bun run build`
- [ ] `bun run test:integration` is green locally, or CI has run it on this PR
