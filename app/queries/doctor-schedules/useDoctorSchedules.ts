import { keepPreviousData, useQuery } from '@tanstack/react-query';

import type { ListDoctorSchedulesResponse } from '@/app/api/v1/doctor-schedules/types';
import { parseApiError } from '@/app/queries/api-error';

export type DoctorScheduleListFilters = {
  page: number;
  limit: number;
  doctorId?: number;
  toDate?: string;
  fromDate?: string;
};

export const doctorSchedulesBaseKey = ['doctor-schedules'] as const;
export const doctorScheduleListQueryKey = (filters: DoctorScheduleListFilters) =>
  ['doctor-schedules', 'list', filters] as const;

function buildDoctorScheduleListParams(filters: DoctorScheduleListFilters) {
  const params = new URLSearchParams();
  params.set('page', String(filters.page));
  params.set('limit', String(filters.limit));

  if (filters.doctorId !== undefined) {
    params.set('doctorId', String(filters.doctorId));
  }

  if (filters.fromDate) {
    params.set('fromDate', filters.fromDate);
  }

  if (filters.toDate) {
    params.set('toDate', filters.toDate);
  }

  return params.toString();
}

async function fetchDoctorSchedules(
  filters: DoctorScheduleListFilters
): Promise<ListDoctorSchedulesResponse> {
  const response = await fetch(
    `/api/v1/doctor-schedules?${buildDoctorScheduleListParams(filters)}`,
    { credentials: 'same-origin' }
  );

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Doctor Schedules');
  }

  return response.json() as Promise<ListDoctorSchedulesResponse>;
}

export function useDoctorSchedulesQuery(filters: DoctorScheduleListFilters) {
  return useQuery({
    queryKey: doctorScheduleListQueryKey(filters),
    queryFn: () => fetchDoctorSchedules(filters),
    placeholderData: keepPreviousData,
  });
}
