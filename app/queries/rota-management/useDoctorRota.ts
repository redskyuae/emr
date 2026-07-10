import { useQuery } from '@tanstack/react-query';

import type { GetDoctorRotaResponse } from '@/app/api/v1/doctor-rotas/[id]/types';
import { parseApiError } from '@/app/queries/api-error';

export const doctorRotaQueryKey = (id: number) => ['doctor-rota', id] as const;

async function fetchDoctorRota(id: number): Promise<GetDoctorRotaResponse> {
  const response = await fetch(`/api/v1/doctor-rotas/${id}`, {
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Doctor Rota');
  }

  return response.json() as Promise<GetDoctorRotaResponse>;
}

export function useDoctorRotaQuery(id: number | null) {
  return useQuery({
    queryKey: id === null ? ['doctor-rota', 'none'] : doctorRotaQueryKey(id),
    queryFn: () => fetchDoctorRota(id ?? 0),
    enabled: id !== null,
    select: (response) => response.data,
  });
}
