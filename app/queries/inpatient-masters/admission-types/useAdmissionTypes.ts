import { useQuery, useSuspenseQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { ListAdmissionTypesResponse } from '@/app/api/v1/admission-types/types';

type AdmissionTypesParams = {
  query?: string;
  page?: number;
  limit?: number;
};

export const ADMISSION_TYPES_KEY = ['admission-types'] as const;

export const admissionTypesQueryKey = (params: AdmissionTypesParams) =>
  [...ADMISSION_TYPES_KEY, params] as const;

async function fetchAdmissionTypes(
  params: AdmissionTypesParams
): Promise<ListAdmissionTypesResponse> {
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

  const url = `/api/v1/admission-types?${searchParams.toString()}`;
  const response = await fetch(url, { credentials: 'same-origin' });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Admission Types');
  }

  return response.json() as Promise<ListAdmissionTypesResponse>;
}

export function useAdmissionTypesQuery(params: AdmissionTypesParams) {
  return useQuery({
    queryKey: admissionTypesQueryKey(params),
    queryFn: () => fetchAdmissionTypes(params),
  });
}

export function useAdmissionTypes(params: AdmissionTypesParams) {
  return useSuspenseQuery({
    queryKey: admissionTypesQueryKey(params),
    queryFn: () => fetchAdmissionTypes(params),
  });
}
