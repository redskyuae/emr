import { useQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { GetUserRolesResponse } from '@/app/api/v1/users/[id]/roles/types';

export const staffRolesQueryKey = (userId: string) => ['staff-roles', userId] as const;

async function fetchStaffRoles(userId: string): Promise<GetUserRolesResponse> {
  const response = await fetch(`/api/v1/users/${userId}/roles`, { credentials: 'same-origin' });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load assigned Roles');
  }

  return response.json() as Promise<GetUserRolesResponse>;
}

function transformStaffRolesResponse(response: GetUserRolesResponse) {
  return response.data;
}

export function useStaffRolesQuery(userId: string | null) {
  return useQuery({
    queryKey: staffRolesQueryKey(userId ?? ''),
    queryFn: () => fetchStaffRoles(userId as string),
    enabled: userId !== null,
    select: transformStaffRolesResponse,
  });
}
