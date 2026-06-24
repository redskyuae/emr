import { useQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { ListRolesResponse } from '@/app/api/v1/roles/types';

export const rolesQueryKey = ['roles'] as const;

async function fetchRoles(): Promise<ListRolesResponse> {
  const response = await fetch('/api/v1/roles?limit=999', { credentials: 'same-origin' });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Roles');
  }

  return response.json() as Promise<ListRolesResponse>;
}

function transformRolesResponse(response: ListRolesResponse) {
  return response.data;
}

export function useRolesQuery() {
  return useQuery({
    queryKey: rolesQueryKey,
    queryFn: fetchRoles,
    select: transformRolesResponse,
  });
}

export type RoleSummary = {
  total: number;
  system: number;
  custom: number;
};

// Derived aggregate over the same cached Roles list. Kept as a stable top-level
// `select` (not a `useMemo` in the component) so it recomputes only when the
// underlying Roles data changes, and subscribers re-render only when the summary
// changes. Shares the canonical cache shape with the list hooks above.
function transformRolesSummary(response: ListRolesResponse): RoleSummary {
  const roles = response.data;
  const system = roles.filter((role) => role.isSystem).length;

  return {
    total: roles.length,
    system,
    custom: roles.length - system,
  };
}

export function useRolesSummaryQuery() {
  return useQuery({
    queryKey: rolesQueryKey,
    queryFn: fetchRoles,
    select: transformRolesSummary,
  });
}
