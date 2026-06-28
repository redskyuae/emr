'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import { staffBaseKey } from '@/app/queries/identity-access/useStaff';
import type { DeactivateStaffResponse } from '@/app/api/v1/users/[id]/deactivate/types';

async function deactivateStaff(userId: string): Promise<DeactivateStaffResponse> {
  const response = await fetch(`/api/v1/users/${userId}/deactivate`, {
    method: 'PATCH',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not deactivate Staff member');
  }

  return response.json() as Promise<DeactivateStaffResponse>;
}

export function useDeactivateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deactivateStaff,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: staffBaseKey });
    },
  });
}
