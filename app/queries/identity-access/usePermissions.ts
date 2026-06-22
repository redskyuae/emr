import { useQuery, useSuspenseQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { ListPermissionsResponse } from '@/app/api/v1/permissions/types';

export const permissionsQueryKey = ['permissions'] as const;

async function fetchPermissions(): Promise<ListPermissionsResponse> {
  const response = await fetch('/api/v1/permissions', { credentials: 'same-origin' });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Permission Catalogue');
  }

  return response.json() as Promise<ListPermissionsResponse>;
}

function transformPermissionsResponse(response: ListPermissionsResponse) {
  return response.data;
}

export function usePermissionsQuery() {
  return useQuery({
    queryKey: permissionsQueryKey,
    queryFn: fetchPermissions,
    select: transformPermissionsResponse,
  });
}

export function usePermissions() {
  return useSuspenseQuery({
    queryKey: permissionsQueryKey,
    queryFn: fetchPermissions,
    select: transformPermissionsResponse,
  });
}
