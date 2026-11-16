'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { AmendVisitRequest, AmendVisitResponse } from '@/app/api/v1/visits/[id]/amend/types';
import { visitQueryKey } from './useVisit';
import { VISITS_KEY } from './useVisits';

type AmendVisitVariables = {
  id: number;
  request: AmendVisitRequest;
};

async function amendVisit({ id, request }: AmendVisitVariables): Promise<AmendVisitResponse> {
  const response = await fetch(`/api/v1/visits/${id}/amend`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not amend the Visit');
  }

  return response.json() as Promise<AmendVisitResponse>;
}

export function useAmendVisit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: amendVisit,
    onSettled: async (_data, _error, { id }) => {
      await queryClient.invalidateQueries({ queryKey: VISITS_KEY });
      await queryClient.invalidateQueries({ queryKey: visitQueryKey(id) });
    },
  });
}
