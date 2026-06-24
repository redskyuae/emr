'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import { rolesQueryKey } from '@/app/queries/identity-access/useRoles';
import type { UpdateRoleRequest, UpdateRoleResponse } from '@/app/api/v1/roles/[id]/types';

type UpdateRoleVariables = {
  roleId: number;
  request: UpdateRoleRequest;
};

async function updateRole({ roleId, request }: UpdateRoleVariables): Promise<UpdateRoleResponse> {
  const response = await fetch(`/api/v1/roles/${roleId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not update Role');
  }

  return response.json() as Promise<UpdateRoleResponse>;
}

export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateRole,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: rolesQueryKey });
    },
  });
}
