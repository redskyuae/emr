import { useQuery, useSuspenseQuery } from '@tanstack/react-query';

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

export function useRoles() {
  return useSuspenseQuery({
    queryKey: rolesQueryKey,
    queryFn: fetchRoles,
    select: transformRolesResponse,
  });
}
