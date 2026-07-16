'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { CheckInVisitRequest, CheckInVisitResponse } from '@/app/api/v1/visits/types';
import { VISITS_KEY } from './useVisits';

async function checkInVisit(request: CheckInVisitRequest): Promise<CheckInVisitResponse> {
  const response = await fetch('/api/v1/visits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not check the Patient in');
  }

  return response.json() as Promise<CheckInVisitResponse>;
}

type UseCheckInVisitOptions = Omit<
  UseMutationOptions<CheckInVisitResponse, Error, CheckInVisitRequest>,
  'mutationFn'
>;

export function useCheckInVisit(options?: UseCheckInVisitOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: checkInVisit,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: VISITS_KEY });
      await onSuccess?.(...args);
    },
  });
}
