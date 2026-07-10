import { useQuery } from '@tanstack/react-query';

import type { ListDoctorRotasResponse } from '@/app/api/v1/doctor-rotas/types';
import { parseApiError } from '@/app/queries/api-error';

type DoctorRotasParams = {
  page?: number;
  limit?: number;
  query?: string;
};

export const doctorRotasQueryKey = ['doctor-rotas'] as const;

export const doctorRotasParamQueryKey = (params: DoctorRotasParams) =>
  [...doctorRotasQueryKey, params] as const;

async function fetchDoctorRotas(params: DoctorRotasParams): Promise<ListDoctorRotasResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.query) searchParams.set('query', params.query);

  const response = await fetch(`/api/v1/doctor-rotas?${searchParams.toString()}`, {
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Doctor Rotas');
  }

  return response.json() as Promise<ListDoctorRotasResponse>;
}

export function useDoctorRotasQuery(params: DoctorRotasParams) {
  return useQuery({
    queryKey: doctorRotasParamQueryKey(params),
    queryFn: () => fetchDoctorRotas(params),
  });
}
