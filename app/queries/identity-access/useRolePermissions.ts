import { useQuery, useSuspenseQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { GetRolePermissionsResponse } from '@/app/api/v1/roles/[id]/permissions/types';

export const rolePermissionsQueryKey = (roleId: number) => ['role-permissions', roleId] as const;

async function fetchRolePermissions(roleId: number): Promise<GetRolePermissionsResponse> {
  const response = await fetch(`/api/v1/roles/${roleId}/permissions`, {
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Role Permissions');
  }

  return response.json() as Promise<GetRolePermissionsResponse>;
}

function transformRolePermissionsResponse(response: GetRolePermissionsResponse) {
  return response.data;
}

export function useRolePermissionsQuery(roleId: number | null) {
  return useQuery({
    queryKey: roleId === null ? ['role-permissions', 'none'] : rolePermissionsQueryKey(roleId),
    queryFn: () => fetchRolePermissions(roleId ?? 0),
    enabled: roleId !== null,
    select: transformRolePermissionsResponse,
  });
}

export function useRolePermissions(roleId: number) {
  return useSuspenseQuery({
    queryKey: rolePermissionsQueryKey(roleId),
    queryFn: () => fetchRolePermissions(roleId),
    select: transformRolePermissionsResponse,
  });
}
