'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { UpdateWardRequest, UpdateWardResponse } from '@/app/api/v1/wards/[id]/types';
import { WARDS_KEY } from './useWards';

type UpdateWardVariables = {
  id: number;
  request: UpdateWardRequest;
};

async function updateWard({ id, request }: UpdateWardVariables): Promise<UpdateWardResponse> {
  const response = await fetch(`/api/v1/wards/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not update Ward');
  }

  return response.json() as Promise<UpdateWardResponse>;
}

type UseUpdateWardOptions = Omit<
  UseMutationOptions<UpdateWardResponse, Error, UpdateWardVariables>,
  'mutationFn'
>;

export function useUpdateWard(options?: UseUpdateWardOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: updateWard,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: WARDS_KEY });
      await onSuccess?.(...args);
    },
  });
}
