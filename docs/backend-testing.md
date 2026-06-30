# Backend testing guide

**Every backend change ships with tests. No exceptions.** When you add or change anything under
`app/api/lib/modules/**` or `app/db/schema/**`, you must add or update the colocated tests described
here, and the whole suite must stay green (`bun run test`) and typecheck (`bunx tsc --noEmit`).

This guide is the concrete, copy-pasteable companion to the **Backend testing policy** section in
`CLAUDE.md`. `CLAUDE.md` states _what_ is mandatory; this file shows _how_, with real examples taken
from the codebase. When the two ever disagree, `CLAUDE.md` wins and this file should be corrected.

---

## Definition of done (per module)

A backend module is **not** done until it has all of these, each green:

| Layer                                     | File                                                  | Suffix                   |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------ |
| Schema                                    | `schemas/{module}-schema.unit.tests.ts`               | `*.unit.tests.ts`        |
| Validators                                | `validator/{module}-validator.unit.tests.ts`          | `*.unit.tests.ts`        |
| Commands                                  | `commands/{module}-commands.unit.tests.ts`            | `*.unit.tests.ts`        |
| Queries                                   | `queries/{module}-queries.unit.tests.ts`              | `*.unit.tests.ts`        |
| Repository (DB)                           | `repository/{module}-repository.integration.tests.ts` | `*.integration.tests.ts` |
| Route (only if non-trivial adapter logic) | `app/api/v1/{module}/route.unit.tests.ts`             | `*.unit.tests.ts`        |

Pick the closest existing module and copy its test shape (see [Reference modules](#reference-modules)).

---

## ⚠️ File naming is load-bearing

Vitest **only** discovers these two globs (`vitest.config.ts`):

- `**/*.unit.tests.ts` — the `unit` project
- `**/*.integration.tests.ts` — the `integration` project

`tests` is **plural**. A file named `*.unit.test.ts` (singular), `*.test.ts`, or `*.spec.ts` is
**silently ignored** — it never runs, so it gives a false sense of coverage and CI stays green while
testing nothing. This has bitten us before. Always use `*.unit.tests.ts` / `*.integration.tests.ts`.

Other house rules (enforced by review, not all by lint):

- **Explicit imports from `vitest`** — globals are disabled (`globals: false`). Every file starts with
  `import { describe, it, expect, vi, beforeEach } from 'vitest';` (only what it uses).
- **Test names start with `should …`** and read as sentences.
- **Mock with `vi.mock()` module factories + `vi.mocked()`** — not hand-written `as` casts (see
  [Patterns](#patterns--gotchas)).

---

## Running tests

```bash
bun run test            # everything (unit + integration)
bun run test:unit       # unit project only — no DB needed
bun run test:integration# integration project only — needs a Postgres test DB
bun run test:db:migrate # apply migrations to TEST_DATABASE_URL (run before integration tests)
bunx tsc --noEmit       # tests must typecheck too, not just pass at runtime
```

Run a single module: `bunx vitest run --project unit app/api/lib/modules/asset-condition`.

---

## 1. Schema unit tests

Cover: required fields, trimming/transforms, boundary limits, enum/format rules, and the **exact**
validation messages (copy them verbatim from the schema — see `CLAUDE.md` → _API validation messages_).
Also assert the id / tenant-id sub-schemas.

```ts
// schemas/asset-condition-schema.unit.tests.ts
import { describe, expect, it } from 'vitest';

import {
  assetConditionIdSchema,
  assetConditionTenantIdSchema,
  createAssetConditionSchema,
} from './asset-condition-schema';

const errorsOf = (result: ReturnType<typeof createAssetConditionSchema.safeParse>) =>
  result.error?.issues.map((issue) => issue.message) ?? [];

describe('AssetCondition schema', () => {
  it('should return validation error when name is missing', () => {
    expect(
      errorsOf(createAssetConditionSchema.safeParse({ code: 'GD', color: '#16A34A' }))
    ).toContain('Asset condition name is required');
  });

  it('should uppercase code and trim fields on successful parse', () => {
    expect(
      createAssetConditionSchema.parse({ name: ' Good ', code: ' gd ', color: '#16A34A' })
    ).toEqual({ name: 'Good', code: 'GD', color: '#16A34A' });
  });

  it('should transform empty description to undefined', () => {
    expect(
      createAssetConditionSchema.parse({
        name: 'Good',
        code: 'GD',
        color: '#16A34A',
        description: '   ',
      }).description
    ).toBeUndefined();
  });

  it('should validate id is a positive integer and tenant id is non-empty', () => {
    expect(assetConditionIdSchema.safeParse('0').success).toBe(false);
    expect(assetConditionTenantIdSchema.safeParse('   ').success).toBe(false);
  });
});
```

## 2. Validator unit tests

One combined file per module covering every validator. Mock the **repository** (so the create/update
validators exercise the real uniqueness/existence logic against fakes). Cover: schema failure, **no
repository calls when schema parsing fails**, repository-backed uniqueness/existence conflicts,
`excludeId` on update, not-found, `ValidationResult<T>` shape, and `status` propagation.

```ts
// validator/asset-condition-validator.unit.tests.ts
import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { assetConditionRepository } from '../repository/asset-condition-repository';
import { validateCreateAssetCondition } from './create-asset-condition-validator';
import { validateUpdateAssetCondition } from './update-asset-condition-validator';

vi.mock('../repository/asset-condition-repository', () => ({
  assetConditionRepository: {
    findActiveByName: vi.fn(),
    findActiveByCode: vi.fn(),
    getAssetConditionById: vi.fn(),
  },
}));

const repo = vi.mocked(assetConditionRepository);
const existing = {
  id: 1,
  tenantId: 'tenant-1',
  name: 'Good',
  code: 'GD',
  color: '#16A34A',
  description: null,
  createdOn: new Date(),
  modifiedOn: new Date(),
};

describe('AssetCondition validators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.findActiveByName.mockResolvedValue(undefined); // no duplicate by default
    repo.findActiveByCode.mockResolvedValue(undefined);
    repo.getAssetConditionById.mockResolvedValue(existing);
  });

  it('should not call uniqueness checks when schema parsing fails', async () => {
    await validateCreateAssetCondition({}, 'tenant-1');
    expect(repo.findActiveByName).not.toHaveBeenCalled();
  });

  it('should return conflict when the name already exists for the tenant', async () => {
    repo.findActiveByName.mockResolvedValue(existing);
    const result = await validateCreateAssetCondition(
      { name: 'Good', code: 'GD', color: '#16A34A' },
      'tenant-1'
    );
    expect(result).toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Asset condition name 'Good' already exists."],
    });
  });

  it('should pass excludeId to the uniqueness check on update', async () => {
    await validateUpdateAssetCondition(
      '7',
      { name: 'Worn', code: 'wr', color: '#16A34A' },
      'tenant-1'
    );
    expect(repo.findActiveByName).toHaveBeenCalledWith('tenant-1', 'Worn', { excludeId: 7 });
  });

  it('should return not found when the entity does not exist on update', async () => {
    repo.getAssetConditionById.mockResolvedValue(undefined);
    const result = await validateUpdateAssetCondition(
      '1',
      { name: 'Worn', code: 'WR', color: '#16A34A' },
      'tenant-1'
    );
    expect(result).toMatchObject({ success: false, status: StatusCodes.NOT_FOUND });
  });
});
```

## 3. Command unit tests

Mock **both** the validators and the repository. Cover: validator is called first and **the repository
write is not called on validation failure**, success maps to `CommandResult<T>` success, known
Postgres `23505` maps to a clean conflict, unknown errors propagate, and `status` is preserved.

```ts
// commands/asset-condition-commands.unit.tests.ts
import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { assetConditionRepository } from '../repository/asset-condition-repository';
import { validateCreateAssetCondition } from '../validator/create-asset-condition-validator';
import { createAssetConditionCommand } from './create-asset-condition-command';

vi.mock('../repository/asset-condition-repository', () => ({
  assetConditionRepository: { createAssetCondition: vi.fn() },
}));
vi.mock('../validator/create-asset-condition-validator', () => ({
  validateCreateAssetCondition: vi.fn(),
}));

const repo = vi.mocked(assetConditionRepository);
const validateCreate = vi.mocked(validateCreateAssetCondition);
const condition = {
  id: 1,
  tenantId: 'tenant-1',
  name: 'Good',
  code: 'GD',
  color: '#16A34A',
  description: null,
  createdOn: new Date(),
  modifiedOn: new Date(),
};

describe('AssetCondition commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateCreate.mockResolvedValue({
      success: true,
      data: { name: 'Good', code: 'GD', color: '#16A34A', description: undefined },
    });
    repo.createAssetCondition.mockResolvedValue(condition);
  });

  it('should return validation failure and not write when the validator fails', async () => {
    validateCreate.mockResolvedValue({ success: false, errors: ['Invalid'], status: 422 });
    const result = await createAssetConditionCommand({}, 'tenant-1');
    expect(result).toEqual({ success: false, errors: ['Invalid'], status: 422 });
    expect(repo.createAssetCondition).not.toHaveBeenCalled();
  });

  it('should map a known Postgres 23505 to a conflict error', async () => {
    repo.createAssetCondition.mockRejectedValue({
      code: '23505',
      constraint: 'asset_condition_tenant_name_idx',
    });
    await expect(createAssetConditionCommand({}, 'tenant-1')).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Asset condition name 'Good' already exists."],
    });
  });

  // Commands map KNOWN constraint errors to a CommandResult conflict and re-throw
  // everything else, so the route layer can surface a real 500 instead of masking
  // an unexpected failure. Assert that real behavior — do NOT rewrite it to expect
  // `success: false` (the command genuinely throws here).
  it('should rethrow unknown repository errors', async () => {
    const error = new Error('database down');
    repo.createAssetCondition.mockRejectedValue(error);
    await expect(createAssetConditionCommand({}, 'tenant-1')).rejects.toThrow(error);
  });
});
```

## 4. Query unit tests

Mock the repository (and, for the tenant-scoped pattern, the validators). Cover: validation failure
**short-circuits without touching the repository**, success returns the right `QueryResult<T>` shape,
list queries pass paging/filter params through, and get-by-id returns not-found when the row is missing.

```ts
// queries/asset-condition-queries.unit.tests.ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { assetConditionRepository } from '../repository/asset-condition-repository';
import { validateGetAssetConditionById } from '../validator/get-asset-condition-by-id-validator';
import { getAssetConditionByIdQuery } from './get-asset-condition-by-id-query';
import { getAssetConditionsQuery } from './get-asset-conditions-query';

vi.mock('../repository/asset-condition-repository', () => ({
  assetConditionRepository: { getAssetConditionById: vi.fn(), getAssetConditions: vi.fn() },
}));
vi.mock('../validator/get-asset-condition-by-id-validator', () => ({
  validateGetAssetConditionById: vi.fn(),
}));

const repo = vi.mocked(assetConditionRepository);
const validateById = vi.mocked(validateGetAssetConditionById);
const condition = {
  id: 1,
  tenantId: 'tenant-1',
  name: 'Good',
  code: 'GD',
  color: '#16A34A',
  description: null,
  createdOn: new Date(),
  modifiedOn: new Date(),
};

describe('AssetCondition queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateById.mockReturnValue({ success: true, data: { id: 1, tenantId: 'tenant-1' } });
    repo.getAssetConditionById.mockResolvedValue(condition);
    repo.getAssetConditions.mockResolvedValue({ data: [condition], total: 1 });
  });

  it('should short-circuit and not call the repository when validation fails', async () => {
    validateById.mockReturnValue({ success: false, errors: ['Invalid'] });
    await expect(getAssetConditionByIdQuery('bad', 'tenant-1')).resolves.toEqual({
      success: false,
      errors: ['Invalid'],
    });
    expect(repo.getAssetConditionById).not.toHaveBeenCalled();
  });

  it('should pass paging/filter params through to the repository', async () => {
    await getAssetConditionsQuery({ tenantId: 'tenant-1', page: 2, limit: 5, query: 'go' });
    expect(repo.getAssetConditions).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      page: 2,
      limit: 5,
      query: 'go',
    });
  });

  it('should return not found when the row is missing', async () => {
    repo.getAssetConditionById.mockResolvedValue(undefined);
    await expect(getAssetConditionByIdQuery('1', 'tenant-1')).resolves.toMatchObject({
      success: false,
      status: 404,
    });
  });
});
```

> When a validation-failure mock returns a `status`, only set one if the **real** validator sets it.
> The simple id/tenant validators return `{ success: false, errors }` with **no** `status`; injecting a
> fake `status` and asserting the query drops it implies a contract that doesn't exist.

## 5. Repository integration tests (DB-backed)

These hit a **real Postgres** test database. Cover: tenant isolation, soft-delete filtering,
create/update/delete/read, DB uniqueness constraints (including partial unique indexes and
case-insensitive uniqueness), and pagination/search.

```ts
// repository/appointment-mode-repository.integration.tests.ts
import { describe, expect, it } from 'vitest';

import { appointmentModeRepository } from './appointment-mode-repository';

const tenantA = 'tenant-a-test';
const tenantB = 'tenant-b-test';

const createMode = (tenantId: string, name: string, code: string) =>
  appointmentModeRepository.createAppointmentMode({
    tenantId,
    name,
    code,
    description: `${name} desc`,
  });

describe('AppointmentMode repository', () => {
  it('should not get a row created by another tenant', async () => {
    const created = await createMode(tenantA, 'In Person', 'IP');
    await expect(
      appointmentModeRepository.getAppointmentModeById(created.id, tenantB)
    ).resolves.toBeUndefined();
  });

  it('should exclude soft-deleted rows from reads', async () => {
    const created = await createMode(tenantA, 'Phone', 'PH');
    await appointmentModeRepository.deleteAppointmentMode(created.id, tenantA);
    await expect(
      appointmentModeRepository.getAppointmentModeById(created.id, tenantA)
    ).resolves.toBeUndefined();
  });
});
```

**Setup contract (`test/setup/integration.ts`):**

- `TEST_DATABASE_URL` must be set, and its database name must look like a test DB (the guard rejects
  anything that isn't, e.g. `emr_prod`) — because the setup **truncates every `public` table with
  `RESTART IDENTITY CASCADE` before each test**. Never point it at a real database.
- Migrations are **not** run automatically. Run `bun run test:db:migrate` first.
- Integration files do not run concurrently (they share one DB), so ids reset to `1` each test —
  asserting on `id: 1` is fine.

---

## Patterns & gotchas

These are the conventions that keep the suite consistent and typechecking. Most were learned the hard way.

### Mock with `vi.mocked`, not hand-written casts

```ts
// ✅ infers the real signatures; mockResolvedValue is type-checked
const repo = vi.mocked(assetConditionRepository);

// ❌ TS2352 "neither type sufficiently overlaps" and drifts from the real types
const repo = assetConditionRepository as { getAssetConditionById: ReturnType<typeof vi.fn> };
```

### Repository finders/soft-deletes return `Promise<Entity | undefined>`

`getXById`, `findActiveBy*`, and the soft-`delete`/`update` functions can return `undefined` (no row),
and commands/validators already guard them with `if (!row)`. Annotate the **production** function so the
type reflects reality — otherwise `repo.getXById.mockResolvedValue(undefined)` won't typecheck.

```ts
// repository
async function getAssetConditionById(
  id: number,
  tenantId: string
): Promise<AssetCondition | undefined> {
  const [row] = await db
    .select(assetConditionColumns)
    .from(assetConditionTable)
    .where(/* … */)
    .limit(1);
  return row;
}
```

### Map wrapped DB errors with the shared helper

Drizzle wraps the driver error, so the Postgres `code`/`constraint` live on the `cause` chain. Don't
read `error.code` directly — use `getDatabaseError(error)` from `app/api/lib/utils/db-errors.ts`, and
test the realistic wrapped shape:

```ts
repo.createAssetCondition.mockRejectedValue({
  cause: { code: '23505', constraint: 'asset_condition_tenant_name_idx' },
});
```

### Use the production dependency-injection seam instead of hitting cross-module repos

Some validators/commands accept an injectable collaborator (an "in-use" reader, a reference reader, a
set of seeders) defaulting to the real repository. Pass a stub — never let a unit test reach another
module's real repo.

```ts
// delete validator guards against in-use rows via an injected reader
const usage = { isPriorityInUse: vi.fn().mockResolvedValue(true) };
const result = await validateDeleteWorkOrderPriority('1', 'tenant-1', usage);
expect(result).toMatchObject({ success: false, status: StatusCodes.CONFLICT });
```

### Outcome-union deletes/updates

When a repository write returns a discriminated result instead of the row (used where a write must also
report "in use"), mock the variant, not a bare row:

```ts
repo.deleteWorkOrderPriority.mockResolvedValue({ outcome: 'deleted', data: priority });
repo.deleteWorkOrderPriority.mockResolvedValue({ outcome: 'in-use' });
repo.deleteWorkOrderPriority.mockResolvedValue({ outcome: 'not-found' });
```

### Match validation messages exactly

Conflict/invalid-id messages are part of the API contract (`CLAUDE.md` → _API validation messages_).
Assert them verbatim, including quoting and trailing punctuation — they differ subtly between modules
(`Country name India already exists.` vs `Asset condition name 'Good' already exists.`).

### Deep fixtures: `as never` is fine for unread shapes

When a mock return value is only checked for truthiness (e.g. a joined entity the code never inspects),
`mockResolvedValue({ id: 1 } as never)` is acceptable rather than constructing a full nested object.

---

## Module shapes (not every module is identical)

| Shape                                  | Example to copy                                    | Notes                                                                            |
| -------------------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------- |
| Tenant-scoped master data + uniqueness | `asset-condition`, `appointment-cancelled-reason`  | name/code/(color)/description, `findActiveBy*` uniqueness, soft delete           |
| Global Reference (no `tenantId`)       | `country`, `language`, `religion`                  | pure/sync validators; duplicate check lives in the **command**; no tenant filter |
| Reference-to-another-entity            | `state` (→ country)                                | validates the referenced id exists; combined name+parent uniqueness              |
| In-use / system protection             | `work-order-status`, `work-order-priority`, `role` | injected "in-use" reader, system-row guards, outcome unions                      |
| Rich entity with FK references         | `asset`, `work-order`                              | reference validators per FK, serial/code uniqueness                              |
| Read-only                              | `permission`                                       | schema + id validator + queries only (no commands)                               |
| Provisioning command                   | `tenant-provisioning` (`seed-default-*`)           | injected seeders, `Promise.allSettled` failure handling                          |

---

## Reference modules

The cleanest end-to-end examples to copy from:

- **`app/api/lib/modules/asset-condition/`** — the canonical tenant-scoped CRUD module (schema +
  combined validator + commands + queries + repository integration).
- **`app/api/lib/modules/appointment-mode/`** — the original reference set up with the Vitest harness.
- **`app/api/lib/modules/country/`** — the Global Reference shape.
