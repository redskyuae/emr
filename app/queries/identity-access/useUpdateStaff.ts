'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import { staffBaseKey } from '@/app/queries/identity-access/useStaff';
import type { UpdateStaffRequest, UpdateStaffResponse } from '@/app/api/v1/users/[id]/types';

type UpdateStaffVariables = {
  userId: string;
  request: UpdateStaffRequest;
};

async function updateStaff({
  userId,
  request,
}: UpdateStaffVariables): Promise<UpdateStaffResponse> {
  const response = await fetch(`/api/v1/users/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not update Staff member');
  }

  return response.json() as Promise<UpdateStaffResponse>;
}

export function useUpdateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateStaff,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: staffBaseKey });
    },
  });
}
