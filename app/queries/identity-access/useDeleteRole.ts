'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import { rolesQueryKey } from '@/app/queries/identity-access/useRoles';
import type { DeleteRoleResponse } from '@/app/api/v1/roles/[id]/types';

async function deleteRole(roleId: number): Promise<DeleteRoleResponse> {
  const response = await fetch(`/api/v1/roles/${roleId}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not delete Role');
  }
}

export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteRole,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: rolesQueryKey });
    },
  });
}
