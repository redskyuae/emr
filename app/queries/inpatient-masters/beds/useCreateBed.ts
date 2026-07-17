'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { SaveBedRequest, SaveBedResponse } from '@/app/api/v1/beds/types';
import { BEDS_KEY } from './useBeds';

async function createBed(request: SaveBedRequest): Promise<SaveBedResponse> {
  const response = await fetch('/api/v1/beds', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not create Bed');
  }

  return response.json() as Promise<SaveBedResponse>;
}

type UseCreateBedOptions = Omit<
  UseMutationOptions<SaveBedResponse, Error, SaveBedRequest>,
  'mutationFn'
>;

export function useCreateBed(options?: UseCreateBedOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: createBed,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: BEDS_KEY });
      await onSuccess?.(...args);
    },
  });
}
