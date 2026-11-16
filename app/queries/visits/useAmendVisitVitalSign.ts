'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import { patientChartQueryKey } from '@/app/queries/patients/chart/usePatientChart';
import type {
  AmendVisitVitalSignRequest,
  AmendVisitVitalSignResponse,
} from '@/app/api/v1/visits/[id]/vitals/[vitalId]/amend/types';

type AmendVisitVitalSignVariables = {
  visitId: number;
  patientId: number;
  vitalId: number;
  body: AmendVisitVitalSignRequest;
};

async function amendVisitVitalSign({
  visitId,
  vitalId,
  body,
}: AmendVisitVitalSignVariables): Promise<AmendVisitVitalSignResponse> {
  const response = await fetch(`/api/v1/visits/${visitId}/vitals/${vitalId}/amend`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not amend the Vital Signs');
  }

  return response.json() as Promise<AmendVisitVitalSignResponse>;
}

export function useAmendVisitVitalSign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: amendVisitVitalSign,
    onSettled: async (_data, _error, { patientId }) => {
      await queryClient.invalidateQueries({ queryKey: patientChartQueryKey(patientId) });
    },
  });
}
