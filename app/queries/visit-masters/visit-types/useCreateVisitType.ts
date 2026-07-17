'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { SaveVisitTypeRequest, SaveVisitTypeResponse } from '@/app/api/v1/visits/types/types';
import { VISIT_TYPES_KEY } from './useVisitTypes';

async function createVisitType(request: SaveVisitTypeRequest): Promise<SaveVisitTypeResponse> {
  const response = await fetch('/api/v1/visits/types', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not create Visit Type');
  }

  return response.json() as Promise<SaveVisitTypeResponse>;
}

type UseCreateVisitTypeOptions = Omit<
  UseMutationOptions<SaveVisitTypeResponse, Error, SaveVisitTypeRequest>,
  'mutationFn'
>;

export function useCreateVisitType(options?: UseCreateVisitTypeOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: createVisitType,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: VISIT_TYPES_KEY });
      await onSuccess?.(...args);
    },
  });
}
