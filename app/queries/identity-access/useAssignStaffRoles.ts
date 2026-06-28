'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import { staffBaseKey } from '@/app/queries/identity-access/useStaff';
import { staffRolesQueryKey } from '@/app/queries/identity-access/useStaffRoles';
import type {
  AssignUserRolesRequest,
  AssignUserRolesResponse,
} from '@/app/api/v1/users/[id]/roles/types';

type AssignStaffRolesVariables = {
  userId: string;
  request: AssignUserRolesRequest;
};

async function assignStaffRoles({
  userId,
  request,
}: AssignStaffRolesVariables): Promise<AssignUserRolesResponse> {
  const response = await fetch(`/api/v1/users/${userId}/roles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not assign Roles');
  }

  return response.json() as Promise<AssignUserRolesResponse>;
}

export function useAssignStaffRoles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: assignStaffRoles,
    onSettled: (_data, _error, { userId }) => {
      void queryClient.invalidateQueries({ queryKey: staffRolesQueryKey(userId) });
      void queryClient.invalidateQueries({ queryKey: staffBaseKey });
    },
  });
}
