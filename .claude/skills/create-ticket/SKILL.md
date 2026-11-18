---
name: create-ticket
description: Turns a business requirement into a ready-to-build GitHub ticket for this project. Interviews the requester in business language, works out the implementation from the codebase, publishes the issue and returns the link. Runs only when the user types /create-ticket.
argument-hint: '[the requirement, in plain words]'
disable-model-invocation: true
---

# Create Ticket

Someone has a requirement for the EMR. Turn it into a GitHub ticket that a developer or coding agent who was never in this conversation can pick up and build without coming back with questions.

The conversation has two sides. Keep them apart:

- **The requester owns the business.** What the hospital needs, who does the work, what the rules and exceptions are. Only they know this, so it is the only thing you ask them about.
- **You own the engineering.** Which modules, tables, screens, permissions and patterns are involved is yours to work out from the codebase. The requester may well be an engineer; they ran this skill so they would not have to do that analysis. Never hand it back to them.

## 1. Learn the system first

Before discussing the requirement, even if it arrived with the command, get oriented so that your first question is already an informed one:

- `CLAUDE.md` for architecture and rules, `CONTEXT.md` for the glossary (use its terms exactly), `lessons.md`, and the titles in `docs/adr/`.
- What exists today: modules under `app/api/lib/modules/`, screens under `app/(protected)/`, tables under `app/db/schema/`.
- `gh issue list --state open --limit 100` for what is already planned.

You are oriented when you can say in a couple of sentences what the product does today and which areas it covers. Do not read every file; depth comes in step 3.

## 2. Get the requirement

Requirement passed with the command: `$ARGUMENTS`

If that is empty, ask for it in one line: what do they need, and who is it for? Let them describe it in their own words. Do not hand them a form to fill in.

## 3. Research the affected area

Go deep on the part of the system the requirement touches. Read the code itself, not only the documents about it. Find out:

- **What exists and how it behaves now.** Requesters often describe something as missing when half of it is built, or assume something exists when it does not.
- **The closest existing feature of the same shape**, which the implementer should copy.
- **ADRs and glossary entries** that constrain the area.
- **Overlapping tickets**: `gh issue list --state all --search "<terms>"`. If the requirement is already covered, say so and link the ticket instead of creating a duplicate.

Give this reading to a sub-agent with a fresh context (several in parallel when the areas are separate) and have it report findings with the evidence for each.

**If what they asked for already exists**, stop there. Tell the requester where it is and how it behaves today, and ask what prompted the request: perhaps it did not work for someone, they could not find it, or it falls short in a way they have not said yet. The default outcome is no ticket. Do not go looking for gaps to fill so that there is something to publish.

You should come out with a draft implementation in mind and a list of things the code could not settle. Sort that list:

- More reading would answer it: read more.
- It is an engineering choice the project's conventions already decide: decide it and record it in the ticket.
- It depends on how the hospital works: it is a question for the requester.

## 4. Ask what only the requester can answer

Work in rounds. Ask everything that can be asked now as one numbered list, give your recommended answer to each, and word it so that "yes" accepts the recommendation. Wait for the answers. They will open new questions; ask those in the next round. Hold back any question that an open one could change or make pointless, and if a single answer could redirect the whole ticket, ask that one alone first.

Some questions are open by nature ("what happened when you tried?") and have no recommended answer. Ask them plainly instead of forcing them into a yes/no.

Your recommendations settle how the requirement should work. They are not a way to add to it. When research turns up something nearby that the requester did not ask for, such as a related gap or a second feature with the same weakness, mention it once and let them decide whether it joins this ticket, gets its own, or is left alone.

Ask in business language: describe a situation at the hospital, not the structure of the system. A technical uncertainty almost always has a business question underneath it.

| You are unsure about      | Ask                                                                             |
| ------------------------- | ------------------------------------------------------------------------------- |
| Keeping history on delete | "If a discount reason is retired, should old Invoices still show it?"           |
| Scope of uniqueness       | "Can two Facilities in the same hospital group have a ward with the same name?" |
| Permissions               | "Who is allowed to do this: the front desk only, or doctors as well?"           |
| Allowed state changes     | "Once a Visit is closed, can this still be changed?"                            |

Never ask which module or domain something belongs in, how many screens it needs, what the tables, fields or types should be, how the API should look, or which component to use. If you find yourself wanting such an answer, the decision is yours.

Worth probing: who does this and at what point in their day, what triggers it, what they see afterwards, limits and rules, exceptions (missing, duplicate, late, cancelled), who must not be able to do it, what happens to records that already exist, and what is deliberately left out.

- **Use concrete scenarios.** "A patient checked in at 9:00 and the doctor becomes unavailable at 9:30. What should the front desk be able to do?" gets a better answer than an abstract question about rescheduling rules.
- **Hold the glossary.** When the requester's word conflicts with `CONTEXT.md` or could mean two things, say so and settle which one they mean.
- **Surface contradictions with the code**, in plain terms: "Today a cancelled Appointment frees the slot straight away. You described it staying blocked. Which should it be?"

Stop when everything still unknown is engineering. A small requirement may need one round or none; do not invent questions to look thorough.

## 5. Play it back

Before publishing, summarise what you understood in a few plain sentences: what will become possible, for whom, the rules, and what is left out. Then say which tickets you will create. For a long requirement, list them one plain line each, in the order they will be built, so the requester can merge, split or drop any before they exist. Keep technical detail out unless they ask for it. A published ticket is visible to the whole team, so publish only once the requester confirms.

## 6. Write and publish

Write each ticket in the format in [TICKET-FORMAT.md](./TICKET-FORMAT.md). Label it according to `docs/conventions/labels.md`: exactly one layer label plus the type labels that apply.

How many tickets:

- **One layer touched**: one ticket.
- **Both layers**: a `backend` ticket first, then a `frontend` ticket blocked by it. An issue never carries both layer labels.
- **A long requirement**: a parent ticket with the pieces as GitHub sub-issues. Follow [MULTIPLE-TICKETS.md](./MULTIPLE-TICKETS.md).

Write the body to a temporary file outside the repository and publish. `--blocked-by` records the dependency in GitHub itself, alongside the `Blocked by` section in the body:

```bash
gh issue create --title "<title>" --body-file <path> --label backend --label enhancement
gh issue create --title "<title>" --body-file <path> --label frontend --label enhancement --blocked-by <n>
```

`--blocked-by` and `--parent` are recent additions to `gh`. Before publishing a set of linked tickets, check that `gh issue create --help` lists them. If it does not, follow "Older versions of `gh`" in [MULTIPLE-TICKETS.md](./MULTIPLE-TICKETS.md). If a create command fails, do not simply run it again: the ticket may already exist without its links, so follow "If a create command fails" in the same file. A set must never be left half-published or duplicated.

Do not set assignees, milestones or projects unless asked, do not change the content of other issues, and do not start implementing.

## 7. Share the link

Reply with the URL of every ticket created, one line each saying what it covers. Give the parent first when there is one, then the rest in build order.
