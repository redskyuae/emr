'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type {
  UpdateVisitTypeRequest,
  UpdateVisitTypeResponse,
} from '@/app/api/v1/visits/types/[id]/types';
import { VISIT_TYPES_KEY } from './useVisitTypes';

type UpdateVisitTypeVariables = {
  id: number;
  request: UpdateVisitTypeRequest;
};

async function updateVisitType({
  id,
  request,
}: UpdateVisitTypeVariables): Promise<UpdateVisitTypeResponse> {
  const response = await fetch(`/api/v1/visits/types/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not update Visit Type');
  }

  return response.json() as Promise<UpdateVisitTypeResponse>;
}

type UseUpdateVisitTypeOptions = Omit<
  UseMutationOptions<UpdateVisitTypeResponse, Error, UpdateVisitTypeVariables>,
  'mutationFn'
>;

export function useUpdateVisitType(options?: UseUpdateVisitTypeOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: updateVisitType,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: VISIT_TYPES_KEY });
      await onSuccess?.(...args);
    },
  });
}
