'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type {
  CompleteVisitRequest,
  CompleteVisitResponse,
} from '@/app/api/v1/visits/[id]/complete/types';
import { visitsBaseKey } from './useVisits';

type CompleteVisitVariables = { id: number; request?: CompleteVisitRequest };

async function completeVisit({
  id,
  request,
}: CompleteVisitVariables): Promise<CompleteVisitResponse> {
  const response = await fetch(`/api/v1/visits/${id}/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request ?? {}),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not complete Visit');
  }

  return response.json() as Promise<CompleteVisitResponse>;
}

type UseCompleteVisitOptions = Omit<
  UseMutationOptions<CompleteVisitResponse, Error, CompleteVisitVariables>,
  'mutationFn'
>;

export function useCompleteVisit(options?: UseCompleteVisitOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: completeVisit,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: visitsBaseKey });
      await onSuccess?.(...args);
    },
  });
}
