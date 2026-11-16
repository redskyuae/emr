'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type {
  SaveVisitDiagnosesRequest,
  SaveVisitDiagnosesResponse,
} from '@/app/api/v1/visits/[id]/diagnoses/types';
import { visitDiagnosesQueryKey } from './useVisitDiagnoses';

type SaveVisitDiagnosesVariables = {
  visitId: number;
  /** A Completed Visit is amended through its own endpoint and permission. */
  amend: boolean;
  request: SaveVisitDiagnosesRequest;
};

async function saveVisitDiagnoses({
  visitId,
  amend,
  request,
}: SaveVisitDiagnosesVariables): Promise<SaveVisitDiagnosesResponse> {
  const path = `/api/v1/visits/${visitId}/diagnoses${amend ? '/amend' : ''}`;
  const response = await fetch(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not save the Visit diagnoses');
  }

  return response.json() as Promise<SaveVisitDiagnosesResponse>;
}

export function useSaveVisitDiagnoses() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveVisitDiagnoses,
    onSettled: async (_data, _error, { visitId }) => {
      await queryClient.invalidateQueries({ queryKey: visitDiagnosesQueryKey(visitId) });
    },
  });
}
