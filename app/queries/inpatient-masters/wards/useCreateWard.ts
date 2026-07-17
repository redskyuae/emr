'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { SaveWardRequest, SaveWardResponse } from '@/app/api/v1/wards/types';
import { WARDS_KEY } from './useWards';

async function createWard(request: SaveWardRequest): Promise<SaveWardResponse> {
  const response = await fetch('/api/v1/wards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not create Ward');
  }

  return response.json() as Promise<SaveWardResponse>;
}

type UseCreateWardOptions = Omit<
  UseMutationOptions<SaveWardResponse, Error, SaveWardRequest>,
  'mutationFn'
>;

export function useCreateWard(options?: UseCreateWardOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: createWard,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: WARDS_KEY });
      await onSuccess?.(...args);
    },
  });
}
