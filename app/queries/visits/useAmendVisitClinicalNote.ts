'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import { patientChartQueryKey } from '@/app/queries/patients/chart/usePatientChart';
import type {
  AmendVisitClinicalNoteRequest,
  AmendVisitClinicalNoteResponse,
} from '@/app/api/v1/visits/[id]/notes/[noteId]/amend/types';

type AmendVisitClinicalNoteVariables = {
  visitId: number;
  patientId: number;
  noteId: number;
  body: AmendVisitClinicalNoteRequest;
};

async function amendVisitClinicalNote({
  visitId,
  noteId,
  body,
}: AmendVisitClinicalNoteVariables): Promise<AmendVisitClinicalNoteResponse> {
  const response = await fetch(`/api/v1/visits/${visitId}/notes/${noteId}/amend`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not amend the Clinical Note');
  }

  return response.json() as Promise<AmendVisitClinicalNoteResponse>;
}

export function useAmendVisitClinicalNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: amendVisitClinicalNote,
    onSettled: async (_data, _error, { patientId }) => {
      await queryClient.invalidateQueries({ queryKey: patientChartQueryKey(patientId) });
    },
  });
}
