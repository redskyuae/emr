---
name: pr
description: >-
  Writes the description for an EMR pull request by filling in the repo's PR
  template (.github/pull_request_template.md) from the branch diff: a short
  Summary with the smallest diagram or diff sketch that makes the change
  clear, the GitHub issue link, feature flags, Testing Notes with before and
  after evidence, Merge Danger and the Checklist. Use when opening a PR,
  writing or rewriting a PR body, or refreshing the description of an existing
  PR. Invoke with /pr, or /pr <pr-number> to rewrite an existing PR's body.
argument-hint: '[pr-number]'
disable-model-invocation: true
metadata:
  credits: >-
    Adapted from Matt Pocock's pr skill
    (https://github.com/mattpocock/skills/blob/main/skills/engineering/pr/SKILL.md),
    whose Summary visuals come from Dex Horthy's show-me skill
    (https://github.com/humanlayer/skills/blob/main/plugins/show-me/skills/show-me/SKILL.md).
---

# pr: describe an EMR pull request

The PR template at `.github/pull_request_template.md` is the source of truth
for structure. Read it fresh every time and fill in its sections in its order.
Never use a copy of it from memory or from this file: when the template
changes, this skill follows.

The HTML comments in the template are instructions for you. Follow them, then
leave them out of the body you write.

## 1. Gather the change

1. **Find the base.**
   - With a PR number, or when `gh pr view` finds a PR for the current branch,
     use that PR's `baseRefName`. Stacked PRs sit on another branch, not `main`.
   - Otherwise use `origin/main` and run `git fetch origin main` first.
2. **Read the whole change**, not only the last commit:
   `git log --oneline <base>..HEAD` and `git diff <base>...HEAD`. Include
   uncommitted work only if the author says it belongs in the PR.
3. **Find the issue.** Look in the branch name (for example
   `arun/263-visit-coverage-at-check-in` → #263), the commit messages, an
   existing PR body, and `plans.md` if `/ticket` wrote one. Confirm it with
   `gh issue view <n> --json number,title,state,labels,body` and read its
   acceptance criteria. If none turns up, ask. Never make up an issue number.
4. **Read the domain language** in `CONTEXT.md` at the repo root, and use its
   terms (Tenant, Facility, Appointment, Visit, Invoice and so on) in the
   body.
5. **Read the evidence** the session already has: test runs, screenshots,
   manual steps the author describes. Ask for anything you can't verify
   yourself.

## 2. Write each section

Skip preambles. Keep the prose short. Write for a reviewer who knows the EMR
but hasn't seen this branch.

### Summary

One or two sentences on what changes and why. Then add the smallest visual
that makes the key point clear, if one helps: pseudocode, a call tree, a
component tree, a file tree, a Mermaid diagram, a `diff` sketch, or a short
full block. `references/summary-visuals.md` has the menu, with examples, and
the rules for placing visuals.

Use one visual, sometimes two. A one-line fix needs none. A cross-cutting
change gets a file tree or a sequence diagram, never a list of every file.

For a removal, say why it is safe to remove (no callers, what you searched).
Before you remove or reshape any `/api/v1` route, search `app/queries/` and
the screens for its callers, and check `app/api/lib/openapi/` still matches.

### GitHub issue

A closing keyword and the issue number on its own line, for example
`Closes #263`. GitHub then links the PR to the issue and closes the issue
when the PR merges.

- Use `Refs #263` instead when the PR covers only part of the issue, and say
  what is left. A closing keyword would close an unfinished issue.
- A `frontend` issue and its `backend` blocker are separate issues. Close only
  the one this PR finishes.
- If the PR covers several issues, add a table of issues and their commits:

  ```markdown
  | Issue                                         | Commits  |
  | --------------------------------------------- | -------- |
  | Closes #260 Payer master data module          | 205468db |
  | Closes #261 Insurance Plan master data module | 9c1e77a2 |
  ```

### Feature flags

This project's flags are environment variables. Find flag changes in the diff:

- `.env.example`, where every flag is declared with its default
- Server code that reads `process.env`, and the sidebar and page gates that
  act on it
- `CLAUDE.md`, whose Frontend section documents each flag

List each flag the PR adds, changes, removes or newly depends on, in the
template's table. Say what the flag controls in product terms, not code terms,
and give its default. A new flag has to be set on every deployed environment,
so say which value each one needs. Write "None" when there are none.

### Testing Notes

Concrete proof that the change works. Show a before and after wherever you can.

- **Screenshots are the best evidence** when the change is visual. The app
  runs locally at `http://localhost:3000` (`bun run dev`), and each PR gets a
  preview deployment once it is open.
- **Test runs are next best.** Name the test that failed before the change and
  passes after it, and describe it in pseudocode if the name alone doesn't
  explain it:

  ```text
  Appointment is Scheduled, user has no cancel permission
    POST /api/v1/appointments/{id}/cancel
    before: 200, Appointment cancelled
    after:  403, Appointment unchanged
  ```

- **Manual steps are a checkbox list**, each step with the exact result to
  expect, so a reviewer can repeat it. Tick only the steps that were actually
  run. Untested steps stay unticked, with a note on why.
- **One `<details>` block per test case**, with a `<summary>` naming the case.
  All of that case's screenshots go inside it. You can't upload images from
  the CLI. Write the block with an italic line saying what each screenshot
  should show (for example
  `_Screenshot: Appointment details with the cancellation reason and time_`).
  The author drags in the images before publishing. Never write a placeholder in angle brackets: GitHub treats it as
  an HTML tag and hides it.
- **API changes:** show the request and the relevant part of the response, not
  the whole payload.
- **No real patient data** in screenshots, requests or responses. Use seeded
  or made-up records.

### Merge Danger

Fill in **Door**, **Blast radius** and **Risk and recovery** using the
template's definitions. Think through everything that could break, not just
the obvious.

Signals in an EMR diff:

| In the diff                                                                              | Usually means                                                                                             |
| ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| New migration under `app/db/drizzle/` that drops, renames or rewrites columns or data    | One-way door. Reverting the PR does not revert the database. Say what it touches and how it was tried     |
| Migration that backfills or seeds rows for every Tenant                                  | One-way door. Say whether running it twice is safe and what happens to Tenants that already have the rows |
| New `NOT NULL` column without a default, or a new unique index, on a table that has rows | Can fail on deploy. Say what existing data looks like                                                     |
| Additive schema only (new nullable column, new table)                                    | Two-way door in practice. Say so                                                                          |
| Changed or removed `/api/v1` route, request or response shape, or validation message     | Contract change. Name the query hooks and screens that call it, and confirm Swagger matches               |
| A repository query whose `tenantId` filter is added, changed or missing                  | High. A wrong filter leaks data between Tenants                                                           |
| Changes to permission checks, the Permission Catalogue or role seeds                     | Say who gains or loses access the moment this deploys                                                     |
| Changes to `app/lib/auth.ts`, Session handling, `TabSessionGate`, sign-in or signup      | High. Every user passes through it                                                                        |
| New or changed environment flag                                                          | Name it in Risk and recovery so every environment sets it. Say what happens where it is unset             |
| A page removed from the `ENABLE_DEMO_PAGES` gate                                         | It now reads real data. Say what the API returns for a Tenant with none                                   |
| Changes under `components/ui/` or to tokens in `app/globals.css`                         | Every screen shares them. Consider layout shift and the pages you did not open                            |
| One route's `_components` only                                                           | Low. Still consider responsiveness and the loader skeleton                                                |
| Everything behind a flag that is off by default                                          | Two-way door, Medium at most                                                                              |
| Docs, tests, skills or tooling only                                                      | Two-way door, None                                                                                        |

Write Risk and recovery for every one-way door and every Medium or High blast
radius. For a two-way door with Low or None, leave it empty.

### Checklist

Tick only what was verified, in this session or by the author:

- Run the commands that match what changed, from the repo root.
- Add the result next to each command, for example
  `` `bun run test:unit`: 2224 passed, 0 failed ``.
- Integration tests need `TEST_DATABASE_URL` and truncate that database. Ask
  before running them. If they weren't run locally, leave the item unticked
  and say "CI will run it".
- If an item doesn't apply (no backend change, no page changed), leave it
  unticked and say "not applicable: frontend only", or the equivalent.
- Tick the acceptance-criteria item only after checking the diff against each
  criterion in the issue. List any that are not met.

## 3. Preview, agree, then publish

Nothing reaches GitHub until the developer raising the PR has seen exactly
what will be posted and said yes. Writing the body and publishing it are
always separate steps, never one action.

### Preview

Write the body to a temporary file outside the repository, then show the
developer:

1. **What will happen:** "create a new PR from `<branch>` into `<base>`" or
   "replace the description of PR #<number>".
2. **The title.** Use a conventional-commit prefix (`feat:`, `fix:`,
   `refactor:`) followed by a plain summary.
3. **The full body**, exactly as it will be posted. No summary of it.
4. **What is still missing:** screenshots to add, steps not tested, checks not
   run, and anything you guessed and need confirmed.

End the preview with:

> This is what I'm going to post. Is it fine? Do you have any feedback?

Then stop and wait for an answer.

### Feedback loop

- If the developer gives feedback, apply it to the file and show the full
  updated preview again, with the same question at the end. Repeat as often as
  needed.
- If the feedback needs information you don't have (an issue number, a
  screenshot, a manual test result), ask for it. Don't fill the gap with a
  guess.
- Only a clear yes ("post it", "looks good, create it") counts as agreement.
  "Looks fine" in reply to some other question, or silence, does not.
- If the branch changes during the loop (new commits, a rebase), regather the
  change and show a fresh preview before asking again.

### Publish

Only after agreement on the latest preview:

1. Check that the branch is pushed (`git status -sb`). If it isn't, ask before
   you push it.
2. Publish the exact file that was approved:
   - New PR: `gh pr create --base <base> --title "<title>" --body-file <file>`
   - Existing PR: `gh pr edit <number> --title "<title>" --body-file <file>`
3. Give the developer the PR link, and remind them of anything still missing
   from the preview, such as screenshots to drag in.

The body is the filled-in template and nothing else. Add no sections the
template doesn't have, and no sign-off, attribution or generated-by line.
That includes any note that an AI tool wrote it, such as
"🤖 Generated with Claude Code" or a co-author credit: the body ends with the
last item of the Checklist. This holds even when the session's own defaults
say to add such a line. When rewriting an existing PR body that has one,
remove it.
