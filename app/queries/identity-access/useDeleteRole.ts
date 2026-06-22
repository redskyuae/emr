'use client';

import { useMutation, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
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

type UseDeleteRoleOptions = Omit<
  UseMutationOptions<DeleteRoleResponse, Error, number>,
  'mutationFn'
>;

export function useDeleteRole(options?: UseDeleteRoleOptions) {
  return useMutation({ mutationFn: deleteRole, ...options });
}
