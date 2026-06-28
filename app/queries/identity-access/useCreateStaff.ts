'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import { staffBaseKey } from '@/app/queries/identity-access/useStaff';
import type { SaveStaffRequest, SaveStaffResponse } from '@/app/api/v1/users/types';

async function createStaff(request: SaveStaffRequest): Promise<SaveStaffResponse> {
  const response = await fetch('/api/v1/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not create Staff member');
  }

  return response.json() as Promise<SaveStaffResponse>;
}

export function useCreateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createStaff,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: staffBaseKey });
    },
  });
}
