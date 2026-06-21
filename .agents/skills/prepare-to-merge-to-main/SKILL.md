---
name: prepare-to-merge-to-main
description: Run pre-merge readiness checks before a branch is merged to main. Use when the user says "prepare to merge to main", "pre-merge check", "before PR", "before merging", or asks for branch readiness review.
---

# Prepare to Merge to Main

Run this before or after raising a PR to catch repo-specific merge blockers early.

## Quick start

```bash
bun .agents/skills/prepare-to-merge-to-main/scripts/check-api-contracts.mjs
```

If it fails, fix the reported files and rerun until clean.

## Current checklist

### API contract type boundary

Verify the `/api/v1` API contract convention:

- Every `app/api/v1/**/route.ts` has a sibling `types.ts`.
- `route.ts` does not export public request/response contract types inline.
- `route.ts` imports `NextResponse.json<T>()` response types from `./types` with `import type`.
- `types.ts` is type-only: no runtime imports, functions, constants, classes, enums, or `next/server` imports.
- TanStack Query hooks under `app/queries/` import request/response contracts from `app/api/v1/**/types.ts` instead of defining duplicate API contract types.
- No frontend code imports API contracts from `app/api/v1/**/route.ts`.

## Reporting

Report:

1. Command run.
2. Pass/fail status.
3. Any files fixed or still failing.

Keep the report concise; this skill is a pre-merge gate, not a full code review.
