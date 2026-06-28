'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import { staffBaseKey } from '@/app/queries/identity-access/useStaff';
import { staffRolesQueryKey } from '@/app/queries/identity-access/useStaffRoles';
import type { RemoveUserRoleResponse } from '@/app/api/v1/users/[id]/roles/[roleId]/types';

type RemoveStaffRoleVariables = {
  userId: string;
  roleId: number;
};

async function removeStaffRole({
  userId,
  roleId,
}: RemoveStaffRoleVariables): Promise<RemoveUserRoleResponse> {
  const response = await fetch(`/api/v1/users/${userId}/roles/${roleId}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not remove Role');
  }
}

export function useRemoveStaffRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeStaffRole,
    onSettled: (_data, _error, { userId }) => {
      void queryClient.invalidateQueries({ queryKey: staffRolesQueryKey(userId) });
      void queryClient.invalidateQueries({ queryKey: staffBaseKey });
    },
  });
}
