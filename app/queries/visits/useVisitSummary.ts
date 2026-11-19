import { useQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { GetVisitSummaryResponse } from '@/app/api/v1/visits/[id]/summary/types';

const visitSummaryQueryKey = (visitId: number) => ['visits', 'detail', visitId, 'summary'] as const;

async function fetchVisitSummary(visitId: number): Promise<GetVisitSummaryResponse> {
  const response = await fetch(`/api/v1/visits/${visitId}/summary`, {
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load the Visit Summary');
  }

  return response.json() as Promise<GetVisitSummaryResponse>;
}

function transformVisitSummaryResponse(response: GetVisitSummaryResponse) {
  return response.data;
}

export function useVisitSummaryQuery(visitId: number) {
  return useQuery({
    queryKey: visitSummaryQueryKey(visitId),
    queryFn: () => fetchVisitSummary(visitId),
    select: transformVisitSummaryResponse,
  });
}
