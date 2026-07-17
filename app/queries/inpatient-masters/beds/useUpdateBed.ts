'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { UpdateBedRequest, UpdateBedResponse } from '@/app/api/v1/beds/[id]/types';
import { BEDS_KEY } from './useBeds';

type UpdateBedVariables = {
  id: number;
  request: UpdateBedRequest;
};

async function updateBed({ id, request }: UpdateBedVariables): Promise<UpdateBedResponse> {
  const response = await fetch(`/api/v1/beds/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not update Bed');
  }

  return response.json() as Promise<UpdateBedResponse>;
}

type UseUpdateBedOptions = Omit<
  UseMutationOptions<UpdateBedResponse, Error, UpdateBedVariables>,
  'mutationFn'
>;

export function useUpdateBed(options?: UseUpdateBedOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: updateBed,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: BEDS_KEY });
      await onSuccess?.(...args);
    },
  });
}
