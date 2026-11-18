# GitHub comment template: bug root cause

Fill this in from the agreed Stage 3 diagnosis. Keep it scannable, because
the reader may be QA or the person who reported the bug, not the engineer who
investigated.

Rules:

- No patient-identifying information (names, MRNs, phone numbers, Emirates
  IDs, dates of birth). Use roles and Tenant or Facility IDs.
- No secrets, tokens, database URLs, or raw payloads copied from a real
  environment.
- Link code with repo paths (`app/...:line`), not local absolute paths.
- Only @-mention someone if the engineer asked you to.
- If agreement was partial, keep the **Open questions** section honest.

```markdown
## Root cause analysis

**Summary:** <one sentence a non-engineer can read: what's broken and why>

**Confidence:** <High / Medium / Low> — <reproduced with a failing test | regression commit identified | traced in code, not reproduced>

### What's happening

- **Symptom:** <what users see>
- **Trigger:** <the condition that causes it>
- **Root cause:** <the defect, with `app/path/file.ts:123`>
- **Contributing factors:** <what let it ship or made it worse>

### Evidence

- `<app/path:line>` — <what it shows>
- <commit sha / PR> — <what changed>, <date>
- Ruled out: <hypothesis> — <why>

### Impact

- <who/what is affected; since when>
- <data already affected, and whether it needs a repair>

### Proposed fix

1. <change>
2. <regression test>
3. <data repair / migration / flag, if needed>

**Risk:** <what could break, and how we'll notice>

### Open questions

- <or "None">

_Investigated with `/ticket`, reviewed by <engineer>._
```
