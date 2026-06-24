'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import { rolesQueryKey } from '@/app/queries/identity-access/useRoles';
import type { SaveRoleRequest, SaveRoleResponse } from '@/app/api/v1/roles/types';

async function createRole(request: SaveRoleRequest): Promise<SaveRoleResponse> {
  const response = await fetch('/api/v1/roles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not create Role');
  }

  return response.json() as Promise<SaveRoleResponse>;
}

export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRole,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: rolesQueryKey });
    },
  });
}
