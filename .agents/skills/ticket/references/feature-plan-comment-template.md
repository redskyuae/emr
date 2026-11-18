# GitHub comment templates: feature path

The reader may be QA, a designer or the person who raised the issue, not the
engineer. Keep it shorter than the terminal plan, and put behaviour before
implementation.

Rules:

- No patient-identifying information (names, MRNs, phone numbers, Emirates
  IDs, dates of birth). Use roles and Tenant or Facility IDs.
- No secrets, tokens or database URLs.
- File paths only where they help a reader (`app/...`), never local absolute
  paths.
- Only @-mention someone if the engineer asked you to.

## Implementation plan (F4)

```markdown
## Implementation plan

**Summary:** <one or two sentences: what will be built and the problem it solves>

**Environment flag:** <`FLAG_NAME` and its default / none>

### Acceptance criteria

- [ ] <AC1>
- [ ] <AC2>

### Approach

<3-6 sentences in plain language. Name what is extended and what is new.>

### What changes

- **API:** <routes added or changed, or "none">
- **Screens:** <screens added or changed, or "none">
- **Data:** <new tables/columns and the migration, or "no schema change">

### Delivery steps

1. <slice name>: <what it delivers>
2. ...

### Out of scope

- <...>

### Decisions and assumptions

- <decision> (<source: issue / parent #100 / ADR 0026 / engineer>)

### Open questions

- <or "None">

_Planned with `/ticket`, reviewed by <engineer>._
```

## Product questions (F2, when the engineer can't answer them)

```markdown
## Questions before implementation

While planning this issue we found a few things the issue and its parent don't settle:

1. **<question>**
   Options: <A> / <B>. We'd suggest <A> because <reason>.
2. ...

We'll <pause until these are answered | proceed with the suggested answers unless we hear otherwise>.

_Raised with `/ticket` by <engineer>._
```

## Implemented (F8, optional)

```markdown
## Implemented

Implemented per the plan above in #<pr-number>.

**Deviations from the plan:** <none / list, with the reason>
**Follow-ups:** <none / list>
```
