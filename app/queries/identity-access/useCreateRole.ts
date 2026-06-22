'use client';

import { useMutation, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
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

type UseCreateRoleOptions = Omit<
  UseMutationOptions<SaveRoleResponse, Error, SaveRoleRequest>,
  'mutationFn'
>;

export function useCreateRole(options?: UseCreateRoleOptions) {
  return useMutation({ mutationFn: createRole, ...options });
}
