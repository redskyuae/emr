# Bug investigation — EMR

The method the `bug-investigator` agent follows (Stage 2 of `ticket`).
It's also the fallback when the main session investigates inline. The goal is
a root cause you can defend with evidence, not the first plausible story.

## 1. Load EMR context (only what's relevant)

- `CLAUDE.md`: always. It's the current system baseline: the CQRS module
  layout, the multi-tenancy rule, auth and session handling, screen
  composition.
- `CONTEXT.md`: the glossary. Use its terms, and check what the issue's words
  actually mean in this domain.
- `docs/adr/`: check if the behaviour might be intentional. A "bug" is
  sometimes a documented trade-off.
- `lessons.md`: past bugs and their fixes. Check it before assuming a bug is new.
- Area-specific reading, loaded only when the bug is in that area:

| Bug area                                                             | Load                                                                                       |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Any backend module                                                   | `docs/backend-testing.md` (for where the nearest test seam is)                             |
| Data from another Tenant, missing or extra rows                      | The multi-tenancy rule in `CLAUDE.md`; the repository's `tenantId` filters                 |
| "Already exists" errors, a deleted record coming back, duplicates    | `lessons.md` (partial unique indexes with soft delete), ADR 0012                           |
| Sign-in, sign-out, Tenant selection, being sent back to login        | The auth sections of `CLAUDE.md` (`TabSessionGate`, `ExistingSessionGate`), ADRs 0017-0018 |
| "Forbidden", an action missing for a role                            | ADRs 0005, 0007 and 0014 (Permission Catalogue, Tenant Admins)                             |
| Stale UI after a save, lists not refreshing                          | The `tanstack-query-patterns` team skill                                                   |
| Layout, styling, form behaviour, a sheet or dialog not opening       | `DESIGN.md`, the `design-system` team skill, ADRs 0009 and 0010                            |
| A page that 404s or a missing sidebar item                           | The environment flags in `CLAUDE.md` and `.env.example`                                    |
| A date or time that is off by hours or by a day                      | ADR 0026 (Tenant time zone)                                                                |
| Generated numbers (MRN, Booking, Visit, Invoice) wrong or duplicated | The ADR for that sequence (0019, 0024, 0028, 0036)                                         |
| Next.js behaviour that contradicts what you expect                   | `node_modules/next/dist/docs/` — this version differs from older ones                      |

## 2. Restate the bug as a testable claim

Write one sentence of the form: _"When <precondition>, doing <action> gives
<actual> instead of <expected>."_ If you can't fill in all four blanks, the
issue is missing information. Ask the engineer, or list it as an open
question. Don't invent the missing piece.

## 3. Locate the code path

Trace from the entry point the user touched, down to where the data or
behaviour goes wrong:

```
Screen    app/(protected)/{route}/        page.tsx → _components/*-page-impl.tsx → _sheets, _modals
          app/(auth)/, app/(marketing)/   sign-in, signup, public pages
Hooks     app/queries/                    TanStack Query hooks → fetch /api/v1/...
Route     app/api/v1/{module}/route.ts    thin handler: Session → tenantId, permission check
          app/api/v1/{module}/types.ts    the public request/response contract
Module    app/api/lib/modules/{module}/   validator → commands | queries → repository
Schema    app/db/schema/                  Drizzle tables
          app/db/drizzle/                 generated migrations
Auth      app/lib/auth.ts                 BetterAuth with the Organizations plugin
          app/api/auth/[...all]/route.ts
Docs      app/api/lib/openapi/            Swagger/OpenAPI source
Flags     .env.example                    SIDEBAR_*, ENABLE_DEMO_PAGES, AUTH_SHOW_*, LOGIN_LOGO_VARIANT
```

For a wide search (many files, unknown entry point), delegate to an Explore
subagent and ask for file:line conclusions only. Keep the main conversation
for reasoning.

Always check:

- **Tenant scope.** Does every repository query on the path filter by
  `tenantId`, and does the `tenantId` come from the Session, not the request?
- **Soft delete.** Does the read filter `isDeleted`? Does the uniqueness
  check, or the unique index, ignore deleted rows?
- **Validation.** Does the client form schema in `_utils` agree with the API
  schema in the module? A mismatch produces "the form accepted it, the server
  rejected it" bugs, and the reverse.
- **Permissions and flags.** Is the route or the action gated by a
  permission? Is the page or sidebar item gated by an environment flag, and
  could it differ between local, preview and production?
- **Demo pages.** `/visit-list`, `/billing-counter` and
  `/visits/[id]/assessment` use static data when `ENABLE_DEMO_PAGES` is on.
  A "bug" there may be a page that was never wired to the API.
- **Cache.** Does the mutation invalidate the query keys the screen reads?

## 4. Find out _when_ it broke

- `git log --oneline -- <file>` and `git log -S '<symbol>'` on the suspect
  code. Blame the exact lines.
- If the issue says "used to work", find the commit/PR that changed the
  path. A clear regression commit is the strongest evidence you can get.
- Note the result either way: "introduced in <sha> (PR <n>)" or
  "long-standing — present since <sha>".

## 5. Reproduce, or build a feedback loop

Prefer, in this order:

1. **A failing test** at the nearest seam: a `*.unit.tests.ts` file beside
   the schema, validator, command or query, or a `*.integration.tests.ts`
   file beside the repository. Run existing tests with
   `bunx vitest run --project unit <path>`. The investigation is read-only,
   so a _new_ test is drafted in the report, not written to the repo. The
   engineer decides whether to run it, and the real regression test lands
   with the fix.
2. **A request against a running local instance** (`bun run dev`, then the
   screen or a `curl` to `/api/v1/...`).
3. **A reasoned trace**: walk the code with concrete input values, step by
   step, when running it isn't practical.

Say which one you achieved. "Reproduced with a failing test" and "traced by
reading the code" are different confidence levels. Don't blur them.

Ask before:

- running integration tests. They need `TEST_DATABASE_URL`, and their setup
  truncates the tables in that database before each test.
- anything that writes to the database in `.env`. It may be shared with
  other people.
- running any `db:*` script.

## 6. Hypotheses: rank and kill them

- Start with recent changes to the affected path (step 4). Most bugs are
  caused by a recent change.
- Correlation isn't causation. A commit that touched the file isn't the cause
  until you can show how it produces the symptom. And don't assume it's "the
  same as last time".
- List 2–4 candidate causes. For each, write what you would expect to see
  if it's true, and what would rule it out.
- Check the cheapest discriminating evidence first.
- Keep a running list, marking each one **confirmed / refuted / untested**
  with its evidence. Refuted hypotheses go in the final write-up too, because
  they save the next person time.
- Drop hypotheses out loud: "Ruled out caching: the mutation invalidates the
  list key (file:line)."
- Keep going until one hypothesis explains **every** reported symptom. A cause
  that explains only some of them is incomplete.

## 7. Symptom, trigger and root cause

|                | Question it answers                                                                                           |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| **Symptom**    | What does the user see?                                                                                       |
| **Trigger**    | What condition makes it happen: data shape, timing, flag, role, recent deploy?                                |
| **Root cause** | What defect turns the trigger into the symptom? What would you change so this _class_ of failure can't recur? |

Also list **contributing factors**: what let the defect ship or made it
worse, such as a missing test, a missing validation rule, or an ambiguous
contract. Real bugs usually have more than one cause (Netflix's "contributing
factors" framing).

Ask "why?" until the answer is a code or design decision, not another
observation. Usually 3–5 times is enough. Stop at our own code or design;
"the network is unreliable" isn't a root cause, "we don't retry X" is.

## 8. Blast radius

- Other callers of the defective code (find references / grep).
- Other Tenants, roles, Facilities or environments that hit the same path.
- Sibling modules built by copying the defective one. Master-data modules
  share a shape, so a defect in one is often in the others.
- **Data already written wrong.** Does the fix also need a data repair (a
  migration or a one-off script)? Say so explicitly.

## 9. Confidence levels

- **High**: reproduced, or a regression commit is identified, and the cause
  explains every symptom.
- **Medium**: traced by reading the code and it explains every symptom, but
  it isn't reproduced.
- **Low**: a plausible cause with gaps. Say exactly what evidence is missing.
- **Inconclusive**: no hypothesis survives. Say so, list what was ruled out,
  and name the next piece of evidence to get. This beats a confident wrong
  answer.

## Sources behind this approach

- Google SRE, [Effective Troubleshooting](https://sre.google/sre-book/effective-troubleshooting/):
  hypothesis → test loop, recent changes first, record negative results.
- Google SRE, [Example Postmortem](https://sre.google/sre-book/example-postmortem/):
  trigger kept separate from root cause; blameless, no customer-identifying info.
- Meta, [AI for efficient incident response](https://engineering.fb.com/2024/06/24/data-infrastructure/leveraging-ai-for-efficient-incident-response/)
  (2024): rank recent changes as candidates; suppress low-confidence answers.
- Microsoft Research, [LLM agents for RCA](https://www.microsoft.com/en-us/research/publication/exploring-llm-based-agents-for-root-cause-analysis/):
  agents that fetch evidence with tools are far more accurate than ones
  reasoning without it.
- Netflix, [learning from incidents](https://www.infoq.com/news/2019/07/netflix-learn-from-incidents/):
  contributing factors over a single root cause.
