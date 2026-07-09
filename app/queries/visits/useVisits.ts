import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { ListVisitsResponse } from '@/app/api/v1/visits/types';
import type { VisitStatusCategory } from '@/app/api/lib/modules/visit-status/schemas/visit-status-schema';

export type VisitListFilters = {
  page: number;
  limit: number;
  query?: string;
  statusId?: number;
  statusCategory?: VisitStatusCategory;
  doctorId?: number;
  patientId?: number;
};

export const visitsBaseKey = ['visits'] as const;
export const visitListQueryKey = (filters: VisitListFilters) =>
  ['visits', 'list', filters] as const;

function buildVisitListParams(filters: VisitListFilters) {
  const params = new URLSearchParams();
  params.set('page', String(filters.page));
  params.set('limit', String(filters.limit));

  if (filters.query) {
    params.set('query', filters.query);
  }

  if (filters.statusId) {
    params.set('statusId', String(filters.statusId));
  }

  if (filters.statusCategory) {
    params.set('statusCategory', filters.statusCategory);
  }

  if (filters.doctorId) {
    params.set('doctorId', String(filters.doctorId));
  }

  if (filters.patientId) {
    params.set('patientId', String(filters.patientId));
  }

  return params.toString();
}

async function fetchVisitList(filters: VisitListFilters): Promise<ListVisitsResponse> {
  const response = await fetch(`/api/v1/visits?${buildVisitListParams(filters)}`, {
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Visits');
  }

  return response.json() as Promise<ListVisitsResponse>;
}

export function useVisitsQuery(filters: VisitListFilters) {
  return useQuery({
    queryKey: visitListQueryKey(filters),
    queryFn: () => fetchVisitList(filters),
    placeholderData: keepPreviousData,
  });
}
