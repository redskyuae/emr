import { keepPreviousData, useQuery } from '@tanstack/react-query';

import type { ListTherapistSchedulesResponse } from '@/app/api/v1/therapist-schedules/types';
import { parseApiError } from '@/app/queries/api-error';

export type TherapistScheduleListFilters = {
  page: number;
  limit: number;
  therapistId?: number;
  toDate?: string;
  fromDate?: string;
};

export const therapistSchedulesBaseKey = ['therapist-schedules'] as const;
export const therapistScheduleListQueryKey = (filters: TherapistScheduleListFilters) =>
  ['therapist-schedules', 'list', filters] as const;

function buildParams(filters: TherapistScheduleListFilters) {
  const params = new URLSearchParams({ page: String(filters.page), limit: String(filters.limit) });
  if (filters.therapistId !== undefined) params.set('therapistId', String(filters.therapistId));
  if (filters.fromDate) params.set('fromDate', filters.fromDate);
  if (filters.toDate) params.set('toDate', filters.toDate);
  return params.toString();
}

async function fetchTherapistSchedules(
  filters: TherapistScheduleListFilters
): Promise<ListTherapistSchedulesResponse> {
  const response = await fetch(`/api/v1/therapist-schedules?${buildParams(filters)}`, {
    credentials: 'same-origin',
  });
  if (!response.ok) throw await parseApiError(response, 'Could not load Therapist Schedules');
  return response.json() as Promise<ListTherapistSchedulesResponse>;
}

export function useTherapistSchedulesQuery(filters: TherapistScheduleListFilters) {
  return useQuery({
    queryKey: therapistScheduleListQueryKey(filters),
    queryFn: () => fetchTherapistSchedules(filters),
    placeholderData: keepPreviousData,
  });
}
