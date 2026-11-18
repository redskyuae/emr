# Ticket format

The reader is a developer or coding agent who was not in the conversation and may pick the ticket up weeks later. The body has to carry both halves: the business decisions, which they cannot rediscover from the code, and your analysis of how it fits the system, which saves them repeating your research.

## Title

A short noun phrase in glossary terms that says what will exist when the ticket is done, for example `Insurance Plan master data module` or `Visit coverage selection at check-in`. No `Feature:` or `[BE]` prefixes; the labels carry that. For a bug, describe the wrong behaviour: `Rota with duplicate time range is saved instead of rejected`.

## Body

```markdown
## Parent

#<n>

## Why

Who needs this, what they cannot do today, and what it is for.

## What to build

The behaviour end to end, from the user's point of view.

## Business rules

- One rule or exception per line.

## Implementation notes

- What exists today that this builds on.
- The existing feature to copy.
- What data is added or changed, and who may do what.
- ADRs that apply.

## Acceptance criteria

- [ ] One independently checkable outcome per line.

## Out of scope

- What this ticket deliberately does not do.

## Blocked by

- #<n>
```

## Writing each section

**Parent.** Only on a child ticket; omit the section otherwise. The child is also attached to the parent as a GitHub sub-issue, see [MULTIPLE-TICKETS.md](./MULTIPLE-TICKETS.md).

**Why.** Two to four sentences in the requester's terms. On a parent ticket this is the full business requirement; children can keep it to a sentence and rely on the parent. A backend and frontend pair has no parent, so both tickets carry it.

**What to build.** Describe what a person can do and see once this is done, using `CONTEXT.md` terms, bolded on first use. This is a description of behaviour, not a list of layers.

**Business rules.** Every rule, limit and exception the requester decided, including the ones they accepted from your recommendations. Nothing from the interview may be lost here: this is the one section the implementer has no other source for. When the work is split by layer, each ticket lists every rule its implementer needs. A rule both layers enforce, such as a length limit or who may perform an action, appears in both; a rule only one layer acts on appears only there. Never write "see the other ticket" in place of a rule.

**Implementation notes.** Your analysis from the codebase. Name modules, entities, screens, permissions and behaviours, and name the existing feature that is the closest model. Leave out file paths, line numbers and step-by-step edits: tickets wait in the backlog while files move, and the implementer will explore the code fresh. Record engineering choices you made on the requester's behalf, so a reviewer can see them. Call out a new glossary term or a decision that deserves an ADR.

**Acceptance criteria.** Outcomes someone can check one by one, covering the business rules and the project's standing obligations for that layer as set out in `CLAUDE.md`. For backend work that usually means tenant-filtered access, colocated tests for every layer, and Swagger/OpenAPI updated; for frontend work, the page-shaped loader skeleton and the screen composition rules. Include only the ones that apply. Add `CONTEXT.md` updated when the ticket introduces a term or changes what an existing one means.

**Out of scope.** What the requester set aside and what a reasonable implementer might otherwise assume is included.

**Blocked by.** Issue numbers that must land first, or `None, can start immediately`.

## Bugs

Same format, with **Why** replaced by **Current behaviour** (what happens, and how to see it) and **What to build** replaced by **Expected behaviour**. Label it `bug` alongside the layer label.
