import { keepPreviousData, useQuery } from '@tanstack/react-query';

import type { ListDoctorsResponse } from '@/app/api/v1/doctors/types';
import type { DoctorStatusFilter } from '@/app/api/lib/modules/doctor/schemas/doctor-schema';
import { parseApiError } from '@/app/queries/api-error';

export type DoctorListFilters = {
  page: number;
  limit: number;
  query?: string;
  status?: DoctorStatusFilter;
  specialtyId?: number;
};

export const doctorsBaseKey = ['doctors'] as const;
export const doctorListQueryKey = (filters: DoctorListFilters) =>
  ['doctors', 'list', filters] as const;

function buildDoctorListParams(filters: DoctorListFilters) {
  const params = new URLSearchParams();
  params.set('page', String(filters.page));
  params.set('limit', String(filters.limit));

  if (filters.query) {
    params.set('query', filters.query);
  }

  if (filters.status) {
    params.set('status', filters.status);
  }

  if (filters.specialtyId !== undefined) {
    params.set('specialtyId', String(filters.specialtyId));
  }

  return params.toString();
}

async function fetchDoctorList(filters: DoctorListFilters): Promise<ListDoctorsResponse> {
  const response = await fetch(`/api/v1/doctors?${buildDoctorListParams(filters)}`, {
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Doctors');
  }

  return response.json() as Promise<ListDoctorsResponse>;
}

export function useDoctorsQuery(filters: DoctorListFilters) {
  return useQuery({
    queryKey: doctorListQueryKey(filters),
    queryFn: () => fetchDoctorList(filters),
    placeholderData: keepPreviousData,
  });
}
