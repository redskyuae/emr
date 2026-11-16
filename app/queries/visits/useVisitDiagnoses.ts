import { useQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { ListVisitDiagnosesResponse } from '@/app/api/v1/visits/[id]/diagnoses/types';

export const visitDiagnosesQueryKey = (visitId: number) =>
  ['visits', 'diagnoses', visitId] as const;

async function fetchVisitDiagnoses(visitId: number): Promise<ListVisitDiagnosesResponse> {
  const response = await fetch(`/api/v1/visits/${visitId}/diagnoses`, {
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load the Visit diagnoses');
  }

  return response.json() as Promise<ListVisitDiagnosesResponse>;
}

function transformVisitDiagnosesResponse(response: ListVisitDiagnosesResponse) {
  return response.data;
}

// Non-suspense: the Diagnosis step owns its own loading and error state.
export function useVisitDiagnosesQuery(visitId: number) {
  return useQuery({
    queryKey: visitDiagnosesQueryKey(visitId),
    queryFn: () => fetchVisitDiagnoses(visitId),
    select: transformVisitDiagnosesResponse,
  });
}
