'use client';

import { useMutation, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type {
  SetRolePermissionsRequest,
  SetRolePermissionsResponse,
} from '@/app/api/v1/roles/[id]/permissions/types';

type SetRolePermissionsVariables = {
  roleId: number;
  request: SetRolePermissionsRequest;
};

async function setRolePermissions({
  roleId,
  request,
}: SetRolePermissionsVariables): Promise<SetRolePermissionsResponse> {
  const response = await fetch(`/api/v1/roles/${roleId}/permissions`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not update Permission Assignments');
  }

  return response.json() as Promise<SetRolePermissionsResponse>;
}

type UseSetRolePermissionsOptions = Omit<
  UseMutationOptions<SetRolePermissionsResponse, Error, SetRolePermissionsVariables>,
  'mutationFn'
>;

export function useSetRolePermissions(options?: UseSetRolePermissionsOptions) {
  return useMutation({ mutationFn: setRolePermissions, ...options });
}
