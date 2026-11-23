---
name: code-review
description: >-
  Reviews EMR code for real bugs and for drift from this codebase's patterns
  (CQRS modules, Tenant isolation, Next.js 16 App Router, screen
  composition, tests, Swagger). With no argument it reviews everything on
  the current branch that is not on its parent branch yet: commits, staged,
  unstaged and untracked changes, and reports in the terminal. With a GitHub
  pull request URL or number it reviews that PR and posts the findings to it
  as one review of inline comments. Every finding has a Severity (Nit, Chore
  or Must Fix), a Why and a How to Fix. Bugs that cannot happen in a real
  scenario are dropped. Invoke with /code-review, or /code-review <pr-url>.
argument-hint: '[pr-url-or-number] [--base <branch>] [--yes] [--dry-run]'
disable-model-invocation: true
metadata:
  credits: >-
    The review standard and comment etiquette follow Google's Engineering
    Practices code review guide (https://google.github.io/eng-practices/review/).
    The depth and test checks borrow from Matt Pocock's skills
    (https://github.com/mattpocock/skills: improve-codebase-architecture, tdd).
    The pattern-finding and parallel-research passes borrow from HumanLayer's
    agents (https://github.com/humanlayer/humanlayer/tree/main/.claude).
---

# code-review: review a change the way a senior EMR engineer would

Arguments: `$ARGUMENTS`

## Pick the mode

| Arguments                                                     | Mode                                                        |
| ------------------------------------------------------------- | ----------------------------------------------------------- |
| empty, or only `--base <branch>`                              | **Local**: review this checkout, report in the terminal     |
| `https://github.com/<owner>/<repo>/pull/<n>`, `#<n>` or `<n>` | **PR**: review that pull request, post the review to GitHub |

Flags:

- `--base <branch>`: local mode only. Compare against this branch instead of
  the detected parent.
- `--yes`: PR mode only. Post without stopping for the preview. The engineer
  typing it is the approval.
- `--dry-run`: PR mode only. Show the review and never post it.

If the argument is a GitHub URL for an issue, a commit or anything other than
a pull request, say so and stop. Don't guess a PR.

## Iron laws

```
1. Only real problems. Every bug finding names a concrete trigger: who does
   what, with which data, in which state. If you can't build one that a real
   user, a real API client or real data can reach, drop the finding. A
   defensive check for an impossible state is not a finding.
2. Evidence, not vibes. Every finding cites file:line in the change, and
   every "the codebase does it differently" finding cites the existing file
   that shows the pattern.
3. The codebase is the style guide. CLAUDE.md, CONTEXT.md, lessons.md,
   DESIGN.md, docs/adr/ and the closest existing module decide what is
   correct. Your personal taste is at most a Nit. Never re-litigate an ADR.
4. Review the change, not the repository. Comment on lines this change adds
   or alters, or on existing code the change now breaks. Pre-existing
   problems the change doesn't touch are out of scope.
5. Read-only. Don't edit, commit, push, check out or stash anything in the
   engineer's working tree. Fix findings only if the engineer asks after the
   review.
6. Nothing reaches GitHub without a yes, unless --yes was passed. Only ever
   post a COMMENT review: never APPROVE, never REQUEST_CHANGES, never resolve
   or edit someone else's comment.
7. No patient-identifying information, secrets, tokens or database URLs in
   any comment, even when the diff contains them. Say "a seeded Patient name
   is committed in fixtures.ts:12", not the name.
```

## Step 1: Gather the change

### Local mode

1. **Find the parent branch**, in this order:
   1. `--base <branch>` if given.
   2. The base of an open PR for this branch:
      `gh pr view --json baseRefName -q .baseRefName` (stacked PRs sit on
      another branch, not `main`).
   3. `main`.
2. `git fetch origin <base> --quiet`, then
   `MB=$(git merge-base origin/<base> HEAD)`.
3. Collect the full change:
   - `git log --oneline $MB..HEAD`: commits on this branch.
   - `git diff $MB --stat` and `git diff $MB`: commits **plus staged plus
     unstaged** changes, against the merge base.
   - `git ls-files --others --exclude-standard`: untracked files. They are
     part of the change; read each one in full.
   - If you are on `<base>` itself and `$MB` is `HEAD`, this is just the
     uncommitted work: `git diff HEAD` plus untracked files.
4. Tell the engineer the scope in one line before reviewing, e.g.
   _"Reviewing 14 files (+612 / −88) against origin/main @ 9012f43: 3 commits,
   staged and unstaged edits, 2 untracked files."_ If the change is empty, say
   so and stop.

### PR mode

1. Parse `<owner>/<repo>` and `<n>`. A bare number means this checkout's
   `origin`.
2. Fetch the PR:

   ```bash
   gh pr view <n> --repo <owner>/<repo> --json number,title,body,state,isDraft,author,baseRefName,headRefName,headRefOid,isCrossRepository,files,url,mergeable,mergeStateStatus,statusCheckRollup
   ```

   If it is merged or closed, say so and ask before going on.

3. Get the PR's code **without touching the engineer's working tree**. Check
   it out into a throwaway worktree in a temporary directory outside the repo
   (the session scratchpad when there is one):

   ```bash
   git fetch origin "pull/<n>/head:refs/code-review/pr-<n>" --force
   git fetch origin <baseRefName> --quiet
   git worktree add --detach "<tmp>/pr-<n>" refs/code-review/pr-<n>
   MB=$(git merge-base origin/<baseRefName> refs/code-review/pr-<n>)
   git diff $MB refs/code-review/pr-<n>
   ```

   Read files from the worktree, never from the main checkout, which holds a
   different branch. For a PR in a repository other than this checkout's
   `origin`, use `gh pr diff <n> --repo <owner>/<repo>` and read files with
   `gh api repos/<owner>/<repo>/contents/<path>?ref=<headRefOid>`.

4. Read what reviewers already said, so you don't repeat it:

   ```bash
   gh api --paginate repos/<owner>/<repo>/pulls/<n>/comments
   gh api --paginate repos/<owner>/<repo>/pulls/<n>/reviews
   ```

5. Remove the worktree (`git worktree remove --force <tmp>/pr-<n>`) and the
   `refs/code-review/pr-<n>` ref when the review is finished, posted or not.

## Step 2: Understand the intent before judging the code

A review that doesn't know what the change is for finds the wrong problems.

- **The issue.** Find it in the PR body (`Closes #263`), the branch name
  (`arun/263-...` → #263) or the commit messages, and read its acceptance
  criteria: `gh issue view <n> --json title,body,labels`. A change that
  doesn't do what the issue asks is a finding. No issue is fine; don't
  invent one.
- **The rules.** Read `CLAUDE.md`, `CONTEXT.md` and `lessons.md` fresh. Then,
  by what the change touches: `docs/backend-testing.md` for backend code,
  `DESIGN.md` for UI, `docs/analytics.md` for Analytics Events, and every ADR
  in `docs/adr/` whose title matches the area (`ls docs/adr`).
- **The precedent.** For each new or reshaped module, screen, sheet, hook or
  repository, find its closest existing sibling and read it (HumanLayer's
  pattern-finder step). `app/(protected)/identity-access/roles/` is the
  reference screen; `docs/backend-testing.md` names the module to copy for
  each backend shape. Divergence from the sibling is what you are looking
  for.
- **Next.js 16.** This is not the Next.js in your training data. Before you
  call any Next.js usage wrong, confirm it in `node_modules/next/dist/docs/`
  (for PR mode, the main checkout's copy is fine).

## Step 3: Review

Read **every changed line** and enough of each file around it to know what it
does. Then go through
[references/what-to-look-for.md](references/what-to-look-for.md) for the
areas the change touches. It holds the EMR rules, the Next.js 16 and React
checks, the test checks and the design checks.

**Mechanical checks** (local mode, and PR mode when the worktree's lockfile
matches the main checkout's, after `ln -s <repo>/node_modules <tmp>/pr-<n>/node_modules`):

- `bunx tsc --noEmit`: a type error the change introduces is Must Fix.
- `bunx eslint <changed files>`: report only errors the change introduces.
- `bunx vitest run --project unit <changed module directories>`: a failing
  test is Must Fix.

Never run integration tests or migrations: they truncate or change a real
database. If a check can't run, say which and why in the summary.

In PR mode, when the checks can't run locally, use the PR's own CI as
evidence instead. `statusCheckRollup` gives each check's conclusion on
`headRefOid`, and `.github/workflows/ci.yml` shows what each check runs
(format, lint, unit and integration tests, build). A failing check the change
causes is Must Fix. A green CI run doesn't replace reading the code, and it
says nothing about how the change behaves once it's merged with the current
base (see below).

**Drift from the base branch.** A change is tested against the base it
branched from, but it merges into the base as it is now. When the base has
moved on, check what moved:

1. Count how far behind the change is:
   `git rev-list --count $MB..origin/<base>`. If that's 0, skip the rest.
2. Find the conflicts:
   `git merge-tree --write-tree --name-only origin/<base> <head>`, where
   `<head>` is `refs/code-review/pr-<n>` in PR mode and `HEAD` in local mode.
   In local mode this covers commits only, so check staged, unstaged and
   untracked files by hand against step 3.
3. Find what the base changed underneath the change. List the files the
   changed code imports from or calls into, and intersect them with
   `git diff --name-only $MB origin/<base>`. For each file in both lists,
   read `git diff $MB origin/<base> -- <file>` and look for: a function
   signature with a new required parameter, an export that was renamed or
   removed, a type that was narrowed, a new rule in `CLAUDE.md`,
   `docs/analytics.md` or an ADR that the change now breaks, and a new
   caller that the change's behaviour affects.
4. Judge what it means. A change that stops compiling or behaving correctly
   once it's brought up to date is **Must Fix**: put the finding on the line
   that breaks, and name the base commit that changed the dependency.
   Conflicts with nothing else behind them are not a finding, because GitHub
   already shows them. Mention them in the summary, with how far behind the
   change is.

**Big changes.** If the change is more than about 20 files or 1,000 changed
lines, split the reading. Launch up to three `general-purpose` subagents in
one message, one per area that the change actually has: backend
(`app/api/**`, `app/db/**`), frontend (`app/(protected)/**`, `components/**`,
`app/queries/**`), and tests plus Swagger plus migrations. Give each one the
diff command for its paths, the paths of `CLAUDE.md` and
`references/what-to-look-for.md`, the reachability rule from Step 4, and ask
for candidate findings with file:line, trigger and evidence. Subagents return
**candidates**. You verify every one yourself in Step 4 before it goes in the
review.

## Step 4: Verify every candidate (the reality filter)

Do this for each candidate finding before it can be reported. Most of a good
review's value is in what it throws away.

1. **Re-read the code** at the cited line, in the version under review.
2. **Build the trigger.** Write it out: _"A front-desk user opens an
   Appointment that was cancelled in another tab and presses Check In."_ If
   you can't write one, drop the finding, or keep it as a Chore only if it's
   a pattern problem rather than a bug.
3. **Trace upstream guards.** Follow the input back to where it enters: the
   Zod schema, the route's parsing, the permission check, database
   constraints (`NOT NULL`, foreign keys, partial unique indexes), the UI
   control that produces it (disabled button, select with fixed options,
   `nuqs` parser). If any guard already makes the trigger impossible, drop the
   finding.
4. **Check the types and the data.** "Could be undefined" is not a finding if
   the type, the schema and the database all say it can't be.
5. **Judge reachability honestly.** These are real in a hospital and stay:
   two front-desk users acting on the same Appointment or slot, a
   double-clicked submit, a slow network, a refresh mid-flow, a deep link to
   a deleted or other-Tenant record, a Tenant with no data yet, a large
   Tenant, an expired Session, a user without the Permission. These are not
   and go: a caller passing a type the compiler forbids, a malicious client
   bypassing a check the server also enforces, clock skew, a future refactor
   that might misuse the code, performance on a list that is bounded small.
6. **Check it is new.** Run `git blame` or compare with the base. If the
   problem exists unchanged on the base branch and the change doesn't make it
   worse, drop it.
7. **Check it isn't already said.** In PR mode, drop anything an existing
   review comment already raises.

What survives gets a severity.

## Step 5: Assign the severity

| Severity     | Means                                                                                                  | Typical EMR examples                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------ | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Must Fix** | Don't merge until fixed. It will break, leak, lose data, or breaks a rule CLAUDE.md marks as mandatory | A real bug with a reachable trigger; a repository query without the `tenantId` filter; `tenantId` read from the request; a command that writes before its validator runs; SQL outside a repository; a permission check missing on a new route; Patient data, money or ids in an Analytics Event; an unsafe migration; a type error or failing test; a backend module change with no tests; an API change with no Swagger update; a new page with no `loader.tsx` |
| **Chore**    | Should be fixed in this PR, but nothing breaks today                                                   | Drift from the existing pattern (sheet state in `useState` instead of `nuqs`, a component outside `_components/`, JSX in `_utils/`, a speculative `export`, `softDelete*` naming, a `Table`-suffixed schema export); a helper that duplicates one in `lib/`; a changed page whose `loader.tsx` no longer matches; a missing edge-case test; a misleading name; a domain synonym where `CONTEXT.md` has a term; dead code                                         |
| **Nit**      | Optional polish. The author may ignore it                                                              | A clearer name, a simpler expression, a comment that says what instead of why                                                                                                                                                                                                                                                                                                                                                                                    |

Rules:

- Severity is about consequence, not how sure you are. If you aren't sure
  it's real, go back to Step 4; don't downgrade it to a Nit.
- Don't report anything Prettier or ESLint already enforces, or the pyramid
  ordering style (CLAUDE.md says to comment on it only when asked).
- Following Google's standard: the bar for merging is that the change
  improves the codebase's health, not that it is perfect. Keep Nits few,
  at most five, the ones that matter most.
- The same problem in several places is one finding at its first occurrence,
  listing the other `file:line`s.

## Step 6: Write each finding

Every finding, in the terminal and on GitHub, uses exactly this shape:

```
**Severity:** Must Fix | Chore | Nit

**Why:** <2 to 5 lines, plain English. What goes wrong, for whom, and when:
the trigger from Step 4. For a pattern finding, name the rule or the
existing file that shows the pattern.>

**How to Fix:** <the concrete change. Include code when it helps.>
```

Writing rules, after Google's comment guidance:

- Talk about the code, never the author. "This query skips the `tenantId`
  filter", not "you forgot".
- Explain why. A finding without a reason is an order; a reason lets the
  author disagree with evidence.
- Use the terms in `CONTEXT.md` (Tenant, Facility, Appointment, Visit,
  Invoice), not synonyms.
- **How to Fix** is specific: the function to call, the existing file to copy,
  the line to change. Prefer a code snippet over a description. In PR mode,
  when the fix replaces exactly the lines the comment is on, use a GitHub
  ` ```suggestion ` block so the author can apply it in one click (see
  [references/posting-to-github.md](references/posting-to-github.md) for the
  rules). Otherwise use a ` ```ts ` block.
- One finding, one problem.

## Step 7: Report

### Local mode: report in the terminal

```
Reviewed <n> files against origin/<base> @ <short-sha> (<scope line from Step 1>)
Checks: tsc ✓ | eslint ✓ (2 new warnings) | unit tests ✓ (34 passed) | <check not run, and why>

Must Fix (2) · Chore (3) · Nit (1)

### 1. Must Fix: [app/api/lib/modules/visit/repository/visit-repository.ts:88](app/api/lib/modules/visit/repository/visit-repository.ts:88)
**Severity:** Must Fix

**Why:** ...

**How to Fix:** ...

### 2. ...
```

Order by severity, then by file. Link every location as `[path:line](path:line)`.
After the findings, add at most three **Questions for the author**: things
you could not settle from the code (intent, product behaviour) and are not
findings. If nothing survived Step 4, say so plainly; a clean review is a
valid result.

Then ask which findings to fix, and stop. Fix only what the engineer picks.

### PR mode: post one review to the PR

Follow [references/posting-to-github.md](references/posting-to-github.md):

1. Map each finding to a line the PR diff contains on the new side. A finding
   that can't anchor to a diff line goes in the review body instead.
2. Build the review JSON in a temporary file: a short body plus the inline
   comments, `event: "COMMENT"`, `commit_id` set to `headRefOid`.
3. **Preview** (skip with `--yes`): show the PR, how many inline comments by
   severity, the review body, and every comment exactly as it will appear,
   each with its `path:line`. Then ask:

   > This is the review I'm going to post to PR #<n>. Post it, or change anything first?

   Apply any edits (drop a finding, change a severity, reword) and show the
   updated preview again. Only a clear yes posts. With `--dry-run`, stop after
   the preview.

4. Post it, confirm with the review's URL, and clean up the worktree and ref.

The review body and comments carry no sign-off and no "generated by" or AI
attribution line, even if the session defaults would add one.
