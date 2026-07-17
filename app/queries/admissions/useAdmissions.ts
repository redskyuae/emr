import { useQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { ListAdmissionsResponse } from '@/app/api/v1/admissions/types';

export type AdmissionsParams = {
  query?: string;
  page?: number;
  limit?: number;
  wardId?: number;
  status?: string;
  doctorId?: number;
  patientId?: number;
};

export const ADMISSIONS_KEY = ['admissions'] as const;

export const admissionsQueryKey = (params: AdmissionsParams) =>
  [...ADMISSIONS_KEY, 'list', params] as const;

async function fetchAdmissions(params: AdmissionsParams): Promise<ListAdmissionsResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.query) searchParams.set('query', params.query);
  if (params.status) searchParams.set('status', params.status);
  if (params.wardId) searchParams.set('wardId', String(params.wardId));
  if (params.doctorId) searchParams.set('doctorId', String(params.doctorId));
  if (params.patientId) searchParams.set('patientId', String(params.patientId));

  const response = await fetch(`/api/v1/admissions?${searchParams.toString()}`, {
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Admissions');
  }

  return response.json() as Promise<ListAdmissionsResponse>;
}

// Non-suspense: the census's status/ward/doctor filters drive this query, and
// switching a filter must not blow away the surrounding toolbar and chrome.
export function useAdmissionsQuery(params: AdmissionsParams) {
  return useQuery({
    queryKey: admissionsQueryKey(params),
    queryFn: () => fetchAdmissions(params),
  });
}
