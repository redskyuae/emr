import { useQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { ListVisitsResponse } from '@/app/api/v1/visits/types';

export type VisitsParams = {
  visitDate?: string;
  doctorId?: number;
  patientId?: number;
  status?: string;
  query?: string;
  page?: number;
  limit?: number;
};

export const VISITS_KEY = ['visits'] as const;

export const visitsQueryKey = (params: VisitsParams) => [...VISITS_KEY, params] as const;

async function fetchVisits(params: VisitsParams): Promise<ListVisitsResponse> {
  const searchParams = new URLSearchParams();

  if (params.visitDate) searchParams.set('visitDate', params.visitDate);
  if (params.doctorId) searchParams.set('doctorId', String(params.doctorId));
  if (params.patientId) searchParams.set('patientId', String(params.patientId));
  if (params.status) searchParams.set('status', params.status);
  if (params.query) searchParams.set('query', params.query);
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));

  const response = await fetch(`/api/v1/visits?${searchParams.toString()}`, {
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Visits');
  }

  return response.json() as Promise<ListVisitsResponse>;
}

// Non-suspense: the board's date/doctor/status filters drive this query, and
// switching a filter must not blow away the surrounding toolbar and chrome.
export function useVisitsQuery(params: VisitsParams) {
  return useQuery({
    queryKey: visitsQueryKey(params),
    queryFn: () => fetchVisits(params),
  });
}
