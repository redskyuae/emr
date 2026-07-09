'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { CreateVisitRequest, CreateVisitResponse } from '@/app/api/v1/visits/types';
import { visitsBaseKey } from './useVisits';

async function createVisit(request: CreateVisitRequest): Promise<CreateVisitResponse> {
  const response = await fetch('/api/v1/visits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not check in Visit');
  }

  return response.json() as Promise<CreateVisitResponse>;
}

type UseCreateVisitOptions = Omit<
  UseMutationOptions<CreateVisitResponse, Error, CreateVisitRequest>,
  'mutationFn'
>;

export function useCreateVisit(options?: UseCreateVisitOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: createVisit,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: visitsBaseKey });
      await onSuccess?.(...args);
    },
  });
}
