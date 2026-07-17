import { useSuspenseQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { GetVisitResponse } from '@/app/api/v1/visits/[id]/types';

export const visitQueryKey = (visitId: number) => ['visits', 'detail', visitId] as const;

async function fetchVisit(visitId: number): Promise<GetVisitResponse> {
  const response = await fetch(`/api/v1/visits/${visitId}`, { credentials: 'same-origin' });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Visit');
  }

  return response.json() as Promise<GetVisitResponse>;
}

function transformVisitResponse(response: GetVisitResponse) {
  return response.data;
}

// Suspense: the Visit detail page cannot render without its Visit.
export function useVisit(visitId: number) {
  return useSuspenseQuery({
    queryKey: visitQueryKey(visitId),
    queryFn: () => fetchVisit(visitId),
    select: transformVisitResponse,
  });
}
