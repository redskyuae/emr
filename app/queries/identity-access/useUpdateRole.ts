'use client';

import { useMutation, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
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

type UseUpdateRoleOptions = Omit<
  UseMutationOptions<UpdateRoleResponse, Error, UpdateRoleVariables>,
  'mutationFn'
>;

export function useUpdateRole(options?: UseUpdateRoleOptions) {
  return useMutation({ mutationFn: updateRole, ...options });
}
