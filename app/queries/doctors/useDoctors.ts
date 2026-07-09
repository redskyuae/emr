import { useQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { ListDoctorsResponse } from '@/app/api/v1/doctors/types';

type DoctorsParams = {
  query?: string;
  page?: number;
  limit?: number;
  specialtyId?: number;
  status?: 'active' | 'inactive';
};

export const DOCTORS_KEY = ['doctors'] as const;

export const doctorsQueryKey = (params: DoctorsParams) => [...DOCTORS_KEY, params] as const;

function buildDoctorsParams(params: DoctorsParams) {
  const searchParams = new URLSearchParams();

  if (params.page) {
    searchParams.set('page', String(params.page));
  }

  if (params.limit) {
    searchParams.set('limit', String(params.limit));
  }

  if (params.query) {
    searchParams.set('query', params.query);
  }

  if (params.specialtyId) {
    searchParams.set('specialtyId', String(params.specialtyId));
  }

  if (params.status) {
    searchParams.set('status', params.status);
  }

  return searchParams.toString();
}

async function fetchDoctors(params: DoctorsParams): Promise<ListDoctorsResponse> {
  const response = await fetch(`/api/v1/doctors?${buildDoctorsParams(params)}`, {
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Doctors');
  }

  return response.json() as Promise<ListDoctorsResponse>;
}

export function useDoctorsQuery(params: DoctorsParams) {
  return useQuery({
    queryKey: doctorsQueryKey(params),
    queryFn: () => fetchDoctors(params),
  });
}
