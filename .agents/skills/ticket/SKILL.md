---
name: ticket
description: >-
  Conversational work on a GitHub issue against the EMR codebase. Takes an
  issue number or URL and classifies it as a bug or a feature request. For a
  bug: finds the evidence-backed root cause, agrees a fix plan with the
  engineer and posts the analysis to the issue. For a feature: gathers full
  context (parent issue, sub-issues, blockers, ADRs, mockups, existing code),
  asks instead of assuming, agrees and posts an implementation plan, then
  implements it in one shot or slice by slice with a review checkpoint after
  each slice. Once the engineer has reviewed the change, it commits on their
  yes and opens the pull request by following the pr skill. Invoke with
  /ticket <issue-number-or-url>.
argument-hint: '[issue-number-or-url]'
disable-model-invocation: true
---

# ticket — from a GitHub issue to an agreed root cause or a planned feature

A conversation, not a pipeline. The engineer decides; every stage ends at a
checkpoint where you stop and wait for them.

Stages 0–1 are shared. After classification, a **bug** continues with Stages
2–6 below, and a **feature** continues in
[references/feature-development.md](references/feature-development.md).

**Division of labour.** You (the main session) own the conversation: fetching
the issue, classifying it, presenting findings, iterating, and posting to
GitHub. The deep investigation runs in the **`bug-investigator`** subagent
(`.claude/agents/bug-investigator.md`), which is pinned to Opus at high
effort whatever model this session is on. Don't investigate inline yourself.

The issue reference is whatever was passed with the command.

For a bug, copy this checklist into the conversation and tick it as you go.
The feature path has its own checklist.

```
- [ ] 0 Issue fetched (body, comments, relations)
- [ ] 1 Classified and confirmed with the engineer
- [ ] 2 bug-investigator dispatched and report received
- [ ] 3 Diagnosis and fix plan presented
- [ ] 4 Engineer agreed (or chose to stop)
- [ ] 5 Comment approved and posted
- [ ] 6 Handed off
```

## Iron laws

```
1. No issue, no work. If there is no GitHub issue number or URL, ask for one
   and stop.
2. Evidence before conclusions. Every root-cause claim cites file:line, a log,
   a query result, a failing test, or a git commit. A claim with no evidence is
   labelled a hypothesis, with a confidence level. "Inconclusive" is an
   acceptable answer; a confident guess is not.
3. Root cause, not symptom. Name the symptom, the trigger, and the root cause
   separately. "Add a null check" is a symptom fix unless you can say why the
   value is null.
4. Bug path: investigate, don't implement. Stages 2-5 write NO production code
   and open no branch. The fix starts only if the engineer asks for it at
   Stage 6. Feature path: no code before the engineer approves the plan.
   Neither path commits or pushes without the engineer's yes, and the pull
   request is always opened by following the pr skill, never with a bare
   `gh pr create` (see F8 in feature-development.md).
5. Nothing leaves the terminal without an explicit yes. Show the exact GitHub
   comment first; post only after the engineer approves that text.
6. No patient-identifying information in the analysis or the comment: no
   names, MRNs, phone numbers, Emirates IDs, dates of birth or addresses.
   Refer to people by role ("a front-desk user in Tenant 12"). No secrets,
   tokens or database URLs either.
7. Blameless. Describe what the code and process did, never who got it wrong.
```

## Stage 0 — Get the issue

1. Take the issue from the command argument. Accept a URL
   (`https://github.com/<owner>/<repo>/issues/123`), `#123`, or a bare `123`.
2. If it is empty or not recognisable as a GitHub issue, ask exactly:

   > Hey, the GitHub issue is missing. Can you give me the issue number or URL?

   Then stop and wait. Do not guess an issue or search for one.

3. Fetch it with `gh`:

   ```bash
   gh issue view <n> --json number,title,body,state,stateReason,labels,assignees,author,milestone,issueType,parent,subIssues,blockedBy,blocking,closedByPullRequestsReferences,comments,url
   ```

   Read the body, **all comments**, and the relations. Then check three things
   and say so if any applies, before going further:
   - The URL points at a different repository from this checkout's `origin`.
   - The number is a pull request, not an issue.
   - The issue is closed, or already has an open pull request that closes it.

   If `gh` is missing or not signed in, say so and ask the engineer to run
   `gh auth login`, or to paste the issue text. Don't proceed on a guessed
   issue.

## Stage 1 — Classify, then confirm

Classify as **Bug**, **Feature request**, or **Unclear**:

| Signal                                                                                  | Leans                                        |
| --------------------------------------------------------------------------------------- | -------------------------------------------- |
| "used to work", error or stack trace, wrong data, crash, regression, `bug` label        | Bug                                          |
| "as a user I want", new capability, new screen/field/Master, `enhancement` label        | Feature                                      |
| Body has **Current behaviour** / **Expected behaviour** (the `/create-ticket` bug form) | Bug                                          |
| Body has **Why** / **What to build** / **Business rules** (the `/create-ticket` form)   | Feature                                      |
| An improvement to behaviour that works as designed                                      | Feature (say so — it's often filed as a bug) |
| Too little information to tell                                                          | Unclear                                      |

Present a short read-back so the engineer can catch a misread issue early:

```
#123 — <title>
Type: Bug (confidence: high) — <one-line reason>
Layer: backend | frontend | no layer label
Symptom as reported: <one or two sentences, in your words>
Expected vs actual: <expected> / <actual>
Environment / scope: <which screen or API? which role? behind an environment flag? since when?>
Blocked by: <open blocking issues, or "nothing">
Missing from the issue: <repro steps, role, screenshots, Tenant setup...>
```

Ask: _"Is that the right read? Anything the issue doesn't say that I should
know?"_ Wait for the answer.

- **Bug** → Stage 2.
- **Feature request** → follow
  [references/feature-development.md](references/feature-development.md)
  from F1. Its context gathering goes well beyond this issue (parent,
  sub-issues, blockers, ADRs, code), so don't plan from the read-back alone.
- **Unclear** → list the questions that would decide it; offer to draft them
  as a comment on the issue (same approval rule as Stage 5).

## Stage 2 — Dispatch the investigation

Launch the `bug-investigator` subagent with the Agent tool. It doesn't see
this conversation, so its prompt must stand on its own. Include:

- Issue number, title, state, labels, and the **full body and all comments**,
  verbatim
- The confirmed read-back from Stage 1
- Everything the engineer added in Stage 1 (extra context, corrections, hunches)
- The current branch, and anything already known (suspect files, dates, roles, flags)

Tell the engineer it's running, e.g. _"Handing this to the bug-investigator
(Opus). It'll take a few minutes."_, and wait for it to finish. Remember its
agent ID or name; Stage 4 resumes the same agent.

If the Agent tool or the `bug-investigator` type isn't available, say so and
offer to investigate inline instead, following
[references/bug-investigation.md](references/bug-investigation.md), on
the session model. Only do that if the engineer agrees.

## Stage 3 — Present the diagnosis and the fix plan

Check the report before presenting it. Don't pass it through unread:

- Does every root-cause claim have evidence? Spot-check one or two `file:line`
  references with Read.
- Does the root cause explain every symptom in the issue?
- Is the stated confidence consistent with how it was reached?

Don't quietly correct gaps. Say what's weak, or resume the agent to close
them. If the agent listed **Needs from the engineer**, ask those questions first.

Present in this shape, in the terminal:

```
Root cause (confidence: high | medium | low)
  <2-4 sentences. What is wrong in the code, and why it produces the symptom.>

Evidence
  - <file:line — what it shows>
  - <commit / log / test / query — what it shows>

Symptom → trigger → root cause
  Symptom: <what the user sees>
  Trigger: <the condition that makes it happen now>
  Root cause: <the defect that turns the trigger into the symptom>
  Contributing factors: <what let it ship or made it worse — missing test, missing validation, unclear contract>

Hypotheses checked
  - <hypothesis> — confirmed | refuted | untested — <evidence>

Since when: <commit/PR that introduced it, or "long-standing">
Blast radius: <who/what else is affected — other routes, screens, Tenants, data already written wrong>

Proposed fix
  1. <change, with the file(s) it touches>
  2. <regression test that fails before the fix and passes after: what it asserts, which *.unit.tests.ts or *.integration.tests.ts file>
  3. <data repair, migration or flag — only if needed>
  Alternatives considered: <option — why not>
  Risk: <what could break; how we'd notice>

Open questions: <anything that still needs a human or more data>
```

If confidence is below high, say what evidence would raise it and offer to
send the agent to get it.

Then ask, in plain words: _"Do you agree with this root cause and plan? I can
dig further, change the plan, or draft it as a comment on #123."_

## Stage 4 — Iterate

Take the engineer's pushback seriously: re-check the evidence rather than
defend the first answer. For anything beyond a quick lookup, **resume the
same `bug-investigator`** with SendMessage (it keeps its full investigation
context), passing the engineer's objection or new information verbatim.
Start a fresh agent only if resuming fails, and give it the previous report.

Loop Stage 3 → 4 until the engineer agrees, or until they decide to stop. If
they stop without agreement, summarise what is known and what isn't, and offer
to post that instead.

## Stage 5 — Post to GitHub (only on agreement)

1. Draft the comment from
   [references/rca-comment-template.md](references/rca-comment-template.md),
   in a temporary file outside the repository. Strip patient-identifying
   information (iron law 6), secrets, database URLs and tokens.
2. Show the **exact** comment text and ask: _"Post this to #123?"_
3. Only on an explicit yes, post it:

   ```bash
   gh issue comment <n> --body-file <file>
   ```

   Don't change the issue's state, assignees, labels or milestone unless the
   engineer asks for that separately.

4. Confirm it posted, with the comment link `gh` prints.

## Stage 6 — Hand off

Tell the engineer what comes next and stop:

- Fixing is a separate step, and it is theirs to start. If they ask for the
  fix here, follow the `tdd` team skill: write the regression test from the
  agreed plan and watch it fail, make the fix, then verify it as described
  under "Verifying a slice" in
  [references/feature-development.md](references/feature-development.md).
  Leave the result uncommitted for their review.
- Point at what the fix will need, based on what the plan touches: for
  example `docs/backend-testing.md`, `lessons.md`, and the
  `tanstack-query-patterns` or `design-system` team skills.
- When a fix made here is done and verified, raise it the same way a feature
  is raised: follow "F8 — Commit and open the pull request" in
  [references/feature-development.md](references/feature-development.md).
  The engineer reviews first, the commit needs their yes, and the pull
  request goes through the `pr` skill.

Don't start implementing in this session unless the engineer explicitly asks.
