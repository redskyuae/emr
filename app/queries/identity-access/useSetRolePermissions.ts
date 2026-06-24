'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import { rolePermissionsQueryKey } from '@/app/queries/identity-access/useRolePermissions';
import { rolesQueryKey } from '@/app/queries/identity-access/useRoles';
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

export function useSetRolePermissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: setRolePermissions,
    onSettled: (_data, _error, variables) => {
      // The Role's assigned Permissions changed, and its permission count is
      // shown on the Roles list card — invalidate both.
      void queryClient.invalidateQueries({
        queryKey: rolePermissionsQueryKey(variables.roleId),
      });
      void queryClient.invalidateQueries({ queryKey: rolesQueryKey });
    },
  });
}
