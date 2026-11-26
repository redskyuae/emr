import { useQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { GetVisitStatusCountsResponse } from '@/app/api/v1/visits/status-counts/types';

import { VISITS_KEY } from './useVisits';

type VisitStatusCountsParams = {
  visitDate: string;
  doctorId?: number;
};

async function fetchVisitStatusCounts(
  params: VisitStatusCountsParams
): Promise<GetVisitStatusCountsResponse> {
  const searchParams = new URLSearchParams({ visitDate: params.visitDate });

  if (params.doctorId) searchParams.set('doctorId', String(params.doctorId));

  const response = await fetch(`/api/v1/visits/status-counts?${searchParams.toString()}`, {
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Visit counts');
  }

  return response.json() as Promise<GetVisitStatusCountsResponse>;
}

function selectCounts(response: GetVisitStatusCountsResponse) {
  return response.data;
}

// Keyed under VISITS_KEY so every Visit mutation that refreshes the board
// refreshes the tiles too.
export function useVisitStatusCountsQuery(
  params: VisitStatusCountsParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    enabled: options?.enabled,
    queryKey: [...VISITS_KEY, 'status-counts', params] as const,
    queryFn: () => fetchVisitStatusCounts(params),
    select: selectCounts,
  });
}
