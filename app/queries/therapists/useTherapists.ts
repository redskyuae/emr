import { keepPreviousData, useQuery } from '@tanstack/react-query';

import type { TherapistListParams } from '@/app/api/lib/modules/therapist/schemas/therapist-schema';
import type { ListTherapistsResponse } from '@/app/api/v1/therapists/types';
import { parseApiError } from '@/app/queries/api-error';

export type TherapistListFilters = Omit<TherapistListParams, 'tenantId'> & {
  page: number;
  limit: number;
};

export const therapistsBaseKey = ['therapists'] as const;
export const therapistListQueryKey = (filters: TherapistListFilters) =>
  ['therapists', 'list', filters] as const;

function buildParams(filters: TherapistListFilters) {
  const params = new URLSearchParams({ page: String(filters.page), limit: String(filters.limit) });
  if (filters.query) params.set('query', filters.query);
  if (filters.status) params.set('status', filters.status);
  if (filters.therapistSkillId !== undefined)
    params.set('therapistSkillId', String(filters.therapistSkillId));
  return params.toString();
}

async function fetchTherapists(filters: TherapistListFilters): Promise<ListTherapistsResponse> {
  const response = await fetch(`/api/v1/therapists?${buildParams(filters)}`, {
    credentials: 'same-origin',
  });
  if (!response.ok) throw await parseApiError(response, 'Could not load Therapists');
  return response.json() as Promise<ListTherapistsResponse>;
}

export function useTherapistsQuery(filters: TherapistListFilters, options?: { enabled?: boolean }) {
  return useQuery({
    enabled: options?.enabled,
    queryKey: therapistListQueryKey(filters),
    queryFn: () => fetchTherapists(filters),
    placeholderData: keepPreviousData,
  });
}
