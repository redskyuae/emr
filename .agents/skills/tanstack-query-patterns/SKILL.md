---
name: tanstack-query-patterns
skill-version: 2
description: >
  How we use TanStack Query (@tanstack/react-query) in the EMR frontend. Covers
  file layout, naming conventions for queries and mutations, same-origin API route
  fetch helpers, suspense vs non-suspense hooks, select transforms, optimistic
  update helpers, and mutation lifecycle patterns. Load this skill before adding
  or modifying any API call, query hook, mutation, optimistic cache update, query
  key, useQuery, useSuspenseQuery, or useMutation code.
---

# tanstack-query-patterns

How we use **TanStack Query** (`@tanstack/react-query`) in the EMR frontend. Load this skill any time you are adding or modifying an API call, query hook, mutation, or optimistic cache update.

> This project does **not** use `useUnifiedComm`. Query/mutation files call our same-origin Next.js API routes with small private `fetch` helpers.

---

## Where query and mutation hooks live

```
app/queries/
  use{Resource}.ts                  — read query (one file = one resource)
  use{Verb}{Resource}.ts            — mutation (verb = Create / Update / SignIn / Delete / …)
  {feature}/                        — group related read + mutation files
```

A read file owns the query key, fetch function, response transform, both suspense and non-suspense hooks, and any optimistic-update helpers that mutate **its** cache. API request/response contract types live in `app/api/v1/**/types.ts` and are imported with `import type`. Mutation files import optimistic helpers — they never reach into another resource's cache directly.

---

## The HTTP layer — same-origin API route fetch helpers

All client-side API calls should go through a private helper in the query/mutation file. Do not inline `fetch` inside components.

For JSON mutations, use project API routes under `/api/v1/...` with JSON headers and same-origin credentials. Import request/response contracts from the route's sibling `types.ts`; never duplicate API contract types in the query/mutation hook:

```ts
import type { SigninRequest, SigninResponse } from '@/app/api/v1/signin/types';

async function signIn(request: SigninRequest): Promise<SigninResponse> {
  const response = await fetch('/api/v1/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseAuthApiError(response, 'Sign-in failed');
  }

  return response.json() as Promise<SigninResponse>;
}
```

Keep API error parsing in the query/mutation layer or a tiny shared helper next to it. Components should render exact API error strings; they should not know response-envelope details.

---

## Naming conventions (strict)

| Thing                      | Pattern                                                              | Example                                         |
| -------------------------- | -------------------------------------------------------------------- | ----------------------------------------------- |
| API contract types         | Import from `app/api/v1/**/types.ts`; do not redefine in hooks       | `SigninRequest`, `SigninResponse`               |
| Query key                  | `{resource}QueryKey` — `as const` tuple, function if parameterized   | `tenantsQueryKey`, `tenantQueryKey(id)`         |
| Private fetch function     | `{verb}{Resource}` or `fetch{Resource}` (not exported)               | `signIn`, `fetchTenants`                        |
| **Non-suspense** read hook | `use{Resource}Query`                                                 | `useTenantsQuery`                               |
| **Suspense** read hook     | `use{Resource}` (no suffix)                                          | `useTenants`                                    |
| Mutation hook              | `use{Verb}{Resource}`                                                | `useUpdateRole`, `useSignIn`                    |
| Optimistic helper          | `update{Resource}{Field}` / `remove{Resource}` / `set{Resource}Data` | `updateRoleName`, `removeRole`, `setTenantData` |

> ⚠️ **`Query` suffix means non-suspense; bare name means suspense.** Follow this convention even if another codebase does the opposite.

### Query keys

```ts
// Parameterless
export const tenantsQueryKey = ['tenants'] as const;

// Parameterized — function returning `as const` tuple
export const tenantQueryKey = (tenantId: string) => ['tenant', tenantId] as const;
```

`as const` is required — the inferred tuple type gives `getQueryData<T>` / `setQueryData<T>` their type safety.

---

## Read queries — both flavors share fetcher and `select`

```ts
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';

import type { ListCountriesResponse } from '@/app/api/v1/countries/types';

export const countriesQueryKey = ['countries'] as const;

async function fetchCountries(): Promise<ListCountriesResponse> {
  const response = await fetch('/api/v1/countries', { credentials: 'same-origin' });
  if (!response.ok) throw new Error('Could not load Countries');
  return response.json() as Promise<ListCountriesResponse>;
}

function transformCountriesResponse(res: ListCountriesResponse) {
  return res.data;
}

export function useCountriesQuery() {
  return useQuery({
    queryKey: countriesQueryKey,
    queryFn: fetchCountries,
    select: transformCountriesResponse,
  });
}

export function useCountries() {
  return useSuspenseQuery({
    queryKey: countriesQueryKey,
    queryFn: fetchCountries,
    select: transformCountriesResponse,
  });
}
```

**`select` — derive, don't bake.** Keep the cache in canonical API shape; map to UI shape via `select`. Optimistic helpers can then `getQueryData<ListXxxResponse>()` / `getQueryData<GetXxxResponse>()` against a stable shape, and re-renders are skipped when the underlying data is unchanged. Lift non-trivial transforms to a top-level `transform{Resource}Response` so both hooks share it.

**Derived aggregates belong in `select`, not `useMemo`.** Counts, summaries, filtered/grouped views, and other values computed purely from query data should be derived in a `select`, not recomputed with `useMemo` in a component. A stable top-level `select` function recomputes only when the underlying cached data changes (React Query memoizes the result and applies structural sharing), so it matches `useMemo` semantics while keeping derivation next to the data and out of the component.

Expose a derived view as its own selector hook subscribed to the **same query key** — same cache, one fetch, and each subscriber re-renders only when its slice changes:

```ts
export type RoleSummary = { total: number; system: number; custom: number };

function transformRolesSummary(response: ListRolesResponse): RoleSummary {
  const roles = response.data;
  const system = roles.filter((role) => role.isSystem).length;
  return { total: roles.length, system, custom: roles.length - system };
}

export function useRolesSummaryQuery() {
  return useQuery({ queryKey: rolesQueryKey, queryFn: fetchRoles, select: transformRolesSummary });
}
```

A component then reads `useRolesQuery()` for the list and `useRolesSummaryQuery()` for the aggregate, with no `useMemo` in between. Keep the canonical list hook returning the list — add a selector hook for the derived shape rather than baking it into the shared transform.

### Picking a flavor

Export only the flavor a consumer imports; add the suspense/non-suspense sibling in the same change that introduces its first consumer. Do not export a hook nothing imports — an unused exported hook is dead surface area (see the no-speculative-exports rule in `CLAUDE.md`). Both flavors can share the same `queryKey`, fetcher, and `select`, so adding the sibling later is a few lines.

| Situation                                                  | Flavor                                                              |
| ---------------------------------------------------------- | ------------------------------------------------------------------- |
| Page-level data the page can't render without              | **Suspense** (`useCountries`, `useCountry`)                         |
| Tab-switched, filter-switched, or parent-state-driven data | **Non-suspense** — switching shouldn't blow away surrounding chrome |
| Conditional / optional data                                | **Non-suspense** — owns its own loader/error UI                     |

The `Loader`/skeleton component lives next to the consumer, not in the query file.

---

## Mutations

Mutation files own the private API helper but import request/response contract types from `app/api/v1/**/types.ts`. Components call the hook and render pending/error states.

**Cache work lives in the mutation hook, never the component.** A mutation that changes server data owns its cache consequences: the hook calls `useQueryClient()` internally and invalidates the affected query keys in `onSettled` (and runs optimistic writes in `onMutate`/`onError` — see below). **Components must never call `useQueryClient` or `invalidateQueries`.** A component only calls `mutate` / `mutateAsync` and handles UX (toast, navigation, closing a sheet). The hook reads what it needs (e.g. the affected id) from the mutation `variables` passed to `onSettled`.

A caller may still pass **UX-only** options such as `onSuccess: () => router.replace(...)` for navigation, but never cache lifecycle (`onMutate` / `onSettled`) or invalidation. If a hook owns its cache lifecycle and has no UX caller, give it **no `options` parameter at all** — that keeps a caller from passing an `onSettled` that clobbers the hook's invalidation.

```ts
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { rolesQueryKey } from '@/app/queries/identity-access/useRoles';
import type { DeleteRoleResponse } from '@/app/api/v1/roles/[id]/types';

async function deleteRole(roleId: number): Promise<DeleteRoleResponse> {
  /* …fetch… */
}

export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteRole,
    onSettled: (_data, _error, roleId) => {
      void queryClient.invalidateQueries({ queryKey: rolesQueryKey });
    },
  });
}
```

Invalidate exactly the keys the write changes — including sibling caches the write affects (e.g. setting a Role's permissions invalidates both `rolePermissionsQueryKey(roleId)` and `rolesQueryKey`, because the Roles list card shows a permission count). When a component orchestrates several mutations in sequence, each hook's own `onSettled` fires as that mutation settles; the component just awaits and handles UX.

When the hook only forwards a UX option (e.g. auth navigation) and does no cache work, the thin passthrough is still fine:

```ts
'use client';

import { useMutation, type UseMutationOptions } from '@tanstack/react-query';

import type { SigninRequest, SigninResponse } from '@/app/api/v1/signin/types';

async function signIn(request: SigninRequest): Promise<SigninResponse> {
  const response = await fetch('/api/v1/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) throw new Error('Sign-in failed');
  return response.json() as Promise<SigninResponse>;
}

type UseSignInOptions = Omit<
  UseMutationOptions<SigninResponse, Error, SigninRequest>,
  'mutationFn'
>;

export function useSignIn(options?: UseSignInOptions) {
  return useMutation({ mutationFn: signIn, ...options });
}
```

### Consuming a mutation

```tsx
const signInMutation = useSignIn({
  onSuccess: () => router.replace('/dashboard'),
});

signInMutation.mutate({ email, password, rememberMe });
```

Use `isPending` to disable controls during the round-trip (`aria-busy={isPending}`). Do not await unless you need to chain — `mutate` already drives pending/error/success state. The component does **no** cache work here: invalidation already happened in the hook's `onSettled`.

---

## Optimistic updates

The rule: **cache-mutating helpers live in the read-query file**; mutation files import them. Each cache shape is owned by one file — reshapes only force edits there, and helpers are reusable across mutations.

Helpers take `queryClient` as the first arg and use `immer.produce` for safe deep updates when changing nested data. Iterate when a logical update spans multiple keys.

Mutation lifecycle for optimistic updates:

1. `onMutate`: cancel in-flight queries that could clobber the optimistic write.
2. Snapshot previous cache values for rollback.
3. Apply optimistic updates via helpers from read files.
4. Return context for `onError`.
5. `onError`: restore every snapshot.
6. `onSettled`: invalidate affected queries; add `refetchQueries` only if invalidation alone will not refetch data the user needs next.

---

## Common mistakes (caught in review)

- **`Query` / suspense names swapped.** `useFoo` = suspense, `useFooQuery` = non-suspense.
- **Missing `as const` on a query key.** Loses type narrowing on `getQueryData` / `setQueryData`.
- **`fetch` inlined inside a component.** Move it to `app/queries/...` and expose a hook.
- **API contract types duplicated in a hook.** Import request/response types from `app/api/v1/**/types.ts`.
- **Transform applied in `queryFn` instead of `select`.** Cache must stay in API shape so optimistic helpers can read it.
- **Aggregates derived with `useMemo` in a component instead of `select`.** Counts/summaries/filtered views computed from query data belong in a stable top-level `select` (a dedicated selector hook on the same query key), not a `useMemo` in the consumer.
- **`useQueryClient` / `invalidateQueries` called in a component.** Cache work belongs in the mutation hook's `onSettled` (and `onMutate`/`onError`), not the component. A component importing `useQueryClient` is the tell.
- **`setQueryData(produce(...))` inlined inside a mutation.** Move it to a helper in the read file.
- **`cancelQueries` skipped in optimistic `onMutate`.** A late in-flight refetch will clobber the optimistic write.
