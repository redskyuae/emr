# Feature path — from a GitHub issue to reviewed, uncommitted code

The feature branch of `ticket`, entered from Stage 1 once the engineer
confirms the issue is a feature. Same principle as the bug path: a
conversation, not a pipeline. Every stage ends at a checkpoint where you stop
and wait.

Unlike the bug path, this one **does implement**, but only after the plan is
agreed. The output is working, verified code in the engineer's working tree,
which the engineer reviews and commits themselves.

Copy this checklist into the conversation and tick it as you go:

```
- [ ] F1 Context gathered (issue tree, docs, codebase), sources listed
- [ ] F2 Questions resolved, no blocking unknowns left
- [ ] F3 Plan presented and approved
- [ ] F4 Plan posted to the issue and saved to plans.md
- [ ] F5 Execution mode chosen, branch ready
- [ ] F6 Implemented (one shot, or slice by slice)
- [ ] F7 Final verification and hand-off
```

## Iron laws for this path

```
1. No code before an approved plan. Investigation is read-only. The first
   edit to the repo happens in F6, after the engineer approves the plan.
2. Ask, don't assume. Every requirement in the plan traces to a source: the
   issue, a parent issue, a comment, an ADR, a mockup, or an answer from the
   engineer. Anything else is labelled an assumption and shown to the
   engineer. Contradictions between sources are always questions.
3. The plan is the contract. If implementation shows the plan is wrong,
   stop and say so. Don't quietly build something different.
4. Green at every checkpoint. Don't present a slice, or the final result,
   without saying what was built and tested and what wasn't.
5. Never commit, push or open a PR. The engineer reviews and commits.
   Staging approved slices (F6) is the only git write you make, and only
   if the engineer agreed to it.
6. Nothing goes to GitHub without an explicit yes on the exact text.
7. No patient-identifying information and no secrets in the plan or any
   comment.
```

## F1 — Gather context

The issue alone is rarely enough. Build the full picture before forming a
view, and keep a running **Sources** list: what you read, and what you
couldn't reach.

### A. The GitHub tree

Use `gh`. One call returns the issue with its relations:

```bash
gh issue view <n> --json number,title,body,state,labels,assignees,milestone,parent,subIssues,blockedBy,blocking,closedByPullRequestsReferences,comments,url
```

| What                 | How                                                                                           | Why                                                                                                   |
| -------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| The issue            | `body` and `labels`                                                                           | A `/create-ticket` issue already carries Business rules, Implementation notes and Acceptance criteria |
| All comments         | `comments`                                                                                    | Decisions often live in comments, not the body                                                        |
| Parent chain         | `parent`, then `gh issue view` on it, walking up to the top (max 3 levels), with its comments | The parent holds the full business requirement. Older issues name it in a `## Parent` section instead |
| Siblings             | The parent's `subIssues`                                                                      | What's already built or in progress next to this issue. Read the ones that overlap, not all of them   |
| Sub-issues           | `subIssues`                                                                                   | Whether the issue is already split up                                                                 |
| Blockers             | `blockedBy`, plus any `Blocked by #n` line in the body                                        | An open blocker means the API or data this issue needs may not exist yet                              |
| Work already started | `closedByPullRequestsReferences`, and `gh pr list --state all --search "<n> in:body"`         | Someone may already have a branch or a PR for this                                                    |
| Mentioned issues     | `#123` references in the body and comments                                                    | Follow the ones that bear on this issue's requirements                                                |
| Images               | Screenshots and mockups attached to the body or comments                                      | Mockups are requirements too                                                                          |

**The layer label matters.** An issue is `frontend` or `backend`, never both
(`docs/conventions/labels.md`). The label is the scope of this work. A
`frontend` issue that is blocked by an open `backend` issue cannot be finished
yet: say so in F2 and let the engineer decide whether to wait, build against
the agreed contract, or stop.

**Links in any of the above.** Follow every link that looks like a requirement
source:

- Files in this repo, such as `docs/mockups/` or a plan document → read them.
- Figma → the Figma tools, if they are connected.
- Google Drive, Notion and similar → the matching tools, if they are connected
  and signed in.
- Anything you can't open, including an image you can't view: list it under
  **Couldn't read** and ask the engineer to paste or describe the relevant
  part. Never imply you read a document you didn't.

**Stay bounded.** Don't crawl the tracker. The scope is: ancestors to the top,
siblings by title (reading only the ones that overlap), blockers, and directly
mentioned issues. Go further only when one of those points at something that
bears on this issue's requirements.

### B. The EMR's own documentation

- `CLAUDE.md`: always. It's the current baseline and the binding rules.
- `CONTEXT.md`: the glossary. The plan uses its terms exactly.
- `docs/adr/`: existing decisions the feature must respect. An ADR wins over a
  fresh design; if the issue contradicts one, that is a question for F2.
- `lessons.md`: for example how to add a unique constraint to a soft-deleted
  table.
- `DESIGN.md` for any UI, and `docs/backend-testing.md` for any backend work.
- `node_modules/next/dist/docs/` for any Next.js API you plan to use. This
  version has breaking changes from older ones.

### C. The codebase

Delegate wide searches to **Explore** subagents, in parallel, one per area,
and ask each for `file:line` conclusions only. Cover:

1. **Does it already exist?** The feature may be partly built, hidden behind
   an environment flag, done in a sibling issue, or present only as a
   static-data demo page (`ENABLE_DEMO_PAGES`). Say so before planning
   anything new.
2. **What it extends.** The tables, modules, routes, query hooks and screens
   the feature touches.
3. **The closest existing analogue.** A feature of the same shape whose
   patterns the new code should copy. `app/(protected)/identity-access/roles/`
   is the reference screen; `docs/backend-testing.md` lists which module to
   copy for each module shape.
4. **Tests around it.** Existing unit and integration coverage of the touched
   code.

Load the team skills for the layer the feature touches (`design-system`,
`tanstack-query-patterns`, `tdd`). You need them to plan in the project's
idiom, not only to write code later.

## F2 — Present your understanding, then ask

Before any plan, show what you understood. The engineer should be able to
catch a misread in 30 seconds:

```
#123 — <title>
Problem: <who has it, and what they can't do today>
What "done" looks like: <observable outcome>
Already exists: <what's there today, file:line; or "nothing">
Sources read: <issue, parent #100, 3 siblings, ADR 0026, docs/mockups/..., ...>
Couldn't read: <links or images you couldn't open; or "none">
Blocked by: <open blockers; or "nothing">
```

Then ask your questions, sorted into three groups:

- **Product questions** (behaviour, scope, edge cases, permissions, copy).
  The issue's author or the parent issue should answer these. If the engineer
  doesn't know, don't let them guess either. Offer to post them to the issue
  as a comment (same approval rule), and pause, or carry on with an
  explicitly labelled assumption, as the engineer chooses.
- **Technical questions** (approach, data model, which existing piece to
  extend). The engineer can usually answer these.
- **Assumptions I'll make unless you say otherwise.** Low-stakes calls,
  stated so the engineer can veto them. They go into the plan.

How to ask:

- Ask the ones that change the design. Don't ask what you can find out by
  reading code.
- At most about 7 at a time, ordered by impact. For each, give your
  recommended answer, the reason, and what changes depending on the answer.
- Use the session's question tool for multiple-choice questions, if it has
  one. Use plain text for open ones.
- A contradiction (the issue says X, a later comment or an ADR says Y) is
  always a question. Quote both sources.

Loop until no blocking question is left.

## F3 — The plan

Present it in the terminal in this shape. Leave out layers the feature
doesn't touch.

```
#123 — <title>
Size: S | M | L (~N files)   Layer: backend | frontend

Goal
  <2-3 sentences>

Acceptance criteria
  AC1 <testable statement>                      [issue]
  AC2 <...>                                     [parent #100]
  AC3 <...>                                     [engineer, F2]

Out of scope
  - <what this issue deliberately doesn't do>

Assumptions
  - <assumption>, agreed in F2 or flagged here for veto

Approach
  <narrative: what gets built, which existing code it extends (file:line),
  which analogue it copies>

Changes by layer
  Schema       <Drizzle table/columns, indexes, the generated migration>
  Module       <Zod schemas, validators, commands, queries, repository functions>
  API          <METHOD /api/v1/route, request → response, permission, types.ts>
  Swagger      <operations and examples added or changed>
  Query hooks  <hooks in app/queries, keys, what each mutation invalidates>
  Screen       <route, _components, _sheets/_modals, _utils, loader.tsx>
  Flag         <environment flag and its default, or "none, because ...">
  Docs         <CONTEXT.md term, ADR, lessons.md; or "none">

Flow  (Mermaid, only when more than two components interact)

Tests
  <the *.unit.tests.ts and *.integration.tests.ts files that will be added or changed>

Slices
  1. <name>: <goal>. Files: <...>. Verify by: <command or what to click>
  2. ...

Risks and open questions
  - <...>

Recommended execution mode: one shot | slice by slice, because <reason>
```

### Slicing rules

The slices are part of the plan whichever mode is chosen. In one-shot mode
they're the build order.

- **Every slice leaves the build green.** `bunx tsc --noEmit` passes and
  existing tests pass. A slice that can't be built can't be reviewed.
- Prefer **vertical** slices that can be demonstrated (one capability
  working end to end within the issue's layer). When that's not practical, go
  bottom-up: schema and migration → Zod schemas → repository → validators →
  commands and queries → route, `types.ts` and Swagger, or on the frontend:
  query hooks → `_utils` → components → sheets and dialogs → page and loader.
- **Tests ship with the code they cover**, not as a final "tests" slice. This
  is a project rule (ADR 0016), not a preference.
- **Small enough to review in one sitting**: roughly 10 files or 400
  changed lines at most. 3 to 7 slices is typical. If you need more than 8,
  the issue is probably too big. Suggest splitting it into sub-issues
  rather than one long session.
- Each slice has a **Verify by** the engineer can do: a test command, a
  request to send, or a screen to open.
- Documentation ships with the slice that makes it true: Swagger with the
  route, `loader.tsx` with the page, a `CONTEXT.md` term with the code that
  introduces it.

### When the issue is bigger than its label

If the work needs the other layer too (a `frontend` issue whose API doesn't
exist, a `backend` issue that is only useful with a screen), or it holds
several separate capabilities, say so in the plan and let the engineer choose:
narrow this issue to what its label covers and raise the rest as its own
issue (`/create-ticket` knows the format and the sub-issue linking), or carry
on here with the wider scope stated in the plan. Don't silently skip the
choice, and don't silently build both layers.

Ask: _"Does this match what you had in mind? Anything to change before I post
it to #123?"_ Iterate until the engineer approves the plan explicitly.

## F4 — Post the plan and save it

1. Draft the GitHub comment from
   [feature-plan-comment-template.md](feature-plan-comment-template.md), in a
   temporary file outside the repository. It's for a reader who may not be
   the engineer, so it's shorter than the terminal plan.
2. Show the **exact** text and ask: _"Post this to #123?"_ On an explicit
   yes, post it with `gh issue comment <n> --body-file <file>`. **Keep the
   comment URL** it prints: the number after `#issuecomment-` is the comment
   ID, and F6 may need it to update this comment.
   If the engineer declines to post, note that and continue.
3. Save the full approved plan to **`plans.md`** at the repo root. It's
   gitignored. Include the comment URL and a slice status table. It keeps the
   plan safe across context compaction and lets a new session resume. If
   `plans.md` already exists, show what's in it and ask before overwriting.
4. Don't change the issue's state, assignees, labels or milestone unless
   asked. You may offer to assign it to the engineer
   (`gh issue edit <n> --add-assignee @me`).

## F5 — Choose the execution mode, prepare the branch

Ask with the session's question tool. Put your recommendation first, with
its reason:

- **One shot.** Implement all slices in one run, verify, then present one
  summary. Faster. The engineer reviews the whole diff at the end.
- **Slice by slice.** Stop after each slice with a summary. The engineer
  reviews it in their IDE, then says "continue" or gives feedback. Slower,
  but every review is small.

Recommend **slice by slice** when any of these hold: more than about 15
files, a schema change, a change to auth or Tenant scoping, or an area of
the codebase neither of you knows well. Otherwise recommend **one shot**.

For slice by slice, also ask (default yes): _"After you approve a slice, can I
`git add` its files so your IDE's unstaged view shows only the next slice?
Nothing gets committed."_

Then prepare the branch:

- If the working tree has uncommitted changes, show them (`git status`) and
  ask how to proceed. Don't stash or discard anything.
- If you're on `main` (or another shared branch), propose a branch named
  `<name>/<issue-number>-<short-slug>`, for example
  `arun/263-visit-coverage-at-check-in`, using the prefix the engineer's
  other branches use. The issue number in the name is how `/pr` finds the
  issue later. Create it on the engineer's yes.

The engineer can switch modes at any time ("do the rest in one go").

## F6 — Implement

Before writing code, load what `CLAUDE.md` requires for the layer in the
plan: `DESIGN.md` and the `design-system` skill for any UI, the
`tanstack-query-patterns` skill for query hooks and mutations,
`docs/backend-testing.md` for backend tests, and `lessons.md` before adding a
unique constraint. Follow the project's conventions: the CQRS module layout,
`tenantId` from the Session on every repository query, result types instead
of throwing, `types.ts` beside every route, a `loader.tsx` beside every page.

Generating a migration (`bun run db:generate`) is a file change and is part of
the work. **Applying** one (`db:migrate`, `db:push`) changes a database: ask
first, because the database in `.env` may be shared.

Implement in the main session, so the engineer's feedback and the plan stay in
one context. Use Explore for lookups. Update the slice table in `plans.md` as
you go.

**Stop and ask, in either mode**, when:

- the plan turns out to be wrong or incomplete (iron law 3)
- a new product question comes up
- verification fails and the fix isn't obvious and local

One shot means no review checkpoints. It doesn't mean no questions.

### Verifying a slice

Run what applies, and report what you actually ran:

- Always: `bunx tsc --noEmit`, `bun run lint`, `bun run format:check`.
- Backend: `bunx vitest run --project unit <path>` for the touched module.
- Integration tests: ask first. They need `TEST_DATABASE_URL`, a migrated
  test database (`bun run test:db:migrate`), and they truncate that
  database's tables.
- Frontend: open the changed screen in the running app (`bun run dev`, with
  the browser tools if the session has them) and check the behaviour, the
  loader skeleton and the empty and error states. Then run
  `bun .agents/skills/prepare-to-merge-to-main/scripts/check-prepare-to-merge.mjs`.

If something fails, say so with the output. Don't present a slice as done
while its checks fail.

### Mode A — one shot

Work through the slices in order and verify after each one. Don't stop
between slices unless one of the stop conditions above applies. Then go to F7.

### Mode B — slice by slice

At the start of each slice, and in each summary, show the progress board:

```
Progress — #123
  [x] 1 Schema and migration        approved
  [>] 2 Repository and validators   in progress
  [ ] 3 Commands and queries
  [ ] 4 Route, types and Swagger
```

After the slice is built and verified, present:

```
Slice 2/4 done: <name>

What changed
  - <behaviour-level bullets>

Files
  <path>  new | modified: <what>

Where to start reviewing
  <the one or two files that carry the logic, in reading order>

Verified
  tsc ✓   lint ✓   vitest unit <path> ✓ (12 passed)
  Not verified: <what, and why>

Deviations from plan: none | <what, and why>
Small decisions I made: <choices the plan didn't cover; or "none">

Next: slice 3, <name>
```

Then **stop**: _"Review it in your IDE. Say 'continue', or tell me what to
change."_

- **On "continue"**: if the engineer agreed to staging, `git add` the slice's
  files by explicit path (never `git add -A` or `.`). Then start the next
  slice.
- **On feedback**: apply it, re-verify, and present a short delta summary of
  the same slice. Don't move on until the engineer says continue.
- **If feedback changes the plan** (later slices, approach, scope or
  acceptance criteria): show the updated slice list. If acceptance criteria
  or scope changed, offer to update the posted comment. Show the new text,
  wait for a yes, then:

  ```bash
  gh api repos/{owner}/{repo}/issues/comments/<comment-id> -X PATCH -F body=@<file>
  ```

## F7 — Final verification and hand-off

1. Run the full verification: `bunx tsc --noEmit`, `bun run lint`,
   `bun run format:check`, `bun run test:unit`, `bun run build`, and the
   prepare-to-merge script. Run `bun run test:integration` if the engineer
   agreed to it; otherwise say CI will be the first run.
2. Review your own diff (`git diff`, including staged): leftover debug code,
   TODOs, dead code, exports nothing imports, files outside the plan. Offer
   the `review` team skill for a deeper pass.
3. Present the result:

```
#123: implementation complete (uncommitted)

Acceptance criteria
  AC1 ✓ <where it's implemented>, <how it was verified>
  AC2 ✓ ...
  AC3 ✗ / partial: <why>

Deviations from the plan: <...>
Follow-ups: <out-of-scope items found along the way>
Verification: <commands run and results; what's not verified>
```

4. Mark `plans.md` complete.
5. Hand off: the engineer reviews and commits. Don't do that yourself unless
   they ask. Once it's committed, `/pr` writes the pull request description
   and links it to the issue. Offer to post a short "implemented" comment to
   the issue listing any deviations from the posted plan. Same approval rule.
