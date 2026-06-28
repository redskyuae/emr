'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import { staffBaseKey } from '@/app/queries/identity-access/useStaff';
import type { ReactivateStaffResponse } from '@/app/api/v1/users/[id]/reactivate/types';

async function reactivateStaff(userId: string): Promise<ReactivateStaffResponse> {
  const response = await fetch(`/api/v1/users/${userId}/reactivate`, {
    method: 'PATCH',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not reactivate Staff member');
  }

  return response.json() as Promise<ReactivateStaffResponse>;
}

export function useReactivateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reactivateStaff,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: staffBaseKey });
    },
  });
}
